# SPA Builder — Workflow

Follow these steps in order. Create a TodoWrite item per step. Keep user questions minimal.

## 1. Resolve inputs

- Capture the **prompt** (what the app does) from the chat.
- Determine folder paths. Defaults: `ref_text/`, `ref_images/`, `output/`. Use the
  user's paths if they named any. Only create `ref_text/` / `ref_images/` if the user
  actually has reference material.
- Pick a **`<name>`** slug for filenames from the prompt.

## 2. Ingest references (only if provided)

If the user pointed at reference material, run:

```bash
python3 .claude/skills/spa-builder/scripts/read_refs.py \
  --ref-text <ref_text> --ref-images <ref_images> --out output/refs_index.json
```

- `sources[].text` — copy, specs, or data to fold into the app.
- `needs_skill_extraction` — extract those PDFs/DOCX with `anthropic-skills:pdf` / `docx`.
- `urls_to_fetch` — fetch each with **WebFetch**.
- `images` — assets/logos you may embed.

If there's no reference material, skip this step entirely.

## 3. Decide build mode (ask only if ambiguous)

Infer **single-file** vs **framework** from the prompt:

**Lean single-file** when the request is: a tool / calculator / converter, a dashboard or
data visualization, a landing page, a one-screen prototype, a game, anything described as
"lightweight / simple / quick / a page", or with no routing/backend/auth need.

**Lean framework (Vite + React + TS)** when the request mentions: multiple pages or
**routes**, navigation between views, **auth / login**, persistent or shared **state**,
many reusable **components**, an API/backend integration, or words like "production /
scalable / real app".

- If one side clearly wins → **proceed without asking** and state your choice in one line.
- If it's a genuine toss-up → ask **one** `AskUserQuestion` (single-file vs framework,
  with a "you decide" option that defaults to single-file).

## 4. Ask: style / branding (one question, "you decide" allowed)

`AskUserQuestion`: palette + font feel.
- "you decide" → pick a content-informed palette and a header+body font pairing; don't
  default to generic blue. If a logo/brand image sits in `ref_images/`, sample its colors.
- Prefer a small, deliberate palette (bg, surface, text, muted, 1–2 accents) as CSS
  custom properties so the look is consistent and easy to retheme.

## 5. Ask: language / direction (only if unclear)

If the prompt language makes it obvious, skip. Otherwise `AskUserQuestion`: Hebrew (RTL)
or English (LTR).
- **Hebrew** → `dir="rtl"`, `lang="he"`, right-aligned text, mirrored layout, RTL-capable
  font (Heebo / Assistant / Rubik / Open Sans Hebrew).
- **English** → `dir="ltr"`, `lang="en"`.

## 6. Plan the app

Write a short structure before coding: the screens/sections, the key interactions, the
data shape (and where data comes from — inline, generated, fetched, or from refs), and the
component breakdown (framework mode). Keep state minimal and explicit.

## 7. Build

- **single-file** → follow `single-file.md`.
- **framework** → follow `framework.md`.

State lives in one place; render from a single source of truth. Use semantic HTML, CSS
custom properties for theming, and accessible controls (labels, focus states, keyboard nav).

## 8. QA (required — real browser, not just a read-through)

`file://` is blocked in the browser tools, so **serve over HTTP**:

```bash
python3 -m http.server 8765 >/tmp/spa_qa.log 2>&1 &   # run from output/ (or project root)
```

Then with the **Playwright** MCP (or **Claude Preview** MCP):

1. `browser_navigate` to `http://localhost:8765/<path>` (single-file) or the Vite dev URL.
2. `browser_console_messages` at level `error` — **require zero JS errors** (a missing
   favicon 404 is fine). Fix any real error before continuing.
3. `browser_take_screenshot` (fullPage) — confirm layout, theme, and that content rendered.
4. Exercise the **key interactions** (click a control, submit a form, toggle a view) and
   re-screenshot to confirm they work.
5. For Hebrew, confirm text is right-aligned and the layout reads RTL.

Fix real issues once, then stop. Kill the QA server when done (`pkill -f "http.server 8765"`).

## 9. Hand back

Report the output path and exactly how to run it:
- **single-file** → `output/<name>.html` — "just open it" (and the local URL you QA'd on).
- **framework** → `output/<name>/` — `npm install && npm run dev`, plus the dev URL.

One-line summary of what it does + the main interactions.
