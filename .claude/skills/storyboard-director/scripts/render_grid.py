#!/usr/bin/env python3
"""Render a storyboard.json into a live, standalone HTML grid (storyboard_grid.html).

Shows one card per scene (thumbnail, duration, shot, characters, narration/description
excerpt) and auto-detects generated images by convention: sibling `scenes/` (or a
folder named after the storyboard file, e.g. `storyboard_v2.json` -> `scenes_v2/`)
containing `sNN.png` (or `sNNa.png` for multi-image scenes). The file has NO external
dependencies and can be opened directly in a browser — reload it any time to pick up
newly generated images.

stdlib only — no external deps (matches gpt-image-gen / openrouter-video-gen / render_md.py).

Usage:
    python3 render_grid.py <storyboard.json> [output.html] [--scenes-dir <dir>]
                           [--merge <other_storyboard.json>]

If output.html is omitted, writes a sibling <storyboard-stem>_grid.html next to the input.
If --scenes-dir is omitted, it's inferred: storyboard.json -> scenes/, storyboard_v2.json -> scenes_v2/.

--merge folds a second storyboard (e.g. action_storyboard.json of short transition
inserts) into the same grid, sorted by scene_number so decimal inserts (2.1, 7.1, …)
land between the main scenes they sit between. Scenes carrying
`"scene_type": "action_insert"` are rendered in a distinct accent so they read as a
separate layer from the main storyboard.
"""
import json
import os
import re
import sys

CHAR_LABELS_HE = {
    # generic fallback dictionary — extend per project as needed; falls back to raw id
}

