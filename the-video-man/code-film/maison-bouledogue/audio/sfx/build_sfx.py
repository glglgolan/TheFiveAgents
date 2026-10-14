"""Build the full 60 s SFX + ambience stem for MAISON BOULEDOGUE.

    python audio/sfx/build_sfx.py

Writes public/audio/sfx.wav (+ public/audio/sfx_stems/{crowd,foley,ambience}.wav)
and audio/sfx/cues.json. Every event is placed at its timeline.json frame (24 fps).
Deterministic: all randomness is seeded.
"""
import json
import os
import sys
import time

import numpy as np
from scipy import signal
import soundfile as sf
import pyloudnorm as pyln

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))

from dsp import (SR, N, FPS, fs, db, R, Bus, make_ir, convolve_stereo, lp, hp, bp, norm, rmsnorm,
                 curve, pan_gains, fade, tt, smooth_noise)
import foley as fl
import crowd as cr

TL = json.load(open(os.path.join(ROOT, 'src', 'data', 'timeline.json')))
CUES = []


def cue(f0, f1, cid, stem, desc):
    CUES.append(dict(from_frame=f0, to_frame=f1, id=cid, stem=stem, desc=desc))


def P(x, peak_db):
    """normalise to a peak level (dBFS)"""
    return norm(x, db(peak_db))


def lin(f, f0, f1, p0, p1):
    return p0 + (p1 - p0) * np.clip((f - f0) / (f1 - f0), 0, 1)


def pan_track(start_frame, n, f0, f1, p0, p1):
    fr = start_frame + np.arange(n) * FPS / SR
    return lin(fr, f0, f1, p0, p1)


CUT_S1 = fs(192)
CUT_S2 = fs(456)

crowd = Bus('crowd')
foley = Bus('foley')
amb = Bus('ambience')
T0 = time.time()


def log(m):
    print(f'[{time.time() - T0:6.1f}s] {m}', flush=True)


# =====================================================================  AMBIENCE
dialog = [(d['start'], d['maxEnd']) for d in TL['dialogue']]
duck_db = np.zeros(N)
for a, b in dialog:
    duck_db += -4.0 * curve([(a - 4, 0), (a, 1), (b, 1), (b + 6, 0)], N)
duck_db = np.maximum(duck_db, -4.0)
duck = db(duck_db)

log('room tones')
rt = fl.room_tone(R(11), N, lpf=350, hum=0.04, hum_f=60)
theatre_lvl = curve([(0, -56), (192, -56), (192.01, -200), (456, -200), (456.01, -57), (1040, -57),
                     (1041, -70), (1174, -70), (1176, -60), (1420, -64), (1436, -80), (1440, -120)], N)
amb.add(rt * db(theatre_lvl)[None, :] * duck[None, :], 0, hall=0.15)
cue(0, 1440, 'theatre_room_tone', 'ambience', 'pink-noise HVAC air + faint 60 Hz hum; drops to ~-70 dBFS in the dead silence 1041-1175')

bt = fl.room_tone(R(12), CUT_S2 - CUT_S1, lpf=600, hum=0.15, hum_f=50)
amb.add(bt * db(-50) * duck[None, CUT_S1:CUT_S2], CUT_S1, room=0.3, cut=CUT_S2)
cue(192, 456, 'backstage_room_tone', 'ambience', 'smaller brighter room tone + fluorescent 50 Hz hum')

log('crowd murmur (formant babble, 28 voices)')
mur_dur = 1046 / FPS
mur = cr.crowd_murmur(101, mur_dur, n_voices=28)
mur = rmsnorm(mur, 1.0)
M = mur.shape[1]
mlvl = curve([(0, -29), (12, -29), (40, -40), (150, -40), (162, -35), (192, -35),
              (456, -40), (600, -40), (612, -43), (700, -41), (840, -41), (870, -36), (936, -38),
              (990, -40), (1000, -44), (1038, -46), (1040, -120)], M)
