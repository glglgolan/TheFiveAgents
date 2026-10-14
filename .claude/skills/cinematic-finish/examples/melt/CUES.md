# MELT v4 — sound cue sheet (15.000s, 24fps, 48kHz)

Picture: `final_typo.mp4`. Motion energy per frame: `_qa/snd/motion.npy` (360 floats, median optical-flow px/frame at 270x480).

| t (s) | frame | On screen | Music (composer, code) | SFX (realistic, physically motivated) |
|---|---|---|---|---|
| 0.00–2.25 | 0–54 | Still room, laptop with MELT site, slow push-in | Tension bed: low sub drone + heartbeat pulse accelerating (≈60→100 bpm), filtered, rising; high glassy shimmer creeping in from 1.2s | Room tone, laptop fan, faint electrical whine rising, micro glass stress creaks from 1.5s |
| 2.25 | 54 | (pre-impact) | **Cut to silence 60ms before impact** (suck-out), reverse riser peaking exactly at 2.29 | reverse glass swell into impact |
| **2.29** | 55 | **Screen shatters, chocolate punches through** | **IMPACT**: trailer hit = sub drop (55→28Hz, 1.6s) + taiko/timpani + braam (low brass cluster, 2.5s) | glass impact (close, huge) + crack-spread creak + chocolate snap |
| 2.30–3.30 | 55–79 | **Slow-motion 40%** — shards float | Everything the score plays here is **varispeed-slowed / pitched down an octave + low-passed** (time-dilation feel); braam tail stretched | slowed shard tinkles, low "time-stretch" rumble |
| 3.30–4.00 | 79–96 | Speed returns, shards land on table | Snap back to tempo: reverse cymbal into 4.0 | shards raining on wood/keyboard (realtime) |
| **4.00–5.75** | 96–138 | Heavy bar slides out of screen and **flies past camera** (exits top-left ≈5.6) | **DROP** at 4.00: driving trailer percussion, 120 BPM, pulsing low strings ostinato, big | heavy object fly-by: low doppler pass-by whose loudness follows motion curve, peak ≈5.3; stone-scrape of bar against cracked glass 4.0–4.6 |
| 5.55–6.00 | 133–144 | Chocolate lands as liquid on cloth | accent hit on 5.75 | thick wet splat (heavy, viscous) |
| 6.00–7.40 | 144–178 | Letters M-E-L-T rise out of molten chocolate | Build: rising string/brass line, snare roll crescendo to 7.9 | viscous rising / sticky stretching, glossy squelch; 4 soft heavy thuds as each letter locks (≈6.4, 6.7, 7.0, 7.25) |
| 7.40–8.00 | 178–192 | Drips run off the table edge | crescendo peaks at 7.95 | drips onto floor |
| **8.00–8.70** | 192–209 | Held frame, letters static | **HARD STOP — total silence** (only reverb tail of last hit, <0.4s) | one or two single drips in silence, close and intimate (ASMR) |
| **8.75–9.20** | 210–221 | **Whip-pan** (motion peaks 8.4 px/f at 8.8) | sweep riser into downbeat at 9.20 | real air whip — fast cloth/air swish whose envelope = motion curve |
| 9.20–11.00 | 221–264 | Macro: bitten corner, glossy molten center, slow drift | Intimate: warm felt piano + cello (organic layer — ElevenLabs piece) | sticky molten stretch, faint crackle of tempered chocolate, room-close |
| 11.00–12.60 | 264–302 | Fast camera pull-back, gold foil + sleeve revealed (motion peak ≈11.75) | Swell: strings rising, timpani roll | camera air move (follows motion), gold foil crinkle on reveal ≈11.4–12.2 |
| 12.80–13.40 | 307–322 | Tagline "MADE TO MELT" assembles | short riser | soft letter whoosh (restrained) |
| **13.40** | 322 | Tagline locked | **Final hit + resolving major chord** (Db/Ab warm), sub | logo hit |
| 13.60–14.30 | 326–343 | Underline draws | chord sustains | pen/ink stroke (very soft) |
| 14.30–15.00 | 343–360 | Settled hero | chord rings out, gentle fade last 0.4s | room tone |

Mix rules:
- **No dynamic loudnorm / no global AGC.** Static gain only, then a transparent true-peak limiter (ceiling −1.5 dBTP). Target ≈ −14 LUFS integrated.
- Music never ducks under whooshes. Ducking only where intended: music duck ≤3 dB for 150ms under the 2.29 impact, nowhere else.
- The silence at 8.0–8.7 is a feature: nothing but drips.
