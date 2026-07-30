# SPA Builder — framework path (Vite + React + TypeScript)

Produces a real **Vite + React + TS** project under `output/<name>/` with a dev server.
Use when the app needs routing, shared state, reusable components, an API integration, or
room to grow — anything beyond a single screen.

## Scaffold

```bash
cd output
npm create vite@latest <name> -- --template react-ts
cd <name>
npm install
```

Then add only what the app needs:
- **Routing** (multiple views) → `npm install react-router-dom`.
- **HTTP** → native `fetch` first; add a client only if there's a clear reason.
- Avoid heavyweight state libraries unless the app truly needs them — React state +
  context covers most cases.

## Build rules

1. **Component breakdown** from workflow step 6: one component per clear UI unit, colocated
   in `src/components/`. Keep components small and presentational where possible.
2. **One source of truth** for state; lift shared state up or use a context. No duplicated
   state across components.
3. **Theming via CSS custom properties** (a `:root` palette in `src/index.css`), honoring
   the style/branding decision. Components reference the vars, not hardcoded colors.
4. **TypeScript**: type the props and the data shapes; no `any` for core models.
5. **Accessibility + responsive**: semantic elements, labels, focus states, fluid layout.
6. **RTL** for Hebrew: set `dir="rtl"` + `lang="he"` on `<html>` (in `index.html`), use an
   RTL-capable font, and verify mirrored layout.
7. **Data**: seed/mock data in a typed module unless the prompt says to fetch; handle
   loading + error states for any fetch.

## Run for QA

```bash
npm run dev   # Vite prints a localhost URL (default http://localhost:5173)
```

Run it in the background, then QA against the printed URL (see `workflow.md` step 8).
Prefer the **Claude Preview** MCP (`preview_start` via `.claude/launch.json`) for a managed
dev server, or run `npm run dev` in the background and drive it with the **Playwright** MCP.

> Note: `npm run dev` is a long-running process — start it backgrounded and poll the URL,
> don't block on it. Kill it when QA is done.

## QA checklist

Per `workflow.md` step 8 against the dev URL: zero console errors, fullPage screenshot,
exercise routing + key interactions (navigate between views, submit forms, toggle state)
and re-screenshot. Confirm RTL for Hebrew.

## Hand back

`output/<name>/` — run `npm install && npm run dev` and open the printed URL. One-line
summary of the views/features and how to navigate them.
