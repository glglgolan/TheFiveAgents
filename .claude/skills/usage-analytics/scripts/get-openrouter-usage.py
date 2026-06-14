#!/usr/bin/env python3
"""Fetch OpenRouter credits and usage.

Usage: python3 get-openrouter-usage.py [--out <file>]

Outputs JSON: {"total_credits": float, "total_usage": float, "balance": float, "fetched_at": "..."}
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[3]


def load_env() -> None:
    env_path = PROJECT_ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


def fetch_credits(key: str) -> dict:
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/credits",
        headers={"Authorization": f"Bearer {key}"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch OpenRouter credits")
    parser.add_argument("--out", help="Optional output file (default: stdout)")
    args = parser.parse_args()

    load_env()
    key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if not key:
        print("שגיאה: חסר OPENROUTER_API_KEY ב-.env", file=sys.stderr)
        return 1

    try:
        raw = fetch_credits(key)
    except urllib.error.HTTPError as exc:
        print(f"שגיאה: OpenRouter החזיר HTTP {exc.code} — {exc.read().decode(errors='replace')}", file=sys.stderr)
        return 1
    except urllib.error.URLError as exc:
        print(f"שגיאה ברשת: {exc}", file=sys.stderr)
        return 1

    data = raw.get("data", raw)
    total_credits = float(data.get("total_credits", 0))
    total_usage = float(data.get("total_usage", 0))
    result = {
        "provider": "openrouter",
        "total_credits": total_credits,
        "total_usage": total_usage,
        "balance": round(total_credits - total_usage, 4),
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }

    out = json.dumps(result, ensure_ascii=False, indent=2)
    if args.out:
        Path(args.out).write_text(out)
    else:
        print(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
