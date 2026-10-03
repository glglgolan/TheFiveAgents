"""Local fallback for lyria-music-gen: Meta MusicGen via `transformers`.

Used for both MUSIC and SFX/ambience cues when Lyria RealTime is unavailable.
No API key, no network after the first model download (~1 GB for -small,
cached under ~/.cache/huggingface).

⚠️ MusicGen weights are CC-BY-NC 4.0 — outputs are NON-COMMERCIAL ONLY.

Returns 48kHz / 16-bit / stereo PCM so the output matches the Lyria path.
"""
import importlib
import platform
import subprocess
import sys

DEFAULT_MODEL = "facebook/musicgen-small"
LICENSE = "CC-BY-NC 4.0"
SRC_RATE = 32000          # MusicGen's EnCodec sample rate
TOKENS_PER_SEC = 50       # MusicGen frame rate
WINDOW_SEC = 30           # model is trained on 30s clips
CONTEXT_SEC = 10          # audio carried over when continuing past 30s


def _requirements() -> list[str]:
    # Intel Macs top out at torch 2.2.2 (last x86_64 macOS wheel), which needs
    # numpy<2 and a transformers release that still supports torch 2.2.
    if sys.platform == "darwin" and platform.machine() == "x86_64":
        return ["torch", "numpy<2", "transformers>=4.40,<4.50", "scipy"]
    return ["torch", "numpy", "transformers>=4.40", "scipy"]


def ensure_deps():
    try:
        for mod in ("torch", "numpy", "scipy"):
            importlib.import_module(mod)
        # transformers hands out dummy classes when torch is missing/too old,
        # so an import alone doesn't prove the stack works.
        from transformers.utils import is_torch_available
        if is_torch_available():
            return
    except ImportError:
        pass
    reqs = _requirements()
    print(f"Installing local fallback deps: {' '.join(reqs)} (first run, ~1 GB) ...", file=sys.stderr)
    subprocess.run(
        [sys.executable, "-m", "pip", "install", "-q", "--only-binary=:all:", *reqs],
        check=True,
    )


def _prompt_text(args) -> str:
    # MusicGen has no bpm/scale/density controls — fold them into the text.
    parts = [args.prompt]
    if args.bpm is not None:
        parts.append(f"{args.bpm} bpm")
    if args.scale is not None:
        parts.append(args.scale.replace("_", " ").lower())
    if args.density is not None:
        parts.append("dense, busy" if args.density > 0.6 else "sparse, minimal" if args.density < 0.4 else "")
    if args.brightness is not None:
        parts.append("bright" if args.brightness > 0.6 else "dark, warm" if args.brightness < 0.4 else "")
    return ", ".join(p for p in parts if p)


def _load(model_id, torch):
    from transformers import AutoProcessor, MusicgenForConditionalGeneration
    from transformers.utils import logging as hf_logging

    hf_logging.set_verbosity_error()
    processor = AutoProcessor.from_pretrained(model_id)
    model = MusicgenForConditionalGeneration.from_pretrained(model_id)
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    return processor, model.to(device), device


def _generate(processor, model, device, text, seconds, guidance, audio_prompt=None):
    inputs = processor(
        text=[text],
        audio=audio_prompt,
        sampling_rate=SRC_RATE if audio_prompt is not None else None,
        padding=True,
        return_tensors="pt",
    ).to(device)
    out = model.generate(
        **inputs,
        do_sample=True,
        guidance_scale=guidance,
        max_new_tokens=int(seconds * TOKENS_PER_SEC) + 4,
    )
    return out[0, 0].float().cpu().numpy()


def generate(args) -> tuple[bytes, str]:
    """Return (pcm_48k_stereo_s16le, model_id)."""
    ensure_deps()
    import numpy as np
    import torch
    from scipy.signal import resample_poly

    model_id = args.local_model or DEFAULT_MODEL
    if args.seed is not None:
        torch.manual_seed(args.seed)

    text = _prompt_text(args)
    # Lyria guidance range is 0–6 (default 4); MusicGen's sweet spot is ~3.
    guidance = max(1.0, min(args.guidance * 0.75, 6.0))

    processor, model, device = _load(model_id, torch)
    print(f"MusicGen: {model_id} on {device}, target {args.duration:.1f}s", file=sys.stderr)
    try:
        audio = _generate(processor, model, device, text, min(args.duration, WINDOW_SEC), guidance)
    except Exception:  # noqa: BLE001 - some ops are flaky on MPS; CPU always works
        if device == "cpu":
            raise
        print("MPS failed, retrying on CPU...", file=sys.stderr)
        model, device = model.to("cpu"), "cpu"
        audio = _generate(processor, model, device, text, min(args.duration, WINDOW_SEC), guidance)

    # Longer cues: continue in windows, conditioning on the last CONTEXT_SEC.
    while len(audio) < args.duration * SRC_RATE:
        ctx = audio[-CONTEXT_SEC * SRC_RATE:]
        remaining = args.duration - len(audio) / SRC_RATE
        new_sec = min(WINDOW_SEC - CONTEXT_SEC, remaining)
        print(f"MusicGen: continuing (+{new_sec:.1f}s)", file=sys.stderr)
        seg = _generate(processor, model, device, text, new_sec, guidance, audio_prompt=ctx)
        # Output includes the prompt audio; keep only what follows it.
        audio = np.concatenate([audio, seg[len(ctx):]])

    need = int(round(args.duration * SRC_RATE))
    audio = np.pad(audio[:need], (0, max(0, need - len(audio))))
    audio = resample_poly(audio, 3, 2)  # 32k -> 48k
    peak = np.abs(audio).max()
    if peak > 0.98:
        audio *= 0.98 / peak
    pcm = (np.clip(audio, -1, 1) * 32767).astype("<i2")
    stereo = np.repeat(pcm[:, None], 2, axis=1)
    return stereo.tobytes(), model_id