TEMPLATE_HEAD = """<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__TITLE__</title>
<style>
  :root{
    --bg:#0f1115; --card:#1a1d24; --card2:#20242d; --line:#2c313c;
    --ink:#e8eaed; --dim:#9aa0aa; --accent:#f0a63c; --focus:#5aa9e6;
    --regen:#e0574b; --multi:#8b5cf6; --ok:#3fb950; --pending:#6b7280; --draft:#d9822b;
    --action:#22d3ee;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);
    font-family:-apple-system,"Segoe UI","Heebo",Arial,sans-serif;padding:20px}
  header{display:flex;align-items:baseline;gap:16px;flex-wrap:wrap;
    margin-bottom:6px;border-bottom:1px solid var(--line);padding-bottom:14px}
  h1{font-size:20px;margin:0;font-weight:700}
  .sub{color:var(--dim);font-size:13px}
  .stats{margin-inline-start:auto;display:flex;gap:18px;font-size:13px;color:var(--dim)}
  .stats b{color:var(--ink)}
  .bar{font-size:12px;color:var(--dim);margin:12px 0 18px;display:flex;gap:14px;flex-wrap:wrap;align-items:center}
  .chip{display:inline-flex;align-items:center;gap:5px}
  .dot{width:9px;height:9px;border-radius:50%;display:inline-block}
  button{background:var(--card2);color:var(--ink);border:1px solid var(--line);
    border-radius:7px;padding:5px 11px;font-size:12px;cursor:pointer;font-family:inherit}
  button:hover{border-color:var(--accent)}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:12px;
    overflow:hidden;display:flex;flex-direction:column;transition:.15s}
  .card:hover{border-color:#3a4150;transform:translateY(-2px)}
  .thumb{position:relative;aspect-ratio:16/9;background:var(--card2);
    display:flex;align-items:center;justify-content:center;overflow:hidden}
  .thumb img{width:100%;height:100%;object-fit:cover;display:block}
  .ph{color:var(--pending);font-size:12px;text-align:center;padding:8px;line-height:1.5}
  .ph .big{font-size:26px;opacity:.5;display:block;margin-bottom:4px}
  .num{position:absolute;top:8px;inset-inline-start:8px;background:rgba(0,0,0,.72);
    color:#fff;font-weight:700;font-size:13px;border-radius:6px;padding:2px 9px}
  .badges{position:absolute;top:8px;inset-inline-end:8px;display:flex;gap:5px}
  .b{font-size:10px;font-weight:700;border-radius:5px;padding:2px 6px;color:#fff}
  .b.regen{background:var(--regen)} .b.multi{background:var(--multi)}
  .b.done{background:var(--ok)} .b.draft{background:var(--draft)}
  .vid{display:flex;align-items:center;gap:5px;font-size:11px}
  .vid .dot{width:7px;height:7px;border-radius:50%;background:var(--pending)}
  .vid.ready .dot{background:var(--ok)}
  .thumb img.isdraft{filter:saturate(.82) brightness(.94)}
  .body{padding:10px 12px 12px;display:flex;flex-direction:column;gap:7px;flex:1}
  .title{font-size:13.5px;font-weight:600;line-height:1.35}
  .meta{display:flex;gap:8px;font-size:11px;color:var(--dim);flex-wrap:wrap}
  .meta .t{color:var(--accent);font-weight:600}
  .chars{display:flex;gap:4px;flex-wrap:wrap}
  .cc{font-size:10px;background:var(--card2);border:1px solid var(--line);
    border-radius:20px;padding:1px 8px;color:var(--dim)}
  .narr{font-size:11.5px;color:var(--dim);line-height:1.5;
    border-inline-start:2px solid var(--line);padding-inline-start:8px;margin-top:2px}
  .style{font-size:10.5px;line-height:1.4;padding:4px 8px;border-radius:6px;
    background:rgba(240,166,60,.10);border:1px solid rgba(240,166,60,.28);color:var(--accent)}
  .style.parody{background:rgba(139,92,246,.12);border-color:rgba(139,92,246,.35);color:#c4b5fd}
  /* --- action inserts: a distinct layer sitting between the main scenes --- */
  .card.action{background:linear-gradient(180deg,rgba(34,211,238,.07),transparent 42%);
    border-color:rgba(34,211,238,.42);border-style:dashed}
  .card.action:hover{border-color:var(--action)}
  .card.action .num{background:rgba(34,211,238,.92);color:#06232b}
  .card.action .meta .t{color:var(--action)}
  .card.action .thumb{background:#16242a}
  .b.action{background:var(--action);color:#06232b}
  .b.opt{background:transparent;border:1px solid var(--action);color:var(--action)}
  .style.action{background:rgba(34,211,238,.10);border-color:rgba(34,211,238,.32);color:#a5eef7}
  .ffr{font-size:10.5px;color:var(--dim);display:flex;gap:6px;flex-wrap:wrap;align-items:center}
  .ffr b{color:var(--action);font-weight:700}
  footer{margin-top:20px;color:var(--dim);font-size:11px;text-align:center;line-height:1.7}
  kbd{background:var(--card2);border:1px solid var(--line);border-radius:4px;padding:1px 5px;font-size:11px}
</style>
</head>
<body>
<header>
  <h1>🎬 __TITLE__</h1>
  <span class="sub" id="subtitle"></span>
  <div class="stats">
    <span><b id="sceneCount">–</b> סצנות</span>
    <span><b id="totalDur">–</b></span>
    <span><b id="imgCount">–</b> תמונות</span>
    <span><b id="vidCount">–</b> וידאו</span>
  </div>
</header>

<div class="bar">
  <button onclick="location.reload()">↻ רענן (טען תמונות חדשות)</button>
  <span class="chip"><span class="dot" style="background:var(--ok)"></span> נוצרה</span>
  <span class="chip"><span class="dot" style="background:var(--draft)"></span> טיוטה (draft)</span>
  <span class="chip"><span class="dot" style="background:var(--pending)"></span> ממתינה</span>
  <span class="chip"><span class="dot" style="background:var(--regen)"></span> regen</span>
  <span class="chip"><span class="dot" style="background:var(--multi)"></span> ריבוי תמונות</span>
  <span class="chip"><span class="dot" style="background:var(--ok)"></span> וידאו קיים</span>
  <span class="chip"><span class="dot" style="background:#8b5cf6"></span> שינוי סגנון בסצנה (פרודיה ז'אנרית)</span>
  <span class="chip"><span class="dot" style="background:#22d3ee"></span> ⚡ שוט אקשן מוכנס (insert)</span>
</div>

<div class="grid" id="grid"></div>

<footer>
  תמונות ב-<code>__SCENES_DIR__/</code> · מתעדכן ב-<kbd>↻ רענן</kbd> או <kbd>⌘R</kbd><br>
  נוצר אוטומטית מ-<code>__SOURCE_NAME__</code>
</footer>

<script>
const DATA = __DATA_JSON__;
const SCENES_DIR = __SCENES_DIR_JSON__;

const grid = document.getElementById('grid');

let draftCount = 0, doneCount = 0, vidDoneCount = 0;

DATA.scenes.forEach(s=>{
  const card = document.createElement('div');
  card.className='card';

  const isAction = s.kind === 'action';
  if(isAction) card.classList.add('action');

  const nn = String(s.n).padStart(2,'0');
  const stem = s.multi ? `s${nn}a` : `s${nn}`;         // first image of the scene
  // Python resolves img/draft explicitly (handles decimal inserts + separate folders);
  // fall back to the sNN convention for storyboards rendered by older callers.
  const finalSrc = s.img   || `${SCENES_DIR}/${stem}.png`;
  const draftSrc = s.draft || `${SCENES_DIR}/${stem}_draft.png`;

  const badges = [];
  if(isAction) badges.push(`<span class="b action">⚡ ${s.insertId||'INSERT'}</span>`);
  if(s.optional) badges.push('<span class="b opt">בונוס</span>');
  if(s.regen) badges.push('<span class="b regen">REGEN</span>');
  if(s.multi) badges.push('<span class="b multi">×N</span>');

  const chars = (s.chars||[]).map(c=>`<span class="cc">${c}</span>`).join('');
  const numLabel = isAction ? (s.insertId || `⚡${s.n}`) : `S${nn}`;
  const domId = String(s.n).replace('.','_');

  const ffrRow = isAction ? `<div class="ffr">
      <span>פריים ראשון: <b>${s.firstFrame||'—'}</b></span>
      ${s.placement?`<span>· ${s.placement}</span>`:''}
      ${s.priority?`<span>· עדיפות ${s.priority}</span>`:''}
    </div>` : '';

  card.innerHTML = `
    <div class="thumb">
      <span class="num">${numLabel}</span>
      <div class="badges">${badges.join('')}</div>
      <img alt="scene ${s.n}" data-stage="final">
      <div class="ph"><span class="big">${isAction?'⚡':'🎞️'}</span>${s.dur}s · ${s.shot}<br>ממתינה ליצירה</div>
    </div>
    <div class="body">
      <div class="title">${s.title}</div>
      <div class="meta"><span class="t">${s.dur}s</span><span>${s.shot}</span>${s.ref!=='—'?`<span>📎 ${s.ref}</span>`:'<span>—</span>'}</div>
      ${ffrRow}
      <div class="chars">${chars||'<span class="cc">— ללא דמות —</span>'}</div>
      ${s.style ? `<div class="style${isAction?' action':(s.styleParody?' parody':'')}">${s.style}</div>` : ''}
      <div class="narr">${s.narr}</div>
      <div class="vid" id="vid-${domId}"><span class="dot"></span><span class="lbl">וידאו: ממתין</span></div>
    </div>`;

  if(s.video){
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = ()=>{
      const row = card.querySelector(`#vid-${domId}`);
      row.classList.add('ready');
      row.querySelector('.lbl').textContent = 'וידאו: ✓ נוצר';
      vidDoneCount++;
      document.getElementById('vidCount').textContent = `${vidDoneCount}✓ / ${DATA.scenes.length}`;
    };
    probe.onerror = ()=>{};
    probe.src = s.video;
  }

  const img = card.querySelector('img');
  const thumb = img.parentElement;
  img.onload = ()=>{
    thumb.querySelector('.ph')?.remove();
    const badgeBox = thumb.querySelector('.badges');
    if(img.dataset.stage === 'draft'){
      img.classList.add('isdraft');
      badgeBox.insertAdjacentHTML('afterbegin','<span class="b draft">טיוטה</span>');
      draftCount++;
    } else {
      badgeBox.insertAdjacentHTML('afterbegin','<span class="b done">✓</span>');
      doneCount++;
    }
    document.getElementById('imgCount').textContent = `${doneCount}✓ · ${draftCount} טיוטה`;
  };
  img.onerror = ()=>{
    if(img.dataset.stage === 'final'){          // no final → try the low-quality draft
      img.dataset.stage = 'draft';
      img.src = draftSrc;
    } else {                                     // no draft either → leave placeholder
      img.style.display = 'none';
    }
  };
  img.src = finalSrc;                            // start by attempting the final

  grid.appendChild(card);
});

const total = DATA.scenes.reduce((a,s)=>a+(s.dur||0),0);
document.getElementById('subtitle').textContent = DATA.subtitle || '';
document.getElementById('sceneCount').textContent = DATA.scenes.length;
document.getElementById('totalDur').textContent = `${Math.floor(total/60)}:${String(total%60).padStart(2,'0')}`;
document.getElementById('imgCount').textContent = '…';
document.getElementById('vidCount').textContent = `0 / ${DATA.scenes.length}`;
</script>
</body>
</html>
"""