mg = db(mlvl) * duck[:M]
open_mask = np.ones(M)
open_mask[CUT_S1:CUT_S2] = 0
muffled = lp(lp(mur, 420, 2), 900, 2) * db(4)  # heard through the backstage wall
mb = mur * open_mask[None, :] + muffled * (1 - open_mask[None, :])
amb.add(mb * mg[None, :], 0, hall=0.35)
cue(0, 1040, 'crowd_murmur', 'ambience', '28 formant-babble voices; hush at spotlight (12-40), muffled through wall in S2, cut dead at the gasp (1040)')

log('backstage bustle')
rb = R(21)
for (a, b) in [(193, 213), (226, 240), (318, 352), (392, 436)]:
    s = fl.sewing_machine(rb, (b - a) / FPS, rate=rb.uniform(13, 17))
    amb.add(P(s, -22) * duck[fs(a):fs(a) + len(s)], fs(a), pan=-0.55, room=0.25, cut=CUT_S2)
    cue(a, b, 'sewing_machine', 'ambience', 'motor whine + stitch clatter run (off left)')
for f in [199, 247, 331, 371, 418, 450]:
    h = fl.hanger_clatter(rb)
    amb.add(P(h, rb.uniform(-24, -19)), fs(f), pan=rb.uniform(-0.2, 0.8), room=0.35, cut=CUT_S2)
    cue(f, f + 20, 'hanger_clatter', 'ambience', 'wire hangers clinking + rail scrape')
for (a, b, p0, p1) in [(196, 230, 0.8, -0.6), (340, 372, -0.7, 0.5), (420, 450, 0.6, -0.2)]:
    for k, f in enumerate(np.arange(a, b, 5.5)):
        st = fl.shoe_step(rb)
        amb.add(P(st, -30 + rb.uniform(-2, 2)), fs(f), pan=lin(f, a, b, p0, p1), room=0.35, cut=CUT_S2)
    cue(a, b, 'assistant_footsteps', 'ambience', 'hurrying dresser footsteps crossing')
for f in rb.uniform(195, 450, 10):
    ru = fl.rustle(rb, rb.uniform(0.3, 0.8))
    amb.add(P(ru, -31), fs(f), pan=rb.uniform(-0.8, 0.8), room=0.3, cut=CUT_S2)
cue(192, 456, 'fabric_rustles', 'ambience', 'random tulle / garment-bag rustles')

log('float wind')
w = fl.wind(R(31), (1172 - 1060) / FPS)
w *= curve([(0, 0), (6, 1), (95, 1), (112, 0)], w.shape[1])[None, :]
amb.add(P(w, -24), fs(1060), hall=0.2)
cue(1060, 1172, 'float_wind', 'ambience', 'gentle high-air breeze + veil flutter while penguin floats')

# =====================================================================  FOLEY  S1
log('S1 foley')
r1 = R(41)
foley.add(P(fl.spotlight_clunk(r1), -8), fs(12), pan=0.15, hall=0.35, cut=CUT_S1)
cue(12, 12, 'spot_on', 'foley', 'spotlight clunk: pitch-drop thump + modal metal + latch')
ah = fl.arc_hum(r1, (192 - 13) / FPS)
ah *= curve([(0, 0), (3, 1), (170, 1), (179, 0.6)], len(ah))
foley.add(P(ah, -38), fs(13), pan=0.15, hall=0.1, cut=CUT_S1)
cue(13, 192, 'arc_hum', 'foley', 'carbon-arc spotlight buzz')
foley.add(P(fl.servo_creak(r1, 36 / FPS), -30), fs(12), pan=pan_track(fs(12), fs(36), 12, 48, 0.5, 0.0),
          hall=0.2, cut=CUT_S1)
cue(12, 48, 'spot_sweep', 'foley', 'spot yoke friction squeak + motor while sweeping')
for k, f in enumerate(range(56, 105, 4)):
    foley.add(P(fl.letter_thump(r1, k), -7), fs(f), pan=lin(k, 0, 12, -0.6, 0.6), hall=0.4, cut=CUT_S1)
cue(56, 104, 'letter_thumps', 'foley', '13 marquee-letter thumps every 4 f (56..104), panned L->R across the title')
foley.add(P(fl.shimmer(r1, 1.1), -19), fs(116), pan=0.0, hall=0.4, cut=CUT_S1)
cue(116, 142, 'subtitle_shimmer', 'foley', 'sparkle grains + rising swish')
for f, p in [(132, -0.55), (141, 0.5), (147, -0.2), (158, 0.7)]:
    foley.add(P(fl.flash(r1), -11), fs(f) - int(0.008 * SR), pan=p, hall=0.3, cut=CUT_S1)
    cue(f, f, 'flash', 'foley', 'shutter ch-chk + flashbulb pop + capacitor whine')
