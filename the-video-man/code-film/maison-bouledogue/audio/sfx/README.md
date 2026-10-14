# SFX + ambience stem — Maison Bouledogue

100% procedural: numpy/scipy DSP only. No samples, no recordings, no ML. Seeded, deterministic.

Build: `python3 audio/sfx/build_sfx.py` (~4 min, CPU) → `public/audio/sfx.wav` + `public/audio/sfx_stems/{crowd,foley,ambience}.wav` + `audio/sfx/cues.json`.
Verify: `python3 audio/sfx/verify.py qa/sfx-1.png [fromFrame toFrame]` (length, LUFS, true peak, silence checks, waveform/spectrogram/RMS PNG with timeline markers).

Output: 48 kHz stereo 24-bit PCM, 2880000 samples (60.0 s). Integrated -20.0 LUFS, true peak -1.26 dBTP.
The three stems add up to sfx.wav exactly (the same limiter gain curve is applied to all of them).
Stem loudness (gated): crowd -17.47, foley -24.66, ambience -37.85 LUFS.
Ambience beds (murmur, room tone, backstage bed) are ducked −4 dB inside every dialogue window.

## Files
- `dsp.py`: filters, envelopes, modal synth, pitch-drop thump, STFT-shaped noise, synthetic stereo IR reverb (theatre hall RT 2.1/1.1 s, backstage room 0.55 s), equal-power pan, `Bus` (dry + hall/room sends, hard cut at scene changes).
- `crowd.py`: the voices and the crowd.
  - `vox`: additive glottal harmonics (−1.15 spectral tilt) through 3 parallel Lorentzian formants with per-sample formant tracks, plus aspiration noise. Rendered at 16 kHz, then upsampled.
  - `murmur_voice`: "animalese" babble. Phrases and syllables with random vowels, declination, stress accents, jitter, consonant noise bursts, occasional laughs.
  - `crowd_murmur`: N voices at random distances (lowpass + gain), each panned.
  - `reaction`: ooh / aah / oh / whoa / titter.
  - `cheering`: woo / yeah / bravo / hey.
  - `crowd_gasp`: unvoiced 'hh-æ' inhales made from STFT-shaped noise, with onsets clustered within about 70 ms and an abrupt stop.
  - `clap_kernel`: resonant noise burst with a second palm contact.
  - `applause`: clappers with individual rates and quit thresholds driven by a control curve, grouped by timbre for FFT convolution.
  - `whistle`: wolf whistle or finger whistle.
- `foley.py`:
  - Ambience and room: room_tone, arc_hum, servo_creak.
  - Title and flashes: spotlight_clunk, letter_thump, shimmer, flash (shutter + bulb pop + capacitor whine), curtain_whip.
  - Backstage: sewing_machine, hanger_clatter, shoe_step, rustle.
  - Heels and walkers: hammer_hit, ratchet, stiletto, hoof_heel, penguin_pat.
  - Pearls, crystals and glass: crystal_ping, pearl_click (floor / pearl-on-pearl modal), bounce_schedule (ballistic, with restitution), roll, string_snap, lens_clink.
  - Penguin slide and float: slide_whistle, skid, rumble_slide, spin_whirr, umbrella_pop (whump + rib clicks + boing), boing, wind.
  - Finale: confetti_cannon, confetti_rustle, bow_creak, ting, title_slam.
  - General: whoosh, sunglasses_squeak (stick-slip).
- `build_sfx.py`: the cue sheet, the mix and the master (−20 LUFS; look-ahead true-peak limiter at −1.3 dBTP on 4× oversampled peaks).
- `verify.py`: QA.

