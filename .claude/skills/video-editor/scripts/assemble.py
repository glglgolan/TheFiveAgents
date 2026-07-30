#!/usr/bin/env python3
"""Assemble per-scene clips into a finished film from an edit_plan.json.

Pipeline (all via ffmpeg/ffprobe, stdlib only):
  1. normalize   — each clip -> canonical resolution/fps/pixfmt/SAR, with trim + speed applied
  2. xfade chain — smooth transitions between clips (offset math handles the overlap)
  3. audio bed   — voiceover + music mix, optional sidechain ducking + loudnorm + fade
  4. mux/export  — final video fades, H.264 yuv420p, +faststart

See SKILL.md for the plan schema. Usage:
  python3 assemble.py <edit_plan.json> [--dry-run] [--keep-temp] [--work <dir>]
"""
import argparse
import json
import os
import shlex
import subprocess
import sys
import tempfile


def run(cmd, dry=False):
    print("+ " + " ".join(shlex.quote(c) for c in cmd), file=sys.stderr)
    if dry:
        return
    subprocess.run(cmd, check=True)


def probe_duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nk=1:nw=1", path],
        capture_output=True, text=True, check=True).stdout.strip()
    return float(out)


def probe_has_audio(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries",
         "stream=codec_name", "-of", "csv=p=0", path],
        capture_output=True, text=True).stdout.strip()
    return bool(out)


def atempo_chain(factor):
    """ffmpeg atempo supports 0.5..2.0 per instance; chain to reach any factor."""
    if factor <= 0:
        return "atempo=1.0"
    parts = []
    f = factor
    while f > 2.0:
        parts.append("atempo=2.0")
        f /= 2.0
    while f < 0.5:
        parts.append("atempo=0.5")
        f /= 0.5
    parts.append(f"atempo={f:.6f}")
    return ",".join(parts)


def normalize_clip(src, dst, res, fps, trim_start, trim_end, speed, crf, dry=False):
    """Produce a canonical, silent, retimed clip (audio dropped — we build audio separately)."""
    w, h = res.split("x")
    vf = (
        f"scale={w}:{h}:force_original_aspect_ratio=decrease,"
        f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,setsar=1,"
        f"fps={fps},format=yuv420p"
    )
    if speed and abs(speed - 1.0) > 1e-6:
        vf = f"setpts=(PTS-STARTPTS)/{speed:.6f}," + vf
    cmd = ["ffmpeg", "-y"]
    if trim_start:
        cmd += ["-ss", str(trim_start)]
    if trim_end is not None:
        cmd += ["-to", str(trim_end)]
    cmd += ["-i", src, "-an", "-vf", vf,
            "-c:v", "libx264", "-crf", str(crf), "-preset", "medium", dst]
    run(cmd, dry)


def build_xfade(norm_paths, durations, transitions, dst, dry=False):
    """Chain clips with per-boundary xfade. transitions[i] = {type,duration} for boundary i->i+1."""
    if len(norm_paths) == 1:
        run(["ffmpeg", "-y", "-i", norm_paths[0], "-c", "copy", dst], dry)
        return
    inputs = []
    for p in norm_paths:
        inputs += ["-i", p]
    filt = []
    prev = "[0:v]"
    offset = 0.0
    for i in range(len(norm_paths) - 1):
        t = transitions[i] or {}
        ttype = t.get("type", "fade")
        tdur = float(t.get("duration", 0.5))
        # offset = (sum of output durations so far) - this transition length
        offset += durations[i] - tdur
        label = f"[vx{i}]" if i < len(norm_paths) - 2 else "[vout]"
        filt.append(
            f"{prev}[{i+1}:v]xfade=transition={ttype}:duration={tdur:.4f}:"
            f"offset={offset:.4f}{label}"
        )
        prev = label
    cmd = ["ffmpeg", "-y"] + inputs + [
        "-filter_complex", ";".join(filt),
        "-map", "[vout]", "-c:v", "libx264", "-crf", "18", "-preset", "medium", dst]
    run(cmd, dry)


def build_audio(audio, total_dur, dst, dry=False):
    """Mix voiceover + music (optional ducking, loudnorm, fade) into a standalone audio file."""
    vo = audio.get("voiceover")
    music = audio.get("music")
    if not vo and not music:
        return None
    inputs = []
    idx = {}
    if vo:
        idx["vo"] = len(inputs) // 2
        inputs += ["-i", vo]
    if music:
        idx["music"] = len(inputs) // 2
        inputs += ["-i", music]

    vo_gain = float(audio.get("vo_gain_db", 0))
    mus_gain = float(audio.get("music_gain_db", -16))
    duck = bool(audio.get("duck", True)) and vo and music
    loud = bool(audio.get("loudnorm", True))
    fade_out = float(audio.get("audio_fade_out", 0) or 0)

    fc = []
    if vo and music:
        fc.append(f"[{idx['vo']}:a]volume={vo_gain}dB,aresample=48000[vo]")
        fc.append(f"[{idx['music']}:a]volume={mus_gain}dB,aresample=48000[mus]")
        if duck:
            fc.append("[vo]asplit=2[voA][voB]")
            fc.append("[mus][voA]sidechaincompress=threshold=0.03:ratio=8:"
                      "attack=20:release=300[mduck]")
            fc.append("[mduck][voB]amix=inputs=2:duration=first:dropout_transition=0[mix]")
        else:
            fc.append("[mus][vo]amix=inputs=2:duration=first:dropout_transition=0[mix]")
        last = "mix"
    elif vo:
        fc.append(f"[{idx['vo']}:a]volume={vo_gain}dB,aresample=48000[mix]")
        last = "mix"
    else:
        fc.append(f"[{idx['music']}:a]volume={mus_gain}dB,aresample=48000[mix]")
        last = "mix"

    tail = []
    if loud:
        tail.append("loudnorm=I=-16:TP=-1.5:LRA=11")
    if fade_out > 0:
        st = max(0.0, total_dur - fade_out)
        tail.append(f"afade=t=out:st={st:.3f}:d={fade_out}")
    if tail:
        fc.append(f"[{last}]" + ",".join(tail) + "[aout]")
        outlabel = "aout"
    else:
        outlabel = last

    cmd = ["ffmpeg", "-y"] + inputs + [
        "-filter_complex", ";".join(fc),
        "-map", f"[{outlabel}]", "-c:a", "aac", "-b:a", "192k", dst]
    run(cmd, dry)
    return dst


