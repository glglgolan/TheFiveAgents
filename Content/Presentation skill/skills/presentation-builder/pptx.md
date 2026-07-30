# PPTX Build Path

Builds `output/<name>.pptx` from `output/content.json` using **pptxgenjs**.

> **Always layer the `anthropic-skills:pptx` skill on top of this file.** That skill
> owns the design rules (palettes, typography, layout patterns, anti-patterns) and
> the required visual-QA loop. This file only covers how to drive it from
> `content.json` and how to handle RTL.

## Steps

1. Ensure pptxgenjs is available: `npm ls pptxgenjs || npm install pptxgenjs`.
2. Read `output/content.json`.
3. Generate a pptxgenjs build script that maps each slide's `layout` to a design
   from the `anthropic-skills:pptx` layout patterns:
   - `title` / `section` / `closing` → dark background using `theme.primary`.
   - `bullets` → left-aligned bullets, title 36-44pt, body 14-16pt.
   - `two-column` → text one side, image/illustration the other.
   - `stat` → large 60-72pt number callout with small label.
   - `image-left` / `image-right` → half-bleed image with content overlay.
   - `quote` → oversized italic quote.
4. Apply `theme` colors and fonts. Use white background for content slides unless a
   brand background is specified — never default to cream/beige.
5. Place images from `slide.image` (only files that exist).
6. Save to `output/<name>.pptx`.

## RTL (Hebrew) handling

When `content.json` has `"dir": "rtl"`:

- Set `rtlMode: true` on text options for every text element.
- Set `align: "right"` on titles, bullets, and body text.
- Use an RTL-capable font (`theme.headerFont`/`bodyFont`, e.g. "Heebo", "Arial",
  "Open Sans Hebrew").
- Mirror column order: in `two-column` / `image-left` / `image-right`, put the
  primary text block on the **right**.
- Bullet character should sit on the right (pptxgenjs handles this with `rtlMode`).

Example text option block:

```js
const rtl = content.dir === "rtl";
slide.addText(title, {
  x: 0.5, y: 0.4, w: 9, h: 1, fontFace: theme.headerFont,
  fontSize: 40, bold: true, color: theme.text,
  align: rtl ? "right" : "left", rtlMode: rtl, margin: 0,
});
```

## QA

Hand off to the `anthropic-skills:pptx` QA section:

```bash
python scripts/office/soffice.py --headless --convert-to pdf output/<name>.pptx
rm -f slide-*.jpg && pdftoppm -jpeg -r 150 output/<name>.pdf slide
ls -1 "$PWD"/slide-*.jpg
```

Run the visual-QA **subagent** on the images. Also run `extract-text output/<name>.pptx`
and the placeholder grep. For Hebrew decks, confirm right-alignment and RTL order.
Fix real issues once, then stop.