cw = fl.curtain_whip(r1, (192 - 176) / FPS)
foley.add(P(cw, -5), fs(176), hall=0.25, cut=CUT_S1)
cue(176, 192, 'curtain_whip', 'foley', 'velvet whoosh w/ flutter, velvet whap ~190, hard cut 192')

# =====================================================================  FOLEY  S2
log('S2 foley')
r2 = R(51)
for k, f in enumerate([214, 238, 262]):
    foley.add(P(fl.hammer_hit(r2, k), -7), fs(f), pan=0.3, room=0.35, cut=CUT_S2)
cue(214, 262, 'hammer', 'foley', '3 hammer hits on metal heel cage (214, 238, 262), each a little higher')
foley.add(P(fl.ratchet(r2, 20 / FPS), -9), fs(280), pan=0.25, room=0.3, cut=CUT_S2)
cue(280, 300, 'heel_ratchet', 'foley', "telescoping ratchet 'crrrk' 280-300 + lock clunk at 300")
# pearl strand whip overhead
wh = fl.whoosh(r2, 0.45, 500, 3000, peak=0.45, bw=0.9)
foley.add(P(wh, -17), fs(438), pan=pan_track(fs(438), len(wh), 438, 449, -0.3, 0.4), room=0.3, cut=CUT_S2)
for i in range(46):
    t = 438 + 11 * r2.beta(2, 2)
    c = fl.pearl_click(r2, r2.uniform(0.9, 1.3), 'pp')
    foley.add(P(c, r2.uniform(-28, -18)), fs(t), pan=lin(t, 438, 449, -0.3, 0.4), room=0.3, cut=CUT_S2)
cue(438, 450, 'pearl_whip', 'foley', 'whoosh + 46 pearl-on-pearl rattle clicks along the swing')

# =====================================================================  FOLEY  S3 flamingo
log('S3 flamingo')
r3 = R(61)
flam_in = lambda f: lin(f, 488, 584, -0.85, 0.0)
flam_out = lambda f: lin(f, 664, 696, 0.05, 0.9)
steps_in = list(range(488, 581, 12))
steps_out = list(range(664, 691, 12))
for k, f in enumerate(steps_in):
    foley.add(P(fl.stiletto(r3, k % 2), -9 + r3.uniform(-1, 0.5)), fs(f), pan=flam_in(f), hall=0.28)
for k, f in enumerate(steps_out):
    foley.add(P(fl.stiletto(r3, k % 2), -9 + r3.uniform(-1, 0.5)), fs(f), pan=flam_out(f), hall=0.28)
cue(488, 580, 'stiletto_clicks', 'foley', f'metal-cage stiletto clicks every 12 f: {steps_in}, pan -0.85 -> 0')
cue(664, 690, 'stiletto_clicks_exit', 'foley', f'exit clicks {steps_out}, pan 0 -> +0.9')


def flam_pan(f):
    if f < 612:
        return flam_in(min(f, 584))
    if f < 664:
        return 0.0 + 0.35 * np.sin(2 * np.pi * 1.3 * (f - 612) / FPS)
    return flam_out(f)


def ping_rate(f):
    if 612 <= f < 652:
        return 42.0 * (0.6 + 0.4 * abs(np.sin(2 * np.pi * 1.3 * (f - 612) / FPS)))
    if 652 <= f < 664:
        return lin(f, 652, 664, 14, 3)
    if 584 <= f < 612:
        return 3.0
    return 2.5


# chandelier: steady gentle tinkle + bursts after every step + wild teeter
t = 488.0
while t < 700:
    rate = ping_rate(t)
    wild = 612 <= t < 656
    foley.add(P(fl.crystal_ping(r3), (-19 if wild else -27) + r3.uniform(-5, 1)), fs(t),
              pan=np.clip(flam_pan(t) + r3.uniform(-0.12, 0.12), -1, 1), hall=0.3)
    t += r3.exponential(FPS / rate)
