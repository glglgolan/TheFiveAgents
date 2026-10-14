# Orchestration playbook

This is how a session that has already scaffolded a project (`scripts/scaffold.sh`) and filled in
`bible/style.json` + `src/data/timeline.json` + `bible/BRIEF.md` runs the actual production. It is
written from a real run (a 60s, 6-shot, 5-character film, 14 agents, ~2.6M subagent tokens, two
Claude usage-limit resets). Follow the cost levers below — they are not optional polish, they are
the difference between a project that costs tens of thousands of tokens and one that costs millions.

## Model tiers — the single biggest cost lever

Pass `model` explicitly on every `Agent` call. Do not let subagents inherit the orchestrator's model
by omission — that was the main cost driver in the reference run.

| Role | Model | Why |
|---|---|---|
| Orchestrator (you) | whatever the user is running | Makes the creative/architecture calls, writes the brief, consolidates API notes, mixes audio, renders. |
| Screenwriter / art director / QA director (if split into their own agents) | `opus` | Judgment calls that cascade into every other agent's work; there are only 1–2 of these. |
| Character riggers, set painters, shot animators | `sonnet` | Fully spec'd by `BRIEF.md` + the timeline contract — execution, not open-ended judgment. This is most of the agent count. |
| Voice/lip-sync, composer, sound designer | `sonnet` | Same — mechanical synthesis work against a documented spec. |
| A narrowly-scoped helper with no creative judgment at all (e.g. "just tune these DSP parameters against a numeric target") | `haiku` | Only worth splitting out as its own agent for large projects; usually not worth the extra orchestration overhead for a short film. |

## Phase 1 — parallel asset agents (all independent, spawn together)

One `Agent` call per character, one per set, one for voice+lipsync, one for music, one for SFX — all
in the **same** tool-call block so they run concurrently. Each agent's prompt must:
1. Tell it to read `bible/BRIEF.md` fully, then `bible/style.json`, then `src/data/timeline.json`,
   then the relevant `src/lib/*` files.
2. Name exactly which files it owns (never let two agents own the same file).
3. Give it the full creative spec for its asset (design, poses/expressions needed, what props the
   shots will need to drive — see the character/set contracts in `BRIEF.md`).
4. Cap iteration: for a first pass, "iterate at least 2, at most 3 rounds" is enough — more than
   that is diminishing returns per token spent. Say this explicitly; agents left unbounded will
   over-polish.
5. End with: "Final report: bullet list only, per BRIEF.md." — cuts tens of thousands of output
   tokens across a full roster.

If a `usage limit` notification interrupts an agent mid-task, its files are safe on disk. Resume it
with `SendMessage` (not a fresh `Agent` call) and tell it explicitly to be economical on the
remaining rounds — do not let it restart from scratch.

## Phase 2 — consolidate (orchestrator does this itself, not an agent)

Read every Phase 1 final report and write **one** `bible/API_NOTES.md` — a terse per-asset summary
(props, POSE_KEYS, key helpers, staging recommendations, known issues). Shot animators read this one
file instead of every full report; it is the difference between each shot animator's context costing
a few thousand tokens vs. tens of thousands.

## Phase 3 — shot animators

Group shots 2 (occasionally 3) per agent, not 1:1 — fewer agents means less duplicated brief-reading
overhead and fewer final reports to consolidate. Each shot animator reads `BRIEF.md` + `API_NOTES.md`
+ the relevant slice of `timeline.json` + `dialogue_timing.json`, then owns `src/shots/S<n>.tsx` for
its shots. Same iteration cap and terse-report rule as Phase 1.

Shot animators run **after** Phase 1 finishes (they need the real character/set APIs, not stubs) —
don't parallelize across phases. Within Phase 3 the animators are independent of each other and do
run in parallel.

## Phase 4 — audio mix (orchestrator runs this directly, no agent)

`python audio/mix.py` ducks music+SFX under dialogue and masters to −14 LUFS. This is a fixed script
in the template — don't have an agent rewrite it per project.

## Phase 5 — render

`scripts/render.sh <project_dir>` — bundles once, renders with `--gl=swiftshader --concurrency=6`.
**Do not re-benchmark render engines per project** — `swiftshader` measured ~7x faster than `swangle`
for pixel-identical CPU-only output on this pipeline; that finding is already baked into the script.
If you're tempted to compare render backends again, don't — read this line instead.

Before a full render, check for and kill any stray `remotion render` / `chrome-headless-shell`
processes left running by an agent's own QA renders (`ps aux | grep -E "remotion|chrome-headless"`)
— they silently eat cores and can make the "real" render look falsely slow.

## Phase 6 — subtitles (optional)

Copy `src/Subtitles.tsx` from the template (already done by scaffold), fill `src/data/subtitles.json`
(`{lineId: "translated text"}`) keyed to `dialogue_timing.json`, wire `<Subtitles frame={frame}/>`
into `Film.tsx`, re-render. Skip lines that are redundant with an on-screen title card.

## What this actually costs

A first full run of this pipeline (novel story, 5 characters, 2 sets, 6 shots, ~60s) ran about
2.6M subagent tokens across 14 agents, plus orchestrator overhead, on Opus throughout — because the
model-tier lever above hadn't been identified yet. Applying it (Sonnet for riggers/painters/
animators/audio, terse reports, capped iterations, no rediscovery of the scaffold or render engine)
should cut a comparable second run by roughly half to two-thirds. Tell the user this order-of-
magnitude estimate before starting a request like this, not after.
