---
name: scroll-relay
description: Make a "scrollytelling website on a laptop" product reel — one locked real laptop shot while the website inside the screen scrolls DOWN through micro-chapters, each an AI product clip scrubbed by the scroll; matter relays between chapters (beans → grinder → grounds → dripper → cup), the product opens into an exploded view, giant editorial words sit behind/between the parts, a new reveal every ~0.5s, ending on shop cards. Also the source of the RELAY + REVEAL-CADENCE + EXPLODED-VIEW rules for any ad (Bambi applies them to the break-out series too). Use for "scroll website reel", "AI website", "exploded view", "machine opening into parts", "continuity downward", "relay", "like the enkywebstudio reel", המשכיות כלפי מטה, אתר שגולל, פירוק המכונה לחלקים.
---

# scroll-relay — continuity by matter and gravity

Decoded from the reference reel: `reference/DECODE-enky-coffee.md`. **Read it first.**
Engine: `ScrollStory` (a Remotion composition inside `kinetic-typography/templates/remotion`, so no new install), plus `screen_insert.py`, which pins the site into a real laptop shot. Tested end-to-end on 2026-10-10 with MELT assets: screen render ≈14s and insert ≈37s for 6s.

## The grammar (also for every other ad)

| Rule | In practice |
|---|---|
| **Relay of matter** | Every chapter's output object is the next chapter's input object. Write the chain first: `A →(falls)→ B →(pours)→ C …`. No cuts; the transition is the object crossing the section border. |
| **One direction** | Gravity down, scroll down. Matter falls, liquid drips, parts drop. Never reverse direction mid-film. |
| **Reveal cadence** | Something new every **0.3–0.7s** (a part, a word, a prop, a card). Bambi lists the reveals per second in the storyboard; any gap > 0.8s needs a fix. |
| **Exploded view** | One beat per film where the hero product opens along its axis into floating parts (shows the inside). The opened product *emits* the next chapter's matter. |
| **Type interleave** | Giant editorial words are layout objects behind or between the parts (`plane: back/front`), one word per chapter: GRIND / POUR / SIP. |
| **Locked real frame** | A static (code push-in ≤4%), warm, sunlit laptop shot. Realism from the room, creativity from the screen. |
| **Payoff** | End on usable shop UI: cards, price, CTA. |

## Pipeline

```
chain.md (relay + reveals/sec)  →  chapter keyframes (Yuval)  →  chapter clips (Kling first+tail)
  →  frames / cut-outs  →  scroll_story.json  →  render_screen.sh  →  screen_insert.py  →  sound (cinematic-finish §B)
```

1. **Chain** (Bambi): 5–7 chapters over 10–15s. For each chapter define: the word, the input object, the action, the output object, the reveals with timestamps, and the scroll window. Template: `templates/chain.template.md`.
2. **Keyframes** (Yuval, gpt route; or Nano Banana 2 via Kling when there's no text):
   - **Flat page-colour background.** Every object is generated isolated on the site's exact background colour (e.g. cream `#EFE6DA`) with soft studio light. Then a clip can sit on the page *without* a matte, and rembg cut-outs come out clean. Packshots on similar-toned backgrounds get holes (seen in the test).
   - **Relay frames:** the tail frame of chapter N shows the output object leaving the bottom edge. The head frame of chapter N+1 shows the same object entering from the top.
   - **Exploded view:** K_assembled → K_exploded via a gpt edit. Prompt: "exploded-view of the SAME <product>: parts separated vertically along its central axis with even gaps, floating, same lighting and background, technical product photography".
3. **Clips:** Kling MCP v3.0 `image_to_video` with `first_image` + `tail_image`, 3–5s each, `enable_audio=false`. Prompt the motion only: "the parts separate smoothly along the vertical axis", "grounds stream falls straight down".
4. **Frames:**
   - Opaque clip on page colour: `bash scripts/frames.sh <clip> <run>/media/<id>`.
   - Cut-out for words behind it: `bash .claude/skills/kinetic-typography/scripts/extract_matte.sh <clip> <run>/media/<id>`.
5. **`scroll_story.json`**: copy `templates/scroll_story.example.json`.
   - Screen 1600×1040 (16:10.4 MacBook).
   - **`sections`:** each has `height`, `bg`, `words[]` and `media[]`.
     - `media[].map`: `[[t, frame], …]` scrubs the clip against time, Apple-style.
     - `media[].y/h` may exceed the section, so the stream **spills into the next section**. That spill is the relay.
     - `words[]`: `plane` back/front; `enter` takes stagger, dy, blur and ease; `parallax` 0.1–0.3.
   - **`cards[]`:** the shop payoff.
   - **`scroll`:** keys `[{t, y, ease}]`. Hold while a chapter performs, then glide (0.6–0.9s, `inOut`) to the next. In the reference the page is almost always moving a little.
   - **`nav`:** a sticky site header, which sells "this is a website".
6. **Render the screen:** `bash scripts/render_screen.sh <run> --still 30` for QA, then without `--still` to get `<run>/screen.mp4`.
7. **Laptop plate:**
   - Generate ONE still: "a silver MacBook Pro open on a warm oak table, sunlit cream plaster wall, soft window light, shallow depth of field, the laptop screen is a flat PURE GREEN #00FF00 surface, 9:16". gpt-image-2 or Nano Banana 2.
   - Optional: a Kling clip of the same plate with drifting window shadows, for living light.
   - Then run `python3 scripts/screen_insert.py plate.png <run>/screen.mp4 <run>/final.mp4 --auto-green`. Use `--stills 10,60` for QA. Defaults: `--push 0.035 --drift 0,-10 --reflect 0.06`.
   - Without green, pass `--corners "x,y x,y x,y x,y"` (TL TR BR BL).
8. **Sound:** `cinematic-finish` §B. In this format the cues follow the *relay*: beans pouring, then the grinder burr, then the metal parts clinking apart, then the grounds hiss, then the water pour, then the drip, then a soft UI click when the cards land. Air is quiet here because the camera is locked; the matter sounds lead.

## Applying the grammar to the break-out series (MELT format)
Bambi adds to every brief:
- the relay chain between the stages, so the output of S1 is the input of S2;
- one exploded-view beat of the product (bar → wrapper, foil and squares separating);
- a reveal-per-second list.

See `storyboard-director/series/surreal-product-ad/SERIES.md` § Relay.

## Files
- `scripts/frames.sh`: clip → numbered frames (+ meta.json)
- `scripts/render_screen.sh` (+ `_story_props.py`): ScrollStory → screen.mp4 or a QA still
- `scripts/screen_insert.py`: green-screen or corner pin into the laptop shot, realism pass, code push-in → 1080×1920
- `templates/scroll_story.example.json`: the tested example (3 sections, cut-out + words behind, scrubbed clip, cards)
- `templates/chain.template.md`: the relay chain and reveal-cadence sheet Bambi fills
- `reference/DECODE-enky-coffee.md`: second-by-second decode of the reference reel
- Composition source: `.claude/skills/kinetic-typography/templates/remotion/src/ScrollStory.tsx`
