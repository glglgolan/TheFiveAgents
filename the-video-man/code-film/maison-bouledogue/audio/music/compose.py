#!/usr/bin/env python3
"""
MAISON BOULEDOGUE -- original score, 60.000 s, 48 kHz stereo, frame-locked (24 fps, 120 BPM,
12 frames per beat).  Every sample is synthesized in synth.py -- no samples, no ML.

    python3 audio/music/compose.py      -> public/audio/music.wav (+ public/audio/music_stems/*.wav)
"""
import os
import sys
import json
import time
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy.signal import fftconvolve

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from synth import *  # noqa

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'public', 'audio', 'music.wav')
STEM_DIR = os.path.join(ROOT, 'public', 'audio', 'music_stems')
BUSES = ('drums', 'bass', 'keys', 'brass', 'fx')
h = 2.0 / 3.0          # swung off-beat (triplet swing: 8 frames after the beat)
BEAT = 0.5             # seconds per beat
TARGET_LUFS = -16.0
CEIL_DB = -1.8

HALL = freeverb_ir(0.86, 0.28, 3.2, 0.025)
ROOM = freeverb_ir(0.45, 0.45, 1.1, 0.006)


# ======================================================================= mix container
class Mix:
    """Stereo bus buffers for a frame range, with hall/room reverb sends."""

    def __init__(self, f0, f1):
        self.f0, self.f1 = f0, f1
        self.s0 = S(f0)
        self.n = S(f1) - self.s0
        z = lambda: {b: np.zeros((2, self.n), np.float32) for b in BUSES}
        self.dry, self.hall, self.room = z(), z(), z()

    def add(self, bus, sig, frame, pan=0.0, gain=1.0, hall=0.0, room=0.0):
        sig = np.asarray(sig)
        if sig.ndim == 1:
            th = (pan + 1) * np.pi / 4
            st = np.stack([sig * np.cos(th), sig * np.sin(th)]) * np.sqrt(2)
        else:
            st = sig * np.array([[min(1.0, 1 - pan)], [min(1.0, 1 + pan)]])
        st = st * gain
        p = S(frame) - self.s0
        a, b = max(0, p), min(self.n, p + st.shape[1])
        if b <= a:
            return
        seg = st[:, a - p:b - p]
        self.dry[bus][:, a:b] += seg
        if hall:
            self.hall[bus][:, a:b] += seg * hall
        if room:
            self.room[bus][:, a:b] += seg * room

    def paste(self, src, sf0, sf1, dst_frame, proc=None, gain=1.0):
        """copy src[sf0:sf1] (all buses + sends) to dst_frame, optionally through proc((2,n))->(2,m)."""
        a, b = S(sf0) - src.s0, S(sf1) - src.s0
        for store_d, store_s in ((self.dry, src.dry), (self.hall, src.hall), (self.room, src.room)):
            for bus in BUSES:
                x = store_s[bus][:, a:b].astype(np.float64)
                if not np.any(x):
                    continue
                y = proc(x) if proc else x
                p = S(dst_frame) - self.s0
                lo, hi = max(0, p), min(self.n, p + y.shape[1])
                if hi > lo:
                    store_d[bus][:, lo:hi] += (y[:, lo - p:hi - p] * gain).astype(np.float32)

    def render(self):
        """dry + reverb returns per bus (reverb tails truncated at the segment end = hard cuts)."""
        out = {}
        for bus in BUSES:
            y = self.dry[bus].astype(np.float64)
            for send, ir in ((self.hall[bus], HALL), (self.room[bus], ROOM)):
                if np.any(send):
                    for c in range(2):
                        y[c] += fftconvolve(send[c].astype(np.float64), ir[c])[: self.n]
            out[bus] = y
        return out


