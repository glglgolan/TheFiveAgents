#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Turn storyboard_v3.json into a flat image-generation job list (jobs.json):
one entry per PNG to render, with prompt, ordered --reference paths, output path, size.
Paired (A/B) shots split into two jobs. Mechanical only — no creative decisions here,
all prompts/references are already authored in the storyboard."""
import json, os, re

BASE = "/Users/lirazgolan/claude_projects/TheFiveAgents"
V3_DIR = f'{BASE}/bambi/outputs/Raz Bar Mitzva/2026-07-26-v3'
SCENES_OUT = f'{V3_DIR}/scenes'
os.makedirs(SCENES_OUT, exist_ok=True)

v3 = json.load(open(f'{V3_DIR}/storyboard_v3.json', encoding='utf-8'))
cast_by_id = {c['id']: c for c in v3['cast']}

def refs_for_characters(chars, glasses=False):
    out = []
    for cid in chars or []:
        c = cast_by_id.get(cid)
        if not c:
            continue
        if glasses and cid == 'raz_teen' and c.get('anchor_alt_glasses'):
            path = c['anchor_alt_glasses']
        else:
            path = c.get('anchor_image')
        if path and path not in out:  # dedupe — e.g. mom_adi and dad_amos share one photo
            out.append(path)
    return out

jobs = []
for sh in v3['shots']:
    if sh.get('type') not in ('missing', 'needs_regen', 'first_tail_new'):
        continue
    sid = sh['shot_id']
    ip = sh.get('image_prompt', '')
    ref_field = (sh.get('reference') or '').strip()

    # explicit reference field: strip parenthetical notes, split on ' + '
    explicit_refs = []
    if ref_field:
        for part in ref_field.split(' + '):
            path = re.sub(r'\s*\(.*?\)\s*', '', part).strip()
            if path:
                explicit_refs.append(path)

    if '||' in ip:
        # paired frame A / frame B
        part_a, part_b = ip.split('||', 1)
        if sid == 's10.1':
            # frame A = child+mom, frame B = teen(glasses)+mom — distinct casts per frame
            refs_a = [cast_by_id['mom_adi']['anchor_image'], cast_by_id['raz_child']['anchor_image']]
            refs_b = [cast_by_id['mom_adi']['anchor_image'], 'yuval/reference/Raz/_proxy/2026-teen-book-raz-22.jpg']
        else:
            refs_a = refs_b = explicit_refs or refs_for_characters(sh.get('characters'), sh.get('glasses_applied'))
        jobs.append(dict(job_id=f'{sid}.A', shot_id=sid, prompt=part_a.strip(),
                          references=refs_a, output=f'{SCENES_OUT}/{sid.replace(".","_")}_A.png'))
        jobs.append(dict(job_id=f'{sid}.B', shot_id=sid, prompt=part_b.strip(),
                          references=refs_b, output=f'{SCENES_OUT}/{sid.replace(".","_")}_B.png'))
    else:
        refs = explicit_refs or refs_for_characters(sh.get('characters'), sh.get('glasses_applied'))
        jobs.append(dict(job_id=sid, shot_id=sid, prompt=ip.strip(),
                          references=refs, output=f'{SCENES_OUT}/{sid.replace(".","_")}.png'))

with open(f'{V3_DIR}/jobs.json', 'w', encoding='utf-8') as f:
    json.dump(jobs, f, ensure_ascii=False, indent=2)

print(f'{len(jobs)} image jobs written to {V3_DIR}/jobs.json')
with_ref = sum(1 for j in jobs if j['references'])
print(f'{with_ref} with reference(s), {len(jobs)-with_ref} text-to-image only')
