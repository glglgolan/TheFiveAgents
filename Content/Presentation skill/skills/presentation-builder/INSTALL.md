# Installing presentation-builder for another user

This skill (and its companion subagent) are path-safe — no machine-specific paths are
baked in. To use them on another machine, copy the folders and make sure a few
dependencies are present.

## 1. Copy the files

| What | From | To (on the target machine) |
|------|------|----------------------------|
| The skill | `.claude/skills/presentation-builder/` | `~/.claude/skills/presentation-builder/` (user-global) **or** a project's `.claude/skills/` |
| The subagent (optional) | `.claude/agents/presentation_builder.md` | `~/.claude/agents/` **or** a project's `.claude/agents/` |

Use `~/.claude/...` to make it available everywhere; use a project's `.claude/...` to
scope it to one repo. The skill folder is self-contained (it ships `read_refs.py` and
the whole `remotion-template/`).

```bash
# user-global install, skill + agent
mkdir -p ~/.claude/skills ~/.claude/agents
cp -R .claude/skills/presentation-builder ~/.claude/skills/
cp .claude/agents/presentation_builder.md ~/.claude/agents/
```

## 2. Dependencies, by output format

The skill degrades gracefully — install only what you need for the formats you'll use.

### HTML deck (highest fidelity) — needs `frontend-slides`
The HTML path layers the external **`frontend-slides`** skill on top of `html.md`.
Install it too:

```bash
mkdir -p ~/.claude/skills
git clone --depth 1 https://github.com/zarazhangrui/frontend-slides.git \
  ~/.claude/skills/frontend-slides
```

- Fonts load from Fontshare/Google at view time — needs internet on the viewer's machine.
- PDF export (`frontend-slides/scripts/export-pdf.sh`) downloads a headless Chromium on
  first run (Node required). **Pass an absolute output path** — the script has a bug
  where a relative path is written into a temp dir and then deleted.
- If `frontend-slides` is absent, the skill falls back to PPTX and says so.

### PPTX deck
- **Node ≥ 18** and **`pptxgenjs`** (`npm install pptxgenjs`, local or global).
- Optional visual QA: **LibreOffice** (`soffice`) + **Poppler** (`pdftoppm`).

### Remotion MP4
- **Node ≥ 18** (Remotion v4 bundles its own ffmpeg — no system ffmpeg needed).
- `npm install` runs inside the bundled `remotion-template/` on first use.

### Reference ingestion (all formats)
- **Python 3** + `pip install Pillow pypdf python-docx`.
- For files those libs can't parse, the skill falls back to the built-in
  **`anthropic-skills:pdf`** / **`anthropic-skills:docx`** skills (shipped with Claude
  Code / Cowork by default).

## 3. Verify it works

In the target environment:

1. Confirm the skill is discovered — it should appear in the available-skills list, and
   the `presentation_builder` agent in the available-agents list. (Restart the Claude
   session after copying if it doesn't show up.)
2. Drop a `.md` into `ref_text/` and run: *"build a presentation about <subject>"*.
3. Choose **HTML** and confirm the style-preview + final deck flow works (this also
   confirms `frontend-slides` is wired in). Then try **PPTX** for a credential-free path
   that needs no extra skills.

## Notes

- Nothing here needs OAuth or cloud accounts. Canva / Google Slides are intentionally
  unsupported.
- The skill writes only under the (configurable) `output/` folder and creates
  `ref_text/` / `ref_images/` if missing.