# ======================================================================= harmony tables
CH = {
    'Dm': dict(bass=[38, 45, 41, 35], stab=[69, 74, 77]),
    'Bb': dict(bass=[34, 41, 38, 42], stab=[65, 70, 74]),
    'Gm': dict(bass=[43, 38, 46, 44], stab=[67, 70, 74]),
    'A7': dict(bass=[45, 40, 43, 37], stab=[67, 73, 76]),
    'Eb': dict(bass=[39, 46, 43, 44], stab=[67, 70, 75]),
    'D':  dict(bass=[38, 42, 45, 36], stab=[66, 69, 74]),
    'Bm': dict(bass=[35, 38, 42, 44], stab=[66, 71, 74]),
    'G':  dict(bass=[43, 47, 50, 44], stab=[67, 71, 74]),
}
HOOK = {  # (beat, midi, dur_beats) -- plucky synth hook, swung
    'Dm': [(0, 74, .5), (h, 77, .3), (1, 81, .6), (2, 79, .3), (2 + h, 77, .3), (3, 76, .6)],
    'Bb': [(0, 74, .5), (1, 77, .3), (1 + h, 74, .3), (2, 70, .8), (3 + h, 69, .3)],
    'Gm': [(0, 74, .3), (h, 79, .3), (1, 82, .6), (2, 81, .3), (2 + h, 79, .3), (3, 77, .6)],
    'A7': [(0, 76, .5), (1, 73, .3), (1 + h, 76, .3), (2, 79, .6), (3, 81, .3), (3 + h, 73, .3)],
    'Eb': [(0, 79, .5), (h, 75, .3), (1, 70, .6), (2, 72, .3), (2 + h, 75, .3), (3, 79, .6)],
    'D':  [(0, 74, .5), (h, 78, .3), (1, 81, .6), (2, 83, .3), (2 + h, 81, .3), (3, 78, .6)],
    'Bm': [(0, 74, .5), (1, 78, .3), (1 + h, 74, .3), (2, 71, .8), (3 + h, 73, .3)],
    'G':  [(0, 74, .3), (h, 79, .3), (1, 83, .6), (2, 81, .3), (2 + h, 79, .3), (3, 78, .6)],
}
MEL_B = [  # giraffe section: open trumpet line
    [(0, 74, 1.8), (2, 70, .6), (2 + h, 72, .3), (3, 74, .9)],
    [(0, 79, 1.8), (2, 77, .6), (2 + h, 75, .3), (3, 74, .9)],
    [(0, 73, .6), (1, 76, 0.9), (2, 79, .6), (2 + h, 81, .3), (3, 82, .5), (3 + h, 81, .3)],
]
MEL_DROP = [(0, 81, .9), (1, 78, .3), (1 + h, 81, .3), (2, 86, 1.2), (3 + h, 85, .3)]


# ======================================================================= voice helpers
def brass_chord(mx, notes, frame, dur, gain, muted=True, spread=0.6, hall=0.15, room=0.1, **kw):
    k = len(notes)
    for i, m in enumerate(notes):
        pan = ((i / (k - 1)) - 0.5) * 2 * spread if k > 1 else 0.0
        mx.add('brass', brass(m, round(dur, 3), muted, seed=int(m) + i, **kw), frame, pan,
               gain / np.sqrt(k), hall, room)


def tutti(mx, frame, notes, dur, gain=1.0, bass=None, crash_v=0.5, timp_m=38, kick_v=0.9):
    brass_chord(mx, notes, frame, dur, 0.9 * gain, muted=False, bright=0.9, spread=0.8, hall=0.25, vib=0.6)
    if bass is not None:
        mx.add('bass', upright(bass, 0.9, True), frame, 0, 0.9 * gain)
    if crash_v:
        mx.add('drums', crash(2.6, int(frame) % 5), frame, 0, crash_v * gain, hall=0.15)
    if timp_m:
        mx.add('drums', timp(timp_m, 1.6), frame, -0.2, 0.8 * gain, hall=0.25)
    if kick_v:
        mx.add('drums', kick(), frame, 0, kick_v * gain)


def snare_fill(mx, frames, v0, v1, gain=1.0):
    for i, f in enumerate(frames):
        v = v0 + (v1 - v0) * i / max(1, len(frames) - 1)
        mx.add('drums', snare(seed=i % 4), f, 0.1, v * gain, hall=0.1, room=0.15)


def roll(mx, kind, f0, f1, v0, v1, step, m=38, pan=0.0, curve=2.0, seed=0, hall=0.2):
    r = rng_for('roll', kind, f0, seed)
    f = float(f0)
    while f < f1:
        x = (f - f0) / max(1e-9, f1 - f0)
        v = v0 + (v1 - v0) * x ** curve
        sig = timp(m, 0.9) if kind == 'timp' else snare(seed=int(r.integers(0, 6)), soft=True)
        mx.add('drums', sig, f, pan + r.uniform(-0.05, 0.05), v * r.uniform(0.85, 1.0), hall=hall)
        f += step * r.uniform(0.9, 1.1)


