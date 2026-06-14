#!/usr/bin/env python3
"""Fetch OpenAI usage and costs from the Administration API.

Usage: python3 get-openai-usage.py --start-date YYYY-MM-DD [--end-date YYYY-MM-DD] [--out <file>]

Requires OPENAI_ADMIN_KEY in .env (sk-admin-...) — the project key cannot access /organization/usage.

Outputs JSON with two top-level keys: "usage_by_model" (token + image counts) and "costs_by_day" (USD).
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[3]

BASE = "https://api.openai.com/v1/organization"


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


def to_unix(date_str: str) -> int:
    return int(datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc).timestamp())


def http_get(url: str, key: str) -> dict:
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def fetch_paginated(base_url: str, params: dict, key: str) -> list:
    """Follow next_page tokens until exhausted."""
    out = []
    while True:
        url = f"{base_url}?{urllib.parse.urlencode(params)}"
        resp = http_get(url, key)
        out.extend(resp.get("data", []))
        nxt = resp.get("next_page")
        if not nxt or nxt == params.get("page"):
            break
        params["page"] = nxt
    return out


def fetch_usage(endpoint: str, key: str, start: int, end: int, bucket: str = "1d", group_by: list[str] | None = None) -> list:
    params: dict = {
        "start_time": start,
        "end_time": end,
        "bucket_width": bucket,
        "limit": 31,
    }
    if group_by:
        params["group_by"] = ",".join(group_by)
    return fetch_paginated(f"{BASE}/usage/{endpoint}", params, key)


def fetch_costs(key: str, start: int, end: int) -> list:
    params: dict = {"start_time": start, "end_time": end, "bucket_width": "1d", "limit": 31}
    return fetch_paginated(f"{BASE}/costs", params, key)


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch OpenAI org usage + costs")
    parser.add_argument("--start-date", required=True, help="YYYY-MM-DD (inclusive)")
    parser.add_argument("--end-date", help="YYYY-MM-DD (exclusive). Defaults to today.")
    parser.add_argument("--out", help="Optional output file")
    args = parser.parse_args()

    load_env()
    key = os.environ.get("OPENAI_ADMIN_KEY", "").strip()
    if not key:
        print("שגיאה: חסר OPENAI_ADMIN_KEY ב-.env (sk-admin-...). השג מ-platform.openai.com/admin", file=sys.stderr)
        return 1

    start = to_unix(args.start_date)
    end_date = args.end_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    end = to_unix(end_date)

    result: dict = {
        "provider": "openai",
        "start_date": args.start_date,
        "end_date": end_date,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        result["completions"] = fetch_usage("completions", key, start, end, group_by=["model"])
        result["images"] = fetch_usage("images", key, start, end, group_by=["model", "size"])
        result["embeddings"] = fetch_usage("embeddings", key, start, end, group_by=["model"])
        result["costs"] = fetch_costs(key, start, end)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode(errors="replace")
        print(f"שגיאה: OpenAI החזיר HTTP {exc.code} — {body}", file=sys.stderr)
        return 1
    except urllib.error.URLError as exc:
        print(f"שגיאה ברשת: {exc}", file=sys.stderr)
        return 1

    out = json.dumps(result, ensure_ascii=False, indent=2)
    if args.out:
        Path(args.out).write_text(out)
    else:
        print(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
