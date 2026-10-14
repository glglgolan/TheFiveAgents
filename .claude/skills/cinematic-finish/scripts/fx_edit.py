#!/usr/bin/env python3
"""cinematic-finish — code-only picture finishing pass (no generative models). Reference: MELT (surreal-ads, 2026-10-09).

Builds the 15s 9:16 plate from the four Kling clips with:
  * speed ramp after the screen crack (optical-flow interpolation, DIS)
  * impact: punch-in zoom, decaying shake, flash frame, chromatic aberration, radial blur
  * glass shards cut from the crack itself, refracting the live plate, flying toward camera
  * whip-pan over the S3 morph, then slow drift on the clean macro
  * one grade for the whole film: filmic curve, warmth, halation, vignette, grain

Usage (from the run dir):  python3 <skill>/scripts/fx_edit.py [--stills N ...]  →  final.mp4 (previous kept as final_prefx.mp4)
Per-ad values go in <run>/fx/fx_config.json (any of: T0, CX, CY, SLOW_A, SLOW_B, SLOW_SPEED, WHIP_OUT, WHIP_MID,
WHIP_IN, S3_CLEAN). Assumes the series 4-clip layout videos/s01..s04 = 4s/4s/3s/4s (edit source_for() otherwise).
"""
import math
import os
import subprocess
import sys

import cv2
import numpy as np

RUN = os.getcwd()
FF = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../kinetic-typography/.venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1')
W, H, FPS = 1080, 1920, 24
DUR = 15.0

# crack impact (output coords / seconds) — measured from s01 frame-diff spike (frame 55 → 2.29s)
T0 = 2.29
CX, CY = 705, 1036
SLOW_A, SLOW_B, SLOW_SPEED = 2.30, 3.30, 0.40
WHIP_OUT, WHIP_MID, WHIP_IN = 8.75, 8.95, 9.20
S3_CLEAN = 2.25          # s03 source time where the macro is clean again

_cfg = os.path.join(RUN, 'fx', 'fx_config.json')
if os.path.exists(_cfg):
    import json
    globals().update({k: v for k, v in json.load(open(_cfg)).items() if k.isupper()})


def load(path):
    cap = cv2.VideoCapture(path)
    out = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        # same framing as concat.sh: scale to cover 1080x1920, centre crop
        h, w = f.shape[:2]
        s = max(W / w, H / h)
        f = cv2.resize(f, (round(w * s), round(h * s)), interpolation=cv2.INTER_LANCZOS4)
        y0, x0 = (f.shape[0] - H) // 2, (f.shape[1] - W) // 2
        out.append(f[y0:y0 + H, x0:x0 + W].copy())
    return out


CLIPS = {k: load(os.path.join(RUN, f'videos/{k}.mp4')) for k in ('s01', 's02', 's03', 's04')}
_dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
_flow_cache = {}