def groove_bar(mx, bar, ch, o=None):
    """one 4/4 bar of the runway groove starting at frame `bar`. o = option dict."""
    o = o or {}
    g = o.get('gain', 1.0)
    lo, hi = o.get('span', (0, 4))
    inb = lambda b: lo <= b < hi
    C = CH[ch]
    fb = lambda b: bar + 12 * b
    # ---- drums
    for b in range(4):
        if o.get('kick', True) and b in o.get('kick_beats', (0, 1, 2, 3)) and inb(b):
            mx.add('drums', kick(), fb(b), 0, 0.95 * g * o.get('kickv', 1), room=0.04)
        if o.get('clap', True) and b in (1, 3) and inb(b):
            mx.add('drums', clap(b), fb(b), 0.05, 0.42 * g, hall=0.08, room=0.15)
            mx.add('drums', snare(seed=b), fb(b), -0.05, 0.18 * g, room=0.1)
        hv = o.get('hats', 0.2)
        if hv:
            if inb(b):
                mx.add('drums', hat(False, b), fb(b), 0.3, hv * 0.45 * g, room=0.08)
            if inb(b + h):
                op = (b == 3) and o.get('openhat', True)
                mx.add('drums', hat(op, b + 10), fb(b + h), 0.3, hv * g * (0.8 if op else 1.0), room=0.08)
    if o.get('clap', True) and inb(3 + h):
        mx.add('drums', snare(seed=9, soft=True), fb(3 + h), -0.1, 0.10 * g, room=0.1)
    # ---- bass
    if o.get('bass', True):
        line = o.get('bassline', C['bass'])
        for b, m in enumerate(line):
            if inb(b):
                mx.add('bass', upright(m, 0.44, o.get('slap', False), b), fb(b), 0, 0.8 * g * o.get('bassv', 1))
        if inb(2 + h):
            mx.add('bass', upright(line[2] + 12, 0.08, True, 5), fb(2 + h), 0, 0.3 * g * o.get('bassv', 1))
    # ---- hook
    if o.get('hook', True):
        hv = o.get('hookv', 1.0)
        for (b, m, d) in HOOK[ch]:
            if inb(b):
                mx.add('keys', spluck(m, round(d * BEAT, 3)), fb(b), -0.25, 0.26 * g * hv, hall=0.12, room=0.15)
    # ---- off-beat chord chops (organ-ish) and muted brass stabs
    if o.get('chop', True):
        for b in (h, 2 + h):
            if inb(b):
                for i, m in enumerate(C['stab']):
                    mx.add('keys', spluck(m - 12, 0.1, 0.1, 0.55, 0.2, i), fb(b), 0.35 - 0.2 * i, 0.07 * g, room=0.2)
    if o.get('stabs', True):
        for b in (1 + h, 3 + h):
            if inb(b):
                brass_chord(mx, C['stab'], fb(b), 0.16, 0.5 * g * o.get('stabv', 1), muted=True)
    # ---- melody (open brass)
    for (b, m, d) in o.get('mel', []):
        if inb(b):
            mv = o.get('melv', 1.0)
            mx.add('brass', brass(m, round(d * BEAT, 3), False, 0.85, 1.2, 0.03, 0.09, seed=m), fb(b), -0.15,
                   0.42 * g * mv, hall=0.2, room=0.1)
            mx.add('brass', brass(m - 12, round(d * BEAT, 3), False, 0.7, 1.0, 0.03, 0.09, seed=m + 1), fb(b), 0.2,
                   0.22 * g * mv, hall=0.2)


# ======================================================================= S1  0-192  title
def s1(mx):
    roll(mx, 'timp', 0, 56, 0.10, 0.85, 1.1, 38, -0.15, 2.0)
    roll(mx, 'snare', 18, 56, 0.04, 0.45, 0.72, pan=0.15, curve=2.0)
    mx.add('fx', reverse_cymbal((56 - 26) / FPS, 1), 26, 0, 0.35, hall=0.2)
    # 13 fanfare stabs on the letter drops 56,60,...,104 (rising D-major line, harmonised)
    mel = [69, 71, 73, 74, 76, 78, 79, 81, 83, 85, 86, 88, 90]
    harm = {9: {2, 6, 9}, 11: {7, 11, 2}, 1: {9, 1, 4}, 2: {2, 6, 9}, 4: {9, 1, 4}, 6: {2, 6, 9}, 7: {7, 11, 2}}
    roots = {9: 38, 11: 43, 1: 45, 2: 38, 4: 45, 6: 38, 7: 43}
    for i, m in enumerate(mel):
        f = 56 + 4 * i
        pcs = harm[m % 12]
        v = [m]
        x = m - 1
        while len(v) < 3:
            if x % 12 in pcs and x % 12 != m % 12:
                v.append(x)
            x -= 1
        last = i == 12
        dur = 0.75 if last else 0.11
        vel = 0.55 + 0.35 * i / 12
        brass_chord(mx, v + [m - 12], f, dur, vel * (1.3 if last else 1.0), muted=False, bright=0.88,
                    spread=0.7, hall=0.25, vib=0.5, scoop=20)
        mx.add('bass', upright(roots[m % 12], 0.15 if not last else 0.9, True), f, 0, 0.35 + 0.3 * last)
        mx.add('drums', timp(38 if i % 2 == 0 else 33, 0.8), f, -0.2, 0.25 + 0.35 * last, hall=0.2)
    tutti(mx, 104, [62, 66, 69, 74, 78, 81], 0.75, 0.8, bass=26, crash_v=0.55, timp_m=38, kick_v=0.7)
    # 116 subtitle shimmer: string pad Dadd9 + celesta sparkle arpeggio
    mx.add('keys', strings([62, 69, 76, 78, 81], (178 - 116) / FPS, 0.25, 0.3, 0.45, 0.25, 9.0, seed=3),
           116, 0, 0.32, hall=0.35)
    for i, m in enumerate([81, 86, 88, 90, 93, 95, 98, 93, 90, 98]):
        mx.add('keys', celesta(m, 1.6), 116 + 2 * i, (-0.6 + 0.12 * i), 0.22 * (1 - 0.04 * i), hall=0.5)
    # rising swell 140-178: brass walk-up with crescendo + timp roll + reverse cymbal
    for f, notes, v in ((140, [62, 67, 71], 0.35), (152, [64, 69, 73], 0.45), (162, [66, 69, 74], 0.55),
                        (170, [67, 73, 76, 79], 0.7)):
        nxt = {140: 152, 152: 162, 162: 170, 170: 178}[f]
        brass_chord(mx, notes, f, (nxt - f) / FPS, v, muted=False, bright=0.8, att=0.25, hall=0.25, vib=0.8)
    mx.add('keys', strings([50, 57, 62, 66], (178 - 140) / FPS, 1.2, 0.2, 0.55, 0, seed=5, swell=2.0), 140, 0,
           0.3, hall=0.3)
    roll(mx, 'timp', 150, 178, 0.15, 0.9, 1.0, 33, -0.15, 2.0)
    roll(mx, 'snare', 160, 178, 0.1, 0.5, 0.7, pan=0.15)
    mx.add('fx', reverse_cymbal((178 - 148) / FPS, 2), 148, 0, 0.45, hall=0.2)
    # 178 curtain whip: tutti hit, string gliss + harp run up, whoosh, hard stop at 192
    tutti(mx, 178, [62, 66, 69, 74, 78], 0.2, 0.85, bass=38, crash_v=0.45, timp_m=38)
    mx.add('keys', strings([62, 69, 74], (192 - 179) / FPS, 0.05, 0.05, 0.75, 0,
                           glide=lambda t: 24 * np.clip(t / ((192 - 179) / FPS), 0, 1) ** 1.6, seed=9), 179, 0, 0.35,
           hall=0.2)
    scale = [62, 64, 66, 67, 69, 71, 73, 74, 76, 78, 79, 81, 83, 85, 86, 88, 90, 91, 93, 95, 97, 98]
    for i, m in enumerate(scale):
        mx.add('keys', harpsi(m, 0.2, i), 180 + 0.55 * i, -0.7 + 1.4 * i / len(scale), 0.18, hall=0.3)
    mx.add('fx', sweep_noise((192 - 178) / FPS, 400, 7000, 1.5, 11,
                             env=lambda t: np.sin(np.pi * np.clip(t / 0.62, 0, 1)) ** 0.7), 178, 0, 0.3, hall=0.1)


