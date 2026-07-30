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
  * stroke contrast simulation                     (--contrast 0.0..0.35)
  * OpenType ligatures for common Hebrew pairs     (--liga)

Usage:
  python3 make_variation.py --base assistant --weight 500 --round 3 --slant 7 \
      --width 1.05 --contrast 0.22 --liga \
      --name "Shovav" --style Regular --out path.ttf
"""
import argparse, math, os, io
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform
from fontTools.varLib import instancer

HERE = os.path.dirname(os.path.abspath(__file__))
BASES = os.path.join(os.path.dirname(HERE), "bases")
BASE_FILES  = {"heebo": "Heebo.ttf", "rubik": "Rubik.ttf", "assistant": "Assistant.ttf",
               "dana-yad": "DanaYad.ttf"}
WGHT_RANGE  = {"heebo": (100, 900), "rubik": (300, 900), "assistant": (200, 800),
               "dana-yad": None}          # static font — no weight axis
# Handwriting preset: use dana-yad as base
HANDWRITING_DEFAULTS = dict(base="dana-yad", weight=400, round_iters=2,
                             slant=5, width=1.0, contrast=0.18, liga=True)

# Common Hebrew ligature pairs: (first_glyph, second_glyph, liga_name, x_overlap)
# These are the most visually recognizable Hebrew pairs in handwriting
LIGA_PAIRS = [
    ("uni05DC", "uni05D0", "liga_lamed_alef",  50),  # לא  — most common Hebrew word
    ("uni05E9", "uni05DC", "liga_shin_lamed",  35),  # של  — very common
    ("uni05DB", "uni05D9", "liga_kaf_yod",     40),  # כי
    ("uni05DE", "uni05D9", "liga_mem_yod",     35),  # מי
    ("uni05D5", "uni05D0", "liga_vav_alef",    30),  # וא
]


# ── geometry helpers ──────────────────────────────────────────────────────────

def chaikin(pts):
    n = len(pts); out = []
    for i in range(n):
        p, q = pts[i], pts[(i + 1) % n]
        out.append((0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]))
        out.append((0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]))
    return out


def apply_contrast(pts, contrast):
    """Simulate a broad-nib calligraphic pen: strokes swell at mid-height.

    For each contour, the x-distance from the contour's x-centroid is scaled
    by a factor that peaks at mid-height (sin curve). Horizontal strokes look
    thicker, vertical ones slimmer — like a pen held at ~45°.
    """
    if not pts or contrast == 0:
        return pts
    ys = [p[1] for p in pts]
    y_min, y_max = min(ys), max(ys)
    y_span = max(1.0, y_max - y_min)
    cx = sum(p[0] for p in pts) / len(pts)
    out = []
    for (x, y) in pts:
        t = (y - y_min) / y_span          # 0 at bottom, 1 at top
        # swell peaks at t≈0.65 (upper-mid, where broad strokes are widest)
        scale = 1.0 + contrast * math.sin(t * math.pi * 1.1 + 0.3)
        out.append((cx + (x - cx) * scale, y))
    return out


def _signed_area(pts):
    a = 0.0
    n = len(pts)
    for i in range(n):
        x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % n]
        a += x1 * y2 - x2 * y1
    return a / 2.0


def embolden_contour(pts, amount):
    """Offset every point outward along its (winding-aware) normal -> thicker
    strokes. Outer contours grow, holes shrink, so net stroke weight rises.
    Makes a font look 'plump' / שמנמן."""
    if not pts or amount == 0:
        return pts
    n = len(pts)
    # CCW (area>0) interior is on the left; outward normal of edge (dx,dy)
    # is (dy,-dx) for CW and (-dy,dx) for CCW. Use sign to orient.
    sign = 1.0 if _signed_area(pts) > 0 else -1.0
    out = []
    for i in range(n):
        x0, y0 = pts[(i - 1) % n]
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % n]
        def nrm(dx, dy):
            l = math.hypot(dx, dy) or 1.0
            return (dy / l, -dx / l)
        n1 = nrm(x1 - x0, y1 - y0)
        n2 = nrm(x2 - x1, y2 - y1)
        nx, ny = n1[0] + n2[0], n1[1] + n2[1]
        l = math.hypot(nx, ny) or 1.0
        out.append((x1 + sign * nx / l * amount, y1 + sign * ny / l * amount))
    return out


def stamp_stroke(centerline, radius, segs=14):
    """Turn an open centerline into filled contours by stamping overlapping
    circles (round caps + joins for free). Returns list of circle contours.
    Used for decorative flourishes (e.g. the curly lamed)."""
    rings = []
    # densify so circles overlap
    dense = []
    for i in range(len(centerline) - 1):
        x0, y0 = centerline[i]; x1, y1 = centerline[i + 1]
        d = math.hypot(x1 - x0, y1 - y0)
        steps = max(1, int(d / (radius * 0.55)))
        for s in range(steps):
            t = s / steps
            dense.append((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t))
    dense.append(centerline[-1])
    for (cx, cy) in dense:
        rings.append([(cx + radius * math.cos(2 * math.pi * k / segs),
                       cy + radius * math.sin(2 * math.pi * k / segs))
                      for k in range(segs)])
    return rings


def lamed_curl(contours, stroke_r):
    """Append an exaggerated curly flourish spiralling off the top of the
    lamed's ascender. Open spiral (< 1 turn) so it reads as a curl, not a blob."""
    all_pts = [p for c in contours for p in c]
    if not all_pts:
        return contours
    ymax = max(p[1] for p in all_pts)
    top_pts = [p for p in all_pts if p[1] > ymax - 30]
    ax = sum(p[0] for p in top_pts) / len(top_pts)
    ay = ymax
    # inward spiral whose OUTER end meets the ascender tip and winds up-left
    N = 40
    rmax, rmin = 62.0, 7.0
    sweep = 1.65 * math.pi          # ~0.8 turn — open, airy curl
    ang0 = math.radians(200)        # tight-center end points down-left
    cx = ax - rmax * math.cos(sweep + ang0)
    cy = ay - rmax * math.sin(sweep + ang0)
    spiral = []
    for i in range(N):
        t = i / (N - 1)
        ang = sweep * (1 - t) + ang0
        rad = rmin + (rmax - rmin) * t
        spiral.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    spiral.reverse()                # start at the tip, wind into the curl
    return contours + stamp_stroke(spiral, stroke_r)


