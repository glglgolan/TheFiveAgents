"""Final mix: dialogue + music + sfx -> public/audio/mix.wav (48 kHz stereo, -14 LUFS, -1 dBTP).
Music is ducked under dialogue with a smoothed sidechain envelope. Pure numpy/scipy + ffmpeg loudnorm.
Usage: python audio/mix.py [--music-db -3] [--sfx-db 0] [--dlg-db 2]
"""
import argparse, json, subprocess, pathlib
import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly
import imageio_ffmpeg

ROOT = pathlib.Path(__file__).resolve().parents[1]
SR, N = 48000, 48000 * 60
FF = imageio_ffmpeg.get_ffmpeg_exe()


def load(name):
    p = ROOT / 'public' / 'audio' / name
    if not p.exists():
        print(f'  (missing {name}, using silence)')
        return np.zeros((N, 2), np.float32)
    sr, raw = wavfile.read(p)
    x = raw.astype(np.float32)
    if np.issubdtype(raw.dtype, np.integer):
        x /= np.iinfo(raw.dtype).max
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    if sr != SR:
        x = resample_poly(x, SR, sr, axis=0).astype(np.float32)
    out = np.zeros((N, 2), np.float32)
    out[: min(N, len(x))] = x[:N]
    return out


def envelope(x, attack_ms=15, release_ms=250):
    mono = np.abs(x).max(1)
    a = np.exp(-1 / (SR * attack_ms / 1000)); r = np.exp(-1 / (SR * release_ms / 1000))
    env = np.zeros_like(mono); e = 0.0
    # decimate for speed, then upsample
    step = 48
    m = mono[: len(mono) // step * step].reshape(-1, step).max(1)
    ea, er = a ** step, r ** step
    out = np.zeros_like(m)
    for i, v in enumerate(m):
        e = ea * e + (1 - ea) * v if v > e else er * e + (1 - er) * v
        out[i] = e
    env[: len(out) * step] = np.repeat(out, step)
    return env


def db(v):
    return 10 ** (v / 20)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--music-db', type=float, default=-4)
    ap.add_argument('--sfx-db', type=float, default=-1)
    ap.add_argument('--dlg-db', type=float, default=2)
    ap.add_argument('--duck-db', type=float, default=-9)
    a = ap.parse_args()
    dlg, mus, sfx = load('dialogue.wav'), load('music.wav'), load('sfx.wav')
    env = envelope(dlg)
    thr = 0.02
    duck = np.clip(env / thr, 0, 1)  # 0..1 dialogue presence
    gain = db(a.duck_db) ** duck      # 1 -> duck_db
    mix = dlg * db(a.dlg_db) + mus * db(a.music_db) * gain[:, None] + sfx * db(a.sfx_db) * (0.6 + 0.4 * gain[:, None])
    mix[-int(SR * 4 / 24):] *= np.linspace(1, 0, int(SR * 4 / 24))[:, None] ** 2  # last 4 frames to black
    tmp = ROOT / 'audio' / '_premix.wav'
    wavfile.write(tmp, SR, np.clip(mix, -1, 1).astype(np.float32))
    # two-pass loudnorm
    r = subprocess.run([FF, '-hide_banner', '-i', str(tmp), '-af', 'loudnorm=I=-14:TP=-1:LRA=11:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True)
    blk = r.stderr[r.stderr.rfind('{'):]
    j = json.loads(blk[: blk.find('}') + 1])
    out = ROOT / 'public' / 'audio' / 'mix.wav'
    af = (f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
          f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    subprocess.run([FF, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(tmp), '-af', af, '-ar', str(SR), '-c:a', 'pcm_s16le', str(out)], check=True)
    tmp.unlink()
    (ROOT / 'src' / 'data' / 'audio_status.json').write_text(json.dumps({'mixReady': True}))
    print('mix ->', out, '| pre-norm measured', j['input_i'], 'LUFS', j['input_tp'], 'dBTP')


if __name__ == '__main__':
    main()