# ======================================================================= S2  192-456  backstage
S2C = {  # harpsichord 16th pattern, pizz 8th pair
    'Dm': ([74, 81, 77, 81, 73, 81, 77, 81], [50, 45]),
    'Gm/D': ([74, 82, 79, 82, 74, 82, 79, 82], [50, 46]),
    'A7/C#': ([73, 81, 76, 79, 73, 81, 76, 79], [49, 45]),
    'Bb': ([74, 82, 77, 82, 74, 82, 77, 82], [46, 41]),
    'A7': ([73, 81, 76, 79, 73, 81, 76, 79], [45, 40]),
}


def s2_chord(f):
    if f < 262: return 'Dm'
    if f < 310: return 'Gm/D'
    if f < 358: return 'A7/C#'
    if f < 406: return 'Dm'
    if f < 430: return 'Bb'
    return 'A7'


def s2(mx):
    G0 = 214  # S2 beat grid: beats at 214 + 12k (hammers on beats 1 & 3)
    for f in range(193, 440, 3):
        if 280 <= f < 310:
            continue
        dead = 310 <= f < 382
        if dead and (f - G0) % 6:
            continue
        i = int(round((f - G0) / 3)) % 8
        m = S2C[s2_chord(f)][0][i]
        acc = 1.0 if (f - G0) % 12 == 0 else 0.72
        v = (0.5 if dead else 0.62) * acc
        if f >= 382:
            v *= 1.0 + 0.3 * (f - 382) / 58
        mx.add('keys', harpsi(m, 0.2, i % 3), f, 0.4 if i % 2 else 0.15, 0.34 * v, hall=0.06, room=0.2)
    for f in range(196, 440, 6):
        if 280 <= f < 300:
            continue
        dead = 310 <= f < 382
        if dead and (f - G0) % 12:
            continue
        k = int(round((f - G0) / 6)) % 2
        m = S2C[s2_chord(f)][1][k]
        mx.add('keys', pizz(m, 0.16, k), f, -0.35, 0.5 * (0.8 if dead else 1.0), room=0.2)
    # tip-toe pizz answers in the deadpan stretch (mouse)
    for f, m in ((322, 81), (325, 79), (346, 76), (370, 74), (373, 73)):
        mx.add('keys', pizz(m, 0.12), f, 0.5, 0.35, room=0.25)
    # hammer accents
    for f, chord in ((214, [38, 50, 57, 62]), (238, [41, 53, 57, 65]), (262, [43, 50, 58, 67])):
        for j, m in enumerate(chord):
            mx.add('keys', pizz(m, 0.3, j), f, -0.3 + 0.2 * j, 0.55, room=0.2)
        brass_chord(mx, chord[1:], f, 0.08, 0.45, muted=True, bright=0.9)
        mx.add('drums', timp(chord[0], 0.7), f, -0.2, 0.55, hall=0.12)
    # 280-300 ratchet: rising chromatic 'crrrk' run, 25 notes
    for i in range(25):
        f = 280 + 0.8 * i
        v = 0.3 + 0.5 * i / 24
        mx.add('keys', harpsi(57 + i, 0.08, i), f, -0.6 + 1.2 * i / 24, 0.3 * v, room=0.15)
        mx.add('keys', pizz(45 + i, 0.07, i), f, 0.3, 0.3 * v, room=0.1)
    # 300 plink (top of the heel)
    mx.add('keys', pizz(86, 0.4), 300, 0.4, 0.5, hall=0.3)
    mx.add('keys', celesta(98, 1.2), 300, 0.5, 0.25, hall=0.4)
    mx.add('keys', pizz(38, 0.3), 300, -0.3, 0.45)
    # bulldog's last line: tremolo strings crescendo into the sting
    mx.add('keys', strings([58, 62, 65], (430 - 406) / FPS, 0.3, 0.1, 0.55, 0.35, 11.0, seed=21, swell=1.0),
           406, 0, 0.18, hall=0.2)
    mx.add('keys', strings([57, 61, 64, 67], (440 - 430) / FPS, 0.05, 0.05, 0.6, 0.35, 11.0, seed=22), 430, 0,
           0.24, hall=0.2)
    # 440 sting (pearl whip): A7b9 brass sfz + timp + crash + harpsichord run down
    brass_chord(mx, [57, 61, 64, 67, 70], 440, 0.28, 1.0, muted=False, bright=0.95, spread=0.8, hall=0.3, fall=0,
                vib=0.3)
    mx.add('bass', upright(33, 0.5, True), 440, 0, 0.8)
    mx.add('drums', timp(33, 1.4), 440, -0.2, 0.9, hall=0.2)
    mx.add('drums', crash(2.0, 3), 440, 0, 0.45, hall=0.2)
    for i, m in enumerate([93, 91, 88, 85, 82, 79, 76, 73, 70, 67]):
        mx.add('keys', harpsi(m, 0.12, i), 440.5 + 0.5 * i, 0.6 - 0.12 * i, 0.22, hall=0.2)
    # 444-456 riser into the runway kick-in
    mx.add('fx', sweep_noise((456 - 444) / FPS, 250, 6000, 1.2, 4, env=lambda t: (t / 0.5) ** 2), 444, 0, 0.35,
           hall=0.1)
    roll(mx, 'snare', 446, 456, 0.05, 0.4, 0.75, pan=0.1)


