#!/usr/bin/env python3
"""Render a *series* storyboard (storyboard.json with a "series" block, e.g. surreal-product-ad)
into a live standalone widget: storyboard_grid.html.

Per stage: first-frame slot K(n) → end-frame slot K(n+1) side by side, a video slot that plays
videos/sNN.mp4 once it exists, copy buttons for image/video prompts, and a typography-track strip
(text_layers.json). Plus: product anchor, keyframe strip K0–K3, final.mp4 / final_typo.mp4 slots.
Everything is auto-detected at load time — press ↻ after dropping files (gpt or Midjourney).

The classic render_grid.py stays untouched for non-series storyboards.

stdlib only. Usage:
    python3 render_series_grid.py <storyboard.json> [output.html]
"""
import json
import os
import sys

HTML = r"""<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__TITLE__</title>
<style>
  :root{--bg:#0f1115;--card:#1a1d24;--card2:#20242d;--line:#2c313c;--ink:#e8eaed;--dim:#9aa0aa;
    --accent:#f0a63c;--ok:#3fb950;--pending:#6b7280;--back:#8b5cf6;--front:#22d3ee;--s1:#5aa9e6;--s2:#e0574b;--s3:#3fb950}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,"Segoe UI","Heebo",Arial,sans-serif;padding:20px;max-width:1500px;margin-inline:auto}
  header{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding-bottom:12px}
  h1{font-size:20px;margin:0}
  h2{font-size:14px;color:var(--dim);font-weight:600;margin:22px 0 10px;letter-spacing:.02em}
  .sub{color:var(--dim);font-size:13px}
  .pills{margin-inline-start:auto;display:flex;gap:8px;flex-wrap:wrap}
  .pill{font-size:11px;border:1px solid var(--line);border-radius:20px;padding:3px 10px;color:var(--dim)}
  .pill b{color:var(--ink)}
  .bar{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0;align-items:center;font-size:12px;color:var(--dim)}
  button,a.btn{background:var(--card2);color:var(--ink);border:1px solid var(--line);border-radius:7px;padding:5px 11px;font-size:12px;cursor:pointer;font-family:inherit;text-decoration:none}
  button:hover,a.btn:hover{border-color:var(--accent)}
  button.copied{border-color:var(--ok);color:var(--ok)}
  .slot{position:relative;aspect-ratio:9/16;background:var(--card2);border:1px dashed var(--line);border-radius:10px;overflow:hidden;display:flex;align-items:center;justify-content:center}
  .slot.has{border-style:solid;border-color:#3a4150}
  .slot img,.slot video{width:100%;height:100%;object-fit:cover;display:block}
  .slot .lbl{position:absolute;top:6px;inset-inline-start:6px;background:rgba(0,0,0,.72);color:#fff;font-size:11px;font-weight:700;border-radius:5px;padding:2px 7px;z-index:2}
  .slot .ok{position:absolute;top:6px;inset-inline-end:6px;background:var(--ok);color:#fff;font-size:10px;font-weight:700;border-radius:5px;padding:2px 6px;z-index:2;display:none}
  .slot.has .ok{display:block}
  .slot .ph{color:var(--pending);font-size:11px;text-align:center;padding:8px;line-height:1.5}
  .slot .ph code{font-size:10px;color:var(--dim);direction:ltr;display:block;margin-top:4px;word-break:break-all}
  .top{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px}
  .stages{display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:16px}
  .stage{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:10px;border-top:3px solid var(--sc)}
  .stage .hd{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
  .stage .num{background:var(--sc);color:#0b0d10;font-weight:800;font-size:12px;border-radius:6px;padding:2px 8px}
  .stage .t{font-weight:700;font-size:14px}
  .stage .meta{font-size:11px;color:var(--dim);margin-inline-start:auto}
  .frames{display:grid;grid-template-columns:1fr 18px 1fr 1fr;gap:6px;align-items:center}
  .arrow{color:var(--dim);text-align:center;font-size:16px}
  .desc{font-size:12px;color:var(--dim);line-height:1.55;border-inline-start:2px solid var(--line);padding-inline-start:8px}
  .acts{display:flex;gap:6px;flex-wrap:wrap}
  details{font-size:11px;color:var(--dim)}
  details pre{white-space:pre-wrap;direction:ltr;text-align:left;background:var(--card2);padding:8px;border-radius:8px;font-size:11px;line-height:1.5;color:#cfd3da}
  /* typography track */
  .track{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px}
  .ruler{position:relative;height:22px;border-bottom:1px solid var(--line);margin-bottom:8px;direction:ltr}
  .seg{position:absolute;top:0;height:16px;border-radius:4px;font-size:10px;color:#0b0d10;font-weight:700;padding:1px 6px;overflow:hidden;white-space:nowrap}
  .lane{position:relative;height:30px;margin:4px 0;direction:ltr}
  .layer{position:absolute;top:2px;height:26px;border-radius:6px;font-size:11px;padding:4px 8px;overflow:hidden;white-space:nowrap;border:1px solid}
  .layer.back{background:rgba(139,92,246,.18);border-color:var(--back)}
  .layer.front{background:rgba(34,211,238,.15);border-color:var(--front)}
  .tick{position:absolute;top:0;bottom:-6px;width:1px;background:var(--line)}
  .legend{display:flex;gap:14px;font-size:11px;color:var(--dim);margin-top:8px;flex-wrap:wrap}
  .dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-inline-end:4px;vertical-align:middle}
  .finals{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,260px));gap:14px}
  footer{margin-top:24px;color:var(--dim);font-size:11px;text-align:center;line-height:1.7}
  @media (max-width:520px){.stages{grid-template-columns:1fr}.frames{grid-template-columns:1fr 14px 1fr}.frames .vslot{grid-column:1/-1}}
</style>
</head>
<body>
<header>
  <h1>🎬 __TITLE__</h1>
  <span class="sub" id="sub"></span>
  <div class="pills" id="pills"></div>
</header>
<div class="bar">
  <button onclick="location.reload()">↻ רענן (טען תמונות/וידאו חדשים)</button>
  <a class="btn" href="production.md">production.md</a>
  <a class="btn" href="midjourney_prompts.md">midjourney_prompts.md</a>
  <a class="btn" href="master_prompt.txt">master_prompt.txt</a>
  <a class="btn" href="text_layers.json">text_layers.json</a>
  <button onclick="copy(this, DATA.master)">📋 העתק master prompt</button>
</div>

<h2>עוגן מוצר + Keyframes</h2>
<div class="top" id="top"></div>

<h2>שלבים — פריים ראשון → פריים אחרון → וידאו</h2>
<div class="stages" id="stages"></div>

<h2>מסלול טיפוגרפיה (text_layers.json)</h2>
<div class="track" id="track"></div>

<h2>תוצר סופי</h2>
<div class="finals" id="finals"></div>

<footer>הקבצים נטענים מהדיסק בזמן פתיחה — שמור/גרור קובץ ולחץ <b>↻</b>. נוצר מ-<code>__SOURCE__</code></footer>

<script>
const DATA = __DATA__;
const STAGE_COLORS = ['var(--s1)','var(--s2)','var(--s3)'];

function copy(btn, text){
  navigator.clipboard.writeText(text).then(()=>{btn.classList.add('copied');const o=btn.textContent;btn.textContent='✓ הועתק';setTimeout(()=>{btn.textContent=o;btn.classList.remove('copied')},1400)});
}
function esc(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

function imgSlot(label, src, hint){
  const d=document.createElement('div'); d.className='slot';
  d.innerHTML=`<span class="lbl">${esc(label)}</span><span class="ok">✓</span><div class="ph">ממתין<code>${esc(hint||src||'')}</code></div>`;
  if(src){const im=new Image(); im.onload=()=>{d.querySelector('.ph')?.remove(); d.classList.add('has'); d.appendChild(im)}; im.src=src+'?t='+Date.now();}
  return d;
}
function vidSlot(label, src, hint, cls){
  const d=document.createElement('div'); d.className='slot '+(cls||'');
  d.innerHTML=`<span class="lbl">${esc(label)}</span><span class="ok">✓</span><div class="ph">🎞️ וידאו ממתין<code>${esc(hint||src||'')}</code></div>`;
  if(src){const v=document.createElement('video'); v.muted=true; v.loop=true; v.playsInline=true; v.controls=true; v.preload='metadata';
    v.onloadedmetadata=()=>{d.querySelector('.ph')?.remove(); d.classList.add('has'); d.appendChild(v)};
    v.src=src;}
  return d;
}

document.getElementById('sub').textContent = DATA.subtitle;
document.getElementById('pills').innerHTML = DATA.pills.map(([k,v])=>`<span class="pill">${esc(k)}: <b>${esc(v)}</b></span>`).join('');

const topEl = document.getElementById('top');
topEl.appendChild(imgSlot('PRODUCT', DATA.anchor, DATA.anchorHint));
DATA.keyframes.forEach(k=>topEl.appendChild(imgSlot(k.id.toUpperCase(), k.src, k.hint)));

const stages = document.getElementById('stages');
DATA.stages.forEach((s,i)=>{
  const el=document.createElement('div'); el.className='stage'; el.style.setProperty('--sc', STAGE_COLORS[i%3]);
  el.innerHTML=`<div class="hd"><span class="num">S${String(s.n).padStart(2,'0')}</span><span class="t">${esc(s.title)}</span>
      <span class="meta"><bdi dir="ltr">${s.t0}–${s.t1}s · ${esc(s.shot)}</bdi></span></div>
    <div class="frames"></div>
    <div class="desc">${esc(s.desc)}</div>
    <div class="acts"></div>
    <details><summary>video_prompt</summary><pre>${esc(s.video_prompt)}</pre></details>
    <details><summary>image_prompt (${esc(s.from.toUpperCase())})</summary><pre>${esc(s.image_prompt)}</pre></details>`;
  const fr=el.querySelector('.frames');
  fr.appendChild(imgSlot('FIRST · '+s.from.toUpperCase(), s.firstSrc, s.firstHint));
  const ar=document.createElement('div'); ar.className='arrow'; ar.textContent='←'; fr.appendChild(ar);
  fr.appendChild(imgSlot('LAST · '+s.to.toUpperCase(), s.lastSrc, s.lastHint));
  fr.appendChild(vidSlot('VIDEO', s.video, s.videoHint, 'vslot'));
  const acts=el.querySelector('.acts');
  [['📋 video prompt', s.video_prompt],['📋 image prompt', s.image_prompt],['📋 MJ prompt', s.mj_prompt]].forEach(([l,t])=>{
    if(!t) return; const b=document.createElement('button'); b.textContent=l; b.onclick=()=>copy(b,t); acts.appendChild(b);});
  stages.appendChild(el);
});

// typography track
const tr=document.getElementById('track'); const T=DATA.total||15;
const pct=t=>(Math.max(0,Math.min(T,t))/T*100)+'%';
let html='<div class="ruler">';
DATA.stages.forEach((s,i)=>{html+=`<div class="seg" style="left:${pct(s.t0)};width:calc(${pct(s.t1-s.t0)} - 3px);background:${STAGE_COLORS[i%3]}">S${s.n} ${esc(s.short)}</div>`});
for(let t=0;t<=T;t++) html+=`<div class="tick" style="left:${pct(t)}"></div>`;
html+='</div>';
if(!DATA.layers.length) html+='<div class="desc">אין שכבות טקסט מונפשות (typography_mode = baked) — כל הטקסט אפוי בתוך ה-keyframes. אפשר להוסיף שכבות ב-text_layers.json.</div>';
DATA.layers.forEach(l=>{
  const planes=[...new Set([l.plane,...(l.planeSwitches||[])])].join(' → ');
  html+=`<div class="lane"><div class="layer ${l.plane==='back'?'back':'front'}" style="left:${pct(l.from)};width:${pct(l.to-l.from)}"
     title="${esc(l.id)}">“${esc(l.text)}” · ${esc(l.split)} · ${esc(l.preset||'custom keyframes')} · z: ${esc(planes)}</div></div>`;
});
html+=`<div class="legend"><span><span class="dot" style="background:var(--back)"></span>מאחורי המוצר (text_back)</span>
  <span><span class="dot" style="background:var(--front)"></span>לפני המוצר (text_front)</span>
  <span>שכבות: background → text_back → product_matte → text_front → fx</span></div>`;
tr.innerHTML=html;

const fin=document.getElementById('finals');
fin.appendChild(vidSlot('final.mp4 — הרכבה', DATA.final, 'final.mp4'));
fin.appendChild(vidSlot('final_typo.mp4 — עם טיפוגרפיה', DATA.finalTypo, 'final_typo.mp4'));
fin.appendChild(vidSlot('one-shot (השוואה)', DATA.oneshot, 'videos/oneshot.mp4'));
</script>
</body>
</html>
"""


