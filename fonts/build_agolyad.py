#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AgolYad — an original rounded Hebrew handwriting font.
Each glyph is defined as a center-line skeleton; the outline is built by
stamping overlapping circles along the skeleton (monoline + round caps).
Open counters (samekh, final mem, pe...) arise naturally because the
center has zero winding. Two weights via two stroke radii.
"""
import math, os
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

UPM = 1000
# layout anchors
L, R, CX = 130, 460, 295
T, M, B = 670, 350, 30
DESC = -210
ASC = 880

# ---- skeleton primitives -------------------------------------------------
def sample_path(cmds):
    """cmds: list of ('M'|'L'|'Q', pts...). Return polyline of points."""
    pts = []
    cur = None
    for c in cmds:
        k = c[0]
        if k == 'M':
            cur = c[1]; pts.append(cur)
        elif k == 'L':
            p = c[1]
            for i in range(1, 13):
                t = i / 12
                pts.append((cur[0]+(p[0]-cur[0])*t, cur[1]+(p[1]-cur[1])*t))
            cur = p
        elif k == 'Q':
            ctrl, p = c[1], c[2]
            for i in range(1, 17):
                t = i / 16
                x = (1-t)**2*cur[0] + 2*(1-t)*t*ctrl[0] + t*t*p[0]
                y = (1-t)**2*cur[1] + 2*(1-t)*t*ctrl[1] + t*t*p[1]
                pts.append((x, y))
            cur = p
    return pts

def resample(pts, step):
    if not pts: return []
    out = [pts[0]]
    acc = 0.0
    for i in range(1, len(pts)):
        x0, y0 = out[-1]
        x1, y1 = pts[i]
        d = math.hypot(x1-x0, y1-y0)
        if d == 0: continue
        n = max(1, int(d / step))
        for j in range(1, n+1):
            t = j / n
            out.append((x0+(x1-x0)*t, y0+(y1-y0)*t))
    return out

def circle(cx, cy, r, segs=16):
    return [(round(cx + r*math.cos(2*math.pi*k/segs)),
             round(cy + r*math.sin(2*math.pi*k/segs))) for k in range(segs)]

SLANT = 0.11   # rightward lean -> handwriting italic
def humanize(pts, seed):
    """Add slant + gentle waviness so straight strokes read as hand-drawn."""
    out = []
    for (x, y) in pts:
        nx = x + (y - B) * SLANT + 6.0*math.sin(y/95.0 + seed)
        ny = y + 4.0*math.sin(x/110.0 + seed*1.7)
        out.append((nx, ny))
    return out

# ---- glyph skeletons (each = list of strokes; stroke = list of cmds) -----
G = {}
G['space'] = []

G['alef'] = [
    [('M',(R-20,T)),('L',(L+20,B))],
    [('M',(R,M+200)),('Q',(R-30,M+90),(CX+20,M+30))],
    [('M',(CX-20,M-30)),('Q',(L+60,B+120),(L,B))],
]
G['bet'] = [
    [('M',(L+20,T)),('L',(R-40,T)),('Q',(R,T),(R,T-55)),('L',(R,B+15))],
    [('M',(R+45,B)),('L',(L+10,B))],
]
G['gimel'] = [
    [('M',(CX+10,T)),('Q',(CX-40,M),(L+50,B+50))],
    [('M',(CX,M-10)),('L',(R-30,B))],
]
G['dalet'] = [
    [('M',(L-10,T)),('L',(R+10,T))],
    [('M',(R-30,T)),('L',(R-45,B))],
]
G['he'] = [
    [('M',(L-10,T)),('L',(R,T))],
    [('M',(R-25,T)),('L',(R-40,B))],
    [('M',(L+50,M+60)),('L',(L+30,B))],
]
G['vav'] = [
    [('M',(CX-40,T)),('L',(CX+40,T))],
    [('M',(CX+5,T)),('L',(CX-5,B))],
]
G['zayin'] = [
    [('M',(CX-55,T)),('L',(CX+55,T))],
    [('M',(CX),) if False else ('M',(CX,T)),('L',(CX-10,B))],
]
G['het'] = [
    [('M',(L,T+5)),('L',(R,T+5))],
    [('M',(L+12,T)),('L',(L+12,B))],
    [('M',(R-12,T)),('L',(R-12,B))],
]
G['tet'] = [
    [('M',(L,T)),('L',(L,B+50)),('Q',(L,B),(L+60,B)),('L',(R-50,B)),('Q',(R,B),(R,B+60)),('L',(R,T-30))],
    [('M',(CX+55,T)),('Q',(CX+55,M+30),(CX+5,M+10))],
]
G['yod'] = [
    [('M',(CX-25,T)),('Q',(CX+35,T+5),(CX+18,T-120))],
]
G['kaf'] = [
    [('M',(R,T)),('L',(L+45,T)),('Q',(L,T),(L,T-65)),('L',(L,B+65)),('Q',(L,B),(L+45,B)),('L',(R,B))],
]
G['kaf_final'] = [
    [('M',(L,T)),('L',(R-35,T)),('Q',(R,T),(R,T-65)),('L',(R,DESC))],
]
G['lamed'] = [
    [('M',(L+30,ASC)),('Q',(R+10,ASC-110),(R-30,M)),('L',(R-55,B))],
    [('M',(L-10,B)),('L',(R-25,B))],
]
G['mem'] = [
    [('M',(CX+40,T)),('L',(L+40,T)),('Q',(L,T),(L,M+50)),('L',(L+10,B)),('L',(R,B))],
    [('M',(R,T-20)),('L',(R,B+10))],
]
G['mem_final'] = [
    [('M',(L+45,B)),('L',(R-45,B)),('Q',(R,B),(R,B+55)),('L',(R,T-55)),('Q',(R,T),(R-45,T)),
     ('L',(L+45,T)),('Q',(L,T),(L,T-55)),('L',(L,B+55)),('Q',(L,B),(L+45,B))],
]
G['nun'] = [
    [('M',(CX+35,T)),('L',(CX+35,B+40)),('Q',(CX+35,B),(CX+85,B)),('L',(R+5,B))],
    [('M',(CX+5,T)),('L',(CX+70,T))],
]
G['nun_final'] = [
    [('M',(CX,T)),('L',(CX-5,DESC))],
    [('M',(CX-45,T)),('L',(CX+30,T))],
]
G['samekh'] = [
    [('M',(CX,T)),('Q',(L-5,T),(L-5,M)),('Q',(L-5,B),(CX,B)),('Q',(R+5,B),(R+5,M)),('Q',(R+5,T),(CX,T))],
]
G['ayin'] = [
    [('M',(L+15,T)),('Q',(L-5,M+30),(CX-5,M))],
    [('M',(CX-5,M)),('L',(R,B))],
    [('M',(R+5,T)),('L',(CX,M+5))],
]
G['pe'] = [
    [('M',(L,T)),('L',(R-40,T)),('Q',(R,T),(R,T-60)),('L',(R,B+60)),('Q',(R,B),(R-40,B)),('L',(L,B))],
    [('M',(R-35,T-35)),('Q',(CX+30,M+40),(CX+70,M+5))],
]
G['pe_final'] = [
    [('M',(L,T)),('L',(R-40,T)),('Q',(R,T),(R,T-60)),('L',(R,DESC))],
    [('M',(R-35,T-35)),('Q',(CX+20,M+45),(CX+55,M+15))],
]
G['tsadi'] = [
    [('M',(L+10,T)),('Q',(CX-35,M+35),(CX+5,M))],
    [('M',(R+5,T)),('L',(CX+5,M)),('L',(CX+5,B+35)),('Q',(CX+5,B),(R-15,B+15))],
]
G['tsadi_final'] = [
    [('M',(L+10,T)),('Q',(CX-35,M+35),(CX+5,M))],
    [('M',(R+5,T)),('L',(CX+5,M)),('L',(CX-10,DESC))],
]
G['qof'] = [
    [('M',(L+15,T)),('L',(R,T)),('Q',(R+15,T),(R+5,M+40)),('L',(R-15,B))],
    [('M',(L+45,T-35)),('L',(L+45,DESC))],
]
G['resh'] = [
    [('M',(L,T)),('L',(R-30,T)),('Q',(R,T),(R,T-70)),('L',(R-10,B))],
]
G['shin'] = [
    [('M',(L,T)),('Q',(L+10,M),(CX-20,B+10))],
    [('M',(CX,T)),('Q',(CX,M+30),(CX-25,B+15))],
    [('M',(R,T)),('Q',(R+5,M),(CX+15,B+5))],
    [('M',(L+15,B)),('L',(R-15,B))],
]
G['tav'] = [
    [('M',(L,T+5)),('L',(R,T+5))],
    [('M',(R-12,T)),('L',(R-12,B))],
    [('M',(L+15,T)),('L',(L+15,B+45)),('Q',(L+15,B),(L+65,B))],
]

# unicode mapping
UNI = {
 'alef':0x05D0,'bet':0x05D1,'gimel':0x05D2,'dalet':0x05D3,'he':0x05D4,'vav':0x05D5,
 'zayin':0x05D6,'het':0x05D7,'tet':0x05D8,'yod':0x05D9,'kaf_final':0x05DA,'kaf':0x05DB,
 'lamed':0x05DC,'mem_final':0x05DD,'mem':0x05DE,'nun_final':0x05DF,'nun':0x05E0,
 'samekh':0x05E1,'ayin':0x05E2,'pe_final':0x05E3,'pe':0x05E4,'tsadi_final':0x05E5,
 'tsadi':0x05E6,'qof':0x05E7,'resh':0x05E8,'shin':0x05E9,'tav':0x05EA,'space':0x0020,
}

def build(weight_name, r, outpath):
    glyph_order = ['.notdef'] + list(G.keys())
    glyphs = {}
    advances = {}

    # .notdef simple box
    pen = TTGlyphPen(None)
    for (x,y) in [(80,0),(80,700),(460,700),(460,0)]:
        pass
    pen.moveTo((80,0)); pen.lineTo((80,700)); pen.lineTo((460,700)); pen.lineTo((460,0)); pen.closePath()
    pen.moveTo((140,60)); pen.lineTo((400,60)); pen.lineTo((400,640)); pen.lineTo((140,640)); pen.closePath()
    glyphs['.notdef'] = pen.glyph()
    advances['.notdef'] = (540, 80)

    step = max(7, r*0.6)
    for gi, (name, strokes) in enumerate(G.items()):
        pen = TTGlyphPen(None)
        maxx, minx = -9999, 9999
        seed = (gi * 1.3) % 6.28
        if not strokes:
            glyphs[name] = pen.glyph()
            advances[name] = (360, 0)
            continue
        polys = [humanize(resample(sample_path(st), step), seed) for st in strokes]
        rawmin = min(cx - r for poly in polys for (cx, cy) in poly)
        dx = 60 - rawmin   # keep a consistent left side bearing
        for poly in polys:
            for (cx, cy) in poly:
                px = cx + dx
                maxx = max(maxx, px + r); minx = min(minx, px - r)
                ring = circle(px, cy, r)
                pen.moveTo(ring[0])
                for p in ring[1:]:
                    pen.lineTo(p)
                pen.closePath()
        glyphs[name] = pen.glyph()
        lsb = max(0, int(minx))
        adv = int(maxx + r + 55)
        adv = max(adv, 360)
        advances[name] = (adv, lsb)

    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(glyph_order)
    fb.setupCharacterMap({UNI[n]: n for n in G.keys()})
    fb.setupGlyf(glyphs)
    metrics = {g: advances[g] for g in glyph_order}
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=900, descent=-260)
    family = "AgolYad"
    sub = weight_name
    name_strings = dict(
        familyName=family, styleName=sub,
        uniqueFontIdentifier=f"AgolYad-{sub}-1.0",
        fullName=f"{family} {sub}", version="Version 1.0",
        psName=f"AgolYad-{sub}",
    )
    fb.setupNameTable(name_strings)
    fb.setupOS2(sTypoAscender=720, sTypoDescender=-260, sTypoLineGap=120,
                usWinAscent=900, usWinDescent=260,
                usWeightClass=700 if sub=="Bold" else 400)
    fb.setupPost()
    os.makedirs(os.path.dirname(outpath), exist_ok=True)
    fb.save(outpath)
    return len(G)

here = os.path.dirname(os.path.abspath(__file__))
n1 = build("Regular", 33, os.path.join(here, "AgolYad-Regular.ttf"))
n2 = build("Bold", 60, os.path.join(here, "AgolYad-Bold.ttf"))
print(f"Built Regular ({n1} glyphs) + Bold ({n2} glyphs)")
