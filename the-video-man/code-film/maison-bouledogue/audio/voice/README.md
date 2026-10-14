# Voice + lip sync — MAISON BOULEDOGUE

Everything is made with code and uses no ML. The voices come from the classic macOS `say` voices (Eloquence and compact MacinTalk voices, none of them neural). The DSP uses numpy, scipy and pedalboard (RubberBand pitch shift and plain filters). Phonemes come from a CMUdict lookup, and alignment comes from the energy envelope.

Rebuild everything with `python3 audio/voice/build.py`, which takes about 8 minutes because it makes many `say` calls. QA plots come from `python3 audio/voice/plot_qa.py L02 L05`, which writes to `qa/`.

## Casting (from the auditions in `audition.py`)
| char | voice | why |
|---|---|---|
| bulldog | **Grandpa (French (France))**, Eloquence | A real French voice reading English text that has been respelled in French spelling ("Ze ilze! Aïeur!"), which gives a thick, pompous accent. It is pitched down 4 semitones and has a parallel saturated "growl" band with 34 Hz vocal-fry AM plus a chesty low-shelf EQ. The raw English voices (Ralph and Fred) ran 5.1 s on L02 against a 3.75 s window. |
| mouse | **Kathy**, compact en_US | A flat, dry, deadpan delivery. A tape-speed resample raises it +5 semitones, and the formants rise with it, so she sounds tiny. It uses a close, dry mic with a presence and air shelf. The Flo, Shelley and Sandy en_US voices were too bubbly or too long for L03. |
| announcer | **Thomas**, compact fr_FR | A grand Parisian delivery, with the English lines respelled ("Louk ouane"). It is pitched down 2 semitones and runs through a 280 Hz–5.2 kHz PA-horn band, a 1.7 kHz honk and light horn breakup. It is then convolved with a synthetic stereo hall IR (RT60 1.9 s, 28 ms predelay, early reflections), so it is the only wide or stereo element. |

`lines.py` holds the per-word `(display word, spoken respelling, pause ms)` tokens. Pauses become `[[slnc N]]` and give the comic beats "Flamingo, in… Vertigo.", "It was… intentional.", "oxygen… in pearls!" and "Oh… oh my." The speaking rate goes through `[[rate N]]`. `build.py` raises the rate first and then shrinks the pauses (never below 60 %) until each line ends at least 4 frames before `maxEnd`.

Loudness: each line is set to −16 LUFS integrated, measured with pyloudnorm and trimmed by a numpy lookahead peak limiter with a −1.5 dBFS ceiling. `public/audio/dialogue.wav` is a 60.0 s, 48 kHz stereo file. Each line starts exactly at `start*2000` samples. Characters are centred at −3 dB pan law, and the announcer is stereo with its reverb tail.

## Lip sync method (`visemes_for` in build.py)
1. Text → ARPAbet via CMUdict. French and proper words come from an `EXTRA` table, and a small rule-based letter-to-sound fallback covers anything else.
2. Word timing: every word prefix of the line is rendered with the same voice, rate and pauses. The trimmed length of each prefix gives that word's end time in context. The time is scaled by the mouse's resample factor and snapped to the nearest energy dip (±45 ms) in the processed audio.
3. Inside each word, silent hops (below the line's peak −32 dB) are cut off the edges. Phonemes are spread in proportion to their weights (stressed vowels > vowels > sonorants > plosives).
4. Each frame takes the shape with the most overlap, and P/B/M are weighted ×2.5 so closures always read. The mapping is: A = P B M; B = consonants and IY/IH; C = EH/AE/AH/EY; D = AA/AY/AW; E = AO/ER/R; F = UW/OW/W/UH; G = F V; H = L.
5. Energy check: a silent frame becomes X when the silence lasts 4 frames or more, otherwise A. A loud C becomes D, a quiet D becomes C, and a very quiet C becomes B.
6. Every shape is held for at least 2 frames, and A closures steal a frame from a neighbour instead of vanishing. Keys are shifted 1 frame early, and each line ends with X.

## Files
- `build.py`, `lines.py`, `audition.py` and `plot_qa.py` are the scripts. `raw/` holds the `say` renders, and `qa/` holds the plots.
- The outputs are `public/audio/voice/L01–L11.wav`, `public/audio/dialogue.wav`, `src/data/dialogue_timing.json` (which also has `words`, `spoken` and `rate`) and `src/data/visemes.json`.

## Known weaknesses
- No speech recognition was used, so intelligibility was judged by design and not by listening. The respellings are the risky part: if a word reads badly, edit its spoken token in `lines.py` and rebuild.
- The announcer's reverb tail (about 1.5 s) runs past `maxEnd` in the WAV. The `end` in the timing file is the end of the dry voice.
- Word-level alignment is good, but alignment inside words is proportional, so short consonants such as the F in "Flamingo" can be absorbed by the min-2-frame rule.
