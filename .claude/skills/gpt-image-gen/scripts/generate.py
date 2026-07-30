#!/usr/bin/env python3
"""Generate or edit an image via OpenAI Images API with OpenRouter fallback.

Usage:
  python3 generate.py "<prompt>" "<output-path>.png" [--size WxH] [--reference <path>] [--model <model>]

Modes:
  - No --reference: text-to-image via /v1/images/generations (default model: gpt-image-2)
  - With --reference: image-to-image via /v1/images/edits (default model: gpt-image-1.5,
    which supports input_fidelity:high for reference/face matching)

Multiple references:
  --reference may be repeated (the /edits endpoint accepts up to 16 image[] files).
  Order matters: the FIRST reference is the scene/composition anchor; the following
  ones are identity refs (e.g. solo face photos) used to lock additional characters
  in a single call — often removing the need for a face-swap + restyle pass.

Quality / token cost:
  --quality low|medium|high (default medium). --light is shorthand for --quality low
  ("light tokens" mode — cheapest render, good for drafts).

Note: gpt-image-2 does NOT support input_fidelity. If a gpt-image-2* model is used in
edits mode, input_fidelity is dropped automatically (the API rejects it otherwise).

Reads OPENAI_API_KEY and OPENROUTER_API_KEY from the project .env file.
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
import uuid
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[3]

EDITS_SIZES = {"1024x1024", "1536x1024", "1024x1536"}

# Models that do NOT accept the input_fidelity parameter in edits mode.
NO_INPUT_FIDELITY = ("gpt-image-2",)


def supports_input_fidelity(model: str) -> bool:
    base = model.split("/")[-1]  # strip any "openai/" prefix
    return not base.startswith(NO_INPUT_FIDELITY)


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


def map_size_for_edits(size: str) -> str:
    """Map an arbitrary WxH to one of the three sizes supported by /edits."""
    if size in EDITS_SIZES:
        return size
    try:
        w, h = (int(x) for x in size.lower().split("x"))
    except ValueError:
        return "1024x1024"
    ratio = w / h if h else 1.0
    if 0.92 <= ratio <= 1.08:
        mapped = "1024x1024"
    elif ratio > 1.08:
        mapped = "1536x1024"
    else:
        mapped = "1024x1536"
    print(f"auto-mapped {size} → {mapped} (edits endpoint size constraint)", file=sys.stderr)
    return mapped


def call_generations(endpoint: str, key: str, model: str, prompt: str, size: str, quality: str) -> dict:
    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "size": size,
        "quality": quality,
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


def build_multipart(fields: dict[str, str], files: list[tuple[str, Path]]) -> tuple[bytes, str]:
    """Build a multipart/form-data body. files is list of (field_name, path)."""
    boundary = f"----gpt-image-gen-{uuid.uuid4().hex}"
    buf = io.BytesIO()

    def write(s: str) -> None:
        buf.write(s.encode())

    for name, value in fields.items():
        write(f"--{boundary}\r\n")
        write(f'Content-Disposition: form-data; name="{name}"\r\n\r\n')
        write(f"{value}\r\n")

    for field_name, path in files:
        mime = mimetypes.guess_type(str(path))[0] or "image/png"
        write(f"--{boundary}\r\n")
        write(f'Content-Disposition: form-data; name="{field_name}"; filename="{path.name}"\r\n')
        write(f"Content-Type: {mime}\r\n\r\n")
        buf.write(path.read_bytes())
        write("\r\n")

    write(f"--{boundary}--\r\n")
    return buf.getvalue(), boundary


def call_edits(endpoint: str, key: str, model: str, prompt: str, size: str, quality: str,
               references: list[Path]) -> dict:
    fields = {
        "model": model,
        "prompt": prompt,
        "size": size,
        "quality": quality,
        "output_format": "png",
    }
    if supports_input_fidelity(model):
        fields["input_fidelity"] = "high"
    body, boundary = build_multipart(fields, [("image[]", p) for p in references])
    req = urllib.request.Request(
        endpoint,
        data=body,
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )
    with urllib.request.urlopen(req, timeout=240) as r:
        return json.loads(r.read())


def write_image(b64: str, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(base64.b64decode(b64))


def read_error(exc: urllib.error.HTTPError) -> str:
    try:
        return exc.read().decode(errors="replace")
    except Exception:
        return str(exc)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate or edit images via OpenAI gpt-image models")
    parser.add_argument("prompt", help="Image prompt (for generations) or edit description (for edits)")
    parser.add_argument("output", help="Output PNG file path")
    parser.add_argument("--size", default="1024x1024", help="WxH (default 1024x1024). Edits auto-maps to {1024x1024,1536x1024,1024x1536}")
    parser.add_argument("--reference", action="append",
                        help="Reference image path → switches to /v1/images/edits. "
                             "Repeatable (first = scene/composition anchor, rest = identity/face refs)")
    parser.add_argument("--model", help="Override model. Default: gpt-image-1.5 with reference, gpt-image-2 without")
    parser.add_argument("--quality", choices=["low", "medium", "high", "auto"], default="medium",
                        help="Render quality / token cost (default medium)")
    parser.add_argument("--light", action="store_true",
                        help="Light tokens mode — shorthand for --quality low (cheapest render)")

    args = parser.parse_args()
    quality = "low" if args.light else args.quality
    output = Path(args.output)
    load_env()

    has_ref = bool(args.reference)
    model = args.model or ("gpt-image-1.5" if has_ref else "gpt-image-2")
    size = map_size_for_edits(args.size) if has_ref else args.size

    if has_ref:
        ref_paths = [Path(r) for r in args.reference]
        missing = [p for p in ref_paths if not p.exists()]
        if missing:
            for p in missing:
                print(f"ERROR: reference image not found: {p}", file=sys.stderr)
            return 2
        if len(ref_paths) > 5:
            print(f"WARNING: {len(ref_paths)} references — each one adds input tokens "
                  "(input_fidelity processes every reference at high res)", file=sys.stderr)

    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    openrouter_key = os.environ.get("OPENROUTER_API_KEY", "").strip()

    providers = []
    if openai_key:
        providers.append(("OpenAI", "https://api.openai.com/v1", openai_key, model))
    if openrouter_key:
        or_model = model if "/" in model else f"openai/{model}"
        providers.append(("OpenRouter", "https://openrouter.ai/api/v1", openrouter_key, or_model))

    for label, base, key, mdl in providers:
        try:
            if has_ref:
                fid = " +input_fidelity" if supports_input_fidelity(mdl) else " (no input_fidelity)"
                nref = f", refs={len(ref_paths)}" if len(ref_paths) > 1 else ""
                print(f"Trying {label} ({mdl}, edits, size={size}, quality={quality}{fid}{nref})...", file=sys.stderr)
                data = call_edits(f"{base}/images/edits", key, mdl, args.prompt, size, quality, ref_paths)
            else:
                print(f"Trying {label} ({mdl}, generations, size={size}, quality={quality})...", file=sys.stderr)
                data = call_generations(f"{base}/images/generations", key, mdl, args.prompt, size, quality)
            write_image(data["data"][0]["b64_json"], output)
            usage = data.get("usage") or {}
            if usage:
                print(f"OK via {label} ({mdl}, quality={quality}) — "
                      f"tokens: {usage.get('total_tokens', '?')} total "
                      f"({usage.get('input_tokens', '?')} in / {usage.get('output_tokens', '?')} out)")
            else:
                print(f"OK via {label} ({mdl}, quality={quality})")
            return 0
        except urllib.error.HTTPError as exc:
            print(f"{label} failed: HTTP {exc.code} — {read_error(exc)}", file=sys.stderr)
        except (urllib.error.URLError, KeyError, ValueError) as exc:
            print(f"{label} failed: {exc}", file=sys.stderr)

    print("ERROR: image generation failed on all providers.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
