# Production — Maison Rosé (perfume)

מצב: image_route=`gpt` · typography_mode=`hybrid` · משך 15s · 9:16

## 1. עוגן מוצר (יובל)

```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "Clean premium studio packshot, vertical 9:16, of a faceted rectangular glass perfume bottle filled with pale pink liquid, a polished rose-gold cap, and a small embossed 'MAISON ROSÉ' label. Brand name 'Maison Rosé' clearly printed. Centered on a cream seamless background, soft daylight, realistic materials, no other objects. Hyperrealistic: real-world materials, physically correct light, reflections, refraction and shadows; every surreal element obeys real physics and looks photographed, not rendered." "bambi/cast/surreal-ads/perfume-product.png"
```

## 2. Keyframes K0→K3 (יובל — או ידני ב-Midjourney: `midjourney_prompts.md`)

**K0 — plain website**
```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "Vertical 9:16 hyperrealistic commercial product photograph, indistinguishable from a real high-end camera capture. A silver MacBook Pro standing open on a warm natural oak table, a soft linen cloth and a ceramic cup at the edge of frame, a sunlit cream plaster wall behind. On the laptop screen: a minimal luxury perfume website: a blush-pink hero banner, the serif logo 'MAISON ROSÉ', a large drawing of the perfume bottle, and the giant editorial headline 'PINK'. The product on the page is shown as a hand-drawn sketch (fine blush-pink ink line art, elegant fashion-illustration strokes), not a photo. Everything is completely normal and calm — nothing has emerged yet. The laptop fills the central two thirds of the frame, slightly angled toward camera. Hyperrealistic: real-world materials, physically correct light, reflections, refraction and shadows; every surreal element obeys real physics and looks photographed, not rendered. Palette: cream, warm beige, natural oak, soft off-white + brand accent blush pink and rose gold. Lighting: motivated natural window daylight from camera-left with physically accurate global illumination, soft contact shadows, real bounce light and specular highlights. Look: shot on ARRI Alexa 35 with a Cooke S7/i 50mm and a Laowa probe macro for close-ups, true optical depth of field and lens breathing, micro-detail (surface pores, fibres, dust motes, fine scratches), accurate refraction and caustics in glass and liquid, subsurface scattering, real-world scale, natural film grain, ungraded-to-premium color." "bambi/outputs/surreal-ads/2026-10-09-perfume/keyframes/k0.png" --reference "bambi/cast/surreal-ads/perfume-product.png"
```

**K1 — product half-out**
```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "Vertical 9:16 hyperrealistic commercial product photograph, indistinguishable from a real high-end camera capture, the exact same laptop, table, wall and light as the reference scene. The MAISON ROSÉ glass perfume bottle is physically emerging from the laptop screen: the glass bottle slowly pushes out through the screen, the screen surface stretching around it like a membrane of liquid light before releasing it onto the table. About half of the product is already out in the real room, casting a real contact shadow on the oak table; the rest is still inside the website. The hand-drawn sketch lines of the product (fine blush-pink ink line art, elegant fashion-illustration strokes) are visibly peeling off the screen and turning into the real object mid-transition — the part still inside the screen is drawn line art, the part already out is hyperreal. The giant editorial serif letters spelling exactly "PINK" (P-I-N-K) are starting to lift off the web page, about to become physical. Hyperrealistic: real-world materials, physically correct light, reflections, refraction and shadows; every surreal element obeys real physics and looks photographed, not rendered. Palette: cream, warm beige, natural oak, soft off-white + brand accent blush pink and rose gold. Lighting: motivated natural window daylight from camera-left with physically accurate global illumination, soft contact shadows, real bounce light and specular highlights. Look: shot on ARRI Alexa 35 with a Cooke S7/i 50mm and a Laowa probe macro for close-ups, true optical depth of field and lens breathing, micro-detail (surface pores, fibres, dust motes, fine scratches), accurate refraction and caustics in glass and liquid, subsurface scattering, real-world scale, natural film grain, ungraded-to-premium color." "bambi/outputs/surreal-ads/2026-10-09-perfume/keyframes/k1.png" --reference "bambi/cast/surreal-ads/perfume-product.png" --reference "bambi/outputs/surreal-ads/2026-10-09-perfume/keyframes/k0.png"
```

