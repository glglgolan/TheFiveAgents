---
name: spa-builder
description: Use when the user wants to build, create, or generate a web app, single-page app (SPA), interactive page, dashboard, tool, calculator, data visualization, or landing page from a prompt (plus optional reference material). Produces either a single self-contained HTML file (no build, opens offline) or a scaffolded Vite + React + TypeScript app — the skill picks per request and asks only when ambiguous. Asks minimal guided questions (build mode if unclear, style/branding, language RTL/LTR) and runs a browser QA pass before handing back.
---

# SPA Builder

Turns a **prompt** (plus optional reference material) into a working **web app** —
either a **single self-contained HTML file** or a **Vite + React + TypeScript project**.
The skill decides which mode fits the request and asks the user only when it's genuinely
ambiguous. It keeps questions minimal, builds, then QAs in a real browser before handing back.

This is the sibling of the `presentation-builder` skill. **Use this for apps / tools /
interactive pages; use `presentation-builder` for slide decks / pitches.** If the request
is really "slides", route there instead.

## Two build modes

| Mode | Output | Best for |
|------|--------|----------|
| **single-file** (default-leaning) | `output/<name>.html` — one file, vanilla HTML/CSS/JS (CDN libs allowed), no build, opens offline | dashboards, tools, calculators, data viz, landing pages, prototypes, single-screen apps |
| **framework** | a Vite + React + TS project under `output/<name>/` with a dev server | multi-route apps, shared state, component reuse, auth flows, anything meant to grow |

**The skill decides** with the heuristic in `workflow.md` step 3, and asks only if the
request sits on the fence. Both modes are credential-free and run locally.

## Inputs

| Input | Where | Notes |
|-------|-------|-------|
| **Prompt** | the chat | What the app should do. The only required input. |
| **Reference text** | `ref_text/` *(optional)* | `.pdf/.docx/.txt/.md` + links — content, copy, specs, data. |
| **Reference images** | `ref_images/` *(optional)* | logos / mockups / brand refs to use or sample colors from. |
| **Style / branding** | the chat *(optional)* | colors, fonts, a brand reference — or "you decide". |

Folder paths are **configurable**; defaults are `ref_text/`, `ref_images/`, `output/`
relative to the working directory. The skill creates them only if you actually point at them.

## Minimal guided questions

The agent keeps it to the fewest questions possible (`AskUserQuestion`), every choice
offering a **"you decide"** option:

1. **Build mode** — *asked only when ambiguous* (single-file vs framework).
2. **Style / branding** — palette + font feel, or "you decide" (infer from content/refs).
3. **Language / direction** — Hebrew → RTL, or English → LTR. Inferred from the prompt
   language when obvious; asked only if unclear.

If the prompt already answers a question, don't ask it.

## Outputs

- **single-file** → `output/<name>.html` (self-contained; just open it).
- **framework** → `output/<name>/` (run `npm install && npm run dev`).

## Implementation guides (read as needed)

- `workflow.md` — the full step-by-step engine workflow. **Start here.**
- `single-file.md` — the single-file HTML build path (the lightweight default).
- `framework.md` — the Vite + React + TS build path.
- `scripts/read_refs.py` — optional reference ingestion (run only if `ref_text/` /
  `ref_images/` are in play).

## Local status (this project — TheFiveAgents)

- **Node v24, npm, Python 3** — present. Both modes work here.
- **QA**: a local static server (`python3 -m http.server`) + the **Playwright** MCP
  (`browser_navigate` / `browser_take_screenshot` / `browser_console_messages`) or the
  **Claude Preview** MCP. `file://` is blocked in the browser tools — always serve over HTTP.
- No OAuth / cloud accounts needed.

## Requirements

- **single-file**: nothing — pure static HTML. CDN libraries (e.g. via esm.sh / unpkg)
  are allowed but the file must still open and run offline-degrade gracefully.
- **framework**: Node ≥ 18 + npm (present). Scaffolded with `npm create vite`.
- **reference ingestion** (optional): Python 3 (+ `Pillow pypdf python-docx` when parsing
  PDFs/DOCX; falls back to the `anthropic-skills:pdf` / `docx` skills).
