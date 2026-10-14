#!/usr/bin/env python3
"""Series index: one row per ad (product anchor, K0–K3, final video) across a project, to eyeball
series consistency side by side. Scans <project_dir>/*/storyboard.json that carry a "series" block.

stdlib only. Usage:
    python3 render_series_index.py bambi/outputs/surreal-ads [--series surreal-product-ad]
Writes <project_dir>/index.html.
"""
import argparse
import glob
import json
import os

PAGE = r"""<!DOCTYPE html>
<html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>__TITLE__</title>
<style>
 :root{--bg:#0f1115;--card:#1a1d24;--card2:#20242d;--line:#2c313c;--ink:#e8eaed;--dim:#9aa0aa;--ok:#3fb950;--accent:#f0a63c}
 *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,"Segoe UI","Heebo",Arial,sans-serif;padding:20px}
 h1{font-size:20px;margin:0 0 4px} .sub{color:var(--dim);font-size:13px;margin-bottom:14px}
 button{background:var(--card2);color:var(--ink);border:1px solid var(--line);border-radius:7px;padding:5px 11px;font-size:12px;cursor:pointer}
 .row{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;margin-top:14px}
 .hd{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;margin-bottom:10px}
 .hd b{font-size:15px} .hd a{color:var(--accent);font-size:12px} .hd span{color:var(--dim);font-size:12px}
 .cells{display:grid;grid-template-columns:repeat(6,minmax(90px,1fr));gap:8px}
 .slot{position:relative;aspect-ratio:9/16;background:var(--card2);border:1px dashed var(--line);border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#6b7280;font-size:11px}
 .slot.has{border-style:solid} .slot img,.slot video{width:100%;height:100%;object-fit:cover}
 .slot i{position:absolute;top:5px;inset-inline-start:5px;background:rgba(0,0,0,.7);color:#fff;font-style:normal;font-size:10px;font-weight:700;border-radius:4px;padding:1px 6px;z-index:2}
 @media (max-width:640px){.cells{grid-template-columns:repeat(3,1fr)}}
</style></head><body>
<h1>🎞️ __TITLE__</h1><div class="sub">__SUB__ · <button onclick="location.reload()">↻ רענן</button></div>
<div id="rows"></div>
<script>
const ADS = __DATA__;
const rows = document.getElementById('rows');
function slot(label, src, video){
  const d=document.createElement('div'); d.className='slot'; d.innerHTML=`<i>${label}</i>—`;
  if(!src) return d;
  if(video){const v=document.createElement('video'); v.muted=true; v.loop=true; v.autoplay=true; v.playsInline=true;
    v.onloadedmetadata=()=>{d.textContent='';d.classList.add('has');d.innerHTML=`<i>${label}</i>`;d.appendChild(v)}; v.src=src;}
  else {const im=new Image(); im.onload=()=>{d.classList.add('has');d.innerHTML=`<i>${label}</i>`;d.appendChild(im)}; im.src=src+'?t='+Date.now();}
  return d;
}
ADS.forEach(a=>{
  const r=document.createElement('div'); r.className='row';
  r.innerHTML=`<div class="hd"><b>${a.title}</b><span>${a.slug} · ${a.route} · ${a.mode}</span><a href="${a.grid}">פתח widget ←</a></div><div class="cells"></div>`;
  const c=r.querySelector('.cells');
  c.appendChild(slot('PRODUCT', a.anchor));
  a.keyframes.forEach(k=>c.appendChild(slot(k.id.toUpperCase(), k.src)));
  c.appendChild(slot('FINAL', a.final, true));
  rows.appendChild(r);
});
</script></body></html>
"""


def find_repo_root(start):
    d = os.path.abspath(start)
    while d != os.path.dirname(d):
        if os.path.isdir(os.path.join(d, ".claude")) and os.path.isdir(os.path.join(d, "bambi")):
            return d
        d = os.path.dirname(d)
    return os.getcwd()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project_dir")
    ap.add_argument("--series", default="surreal-product-ad")
    a = ap.parse_args()
    proj = os.path.abspath(a.project_dir)
    root = find_repo_root(proj)

    def rel(p):
        if not p:
            return None
        return os.path.relpath(p if os.path.isabs(p) else os.path.join(root, p), proj)

    ads = []
    for sb_path in sorted(glob.glob(os.path.join(proj, "*", "storyboard.json"))):
        with open(sb_path, encoding="utf-8") as f:
            sb = json.load(f)
        s = sb.get("series") or {}
        if s.get("name") != a.series:
            continue
        run = os.path.dirname(sb_path)
        final_typo = os.path.join(run, "final_typo.mp4")
        final = final_typo if os.path.exists(final_typo) else os.path.join(run, "final.mp4")
        ads.append({
            "title": sb.get("title", s.get("slug")), "slug": s.get("slug"),
            "route": s.get("image_route"), "mode": s.get("typography_mode"),
            "grid": os.path.relpath(os.path.join(run, "storyboard_grid.html"), proj),
            "anchor": rel(sb.get("cast", [{}])[0].get("anchor_image")),
            "keyframes": [{"id": k["id"], "src": rel(k["path"])} for k in s.get("keyframes", [])],
            "final": os.path.relpath(final, proj),
        })
    title = f"סדרה — {a.series}"
    html = (PAGE.replace("__TITLE__", title)
                .replace("__SUB__", f"{len(ads)} פרסומות · {os.path.basename(proj)}")
                .replace("__DATA__", json.dumps(ads, ensure_ascii=False).replace("</", "<\\/")))
    out = os.path.join(proj, "index.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"[written] {os.path.relpath(out)}  ({len(ads)} ads)")


if __name__ == "__main__":
    main()