**K2 — transformation peak**
```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "Vertical 9:16 hyperrealistic commercial product photograph, indistinguishable from a real high-end camera capture, a surreal moment captured for real — same oak table and cream wall, the camera now closer and slightly orbited. The peak of a magical transformation: a soft pink perfume mist escapes from the bottle and transforms into blooming peonies and roses that grow through and around the giant letters as the camera moves closer. Huge physical 3D letters spelling exactly "PINK" (P-I-N-K), made of matte blush-pink plaster with softly rounded edges, stand on the table around the product — some behind it, one partially in front of it, partially occluding it. Every letter correctly spelled. Pink perfume mist, drifting rose petals frozen mid-motion as if shot at 1/8000s, with a hint of motion blur on the fastest elements. The laptop is still softly visible behind, its screen blending into the room. The product is exactly as in the reference — a faceted rectangular glass perfume bottle filled with pale pink liquid, a polished rose-gold cap, and a small embossed 'MAISON ROSÉ' label — accurate proportions, 'Maison Rosé' branding readable. Hyperrealistic: real-world materials, physically correct light, reflections, refraction and shadows; every surreal element obeys real physics and looks photographed, not rendered. Palette: cream, warm beige, natural oak, soft off-white + brand accent blush pink and rose gold. Lighting: motivated natural window daylight from camera-left with physically accurate global illumination, soft contact shadows, real bounce light and specular highlights. Look: shot on ARRI Alexa 35 with a Cooke S7/i 50mm and a Laowa probe macro for close-ups, true optical depth of field and lens breathing, micro-detail (surface pores, fibres, dust motes, fine scratches), accurate refraction and caustics in glass and liquid, subsurface scattering, real-world scale, natural film grain, ungraded-to-premium color." "bambi/outputs/surreal-ads/2026-10-09-perfume/keyframes/k2.png" --reference "bambi/cast/surreal-ads/perfume-product.png" --reference "bambi/outputs/surreal-ads/2026-10-09-perfume/keyframes/k1.png"
```

**K3 — hero**
```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "Vertical 9:16 hyperrealistic commercial product photograph, indistinguishable from a real high-end camera capture, a premium hero packshot, perfectly composed and symmetrical: the perfume bottle standing centered on the oak table among a few fresh peonies, a soft pink mist halo behind it, rose-gold cap catching the light. Keep the upper third of the frame as calm clean negative space (the tagline is added later as animated typography); no text in the image apart from the product's own label. The framing echoes the opening shot — the laptop softly out of focus behind, the same oak table and cream wall. The product is exactly as in the reference — a faceted rectangular glass perfume bottle filled with pale pink liquid, a polished rose-gold cap, and a small embossed 'MAISON ROSÉ' label — accurate proportions, 'Maison Rosé' branding readable. Hyperrealistic: real-world materials, physically correct light, reflections, refraction and shadows; every surreal element obeys real physics and looks photographed, not rendered. Palette: cream, warm beige, natural oak, soft off-white + brand accent blush pink and rose gold. Lighting: motivated natural window daylight from camera-left with physically accurate global illumination, soft contact shadows, real bounce light and specular highlights. Look: shot on ARRI Alexa 35 with a Cooke S7/i 50mm and a Laowa probe macro for close-ups, true optical depth of field and lens breathing, micro-detail (surface pores, fibres, dust motes, fine scratches), accurate refraction and caustics in glass and liquid, subsurface scattering, real-world scale, natural film grain, ungraded-to-premium color." "bambi/outputs/surreal-ads/2026-10-09-perfume/keyframes/k3.png" --reference "bambi/cast/surreal-ads/perfume-product.png" --reference "bambi/outputs/surreal-ads/2026-10-09-perfume/keyframes/k2.png"
```

## 3. וידאו — 3 קליפים, פריים ראשון + אחרון (the-video-man)

מודלים עם `last_frame` ב-OpenRouter: `kwaivgi/kling-v3.0-pro` (מומלץ), `bytedance/seedance-2.0`, `minimax/hailuo-3` (מינימום 5s). מסלול חלופי: Kling MCP `image_to_video` עם tail image.

