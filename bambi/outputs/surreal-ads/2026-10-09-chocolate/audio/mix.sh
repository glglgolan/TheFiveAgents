#!/usr/bin/env bash
# MELT v2 — sound design mix (ElevenLabs music v2.5 + SFX v2). Run from the run dir.
# Timeline (s): reverse swell → crack+sub-boom 2.27 · whoosh 5.08 · pour 5.4–7.95 · [8.0 silence beat] · whip whoosh 8.95 · drip ~10.06 · reprise 11.0 · foil 11.95 · logo hit 13.4
set -euo pipefail
FF="$(dirname "$0")/../../../../../.claude/skills/kinetic-typography/.venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1"
A=audio
"$FF" -y -loglevel error \
 -i $A/music_a.mp3 -i $A/music_a.mp3 -i $A/music_a.mp3 \
 -i $A/crack_a.mp3 -i $A/whoosh_a.mp3 -i $A/pour_a.mp3 -i $A/whoosh_b.mp3 -i $A/drip_a.mp3 -i $A/foil_a.mp3 -i $A/hit_a.mp3 -i $A/sub_boom.wav -i $A/whoosh_a.mp3 \
 -filter_complex "\
[0]atrim=0:8.0,afade=t=in:d=0.05,afade=t=out:st=7.88:d=0.12,volume=0.9[m1];\
[1]atrim=8.0:11.0,asetpts=PTS-STARTPTS,volume=0.16,afade=t=in:d=0.4,afade=t=out:st=2.6:d=0.4,adelay=8000|8000[m2];\
[2]atrim=0:4.0,asetpts=PTS-STARTPTS,afade=t=in:d=0.12,afade=t=out:st=2.6:d=1.4,volume=0.85,adelay=11000|11000[m3];\
[3]volume=0.9,adelay=2240|2240[s1];\
[4]volume=0.7,adelay=4950|4950[s2];\
[5]afade=t=in:d=0.4,afade=t=out:st=2.2:d=0.35,volume=0.55,adelay=5400|5400[s3];\
[6]volume=0.5,adelay=8760|8760[s4];\
[7]volume=1.6,adelay=9000|9000[s5];\
[8]volume=0.7,adelay=11000|11000[s6];\
[9]volume=0.3,adelay=12880|12880[s7];\
[10]volume=0.8,adelay=2270|2270[s8];\
[11]areverse,afade=t=in:d=0.6,volume=0.45,adelay=940|940[s9];\
[m1][m2][m3][s1][s2][s3][s4][s5][s6][s7][s8][s9]amix=inputs=12:normalize=0:dropout_transition=0,atrim=0:15,apad=whole_dur=15,aresample=48000,loudnorm=I=-14:TP=-2:LRA=11,aresample=48000,alimiter=limit=0.8:level=false[out]" \
 -map "[out]" -c:a pcm_s16le $A/mix.wav
"$FF" -y -loglevel error -i final_typo.mp4 -i $A/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart MELT_final.mp4
echo "[mix] MELT_final.mp4"