def flow_pair(clip, i):
    key = (clip, i)
    if key not in _flow_cache:
        a, b = CLIPS[clip][i], CLIPS[clip][i + 1]
        ga = cv2.cvtColor(cv2.resize(a, (W // 2, H // 2)), cv2.COLOR_BGR2GRAY)
        gb = cv2.cvtColor(cv2.resize(b, (W // 2, H // 2)), cv2.COLOR_BGR2GRAY)
        fab = cv2.resize(_dis.calc(ga, gb, None), (W, H)) * 2
        fba = cv2.resize(_dis.calc(gb, ga, None), (W, H)) * 2
        _flow_cache[key] = (fab, fba)
    return _flow_cache[key]


_gx, _gy = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))


def sample(clip, s):
    """Frame at fractional source time s (seconds), optical-flow interpolated."""
    fr = CLIPS[clip]
    p = min(max(s * FPS, 0), len(fr) - 1.0001)
    i, a = int(p), p - int(p)
    if a < 0.03:
        return fr[i].copy()
    if a > 0.97:
        return fr[i + 1].copy()
    fab, fba = flow_pair(clip, i)
    wa = cv2.remap(fr[i], _gx - fba[..., 0] * a, _gy - fba[..., 1] * a, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    wb = cv2.remap(fr[i + 1], _gx - fab[..., 0] * (1 - a), _gy - fab[..., 1] * (1 - a), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return cv2.addWeighted(wa, 1 - a, wb, a, 0)


def source_for(t):
    """Output time → (clip, source time, whip phase)."""
    if t < 4.0:                                   # S1 with speed ramp
        if t < SLOW_A:
            s = t
        elif t < SLOW_B:
            s = SLOW_A + (t - SLOW_A) * SLOW_SPEED
        else:
            s0 = SLOW_A + (SLOW_B - SLOW_A) * SLOW_SPEED
            u = (t - SLOW_B) / (4.0 - SLOW_B)
            s = s0 + (3.99 - s0) * (SLOW_SPEED * u + (1 - SLOW_SPEED) * u ** 2.2)
        return 's01', s, None
    if t < 8.0:
        return 's02', t - 4.0, None
    if t < 11.0:                                  # S3: clean start → whip → slow clean macro
        if t < WHIP_MID:
            return 's03', t - 8.0, ('out', (t - WHIP_OUT) / (WHIP_MID - WHIP_OUT)) if t >= WHIP_OUT else None
        u = (t - WHIP_MID) / (11.0 - WHIP_MID)
        s = S3_CLEAN + (3.0 - 1 / FPS - S3_CLEAN) * u
        return 's03', s, ('in', (t - WHIP_MID) / (WHIP_IN - WHIP_MID)) if t < WHIP_IN else None
    return 's04', t - 11.0, None


# ---------------------------------------------------------------- impact
def impact(img, t):
    dt = t - T0
    if dt < -0.04 or dt > 0.9:
        return img
    k = math.exp(-max(dt, 0) / 0.12) if dt >= 0 else (dt + 0.04) / 0.04 * 0.4
    zoom = 1 + 0.07 * k
    sh = 16 * math.exp(-max(dt, 0) / 0.2) if dt >= 0 else 0
    ox = sh * math.sin(2 * math.pi * 17 * dt + 0.7)
    oy = sh * math.sin(2 * math.pi * 13 * dt + 2.1)
    rot = 0.5 * math.exp(-max(dt, 0) / 0.2) * math.sin(2 * math.pi * 9 * dt)
    M = cv2.getRotationMatrix2D((CX, CY), rot, zoom)
    M[0, 2] += ox
    M[1, 2] += oy
    img = cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    # radial blur toward the crack
    b = 0.035 * math.exp(-max(dt, 0) / 0.09) if dt >= 0 else 0
    if b > 0.004:
        acc = img.astype(np.float32)
        for j in range(1, 6):
            Mz = cv2.getRotationMatrix2D((CX, CY), 0, 1 + b * j / 5)
            acc += cv2.warpAffine(img, Mz, (W, H), borderMode=cv2.BORDER_REFLECT)
        img = (acc / 6).astype(np.uint8)
    # chromatic aberration
    c = 7 * math.exp(-max(dt, 0) / 0.14) if dt >= 0 else 0
    if c > 0.5:
        bch, g, r = cv2.split(img)
        r = cv2.warpAffine(r, cv2.getRotationMatrix2D((CX, CY), 0, 1 + c / 900), (W, H), borderMode=cv2.BORDER_REFLECT)
        bch = cv2.warpAffine(bch, cv2.getRotationMatrix2D((CX, CY), 0, 1 - c / 900), (W, H), borderMode=cv2.BORDER_REFLECT)
        img = cv2.merge([bch, g, r])
    # flash frame(s)
    if 0 <= dt < 2 / FPS:
        f = 0.38 if dt < 1 / FPS else 0.12
        img = cv2.addWeighted(img, 1 - f, np.full_like(img, 255), f, 0)
    return img


# ---------------------------------------------------------------- shards
rng = np.random.default_rng(11)


def build_shards():
    sub = cv2.Subdiv2D((0, 0, W, H))
    pts = []
    while len(pts) < 90:
        a, r = rng.uniform(0, 2 * math.pi), 330 * math.sqrt(rng.uniform(0, 1))
        x, y = CX + r * math.cos(a), CY + 0.85 * r * math.sin(a)
        if 5 < x < W - 5 and 5 < y < H - 5:
            pts.append((float(x), float(y)))
    for p in pts:
        sub.insert(p)
    facets, centers = sub.getVoronoiFacetList([])
    shards = []
    for poly, c in zip(facets, centers):
        poly = np.array(poly, np.float32)
        area = cv2.contourArea(poly)
        d = math.hypot(c[0] - CX, c[1] - CY)
        if not (300 < area < 9000) or d > 300:
            continue
        rel = poly - np.array(c, np.float32)
        rel *= rng.uniform(0.55, 0.85)      # shards are smaller than the cells → gaps
        ang = math.atan2(c[1] - CY, c[0] - CX)
        shards.append(dict(
            c=np.array(c, np.float32), rel=rel,
            dir=np.array([math.cos(ang), math.sin(ang)], np.float32),
            v=rng.uniform(260, 700), vz=rng.uniform(0.9, 2.3), screen=rng.uniform() < 0.6,
            w=rng.uniform(-7, 7), psi=rng.uniform(5, 13) * rng.choice([-1, 1]),
            phase=rng.uniform(0, math.pi), delay=rng.uniform(0, 0.06)))
    return shards[:34]


SHARDS = build_shards()
IMPACT_PLATE = None


def shard_state(sh, tau):
    tau = tau - sh['delay']
    if tau <= 0:
        return None
    z = 1 - sh['vz'] * tau
    if z < 0.22:
        return None
    sc = 1 / z
    pos = np.array([CX, CY], np.float32) + (sh['c'] - [CX, CY] + sh['dir'] * sh['v'] * tau) * sc
    pos[1] += 0.5 * 700 * tau * tau
    th = sh['w'] * tau
    phi = sh['phase'] + sh['psi'] * tau
    R = np.array([[math.cos(th), -math.sin(th)], [math.sin(th), math.cos(th)]], np.float32)
    rel = sh['rel'] * [max(abs(math.cos(phi)), 0.12), 1.0]
    q = (rel @ R.T) * sc + pos
    alpha = min(1.0, tau / 0.05) * (1 - max(0.0, (sc - 2.6) / 1.9))
    return q, sc, phi, max(0.0, min(1.0, alpha))


def draw_shards(img, s):
    tau0 = s - T0
    if tau0 < 0 or tau0 > 1.2:
        return img
    out = img.astype(np.float32)
    for sh in SHARDS:
        for sub in (0.0, -0.012, -0.024):            # 3 sub-steps = motion blur
            st = shard_state(sh, tau0 + sub)
            if st is None:
                continue
            q, sc, phi, alpha = st
            alpha /= 3
            x0, y0 = np.floor(q.min(0)).astype(int) - 12
            x1, y1 = np.ceil(q.max(0)).astype(int) + 12
            x0, y0, x1, y1 = max(x0, 0), max(y0, 0), min(x1, W), min(y1, H)
            if x1 - x0 < 3 or y1 - y0 < 3:
                continue
            m = np.zeros((y1 - y0, x1 - x0), np.float32)
            cv2.fillPoly(m, [np.round((q - [x0, y0]) * 4).astype(np.int32)], 1.0, cv2.LINE_AA, shift=2)
            sig = 0.5 + 1.4 * max(0, sc - 1)              # defocus as it nears the lens
            m = cv2.GaussianBlur(m, (0, 0), sig)
            # refraction: the shard shows the plate displaced + slightly brighter/cooler
            off = 9 * sc
            sx0 = int(np.clip(x0 + off * math.cos(phi), 0, W - (x1 - x0)))
            sy0 = int(np.clip(y0 + off * math.sin(phi), 0, H - (y1 - y0)))
            if sh['screen']:
                src = (sh['rel'] * [max(abs(math.cos(phi)), 0.12), 1.0]) + sh['c']
                A = cv2.getAffineTransform(src[:3].astype(np.float32), (q[:3] - [x0, y0]).astype(np.float32))
                ref = cv2.warpAffine(IMPACT_PLATE, A, (x1 - x0, y1 - y0), borderMode=cv2.BORDER_REFLECT).astype(np.float32)
                ref = cv2.GaussianBlur(ref, (0, 0), sig * 0.7) * (0.9 + 0.35 * abs(math.sin(phi))) + 4
            else:
                ref = out[sy0:sy0 + (y1 - y0), sx0:sx0 + (x1 - x0)].copy()
                ref = cv2.GaussianBlur(ref, (0, 0), sig * 0.7) * [1.16, 1.13, 1.10] + 10
            roi = out[y0:y1, x0:x1]
            a = (m * alpha)[..., None]
            roi[:] = roi * (1 - a) + ref * a
            # edge highlight + specular glint
            e = np.zeros_like(m)
            cv2.polylines(e, [np.round((q - [x0, y0]) * 4).astype(np.int32)], True, 1.0, max(1, int(sc)), cv2.LINE_AA, shift=2)
            e = cv2.GaussianBlur(e, (0, 0), 0.6 + sig * 0.5)
            spec = 0.45 + 0.55 * abs(math.sin(phi)) ** 6
            ed = cv2.GaussianBlur(e, (0, 0), 1.2 + sig)
            roi[:] = roi * (1 - (ed * alpha * 0.35)[..., None])                 # dark refracted rim
            roi[:] = roi + (e * alpha * spec * 300)[..., None] * [0.95, 0.98, 1.0]   # bright edge glint
    return np.clip(out, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------- whip
def whip(img, phase):
    kind, u = phase
    u = min(max(u, 0), 1)
    k = u if kind == 'out' else 1 - u
    k = k * k * (3 - 2 * k)
    L = int(1 + 170 * k) | 1
    shift = (-1 if kind == 'out' else 1) * 340 * k
    M = np.float32([[1 + 0.04 * k, 0, -W * 0.02 * k], [0, 1 + 0.04 * k, shift - H * 0.02 * k]])
    img = cv2.warpAffine(img, M, (W, H), borderMode=cv2.BORDER_REFLECT)
    if L > 1:
        ker = np.zeros((L, 1), np.float32)
        ker[:] = 1.0 / L
        img = cv2.filter2D(img, -1, ker, borderType=cv2.BORDER_REFLECT)
    return img


# ---------------------------------------------------------------- grade
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
_r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / math.sqrt(2)
VIGNETTE = (1 - 0.24 * _r ** 2.2)[..., None]
grng = np.random.default_rng(5)


def grade(img):
    x = img.astype(np.float32) / 255
    x = x * [0.97, 1.0, 1.035]                           # warmth (BGR)
    x = 0.5 + (x - 0.5) * 1.06                           # contrast
    x = np.clip(x, 0, 1)
    x = x - 0.08 * x * (1 - x) * (1 - 2 * x)             # gentle s-curve
    x = 0.018 + x * 0.975 + [0.0, 0.004, 0.010]          # warm lifted blacks
    lum = x[..., 0] * 0.114 + x[..., 1] * 0.587 + x[..., 2] * 0.299
    hi = np.clip((lum - 0.72) / 0.28, 0, 1)
    hs = cv2.resize(hi, (W // 4, H // 4))
    hs = cv2.GaussianBlur(hs, (0, 0), 7)
    hal = cv2.resize(hs, (W, H))[..., None] * [0.05, 0.11, 0.22]
    x = x + hal
    x = x * VIGNETTE
    n = grng.normal(0, 0.022, (H // 2, W // 2)).astype(np.float32)
    n = cv2.resize(n, (W, H), interpolation=cv2.INTER_LINEAR)
    x = x + (n * (0.55 + 0.45 * (1 - lum)))[..., None]
    return np.clip(x * 255, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------- render
def render(out_path, only=None):
    frames = range(int(DUR * FPS)) if only is None else only
    if only is None:
        p = subprocess.Popen([FF, '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}',
                              '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14',
                              '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out_path], stdin=subprocess.PIPE)
    for n in frames:
        t = n / FPS
        clip, s, ph = source_for(t)
        img = sample(clip, s)
        if clip == 's01':
            global IMPACT_PLATE
            if IMPACT_PLATE is None:
                IMPACT_PLATE = CLIPS['s01'][int(round(T0 * FPS))].copy()
            img = draw_shards(img, s)
            img = impact(img, t)
        if ph:
            img = whip(img, ph)
        img = grade(img)
        if only is None:
            p.stdin.write(img.tobytes())
            if n % 24 == 0:
                print(f'  {t:5.1f}s', flush=True)
        else:
            cv2.imwrite(out_path.replace('%d', str(n)), img)
    if only is None:
        p.stdin.close()
        p.wait()


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--stills':
        render(os.path.join(RUN, '_qa/fx_%d.jpg'), only=[int(a) for a in sys.argv[2:]])
    else:
        final = os.path.join(RUN, 'final.mp4')
        if os.path.exists(final) and not os.path.exists(os.path.join(RUN, 'final_prefx.mp4')):
            os.rename(final, os.path.join(RUN, 'final_prefx.mp4'))
        render(final)
        print('[fx] final.mp4')
