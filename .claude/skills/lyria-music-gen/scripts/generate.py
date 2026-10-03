#!/usr/bin/env python3
"""Generate instrumental music/SFX beds via Google Lyria RealTime (Gemini API).

Usage:
  python3 generate.py "<prompt>" <duration-seconds> "<output-path>.wav" [options]

Options:
  --negative "<text>"     Negative prompt (e.g. "vocals, lyrics, clipping")
  --bpm <60-200>          Beats per minute (requires context reset, handled internally)
  --scale <SCALE_NAME>    e.g. C_MAJOR_A_MINOR (see google.genai.types.Scale)
  --density <0.0-1.0>     Note/event density
  --brightness <0.0-1.0>  Tonal brightness
  --guidance <0.0-6.0>    How strictly the model follows the prompts (default 4.0)
  --seed <int>            Deterministic seed, when supported

Reads GEMINI_API_KEY from the project .env file.

Model: models/lyria-realtime-exp — instrumental only, no vocals/lyrics.
Output: 48kHz, 16-bit PCM, stereo WAV.
"""
import argparse
import asyncio
import importlib
import os
import subprocess
import sys
import wave
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[3]  # scripts -> lyria-music-gen -> skills -> .claude -> repo root

MODEL = "models/lyria-realtime-exp"
SAMPLE_RATE = 48000
CHANNELS = 2
SAMPLE_WIDTH = 2  # 16-bit PCM


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


def ensure_sdk():
    try:
        return importlib.import_module("google.genai")
    except ImportError:
        print("Installing google-genai SDK...", file=sys.stderr)
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-q", "google-genai"],
            check=True,
        )
        return importlib.import_module("google.genai")


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("prompt")
    p.add_argument("duration", type=float, help="target duration in seconds")
    p.add_argument("output")
    p.add_argument("--negative", default="vocals, lyrics, singing, spoken word, clipping, distortion")
    p.add_argument("--bpm", type=int, default=None)
    p.add_argument("--scale", default=None)
    p.add_argument("--density", type=float, default=None)
    p.add_argument("--brightness", type=float, default=None)
    p.add_argument("--guidance", type=float, default=4.0)
    p.add_argument("--seed", type=int, default=None)
    return p.parse_args()


async def record(genai_types, client, args) -> bytes:
    chunks: list[bytes] = []
    total_bytes_needed = int(args.duration * SAMPLE_RATE * CHANNELS * SAMPLE_WIDTH)
    collected = 0

    async with client.aio.live.music.connect(model=MODEL) as session:
        weighted = [genai_types.WeightedPrompt(text=args.prompt, weight=1.0)]
        if args.negative:
            weighted.append(genai_types.WeightedPrompt(text=args.negative, weight=-1.0))
        await session.set_weighted_prompts(prompts=weighted)

        config_kwargs = {"guidance": args.guidance}
        if args.bpm is not None:
            config_kwargs["bpm"] = args.bpm
        if args.density is not None:
            config_kwargs["density"] = args.density
        if args.brightness is not None:
            config_kwargs["brightness"] = args.brightness
        if args.scale is not None:
            config_kwargs["scale"] = getattr(genai_types.Scale, args.scale)
        if args.seed is not None:
            config_kwargs["seed"] = args.seed

        await session.set_music_generation_config(
            config=genai_types.LiveMusicGenerationConfig(**config_kwargs)
        )
        await session.play()

        async for message in session.receive():
            if not message.server_content:
                continue
            for chunk in message.server_content.audio_chunks:
                chunks.append(chunk.data)
                collected += len(chunk.data)
            if collected >= total_bytes_needed:
                break

        await session.stop()

    audio = b"".join(chunks)
    return audio[:total_bytes_needed] if total_bytes_needed else audio


def write_wav(pcm: bytes, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(output), "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(SAMPLE_WIDTH)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm)


def main() -> int:
    args = parse_args()
    load_env()

    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        print("ERROR: GEMINI_API_KEY not set in .env", file=sys.stderr)
        return 1

    genai = ensure_sdk()
    genai_types = importlib.import_module("google.genai.types")
    client = genai.Client(api_key=api_key)

    output = Path(args.output)
    try:
        pcm = asyncio.run(record(genai_types, client, args))
    except Exception as exc:  # noqa: BLE001 - surface any SDK/connection failure to the caller
        print(f"ERROR: Lyria generation failed: {exc}", file=sys.stderr)
        return 1

    write_wav(pcm, output)
    print(f"OK via Lyria RealTime ({MODEL}) -> {output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