def sample_quad(p0, pc, p1, K, acc):
    for k in range(1, K + 1):
        t = k / K
        acc.append(((1-t)**2*p0[0] + 2*(1-t)*t*pc[0] + t*t*p1[0],
                    (1-t)**2*p0[1] + 2*(1-t)*t*pc[1] + t*t*p1[1]))


def sample_cubic(p0, c1, c2, p1, K, acc):
    for k in range(1, K + 1):
        t = k / K; mt = 1 - t
        acc.append((mt**3*p0[0]+3*mt**2*t*c1[0]+3*mt*t**2*c2[0]+t**3*p1[0],
                    mt**3*p0[1]+3*mt**2*t*c1[1]+3*mt*t**2*c2[1]+t**3*p1[1]))


def to_contours(value, K=8):
    """Flatten a decomposed recording-pen value into closed polylines."""
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
                nxt = offs[i+1] if i < len(offs)-1 else on_end
                anchors.append(((c[0]+nxt[0])/2, (c[1]+nxt[1])/2) if i < len(offs)-1 else on_end)
                ctrls.append(c)
            for i in range(len(ctrls)):
                sample_quad(anchors[i], ctrls[i], anchors[i+1], K, contour)
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


def replay_shifted(recorded_value, dx, pen):
    """Replay a DecomposingRecordingPen value with an x-offset."""
    for op, args in recorded_value:
        if op == "moveTo":
            pen.moveTo((args[0][0]+dx, args[0][1]))
        elif op == "lineTo":
            pen.lineTo((args[0][0]+dx, args[0][1]))
        elif op == "qCurveTo":
            pen.qCurveTo(*[(p[0]+dx, p[1]) for p in args])
        elif op == "curveTo":
            pen.curveTo(*[(p[0]+dx, p[1]) for p in args])
        elif op in ("closePath", "endPath"):
            pen.closePath()


# ── ligature support ──────────────────────────────────────────────────────────

def build_liga_glyphs(font, gset, hmtx_table, pairs):
    """Build composite ligature glyphs by concatenating two glyphs' outlines.

    Returns a list of (liga_name, advance) for glyphs that were successfully built.
    """
    glyf = font["glyf"]
    built = []
    for g1_name, g2_name, liga_name, overlap in pairs:
        if g1_name not in gset or g2_name not in gset:
            continue
        try:
            adv1, _ = hmtx_table[g1_name]
            adv2, _ = hmtx_table[g2_name]

            dec1 = DecomposingRecordingPen(gset)
            gset[g1_name].draw(dec1)
            dec2 = DecomposingRecordingPen(gset)
            gset[g2_name].draw(dec2)

            pen = TTGlyphPen(None)
            # Draw glyph1 at origin
            replay_shifted(dec1.value, 0, pen)
            # Draw glyph2 shifted so it sits just to the right of glyph1, slightly overlapping
            replay_shifted(dec2.value, adv1 - overlap, pen)

            glyf[liga_name] = pen.glyph()
            total_adv = adv1 + adv2 - overlap
            hmtx_table[liga_name] = (total_adv, 0)
            built.append((g1_name, g2_name, liga_name))
        except Exception as e:
            print(f"  liga {liga_name} skipped: {e}")
    return built