def infer_scenes_dir(storyboard_path):
    """storyboard.json -> scenes ; storyboard_v2.json -> scenes_v2 ; etc."""
    stem = os.path.splitext(os.path.basename(storyboard_path))[0]  # storyboard_v2
    m = re.match(r"^storyboard(_.*)?$", stem)
    suffix = m.group(1) or "" if m else ""
    return f"scenes{suffix}"


def excerpt(text, n=110):
    text = (text or "").replace("\n", " ").strip()
    return text if len(text) <= n else text[:n].rstrip() + "…"


def video_rel_path(video_output, run_dir):
    """video_output is typically repo-root-relative (e.g. bambi/outputs/<project>/<run>/videos/s01.mp4).
    Compute it relative to run_dir so the grid HTML (which lives in run_dir) can load it directly."""
    if not video_output:
        return None
    try:
        rel = os.path.relpath(video_output, run_dir)
    except ValueError:
        return None
    return rel if not rel.startswith("..") else None


def rel_to_run(path, run_dir):
    """Make a repo-root-relative path loadable from the grid HTML (which lives in run_dir)."""
    if not path:
        return None
    try:
        rel = os.path.relpath(path, run_dir)
    except ValueError:
        return None
    return rel if not rel.startswith("..") else None


def build_scene_row(s, run_dir):
    shot = s.get("shot") or {}
    shot_str = shot.get("type", "—") if isinstance(shot, dict) else "—"
    ref = s.get("reference") or ""
    ref_name = os.path.basename(ref) if ref else "—"
    narr = s.get("narration") or s.get("description") or ""
    style_note = s.get("style_note") or ""
    is_action = s.get("scene_type") == "action_insert"

    img = rel_to_run(s.get("image_output"), run_dir)
    draft = None
    if img:
        stem, ext = os.path.splitext(img)
        draft = f"{stem}_draft{ext}"

    row = {
        "n": s["scene_number"],
        "title": s.get("title", f"סצנה {s['scene_number']}"),
        "dur": s.get("duration_sec", 0),
        "chars": s.get("characters", []),
        "narr": excerpt(narr),
        "ref": ref_name,
        "shot": shot_str,
        "regen": bool(s.get("regenerate", False)),
        "multi": "image_prompts" in s,
        "video": video_rel_path(s.get("video_output"), run_dir),
        "style": style_note,
        # heuristic: any style_note containing an emoji/marker distinct from the
        # project's base look is flagged as a parody/shift — projects that set
        # style_note only on outlier scenes (leaving it empty elsewhere) also work.
        "styleParody": bool(style_note) and "לוק בסיסי" not in style_note,
    }
    if img:
        row["img"] = img
        row["draft"] = draft
    if is_action:
        row["kind"] = "action"
        row["insertId"] = s.get("insert_id", "")
        row["firstFrame"] = s.get("first_frame_type", "")
        row["placement"] = s.get("placement", "")
        row["priority"] = s.get("priority")
        row["optional"] = bool(s.get("optional", False))
    return row


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    sb_path = sys.argv[1]
    args = sys.argv[2:]
    out_path = None
    scenes_dir_override = None
    merge_paths = []

    i = 0
    while i < len(args):
        if args[i] == "--scenes-dir" and i + 1 < len(args):
            scenes_dir_override = args[i + 1]
            i += 2
        elif args[i] == "--merge" and i + 1 < len(args):
            merge_paths.append(args[i + 1])
            i += 2
        elif not args[i].startswith("--"):
            out_path = args[i]
            i += 1
        else:
            i += 1

    with open(sb_path, encoding="utf-8") as f:
        sb = json.load(f)

    scenes_dir = scenes_dir_override or infer_scenes_dir(sb_path)
    run_dir = os.path.dirname(os.path.abspath(sb_path))

    all_scenes = list(sb.get("scenes", []))
    merged_count = 0
    for mp in merge_paths:
        with open(mp, encoding="utf-8") as f:
            extra = json.load(f).get("scenes", [])
        all_scenes.extend(extra)
        merged_count += len(extra)
    # prefer an explicit "order" field (final narrative sequence, independent of
    # scene_number/asset-filename identity) when every scene carries one; otherwise,
    # when merging, fall back to the historical numeric-scene_number sort (single-file
    # mode with no "order" keeps the JSON's own array order).
    if all(s.get("order") is not None for s in all_scenes):
        all_scenes.sort(key=lambda s: float(s["order"]))
    elif merge_paths:
        all_scenes.sort(key=lambda s: float(s["scene_number"]))

    rows = [build_scene_row(s, run_dir) for s in all_scenes]
    total = sum(r["dur"] for r in rows)
    data = {
        "subtitle": sb.get("title", sb.get("project", "")),
        "scenes": rows,
    }

    title = sb.get("title", sb.get("project", "סטוריבורד"))
    html = TEMPLATE_HEAD
    html = html.replace("__TITLE__", title)
    html = html.replace("__SCENES_DIR__", scenes_dir)
    html = html.replace("__SOURCE_NAME__", os.path.basename(sb_path))
    html = html.replace("__DATA_JSON__", json.dumps(data, ensure_ascii=False))
    html = html.replace("__SCENES_DIR_JSON__", json.dumps(scenes_dir))

    if not out_path:
        stem = os.path.splitext(sb_path)[0]  # .../storyboard_v2
        out_path = f"{stem}_grid.html"

    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)

    mins, secs = divmod(int(total), 60)
    print(f"[written] {out_path}")
    print(f"  scenes: {len(rows)} | total duration: {mins}:{secs:02d} | scenes_dir: {scenes_dir}/")
    if merged_count:
        n_action = sum(1 for r in rows if r.get("kind") == "action")
        print(f"  merged: {merged_count} extra scene(s) from {len(merge_paths)} file(s) "
              f"| action inserts: {n_action}")


if __name__ == "__main__":
    main()
