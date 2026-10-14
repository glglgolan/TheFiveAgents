#!/usr/bin/env python3
"""Composite accurate Hebrew color labels onto the raw bottle illustrations.

AI image models render Hebrew glyphs unreliably, so the art is generated with
a blank label area and the text is drawn precisely afterward with PIL.
Hebrew letters (unlike Arabic) don't reshape by position, so a plain
character-reversal before drawing is sufficient for these single-word,
script-only labels.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
BOTTLES = ROOT / "bottles"
FONT_PATH = Path.home() / "Library/Fonts/miriwin-webfont.ttf"

# label rectangle (x0, y0, x1, y1), found by visual inspection of the raw renders —
# each color's raw image uses the same "blank rectangular label" composition.
LABEL_BOX = (345, 480, 655, 800)

COLORS = {
    "yellow": "צהוב",
    "brown": "חום",
    "green": "ירוק",
    "blue": "כחול",
    "white": "לבן",
}

INK = (60, 45, 30, 255)


def draw_label(raw_path: Path, out_path: Path, word: str) -> None:
    img = Image.open(raw_path).convert("RGBA")
    draw = ImageDraw.Draw(img)

    x0, y0, x1, y1 = LABEL_BOX
    box_w, box_h = x1 - x0, y1 - y0

    # fit the largest font size that keeps the (reversed) word within ~80% of the box
    reversed_word = word[::-1]
    size = 140
    font = ImageFont.truetype(str(FONT_PATH), size)
    while size > 20:
        font = ImageFont.truetype(str(FONT_PATH), size)
        bbox = draw.textbbox((0, 0), reversed_word, font=font)
        w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
        if w <= box_w * 0.8 and h <= box_h * 0.6:
            break
        size -= 4

    bbox = draw.textbbox((0, 0), reversed_word, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = x0 + (box_w - w) / 2 - bbox[0]
    ty = y0 + (box_h - h) / 2 - bbox[1]

    draw.text((tx, ty), reversed_word, font=font, fill=INK)
    img.convert("RGB").save(out_path)
    print(f"wrote {out_path} ({word} -> drawn as {reversed_word!r}, size={size})")


def main() -> int:
    only = sys.argv[1:] or list(COLORS)
    for color in only:
        word = COLORS[color]
        raw = BOTTLES / f"bottle_{color}_raw.png"
        if not raw.exists():
            print(f"skip {color}: {raw} not found")
            continue
        draw_label(raw, BOTTLES / f"bottle_{color}.png", word)
    return 0


if __name__ == "__main__":
    sys.exit(main())