def add_liga_gsub(font, built_pairs):
    """Add a GSUB liga feature using feaLib (FEA language builder)."""
    from fontTools.feaLib.builder import addOpenTypeFeatures
    from fontTools.feaLib.ast import (
        FeatureFile, LanguageSystemStatement, FeatureBlock,
        LigatureSubstStatement, GlyphName
    )

    lines = [
        "languagesystem DFLT dflt;",
        "languagesystem hebr dflt;",
        "",
        "feature liga {",
    ]
    for g1, g2, liga in built_pairs:
        lines.append(f"  sub {g1} {g2} by {liga};")
    lines.append("} liga;")

    fea_code = "\n".join(lines)
    addOpenTypeFeatures(font, io.StringIO(fea_code))


# ── name table ────────────────────────────────────────────────────────────────

def set_name(font, family, style, full, ps, ver="1.0"):
    name = font["name"]
    pairs = {1: family, 2: style, 4: full, 6: ps, 16: family, 17: style,
             3: f"{ps};{ver}", 5: f"Version {ver}"}
    name.names = []
    for nid, val in pairs.items():
        name.setName(val, nid, 3, 1, 0x409)
        name.setName(val, nid, 1, 0, 0)


# ── main build ────────────────────────────────────────────────────────────────

def build(base, weight, round_iters, slant, width, contrast, liga,
          embolden, curl_lamed, family, style, out):
    path = os.path.join(BASES, BASE_FILES[base])
    font = TTFont(path)
    wrange = WGHT_RANGE[base]
    if wrange is None:
        # static font — use as-is, ignore --weight
        w = font["OS/2"].usWeightClass
    else:
        lo, hi = wrange
        w = max(lo, min(hi, weight))
        instancer.instantiateVariableFont(font, {"wght": float(w)}, inplace=True)

    glyf  = font["glyf"]
    gset  = font.getGlyphSet()
    hmtx  = font["hmtx"]
    tan   = math.tan(math.radians(slant))
    tx    = Transform(width, 0, tan, 1, 0, 0)
    # flourish stroke radius ~ matches the emboldened stroke half-width
    flourish_r = 15 + embolden * 0.45

    geometric = round_iters > 0 or contrast > 0 or embolden > 0 or curl_lamed

    for name in font.getGlyphOrder():
        try:
            g = glyf[name]
        except KeyError:
            continue
        adv, lsb = hmtx[name]
        hmtx[name] = (int(round(adv * width)), int(round(lsb * width)))

        if not hasattr(g, "isComposite"):
            continue
        pen = TTGlyphPen(gset)
        if not geometric:
            tp = TransformPen(pen, (width, 0, tan, 1, 0, 0))
            dec = DecomposingRecordingPen(gset)
            gset[name].draw(dec)
            dec.replay(tp)
            glyf[name] = pen.glyph()
            continue

        dec = DecomposingRecordingPen(gset)
        gset[name].draw(dec)
        contours = to_contours(dec.value)

        # Chaikin corner rounding
        for _ in range(round_iters):
            contours = [chaikin(c) for c in contours]

        # Stroke contrast (calligraphic width variation)
        if contrast > 0:
            contours = [apply_contrast(c, contrast) for c in contours]

        # Embolden — plump strokes (שמנמן)
        if embolden > 0:
            contours = [embolden_contour(c, embolden) for c in contours]

        # Exaggerated curly lamed
        if curl_lamed and name == "uni05DC":
            contours = lamed_curl(contours, flourish_r)

        for c in contours:
            tpts = [tx.transformPoint(p) for p in c]
            pen.moveTo((round(tpts[0][0]), round(tpts[0][1])))
            for p in tpts[1:]:
                pen.lineTo((round(p[0]), round(p[1])))
            pen.closePath()
        glyf[name] = pen.glyph()

    # Ligatures — must run after all base glyphs are transformed
    if liga:
        # Refresh gset after glyph edits
        gset2 = font.getGlyphSet()
        # Extend glyph order before building
        order = font.getGlyphOrder()
        new_names = [t[2] for t in LIGA_PAIRS if t[2] not in order]
        font.setGlyphOrder(order + new_names)
        # Init empty glyph entries
        for n in new_names:
            glyf[n] = glyf.get(".notdef")  # placeholder
            hmtx[n] = (500, 0)
        built = build_liga_glyphs(font, gset2, hmtx, LIGA_PAIRS)
        if built:
            add_liga_gsub(font, built)
            print(f"  ligatures: {[b[2] for b in built]}")

    set_name(font, family, style, f"{family} {style}", f"{family}-{style}")
    if "OS/2" in font:
        font["OS/2"].usWeightClass = int(w)
    if "head" in font:
        mac = 0
        if w >= 600: mac |= 0x01
        if slant > 0.5: mac |= 0x02
        font["head"].macStyle = mac

    fix_maxp_for_glyf(font)        # ensure a valid, installable TTF

    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    font.save(out)
    return w