# ======================================================================= S3-S4 groove 456-840 (+ source bar 840)
def tension(mx, f0=612, f1=656):
    # hats only, bass semitone wobble, seasick brass cluster, rolls
    groove_bar(mx, 600, 'A7', dict(span=(1, 4), kick=False, clap=False, bass=False, hook=False, stabs=False,
                                   chop=False, hats=0.2))
    groove_bar(mx, 648, 'A7', dict(span=(0, 0.5), kick=False, clap=False, bass=False, hook=False, stabs=False,
                                   chop=False, hats=0.2))
    for i, f in enumerate(range(f0, f1, 6)):
        mx.add('bass', upright(45 + (i % 2), 0.2, False, i), f, 0, 0.55 + 0.2 * i / 7)
    for i, f in enumerate(np.arange(f0, f1, 4)):
        m = [81, 82][i % 2]
        mx.add('keys', spluck(m, 0.12, 0.1, 0.7, 0.3, i % 2), f, 0.4 * (-1) ** i, 0.12 + 0.1 * i / 11, hall=0.15)
    for m in (69, 70, 73):
        mx.add('brass', brass(m, (f1 - f0) / FPS, False, 0.75, 3.2, 0.6, 0.05, 0.0, seed=m), f0, (m - 70) * 0.2,
               0.24, hall=0.25)
    roll(mx, 'timp', 628, 655, 0.1, 0.6, 1.1, 33, -0.2)
    roll(mx, 'snare', 636, 655, 0.05, 0.3, 0.75, pan=0.15)


def relief(mx, f=656):
    brass_chord(mx, [65, 69, 72, 77], f, 0.8, 0.75, muted=False, bright=0.8, att=0.04, hall=0.3, vib=1.0)
    mx.add('keys', strings([53, 60, 65, 69], 1.2, 0.08, 0.5, 0.5, seed=31), f, 0, 0.25, hall=0.35)
    mx.add('drums', crash(2.4, 7), f, 0, 0.3, hall=0.2)
    mx.add('drums', timp(41, 1.2), f, -0.2, 0.5, hall=0.2)
    mx.add('bass', upright(41, 0.3, False), f, 0, 0.6)
    for i, m in enumerate([77, 81, 84, 89, 93, 96]):
        mx.add('keys', harpsi(m, 0.3, i), f + 0.8 * i, -0.4 + 0.16 * i, 0.16, hall=0.35)


