---
name: font-foundry
description: Build a stylistic variation of a correct Hebrew font. Derives a new TTF from one of three OFL base fonts (Heebo / Rubik / Assistant) by pinning a weight off the variable axis and applying corner-rounding (Chaikin), slant, and width transforms. Letterforms stay correct because they come from a real font. Used by the "מעצב הפונטים" agent.
---

# Font Foundry

## Overview

Create **correct, installable Hebrew fonts** by deriving a *variation* from a
real OFL base font — never by drawing letters from scratch (which produces
inaccurate glyphs). The base supplies correct outlines for all 27 Hebrew
letters, Latin, digits and punctuation; we restyle them.

## The three base fonts (fixed — no research needed)

| Base | Character | wght range | Pick when the prompt wants… |
|------|-----------|-----------|------------------------------|
| `heebo` | neutral grotesque | 100–900 | default / UI / clean / ניטרלי |
| `rubik` | geometric, slightly rounded | 300–900 | גיאומטרי / מודרני / round geometric |
| `assistant` | humanist, friendly | 200–800 | הומניסטי / ידידותי / קריא / soft |
| `dana-yad` | **handwriting** (static, 400 only) | 400 | **כתב יד** / שובב / יד / handwriting — **ברירת מחדל לכל בקשת כתב-יד** |

> **Shortcut:** `--handwriting` flag = dana-yad + round=2 + slant=5° + contrast=0.18 + liga. Explicit flags always override.

## Transforms

| Flag | Range | Effect |
|------|-------|--------|
| `--weight` | base wght range | picks the weight off the variable axis (accurate) |
| `--round` | `0`–`3` | Chaikin corner-cutting iterations. `0` keeps original curves; `2` = pleasantly rounded; `3` = very soft |
| `--slant` | degrees (e.g. `8`) | rightward shear → italic / handwriting lean |
| `--width` | `0.7`–`1.3` | x-scale → condensed / extended |
| `--contrast` | `0.0`–`0.35` | calligraphic stroke contrast: x-width swells at mid-height, simulating a broad-nib pen. `0.22` = strong handwriting feel |
| `--liga` | flag | adds OpenType `liga` feature with 5 common Hebrew pairs: לא, של, כי, מי, וא |

## Usage

```bash
bash .claude/skills/font-foundry/scripts/make-variation.sh \
  --base heebo --weight 400 --round 2 --slant 0 --width 1.0 \
  --name "AgolHeebo" --style Regular \
  --out fonts/outputs/<date>-<slug>/AgolHeebo-Regular.ttf
```

The wrapper downloads the three base fonts on first run (cached in
`bases/`). Every glyph is transformed, so the output is a complete,
single-weight TTF. For a family, run once per weight (e.g. Regular at
`--weight 400` and Bold at `--weight 700`).

## Recipe → flags (heuristics for the agent)

- "מעוגל" / "round" / "soft" → `--round 2` ("מאוד מעוגל" → `3`)
- "כתב יד" / "handwriting" / "שובב" → `--round 3 --slant 7 --contrast 0.22 --liga`
- "נטוי" / "italic" / "כתב יד" → `--slant 8`
- "צר" / "condensed" → `--width 0.85` · "רחב" / "extended" → `--width 1.15`
- "דק" → `--weight 200/300` · "מודגש" → `--weight 700` · "שחור" → `--weight 800/900`

## Verify

After building, load it back to confirm Hebrew is present:

```bash
python3 -c "from fontTools.ttLib import TTFont; cm=TTFont('OUT.ttf').getBestCmap(); print('alef',0x05D0 in cm,'tav',0x05EA in cm)"
```

## License

Heebo, Rubik and Assistant are all SIL OFL — derivative fonts are permitted.
Keep the output under a new family name (don't reuse the base name verbatim
as the public name) per OFL reserved-name rules.
