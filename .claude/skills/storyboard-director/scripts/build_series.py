#!/usr/bin/env python3
"""Build a series storyboard from a brief — the "Surreal Product Ad Prompt Generator".

brief.json  →  bambi/outputs/<project>/<YYYY-MM-DD>-<slug>/
    storyboard.json        3 stages (Digital→Physical / Transformation / Hero), 9:16,
                           chained keyframes K0→K3 (first frame / end_reference per stage)
    storyboard.md          Hebrew table (via render_md.py)
    storyboard_grid.html   live widget: keyframe slots + video + typography track (render_series_grid.py)
    master_prompt.txt      single-prompt version (one-shot 15s runs)
    midjourney_prompts.md  manual Midjourney route — prompt per keyframe + exact save filename
    text_layers.json       kinetic-typography layers (Remotion) — default from typography_mode
    production.md          exact commands for every production step (incl. cinematic-finish FX + sound)
    audio/v4/CUES.md       draft sound cue sheet · audio/v4/sfx_plan.json realistic SFX prompts
    keyframes/ videos/     empty — the grid auto-detects files dropped here

stdlib only. Usage:
    python3 build_series.py <brief.json> [--series surreal-product-ad] [--project surreal-ads]
                            [--date YYYY-MM-DD] [--out <run_dir>] [--no-render]
"""
import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = os.path.dirname(SCRIPT_DIR)
REPO_ROOT = os.path.abspath(os.path.join(SKILL_DIR, "..", "..", ".."))

W, H = 1080, 1920


def fill(template, ctx):
    """Replace {{var}} with ctx[var]; unknown vars raise so typos surface early."""
    def sub(m):
        key = m.group(1)
        if key not in ctx:
            raise KeyError(f"template variable '{{{{{key}}}}}' missing from brief/context")
        return str(ctx[key])
    out = re.sub(r"\{\{(\w+)\}\}", sub, template)
    return re.sub(r"\s{2,}", " ", out).strip() if "\n" not in template else out


def letters_spelled(word):
    return "-".join(word.upper())