def runway(T):
    # 456 kick-in
    tutti(T, 456, [62, 69, 74, 77], 0.35, 0.9, bass=26, crash_v=0.55, timp_m=38, kick_v=0)
    groove_bar(T, 456, 'Dm')
    groove_bar(T, 504, 'Bb')
    groove_bar(T, 552, 'Gm')
    # 584 flamingo pose accent (swung 'and' of beat 3)
    brass_chord(T, [67, 73, 76, 81], 584, 0.35, 0.8, muted=False, bright=0.9, hall=0.25)
    T.add('drums', crash(2.2, 2), 584, 0.2, 0.35, hall=0.15)
    groove_bar(T, 600, 'A7', dict(span=(0, 1)))
    tension(T)
    relief(T)
    groove_bar(T, 648, 'Dm', dict(span=(1, 3)))
    groove_bar(T, 648, 'Dm', dict(span=(3, 4), clap=False, hook=False))
    snare_fill(T, [684, 688, 692], 0.25, 0.5)
    # 696 giraffe: B section with open trumpet line
    T.add('drums', crash(2.6, 4), 696, 0, 0.45, hall=0.15)
    groove_bar(T, 696, 'Gm', dict(bassline=[43, 38, 46, 40], mel=MEL_B[0], hookv=0.55, stabv=0.8))
    groove_bar(T, 744, 'Eb', dict(mel=MEL_B[1], hookv=0.55, stabv=0.8))
    groove_bar(T, 792, 'A7', dict(mel=MEL_B[2], hookv=0.55, stabv=0.8))
    # 804 giraffe pose accent
    brass_chord(T, [67, 73, 76, 79, 82], 804, 0.4, 0.7, muted=False, bright=0.9, hall=0.25)
    T.add('drums', crash(2.2, 6), 804, -0.2, 0.35, hall=0.15)
    T.add('drums', timp(33, 1.0), 804, -0.2, 0.5, hall=0.15)
    snare_fill(T, [828, 832, 836], 0.2, 0.45)
    # bar 840 (only heard through the tape-stop)
    T.add('drums', crash(2.6, 8), 840, 0, 0.45)
    groove_bar(T, 840, 'Dm', dict(mel=[(0, 74, 1.5)], hookv=0.6))


def limp_source():
    L = Mix(0, 48)
    groove_bar(L, 0, 'Dm', dict(stabs=False, chop=False, hookv=0.8, hats=0.25))
    return L


# ======================================================================= S5 936-1040 penguin
def s5(mx):
    groove_bar(mx, 936, 'Dm', dict(kick_beats=(0, 2), clap=False, hook=False, stabs=False, chop=True, hats=0.14,
                                   bassv=0.7, gain=0.8))
    for i, f in enumerate(np.arange(956, 992, 4)):  # waddle pitter-pat (triplet 8ths)
        m = [74, 69, 72, 69][i % 4]
        mx.add('keys', pizz(m, 0.1, i % 2), f, 0.3 * (-1) ** i, 0.35, room=0.2)
    groove_bar(mx, 984, 'Bb', dict(span=(0, 0.7), kick_beats=(0,), clap=False, hook=False, stabs=False,
                                   hats=0.14, bassv=0.7, gain=0.8))
    # 992-1040 accelerating slide
    f, i = 992.0, 0
    while f < 1039.5:
        x = (f - 992) / 48
        step = 4.0 - 2.9 * x
        m = 57 + i
        mx.add('keys', pizz(min(m, 93), 0.1, i % 2), f, -0.4, 0.3 + 0.25 * x, room=0.15)
        mx.add('keys', harpsi(min(m + 12, 100), 0.1, i % 3), f, 0.4, 0.22 + 0.2 * x, room=0.15)
        f += step
        i += 1
    for f in (996, 1008, 1020, 1032):
        mx.add('drums', kick(), f, 0, 0.8)
    for k, f in enumerate(range(1012, 1040, 3)):
        mx.add('drums', hat(False, k), f, 0.3, 0.12 + 0.1 * k / 9, room=0.08)
    for k, f in enumerate(range(992, 1040, 3)):
        mx.add('bass', upright(45 if k % 2 == 0 else 33, 0.1, False, k), f, 0, 0.5 + 0.3 * k / 16)
    roll(mx, 'snare', 1012, 1040, 0.05, 0.45, 0.7, pan=0.1, curve=1.5)
    for m in (69, 70, 73, 76):
        mx.add('brass', brass(m, 1.0, False, 0.85, 2.5, 0.5, 0.05, 0.0, seed=m + 5), 1016, (m - 72) * 0.15,
               0.25, hall=0.2)
    mx.add('fx', sweep_noise((1040 - 1000) / FPS, 300, 8000, 1.0, 12, env=lambda t: (t / 1.667) ** 2.5), 1000, 0,
           0.35, hall=0.1)


