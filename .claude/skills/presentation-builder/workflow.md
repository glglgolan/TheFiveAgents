# Presentation Builder — Workflow

Follow these steps in order. Create a TodoWrite item per step.

## 1. Resolve inputs

- Capture the **subject** from the chat.
- Determine folder paths. Defaults: `ref_text/`, `ref_images/`, `output/`. If the
  user named other paths, use those.
- Create any missing folders.

## 2. Ingest references

Run the ingestion script:

```bash
python3 .claude/skills/presentation-builder/scripts/read_refs.py \
  --ref-text <ref_text> --ref-images <ref_images> --out output/refs_index.json
```

Then act on the result:

- `sources[].text` — use directly as source material.
- `needs_skill_extraction` — any PDF/DOCX the script couldn't parse. Extract those
  with the **`anthropic-skills:pdf`** or **`anthropic-skills:docx`** skill.
- `urls_to_fetch` — fetch each with **WebFetch** and fold the content in.
- `images` — the catalog of available images (filename + dimensions) you may place.

If `ref_text/` and the chat are both empty, ask the user for content before continuing.

## 3. Ask: language (RTL)

Use AskUserQuestion — **Hebrew** or **English**.

- If **Hebrew**: the whole deck is **RTL**. Set `"dir": "rtl"` and `"lang": "he"` in
  `content.json`. Right-align text, reverse reading order of columns, and use an
  RTL-capable font (e.g. "Arial", "Open Sans Hebrew", "Heebo"). See pptx.md / remotion.md.
- If **English**: `"dir": "ltr"`, `"lang": "en"`.

## 4. Ask: style / branding

Use AskUserQuestion. Offer a "you decide" option on every choice.

- **Palette** — brand colors, or "you decide" → pick a content-informed palette
  (see the palette table in the `anthropic-skills:pptx` skill; don't default to blue).
- **Tone / font pairing** — or "you decide" → pick a header+body pairing that fits
  the topic (see pptx skill typography table).
- If the user has a brand reference image/logo in `ref_images/`, sample its colors.

## 5. Ask: output format

Use AskUserQuestion. Three options:

- **HTML** (animation-rich web deck via `frontend-slides`) — highest fidelity; best for
  a polished, on-brand, shareable presentation. Requires the `frontend-slides` skill
  (see `INSTALL.md`); if it isn't installed, say so and offer PPTX instead.
- **PPTX** (editable PowerPoint slides).
- **Remotion MP4** (animated video file).

## 6. Build the outline → content.json

Draft a slide-by-slide structure and write it to `output/content.json`. Both backends
consume this exact schema:

```json
{
  "title": "Deck title",
  "name": "slug-for-filenames",
  "lang": "he",
  "dir": "rtl",
  "theme": {
    "primary": "1E2761", "secondary": "CADCFC", "accent": "FFFFFF",
    "bg": "FFFFFF", "text": "212121",
    "headerFont": "Heebo", "bodyFont": "Heebo"
  },
  "slides": [
    {
      "layout": "title|section|bullets|two-column|stat|image-left|image-right|quote|closing",
      "title": "Slide title",
      "subtitle": "optional",
      "bullets": ["point one", "point two"],
      "body": "optional paragraph",
      "stat": {"value": "42%", "label": "growth"},
      "image": "ref_images/photo.jpg",
      "notes": "speaker notes"
    }
  ]
}
```

Rules:
- Keep bullets short (≤ ~12 words). Don't dump raw source text onto slides.
- Vary `layout` across slides — never repeat the same layout back-to-back.
- Every content slide should have a visual (image, stat, or icon-style element).
- Reference only images that exist in the `images` catalog from step 2.

## 7. Build the deck

- **HTML** → follow `html.md`.
- **PPTX** → follow `pptx.md`.
- **Remotion** → follow `remotion.md`.

## 8. QA (required)

- **HTML**: serve over HTTP and screenshot key slides with a headless browser / the
  preview tools (per `html.md`). Verify every layout, the breadcrumb, and notes. Re-shot
  after navigation since reveals animate in ~0.7s.
- **PPTX**: convert to images and run a visual-QA **subagent** (per the
  `anthropic-skills:pptx` skill QA section). Also run `extract-text` and the
  placeholder grep. Fix real issues once, then stop.
- **Remotion**: render still frames of a few key compositions first, inspect with a
  subagent, fix issues, then render the full MP4.

For Hebrew decks, explicitly confirm in QA that text is right-aligned and reads RTL.

## 9. Hand back

Report the output path (`output/<name>.html`, `.pptx`, or `.mp4`) and a one-line summary.