def rel(path, run_dir, repo_root):
    if not path:
        return None
    absolute = path if os.path.isabs(path) else os.path.join(repo_root, path)
    return os.path.relpath(absolute, run_dir)


def find_repo_root(start):
    d = os.path.abspath(start)
    while d != os.path.dirname(d):
        if os.path.isdir(os.path.join(d, ".claude")) and os.path.isdir(os.path.join(d, "bambi")):
            return d
        d = os.path.dirname(d)
    return os.getcwd()


def mj_prompt(prompt, series):
    brief = series.get("brief", {})
    params = series.get("mj_params") or "--ar 9:16 --v 7 --style raw --s 150"
    if brief.get("mj_style_ref"):
        params += f" --sref {brief['mj_style_ref']}"
    if brief.get("mj_product_ref"):
        params += f" --oref {brief['mj_product_ref']} --ow 120"
    return f"{prompt} {params}"


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    sb_path = os.path.abspath(sys.argv[1])
    run_dir = os.path.dirname(sb_path)
    repo_root = find_repo_root(run_dir)
    with open(sb_path, encoding="utf-8") as f:
        sb = json.load(f)
    series = sb.get("series")
    if not series:
        sys.exit("storyboard ללא בלוק 'series' — השתמש ב-render_grid.py הרגיל")

    layers_doc = {"layers": []}
    tl_path = os.path.join(run_dir, series.get("text_layers", "text_layers.json"))
    if os.path.exists(tl_path):
        with open(tl_path, encoding="utf-8") as f:
            layers_doc = json.load(f)

    kf = {k["id"]: k for k in series["keyframes"]}
    t = 0
    stages = []
    for s in sb["scenes"]:
        d = s.get("duration_sec", 5)
        first, last = kf[s["first_frame_key"]], kf[s["end_frame_key"]]
        shot = s.get("shot", {})
        stages.append({
            "n": s["scene_number"], "title": s["title"], "short": s.get("stage", ""),
            "t0": t, "t1": t + d, "shot": " · ".join(x for x in (shot.get("type"), shot.get("camera_move")) if x),
            "desc": s.get("description", ""), "from": first["id"], "to": last["id"],
            "firstSrc": rel(first["path"], run_dir, repo_root), "firstHint": f"keyframes/{first['id']}.png",
            "lastSrc": rel(last["path"], run_dir, repo_root), "lastHint": f"keyframes/{last['id']}.png",
            "video": rel(s.get("video_output"), run_dir, repo_root), "videoHint": f"videos/s{s['scene_number']:02d}.mp4",
            "video_prompt": s.get("video_prompt", ""), "image_prompt": s.get("image_prompt", ""),
            "mj_prompt": mj_prompt(first.get("mj_prompt") or s.get("image_prompt", ""), series),
        })
        t += d

    layers = []
    for l in layers_doc.get("layers", []):
        switches = [k.get("plane") for k in l.get("keyframes", []) if k.get("plane")]
        layers.append({"id": l.get("id"),
                       "text": l.get("text") or (f"✎ {l.get('shape') or 'drawing'}" if l.get("type") == "draw" else ""), "split": l.get("split", "none"),
                       "plane": l.get("plane", "front"), "planeSwitches": switches,
                       "from": l.get("from", 0), "to": l.get("to", t), "preset": l.get("preset")})

    master = ""
    mp = os.path.join(run_dir, series.get("master_prompt", "master_prompt.txt"))
    if os.path.exists(mp):
        with open(mp, encoding="utf-8") as f:
            master = f.read().strip()

    anchor = sb.get("cast", [{}])[0].get("anchor_image")
    data = {
        "subtitle": f"סדרה: {series['name']} v{series.get('version', 1)} · {series.get('slug', '')}",
        "pills": [["יחס", sb.get("aspect_ratio", "9:16")], ["משך", f"{t}s"],
                  ["תמונות", series.get("image_route", "gpt")], ["טיפוגרפיה", series.get("typography_mode", "hybrid")],
                  ["שכבות טקסט", str(len(layers))]],
        "anchor": rel(anchor, run_dir, repo_root), "anchorHint": anchor,
        "keyframes": [{"id": k["id"], "src": rel(k["path"], run_dir, repo_root), "hint": f"keyframes/{k['id']}.png"}
                      for k in series["keyframes"]],
        "stages": stages, "layers": layers, "total": t, "master": master,
        "final": rel(series.get("final"), run_dir, repo_root) or "final.mp4",
        "finalTypo": rel(series.get("final_typo"), run_dir, repo_root) or "final_typo.mp4",
        "oneshot": "videos/oneshot.mp4",
    }
    title = sb.get("title", sb.get("project", "storyboard"))
    html = (HTML.replace("__TITLE__", title.replace("<", "&lt;"))
                .replace("__SOURCE__", os.path.basename(sb_path))
                .replace("__DATA__", json.dumps(data, ensure_ascii=False).replace("</", "<\\/")))
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(run_dir, "storyboard_grid.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"[written] {os.path.relpath(out)}  (stages: {len(stages)} · keyframes: {len(series['keyframes'])} · "
          f"text layers: {len(layers)})")


if __name__ == "__main__":
    main()