for f in steps_in + steps_out:
    for j in range(r3.integers(2, 5)):
        tf = f + r3.uniform(0.5, 6)
        foley.add(P(fl.crystal_ping(r3), -24 + r3.uniform(-4, 0)), fs(tf), pan=flam_pan(tf), hall=0.3)
cue(488, 700, 'chandelier_jingle', 'foley', 'crystal prism pings: gentle while walking, WILD 612-652 swinging L/R, settles by 664')
for (a, b, nfl) in [(586, 606, 10), (806, 822, 8)]:
    fr = np.sort(r3.uniform(a, b, nfl))
    fr[0] = a
    for i, f in enumerate(fr):
        foley.add(P(fl.flash(r3, whine=(i % 2 == 0)), r3.uniform(-15, -10)), fs(f), pan=r3.uniform(-0.9, 0.9),
                  hall=0.3)
    cue(a, b, 'flash_storm', 'foley', f'{nfl} press flashes at frames {np.round(fr, 1).tolist()}')

# =====================================================================  FOLEY  S4 giraffe
log('S4 giraffe + pearls')
r4 = R(71)
gir = lambda f: lin(f, 720, 804, -0.85, 0.0)
gsteps = list(range(720, 793, 12))
for k, f in enumerate(gsteps):
    foley.add(P(fl.hoof_heel(r4, k % 2), -9 + r4.uniform(-1, 0.5)), fs(f), pan=gir(f), hall=0.28)
    for j in range(6):
        tf = f + r4.uniform(0.5, 5)
        foley.add(P(fl.pearl_click(r4, 1.1, 'pp'), -30 + r4.uniform(-4, 0)), fs(tf), pan=gir(tf), hall=0.2)
cue(720, 792, 'hoof_heel_clicks', 'foley', f'hoof-heel clops every 12 f {gsteps} + subtle pearl rattle, pan -0.85 -> 0')
sw = fl.whoosh(r4, 0.5, 300, 1600, peak=0.5, bw=1.0)
foley.add(P(sw, -21), fs(800), pan=0.0, hall=0.3)
cue(800, 812, 'neck_swoop', 'foley', 'soft air swoosh of the neck-swoop pose')

# ---- PEARL SNAP
foley.add(P(fl.string_snap(r4), -3), fs(840), pan=0.05, hall=0.35)
bw_ = fl.whoosh(r4, 0.3, 1200, 6000, peak=0.08, bw=1.2)
foley.add(P(bw_, -14), fs(840), pan=0.0, hall=0.3)
for i in range(80):
    tf = 840 + abs(r4.normal(0, 1.6))
    foley.add(P(fl.pearl_click(r4, r4.uniform(0.9, 1.3), 'pp'), r4.uniform(-22, -11)), fs(tf),
              pan=np.clip(r4.normal(0, 0.35), -1, 1), hall=0.25)
cue(840, 846, 'PEARL_SNAP', 'foley', 'silk strand crack + downward twang, burst whoosh, 80 pearl-pearl collisions')
# ---- rain of pearls: ballistic bounce schedules
n_pearls = 360
n_impacts = 0
for i in range(n_pearls):
    t0 = (850 + 50 * r4.beta(1.5, 2.4)) / FPS
    h = r4.uniform(0.15, 0.9)
    e = r4.uniform(0.5, 0.72)
    size = r4.uniform(0.85, 1.35)
    pan = float(np.clip(r4.normal(0, 0.5), -1, 1))
    g0 = r4.uniform(-26, -15)
    for (tb, v) in fl.bounce_schedule(r4, t0, h, e):
        if tb * FPS > 945:
            break
        c = fl.pearl_click(r4, size, 'floor')
        foley.add(P(c, g0 + 20 * np.log10(max(v, 1e-3)) * 1.1), int(tb * SR), pan=pan, hall=0.18)
        n_impacts += 1
    if r4.random() < 0.3:  # rolls away afterwards
        rs = (t0 + 0.4 + r4.uniform(0, 0.4))
        rd = r4.uniform(0.4, 1.6)
        if (rs + rd) * FPS < 940:
            ro = fl.roll(r4, rd, speed=r4.uniform(0.7, 1.3))
            ro *= np.linspace(1, 0.2, len(ro))
            foley.add(P(ro, g0 - 12), int(rs * SR), pan=pan_track(int(rs * SR), len(ro), rs * FPS, (rs + rd) * FPS,
                                                                   pan, np.clip(pan + r4.uniform(-0.5, 0.5), -1, 1)),
                      hall=0.15)
