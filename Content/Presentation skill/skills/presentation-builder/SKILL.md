---
name: presentation-builder
description: Use when the user wants to build, create, or generate a presentation, slide deck, or pitch from a subject plus reference material. Turns a topic + reference docs (pdf/docx/txt/md/links) and images into an animation-rich HTML deck, an editable PPTX deck, or an animated Remotion MP4 video. Asks the user about language (Hebrew RTL / English), style/branding, and output format.
---

# Presentation Builder

Turns a **subject** plus **reference material** into a finished presentation —
an **animation-rich HTML deck**, an **editable PPTX deck**, or an **animated
Remotion MP4 video**.

This skill is shareable. Drop it into a project, add source material to two folders,
and run it. See `INSTALL.md` for copy steps and dependencies — the HTML path needs the
companion `frontend-slides` skill.

## What it does

1. Reads your subject (from the chat) and all reference material you provide.
2. Asks you a few questions: **language** (Hebrew → RTL, or English), **style /
   branding**, and **output format** (HTML, PPTX, or Remotion MP4). For any question
   you can say *"you decide"* and it will infer a good choice from your content.
3. Drafts a slide-by-slide outline (`content.json`).
4. Builds the deck and runs a visual QA pass before handing it back.

## Inputs

| Input | Where | Notes |
|-------|-------|-------|
| **Subject** | the chat | The topic / goal of the presentation. |
| **Reference text** | `ref_text/` | `.pdf`, `.docx`, `.txt`, `.md`. Links (URLs) can sit inside a `.txt`/`.md` or in a `.url`/`.webloc` file — they get fetched. |
| **Reference images** | `ref_images/` | `.png/.jpg/.jpeg/.gif/.webp/.svg` to place in the deck. |
| **Style / branding** | the chat | Optional. Colors, fonts, brand reference — or "you decide". |

Folder paths are **configurable**. Defaults are `ref_text/`, `ref_images/`,
`output/` relative to the working directory. Pass alternate paths when invoking
(e.g. *"use ~/decks/q3/sources for ref_text"*).

You do **not** need to pre-create the folders — the skill creates them if missing.

## Outputs

| Format | File | Best for |
|--------|------|----------|
| **HTML** | `output/<name>.html` (+ optional `.pdf`) | A polished, animation-rich, on-brand web deck. Highest fidelity. Needs the `frontend-slides` skill. |
| **PPTX** | `output/<name>.pptx` | Editable slides the user can keep working on. |
| **Remotion** | `output/<name>.mp4` | A polished animated video with medium motion to engage a crowd. |

Plus `output/content.json` — the structured outline every backend is built from.

## How to use

1. Put source docs in `ref_text/` and images in `ref_images/` (or tell the skill
   where they live).
2. Ask: *"build a presentation about <subject>"*.
3. Answer the language / style / format questions (or say "you decide").
4. Review the QA'd deck or video in `output/`.

## Backends

**HTML** (via the `frontend-slides` skill), **PPTX** (via pptxgenjs), and **Remotion
MP4** (via Node) are supported — all work with no external accounts or credentials.
Canva and Google Slides are intentionally **not** supported because they require
OAuth / cloud credentials.

## Implementation guides (read as needed)

- `workflow.md` — the full step-by-step engine workflow. **Start here.**
- `INSTALL.md` — how to copy this skill to another machine + dependency checklist.
- `html.md` — the HTML build path (uses the `frontend-slides` skill).
- `pptx.md` — the PPTX build path.
- `remotion.md` — the Remotion video build path + motion guidelines.
- `scripts/read_refs.py` — reference ingestion (run first).
- `scripts/remotion-template/` — the Remotion project scaffold.

## Requirements

See `INSTALL.md` for the full checklist. In short:

- **`frontend-slides` skill** installed (for the HTML path). Without it, the HTML path
  falls back to PPTX.
- **Node** ≥ 18 (Remotion bundles its own ffmpeg) and `pptxgenjs` (PPTX path).
- **Python 3** + `pip install Pillow pypdf python-docx` (ingestion; the `anthropic-skills`
  `pdf`/`docx` skills are used as fallback when a lib is missing).
- LibreOffice (`soffice`) + Poppler (`pdftoppm`) for PPTX visual QA (optional).