def finalize(video_src, audio_src, out, fade_in, fade_out, total_dur, export, dry=False):
    vf = []
    if fade_in and fade_in > 0:
        vf.append(f"fade=t=in:st=0:d={fade_in}")
    if fade_out and fade_out > 0:
        st = max(0.0, total_dur - fade_out)
        vf.append(f"fade=t=out:st={st:.3f}:d={fade_out}")
    codec = export.get("codec", "libx264")
    crf = str(export.get("crf", 18))
    preset = export.get("preset", "slow")

    cmd = ["ffmpeg", "-y", "-i", video_src]
    if audio_src:
        cmd += ["-i", audio_src]
    if vf:
        cmd += ["-vf", ",".join(vf), "-c:v", codec, "-crf", crf, "-preset", preset]
    else:
        cmd += ["-c:v", codec, "-crf", crf, "-preset", preset]
    if audio_src:
        cmd += ["-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "192k", "-shortest"]
    else:
        cmd += ["-an"]
    cmd += ["-movflags", "+faststart", out]
    run(cmd, dry)


def main():
    ap = argparse.ArgumentParser(description="Assemble clips into a finished film from an edit plan")
    ap.add_argument("plan")
    ap.add_argument("--dry-run", action="store_true", help="print ffmpeg commands, don't run")
    ap.add_argument("--keep-temp", action="store_true")
    ap.add_argument("--work", help="working dir for temp files (default: a temp dir)")
    args = ap.parse_args()

    with open(args.plan, encoding="utf-8") as f:
        plan = json.load(f)

    out = plan["output"]
    res = plan.get("resolution", "1280x720")
    fps = plan.get("fps", 24)
    clips = plan["clips"]
    if not clips:
        print("ERROR: plan has no clips", file=sys.stderr)
        return 2
    export = plan.get("export", {})
    crf_norm = export.get("crf", 18)

    work = args.work or tempfile.mkdtemp(prefix="video-editor-")
    os.makedirs(work, exist_ok=True)
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)

    # --- fit_to_audio: compute a uniform extra speed factor so film length == voiceover length ---
    extra_speed = 1.0
    audio = plan.get("audio") or {}
    vo = audio.get("voiceover")
    if plan.get("fit_to_audio") and vo and not args.dry_run:
        sum_dur = 0.0
        for c in clips:
            d = probe_duration(c["src"])
            ts = float(c.get("trim_start", 0) or 0)
            te = c.get("trim_end")
            d = (float(te) if te is not None else d) - ts
            sum_dur += d / float(c.get("speed", 1.0) or 1.0)
        sum_trans = sum(float((c.get("transition") or {}).get("duration", 0.5))
                        for c in clips[:-1])
        vdur = probe_duration(vo)
        target = vdur + sum_trans
        if target > 0:
            extra_speed = sum_dur / target
            print(f"[fit_to_audio] voiceover={vdur:.2f}s  film_needs speed×{extra_speed:.3f}",
                  file=sys.stderr)

    # --- 1) normalize each clip ---
    norm_paths, durations = [], []
    for i, c in enumerate(clips):
        dst = os.path.join(work, f"norm_{i:02d}.mp4")
        speed = float(c.get("speed", 1.0) or 1.0) * extra_speed
        normalize_clip(c["src"], dst, res, fps,
                       c.get("trim_start", 0), c.get("trim_end"),
                       speed, crf_norm, dry=args.dry_run)
        norm_paths.append(dst)
        durations.append(probe_duration(dst) if not args.dry_run else 5.0)

    transitions = [c.get("transition") for c in clips[:-1]]
    total_video = sum(durations) - sum(float((t or {}).get("duration", 0.5)) for t in transitions)
    print(f"[assemble] {len(clips)} clips -> ~{total_video:.1f}s film", file=sys.stderr)

    # --- 2) xfade chain ---
    seq = os.path.join(work, "sequence.mp4")
    build_xfade(norm_paths, durations, transitions, seq, dry=args.dry_run)

    # --- 3) audio bed ---
    audio_file = None
    if audio:
        audio_file = os.path.join(work, "audio.m4a")
        audio_file = build_audio(audio, total_video, audio_file, dry=args.dry_run)

    # --- 4) finalize ---
    finalize(seq, audio_file, out,
             plan.get("video_fade_in", 0), plan.get("video_fade_out", 0),
             total_video, export, dry=args.dry_run)

    if not args.keep_temp and not args.dry_run:
        for p in norm_paths + [seq] + ([audio_file] if audio_file else []):
            try:
                os.remove(p)
            except OSError:
                pass
    print(f"[done] {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
