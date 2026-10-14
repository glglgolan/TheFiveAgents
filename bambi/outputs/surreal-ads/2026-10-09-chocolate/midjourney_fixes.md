# Midjourney — fixes for MELT (chocolate)

The originals are backed up in `keyframes/_v1/`. Each fix uses **Vary (Region)** / Editor: mark **only** the area with the text, paste the prompt, and keep everything else in the image as it is. Save over the same file name and press ↻ in the widget.

Tip: Midjourney spells short words well when they appear in **quotes** and the prompt is short. Generate 4 variations and pick the one with correct spelling. If it still breaks after 2–3 tries, tell me and I'll fix only the text with a GPT edit.

---

## K0 — the screen (`keyframes/k0.png`)

**Mark:** only the laptop screen (not the frame, keyboard or table).

```
laptop screen showing a minimal artisan chocolate website, elegant gold serif logo "MELT" at the top, large photo of a broken dark chocolate bar, big editorial headline "MELT", cocoa brown and gold design, hyperrealistic screen photo --ar 9:16 --v 7 --style raw --s 50
```

Check: the logo **and** the headline both read exactly `MELT` (not "MIELT", not "MELT 1").

---

## K2 — the giant letters (`keyframes/k2.png`)

**Mark:** only the block of letters (including the drips on them). Leave the cocoa pods, the flowing chocolate and the background as they are.

```
giant 3D letters "MELT" made of glossy tempered dark chocolate with gold-dusted faces, the four letters M E L T clearly readable left to right, thick melted chocolate dripping over their tops, hyperrealistic macro photography --ar 9:16 --v 7 --style raw --s 50
```

Check: exactly 4 letters, M-E-L-T in order, and the L isn't hidden by a drip.

---

## K3 — optional: the bar back into the hero (`keyframes/k3.png`)

The storyboard specified "the broken bar on gold foil", but the image shows only foil and a cocoa pod. If you want the bar back: **mark** the gold block and its surroundings.

```
a thick broken dark chocolate bar resting on crumpled gold foil, embossed "MELT" on the chocolate, a single glossy drip of melted chocolate, split cocoa pod beside it, hyperrealistic product photography, warm soft light --ar 9:16 --v 7 --style raw --s 50
```

The empty top third is intentional: "MADE TO MELT" gets added there as animated typography.