# late sparse stragglers 900-936
for i in range(26):
    t0 = r4.uniform(900, 932) / FPS
    pan = float(r4.uniform(-0.9, 0.9))
    for (tb, v) in fl.bounce_schedule(r4, t0, r4.uniform(0.05, 0.25), r4.uniform(0.5, 0.65)):
        foley.add(P(fl.pearl_click(r4, r4.uniform(0.9, 1.3)), -26 + 20 * np.log10(max(v, 1e-3))), int(tb * SR),
                  pan=pan, hall=0.18)
        n_impacts += 1
cue(850, 936, 'pearl_rain', 'foley', f'{n_pearls}+26 pearls, {n_impacts} individual modal impacts on ballistic bounce-decay schedules (dense 850-900), ~30% roll away 900-936')
log(f'  pearl impacts: {n_impacts}')
sq = fl.sunglasses_squeak(r4, (866 - 852) / FPS, 1350, 800)
foley.add(P(sq, -16), fs(852), pan=0.05, hall=0.12)
sq2 = fl.sunglasses_squeak(r4, 3 / FPS, 820, 650)
foley.add(P(sq2, -19), fs(867), pan=0.05, hall=0.12)
foley.add(P(fl.pearl_click(r4, 1.6, 'pp'), -24), fs(870), pan=0.05, hall=0.1)
cue(852, 870, 'sunglasses_slide', 'foley', 'stick-slip squeak down the nose (852-866), last nudge 867-870 + tiny tick')

# =====================================================================  FOLEY  S5 penguin
log('S5 penguin')
r5 = R(81)
psteps = list(range(956, 989, 4))
for k, f in enumerate(psteps):
    foley.add(P(fl.penguin_pat(r5, k % 2), -14 + r5.uniform(-1.5, 0)), fs(f), pan=lin(f, 956, 990, -0.85, -0.25),
              hall=0.25)
    if r5.random() < 0.6:
        foley.add(P(fl.pearl_click(r5, 1.1), -27), fs(f + 1), pan=lin(f, 956, 990, -0.85, -0.25), hall=0.2)
cue(956, 988, 'penguin_pitter_pat', 'foley', f'flipper-foot pats every 4 f {psteps}, pan -0.85 -> -0.25')
foley.add(P(fl.slide_whistle(r5, 0.38), -13), fs(992), pan=-0.25, hall=0.2)
foley.add(P(fl.skid(r5, 0.22), -19), fs(992), pan=-0.25, hall=0.2)
cue(992, 1001, 'slip_whoop', 'foley', 'slide-whistle whoop up + rubbery foot skid')
rs_ = fl.rumble_slide(r5, (1036 - 992) / FPS)
foley.add(P(rs_, -12), fs(992), pan=pan_track(fs(992), len(rs_), 992, 1036, -0.25, 0.85), hall=0.25)
cue(992, 1036, 'rolling_pearl_rumble', 'foley', 'brown-noise rumble + ~260/s granular pearl clicks, pans L->R with the slide')
sp, rot = fl.spin_whirr(r5, (1036 - 1012) / FPS, 3, 10)
spp = pan_track(fs(1012), len(sp), 1012, 1036, 0.2, 0.85) + 0.25 * np.sin(2 * np.pi * rot)
foley.add(P(sp, -15), fs(1012), pan=np.clip(spp, -1, 1), hall=0.25)
cue(1012, 1036, 'spin_whirr', 'foley', 'rotation-rate AM whoosh (3->10 Hz) + whirr tone, pan orbits')
foley.add(P(fl.hoof_heel(r5), -18), fs(1035), pan=0.85, hall=0.3)
lw = fl.whoosh(r5, 0.45, 500, 2600, peak=0.35, bw=1.0)
foley.add(P(lw, -14), fs(1035), pan=pan_track(fs(1035), len(lw), 1035, 1046, 0.85, 1.0), hall=0.35)
cue(1035, 1046, 'launch_whoosh', 'foley', 'edge knock + whoosh as penguin flies off the runway end')
foley.add(P(fl.umbrella_pop(r5), -2.5), fs(1060), pan=0.3, hall=0.45)
cue(1060, 1090, 'UMBRELLA_POP', 'foley', 'sub whump + fabric snap + rib clicks + spring boing')

