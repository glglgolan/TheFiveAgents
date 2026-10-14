#!/usr/bin/env python3
"""Print scenes[N].image_prompt to stdout, no trailing newline."""
import json
import sys
from pathlib import Path

STORYBOARD = Path(__file__).resolve().parents[1] / "storyboard.json"


def main() -> int:
    n = int(sys.argv[1])
    d = json.loads(STORYBOARD.read_text(encoding="utf-8"))
    s = next(s for s in d["scenes"] if s["scene_number"] == n)
    sys.stdout.write(s["image_prompt"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