def build_context(brief, tpl):
    d = tpl["defaults"]
    ctx = dict(d)
    ctx.update({k: v for k, v in brief.items() if isinstance(v, (str, int, float))})
    for k, v in d.items():
        ctx.setdefault(k, v)
    mode = ctx.get("typography_mode", "hybrid")
    word = brief["hero_word"].upper()
    tag = brief["tagline"].upper()
    ctx["hero_word"] = word
    ctx["hero_word_q"] = f'"{word}"'
    ctx["tagline_q"] = f'"{tag}"'
    ctx["accent_color"] = brief["accent_color"]
    cap = lambda x: x[:1].upper() + x[1:]
    ctx["product_short"] = brief.get("product_short") or f"the {brief['brand']} product"
    ctx["product_short_c"] = cap(ctx["product_short"])
    ctx["transformation_c"] = cap(brief["transformation"])
    ctx["particles_c"] = cap(brief["particles"])
    ctx["particles_first"] = brief["particles"].split(",")[0].strip()
    # look (hyperreal default since v2) + drawn-element mode
    look_id = ctx.get("look", "hyperreal")
    if look_id not in tpl["looks"]:
        sys.exit(f"look לא מוכר: {look_id} (אפשרויות: {', '.join(tpl['looks'])})")
    look = tpl["looks"][look_id]
    ctx["look"] = look_id
    ctx["shot_style"] = look["shot_style"]
    ctx["look_lighting"] = look["lighting"]
    ctx["look_film_look"] = look["film_look"]
    ctx["realism"] = look["realism"]
    ctx["video_realism"] = look["video_realism"]
    dm_id = ctx.get("drawn_mode", "none")
    if dm_id not in tpl["drawn_modes"]:
        sys.exit(f"drawn_mode לא מוכר: {dm_id} (אפשרויות: {', '.join(tpl['drawn_modes'])})")
    dm = tpl["drawn_modes"][dm_id]
    ctx["drawn_mode"] = dm_id
    ctx["drawn_website"] = "." + (" " + fill(dm["website_suffix"], ctx) if dm.get("website_suffix") else "")
    ctx["device_setting_c"] = ctx["device_setting"][:1].upper() + ctx["device_setting"][1:]
    for k in ("k1", "s1", "master"):
        ctx[f"drawn_{k}"] = fill(dm.get(k, ""), ctx) if dm.get(k) else ""
    ctx["drawn_kinetic"] = bool(dm.get("kinetic"))

    ctx["palette"] = fill(tpl["visual_theme"]["palette"], ctx)
    env = f" {brief['environment']}." if brief.get("environment") else ""
    ctx["theme"] = (f"Palette: {ctx['palette']}. Lighting: {look['lighting']}. "
                    f"Look: {look['film_look']}.{env}")
    ctx["negatives_short"] = "No cuts, no random objects, no distorted product, no floating text overlays."
    ctx["product_lock"] = (f"The product is exactly as in the reference — {brief['product']} — "
                           f"accurate proportions, '{brief['brand']}' branding readable.")

    # typography: what is baked into the keyframe pixels vs left for the animated layer
    if mode == "layered":
        ctx["k1_letters"] = "The web page shows no headline text — clean space above the product."
        ctx["k2_letters"] = ("Leave clean negative space around the product for typography that will be added later; "
                             "no letters or text anywhere in the image.")
        ctx["hero_word_q"] = "(added later as animated typography)"
    else:
        ctx["k1_letters"] = (f'The giant editorial serif letters spelling exactly "{word}" ({letters_spelled(word)}) '
                             f"are starting to lift off the web page, about to become physical.")
        ctx["k2_letters"] = (f'Huge physical 3D letters spelling exactly "{word}" ({letters_spelled(word)}), made of '
                             f"{brief['letter_material']}, stand on the table around the product — some behind it, "
                             f"one partially in front of it, partially occluding it. Every letter correctly spelled.")
    if mode == "baked":
        ctx["k3_tagline"] = (f'The tagline "{tag}" is integrated into the scene {ctx["tagline_integration"]} — '
                             f"perfectly spelled, legible, no other text.")
        ctx["tagline_clause"] = f'The tagline {ctx["tagline_q"]} stays integrated in the scene, perfectly legible.'
    else:
        ctx["k3_tagline"] = ("Keep the upper third of the frame as calm clean negative space (the tagline is added "
                             "later as animated typography); no text in the image apart from the product's own label.")
        ctx["tagline_clause"] = "Keep the upper third calm and clean."
    ctx["mode"] = mode
    # short Midjourney fragments (MJ weights the first ~60 words — keep these terse)
    ctx["mj_style"] = fill(look.get("mj_style", ""), ctx)
    sketchy = bool(dm.get("website_suffix"))
    ctx["mj_drawn_k0"] = f", the product on the page drawn as a hand-drawn sketch ({ctx['drawn_style']})" if sketchy else ""
    ctx["mj_drawn_k1"] = (", the part inside the screen still hand-drawn line art, the part outside hyperreal" if sketchy else "")
    ctx["mj_letters_k1"] = "" if mode == "layered" else f', giant serif letters "{word}" lifting off the web page'
    ctx["mj_letters_k2"] = ("" if mode == "layered" else
                            f', giant 3D letters "{word}" made of {brief["letter_material"]} standing around {ctx["product_short"]}, some behind it, one in front')
    ctx["mj_tagline"] = (f', the words "{tag}" standing physically in the scene' if mode == "baked"
                         else ", clean empty upper third of the frame")
    ctx["negatives"] = tpl["negatives"] + look.get("negatives_extra", [])
    allow = set(tpl["drawn_modes"][ctx["drawn_mode"]].get("mj_allow", "").split(","))
    mj_neg = [x.strip() for x in f"{tpl['mj_negatives']}, {look.get('mj_negatives_extra', '')}".split(",") if x.strip()]
    ctx["mj_negatives"] = ", ".join(x for x in mj_neg if x not in allow)
    ctx["mj_params"] = look.get("mj_params", "--ar 9:16 --v 7 --style raw")
    return ctx