# confetti cannons + rustle
for f, p in [(1176, -0.65), (1177, 0.65)]:
    foley.add(P(fl.confetti_cannon(r5), -4), fs(f), pan=p, hall=0.4)
cf = fl.confetti_rustle(r5, 5.0)
foley.add(P(cf, -26), fs(1180), hall=0.2)
cue(1176, 1177, 'confetti_cannons', 'foley', 'two pneumatic confetti cannons L/R')
cue(1180, 1300, 'confetti_rustle', 'foley', 'falling paper confetti grains, thinning')

# =====================================================================  FOLEY  S6
log('S6 foley')
r6 = R(91)
foley.add(P(fl.bow_creak(r6, 0.85), -14), fs(1240), pan=-0.05, hall=0.25)
foley.add(P(fl.whoosh(r6, 0.5, 350, 1500, peak=0.4), -20), fs(1238), pan=-0.05, hall=0.25)
cue(1238, 1260, 'bulldog_bow', 'foley', 'comic stick-slip wood creak + cloth swish')
foley.add(P(fl.ting(r6), -12), fs(1328), pan=0.3, hall=0.3)
cue(1328, 1328, 'wink_ting', 'foley', 'sparkle-bell ting')
foley.add(P(fl.whoosh(r6, 0.34, 300, 4000, peak=0.95, bw=1.0), -13), fs(1384) - int(0.33 * SR), hall=0.2)
foley.add(P(fl.title_slam(r6), -1.5), fs(1384), hall=0.35)
cue(1377, 1384, 'final_title_slam', 'foley', 'rising pre-whoosh into sub boom + slam + plate ring')
rd = (1428 - 1410) / FPS
ro = fl.roll(r6, rd, speed=1.0, seam=0.11)
ro = lp(ro, 3000) + 0.6 * ro
ro *= np.geomspace(db(-14), 1.0, len(ro))
foley.add(P(ro, -12), fs(1410), pan=0.0, hall=0.12)
cue(1410, 1428, 'last_pearl_roll', 'foley', 'single pearl rolling toward camera, rising + brightening, seam ticks')
foley.add(P(fl.lens_clink(r6), -5), fs(1428), pan=0.0, hall=0.08)
cue(1428, 1428, 'LENS_CLINK', 'foley', 'glass lens clink, beating partial pairs')

# =====================================================================  CROWD
log('crowd reactions')


def place_reaction(st, f, level_db, hall=0.5, cut=None):
    crowd.add(st * db(level_db), fs(f), hall=hall, cut=cut)


place_reaction(cr.reaction(201, 'ooh', 44, (1.4, 1.9), 0.15), 613, -23)
cue(613, 660, 'crowd_ooh', 'crowd', "44 voices 'ooh' (u->o, pitch swell) during teeter")
place_reaction(cr.reaction(202, 'aah', 44, (1.0, 1.5), 0.12), 656, -24)
cue(656, 690, 'crowd_aah', 'crowd', "44 voices relieved falling 'aah' (breathy)")
place_reaction(cr.reaction(203, 'oh', 36, (0.3, 0.5), 0.06), 842, -22)
cue(842, 856, 'crowd_oh', 'crowd', "short shocked 'oh!' at the snap")
place_reaction(cr.reaction(204, 'titter', 12, (1.0, 1.5), 0.3), 921, -32)
cue(921, 956, 'crowd_titter', 'crowd', 'small ripple of laughter after "Non non non"')
place_reaction(cr.reaction(205, 'whoa', 40, (1.35, 1.5), 0.08), 1004, -27, cut=fs(1040))
cue(1004, 1040, 'crowd_whoa', 'crowd', "rising tension 'ooooOOH' under the slide, cut at 1040")
log('gasp')
gs = cr.crowd_gasp(206)
crowd.add(rmsnorm(gs, 1) * db(-15), fs(1040) - int(0.02 * SR), hall=0.45)
cue(1040, 1051, 'CROWD_GASP', 'crowd', '60 unvoiced formant-shaped inhales (+10 voiced hah!), onsets within ~70 ms, abrupt stop -> dead silence')