# ======================================================================= float 1060-1150
def float_cue(mx):
    notes = [(1060, [81, 86], 0.55), (1072, [90], 0.45), (1082, [88], 0.4), (1094, [93], 0.45),
             (1108, [92], 0.35), (1118, [88], 0.35), (1128, [97], 0.3), (1136, [86, 93], 0.3)]
    for f, ms, v in notes:
        for j, m in enumerate(ms):
            mx.add('keys', celesta(m, 2.4, 4.0, 1.2, 1.1, j), f, 0.35 * np.sin(f * 0.7 + j), v * 0.28, hall=0.7)
            mx.add('keys', celesta(m + 12 if m < 90 else m, 1.5, 3.5, 0.6, 0.5, j + 3), f + 0.3, -0.3, v * 0.06,
                   hall=0.8)
    mx.add('keys', strings([74, 81, 88], (1146 - 1060) / FPS, 1.5, 0.3, 0.25, 0.1, 5.0, 5.0, seed=41), 1060, 0,
           0.06, hall=0.6)


# ======================================================================= drop + S6 1176-1436
def finale(mx):
    tutti(mx, 1176, [50, 57, 62, 66, 69, 74, 78, 81], 0.7, 1.0, bass=26, crash_v=0.6, timp_m=38, kick_v=0)
    mx.add('drums', crash(2.8, 9), 1176, 0.4, 0.35, hall=0.2)
    groove_bar(mx, 1176, 'D', dict(mel=MEL_DROP, melv=1.2, stabv=1.2, hats=0.26, slap=True))
    S6 = dict(gain=0.72, hookv=0.7, slap=True)
    groove_bar(mx, 1224, 'D', dict(S6, bassline=[38, 42, 45, 36]))
    # 1240 ta-da
    brass_chord(mx, [64, 69, 73, 76], 1236, 0.1, 0.6, muted=False, bright=0.9, hall=0.2)
    brass_chord(mx, [66, 69, 74, 78, 81], 1240, 0.7, 0.8, muted=False, bright=0.9, hall=0.25, vib=1.5, fall=0)
    mx.add('drums', crash(2.0, 5), 1240, -0.3, 0.3, hall=0.2)
    mx.add('drums', timp(38, 1.0), 1240, -0.2, 0.45)
    groove_bar(mx, 1272, 'Bm', S6)
    groove_bar(mx, 1320, 'G', S6)
    # 1328 coy wink figure: pizz grace notes -> celesta ting + muted 'wah' with fall
    mx.add('keys', pizz(83, 0.08), 1322, 0.4, 0.35, room=0.2)
    mx.add('keys', pizz(86, 0.08), 1325, 0.45, 0.35, room=0.2)
    mx.add('keys', celesta(91, 1.5), 1328, 0.5, 0.35, hall=0.5)
    mx.add('brass', brass(79, 0.3, True, 0.9, 0.5, 0.02, 0.06, 10.0, fall=120.0, seed=3), 1328, 0.3, 0.3,
           hall=0.2)
    groove_bar(mx, 1368, 'A7', dict(gain=0.8, span=(0, 1), clap=False))
    snare_fill(mx, [1372, 1376, 1380], 0.3, 0.6)
    for f, m in ((1372, 73), (1376, 74), (1380, 76)):
        brass_chord(mx, [m - 4, m], f, 0.1, 0.45, muted=False, bright=0.85)
    # 1384 grand final title hit
    tutti(mx, 1384, [50, 57, 62, 66, 69, 74, 78, 81, 86], 1.1, 1.05, bass=26, crash_v=0.6, timp_m=38, kick_v=1.0)
    mx.add('drums', crash(2.8, 11), 1384, -0.4, 0.3, hall=0.2)
    mx.add('keys', strings([50, 57, 62, 66, 69, 74], (1428 - 1386) / FPS, 0.4, 0.2, 0.5, 0.15, 7.0, seed=51,
                           swell=0.8), 1386, 0, 0.3, hall=0.35)
    mx.add('bass', upright(38, 1.6, False), 1386, 0, 0.35)
    roll(mx, 'timp', 1404, 1427, 0.1, 0.7, 1.0, 33, -0.2, 2.0)
    # 1428 final button hit, ringing out
    tutti(mx, 1428, [62, 66, 69, 71, 74, 76, 78, 81, 86], 0.25, 1.1, bass=26, crash_v=0.65, timp_m=38, kick_v=1.0)
    mx.add('keys', celesta(98, 1.0), 1428, 0.5, 0.25, hall=0.4)


# ======================================================================= assembly
def window(n, fade_in, fade_out_start, fade_out):
    """segment gain window (samples)."""
    w = np.ones(n)
    if fade_in:
        w[:fade_in] = np.linspace(0, 1, fade_in)
    if fade_out:
        k = n - fade_out_start
        w[fade_out_start:] = 0.5 * (1 + np.cos(np.pi * np.clip(np.arange(k) / fade_out, 0, 1)))
    return w


