#!/usr/bin/env python3
"""Generate or edit an image via the Google Gemini Interactions API (Nano Banana),
with an OpenRouter fallback.

Usage:
  python3 generate.py "<prompt>" "<output-path>.png" [--size WxH] [--reference <path>]
                       [--model <model>] [--quality low|medium|high|auto] [--light]

Modes:
  - No --reference: text-to-image.
  - With --reference (repeatable, up to ~14 per Google's own example): image-to-image /
    multi-image blending for character consistency — the FIRST reference is the scene/
    composition anchor, later ones are additional identity refs (e.g. solo face photos).

Models (Interactions API, generally available):
  - gemini-3.1-flash-image      (default — "Nano Banana 2", generalist workhorse)
  - gemini-3.1-flash-lite-image (fastest/cheapest, 1K max)
  - gemini-3-pro-image          ("Nano Banana Pro" — highest quality)
  - gemini-2.5-flash-image      (legacy "Nano Banana")

Quality / cost:
  --quality low|medium|high (default medium) maps to image_size 512px/1K/2K.
  --light is shorthand for --quality low (cheapest render, good for drafts).

Reads GEMINI_API_KEY (or GOOGLE_API_KEY) and OPENROUTER_API_KEY from the project .env file.
"""
import argparse
import base64
import io
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[3]

DEFAULT_MODEL = "gemini-3.1-flash-image"

# aspect_ratio values supported by the Interactions API's response_format
SUPPORTED_RATIOS = {
    "1:1": 1.0, "3:2": 1.5, "2:3": 2 / 3, "3:4": 0.75, "4:3": 4 / 3,
    "4:5": 0.8, "5:4": 1.25, "9:16": 9 / 16, "16:9": 16 / 9, "21:9": 21 / 9,
}

QUALITY_TO_IMAGE_SIZE = {"low": "512", "medium": "1K", "high": "2K", "auto": None}


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


def nearest_aspect_ratio(size: str) -> str:
    try:
        w, h = (int(x) for x in size.lower().split("x"))
        ratio = w / h if h else 1.0
    except ValueError:
        return "1:1"
    return min(SUPPORTED_RATIOS, key=lambda k: abs(SUPPORTED_RATIOS[k] - ratio))


def image_to_input_part(path: Path) -> dict:
    mime = mimetypes.guess_type(str(path))[0] or "image/png"
    data = base64.b64encode(path.read_bytes()).decode()
    return {"type": "image", "mime_type": mime, "data": data}


def build_body(model: str, prompt: str, references: list[Path], aspect_ratio: str, image_size: str | None) -> dict:
    input_parts = [{"type": "text", "text": prompt}]
    input_parts.extend(image_to_input_part(p) for p in references)
    # The Interactions API only accepts image/jpeg for response_format.mime_type (verified: image/png
    # returns HTTP 400 "not supported"). We convert to PNG on write so callers still get real PNGs.
    response_format = {"type": "image", "mime_type": "image/jpeg", "aspect_ratio": aspect_ratio}
    if image_size:
        response_format["image_size"] = image_size
    return {"model": model, "input": input_parts, "response_format": response_format}


def call_gemini(prompt: str, key: str, model: str, references: list[Path],
                 aspect_ratio: str, image_size: str | None) -> bytes:
    body = build_body(model, prompt, references, aspect_ratio, image_size)
    req = urllib.request.Request(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        data=json.dumps(body).encode(),
        headers={"x-goog-api-key": key, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=420) as r:
        data = json.loads(r.read())
    return extract_image_b64(data)


def extract_image_b64(data: dict) -> bytes:
    """Handle both the simple `output_image` shape and the interleaved `steps[]` shape."""
    b64 = None
    if "output_image" in data and data["output_image"]:
        b64 = data["output_image"].get("data")
    if not b64:
        for step in data.get("steps", []):
            if step.get("type") != "model_output":
                continue
            for block in step.get("content", []):
                if block.get("type") == "image" and block.get("data"):
                    b64 = block["data"]
                    break
            if b64:
                break
    if not b64:
        raise ValueError(f"no image data found in response: {json.dumps(data)[:500]}")
    return base64.b64decode(b64)


def call_openrouter(prompt: str, key: str, model: str, references: list[Path]) -> bytes:
    or_model = model if "/" in model else f"google/{model}"
    content = [{"type": "text", "text": prompt}]
    for p in references:
        mime = mimetypes.guess_type(str(p))[0] or "image/png"
        data = base64.b64encode(p.read_bytes()).decode()
        content.append({"type": "image_url", "image_url": {"url": f"data:{mime};base64,{data}"}})
    body = {"model": or_model, "messages": [{"role": "user", "content": content}], "modalities": ["image", "text"]}
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=420) as r:
        data = json.loads(r.read())
    images = data["choices"][0]["message"].get("images") or []
    if not images:
        raise ValueError(f"no image in OpenRouter response: {json.dumps(data)[:500]}")
    url = images[0]["image_url"]["url"]  # data:image/png;base64,....
    return base64.b64decode(url.split(",", 1)[1])


