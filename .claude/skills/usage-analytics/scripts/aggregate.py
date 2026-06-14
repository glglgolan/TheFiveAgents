#!/usr/bin/env python3
"""Aggregate OpenAI + OpenRouter usage JSON into a Hebrew Markdown report.

Usage: python3 aggregate.py <openai.json> <openrouter.json> --out <report.md>

Either input file may be missing or contain an error sentinel — the report
will note the gap rather than fail.
"""
import argparse
import json
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


def load(path: str) -> dict | None:
    p = Path(path)
    if not p.exists() or p.stat().st_size == 0:
        return None
    try:
        return json.loads(p.read_text())
    except json.JSONDecodeError:
        return None


def costs_by_day(costs_data: list) -> dict[str, float]:
    out: dict[str, float] = defaultdict(float)
    for bucket in costs_data:
        ts = bucket.get("start_time") or bucket.get("timestamp")
        if not ts:
            continue
        day = datetime.fromtimestamp(int(ts), timezone.utc).strftime("%Y-%m-%d")
        for result in bucket.get("results", []):
            amt = result.get("amount", {})
            out[day] += float(amt.get("value", 0))
    return dict(sorted(out.items()))


def tokens_by_model(completions_data: list) -> dict[str, dict[str, int]]:
    out: dict[str, dict[str, int]] = defaultdict(lambda: {"input": 0, "output": 0, "cached": 0})
    for bucket in completions_data:
        for r in bucket.get("results", []):
            model = r.get("model", "unknown")
            out[model]["input"] += int(r.get("input_tokens", 0))
            out[model]["output"] += int(r.get("output_tokens", 0))
            out[model]["cached"] += int(r.get("input_cached_tokens", 0))
    return dict(out)


def images_by_model(images_data: list) -> dict[str, int]:
    out: dict[str, int] = defaultdict(int)
    for bucket in images_data:
        for r in bucket.get("results", []):
            model = r.get("model", "unknown")
            out[model] += int(r.get("images", r.get("num_images", 0)))
    return dict(out)


def ascii_bar(value: float, max_value: float, width: int = 30) -> str:
    if max_value <= 0:
        return ""
    n = int(round(width * value / max_value))
    return "█" * n + "░" * (width - n)


def render(openai: dict | None, openrouter: dict | None, start: str, end: str) -> str:
    lines = []
    lines.append(f"# דוח שימוש — {start} עד {end}")
    lines.append("")
    lines.append(f"_נוצר ב-{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}_")
    lines.append("")

    # OpenAI section
    lines.append("## OpenAI")
    if not openai:
        lines.append("⚠️ אין נתונים — בדוק שה-OPENAI_ADMIN_KEY מוגדר ב-.env")
    else:
        daily = costs_by_day(openai.get("costs", []))
        total_cost = sum(daily.values())
        lines.append(f"**סך עלות בטווח:** ${total_cost:.2f}")
        lines.append("")

        if daily:
            lines.append("### עלות יומית")
            max_v = max(daily.values()) if daily else 1
            lines.append("| תאריך | $ | |")
            lines.append("|---|---:|---|")
            for day, amt in daily.items():
                lines.append(f"| {day} | ${amt:.4f} | `{ascii_bar(amt, max_v, 24)}` |")
            lines.append("")

        toks = tokens_by_model(openai.get("completions", []))
        if toks:
            lines.append("### Completions לפי מודל")
            lines.append("| מודל | input | output | cached |")
            lines.append("|---|---:|---:|---:|")
            for model, t in sorted(toks.items(), key=lambda x: -(x[1]["input"] + x[1]["output"])):
                lines.append(f"| {model} | {t['input']:,} | {t['output']:,} | {t['cached']:,} |")
            lines.append("")

        imgs = images_by_model(openai.get("images", []))
        if imgs:
            lines.append("### תמונות לפי מודל")
            lines.append("| מודל | תמונות |")
            lines.append("|---|---:|")
            for model, n in sorted(imgs.items(), key=lambda x: -x[1]):
                lines.append(f"| {model} | {n:,} |")
            lines.append("")

    # OpenRouter section
    lines.append("## OpenRouter")
    if not openrouter:
        lines.append("⚠️ אין נתונים — בדוק את OPENROUTER_API_KEY ב-.env")
    else:
        tc = openrouter.get("total_credits", 0)
        tu = openrouter.get("total_usage", 0)
        bal = openrouter.get("balance", tc - tu)
        lines.append(f"- **נטענו לחשבון:** ${tc:.2f}")
        lines.append(f"- **שומש סך הכל:** ${tu:.2f}")
        lines.append(f"- **יתרה נוכחית:** ${bal:.2f}")
        if bal < 5:
            lines.append(f"")
            lines.append(f"⚠️ **יתרה נמוכה** — שווה לטעון לפני הריצה הבאה.")
        lines.append("")

    # Total
    oa_cost = sum(costs_by_day(openai.get("costs", [])).values()) if openai else 0
    or_used = openrouter.get("total_usage", 0) if openrouter else 0
    lines.append("## סך הכל")
    lines.append(f"- OpenAI (בטווח): **${oa_cost:.2f}**")
    lines.append(f"- OpenRouter (lifetime): **${or_used:.2f}**")
    lines.append("")

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Aggregate usage JSON → Hebrew Markdown report")
    parser.add_argument("openai_json", help="Path to OpenAI usage JSON (from get-openai-usage.py)")
    parser.add_argument("openrouter_json", help="Path to OpenRouter usage JSON (from get-openrouter-usage.py)")
    parser.add_argument("--out", required=True, help="Output Markdown file")
    args = parser.parse_args()

    openai = load(args.openai_json)
    openrouter = load(args.openrouter_json)

    start = (openai or {}).get("start_date", "—")
    end = (openai or {}).get("end_date", datetime.now(timezone.utc).strftime("%Y-%m-%d"))

    report = render(openai, openrouter, start, end)
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(report)
    print(f"דוח נשמר: {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
