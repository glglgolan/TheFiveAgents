#!/usr/bin/env python3
"""
face-fidelity — local face swap for facial accuracy.

Swaps the face from a real reference photo (source) onto a generated/stylized
image (target), preserving the target's art style, lighting and composition.
Runs 100% locally via insightface (CPU) — no API, no tokens, no cost.

Usage:
    python3 swap.py <source_face_image> <target_image> [output_image]
                    [--source-index N] [--target-index N | --all]

  source_face_image : real photo containing the face to apply (e.g. a proxy)
  target_image      : the generated scene whose face(s) should be replaced
  output_image      : where to save (default: <target>_faceswap.png)

  --source-index N  : which face in the source to use (default: largest)
  --target-index N  : replace only the Nth face in target (default: all faces)
  --all             : replace all faces in target with the same source (default)

Exit codes:
  0 success · 1 bad args / no faces / model missing
"""
import sys, os, argparse

MODELS_DIR = os.path.expanduser("~/.insightface/models")
INSWAPPER = os.path.join(MODELS_DIR, "inswapper_128.onnx")


def die(msg, code=1):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(code)


def main():
    p = argparse.ArgumentParser(add_help=True)
    p.add_argument("source")
    p.add_argument("target")
    p.add_argument("output", nargs="?", default=None)
    p.add_argument("--source-index", type=int, default=None,
                   help="which source face to use (default: largest)")
    p.add_argument("--target-index", type=int, default=None,
                   help="replace only this target face index (default: all)")
    p.add_argument("--all", action="store_true",
                   help="replace all faces in target (default behavior)")
    args = p.parse_args()

    if not os.path.isfile(args.source):
        die(f"source not found: {args.source}")
    if not os.path.isfile(args.target):
        die(f"target not found: {args.target}")
    if not os.path.isfile(INSWAPPER):
        die(f"swap model missing: {INSWAPPER}\n"
            f"Run: bash .claude/skills/face-fidelity/scripts/setup.sh")

    out = args.output or os.path.splitext(args.target)[0] + "_faceswap.png"

    # Heavy imports only after arg validation
    try:
        import cv2
        from insightface.app import FaceAnalysis
        from insightface.model_zoo import get_model
    except ImportError as e:
        die(f"missing python deps ({e}).\n"
            f"Run: bash .claude/skills/face-fidelity/scripts/setup.sh")

    app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    app.prepare(ctx_id=0, det_size=(640, 640))

    src_img = cv2.imread(args.source)
    dst_img = cv2.imread(args.target)
    if src_img is None:
        die(f"could not read image: {args.source}")
    if dst_img is None:
        die(f"could not read image: {args.target}")

    src_faces = app.get(src_img)
    dst_faces = app.get(dst_img)
    print(f"[face-fidelity] source faces: {len(src_faces)} | target faces: {len(dst_faces)}")
    if not src_faces:
        die("no face detected in source")
    if not dst_faces:
        die("no face detected in target")

    def area(f):
        return (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1])

    src_sorted = sorted(src_faces, key=area, reverse=True)
    if args.source_index is not None:
        if not (0 <= args.source_index < len(src_faces)):
            die(f"--source-index {args.source_index} out of range (0..{len(src_faces)-1})")
        src_face = src_faces[args.source_index]
    else:
        src_face = src_sorted[0]  # largest

    swapper = get_model(INSWAPPER, providers=["CPUExecutionProvider"])

    # Determine which target faces to replace
    if args.target_index is not None:
        if not (0 <= args.target_index < len(dst_faces)):
            die(f"--target-index {args.target_index} out of range (0..{len(dst_faces)-1})")
        targets = [dst_faces[args.target_index]]
    else:
        targets = dst_faces  # all (default)

    result = dst_img.copy()
    for face in targets:
        result = swapper.get(result, face, src_face, paste_back=True)

    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    cv2.imwrite(out, result)
    print(f"[face-fidelity] swapped {len(targets)} face(s) -> {out}")


if __name__ == "__main__":
    main()