def fix_maxp_for_glyf(font):
    """A glyf-based TTF needs maxp v1.0 with all fields populated. Bases that
    were converted from CFF keep maxp v0.5, which macOS rejects ('contains no
    fonts which can be installed'). Upgrade + populate here.

    All our glyphs are decomposed (simple, no components), so composite maxima
    are 0 and we can compute point/contour maxima directly from coordinates."""
    if "glyf" not in font or "maxp" not in font:
        return
    glyf = font["glyf"]
    maxPoints = maxContours = 0
    for name in glyf.keys():
        g = glyf[name]
        if getattr(g, "numberOfContours", 0) > 0:
            maxContours = max(maxContours, g.numberOfContours)
            maxPoints = max(maxPoints, len(getattr(g, "coordinates", [])))
    maxp = font["maxp"]
    maxp.tableVersion          = 0x00010000
    maxp.numGlyphs             = len(glyf.glyphs)
    maxp.maxPoints             = maxPoints
    maxp.maxContours           = maxContours
    maxp.maxCompositePoints    = 0
    maxp.maxCompositeContours  = 0
    maxp.maxZones              = 1
    maxp.maxTwilightPoints     = 0
    maxp.maxStorage            = 0
    maxp.maxFunctionDefs       = 0
    maxp.maxInstructionDefs    = 0
    maxp.maxStackElements      = 0
    maxp.maxSizeOfInstructions = 0
    maxp.maxComponentElements  = 0
    maxp.maxComponentDepth     = 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base",        choices=list(BASE_FILES))
    ap.add_argument("--weight",      type=int,   default=400)
    ap.add_argument("--round",       type=int,   default=0,   dest="round_iters")
    ap.add_argument("--slant",       type=float, default=0.0)
    ap.add_argument("--width",       type=float, default=1.0)
    ap.add_argument("--contrast",    type=float, default=0.0)
    ap.add_argument("--embolden",    type=float, default=0.0,
                    help="outline dilation in font units (plump/שמנמן); ~18-26 = chubby")
    ap.add_argument("--liga",        action="store_true")
    ap.add_argument("--curl-lamed",  action="store_true", dest="curl_lamed",
                    help="exaggerated curly flourish on the lamed (ל)")
    ap.add_argument("--handwriting", action="store_true",
                    help="preset: dana-yad base + round=2 slant=5 contrast=0.18 liga")
    ap.add_argument("--name",        required=True, dest="family")
    ap.add_argument("--style",       default="Regular")
    ap.add_argument("--out",         required=True)
    a = ap.parse_args()

    # Apply handwriting preset first, then let explicit flags override
    if a.handwriting:
        hd = HANDWRITING_DEFAULTS
        if not a.base:       a.base        = hd["base"]
        if a.round_iters==0: a.round_iters = hd["round_iters"]
        if a.slant==0.0:     a.slant       = hd["slant"]
        if a.contrast==0.0:  a.contrast    = hd["contrast"]
        if not a.liga:       a.liga        = hd["liga"]

    if not a.base:
        ap.error("--base is required (or use --handwriting for dana-yad preset)")

    w = build(a.base, a.weight, a.round_iters, a.slant, a.width,
              a.contrast, a.liga, a.embolden, a.curl_lamed,
              a.family, a.style, a.out)
    print(f"OK base={a.base} wght={w} round={a.round_iters} slant={a.slant} "
          f"width={a.width} contrast={a.contrast} embolden={a.embolden} "
          f"liga={a.liga} curl_lamed={a.curl_lamed} -> {a.out}")


if __name__ == "__main__":
    main()
