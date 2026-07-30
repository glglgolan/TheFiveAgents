#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fold the round-1 generated PNGs back into the freshly-rebuilt storyboard_v3.json by
scanning the scenes/ directory directly (the old jobs.json manifest was overwritten by a
later build_jobs.py run, but the actual PNG files are still on disk and the naming is
deterministic: shot_id with '.' -> '_', plus '_A'/'_B' for pairs).

SKIPS shot_ids being redone or discarded in round 2 — for those, any stale file on disk is
left alone and will simply be overwritten once round-2 generation completes.
"""
import json, os, re

V3_DIR = "/Users/lirazgolan/claude_projects/TheFiveAgents/bambi/outputs/Raz Bar Mitzva/2026-07-26-v3"
SCENES_DIR = f'{V3_DIR}/scenes'

SKIP = {
    't01-02', 't04-05', 't05-06', 't12-13', 't17-18', 't20-21', 't25-26', 't26-27',
    's07.2', 's14.2', 's09.2', 's20.2', 's27.3',
}

v3 = json.load(open(f'{V3_DIR}/storyboard_v3.json', encoding='utf-8'))
shots_by_id = {s['shot_id']: s for s in v3['shots']}

files = os.listdir(SCENES_DIR)

# group files by shot_id (reverse the sid.replace('.','_') + optional _A/_B convention)
by_shot = {}
for fname in files:
    if not fname.endswith('.png'):
        continue
    stem = fname[:-4]
    m = re.match(r'^(.*)_([AB])$', stem)
    if m:
        sid_key, frame = m.group(1), m.group(2)
    else:
        sid_key, frame = stem, None
    if sid_key.startswith('t'):
        sid = sid_key  # t01-02 — no dot substitution needed
    else:
        sid = re.sub(r'_(\d+)$', r'.\1', sid_key)  # s07_2 -> s07.2, s10_1 -> s10.1
    by_shot.setdefault(sid, {})[frame] = os.path.join(SCENES_DIR, fname)

applied = 0
for sid, frames in by_shot.items():
    if sid in SKIP:
        continue
    sh = shots_by_id.get(sid)
    if sh is None:
        continue
    if set(frames.keys()) == {None}:
        out = frames[None]
        assert os.path.getsize(out) > 50_000, f'{sid} small file'
        sh['image_existing'] = out
        sh['image_dim'] = '1536x1024'
        sh['tier'] = 'A'
        sh.pop('image_note', None)
        sh.pop('needs_regen', None)
        sh['type'] = 'i2v'
        applied += 1
    elif 'A' in frames and 'B' in frames:
        for f in (frames['A'], frames['B']):
            assert os.path.getsize(f) > 50_000, f'{sid} small file'
        sh['frame_a'] = frames['A']
        sh['frame_b'] = frames['B']
        sh['image_existing'] = frames['A']
        sh['image_dim'] = '1536x1024'
        sh['tier'] = 'A'
        sh.pop('image_note', None)
        sh.pop('needs_regen', None)
        sh['type'] = 'first_tail'
        applied += 1

with open(f'{V3_DIR}/storyboard_v3.json', 'w', encoding='utf-8') as f:
    json.dump(v3, f, ensure_ascii=False, indent=2)

print(f'{applied} previously-generated shots reapplied (skipped {len(SKIP)} shot_ids for redo/discard)')