**S01 Digital → Physical · דיגיטלי → פיזי** (4s)
```bash
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh "Vertical 9:16, one continuous shot. Hyperrealistic live-action look, real physics, real optics. The website on the laptop looks completely normal, then within the first second the MAISON ROSÉ glass perfume bottle begins to physically push out through the screen glass — the glass bottle slowly pushes out through the screen, the screen surface stretching around it like a membrane of liquid light before releasing it onto the table. The drawn sketch of the product peels off the screen line by line and solidifies into the hyperreal object. Slow handheld push-in, real reflections and shadows on the oak table. The giant letters "PINK" start to lift off the web page. Calm, premium, magical. No cuts, no random objects, no distorted product, no floating text overlays." "bambi/outputs/surreal-ads/2026-10-09-perfume/videos/s01.mp4" --model kwaivgi/kling-v3.0-pro --duration 4 --aspect-ratio 9:16 --reference "bambi/outputs/surreal-ads/2026-10-09-perfume/keyframes/k0.png" --end-frame "bambi/outputs/surreal-ads/2026-10-09-perfume/keyframes/k1.png"
```

**S02 Transformation · טרנספורמציה** (7s)
```bash
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh "Continuous shot, the camera orbits and pushes closer with accelerating speed. Hyperrealistic live-action look, real physics, real optics. A soft pink perfume mist escapes from the bottle and transforms into blooming peonies and roses that grow through and around the giant letters as the camera moves closer. The huge letters "PINK" are solid matte blush-pink plaster with softly rounded edges, some behind the MAISON ROSÉ glass perfume bottle, some in front of it. Pink perfume mist, drifting rose petals move with real gravity and depth; motion builds to a euphoric peak. Product shape and branding stay accurate. No cuts, no random objects, no distorted product, no floating text overlays." "bambi/outputs/surreal-ads/2026-10-09-perfume/videos/s02.mp4" --model kwaivgi/kling-v3.0-pro --duration 7 --aspect-ratio 9:16 --reference "bambi/outputs/surreal-ads/2026-10-09-perfume/keyframes/k1.png" --end-frame "bambi/outputs/surreal-ads/2026-10-09-perfume/keyframes/k2.png"
```

**S03 Hero · שוט הירו** (4s)
```bash
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh "Continuous shot. Hyperrealistic live-action look, real physics, real optics. The motion suddenly turns elegant and slow, everything settles with soft inertia, the camera decelerates and locks into a perfectly symmetrical frame: the perfume bottle standing centered on the oak table among a few fresh peonies, a soft pink mist halo behind it, rose-gold cap catching the light. Keep the upper third calm and clean. Soft daylight, a last drift of pink perfume mist. Premium, still, iconic. No cuts, no random objects, no distorted product, no floating text overlays." "bambi/outputs/surreal-ads/2026-10-09-perfume/videos/s03.mp4" --model kwaivgi/kling-v3.0-pro --duration 4 --aspect-ratio 9:16 --reference "bambi/outputs/surreal-ads/2026-10-09-perfume/keyframes/k2.png" --end-frame "bambi/outputs/surreal-ads/2026-10-09-perfume/keyframes/k3.png"
```

## 4. הרכבה (video-editor) — hard cuts, הפריימים כבר תואמים

```bash
# concat s01→s03 ללא xfade → bambi/outputs/surreal-ads/2026-10-09-perfume/final.mp4 (דורש ffmpeg — או ה-ffmpeg של kinetic-typography venv)
bash .claude/skills/kinetic-typography/scripts/concat.sh "bambi/outputs/surreal-ads/2026-10-09-perfume/final.mp4" "bambi/outputs/surreal-ads/2026-10-09-perfume/videos/s01.mp4" "bambi/outputs/surreal-ads/2026-10-09-perfume/videos/s02.mp4" "bambi/outputs/surreal-ads/2026-10-09-perfume/videos/s03.mp4"
```

## 5. שכבת טיפוגרפיה (kinetic-typography)

```bash
bash .claude/skills/kinetic-typography/scripts/extract_matte.sh "bambi/outputs/surreal-ads/2026-10-09-perfume/final.mp4" "bambi/outputs/surreal-ads/2026-10-09-perfume/matte/fg"
bash .claude/skills/kinetic-typography/scripts/studio.sh "bambi/outputs/surreal-ads/2026-10-09-perfume"   # תצוגה מקדימה + כיוונון
bash .claude/skills/kinetic-typography/scripts/render.sh "bambi/outputs/surreal-ads/2026-10-09-perfume"   # → final_typo.mp4
```

## One-shot (השוואה זולה)
```bash
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh "$(cat bambi/outputs/surreal-ads/2026-10-09-perfume/master_prompt.txt)" "bambi/outputs/surreal-ads/2026-10-09-perfume/videos/oneshot.mp4" --model kwaivgi/kling-v3.0-pro --duration 15 --aspect-ratio 9:16 --reference "bambi/outputs/surreal-ads/2026-10-09-perfume/keyframes/k0.png"
```
