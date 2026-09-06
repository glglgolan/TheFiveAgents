#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate the image-to-font TEMPLATE: a labelled grid the user fills with their
own letter designs (print + ink, or draw digitally over it), plus a spec.json
that records pixel-exact cell rectangles and baseline guides so the builder can
trace each glyph and place it correctly on the em square.

  python3 make_template.py --out template.png --spec template_spec.json

Design rules that make extraction robust:
  * Guides are printed in light blue, labels in light gray. The user draws in
    black/dark ink. The builder keeps only DARK pixels, so guides+labels vanish.
  * Four solid black corner fiducials let the builder perspective-correct a
    phone photo back to the canonical sheet.
"""
import argparse, json, os
from PIL import Image, ImageDraw, ImageFont
from glyph_set import GLYPHS

HERE = os.path.dirname(os.path.abspath(__file__))
LABEL_FONT = os.path.join(os.path.dirname(HERE), "bases", "Heebo.ttf")

W, H = 2480, 3508           # A4 @ 300dpi portrait
MARGIN = 150
TITLE_H = 120
COLS, ROWS = 7, 7          # 49 cells = 27 Hebrew + 10 digits + 12 punctuation
FID = 74                    # fiducial square size
FID_INSET = 84              # center inset from each corner

GUIDE = (150, 180, 225)     # light blue guide lines
GUIDE_SOFT = (200, 216, 236)
LABEL = (168, 168, 172)     # gray labels
BORDER = (208, 208, 210)
INK_HINT = (120, 120, 122)

# vertical guide fractions within a cell's drawing region (0 = top)
CAP_F, XH_F, BASE_F, DESC_F = 0.14, 0.46, 0.75, 0.95
UPM = 1000
LABEL_BAND = 46             # top strip reserved for the corner label


def dashed_line(draw, x0, y, x1, color, dash=14, gap=10, width=2):
    x = x0
    while x < x1:
        draw.line([(x, y), (min(x + dash, x1), y)], fill=color, width=width)
        x += dash + gap


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out",  default="template.png")
    ap.add_argument("--spec", default="template_spec.json")
    a = ap.parse_args()

    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)

    # corner fiducials (solid black squares) for perspective correction
    fid_centers = [(FID_INSET, FID_INSET), (W - FID_INSET, FID_INSET),
                   (FID_INSET, H - FID_INSET), (W - FID_INSET, H - FID_INSET)]
    for (cx, cy) in fid_centers:
        d.rectangle([cx - FID // 2, cy - FID // 2, cx + FID // 2, cy + FID // 2],
                    fill="black")

    # title
    try:
        title_font = ImageFont.truetype(LABEL_FONT, 44)
        small_font = ImageFont.truetype(LABEL_FONT, 30)
        tiny_font  = ImageFont.truetype(LABEL_FONT, 22)
    except Exception:
        title_font = small_font = tiny_font = ImageFont.load_default()
    d.text((W // 2, MARGIN - 40), "Font Foundry — גיליון עיצוב פונט",
           fill=(90, 90, 92), font=title_font, anchor="mm")

    left, top = MARGIN, MARGIN + TITLE_H
    right, bottom = W - MARGIN, H - MARGIN
    cellW = (right - left) / COLS
    cellH = (bottom - top) / ROWS

    cells = []
    for i, (uni, name, label) in enumerate(GLYPHS):
        r, c = divmod(i, COLS)
        cx0 = left + c * cellW
        cy0 = top + r * cellH
        cx1, cy1 = cx0 + cellW, cy0 + cellH

        # cell border
        d.rectangle([cx0, cy0, cx1, cy1], outline=BORDER, width=2)

        # drawing region (below the label band)
        draw_top = cy0 + LABEL_BAND
        Hd = cy1 - draw_top
        cap_y  = draw_top + CAP_F * Hd
        xh_y   = draw_top + XH_F * Hd
        base_y = draw_top + BASE_F * Hd
        desc_y = draw_top + DESC_F * Hd

        # guide lines
        gx0, gx1 = cx0 + 10, cx1 - 10
        d.line([(gx0, base_y), (gx1, base_y)], fill=GUIDE, width=3)      # baseline (solid)
        dashed_line(d, gx0, cap_y, gx1, GUIDE_SOFT)                      # cap line
        dashed_line(d, gx0, xh_y, gx1, GUIDE_SOFT)                       # x-height
        dashed_line(d, gx0, desc_y, gx1, GUIDE_SOFT)                     # descender

        # corner label: the target character + its code, in gray
        d.text((cx0 + 14, cy0 + 8), label, fill=LABEL, font=small_font)
        d.text((cx1 - 14, cy0 + 12), f"U+{uni:04X}", fill=(196, 196, 200),
               font=tiny_font, anchor="ra")

        cells.append(dict(
            name=name, unicode=uni, label=label,
            x=round(cx0), y=round(cy0), w=round(cellW), h=round(cellH),
            draw_top=round(draw_top),
            cap_y=round(cap_y), xheight_y=round(xh_y),
            baseline_y=round(base_y), desc_y=round(desc_y),
        ))

    spec = dict(
        canvas=[W, H], upm=UPM,
        base_frac=BASE_F, cap_frac=CAP_F, xheight_frac=XH_F, desc_frac=DESC_F,
        draw_region_maps_to_upm=True,
        fiducials=[[cx, cy] for (cx, cy) in fid_centers],
        cells=cells,
    )
    os.makedirs(os.path.dirname(os.path.abspath(a.out)) or ".", exist_ok=True)
    img.save(a.out, "PNG")
    with open(a.spec, "w") as f:
        json.dump(spec, f, ensure_ascii=False, indent=2)
    print(f"template -> {a.out}  ({len(cells)} cells)")
    print(f"spec     -> {a.spec}")


if __name__ == "__main__":
    main()
