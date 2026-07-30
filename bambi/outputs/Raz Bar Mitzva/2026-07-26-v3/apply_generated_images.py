#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fold the 49 freshly generated PNGs (jobs.json outputs) back into storyboard_v3.json:
mark images as existing (tier A, 1536x1024), clear needs_regen/missing image flags,
advance each shot's type to reflect 'image ready, video still pending'."""
import json, os

V3_DIR = "/Users/lirazgolan/claude_projects/TheFiveAgents/bambi/outputs/Raz Bar Mitzva/2026-07-26-v3"

v3 = json.load(open(f'{V3_DIR}/storyboard_v3.json', encoding='utf-8'))
jobs = json.load(open(f'{V3_DIR}/jobs.json', encoding='utf-8'))

by_shot = {}
for j in jobs:
    by_shot.setdefault(j['shot_id'], []).append(j)

applied = 0
for sh in v3['shots']:
    sid = sh['shot_id']
    if sid not in by_shot:
        continue
    js = by_shot[sid]
    if len(js) == 1 and not js[0]['job_id'].endswith(('.A', '.B')):
        # standard single-image shot
        out = js[0]['output']
        assert os.path.exists(out) and os.path.getsize(out) > 50_000, f'{sid} missing/small file'
        sh['image_existing'] = out
        sh['image_dim'] = '1536x1024'
        sh['tier'] = 'A'
        sh.pop('image_note', None)
        sh.pop('needs_regen', None)
        sh['type'] = 'i2v'  # image ready, video generation pending
        applied += 1
    else:
        # paired A/B shot
        a = next(j for j in js if j['job_id'].endswith('.A'))
        b = next(j for j in js if j['job_id'].endswith('.B'))
        for j in (a, b):
            assert os.path.exists(j['output']) and os.path.getsize(j['output']) > 50_000, f'{j["job_id"]} missing/small file'
        sh['frame_a'] = a['output']
        sh['frame_b'] = b['output']
        sh['image_existing'] = a['output']
        sh['image_dim'] = '1536x1024'
        sh['tier'] = 'A'
        sh.pop('image_note', None)
        sh.pop('needs_regen', None)
        sh['type'] = 'first_tail'  # frames ready, video (first/tail interpolation) pending
        applied += 1

with open(f'{V3_DIR}/storyboard_v3.json', 'w', encoding='utf-8') as f:
    json.dump(v3, f, ensure_ascii=False, indent=2)

print(f'{applied} shots updated with generated images')