def default_text_layers(brief, ctx, stages):
    mode = ctx["mode"]
    font = brief.get("font_family") or ctx["font_family"]
    text_hex = brief.get("text_hex", "#2A1E17")
    accent_hex = brief.get("accent_hex", "#B5523B")
    t1 = stages[0]["duration_sec"]
    total = sum(x["duration_sec"] for x in stages)
    t2 = total - stages[-1]["duration_sec"]  # hero starts
    layers = []
    if mode == "layered":
        layers.append({
            "id": "hero-word-emerge", "text": ctx["hero_word"], "split": "letter",
            "font": {"family": font, "weight": 700, "size": 330, "tracking": 0.02},
            "color": accent_hex, "material": "extruded", "depth": 18, "plane": "front",
            "from": 0.5, "to": t1 + 0.4, "anchor": {"x": 0.5, "y": 0.3},
            "preset": "emerge-from-screen",
        })
        layers.append({
            "id": "hero-word-orbit", "text": ctx["hero_word"], "split": "letter",
            "font": {"family": font, "weight": 700, "size": 330, "tracking": 0.02},
            "color": accent_hex, "material": "extruded", "depth": 18, "plane": "back",
            "from": t1 + 0.4, "to": t2 + 0.3, "anchor": {"x": 0.5, "y": 0.3},
            "preset": "orbit-behind-product",
        })
    if mode in ("layered", "hybrid"):
        layers.append({
            "id": "tagline", "text": brief["tagline"].upper(), "split": "letter",
            "font": {"family": font, "weight": 600, "size": 92, "tracking": 0.08},
            "color": text_hex, "material": "shadow", "plane": "front",
            "from": t2 + 0.2, "to": total, "anchor": {"x": 0.5, "y": brief.get("tagline_y", 0.16)},
            "max_width": 0.86,
            "preset": "assemble-tagline",
        })
    if ctx.get("drawn_kinetic"):
        ink = brief.get("drawn_hex") or text_hex
        common = {"type": "draw", "text": "", "font": {"family": font, "size": 1}, "stroke": ink, "boil": 1.6}
        layers += [
            {**common, "id": "draw-arrow", "shape": "arrow", "size": 300, "stroke_width": 7,
             "from": 1.0, "to": t1 + 0.2, "anchor": {"x": 0.27, "y": 0.6}, "preset": "draw-on-off"},
            {**common, "id": "draw-sparkle-1", "shape": "sparkle", "size": 120, "stroke_width": 6,
             "from": t1 + 1.0, "to": t1 + 3.6, "anchor": {"x": 0.22, "y": 0.42}, "preset": "draw-on-off"},
            {**common, "id": "draw-sparkle-2", "shape": "sparkle", "size": 90, "stroke_width": 6,
             "from": t1 + 2.2, "to": t2 - 0.3, "anchor": {"x": 0.8, "y": 0.58}, "preset": "draw-on-off"},
            {**common, "id": "draw-underline", "shape": "underline", "size": 640, "stroke_width": 5,
             "from": t2 + 1.1, "to": total, "anchor": {"x": 0.5, "y": brief.get("tagline_y", 0.16) + 0.045}, "preset": "draw-on"},
        ]
    return {
        "width": W, "height": H, "fps": ctx.get("fps", 24), "duration_sec": total,
        "grain": {"amount": 0.12, "size": 0.9} if ctx.get("look") == "hyperreal" else None,
        "plate": "final.mp4",
        "matte": "matte/fg",
        "background": "#EFE6DA",
        "fonts": [font],
        "layers": layers,
    }