log('claps + applause')
c1 = cr.single_clap(301)
crowd.add(P(c1, -8), fs(1152), pan=-0.35, hall=0.9)
c2 = cr.single_clap(302)
crowd.add(P(c2, -7), fs(1166), pan=0.4, hall=0.9)
cue(1152, 1152, 'single_clap', 'crowd', 'one lonely clap (left), big hall tail')
cue(1166, 1166, 'second_clap', 'crowd', 'a second clapper (right)')

ctrl_title = curve([(0, 0), (112, 0), (122, 0.35), (150, 0.3), (165, 0.45), (191.9, 0.45), (192, 0), (1440, 0)], N)
ap1 = cr.applause(401, 70, ctrl_title)
ap1 = ap1 / (np.sqrt(np.mean(ap1[:, fs(125):fs(190)] ** 2)) + 1e-9)
crowd.add(ap1 * db(-33), 0, hall=0.5, cut=CUT_S1)
cue(112, 192, 'title_applause', 'crowd', 'polite applause under title reveal (70 clappers), hard cut 192')

ctrl_fl = curve([(0, 0), (658, 0), (664, 0.3), (690, 0.28), (706, 0.08), (716, 0), (1440, 0)], N)
ap2 = cr.applause(402, 45, ctrl_fl)
ap2 = ap2 / (np.sqrt(np.mean(ap2[:, fs(664):fs(700)] ** 2)) + 1e-9)
crowd.add(ap2 * db(-31), 0, hall=0.5)
cue(658, 716, 'flamingo_applause', 'crowd', 'light relieved applause as flamingo exits')

ctrl_up = curve([(0, 0), (1175.5, 0), (1177, 0.9), (1180, 1.0), (1224, 1.0), (1236, 0.82), (1244, 1.0),
                 (1256, 0.7), (1300, 0.5), (1340, 0.33), (1370, 0.18), (1395, 0.06), (1412, 0), (1440, 0)], N)
ap3 = cr.applause(403, 180, ctrl_up, groups=32)
ap3 = ap3 / (np.sqrt(np.mean(ap3[:, fs(1180):fs(1224)] ** 2)) + 1e-9)
crowd.add(ap3 * db(-19), 0, hall=0.45)
cue(1176, 1412, 'UPROAR_applause', 'crowd', '180 clappers, burst at 1176, bump at bow 1244, thins under S6 dialogue, gone by 1412')

log('cheering')
dfun = lambda t: np.interp(t, [0, 0.1, 1.0, 2.2, 2.6, 3.0, 3.5, 5.0, 6.5], [1, 1, .9, .45, .3, .75, .5, .15, 0])
ch = cr.cheering(501, 6.5, dfun, n_max=130)
ch = ch / (np.sqrt(np.mean(ch[:, : int(2.0 * SR)] ** 2)) + 1e-9)
crowd.add(ch * db(-22), fs(1176), hall=0.5)
cue(1176, 1332, 'cheering', 'crowd', "130 'woo/yeah/bravo/hey' formant voices, densest 1176-1200, 'bravo' bump at the bow")
rw = R(502)
for f in list(rw.uniform(1178, 1215, 6)) + [1243, 1249]:
    crowd.add(P(cr.whistle(rw), rw.uniform(-24, -19)), fs(f), pan=rw.uniform(-0.9, 0.9), hall=0.45)
cue(1178, 1250, 'whistles', 'crowd', '8 wolf / finger whistles')

