# Maison Bouledogue — score

All audio is synthesized in `synth.py`, using only numpy and scipy. There are no samples, soundfonts, recordings or ML models anywhere in the chain.
- Rebuild: `python3 audio/music/compose.py` (about 30–80 s). This writes `public/audio/music.wav` and `public/audio/music_stems/{drums,bass,keys,brass,fx}.wav`.
- Verify: `python3 audio/music/verify.py`. It checks length, LUFS, true peak, the silent ranges and every event onset, and writes `qa/overview.png` and `qa/zooms.png`.
- Format: 48 kHz stereo, 24-bit, exactly 2,880,000 samples (60.000 s = 1440 frames × 2000 samples). The mastered numbers are in `master_info.json`.
- Grid: 120 BPM = 12 frames per beat. The runway grid is beat n = frame 12n, so 456, 696, 840, 936, 1176, 1224 and 1428 are all on the grid. Swing is full triplet, which puts the off-beat 8 frames after the beat. That means the flamingo heel clicks (488 + 12k) fall on the swung off-beats. The S2 grid is 214 + 12k.

## Cue sheet (frames)
| Frames | Cue | Content |
|---|---|---|
| 0–56 | 1M1 Drumroll | Timpani roll on D2 plus snare roll, crescendo, with a reverse cymbal into 56 |
| 56,60,…,104 | Letter stabs | 13 open-brass stabs on a rising, harmonised D-major line. A timpani tap lands on each one |
| 104 | Tutti | D-major brass tutti, crash, timpani and sub bass |
| 116 | Subtitle shimmer | Dadd9 string pad with tremolo, plus a celesta sparkle arpeggio (116–134) |
| 140–178 | Swell | Brass walk-up G→A→D→A7 with long attacks, swelling strings, timpani and snare rolls, reverse cymbal |
| 178 | Whip | Tutti hit, a string glissando rising two octaves, a harpsichord scale run and a noise whoosh. **Hard stop at 192** |
| 193–280 | 2M1 Backstage | Harpsichord 16ths ostinato (Dm → Gm/D) and straight pizzicato 8ths |
| 214, 238, 262 | Hammer accents | Pizzicato chord, muted-brass "bap" and timpani |
| 280–300 | Ratchet | 25-note chromatic harpsichord+pizz run (A3→A5, every 0.8 frame), with a "plink" at 300 |
| 310–382 | Deadpan | Thins to 8ths and quarters for the mouse, with tiptoe pizz answers |
| 382–440 | Build | 16ths return with a crescendo and tremolo strings (Bb → A7) |
| 440 | Sting | A7b9 brass sfz, timpani, crash and a harpsichord run down. Riser from 444 to 456 |
| 456 | 3M1 Runway kick-in | Tutti plus crash, then the full electro-swing groove (Dm–Bb–Gm–A7): kick, clap+snare, swung hats, walking upright/slap bass, plucky synth hook, organ chops, muted-trumpet stabs on the swung "and" of beats 2 and 4 |
| 584 | Flamingo pose | Open brass A7 stab and crash (lands on the swung "and" of beat 3) |
| 612–656 | Teeter | Kick and clap drop out. A semitone-wobbling bass, trilling pluck, seasick brass cluster (A–Bb–C#, heavy vibrato), and timpani and snare rolls |
| 656 | Relief | Warm F-major brass bloom, strings, harpsichord arpeggio and soft crash. The groove resumes at 660, with a triplet fill into 696 |
| 696–840 | 4M1 Giraffe | B section (Gm–Eb–A7) with an open-trumpet melody. Accent at 804 (brass, crash, timpani), fill at 828–836 |
| 840 | Snap | Tape-stop of the groove, pitch sliding to zero over 840–858 |
| 860, 864, 868 | Record skip | Stutter repeats of the downbeat, pitched down and fading |
| 871–876 | Scratch | Back-and-forth record scratch |
| 876–936 | Limp | The groove at half speed: an octave down, low-passed at 1.1 kHz, with wow |
| 936–992 | 5M1 Cautious | Kick on beats 1 and 3, soft hats, bass. Pizzicato waddle from 956 |
| 992–1040 | Slide | Accelerating chromatic pizz+harpsichord ostinato, bass tremolo, snare roll, brass cluster and noise riser |
| **1040–1060** | **Silence** | Digital zero, hard cut at 1040 |
| 1060–1150 | Float | Sparse FM celesta in D lydian (with G#), a faint glass pad and a large hall reverb. Fades out 1143–1150 |
| **1150–1176** | **Silence** | Digital zero (the claps are SFX) |
| 1176 | 5M2 Drop | Big tutti, double crash, then the D-major groove with slap bass and a brass fanfare melody |
| 1224–1368 | 6M1 Bow | Groove at −3 dB (D–Bm–G). **Ta-da** is a short A chord at 1236 and a D chord at 1240 |
| 1328 | Wink | Pizz grace notes at 1322 and 1325, a celesta "ting" at 1328 and a muted-trumpet "wah" fall |
| 1368–1380 | Fill | A7 bar with a snare triplet fill and brass pickups |
| 1384 | Title hit | Grand D-major tutti, then a string pad swell, D pedal and timpani roll (1404–1427) |
| 1428 | Button | Final D6/9 tutti hit (brass, crash, timpani, kick, sub). Rings out, fades 1431–1436 |
| **1436–1440** | **Silence** | Digital zero |

## Synthesis methods
- **Brass**: additive, band-limited harmonics. Brightness tracks the amplitude envelope (`bright^(k-1)`), giving the brass "bwah". It has a pitch scoop, delayed 5.4 Hz vibrato, optional fall-off, and breath noise. Muted mode adds a harmon-mute formant around 1.5 kHz; open mode is warmer around 1.2 kHz.
- **Pizzicato, harpsichord, upright bass**: Karplus-Strong run as a single rational IIR through `lfilter`. An allpass fractional delay keeps the tuning accurate, and the pick-position comb and excitation low-pass shape the tone. The harpsichord uses two detuned strings plus a quill click. The bass adds a sine fundamental and thump, and slap mode adds an octave pluck and a click.
- **Synth hook and chops**: stereo detuned additive saws with a decaying-brightness pluck envelope.
- **Strings and pads**: 3 detuned additive voices per note spread across the stereo field, with optional tremolo, glissando and swell.
- **Celesta**: FM at 1:4 with a decaying index, plus struck-bar partials at 2.76× and 5.4×.
- **Drums**: kick is a pitch-swept sine plus a click, soft-clipped. Clap is triple bursts of band-passed noise with a tail. Snare is noise plus a 185/330 Hz tone. Hats are 808-style square-cluster metal plus noise, high-passed. Crash is decorrelated stereo noise plus inharmonic partials. Timpani use modal membrane ratios (1, 1.504, 1.742, 2.0…) and a mallet thud.
- **FX**: chunked band-pass noise sweeps for the risers and whoosh, and a reverse cymbal.
- **Tape and vinyl**: varispeed read-head resampling for the tape-stop, stutter, scratch and half-speed limp.
- **Reverb**: Freeverb network (8 damped combs + 4 allpasses per channel, stereo spread 23), rendered as impulse responses and FFT-convolved. There are two IRs: hall (3.2 s) and room (1.1 s). Reverb is applied per segment (0–192, 192–1040, 1060–1150, 1176–1436), so tails never leak into the hard cuts.
- **Master**: 28 Hz high-pass, then an RMS bus compressor (2:1, −16 dB threshold), then a look-ahead true-peak limiter (4× oversampled, ceiling −1.8 dBTP) inside an iterative loudness loop targeting −16 LUFS. Silence gates are applied last.

## Stems
The stems are pre-compressor and pre-limiter, scaled by the master gain and gated the same way. Summed, they are close to the master but not identical to it.
