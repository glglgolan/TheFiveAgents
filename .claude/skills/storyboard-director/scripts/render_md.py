#!/usr/bin/env python3
"""Render a storyboard.json into a Hebrew Markdown table (storyboard.md).

stdlib only — no external deps (matches gpt-image-gen / openrouter-video-gen).

Usage:
    python3 render_md.py <storyboard.json> [output.md]

If output.md is omitted, writes a sibling storyboard.md next to the input,
and also prints the Markdown to stdout.
"""
import json
import sys
import os


def cell(value):
    """Flatten a value into a single-line Markdown table cell."""
    if value is None:
        return "—"
    if isinstance(value, list):
        return ", ".join(str(v) for v in value) if value else "—"
    return str(value).replace("\n", " ").replace("|", "\\|").strip() or "—"


def shot_str(shot):
    if not isinstance(shot, dict):
        return "—"
    parts = [shot.get("type"), shot.get("angle"), shot.get("camera_move")]
    parts = [p for p in parts if p]
    return " · ".join(parts) if parts else "—"


def render(sb):
    lines = []
    lines.append(f"# סטוריבורד: {sb.get('title', sb.get('project', '—'))}")
    lines.append("")
    if sb.get("logline"):
        lines.append(f"> {sb['logline']}")
        lines.append("")
    lines.append(f"**פרויקט:** {sb.get('project', '—')} · "
                 f"**יחס תצוגה:** {sb.get('aspect_ratio', '16:9')} · "
                 f"**שפה:** {sb.get('language', 'he')}")
    lines.append("")

    vt = sb.get("visual_theme", {})
    if vt:
        lines.append("## לוק ויזואלי משותף")
        lines.append("")
        for key, label in (("palette", "פלטה"), ("lighting", "תאורה"),
                           ("film_look", "מראה פילם"), ("motion", "תנועה"),
                           ("mood", "אווירה")):
            if vt.get(key):
                lines.append(f"- **{label}:** {vt[key]}")
        lines.append("")

    cast = sb.get("cast", [])
    if cast:
        lines.append("## Cast — עוגני דמויות")
        lines.append("")
        lines.append("| id | שם | תיאור | תמונת עוגן | מוכן |")
        lines.append("|----|-----|-------|------------|------|")
        for c in cast:
            ready = "✓" if c.get("anchor_ready") else "—"
            lines.append(f"| {cell(c.get('id'))} | {cell(c.get('name'))} | "
                         f"{cell(c.get('description'))} | {cell(c.get('anchor_image'))} | {ready} |")
        lines.append("")

    lines.append("## סצנות")
    lines.append("")
    lines.append("| # | כותרת | משך | תיאור | דמויות | שוט | image_prompt | video_prompt | reference |")
    lines.append("|---|--------|-----|-------|--------|-----|--------------|--------------|-----------|")
    for sc in sb.get("scenes", []):
        lines.append(
            f"| {cell(sc.get('scene_number'))} "
            f"| {cell(sc.get('title'))} "
            f"| {cell(sc.get('duration_sec', 5))}s "
            f"| {cell(sc.get('description'))} "
            f"| {cell(sc.get('characters'))} "
            f"| {shot_str(sc.get('shot'))} "
            f"| {cell(sc.get('image_prompt'))} "
            f"| {cell(sc.get('video_prompt'))} "
            f"| {cell(sc.get('reference'))} |"
        )
    lines.append("")
    return "\n".join(lines)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    src = sys.argv[1]
    with open(src, encoding="utf-8") as f:
        sb = json.load(f)
    md = render(sb)
    dst = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
        os.path.dirname(os.path.abspath(src)), "storyboard.md")
    with open(dst, "w", encoding="utf-8") as f:
        f.write(md + "\n")
    print(md)
    print(f"\n[written] {dst}", file=sys.stderr)


if __name__ == "__main__":
    main()