# =====================================================================  MIX
log('reverbs')
ir_hall = make_ir(2.1, 1.1, 2.6, 0.022, R(7), er=10, er_span=0.07, bright=7000)
ir_room = make_ir(0.55, 0.35, 0.8, 0.006, R(8), er=8, er_span=0.02, bright=9000)
hall_gate = np.ones(N)
k = int(0.004 * SR)
hall_gate[CUT_S1:CUT_S2] = 0
hall_gate[CUT_S1 - k:CUT_S1] = np.linspace(1, 0, k)
room_gate = 1 - hall_gate
room_gate[:CUT_S1 - k] = 0
room_gate[CUT_S2:] = 0
room_gate[CUT_S2 - k:CUT_S2] = np.linspace(1, 0, k)
stems = {}
for b in (crowd, foley, amb):
    wet_h = convolve_stereo(b.hall, ir_hall) * hall_gate[None, :]
    wet_r = convolve_stereo(b.room, ir_room) * room_gate[None, :]
    stems[b.name] = b.dry + 0.55 * wet_h + 0.5 * wet_r
    log(f'  {b.name} done')

final_fade = curve([(0, 1), (1436, 1), (1440, 0)], N)
for kname in stems:
    stems[kname] *= final_fade[None, :]
    stems[kname] = hp(stems[kname], 25, 2)

mix = sum(stems.values())
meter = pyln.Meter(SR)
L0 = meter.integrated_loudness(mix.T)
target = -20.0
g = db(target - L0)
for kname in stems:
    stems[kname] *= g
mix = sum(stems.values())


def true_peak_env(x):
    up = signal.resample_poly(x, 4, 1, axis=-1)
    a = np.max(np.abs(up), axis=0)
    return a.reshape(-1, 4).max(axis=1)[: x.shape[1]]


def limiter_gain(x, ceil_db=-1.3, look=0.0015, rel=0.08):
    pk = true_peak_env(x)
    ceil = db(ceil_db)
    need = np.minimum(1.0, ceil / (pk + 1e-12))
    la = int(look * SR)
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    need = minimum_filter1d(need, size=2 * la + 1)
    need = uniform_filter1d(need, size=la | 1)  # smooth attack, stays <= need at the peak
    a_rel = np.exp(-1 / (rel * SR))
    # release smoothing: recursive max-hold of the reduction (vectorised in blocks)
    gsm = np.empty_like(need)
    cur = 1.0
    for i in range(len(need)):
        v = need[i]
        cur = v if v < cur else a_rel * cur + (1 - a_rel) * v
        gsm[i] = cur
    return gsm


def db_(x):
    return 20 * np.log10(x + 1e-12)


for it in range(3):
    tp = db_(true_peak_env(mix).max())
    log(f'pass {it}: LUFS {meter.integrated_loudness(mix.T):.2f}  true-peak {tp:.2f} dBTP')
    if tp <= -1.0:
        break
    gl = limiter_gain(mix)
    for kname in stems:
        stems[kname] *= gl[None, :]
    mix = sum(stems.values())
    # re-trim loudness after limiting (tiny)
    Lx = meter.integrated_loudness(mix.T)
    gg = db(target - Lx)
    if gg > 1:
        gg = min(gg, db(0.3))
        for kname in stems:
            stems[kname] *= gg
        mix = sum(stems.values())

LUFS = meter.integrated_loudness(mix.T)
TP = db_(true_peak_env(mix).max())
log(f'FINAL: LUFS {LUFS:.2f}  true-peak {TP:.2f} dBTP  samples {mix.shape[1]}')

outdir = os.path.join(ROOT, 'public', 'audio')
os.makedirs(os.path.join(outdir, 'sfx_stems'), exist_ok=True)
assert mix.shape == (2, N)
sf.write(os.path.join(outdir, 'sfx.wav'), mix.T.astype(np.float32), SR, subtype='PCM_24')
for kname, s in stems.items():
    sf.write(os.path.join(outdir, 'sfx_stems', f'{kname}.wav'), s.T.astype(np.float32), SR, subtype='PCM_24')
stats = dict(lufs_integrated=round(float(LUFS), 2), true_peak_dbtp=round(float(TP), 2), samples=int(mix.shape[1]),
             sr=SR, seconds=mix.shape[1] / SR)
for kname, s in stems.items():
    try:
        stats[f'lufs_{kname}'] = round(float(meter.integrated_loudness(s.T)), 2)
    except Exception:
        pass
json.dump(dict(stats=stats, cues=sorted(CUES, key=lambda c: c['from_frame'])),
          open(os.path.join(HERE, 'cues.json'), 'w'), indent=1)
log(f'wrote {outdir}/sfx.wav  {stats}')
