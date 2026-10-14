#!/usr/bin/env python3
"""Build MiniMax H3 shot prompts from a series_bible.json.

Assembles the six-layer H3 structure (context / timeline / camera / dialogue /
sound / constraints) with the series look string repeated verbatim in every
shot, and enforces H3's 2,000-character API prompt limit.

Usage:
  python3 build_h3_prompt.py <series_bible.json> --scene s03
  python3 build_h3_prompt.py <series_bible.json> --all [--out <dir>]

stdlib only.
"""
import argparse
import json
import sys
from pathlib import Path

H3_PROMPT_LIMIT = 2000
MAX_CAMERA_TAGS = 3


def cast_index(bible):
    return {c["id"]: c for c in bible.get("cast", [])}


def set_index(bible):
    return {s["id"]: s for s in bible.get("sets", [])}


def build(bible, scene):
    """Return (prompt_text, [warnings])."""
    warns = []
    cast, sets = cast_index(bible), set_index(bible)
    lk = bible.get("look", {})
    # video prompts are capped at 2,000 chars — identity comes from the reference
    # frame, so prefer the short forms here and keep the full ones for image prompts
    look = (lk.get("prompt_string_short") or lk.get("prompt_string", "")).strip()
    if not look:
        warns.append("look.prompt_string ריק — כל שוט ייראה אחרת. זו הסיבה מספר 1 לדריפט.")

    tag = scene.get("shot", {}).get("camera_tag", "[Static shot]").strip()
    fmt = bible.get("format", "multi-camera studio sitcom")

    # 1. Context — skip the format label when the look string already says it,
    # every wasted char here is charged against the 2,000-char cap
    fmt_words = {w.strip(".,").lower() for w in fmt.split() if len(w) > 3}
    if fmt_words and fmt_words <= {w.strip(".,").lower() for w in look.split()}:
        parts = [f"{tag} {look}".strip()]
    else:
        parts = [f"{tag} {fmt}. {look}".strip()]
    st = sets.get(scene.get("set"))
    ctx = (st.get("description_short") or st.get("description", "")) if st else ""
    if scene.get("framing"):
        ctx = f"{ctx}. {scene['framing']}" if ctx else scene["framing"]
    # restate each character's fixed traits verbatim — identity lock.
    # In ensemble shots that would blow the 2,000-char cap and the set's
    # line_of_action already encodes who sits where, so use that instead.
    chars = scene.get("characters", [])
    if len(chars) >= 4 and st and st.get("line_of_action"):
        for cid in chars:
            if cid not in cast:
                warns.append(f"הדמות '{cid}' לא קיימת ב-cast של ה-bible.")
        ctx += ". " + st["line_of_action"].rstrip(".")
        chars = []
    for cid in chars:
        c = cast.get(cid)
        if not c:
            warns.append(f"הדמות '{cid}' לא קיימת ב-cast של ה-bible.")
            continue
        if c.get("short"):
            ctx += f". {c['name']}: {c['short']}"
        else:
            ctx += f". {c['name']}: {c['description']}, wearing {c['wardrobe']}"
    if ctx:
        parts.append(ctx.strip(". ") + ".")
    if scene.get("performance"):
        parts.append("Performance: " + scene["performance"].rstrip(".") + ".")

    # 2. Timeline
    tl = scene.get("timeline") or []
    if tl:
        parts.append("Timeline: " + "; ".join(t.strip().rstrip(".") for t in tl) + ".")
    else:
        warns.append(f"[{scene['id']}] אין timeline — H3 מגיב חזק לטווחי שניות מפורשים.")

    # 3. Dialogue
    dlg = scene.get("dialogue") or []
    if dlg:
        lines = ["Dialogue (one speaker at a time):"]
        for d in dlg:
            c = cast.get(d.get("who"), {})
            who = (c.get("name") or d.get("who", "SPEAKER")).upper()
            delivery = d.get("delivery") or c.get("voice") or "natural"
            lines.append(f'  {who}, {delivery}: "{d["line"]}"')
        parts.append("\n".join(lines))
        if len(dlg) > 2 and scene.get("duration", 8) <= 8:
            warns.append(
                f"[{scene['id']}] {len(dlg)} רפליקות ב-{scene.get('duration', 8)}s — "
                "מעל 2 רפליקות ל-8 שניות שובר lip-sync. פצל לשני שוטים."
            )

    # 4. Sound
    bed = bible.get("audio_bed", {})
    sound = ["clear close-mic dialogue"] if dlg else []
    for key in ("ambience", "sfx_prefix"):
        if bed.get(key):
            sound.append(bed[key])
    if scene.get("sfx"):
        sound.append(scene["sfx"])
    if bed.get("laugh") and (scene.get("laugh") or scene.get("beat") in ("punchline", "tag")):
        sound.append(bed["laugh"])
    if bed.get("music"):
        sound.append(bed["music"])
    if sound:
        parts.append("Sound: " + "; ".join(sound) + ".")

    # 5. Constraints
    con = scene.get("constraints") or (
        "faces, hair, wardrobe and set exactly as in the reference frame; camera stays locked"
    )
    parts.append("Keep consistent: " + con.rstrip(".") + ".")

    avoid = list(bible.get("avoid_short") or bible.get("avoid", [])) + list(scene.get("avoid", []))
    if avoid:
        parts.append("Avoid: " + "; ".join(a.rstrip(".") for a in avoid) + ".")

    prompt = "\n".join(parts)

    if len(prompt) > H3_PROMPT_LIMIT:
        warns.append(
            f"[{scene['id']}] הפרומפט {len(prompt)} תווים — מעל מגבלת {H3_PROMPT_LIMIT} של H3. "
            "קצר את look.prompt_string או את תיאורי הדמויות."
        )
    if tag != "[Static shot]" and "locked-off" in look.lower():
        warns.append(
            f"[{scene['id']}] תגית {tag} סותרת את 'locked-off camera' שב-look. "
            "הוסף ל-constraints שהתנועה מכוונת, אחרת H3 יתעלם מאחד מהשניים."
        )
    if prompt.count("[") > MAX_CAMERA_TAGS:
        warns.append(f"[{scene['id']}] יותר מ-{MAX_CAMERA_TAGS} תגיות מצלמה — H3 מתבלבל.")
    d = scene.get("duration", bible.get("default_duration", 8))
    if not 5 <= d <= 15:
        warns.append(f"[{scene['id']}] duration={d}s מחוץ לטווח של H3 (5–15 שניות).")
    return prompt, warns


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("bible", help="path to series_bible.json")
    ap.add_argument("--scene", help="single scene id (e.g. s03)")
    ap.add_argument("--all", action="store_true", help="build every scene")
    ap.add_argument("--out", help="directory to write <id>.txt files into")
    args = ap.parse_args()

    bible = json.loads(Path(args.bible).read_text())
    scenes = bible.get("scenes", [])
    if args.scene:
        scenes = [s for s in scenes if s.get("id") == args.scene]
        if not scenes:
            sys.exit(f"לא נמצאה סצנה '{args.scene}' ב-{args.bible}")
    elif not args.all:
        sys.exit("ציין --scene <id> או --all")

    out_dir = Path(args.out) if args.out else None
    if out_dir:
        out_dir.mkdir(parents=True, exist_ok=True)

    all_warns, total_cost = [], 0.0
    for sc in scenes:
        prompt, warns = build(bible, sc)
        all_warns += warns
        total_cost += sc.get("duration", bible.get("default_duration", 8)) * 0.13
        if out_dir:
            p = out_dir / f"{sc['id']}.txt"
            p.write_text(prompt + "\n")
            print(f"✓ {p}  ({len(prompt)} תווים)")
        else:
            print(f"----- {sc['id']} ({len(prompt)} תווים) -----")
            print(prompt)
            print()

    if all_warns:
        print("\n⚠ אזהרות:", file=sys.stderr)
        for w in all_warns:
            print(f"  - {w}", file=sys.stderr)
    print(f"\nעלות משוערת ל-{len(scenes)} שוטים ב-H3: ~${total_cost:.2f}", file=sys.stderr)


if __name__ == "__main__":
    main()