def main():
    t0 = time.time()
    stems = {b: np.zeros((2, N_TOTAL)) for b in BUSES}

    def place(mx, fin_s, fout_start_frame, fout_s):
        out = mx.render()
        n = mx.n
        w = window(n, fin_s, S(fout_start_frame) - mx.s0, fout_s)
        for b in BUSES:
            stems[b][:, mx.s0:mx.s0 + n] += out[b] * w

    # --- A: S1 0-192, hard stop at 192
    A = Mix(0, 192)
    s1(A)
    place(A, 240, 192 - 0.05, 100)
    print('A done', round(time.time() - t0, 1))

    # --- B: 192-1040 (S2, runway, snap, penguin), hard cut at 1040
    Bm = Mix(192, 1040)
    s2(Bm)
    T = Mix(456, 900)
    runway(T)
    Bm.paste(T, 456, 840, 456, proc=lambda x: x * window(x.shape[1], 0, x.shape[1] - 96, 96))
    # 840 tape stop: rate 1 -> 0 over 18 frames
    n_ts = S(18)
    rate = (1 - np.arange(n_ts) / n_ts) ** 1.4
    Bm.paste(T, 840, 870, 840, proc=lambda x: varispeed(x, rate) * window(n_ts, 0, n_ts - 400, 400))
    # 860-872 record-skip stutter of the downbeat, pitched down, dying away
    for k, (f, r, g) in enumerate(((860, 0.55, 0.55), (864, 0.45, 0.4), (868, 0.35, 0.28))):
        nn = S(3)
        Bm.paste(T, 840, 846, f, gain=g,
                 proc=lambda x, r=r, nn=nn: lp(varispeed(x, np.full(nn, r)), 1500) * window(nn, 60, nn - 300, 300))
    # 871-876 scratch (back-and-forth) of the limp groove's downbeat
    L = limp_source()
    ns = S(5)
    tsc = np.arange(ns) / SR
    pos = 0.08 * SR * 0.5 * (1 - np.cos(TWO_PI * 2 * tsc / (ns / SR)))  # two back-and-forth strokes
    Bm.paste(L, 0, 12, 871, gain=0.45, proc=lambda x: lp(read_at(x, pos), 3000) * window(ns, 100, ns - 200, 200))
    # 876-936 groove limps at half speed, filtered, with wow
    nl = S(60)
    tl = np.arange(nl) / SR
    rate_l = 0.5 * (1 + 0.035 * np.sin(TWO_PI * 0.8 * tl))
    Bm.paste(L, 0, 34, 876, gain=0.9,
             proc=lambda x: lp(varispeed(x, rate_l), 1100, 2) * window(nl, 200, nl - 1500, 1500))
    s5(Bm)
    place(Bm, 48, 1040 - 0.08, 150)
    print('B done', round(time.time() - t0, 1))

    # --- C: float 1060-1150
    Cm = Mix(1060, 1150)
    float_cue(Cm)
    place(Cm, 24, 1143, S(7))
    print('C done', round(time.time() - t0, 1))

    # --- D: drop + S6 1176-1436
    Dm = Mix(1176, 1436)
    finale(Dm)
    place(Dm, 24, 1431, S(5))
    print('D done', round(time.time() - t0, 1))

    # --- bus gains
    BUS_GAIN = {'drums': 1.0, 'bass': 0.9, 'keys': 1.0, 'brass': 0.9, 'fx': 0.8}
    for b in BUSES:
        stems[b] *= BUS_GAIN[b]
    mix = sum(stems[b] for b in BUSES)
    mix = hp(mix, 28, 2)
    mix, gr = compress(mix, thr_db=-16.0, ratio=2.0)
    meter = pyln.Meter(SR)
    # --- loudness / true-peak loop
    gain = 1.0
    for it in range(6):
        y, g = limit(mix * gain, CEIL_DB)
        L_ = meter.integrated_loudness(y.T)
        print(f'iter {it}: gain {20*np.log10(gain):+.2f} dB -> {L_:.2f} LUFS')
        if abs(L_ - TARGET_LUFS) < 0.1:
            break
        gain *= 10 ** ((TARGET_LUFS - L_) / 20)
    # --- hard silence gates (after everything)
    gate = np.ones(N_TOTAL)
    for a, b in ((1040, 1060), (1150, 1176), (1436, 1440)):
        gate[S(a):S(b)] = 0.0
    y = y * gate
    y = y[:, :N_TOTAL]
    assert y.shape[1] == N_TOTAL
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    sf.write(OUT, y.T.astype(np.float32), SR, subtype='PCM_24')
    os.makedirs(STEM_DIR, exist_ok=True)
    for b in BUSES:
        st = hp(stems[b], 28, 2) * gain * gate
        sf.write(os.path.join(STEM_DIR, f'{b}.wav'), st.T.astype(np.float32), SR, subtype='PCM_24')
    Lf = meter.integrated_loudness(y.T)
    tp = true_peak_db(y)
    info = dict(lufs=round(Lf, 2), true_peak_dbtp=round(tp, 2), samples=int(y.shape[1]), sr=SR,
                seconds=y.shape[1] / SR, max_gain_reduction_comp_db=round(float(gr.max()), 2),
                max_limiter_gr_db=round(float(-20 * np.log10(g.min())), 2))
    json.dump(info, open(os.path.join(HERE, 'master_info.json'), 'w'), indent=2)
    print(info, 'total', round(time.time() - t0, 1), 's')


if __name__ == '__main__':
    main()