def mj_block(title, prompt, save_as, brief, ctx, tpl, extra=""):
    params = [ctx["mj_params"]]
    if brief.get("mj_style_ref"):
        params.append(f"--sref {brief['mj_style_ref']}")
    if brief.get("mj_product_ref"):
        params.append(f"--oref {brief['mj_product_ref']} --ow 120")
    params.append(f"--no {ctx['mj_negatives']}")
    # MJ ignores long negative sentences — strip the series' sentence negatives from the body
    body = prompt.replace(ctx["negatives_short"], "").strip()
    words = len(body.split())
    return (f"### {title}\n\nשמור בשם: `{save_as}`{extra} · {words} מילים\n\n```\n{body} {' '.join(params)}\n```\n")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("brief")
    ap.add_argument("--series", default="surreal-product-ad")
    ap.add_argument("--project", default="surreal-ads")
    ap.add_argument("--date", default=dt.date.today().isoformat())
    ap.add_argument("--out", help="run dir (default bambi/outputs/<project>/<date>-<slug>)")
    ap.add_argument("--no-render", action="store_true", help="skip storyboard.md / grid rendering")
    a = ap.parse_args()

    tpl_path = os.path.join(SKILL_DIR, "series", a.series, "templates.json")
    with open(tpl_path, encoding="utf-8") as f:
        tpl = json.load(f)
    with open(a.brief, encoding="utf-8") as f:
        brief = json.load(f)

    schema_path = os.path.join(SKILL_DIR, "series", a.series, "brief.schema.json")
    with open(schema_path, encoding="utf-8") as f:
        required = json.load(f).get("required", [])
    missing = [k for k in required if not brief.get(k)]
    if missing:
        sys.exit(f"brief חסר שדות חובה: {', '.join(missing)}")
    if len(brief["hero_word"]) > 6:
        print(f"אזהרה: hero_word '{brief['hero_word']}' ארוך מ-6 אותיות — מודלי תמונה/וידאו נוטים לשבש מילים ארוכות",
              file=sys.stderr)

    # optional beats (e.g. macro_beat) — splice an extra keyframe + stage, retime, re-chain from/to keys
    stages_def = [dict(x) for x in tpl["stages"]]
    kf_def = [dict(x) for x in tpl["keyframes"]]
    for beat_id, beat in tpl.get("optional_beats", {}).items():
        on = brief.get(beat_id, beat.get("default", False))
        if not on:
            continue
        ia = next(i for i, x in enumerate(stages_def) if x["id"] == beat["insert_after"])
        prev_to = stages_def[ia]["to_key"]
        new_stage = dict(beat["stage"], from_key=prev_to, to_key=beat["keyframe"]["id"])
        stages_def.insert(ia + 1, new_stage)
        stages_def[ia + 2]["from_key"] = beat["keyframe"]["id"]
        ki = next(i for i, x in enumerate(kf_def) if x["id"] == prev_to)
        kf_def.insert(ki + 1, dict(beat["keyframe"]))
        for x in stages_def:
            x["duration_sec"] = beat["durations"].get(x["id"], x["duration_sec"])
    for i, x in enumerate(stages_def, 1):
        x["n"] = i
    tpl = dict(tpl, stages=stages_def, keyframes=kf_def)

    slug = brief["slug"]
    run_rel = a.out or os.path.join("bambi", "outputs", a.project, f"{a.date}-{slug}")
    run_dir = os.path.join(REPO_ROOT, run_rel) if not os.path.isabs(run_rel) else run_rel
    run_rel = os.path.relpath(run_dir, REPO_ROOT)
    os.makedirs(os.path.join(run_dir, "keyframes"), exist_ok=True)
    os.makedirs(os.path.join(run_dir, "videos"), exist_ok=True)

    ctx = build_context(brief, tpl)
    mb = brief.get("macro_beat")
    ctx["macro_shot"] = (mb.get("shot") if isinstance(mb, dict) else "") or f"{brief['product']}, the brand name '{brief['brand']}' perfectly legible"
    for k in ("product_he", "transformation_he", "letter_material"):
        ctx[k] = brief[k]

    anchor = f"bambi/cast/{a.project}/{slug}-product.png"
    kf_path = {k["id"]: f"{run_rel}/keyframes/{k['id']}.png" for k in tpl["keyframes"]}

    keyframes = []
    prev = None
    for k in tpl["keyframes"]:
        refs = [anchor] + ([prev] if prev else [])
        keyframes.append({
            "id": k["id"], "label": k["label"], "path": kf_path[k["id"]],
            "image_prompt": fill(k["prompt"], ctx),
            "mj_prompt": fill(k["mj_prompt"], ctx) if k.get("mj_prompt") else None,
            "references": refs,
        })
        prev = kf_path[k["id"]]

    kf_by_id = {k["id"]: k for k in keyframes}
    scenes = []
    for st in tpl["stages"]:
        n = st["n"]
        scenes.append({
            "scene_number": n,
            "title": f"{st['title']} · {st['title_he']}",
            "stage": st["id"],
            "duration_sec": st["duration_sec"],
            "description": fill(st["description_he"], ctx),
            "characters": ["product"],
            "shot": st["shot"],
            "image_prompt": kf_by_id[st["from_key"]]["image_prompt"],
            "video_prompt": fill(st["video_prompt"], ctx),
            "reference": anchor,
            "image_output": kf_path[st["from_key"]],
            "end_reference": kf_path[st["to_key"]],
            "first_frame_key": st["from_key"],
            "end_frame_key": st["to_key"],
            "video_output": f"{run_rel}/videos/s{n:02d}.mp4",
        })

    theme = tpl["visual_theme"]
    total = sum(s["duration_sec"] for s in scenes)
    text_layers = brief.get("text_layers")
    tl_doc = default_text_layers(brief, ctx, tpl["stages"])
    if text_layers is not None:
        tl_doc["layers"] = text_layers

    storyboard = {
        "project": a.project,
        "title": f"{brief['brand']} — {brief['tagline'].upper()}",
        "logline": (f"{ctx['product_he']} פורץ ממסך האתר, מתעמת עם האותיות הענקיות {ctx['hero_word']} "
                    f"ונרגע לשוט הירו עם {ctx['tagline_q']}."),
        "language": "he",
        "aspect_ratio": tpl["aspect_ratio"],
        "series": {
            "name": tpl["series"], "version": tpl["version"], "slug": slug,
            "brief": brief,
            "image_route": ctx.get("image_route", "gpt"),
            "typography_mode": ctx["mode"],
            "keyframes": keyframes,
            "negatives": ctx["negatives"],
            "look": ctx["look"],
            "drawn_mode": ctx["drawn_mode"],
            "mj_params": ctx["mj_params"],
            "sound_hint": ctx["sound_hint"],
            "text_layers": "text_layers.json",
            "master_prompt": "master_prompt.txt",
            "final": f"{run_rel}/final.mp4",
            "final_typo": f"{run_rel}/final_typo.mp4",
            "total_duration_sec": total,
        },
        "visual_theme": {
            "palette": ctx["palette"], "lighting": ctx["look_lighting"], "film_look": ctx["look_film_look"],
            "motion": theme["motion"], "mood": theme["mood"],
        },
        "cast": [{
            "id": "product", "name": f"{brief['brand']} — {ctx['product_he']}",
            "description": (f"Clean premium studio packshot, vertical 9:16, of {brief['product']}. "
                            f"Brand name '{brief['brand']}' clearly printed. Centered on a cream seamless "
                            f"background, soft daylight, realistic materials, no other objects. {ctx['realism']}").strip(),
            "anchor_image": anchor, "anchor_ready": os.path.exists(os.path.join(REPO_ROOT, anchor)),
        }],
        "scenes": scenes,
    }

    def w(name, content):
        p = os.path.join(run_dir, name)
        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        return p

    w("storyboard.json", json.dumps(storyboard, ensure_ascii=False, indent=2) + "\n")
    w("text_layers.json", json.dumps(tl_doc, ensure_ascii=False, indent=2) + "\n")
    w("master_prompt.txt", fill(tpl["master_prompt"], ctx) + "\n")

    # --- Midjourney (manual route) ---
    mj = [f"# Midjourney — {brief['brand']} ({slug})\n",
          "מסלול ידני: מייצרים כל תמונה ב-Midjourney, שומרים **בדיוק** בשם המצוין, ולוחצים ↻ ב-`storyboard_grid.html`.\n",
          "**סדר עבודה:** (1) עוגן מוצר → העלה ל-MJ והשתמש ב-URL שלו כ-`--oref` (ובתמונה K0 כ-`--sref`) לכל ה-keyframes. "
          "(2) K0→K3 לפי הסדר; לכל K מומלץ לצרף גם את ה-K הקודם כ-image prompt לרציפות הסצנה.\n",
          f"**טקסט ב-MJ:** MJ חלש בכתיב — מילה קצרה ({ctx['hero_word']}) בסדר; את הטאגליין משאירים לשכבת הטיפוגרפיה "
          f"(typography_mode הנוכחי: `{ctx['mode']}`). בדוק איות בכל תמונה לפני שמירה.\n",
          "**אחרי בחירת variation:** Upscale (Subtle) → הורד PNG → שנה שם → גרור לתיקייה.\n"]
    anchor_mj = fill(tpl["mj_anchor_prompt"], ctx) if tpl.get("mj_anchor_prompt") else storyboard["cast"][0]["description"]
    mj.append(mj_block("עוגן מוצר (product anchor)", anchor_mj, anchor, brief, ctx, tpl,
                       "  ← נתיב יחסי לשורש הריפו"))
    for k in keyframes:
        mj.append(mj_block(k["label"], k.get("mj_prompt") or k["image_prompt"], f"keyframes/{k['id']}.png", brief, ctx, tpl))
    w("midjourney_prompts.md", "\n".join(mj))

    # --- production commands ---
    gpt = "bash .claude/skills/gpt-image-gen/scripts/generate.sh"
    vid = "bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh"
    prod = [f"# Production — {brief['brand']} ({slug})\n",
            f"מצב: image_route=`{ctx.get('image_route', 'gpt')}` · typography_mode=`{ctx['mode']}` · משך {total}s · 9:16\n",
            "## 1. עוגן מוצר (יובל)\n", f"```bash\n{gpt} \"{storyboard['cast'][0]['description']}\" \"{anchor}\"\n```\n",
            "## 2. Keyframes K0→K3 (יובל — או ידני ב-Midjourney: `midjourney_prompts.md`)\n"]
    for k in keyframes:
        refs = " ".join(f'--reference "{r}"' for r in k["references"])
        prod.append(f"**{k['label']}**\n```bash\n{gpt} \"{k['image_prompt']}\" \"{k['path']}\" {refs}\n```\n")
    prod.append("## 2b. QA רציפות לפני וידאו (חובה)\n")
    prod.append("לכל זוג K(n)→K(n+1): אותו צד מוצר, אותו מיקום ביס/שבר/נזק, אותו סט ואביזרים. הצב זה-לצד-זה ב-`_qa/kN_compare.png` והסתכל. "
                "תיקון זול: Kling `image_to_image` עם `gemini-3.1-flash-image` (Nano Banana 2, 15 קרדיטים) + שני ה-K כרפרנס. "
                "(ב-MELT הביס קפץ פינה בין K2b ל-K3 → נדרשה הרצה חוזרת של S4.)\n")
    prod.append(f"## 3. וידאו — {len(scenes)} קליפים, פריים ראשון + אחרון (the-video-man)\n")
    prod.append("**מסלול מומלץ (הוכח ב-MELT): Kling MCP** — `file_upload` לכל K → `image_to_video` עם `kling-video-v3_0`, "
                "`first_image`=K(n), `tail_image`=K(n+1), `duration` לפי הטבלה, `resolution 1080p`, `prefer_multi_shots=false`, "
                "`enable_audio=false` (~8 קרדיטים/שנייה). חלופה ב-OpenRouter:\n")
    for s in scenes:
        prod.append(f"**S{s['scene_number']:02d} {s['title']}** ({s['duration_sec']}s)\n```bash\n{vid} \"{s['video_prompt']}\" "
                    f"\"{s['video_output']}\" --model kwaivgi/kling-v3.0-pro --duration {s['duration_sec']} "
                    f"--aspect-ratio 9:16 --reference \"{s['image_output']}\" --end-frame \"{s['end_reference']}\"\n```\n")
    prod.append("## 4. הרכבה — hard cuts (scale-to-cover + crop, לעולם לא מתיחה)\n")
    prod.append(f"```bash\nbash .claude/skills/kinetic-typography/scripts/concat.sh \"{run_rel}/final.mp4\" "
                + " ".join(f'\"{s["video_output"]}\"' for s in scenes) + "\n```\n")
    prod.append("## 5. אפקטי תמונה בקוד (cinematic-finish §A)\n")
    prod.append(f"מדוד T0 + מרכז השבר מ-s01 (frame-diff), כתוב `{run_rel}/fx/fx_config.json`, ואז:\n"
                f"```bash\ncd \"{run_rel}\"\npython3 ../../../../.claude/skills/cinematic-finish/scripts/fx_edit.py --stills 50 55 60 212 300   # QA\n"
                f"python3 ../../../../.claude/skills/cinematic-finish/scripts/fx_edit.py                            # → final.mp4\n```\n"
                "speed-ramp · impact punch/shake/flash/chromatic · shards נושאי-מסך · whip-pan על המורף של S3 · grade אחיד.\n")
    prod.append("## 6. שכבת טיפוגרפיה (kinetic-typography) — רק מעוגנת, אחרי שהמצלמה נעצרת\n")
    prod.append(f"```bash\nbash .claude/skills/kinetic-typography/scripts/studio.sh \"{run_rel}\"   # תצוגה מקדימה + כיוונון\n"
                f"bash .claude/skills/kinetic-typography/scripts/render.sh \"{run_rel}\"   # → final_typo.mp4\n```\n"
                "(`extract_matte.sh` רק אם יש שכבות `back`.)\n")
    prod.append("## 7. סאונד היברידי (cinematic-finish §B)\n")
    prod.append(f"1. `python3 .claude/skills/cinematic-finish/scripts/motion_map.py` (מתוך תיקיית הריצה) → עדכן את הטיוטה `audio/v4/CUES.md` לפי `_qa/snd/sheet.jpg`.\n"
                "2. סוכן composer ברקע (Sonnet) לפי `.claude/skills/cinematic-finish/templates/composer_brief.md` → 6 stems בקוד.\n"
                "3. SFX ריאליסטיים מ-`audio/v4/sfx_plan.json` (ElevenLabs, 2 takes, **estimate → אישור**, ≈$0.10) → `analyze_takes.py` → `picks.json`.\n"
                "4. העתק `cinematic-finish/scripts/mix_template.py` → `audio/v4/mix.py`, ערוך את קטע ה-SFX → `python3 audio/v4/mix.py` → "
                f"`{brief['brand']}_final.mp4` (−14 LUFS, −1.5 dBTP, בלי loudnorm דינמי).\n")
    w("production.md", "\n".join(prod))

    # --- sound plan drafts (cinematic-finish) ---
    os.makedirs(os.path.join(run_dir, "audio", "v4"), exist_ok=True)
    t = 0.0; times = {}
    for st in scenes:
        times[st["scene_number"]] = (t, t + st["duration_sec"]); t += st["duration_sec"]
    n = len(scenes)
    s2a, s2b = times[2]; hero_a = times[n][0]
    cues = [f"# {brief['brand']} — sound cue sheet (DRAFT from build_series; {total}s, 24fps, 48kHz)\n",
            "Refine after `motion_map.py` against the real picture. Template + rules: `.claude/skills/cinematic-finish/templates/CUES.template.md`.\n",
            "| t (s) | On screen | Music (composer, code) | SFX (realistic) |", "|---|---|---|---|",
            f"| 0.00–≈2.3 | {ctx.get('device_setting_short', 'device on table')} — website, slow push-in | tension bed rising, heartbeat accelerating | room tone, screen stress rising |",
            "| ≈T0−0.06 | pre-break | **suck-out 60ms silence** | cut |",
            f"| **≈2.3 (T0)** | {brief.get('emergence', 'product breaks out of the screen')} | **IMPACT** sub drop + timpani + braam | real break of the screen + snap |",
            "| T0–T0+1.0 | slow-mo (fx_edit speed ramp) | varispeed ½ + low-pass | impact tail ½ speed |",
            f"| T0+1.0–{s2a:.2f} | debris lands | reverse cymbal into drop | debris on oak/keyboard |",
            f"| **{s2a:.2f}–{s2b:.2f}** | {brief.get('transformation', 'transformation')} | **DROP** 120 BPM + ostinato, build to {s2b-0.05:.2f} | product motion air (motion-driven), {brief.get('letter_material', 'material')} textures, thud per letter of {brief['hero_word']} |",
            f"| **{s2b:.2f}–{s2b+0.7:.2f}** | held beat | **HARD STOP — silence** | one intimate detail ({brief.get('particles', 'droplet')}) + room |"]
    if n >= 4:
        ma, mb_ = times[3]
        cues += [f"| ≈{s2b+0.75:.2f}–{s2b+1.2:.2f} | whip-pan (fx_edit) | sweep riser → downbeat | real air swish riding the pan |",
                 f"| {s2b+1.2:.2f}–{mb_:.2f} | brand macro | sparse — organic layer (ElevenLabs piano/cello) | ASMR material detail |"]
    cues += [f"| {hero_a:.2f}–{hero_a+1.6:.2f} | pull-back / hero reveal | swell + timpani roll | camera air, packaging sound |",
             f"| ≈{total-1.6:.2f} | tagline '{brief.get('tagline', '')}' locks | **final hit + resolving chord** | restrained |",
             f"| →{total} | settled hero | chord rings, fade last 0.4s | room tone |", "",
             "Mix: static gain + true-peak limiter; music ducks only under the impact. Silence beats are features."]
    w("audio/v4/CUES.md", "\n".join(cues) + "\n")
    mat, prod_s = brief.get("letter_material", "the material"), brief.get("product_short", brief["product"])
    sfx_plan = [
        {"name": "impact", "duration": 2.5, "prompt": "Close-mic laptop screen glass shattering from a heavy blunt impact from behind: one sharp violent crack burst, then dense glass fragments breaking apart, realistic foley, dry room, no music"},
        {"name": "creak", "duration": 2.0, "prompt": "Thin glass under pressure, a crack slowly spreading across it with tense creaking and fine ticking, close mic, quiet room, realistic"},
        {"name": "shards", "duration": 2.0, "prompt": "Small glass shards falling and tinkling onto a wooden table and laptop keyboard, scattered bright fragments bouncing and settling, realistic foley"},
        {"name": "scrape", "duration": 1.5, "prompt": f"{prod_s} grinding and scraping its way out through broken glass, gritty crunching glass edges, weighty, close mic"},
        {"name": "flyby", "duration": 2.0, "prompt": "A heavy massive object flying past the camera very close, deep weighty pass-by with real air turbulence and doppler, building then passing, realistic not synthetic"},
        {"name": "landing", "duration": 1.2, "prompt": f"{mat} landing heavily on a linen cloth on an oak table, close foley, realistic"},
        {"name": "transform", "duration": 2.0, "prompt": f"{brief.get('transformation', mat)} — the real physical sound of it, close mic, realistic foley, no music"},
        {"name": "thud", "duration": 0.6, "prompt": f"Single heavy dull thud of a solid letter made of {mat} settling into place, weighty and soft, short"},
        {"name": "detail", "duration": 1.0, "prompt": f"One single tiny sound of {brief.get('particles', 'a droplet')} in a completely silent room, close mic ASMR, nothing else"},
        {"name": "whip", "duration": 0.7, "prompt": "Very fast natural air swish, like a cloth or arm whipped past a microphone, short sharp swoosh with real air, not synthetic"},
        {"name": "macro", "duration": 2.0, "prompt": f"Extreme close-up of {prod_s}, soft intimate material sounds and tiny details, ASMR, quiet"},
        {"name": "packaging", "duration": 1.2, "prompt": f"The packaging of {prod_s} being revealed, crisp close foley, short"},
        {"name": "room", "duration": 5.0, "prompt": "Quiet warm room tone with a faint laptop fan hum, steady, no events, no music"},
    ]
    w("audio/v4/sfx_plan.json", json.dumps({"model": "eleven_text_to_sound_v2", "prompt_influence": 0.6, "generations_count": 2,
                                            "note": "Edit every prompt to the exact physical action on screen (see cinematic-finish/templates/sfx_prompts.md).",
                                            "sounds": sfx_plan}, ensure_ascii=False, indent=2) + "\n")

    sb_path = os.path.join(run_dir, "storyboard.json")
    if not a.no_render:
        subprocess.run([sys.executable, os.path.join(SCRIPT_DIR, "render_md.py"), sb_path],
                       check=True, stdout=subprocess.DEVNULL)
        subprocess.run([sys.executable, os.path.join(SCRIPT_DIR, "render_series_grid.py"), sb_path], check=True)
    print(f"[built] {run_rel}/  ({len(scenes)} stages · {len(keyframes)} keyframes · {total}s · "
          f"look={ctx['look']} · drawn={ctx['drawn_mode']} · mode={ctx['mode']} · route={ctx.get('image_route', 'gpt')} · "
          f"text layers={len(tl_doc['layers'])})")


if __name__ == "__main__":
    main()
