# <AD> — sound cue sheet (<DUR>s, 24fps, 48kHz)

Picture: `final_typo.mp4`. Motion per frame: `_qa/snd/motion.npy` (from `motion_map.py`).
Every visible physical action gets a sound. Every camera/object move gets air whose loudness follows motion.

| t (s) | frame | On screen | Music (composer, code) | SFX (realistic, physically motivated) |
|---|---|---|---|---|
| 0.00–T0 | | establishing / tension | tension bed: sub drone + accelerating heartbeat + creeping shimmer, rising | room tone, the object's stress sounds (creak/hum) rising |
| T0−0.06 | | pre-impact | **suck-out: 60ms digital silence** | everything cut |
| **T0** | | THE BREAK (digital→physical) | **IMPACT**: sub drop + timpani/taiko + low brass braam | real material impact (glass/screen/…) + transient snap |
| slow-mo window | | speed ramp | varispeed ½ (octave down) + low-pass of braam/bells | impact tail slowed ½, darker |
| ramp end → S2 | | debris lands | reverse cymbal into the drop | debris on surfaces (realtime) |
| **S2 start** | | product moves / flies | **DROP**: 120 BPM trailer percussion + string ostinato | grinding/scrape of the product, heavy fly-by riding motion |
| landing | | transformation material lands | accent hit | material-specific landing (splat/clink/thump) |
| transformation | | letters/material form | build: rising line + snare roll crescendo | material-specific texture (viscous/crystal/fabric…), one thud per locked letter |
| **S2 end (≈8.0)** | | held beat | **HARD STOP — silence** (≤0.4s tail) | one intimate detail sound (drip/tick) + room tone |
| whip | | whip-pan | sweep riser into downbeat | real air swish riding the pan |
| macro | | intimate detail | sparse: organic layer (ElevenLabs piano/cello) | ASMR-close material detail |
| pull-back / reveal | | hero reveal | swell + timpani roll | camera air (motion), packaging sound (foil/paper/glass) |
| tagline lock | | tagline | riser → **final hit + resolving chord (home key)** | (restrained) |
| end | | settled | chord rings, fade last 0.4s | room tone |

Mix rules: static gain + true-peak limiter (−1.5 dBTP), ≈ −14 LUFS. Music ducks ONLY under the main impact (−3 dB / 150 ms). Silence beats are features.
