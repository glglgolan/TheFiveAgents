#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build a real TTF from a FILLED template sheet (see make_template.py).

Pipeline per glyph:
  perspective-correct sheet (via corner fiducials) -> crop cell drawing region
  -> keep dark ink -> cv2.findContours (outer + holes) -> simplify + smooth
  -> map pixels to em units on the baseline -> TTGlyphPen outline.

Outputs Regular (as traced) and Bold (traced outline + emboldening).

  python3 build_from_template.py --image filled.png --spec template_spec.json \
      --name "MyHand" --out-dir fonts/outputs/<slug>
"""
import argparse, json, os, sys
import numpy as np
import cv2
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_variation import embolden_contour, chaikin, fix_maxp_for_glyf  # reuse
from glyph_set import GLYPHS, SPACE

UPM = 1000
SB = 46                    # side bearing (em units)
INK_THRESH = 135           # grayscale < this = ink
MIN_INK_FRAC = 0.004       # below this ratio the cell is considered empty
ASCENT, DESCENT = 850, -270


# ── sheet alignment ───────────────────────────────────────────────────────────

def find_fiducials(gray):
    """Return 4 fiducial centers (any order) or None."""
    _, th = cv2.threshold(gray, 90, 255, cv2.THRESH_BINARY_INV)
    cnts, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    H, W = gray.shape
    cands = []
    for c in cnts:
        a = cv2.contourArea(c)
        if a < (W * H) * 2e-4 or a > (W * H) * 8e-3:
            continue
        x, y, w, h = cv2.boundingRect(c)
        if w == 0 or h == 0:
            continue
        ar = w / float(h)
        fill = a / float(w * h)
        if 0.7 < ar < 1.4 and fill > 0.75:      # near-square, solid
            cands.append((x + w / 2.0, y + h / 2.0, a))
    if len(cands) < 4:
        return None
    # pick the 4 closest to the image corners
    corners = [(0, 0), (W, 0), (0, H), (W, H)]
    chosen = []
    used = set()
    for (corx, cory) in corners:
        best, bi = None, None
        for i, (cx, cy, _) in enumerate(cands):
            if i in used:
                continue
            d = (cx - corx) ** 2 + (cy - cory) ** 2
            if best is None or d < best:
                best, bi = d, i
        if bi is None:
            return None
        used.add(bi)
        chosen.append((cands[bi][0], cands[bi][1]))
    return chosen   # TL, TR, BL, BR order


def align_sheet(img, spec):
    """Perspective-correct the sheet to canonical canvas via fiducials."""
    Wc, Hc = spec["canvas"]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    fids = find_fiducials(gray)
    dst = np.float32([spec["fiducials"][0], spec["fiducials"][1],
                      spec["fiducials"][2], spec["fiducials"][3]])  # TL,TR,BL,BR
    if fids is not None:
        src = np.float32(fids)
        Mtx = cv2.getPerspectiveTransform(src, dst)
        return cv2.warpPerspective(img, Mtx, (Wc, Hc),
                                   borderValue=(255, 255, 255)), True
    # no fiducials: resize to canvas as best effort
    if (img.shape[1], img.shape[0]) != (Wc, Hc):
        img = cv2.resize(img, (Wc, Hc))
    return img, False


# ── tracing ───────────────────────────────────────────────────────────────────

def signed_area(pts):
    a = 0.0
    n = len(pts)
    for i in range(n):
        x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % n]
        a += x1 * y2 - x2 * y1
    return a / 2.0


def trace_cell(warp_gray, cell):
    """Return list of font-space contours (outer CW, holes CCW) + advance."""
    x, y, w, h = cell["x"], cell["y"], cell["w"], cell["h"]
    dt = cell["draw_top"]
    pad = 8
    crop = warp_gray[dt + pad: y + h - pad, x + pad: x + w - pad]
    if crop.size == 0:
        return [], None
    # ink mask (dark pixels only -> removes blue guides + gray labels)
    _, mask = cv2.threshold(crop, INK_THRESH, 255, cv2.THRESH_BINARY_INV)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN,
                            np.ones((3, 3), np.uint8))  # despeckle
    if mask.sum() / 255.0 < MIN_INK_FRAC * mask.size:
        return [], None                                  # empty cell
    cnts, hier = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts or hier is None:
        return [], None
    hier = hier[0]

    # pixel offsets: crop-local -> absolute warped-sheet coords
    ox, oy = x + pad, dt + pad
    Hd = (y + h) - dt                 # draw-region height maps to UPM
    scale = UPM / float(Hd)
    base_y = cell["baseline_y"]

    # global ink x-extent for consistent left bearing
    all_x = [ox + p[0][0] for c in cnts for p in c]
    ink_left = min(all_x)

    def to_font(px, py):
        fx = (px - ink_left) * scale + SB
        fy = (base_y - py) * scale
        return (fx, fy)

    contours = []
    ink_right = ink_left
    for i, c in enumerate(cnts):
        area_px = cv2.contourArea(c)
        if area_px < 12:
            continue
        eps = 0.8
        approx = cv2.approxPolyDP(c, eps, True)
        pts = [(ox + p[0][0], oy + p[0][1]) for p in approx]
        if len(pts) < 3:
            continue
        ink_right = max(ink_right, max(px for px, _ in pts))
        fpts = [to_font(px, py) for (px, py) in pts]
        fpts = chaikin(fpts)          # one smoothing pass
        is_hole = hier[i][3] != -1
        a = signed_area(fpts)
        # outer -> clockwise (a<0 in y-up); hole -> counter-clockwise (a>0)
        if is_hole and a < 0:
            fpts.reverse()
        elif (not is_hole) and a > 0:
            fpts.reverse()
        contours.append(fpts)

    advance = round((ink_right - ink_left) * scale + 2 * SB)
    return contours, max(advance, 120)


# ── font assembly ─────────────────────────────────────────────────────────────

def contours_to_glyph(contours, embolden=0):
    pen = TTGlyphPen(None)
    for c in contours:
        cc = embolden_contour(c, embolden) if embolden else c
        pen.moveTo((round(cc[0][0]), round(cc[0][1])))
        for p in cc[1:]:
            pen.lineTo((round(p[0]), round(p[1])))
        pen.closePath()
    return pen.glyph()


def notdef_glyph():
    pen = TTGlyphPen(None)
    for box in [[(60, 0), (60, 700), (460, 700), (460, 0)],
                [(120, 60), (400, 60), (400, 640), (120, 640)]]:
        pen.moveTo(box[0])
        for p in box[1:]:
            pen.lineTo(p)
        pen.closePath()
    return pen.glyph()


def build_font(traced, family, style, embolden, out):
    order = [".notdef", "space"] + [n for (_, n, _) in GLYPHS if n in traced]
    glyphs, metrics, cmap = {}, {}, {}
    glyphs[".notdef"] = notdef_glyph(); metrics[".notdef"] = (540, 60)
    glyphs["space"] = TTGlyphPen(None).glyph(); metrics["space"] = (380, 0)
    cmap[SPACE[0]] = "space"
    for uni, name, _ in GLYPHS:
        if name not in traced:
            continue
        contours, adv = traced[name]
        glyphs[name] = contours_to_glyph(contours, embolden)
        # emboldening widens the glyph a touch
        metrics[name] = (adv + (embolden if embolden else 0), SB)
        cmap[uni] = name

    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics({g: metrics.get(g, (380, SB)) for g in order})
    fb.setupHorizontalHeader(ascent=ASCENT, descent=DESCENT)
    is_bold = bool(embolden) or style.lower() in ("bold", "black")
    fb.setupNameTable(dict(
        familyName=family, styleName=style,
        fullName=f"{family} {style}", psName=f"{family}-{style}",
        version="1.0"))
    fb.setupOS2(sTypoAscender=ASCENT, sTypoDescender=DESCENT, sTypoLineGap=90,
                usWinAscent=ASCENT, usWinDescent=-DESCENT,
                usWeightClass=700 if is_bold else 400,
                fsSelection=(0x20 if is_bold else 0x40))
    fb.setupPost()
    fb.font["head"].macStyle = 0x01 if is_bold else 0x00
    fix_maxp_for_glyf(fb.font)
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    fb.save(out)
    return len([n for n in traced])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--image", required=True)
    ap.add_argument("--spec",  required=True)
    ap.add_argument("--name",  required=True)
    ap.add_argument("--out-dir", required=True, dest="out_dir")
    ap.add_argument("--embolden-bold", type=float, default=28.0)
    a = ap.parse_args()

    spec = json.load(open(a.spec))
    img = cv2.imread(a.image)
    if img is None:
        sys.exit(f"cannot read image: {a.image}")
    warp, aligned = align_sheet(img, spec)
    warp_gray = cv2.cvtColor(warp, cv2.COLOR_BGR2GRAY)

    traced = {}
    for cell in spec["cells"]:
        contours, adv = trace_cell(warp_gray, cell)
        if contours:
            traced[cell["name"]] = (contours, adv)

    reg = os.path.join(a.out_dir, f"{a.name}-Regular.ttf")
    bold = os.path.join(a.out_dir, f"{a.name}-Bold.ttf")
    n = build_font(traced, a.name, "Regular", 0, reg)
    build_font(traced, a.name, "Bold", a.embolden_bold, bold)
    print(f"aligned_via_fiducials={aligned}  traced_glyphs={n}/{len(spec['cells'])}")
    print(f"  {reg}")
    print(f"  {bold}")


if __name__ == "__main__":
    main()
