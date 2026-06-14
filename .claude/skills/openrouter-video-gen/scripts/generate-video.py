#!/usr/bin/env python3
"""Generate a video via OpenRouter's async Video API.

Supports text-to-video and image-to-video (first-frame reference).
Auto-derives aspect ratio from reference if not explicitly provided.

Usage:
  python3 generate-video.py "<prompt>" "<output.mp4>" --model <id>
      [--duration 5] [--aspect-ratio 16:9] [--reference <image>]

Reads OPENROUTER_API_KEY from project .env. stdlib only.
"""
import argparse
import base64
import json
import mimetypes
import os
import struct
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[3]

API_BASE = "https://openrouter.ai/api/v1"
SUPPORTED_ARS = ["16:9", "9:16", "1:1"]
POLL_INTERVAL = 5
POLL_TIMEOUT = 600


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


def read_image_dimensions(path: Path) -> tuple[int, int] | None:
    """Read W, H from PNG or JPEG without PIL. Returns None if unknown format."""
    data = path.read_bytes()
    # PNG
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        w, h = struct.unpack(">II", data[16:24])
        return w, h
    # JPEG
    if data[:2] == b"\xff\xd8":
        i = 2
        while i < len(data):
            if data[i] != 0xFF:
                return None
            marker = data[i + 1]
            i += 2
            if marker in (0xD8, 0xD9):
                continue
            if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
                # SOFn: skip 3 bytes (length + precision), then H(2), W(2)
                h = struct.unpack(">H", data[i + 3:i + 5])[0]
                w = struct.unpack(">H", data[i + 5:i + 7])[0]
                return w, h
            seg_len = struct.unpack(">H", data[i:i + 2])[0]
            i += seg_len
    return None


def derive_aspect_ratio(ref_path: Path) -> str:
    dims = read_image_dimensions(ref_path)
    if not dims:
        return "16:9"
    w, h = dims
    ratio = w / h
    # Choose nearest from supported set
    candidates = {"16:9": 16 / 9, "9:16": 9 / 16, "1:1": 1.0}
    return min(candidates, key=lambda k: abs(candidates[k] - ratio))


def encode_reference(path: Path) -> str:
    mime = mimetypes.guess_type(str(path))[0] or "image/png"
    b64 = base64.b64encode(path.read_bytes()).decode()
    return f"data:{mime};base64,{b64}"


def http_request(url: str, key: str, method: str = "GET", body: dict | None = None) -> dict:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def submit_job(key: str, model: str, prompt: str, duration: int, aspect_ratio: str, reference: Path | None) -> str:
    body: dict = {
        "model": model,
        "prompt": prompt,
        "duration": duration,
        "aspect_ratio": aspect_ratio,
    }
    if reference:
        body["input_references"] = [
            {
                "type": "image_url",
                "image_url": {
                    "url": encode_reference(reference)
                }
            }
        ]

    resp = http_request(f"{API_BASE}/videos", key, method="POST", body=body)
    job_id = resp.get("id") or resp.get("job_id") or resp.get("data", {}).get("id")
    if not job_id:
        raise RuntimeError(f"לא התקבל job_id מהשרת. response: {resp}")
    return job_id


def poll_until_done(key: str, job_id: str) -> dict:
    start = time.time()
    last_status = None
    while time.time() - start < POLL_TIMEOUT:
        try:
            resp = http_request(f"{API_BASE}/videos/{job_id}", key)
        except urllib.error.HTTPError as exc:
            print(f"שגיאת polling (ימשיך): HTTP {exc.code}", file=sys.stderr)
            time.sleep(POLL_INTERVAL)
            continue

        status = resp.get("status") or resp.get("data", {}).get("status")
        if status != last_status:
            print(f"  status: {status}", file=sys.stderr)
            last_status = status

        if status in ("completed", "succeeded", "success"):
            return resp
        if status in ("failed", "error", "canceled"):
            raise RuntimeError(f"העבודה נכשלה (status={status}): {resp}")
        time.sleep(POLL_INTERVAL)

    raise TimeoutError(f"Timeout אחרי {POLL_TIMEOUT}s. job_id={job_id} — בדוק ידנית ב-OpenRouter.")


