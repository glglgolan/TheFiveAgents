#!/usr/bin/env python3
"""Put the rendered website (screen.mp4) INTO a real laptop shot → 1080x1920 reel.

  python3 screen_insert.py <plate.png|mp4> <screen.mp4> <out.mp4> (--auto-green | --corners "x,y x,y x,y x,y")
          [--push 0.035] [--drift 0,-12] [--reflect 0.06] [--fps 24] [--stills 0,60,120]

plate   : the laptop shot. Best: generated with a PURE GREEN (#00FF00) screen → --auto-green finds the
          4 corners exactly and removes spill. Otherwise pass corners TL TR BR BL in plate pixels.
          A still plate gets a slow code camera move (--push zoom over the whole duration, --drift px).
realism : screen is pinned with a homography (cv2), softened (σ0.6), slightly lowered in contrast,
          given an edge falloff and a faint diagonal room reflection so it sits IN the room.
"""
import argparse, os, subprocess, sys
import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
FF = os.path.join(HERE, "../../kinetic-typography/.venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1")
OW, OH = 1080, 1920


def order(pts):
    pts = np.array(pts, np.float32)
    s, d = pts.sum(1), np.diff(pts, axis=1).ravel()
    return np.array([pts[np.argmin(s)], pts[np.argmin(d)], pts[np.argmax(s)], pts[np.argmax(d)]], np.float32)


def green_corners(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    m = cv2.inRange(hsv, (40, 90, 70), (85, 255, 255))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cs: sys.exit("no green screen found — pass --corners")
    c = max(cs, key=cv2.contourArea)
    peri = cv2.arcLength(c, True)
    for eps in (0.01, 0.02, 0.03, 0.05):
        ap = cv2.approxPolyDP(c, eps * peri, True)
        if len(ap) == 4: return order(ap.reshape(4, 2)), m
    return order(cv2.boxPoints(cv2.minAreaRect(c))), m


def expand(q, f):
    c = q.mean(0); return (c + (q - c) * (1 + f)).astype(np.float32)


def reader(path):
    cap = cv2.VideoCapture(path)
    while True:
        ok, f = cap.read()
        if not ok: break
        yield f


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("plate"); ap.add_argument("screen"); ap.add_argument("out")
    ap.add_argument("--auto-green", action="store_true"); ap.add_argument("--corners")
    ap.add_argument("--push", type=float, default=0.035); ap.add_argument("--drift", default="0,-10")
    ap.add_argument("--reflect", type=float, default=0.06); ap.add_argument("--fps", type=float, default=24)
    ap.add_argument("--stills", default="")
    a = ap.parse_args()

    still_plate = not a.plate.lower().endswith((".mp4", ".mov", ".webm"))
    plates = None if still_plate else list(reader(a.plate))
    base = cv2.imread(a.plate) if still_plate else plates[0]
    H0, W0 = base.shape[:2]
    if a.auto_green:
        quad, gmask = green_corners(base)
    elif a.corners:
        quad = order([tuple(map(float, p.split(","))) for p in a.corners.split()]); gmask = None
    else:
        sys.exit("need --auto-green or --corners")
    print("[screen_insert] corners TL,TR,BR,BL =", quad.round(1).tolist())
    quad_x = expand(quad, 0.004)

    cap = cv2.VideoCapture(a.screen); n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); sw, sh = int(cap.get(3)), int(cap.get(4))
    src = np.array([[0, 0], [sw, 0], [sw, sh], [0, sh]], np.float32)
    Hm = cv2.getPerspectiveTransform(src, quad_x)
    # screen-space realism maps (computed once)
    yy, xx = np.mgrid[0:sh, 0:sw].astype(np.float32)
    edge = np.minimum.reduce([xx, sw - xx, yy, sh - yy]) / (0.06 * min(sw, sh))
    falloff = (0.90 + 0.10 * np.clip(edge, 0, 1))[..., None]
    refl = (np.clip(1 - np.abs((xx / sw + yy / sh) - 0.55) / 0.35, 0, 1) ** 2)[..., None] * 255 * a.reflect
    mask = cv2.warpPerspective(np.full((sh, sw), 255, np.uint8), Hm, (W0, H0), flags=cv2.INTER_LINEAR)
    m3 = (mask.astype(np.float32) / 255)[..., None]
    spill = cv2.dilate(mask, np.ones((9, 9), np.uint8)) if gmask is not None else None

    dx, dy = map(float, a.drift.split(","))
    scale_cover = max(OW / W0, OH / H0)
    stills = {int(x) for x in a.stills.split(",") if x.strip()}
    proc = None if stills else subprocess.Popen([FF, "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{OW}x{OH}",
        "-r", str(a.fps), "-i", "-", "-i", a.screen, "-map", "0:v", "-map", "1:a?", "-c:v", "libx264", "-crf", "14", "-preset", "slow",
        "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", a.out], stdin=subprocess.PIPE)
    os.makedirs(os.path.join(os.path.dirname(os.path.abspath(a.out)), "_qa"), exist_ok=True)
    for i in range(n):
        ok, s = cap.read()
        if not ok: break
        if stills and i not in stills: continue
        plate = (base if still_plate else plates[min(i, len(plates) - 1)]).copy()
        if spill is not None:  # kill green fringe on the bezel
            b, g, r = cv2.split(plate); g2 = np.minimum(g, np.maximum(r, b)); plate = np.where(spill[..., None] > 0, cv2.merge([b, g2, r]), plate)
        sf = s.astype(np.float32)
        sf = cv2.GaussianBlur(sf, (0, 0), 0.6)
        sf = (sf - 128) * 0.94 + 128 - 4
        sf = np.clip(sf * falloff + refl, 0, 255)
        warped = cv2.warpPerspective(sf, Hm, (W0, H0), flags=cv2.INTER_LINEAR)
        comp = plate.astype(np.float32) * (1 - m3) + warped * m3
        # code camera: slow push-in + drift, then cover-crop to 9:16
        u = i / max(1, n - 1); e = u * u * (3 - 2 * u)
        sc = scale_cover * (1 + a.push * e)
        M = np.array([[sc, 0, OW / 2 - sc * W0 / 2 + dx * e], [0, sc, OH / 2 - sc * H0 / 2 + dy * e]], np.float32)
        out = cv2.warpAffine(np.clip(comp, 0, 255).astype(np.uint8), M, (OW, OH), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
        if stills:
            p = os.path.join(os.path.dirname(os.path.abspath(a.out)), "_qa", f"insert_{i}.jpg"); cv2.imwrite(p, out); print("[still]", p)
        else:
            proc.stdin.write(out.tobytes())
    if proc:
        proc.stdin.close(); proc.wait(); print("[screen_insert]", a.out)


if __name__ == "__main__":
    main()
