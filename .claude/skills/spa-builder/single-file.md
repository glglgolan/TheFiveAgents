# SPA Builder — single-file path

Produces **one self-contained `.html` file** — vanilla HTML/CSS/JS, no build step, opens
directly in a browser and works offline. This is the lightweight default, the same shape
as the project's `agents-map.html`.

## When to use

A tool, dashboard, data viz, calculator, landing page, game, or one-screen prototype —
anything that doesn't need routing, a backend, auth, or a component framework to grow.

## Build rules

1. **One file.** All HTML, `<style>`, and `<script>` inline in `output/<name>.html`.
   No `DOCTYPE`-less fragments — write a full valid document.
2. **Offline-first.** Prefer pure vanilla JS. If a library genuinely helps (charts, etc.)
   load it from a CDN (`esm.sh` / `unpkg` / `cdn.jsdelivr.net`) via `<script type="module">`,
   but keep the core UI working if the CDN is blocked — degrade gracefully, never blank out.
3. **Theming via CSS custom properties.** Define a small palette in `:root` (`--bg`,
   `--surface`, `--text`, `--muted`, 1–2 accents) and use it everywhere. Honor the
   style/branding decision from workflow step 4.
4. **One source of truth.** Keep app state in a single JS object and render from it; wire
   events to mutate state then re-render. Don't scatter DOM state.
5. **Semantic + accessible.** Real `<button>`/`<label>`/`<form>`, visible focus states,
   keyboard support for primary actions, `aria-*` where it matters.
6. **Responsive.** A sensible `meta viewport`, fluid layout (grid/flex), no fixed widths
   that overflow small screens.
7. **RTL.** For Hebrew set `<html lang="he" dir="rtl">`, right-align, mirror the layout,
   and use an RTL-capable font.
8. **Data.** Inline sample/seed data in the file unless the prompt says to fetch. If it
   fetches, handle loading + error states.

## Skeleton

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>…</title>
<style>
  :root{ --bg:#0e1117; --surface:#161b22; --text:#e6edf3; --muted:#8b97a7; --accent:#7c9cff; }
  *{box-sizing:border-box} body{margin:0;font-family:system-ui,sans-serif;background:var(--bg);color:var(--text)}
  /* component styles using the vars above */
</style>
</head>
<body>
  <!-- markup -->
  <script>
    const state = { /* single source of truth */ };
    const $ = s => document.querySelector(s);
    function render(){ /* paint from state */ }
    /* event listeners mutate state then call render() */
    render();
  </script>
</body>
</html>
```

## QA

Per `workflow.md` step 8: serve over HTTP (`python3 -m http.server`), then Playwright/Preview
→ zero console errors, fullPage screenshot, exercise the key interactions and re-screenshot.

## Hand back

`output/<name>.html` — "just open it in a browser." Note the local URL you QA'd on and the
main interactions.