def download_video(url: str, output: Path, key: str | None = None) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    headers = {"Authorization": f"Bearer {key}"} if key else {}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=180) as r:
        output.write_bytes(r.read())


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate video via OpenRouter")
    parser.add_argument("prompt", help="Video prompt")
    parser.add_argument("output", help="Output .mp4 path")
    parser.add_argument("--model", required=True,
                        help="OpenRouter model id (e.g. kwaivgi/kling-video-3.0-standard)")
    parser.add_argument("--duration", type=int, default=5, help="Seconds (default 5)")
    parser.add_argument("--aspect-ratio", help="16:9 | 9:16 | 1:1 (auto-derived from reference if omitted)")
    parser.add_argument("--reference", help="Optional first-frame reference image")

    args = parser.parse_args()
    output = Path(args.output)
    load_env()

    key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if not key:
        print("שגיאה: חסר OPENROUTER_API_KEY ב-.env", file=sys.stderr)
        return 1

    # AR resolution: explicit > derived from reference > 16:9
    if args.aspect_ratio:
        ar = args.aspect_ratio
    elif args.reference:
        ref_path = Path(args.reference)
        if not ref_path.exists():
            print(f"שגיאה: תמונת רפרנס לא נמצאה: {ref_path}", file=sys.stderr)
            return 2
        ar = derive_aspect_ratio(ref_path)
        print(f"  aspect_ratio נגזר מהרפרנס: {ar}", file=sys.stderr)
    else:
        ar = "16:9"

    if ar not in SUPPORTED_ARS:
        print(f"אזהרה: aspect_ratio '{ar}' לא ברשימת הנתמכים {SUPPORTED_ARS}. ממשיך בכל זאת.", file=sys.stderr)

    ref_path = Path(args.reference) if args.reference else None
    if ref_path and not ref_path.exists():
        print(f"שגיאה: תמונת רפרנס לא נמצאה: {ref_path}", file=sys.stderr)
        return 2

    print(f"שולח: model={args.model}, duration={args.duration}s, ar={ar}, reference={'✓' if ref_path else '—'}",
          file=sys.stderr)

    try:
        job_id = submit_job(key, args.model, args.prompt, args.duration, ar, ref_path)
        print(f"job_id: {job_id}", file=sys.stderr)
        result = poll_until_done(key, job_id)
        # OpenRouter returns "unsigned_urls" (list) for completed jobs; older docs mention "video_url"
        video_url = None
        unsigned = result.get("unsigned_urls") or result.get("data", {}).get("unsigned_urls")
        if unsigned and isinstance(unsigned, list) and unsigned:
            video_url = unsigned[0]
        video_url = video_url or result.get("video_url") or result.get("url") or result.get("data", {}).get("video_url")
        if not video_url:
            print(f"שגיאה: לא נמצא video URL בתגובה: {result}", file=sys.stderr)
            return 1
        print(f"מוריד: {video_url}", file=sys.stderr)
        # unsigned_urls require auth header
        download_video(video_url, output, key=key)
        cost = result.get("usage", {}).get("cost")
        if cost is not None:
            print(f"OK: {output} (cost: ${cost:.4f})")
        else:
            print(f"OK: {output}")
        return 0
    except urllib.error.HTTPError as exc:
        body = exc.read().decode(errors="replace")
        if exc.code == 401:
            print("שגיאה: OPENROUTER_API_KEY פג או לא תקין (HTTP 401). חידוש: https://openrouter.ai/keys",
                  file=sys.stderr)
        else:
            print(f"שגיאה: OpenRouter HTTP {exc.code} — {body}", file=sys.stderr)
        return 1
    except (urllib.error.URLError, RuntimeError, TimeoutError) as exc:
        print(f"שגיאה: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