def write_image(raw: bytes, output: Path) -> None:
    """The API returns JPEG (its only supported response_format). Re-encode as real PNG
    regardless of source format, so the rest of the pipeline gets what it expects."""
    output.parent.mkdir(parents=True, exist_ok=True)
    img = Image.open(io.BytesIO(raw))
    img.save(output, format="PNG")


def read_error(exc: urllib.error.HTTPError) -> str:
    try:
        return exc.read().decode(errors="replace")
    except Exception:
        return str(exc)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate or edit images via the Gemini Interactions API (Nano Banana)")
    parser.add_argument("prompt", help="Image prompt (for text-to-image) or edit/blend instruction (with --reference)")
    parser.add_argument("output", help="Output PNG file path")
    parser.add_argument("--size", default="1024x1024", help="WxH — mapped to the nearest supported aspect_ratio")
    parser.add_argument("--reference", action="append",
                        help="Reference image path — enables image editing / multi-image blending. "
                             "Repeatable (first = scene/composition anchor, rest = identity/face refs)")
    parser.add_argument("--model", default=DEFAULT_MODEL,
                        help=f"Override model (default {DEFAULT_MODEL}). "
                             "Other options: gemini-3.1-flash-lite-image, gemini-3-pro-image, gemini-2.5-flash-image")
    parser.add_argument("--quality", choices=["low", "medium", "high", "auto"], default="medium",
                        help="Render quality / cost, maps to image_size 512px/1K/2K (default medium=1K)")
    parser.add_argument("--light", action="store_true",
                        help="Light mode — shorthand for --quality low (cheapest render, good for drafts)")

    args = parser.parse_args()
    quality = "low" if args.light else args.quality
    image_size = QUALITY_TO_IMAGE_SIZE[quality]
    output = Path(args.output)
    load_env()

    ref_paths: list[Path] = []
    if args.reference:
        ref_paths = [Path(r) for r in args.reference]
        missing = [p for p in ref_paths if not p.exists()]
        if missing:
            for p in missing:
                print(f"ERROR: reference image not found: {p}", file=sys.stderr)
            return 2

    aspect_ratio = nearest_aspect_ratio(args.size)

    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip() or os.environ.get("GOOGLE_API_KEY", "").strip()
    openrouter_key = os.environ.get("OPENROUTER_API_KEY", "").strip()

    nref = f", refs={len(ref_paths)}" if ref_paths else ""

    if gemini_key:
        try:
            print(f"Trying Gemini ({args.model}, aspect_ratio={aspect_ratio}, "
                  f"image_size={image_size or 'default'}{nref})...", file=sys.stderr)
            raw = call_gemini(args.prompt, gemini_key, args.model, ref_paths, aspect_ratio, image_size)
            write_image(raw, output)
            print(f"OK via Gemini ({args.model})")
            return 0
        except urllib.error.HTTPError as exc:
            print(f"Gemini failed: HTTP {exc.code} — {read_error(exc)}", file=sys.stderr)
        except (urllib.error.URLError, KeyError, ValueError) as exc:
            print(f"Gemini failed: {exc}", file=sys.stderr)
    else:
        print("GEMINI_API_KEY / GOOGLE_API_KEY not set — skipping direct Gemini call.", file=sys.stderr)

    if openrouter_key:
        try:
            print(f"Trying OpenRouter ({args.model}{nref})...", file=sys.stderr)
            raw = call_openrouter(args.prompt, openrouter_key, args.model, ref_paths)
            write_image(raw, output)
            print(f"OK via OpenRouter (google/{args.model})")
            return 0
        except urllib.error.HTTPError as exc:
            print(f"OpenRouter failed: HTTP {exc.code} — {read_error(exc)}", file=sys.stderr)
        except (urllib.error.URLError, KeyError, ValueError) as exc:
            print(f"OpenRouter failed: {exc}", file=sys.stderr)

    print("ERROR: image generation failed on all providers.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
