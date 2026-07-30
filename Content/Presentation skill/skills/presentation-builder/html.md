# Presentation Builder — HTML path (frontend-slides)

Produces a **single self-contained HTML deck** (fixed 1920×1080 stage that scales to
any screen) with staggered reveal animations, keyboard/touch nav, breadcrumbs, a
presenter-notes panel, and optional PDF export. This is the highest-fidelity output —
use it when the user wants a "magnificent", animation-rich, on-brand presentation.

> **Dependency:** this path layers the external **`frontend-slides`** skill on top of
> this file. It must be installed (see `INSTALL.md`). If it is missing, fall back to
> `pptx.md` and tell the user why.

## When to use

Pick HTML when the user wants polish, motion, web-shareability, or a logo/brand-led
look. Pick `pptx.md` when they need an editable PowerPoint, or `remotion.md` for a true
video file (MP4).

## Steps

1. **Confirm the engine is present.** Check `~/.claude/skills/frontend-slides/` (or the
   project `.claude/skills/frontend-slides/`). If absent, stop and point the user to
   `INSTALL.md`, then offer the PPTX path instead.

2. **Read the frontend-slides guides** (do not skip — they carry non-negotiable rules):
   - `frontend-slides/SKILL.md` — the workflow and hard constraints.
   - `frontend-slides/viewport-base.css` — paste its **full** contents into the deck.
   - `frontend-slides/html-template.md` and `frontend-slides/animation-patterns.md`.
   - `frontend-slides/STYLE_PRESETS.md` and `bold-template-pack/selection-index.json`
     for style discovery.

3. **Style discovery ("show, don't tell").** Generate **3 single-slide HTML previews**
   that interpret the chosen direction (from workflow step 4) three ways, save them to
   `.frontend-slides/slide-previews/style-{a,b,c}.html`, open them, and let the user
   pick. Honor the palette/fonts already decided in `content.json` as the starting
   point. Fonts come from Fontshare/Google — never system fonts; avoid the banned list
   in STYLE_PRESETS.md.

4. **Assets.** Use images from the `images` catalog (workflow step 2). If a fitting
   logo/image doesn't exist: look for an official logo on the web, or generate one;
   embed simple marks as inline SVG. Never repeat the same image except a logo on the
   title + closing slides.

5. **Generate the full deck** from `output/content.json` into
   `output/<name>.html` — one real `<section class="slide">` per slide so PDF export
   works. Map each `content.json` layout (title / section / bullets / two-column /
   stat / two-list / table / closing) to a styled slide. Carry the breadcrumb section
   trail + counter, and put each slide's `notes` into a presenter-notes panel (toggle
   on a key, e.g. `N`). Honor `dir: rtl` for Hebrew (right-align, reverse columns,
   RTL-capable font).

## QA (required)

Serve the file over HTTP (fonts need it) and screenshot key slides with a headless
browser / the preview tools. Verify every distinct layout renders, the breadcrumb
highlights the right section, and notes toggle. Re-screenshot after navigation —
reveal animations take ~0.7s, so an immediate shot can look blank. For Hebrew, confirm
RTL.

## PDF export (optional)

```bash
bash ~/.claude/skills/frontend-slides/scripts/export-pdf.sh \
  output/<name>.html "$(pwd)/output/<name>.pdf"
```

> **Known bug:** `export-pdf.sh` does **not** absolutize a *relative* output path — it
> `cd`s into a temp dir, writes the PDF there, then deletes the temp dir, losing the
> file. **Always pass an absolute output path** (the `$(pwd)/...` above). First run
> downloads a headless Chromium (one-time, slow).

## Hand back

Report `output/<name>.html` (and `.pdf` if exported) plus a one-line summary. Mention
the nav keys: ← → to move, `N` for notes.
