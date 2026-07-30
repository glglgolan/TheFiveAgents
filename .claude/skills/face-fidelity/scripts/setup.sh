#!/usr/bin/env bash
# face-fidelity setup — installs deps + downloads models (one time, local, free).
set -euo pipefail

MODELS_DIR="$HOME/.insightface/models"
INSWAPPER="$MODELS_DIR/inswapper_128.onnx"
# Public mirror of inswapper_128.onnx (the official deepinsight repo is gated/auth-walled).
INSWAPPER_URL="https://huggingface.co/ezioruan/inswapper_128.onnx/resolve/main/inswapper_128.onnx"

echo "[setup] installing python deps (insightface, onnxruntime, opencv-python)…"
pip3 install --quiet insightface onnxruntime opencv-python

mkdir -p "$MODELS_DIR"

# buffalo_l (detection + recognition) auto-downloads on first FaceAnalysis() call.
echo "[setup] priming buffalo_l detection models…"
python3 - <<'PY'
from insightface.app import FaceAnalysis
app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
app.prepare(ctx_id=0, det_size=(640, 640))
print("[setup] buffalo_l ready")
PY

# inswapper_128.onnx (the swap model) — must be fetched manually.
NEED_DOWNLOAD=1
if [ -f "$INSWAPPER" ]; then
  SIZE=$(stat -f%z "$INSWAPPER" 2>/dev/null || stat -c%s "$INSWAPPER" 2>/dev/null || echo 0)
  if [ "$SIZE" -gt 1000000 ]; then
    echo "[setup] inswapper_128.onnx already present ($SIZE bytes) — skipping"
    NEED_DOWNLOAD=0
  fi
fi

if [ "$NEED_DOWNLOAD" -eq 1 ]; then
  echo "[setup] downloading inswapper_128.onnx (~530MB) from public mirror…"
  curl -fL "$INSWAPPER_URL" -o "$INSWAPPER" --progress-bar
  SIZE=$(stat -f%z "$INSWAPPER" 2>/dev/null || stat -c%s "$INSWAPPER" 2>/dev/null || echo 0)
  if [ "$SIZE" -lt 1000000 ]; then
    echo "[setup] ERROR: download failed (size=$SIZE). Check the mirror URL." >&2
    rm -f "$INSWAPPER"
    exit 1
  fi
  echo "[setup] inswapper_128.onnx downloaded ($SIZE bytes)"
fi

echo "[setup] done — face-fidelity ready. No tokens/API needed; runs locally on CPU."
