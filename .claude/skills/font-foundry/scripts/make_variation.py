#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
font-foundry — build a stylistic VARIATION of a correct OFL Hebrew base font.

Letterforms come from a real font (Heebo / Rubik / Assistant) so Hebrew is
always correct. We then derive a new style by:
  * pinning a weight off the variable wght axis  (--weight 100..900)
  * rounding corners with Chaikin corner-cutting  (--round 0..3)
  * slanting (italic)                              (--slant degrees)
  * scaling width                                  (--width 0.7..1.3)

Every glyph (Hebrew, Latin, digits, punctuation) is transformed, so the
output is a complete, installable TTF in a single weight.

Usage:
  python3 make_variation.py --base heebo --weight 400 --round 2 --slant 6 \
      --width 1.0 --name "AgolHeebo" --style Regular --out path.ttf
"""
import argparse, math, os, sys
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform
from fontTools.varLib import instancer

HERE = os.path.dirname(os.path.abspath(__file__))
BASES = os.path.join(os.path.dirname(HERE), "bases")
BASE_FILES = {"heebo": "Heebo.ttf", "rubik": "Rubik.ttf", "assistant": "Assistant.ttf"}
WGHT_RANGE = {"heebo": (100, 900), "rubik": (300, 900), "assistant": (200, 800)}


def chaikin(pts):
    n = len(pts); out = []
    for i in range(n):
        p, q = pts[i], pts[(i + 1) % n]
        out.append((0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]))
        out.append((0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]))
    return out


def sample_quad(p0, pc, p1, K, acc):
    for k in range(1, K + 1):
        t = k / K
        acc.append(((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * pc[0] + t * t * p1[0],
                    (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * pc[1] + t * t * p1[1]))


def sample_cubic(p0, c1, c2, p1, K, acc):
    for k in range(1, K + 1):
        t = k / K; mt = 1 - t
        acc.append((mt**3*p0[0]+3*mt*mt*t*c1[0]+3*mt*t*t*c2[0]+t**3*p1[0],
                    mt**3*p0[1]+3*mt*mt*t*c1[1]+3*mt*t*t*c2[1]+t**3*p1[1]))


def to_contours(value, K=8):
    """Flatten a (decomposed) recording-pen value into closed polylines."""
    contours, contour, cur, start = [], [], None, None
    for op, args in value:
        if op == "moveTo":
            if contour: contours.append(contour)
            contour = [args[0]]; cur = start = args[0]
        elif op == "lineTo":
            contour.append(args[0]); cur = args[0]
        elif op == "qCurveTo":
            pts = list(args)
            on_end = pts[-1] if pts[-1] is not None else start
            offs = pts[:-1] if pts[-1] is not None else pts
            anchors, ctrls = [cur], []
            for i, c in enumerate(offs):
                if i < len(offs) - 1:
                    nxt = offs[i + 1]
                    anchors.append(((c[0]+nxt[0])/2, (c[1]+nxt[1])/2))
                else:
                    anchors.append(on_end)
                ctrls.append(c)
            for i in range(len(ctrls)):
                sample_quad(anchors[i], ctrls[i], anchors[i + 1], K, contour)
            cur = on_end
        elif op == "curveTo":
            c1, c2, p1 = args[-3], args[-2], args[-1]
            sample_cubic(cur, c1, c2, p1, K, contour); cur = p1
        elif op in ("closePath", "endPath"):
            if contour: contours.append(contour); contour = []
    if contour: contours.append(contour)
    clean = []
    for c in contours:
        cc = []
        for p in c:
            if not cc or abs(p[0]-cc[-1][0]) > 0.01 or abs(p[1]-cc[-1][1]) > 0.01:
                cc.append(p)
        if len(cc) >= 3:
            if abs(cc[0][0]-cc[-1][0]) < 0.01 and abs(cc[0][1]-cc[-1][1]) < 0.01:
                cc = cc[:-1]
            clean.append(cc)
    return clean


def set_name(font, family, style, full, ps, ver="1.0"):
    name = font["name"]
    pairs = {1: family, 2: style, 4: full, 6: ps, 16: family, 17: style,
             3: f"{ps};1.0", 5: f"Version {ver}"}
    name.names = []
    for nid, val in pairs.items():
        name.setName(val, nid, 3, 1, 0x409)
        name.setName(val, nid, 1, 0, 0)


def build(base, weight, round_iters, slant, width, family, style, out):
    path = os.path.join(BASES, BASE_FILES[base])
    font = TTFont(path)
    lo, hi = WGHT_RANGE[base]
    w = max(lo, min(hi, weight))
    instancer.instantiateVariableFont(font, {"wght": float(w)}, inplace=True)

    glyf = font["glyf"]
    gset = font.getGlyphSet()
    hmtx = font["hmtx"]
    tan = math.tan(math.radians(slant))
    tx = Transform(width, 0, tan, 1, 0, 0)

    for name in font.getGlyphOrder():
        try:
            g = glyf[name]
        except KeyError:
            continue
        # advance / lsb scale with width
        adv, lsb = hmtx[name]
        hmtx[name] = (int(round(adv * width)), int(round(lsb * width)))

        if not hasattr(g, "isComposite"):
            continue
        pen = TTGlyphPen(gset)
        if round_iters <= 0:
            # preserve original curves, just affine-transform
            tp = TransformPen(pen, (width, 0, tan, 1, 0, 0))
            dec = DecomposingRecordingPen(gset)
            gset[name].draw(dec)
            dec.replay(tp)
            glyf[name] = pen.glyph()
            continue
        dec = DecomposingRecordingPen(gset)
        gset[name].draw(dec)
        contours = to_contours(dec.value)
        for _ in range(round_iters):
            contours = [chaikin(c) for c in contours]
        wrote = False
        for c in contours:
            tpts = [tx.transformPoint(p) for p in c]
            pen.moveTo((round(tpts[0][0]), round(tpts[0][1])))
            for p in tpts[1:]:
                pen.lineTo((round(p[0]), round(p[1])))
            pen.closePath(); wrote = True
        glyf[name] = pen.glyph()

    # metadata
    set_name(font, family, style, f"{family} {style}", f"{family}-{style}")
    if "OS/2" in font:
        font["OS/2"].usWeightClass = int(w)
    if "head" in font:
        mac = 0
        if w >= 600: mac |= 0x01
        if slant > 0.5: mac |= 0x02
        font["head"].macStyle = mac
    font.save(out)
    return w


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True, choices=list(BASE_FILES))
    ap.add_argument("--weight", type=int, default=400)
    ap.add_argument("--round", type=int, default=0, dest="round_iters")
    ap.add_argument("--slant", type=float, default=0.0)
    ap.add_argument("--width", type=float, default=1.0)
    ap.add_argument("--name", required=True, dest="family")
    ap.add_argument("--style", default="Regular")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    w = build(a.base, a.weight, a.round_iters, a.slant, a.width,
              a.family, a.style, a.out)
    print(f"OK base={a.base} wght={w} round={a.round_iters} slant={a.slant} "
          f"width={a.width} -> {a.out}")


if __name__ == "__main__":
    main()
