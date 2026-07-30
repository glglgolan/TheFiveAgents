#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Render storyboard_v3.json -> storyboard_v3_coverage.html — standalone shot-by-shot
coverage widget. No external deps. Reload after regenerating assets to refresh status."""
import json, os, urllib.parse

BASE = "/Users/lirazgolan/claude_projects/TheFiveAgents"
V2_SCENES_DIR = f'{BASE}/bambi/outputs/Raz Bar Mitzva/2026-06-27-bar-mitzva'
V3_DIR = f'{BASE}/bambi/outputs/Raz Bar Mitzva/2026-07-26-v3'

v3 = json.load(open(f'{V3_DIR}/storyboard_v3.json', encoding='utf-8'))

def file_uri(p):
    if not p: return None
    if p.startswith('/'):
        full = p
    else:
        full = os.path.join(V2_SCENES_DIR, p)
    if not os.path.exists(full):
        return None
    return 'file://' + urllib.parse.quote(full)

TIER_COLOR = {'A': 'var(--ok)', 'B': 'var(--draft)', 'C': 'var(--bad)', None: 'var(--pending)'}
TIER_LABEL = {'A': 'Tier A · תקני', 'B': 'Tier B · לא-תקני', 'C': 'Tier C · לפסול', None: '—'}
TYPE_ICON = {'first_tail': '🎞️ first/tail', 'first_tail_new': '🎞️ first/tail (חדש)', 'i2v': '▶️ i2v', 'missing': '⬜ חסר', 'needs_regen': '♻️ לרנדר מחדש'}

rows = []
shots = v3['shots']
total_need = 0
total_covered = 0
n_missing_img = n_missing_vid = n_existing_img = n_existing_vid = n_first_tail = 0
est_credits = 0

for sh in shots:
    sid = sh['shot_id']
    is_boundary = sh.get('is_boundary')
    img_uri = file_uri(sh.get('image_existing'))
    vid_uri = file_uri(sh.get('video_existing'))
    dur = sh.get('video_duration_sec')
    tier = sh.get('tier')
    typ = sh.get('type', 'missing')

    needs_regen = sh.get('needs_regen')

    if img_uri and not needs_regen: n_existing_img += 1
    else: n_missing_img += 1
    if vid_uri and not needs_regen: n_existing_vid += 1; total_covered += (dur or 0)
    else: n_missing_vid += 1
    if typ.startswith('first_tail'): n_first_tail += 1

    # credit estimate per shot, based on recommended model (from historical Kling job log:
    # v2_5 5s~25cr/10s~50cr avg~35; v3_0_turbo 10s~100cr/15s~150cr avg~120)
    model = sh.get('recommended_model', 'kling-video-v2_5')
    MODEL_COST = {'kling-video-v2_5': 35, 'kling-video-v3_0': 120, 'kling-video-v3_0_turbo': 120}
    if not vid_uri or needs_regen:
        est_credits += MODEL_COST.get(model, 35)

    img_cell = f'<img src="{img_uri}" loading="lazy">' if img_uri else '<div class="ph">אין תמונה</div>'

    if needs_regen:
        note = sh.get('image_note')
        note_html = f'<br><span class="dim">{note}</span>' if note else ''
        img_badge = f'<div class="badge regen">♻️ קיים אך לרנדר מחדש{note_html}</div>'
        vid_badge = f'<div class="badge regen">♻️ קיים אך לרנדר מחדש{note_html}</div>'
    else:
        if vid_uri:
            vid_badge = f'<div class="badge ok">✅ {os.path.basename(sh["video_existing"])}<br><span class="dim">{sh.get("video_dim","?")} · {dur:.1f}s</span></div>'
            if sh.get('shared_clip_note'):
                vid_badge += f'<div class="note">{sh["shared_clip_note"]}</div>'
        else:
            vid_badge = '<div class="badge missing">⬜ לייצר</div>'

        if img_uri:
            img_badge = f'<div class="badge ok">✅ {os.path.basename(sh["image_existing"])}<br><span class="dim">{sh.get("image_dim","?")}</span></div>'
        else:
            note = sh.get('image_note')
            note_html = f'<br><span class="dim">{note}</span>' if note else ''
            img_badge = f'<div class="badge missing">⬜ לייצר{note_html}</div>'

    frame_pair = ''
    if typ.startswith('first_tail'):
        fa = file_uri(sh.get('frame_a')); fb = file_uri(sh.get('frame_b'))
        frame_pair = '<div class="pair">'
        frame_pair += f'<img src="{fa}" title="frame A">' if fa else '<div class="ph small">A ⬜</div>'
        frame_pair += '<span class="arrow">→</span>'
        frame_pair += f'<img src="{fb}" title="frame B">' if fb else '<div class="ph small">B ⬜</div>'
        frame_pair += '</div>'

    if needs_regen:
        tier_chip = '<span class="chip" style="background:var(--draft)">היה Tier A · הוחלט לרנדר מחדש</span>'
    else:
        tier_chip = f'<span class="chip" style="background:{TIER_COLOR.get(tier)}">{TIER_LABEL.get(tier)}</span>' if tier else ''
    glasses_chip = '<span class="chip" style="background:#5aa9e6">👓 עם משקפיים</span>' if sh.get('glasses_applied') else ''
    boundary_cls = ' boundary' if is_boundary else ''
    row_type_cls = typ.replace('_new','')

    row_status = 'missing' if (not vid_uri or needs_regen) else 'existing'
    needs_video = (not vid_uri) or needs_regen
    video_prompt = (sh.get('video_prompt') or '').strip()
    video_notes = (sh.get('video_notes') or '').strip()
    vp_html = f'<div class="vprompt">{video_prompt}</div>' if video_prompt else '<div class="vprompt dim">— אין video_prompt —</div>'
    vn_html = f'<div class="vnote">📝 {video_notes}</div>' if video_notes else ''
    checkbox_cell = (
        f'<input type="checkbox" class="vidchk" data-sid="{sid}" onchange="onChk()">'
        if needs_video else '<span class="dim" title="קליפ כבר קיים">✅</span>'
    )
    rows.append(f'''
    <tr class="row {row_type_cls}{boundary_cls}" data-status="{row_status}" data-type="{row_type_cls}">
      <td class="chk">{checkbox_cell}</td>
      <td class="sid">{sid}{' 🔗' if is_boundary else ''}</td>
      <td class="thumb">{img_cell}{frame_pair}</td>
      <td class="narr">
        <div class="scene-title">{sh['scene_title']}</div>
        <div class="excerpt">{sh['narration_excerpt']}</div>
        <div class="chars">{' · '.join(sh.get('characters') or []) or '—'}</div>
      </td>
      <td class="status">
        <div class="lbl">IMAGE</div>{img_badge}
        <div class="lbl">CLIP</div>{vid_badge}
        {tier_chip}
        {glasses_chip}
      </td>
      <td class="type">{TYPE_ICON.get(typ,typ)}{f'<div class="note">{model} · 🔇 no audio (וידאו ממתין)</div>' if not vid_uri and sh.get('recommended_model') else ''}</td>
      <td class="vprompt-cell">{vp_html}{vn_html}</td>
      <td class="ref">{os.path.basename(sh.get('reference') or '') or '—'}</td>
    </tr>''')

html = f'''<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Raz Bar Mitzva v3 — Coverage</title>
<style>
:root{{
  --bg:#0f1115; --card:#1a1d24; --card2:#20242d; --line:#2c313c;
  --ink:#e8eaed; --dim:#9aa0aa; --accent:#f0a63c;
  --ok:#3fb950; --bad:#e0574b; --draft:#d9822b; --pending:#6b7280;
}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,"Segoe UI","Heebo",Arial,sans-serif;padding:20px}}
header{{display:flex;flex-wrap:wrap;gap:20px;align-items:baseline;border-bottom:1px solid var(--line);padding-bottom:14px;margin-bottom:14px}}
h1{{font-size:20px;margin:0}}
.stats{{margin-inline-start:auto;display:flex;gap:18px;font-size:13px;color:var(--dim);flex-wrap:wrap}}
.stats b{{color:var(--ink);font-size:15px}}
.filters{{display:flex;gap:8px;margin-bottom:14px}}
.filters button{{background:var(--card2);color:var(--ink);border:1px solid var(--line);border-radius:7px;padding:6px 14px;font-size:13px;cursor:pointer;font-family:inherit}}
.filters button.active{{border-color:var(--accent);color:var(--accent)}}
table{{width:100%;border-collapse:collapse}}
.row{{background:var(--card);border-bottom:6px solid var(--bg)}}
.row td{{padding:10px;vertical-align:top;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}}
.row.boundary{{background:#241a2e}}
.row.boundary td:first-child{{border-inline-start:3px solid #8b5cf6}}
.sid{{font-family:ui-monospace,monospace;font-weight:700;font-size:13px;white-space:nowrap}}
.thumb{{width:150px}}
.thumb img{{width:140px;border-radius:6px;display:block}}
.ph{{width:140px;height:93px;background:var(--card2);border:1px dashed var(--line);border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--dim);font-size:11px;text-align:center}}
.ph.small{{width:60px;height:60px;font-size:9px}}
.pair{{display:flex;align-items:center;gap:4px;margin-top:6px}}
.pair img{{width:60px;border-radius:4px}}
.arrow{{color:var(--dim);font-size:12px}}
.narr{{max-width:280px}}
.scene-title{{font-weight:600;font-size:13px;margin-bottom:4px}}
.excerpt{{font-size:12px;color:var(--dim);margin-bottom:6px;line-height:1.4}}
.chars{{font-size:11px;color:var(--accent)}}
.status{{min-width:160px;font-size:12px}}
.lbl{{font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:.05em;margin-top:6px}}
.lbl:first-child{{margin-top:0}}
.badge{{border-radius:6px;padding:4px 8px;margin-bottom:2px}}
.badge.ok{{background:rgba(63,185,80,.12);color:var(--ok)}}
.badge.missing{{background:rgba(224,87,75,.12);color:var(--bad)}}
.badge.regen{{background:rgba(217,130,45,.15);color:var(--draft)}}
.badge .dim{{color:var(--dim);font-weight:400}}
.note{{font-size:10px;color:var(--dim);margin-top:2px}}
.chip{{display:inline-block;font-size:10px;padding:2px 7px;border-radius:10px;color:#0f1115;font-weight:700;margin-top:6px}}
.type{{font-size:12px;white-space:nowrap}}
.ref{{font-size:11px;color:var(--dim);max-width:130px;word-break:break-all}}
.chk{{width:26px;text-align:center}}
.chk input{{width:17px;height:17px;cursor:pointer}}
.vidchk:disabled{{cursor:not-allowed}}
.vprompt-cell{{max-width:260px;font-size:11.5px;line-height:1.45}}
.vprompt{{color:var(--ink)}}
.vprompt.dim{{color:var(--dim);font-style:italic}}
.vnote{{margin-top:6px;color:var(--accent);font-size:11px;background:rgba(240,166,60,.1);border-radius:6px;padding:4px 6px}}
.approvebar{{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:12px;background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin-bottom:14px}}
.approvebar b{{color:var(--accent)}}
.approvebar button{{background:var(--accent);color:#1a1206;border:none;border-radius:7px;padding:8px 16px;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit}}
.approvebar button:disabled{{opacity:.4;cursor:not-allowed}}
.approvebar .ghost{{background:transparent;color:var(--dim);border:1px solid var(--line);font-weight:400}}
#approveOut{{display:none;margin-bottom:14px;background:var(--card);border:1px solid var(--accent);border-radius:10px;padding:12px 14px}}
#approveOut textarea{{width:100%;min-height:90px;background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:8px;font-family:ui-monospace,monospace;font-size:12px}}
#approveOut .copied{{color:var(--ok);font-size:12px;margin-inline-start:8px}}
</style>
</head>
<body>
<header>
  <h1>רז בר מצווה — Storyboard v3 · Coverage</h1>
  <div class="stats">
    <div>שוטים <b>{len(shots)}</b></div>
    <div>תמונות קיימות <b>{n_existing_img}</b> / חסרות <b>{n_missing_img}</b></div>
    <div>קליפים קיימים <b>{n_existing_vid}</b> / חסרים <b>{n_missing_vid}</b></div>
    <div>first/tail <b>{n_first_tail}</b></div>
    <div>שניות מכוסות <b>{total_covered:.0f}</b> / 452</div>
    <div>הערכת קרדיטים לחסר <b>~{est_credits}</b> / 1779 זמינים</div>
  </div>
</header>
<div class="filters">
  <button class="active" onclick="filt('all',this)">הכל ({len(shots)})</button>
  <button onclick="filt('missing',this)">רק חסר ({n_missing_vid})</button>
  <button onclick="filt('existing',this)">רק קיים ({n_existing_vid})</button>
  <button onclick="filt('type:first_tail',this)">רק first/tail ({n_first_tail})</button>
</div>
<div class="approvebar">
  <label><input type="checkbox" id="selAll" onchange="toggleAll(this)"> בחר הכל (שטרם יוצר להם וידאו)</label>
  <span>נבחרו: <b id="selCount">0</b></span>
  <button id="btnApprove" onclick="buildApproval()" disabled>✅ אשר יצירת וידאו לנבחרים</button>
  <button class="ghost" onclick="clearAll()">נקה בחירה</button>
</div>
<div id="approveOut">
  <div>העתק את הטקסט הזה ושלח לי בצ'אט כדי שאתחיל לייצר את הסצנות שנבחרו במקביל:</div>
  <textarea id="approveText" readonly onclick="this.select()"></textarea>
  <button onclick="copyApproval()">העתק ללוח</button>
  <span id="copiedMsg" class="copied" style="display:none">✓ הועתק</span>
</div>
<table>
<thead><tr>
  <th></th><th>Shot</th><th>תמונה</th><th>סצנה / קריינות</th><th>סטטוס</th><th>סוג</th><th>Video prompt</th><th>Reference</th>
</tr></thead>
<tbody>
{''.join(rows)}
</tbody>
</table>
<script>
function filt(mode, btn){{
  document.querySelectorAll('.filters button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('tbody tr').forEach(r=>{{
    if(mode==='all'){{ r.style.display=''; return; }}
    if(mode==='missing'){{ r.style.display = r.dataset.status==='missing' ? '' : 'none'; return; }}
    if(mode==='existing'){{ r.style.display = r.dataset.status==='existing' ? '' : 'none'; return; }}
    if(mode.startsWith('type:')){{ const t=mode.split(':')[1]; r.style.display = r.dataset.type===t ? '' : 'none'; return; }}
  }});
}}
function onChk(){{
  const n = document.querySelectorAll('.vidchk:checked').length;
  document.getElementById('selCount').textContent = n;
  document.getElementById('btnApprove').disabled = n === 0;
  document.getElementById('approveOut').style.display = 'none';
}}
function toggleAll(cb){{
  document.querySelectorAll('.vidchk').forEach(c => {{ if(c.closest('tr').style.display !== 'none') c.checked = cb.checked; }});
  onChk();
}}
function clearAll(){{
  document.querySelectorAll('.vidchk').forEach(c => c.checked = false);
  document.getElementById('selAll').checked = false;
  onChk();
}}
function buildApproval(){{
  const ids = Array.from(document.querySelectorAll('.vidchk:checked')).map(c => c.dataset.sid);
  const text = 'אישור ליצירת וידאו (Kling) לסצנות הבאות, במקביל: ' + ids.join(', ');
  document.getElementById('approveText').value = text;
  document.getElementById('approveOut').style.display = 'block';
  document.getElementById('copiedMsg').style.display = 'none';
}}
function copyApproval(){{
  const ta = document.getElementById('approveText');
  ta.select();
  navigator.clipboard && navigator.clipboard.writeText(ta.value).catch(()=>{{}});
  document.getElementById('copiedMsg').style.display = 'inline';
}}
</script>
</body>
</html>'''

out = f'{V3_DIR}/storyboard_v3_coverage.html'
with open(out, 'w', encoding='utf-8') as f:
    f.write(html)
print('wrote', out)