## Cue list (frames @ 24 fps)
| frames | id | stem | description |
|---|---|---|---|
| 0–1440 | `theatre_room_tone` | ambience | pink-noise HVAC air + faint 60 Hz hum; drops to ~-70 dBFS in the dead silence 1041-1175 |
| 0–1040 | `crowd_murmur` | ambience | 28 formant-babble voices; hush at spotlight (12-40), muffled through wall in S2, cut dead at the gasp (1040) |
| 12–12 | `spot_on` | foley | spotlight clunk: pitch-drop thump + modal metal + latch |
| 12–48 | `spot_sweep` | foley | spot yoke friction squeak + motor while sweeping |
| 13–192 | `arc_hum` | foley | carbon-arc spotlight buzz |
| 56–104 | `letter_thumps` | foley | 13 marquee-letter thumps every 4 f (56..104), panned L->R across the title |
| 112–192 | `title_applause` | crowd | polite applause under title reveal (70 clappers), hard cut 192 |
| 116–142 | `subtitle_shimmer` | foley | sparkle grains + rising swish |
| 132–132 | `flash` | foley | shutter ch-chk + flashbulb pop + capacitor whine |
| 141–141 | `flash` | foley | shutter ch-chk + flashbulb pop + capacitor whine |
| 147–147 | `flash` | foley | shutter ch-chk + flashbulb pop + capacitor whine |
| 158–158 | `flash` | foley | shutter ch-chk + flashbulb pop + capacitor whine |
| 176–192 | `curtain_whip` | foley | velvet whoosh w/ flutter, velvet whap ~190, hard cut 192 |
| 192–456 | `backstage_room_tone` | ambience | smaller brighter room tone + fluorescent 50 Hz hum |
| 192–456 | `fabric_rustles` | ambience | random tulle / garment-bag rustles |
| 193–213 | `sewing_machine` | ambience | motor whine + stitch clatter run (off left) |
| 196–230 | `assistant_footsteps` | ambience | hurrying dresser footsteps crossing |
| 199–219 | `hanger_clatter` | ambience | wire hangers clinking + rail scrape |
| 214–262 | `hammer` | foley | 3 hammer hits on metal heel cage (214, 238, 262), each a little higher |
| 226–240 | `sewing_machine` | ambience | motor whine + stitch clatter run (off left) |
| 247–267 | `hanger_clatter` | ambience | wire hangers clinking + rail scrape |
| 280–300 | `heel_ratchet` | foley | telescoping ratchet 'crrrk' 280-300 + lock clunk at 300 |
| 318–352 | `sewing_machine` | ambience | motor whine + stitch clatter run (off left) |
| 331–351 | `hanger_clatter` | ambience | wire hangers clinking + rail scrape |
| 340–372 | `assistant_footsteps` | ambience | hurrying dresser footsteps crossing |
| 371–391 | `hanger_clatter` | ambience | wire hangers clinking + rail scrape |
| 392–436 | `sewing_machine` | ambience | motor whine + stitch clatter run (off left) |
| 418–438 | `hanger_clatter` | ambience | wire hangers clinking + rail scrape |
| 420–450 | `assistant_footsteps` | ambience | hurrying dresser footsteps crossing |
| 438–450 | `pearl_whip` | foley | whoosh + 46 pearl-on-pearl rattle clicks along the swing |
| 450–470 | `hanger_clatter` | ambience | wire hangers clinking + rail scrape |
| 488–580 | `stiletto_clicks` | foley | metal-cage stiletto clicks every 12 f: [488, 500, 512, 524, 536, 548, 560, 572], pan -0.85 -> 0 |
| 488–700 | `chandelier_jingle` | foley | crystal prism pings: gentle while walking, WILD 612-652 swinging L/R, settles by 664 |
| 586–606 | `flash_storm` | foley | 10 press flashes at frames [586.0, 587.2, 587.7, 588.6, 591.0, 593.1, 594.7, 598.0, 599.9, 604.0] |
| 613–660 | `crowd_ooh` | crowd | 44 voices 'ooh' (u->o, pitch swell) during teeter |
| 656–690 | `crowd_aah` | crowd | 44 voices relieved falling 'aah' (breathy) |
| 658–716 | `flamingo_applause` | crowd | light relieved applause as flamingo exits |
| 664–690 | `stiletto_clicks_exit` | foley | exit clicks [664, 676, 688], pan 0 -> +0.9 |
| 720–792 | `hoof_heel_clicks` | foley | hoof-heel clops every 12 f [720, 732, 744, 756, 768, 780, 792] + subtle pearl rattle, pan -0.85 -> 0 |
| 800–812 | `neck_swoop` | foley | soft air swoosh of the neck-swoop pose |
| 806–822 | `flash_storm` | foley | 8 press flashes at frames [806.0, 810.5, 810.6, 811.1, 814.8, 815.0, 815.3, 819.0] |
| 840–846 | `PEARL_SNAP` | foley | silk strand crack + downward twang, burst whoosh, 80 pearl-pearl collisions |
| 842–856 | `crowd_oh` | crowd | short shocked 'oh!' at the snap |
| 850–936 | `pearl_rain` | foley | 360+26 pearls, 2626 individual modal impacts on ballistic bounce-decay schedules (dense 850-900), ~30% roll away 900-936 |
| 852–870 | `sunglasses_slide` | foley | stick-slip squeak down the nose (852-866), last nudge 867-870 + tiny tick |
| 921–956 | `crowd_titter` | crowd | small ripple of laughter after "Non non non" |
| 956–988 | `penguin_pitter_pat` | foley | flipper-foot pats every 4 f [956, 960, 964, 968, 972, 976, 980, 984, 988], pan -0.85 -> -0.25 |
| 992–1001 | `slip_whoop` | foley | slide-whistle whoop up + rubbery foot skid |
| 992–1036 | `rolling_pearl_rumble` | foley | brown-noise rumble + ~260/s granular pearl clicks, pans L->R with the slide |
| 1004–1040 | `crowd_whoa` | crowd | rising tension 'ooooOOH' under the slide, cut at 1040 |
| 1012–1036 | `spin_whirr` | foley | rotation-rate AM whoosh (3->10 Hz) + whirr tone, pan orbits |
| 1035–1046 | `launch_whoosh` | foley | edge knock + whoosh as penguin flies off the runway end |
| 1040–1051 | `CROWD_GASP` | crowd | 60 unvoiced formant-shaped inhales (+10 voiced hah!), onsets within ~70 ms, abrupt stop -> dead silence |
| 1060–1172 | `float_wind` | ambience | gentle high-air breeze + veil flutter while penguin floats |
| 1060–1090 | `UMBRELLA_POP` | foley | sub whump + fabric snap + rib clicks + spring boing |
| 1152–1152 | `single_clap` | crowd | one lonely clap (left), big hall tail |
| 1166–1166 | `second_clap` | crowd | a second clapper (right) |
| 1176–1177 | `confetti_cannons` | foley | two pneumatic confetti cannons L/R |
| 1176–1412 | `UPROAR_applause` | crowd | 180 clappers, burst at 1176, bump at bow 1244, thins under S6 dialogue, gone by 1412 |
| 1176–1332 | `cheering` | crowd | 130 'woo/yeah/bravo/hey' formant voices, densest 1176-1200, 'bravo' bump at the bow |
| 1178–1250 | `whistles` | crowd | 8 wolf / finger whistles |
| 1180–1300 | `confetti_rustle` | foley | falling paper confetti grains, thinning |
| 1238–1260 | `bulldog_bow` | foley | comic stick-slip wood creak + cloth swish |
| 1328–1328 | `wink_ting` | foley | sparkle-bell ting |
| 1377–1384 | `final_title_slam` | foley | rising pre-whoosh into sub boom + slam + plate ring |
| 1410–1428 | `last_pearl_roll` | foley | single pearl rolling toward camera, rising + brightening, seam ticks |
| 1428–1428 | `LENS_CLINK` | foley | glass lens clink, beating partial pairs |

Pan convention: runway walkers go left → right. Flamingo −0.85 → 0 (488–584), then 0 → +0.9 on the exit. Giraffe −0.85 → 0. Penguin −0.85 → −0.25 while walking, then −0.25 → +0.85 on the slide.
