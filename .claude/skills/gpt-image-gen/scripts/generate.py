#!/usr/bin/env python3
"""Generate an image via OpenAI gpt-image-2 with OpenRouter fallback.

Usage: python3 generate.py "<prompt>" "<output-path>.png"

Reads OPENAI_API_KEY and OPENROUTER_API_KEY from the project .env file.
"""
import base64
import json
import os
import sys
import urllib.error
import urllib.request
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


def call_api(endpoint: str, key: str, model: str, prompt: str) -> dict:
    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "size": "1024x1024",
        "quality": "medium",
        "output_format": "png",
    }).encode()
    req = urllib.request.Request(
        endpoint,
        data=payload,
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.loads(r.read())


def write_image(b64: str, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(base64.b64decode(b64))


def main() -> int:
    if len(sys.argv) < 3:
        print('Usage: generate.py "<prompt>" "<output-path>.png"', file=sys.stderr)
        return 2

    prompt, output = sys.argv[1], Path(sys.argv[2])
    load_env()

    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    openrouter_key = os.environ.get("OPENROUTER_API_KEY", "").strip()

    if openai_key:
        try:
            print("Trying OpenAI (gpt-image-2)...", file=sys.stderr)
            data = call_api(
                "https://api.openai.com/v1/images/generations",
                openai_key,
                "gpt-image-2",
                prompt,
            )
            write_image(data["data"][0]["b64_json"], output)
            print("OK via OpenAI (gpt-image-2)")
            return 0
        except (urllib.error.URLError, KeyError, ValueError) as exc:
            print(f"OpenAI failed: {exc}", file=sys.stderr)

    if openrouter_key:
        try:
            print("Trying OpenRouter (openai/gpt-5.4-image-2)...", file=sys.stderr)
            data = call_api(
                "https://openrouter.ai/api/v1/images/generations",
                openrouter_key,
                "openai/gpt-5.4-image-2",
                prompt,
            )
            write_image(data["data"][0]["b64_json"], output)
            print("OK via OpenRouter (openai/gpt-5.4-image-2)")
            return 0
        except (urllib.error.URLError, KeyError, ValueError) as exc:
            print(f"OpenRouter failed: {exc}", file=sys.stderr)

    print("ERROR: image generation failed on all providers.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
