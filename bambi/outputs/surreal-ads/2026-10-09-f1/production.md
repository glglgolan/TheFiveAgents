# Production — Velocità (f1)

מצב: image_route=`gpt` · typography_mode=`hybrid` · משך 15s · 9:16

## 1. עוגן מוצר (יובל)

```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "Clean premium studio packshot, vertical 9:16, of a highly detailed 1:8 scale model of a modern Formula 1 car in gloss racing red with white accents, carbon-fibre aero parts, slick tyres and 'VELOCITÀ' livery on the sidepods. Brand name 'Velocità' clearly printed. Centered on a cream seamless background, soft daylight, realistic materials, no other objects. Hyperrealistic: real-world materials, physically correct light, reflections, refraction and shadows; every surreal element obeys real physics and looks photographed, not rendered." "bambi/cast/surreal-ads/f1-product.png"
```

## 2. Keyframes K0→K3 (יובל — או ידני ב-Midjourney: `midjourney_prompts.md`)

**K0 — plain website**
```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "Vertical 9:16 hyperrealistic commercial product photograph, indistinguishable from a real high-end camera capture. A silver MacBook Pro standing open on a warm natural oak table, a soft linen cloth and a ceramic cup at the edge of frame, a sunlit cream plaster wall behind. On the laptop screen: a sleek racing-team website with a bold red hero banner, the serif-italic logo 'VELOCITÀ', a photo of the car, and the giant editorial headline 'FAST'. Everything is completely normal and calm — nothing has emerged yet. The laptop fills the central two thirds of the frame, slightly angled toward camera. Hyperrealistic: real-world materials, physically correct light, reflections, refraction and shadows; every surreal element obeys real physics and looks photographed, not rendered. Palette: cream, warm beige, natural oak, soft off-white + brand accent racing red and carbon black. Lighting: motivated natural window daylight from camera-left with physically accurate global illumination, soft contact shadows, real bounce light and specular highlights. Look: shot on ARRI Alexa 35 with a Cooke S7/i 50mm and a Laowa probe macro for close-ups, true optical depth of field and lens breathing, micro-detail (surface pores, fibres, dust motes, fine scratches), accurate refraction and caustics in glass and liquid, subsurface scattering, real-world scale, natural film grain, ungraded-to-premium color." "bambi/outputs/surreal-ads/2026-10-09-f1/keyframes/k0.png" --reference "bambi/cast/surreal-ads/f1-product.png"
```

**K1 — product half-out**
```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "Vertical 9:16 hyperrealistic commercial product photograph, indistinguishable from a real high-end camera capture, the exact same laptop, table, wall and light as the reference scene. The red VELOCITÀ Formula 1 car is physically emerging from the laptop screen: the nose wing of the car pierces through the screen glass first, then the whole car rolls out of the website onto the oak table, tyre smoke spilling from the screen behind it. About half of the product is already out in the real room, casting a real contact shadow on the oak table; the rest is still inside the website. The giant editorial serif letters spelling exactly "FAST" (F-A-S-T) are starting to lift off the web page, about to become physical. Hyperrealistic: real-world materials, physically correct light, reflections, refraction and shadows; every surreal element obeys real physics and looks photographed, not rendered. Palette: cream, warm beige, natural oak, soft off-white + brand accent racing red and carbon black. Lighting: motivated natural window daylight from camera-left with physically accurate global illumination, soft contact shadows, real bounce light and specular highlights. Look: shot on ARRI Alexa 35 with a Cooke S7/i 50mm and a Laowa probe macro for close-ups, true optical depth of field and lens breathing, micro-detail (surface pores, fibres, dust motes, fine scratches), accurate refraction and caustics in glass and liquid, subsurface scattering, real-world scale, natural film grain, ungraded-to-premium color." "bambi/outputs/surreal-ads/2026-10-09-f1/keyframes/k1.png" --reference "bambi/cast/surreal-ads/f1-product.png" --reference "bambi/outputs/surreal-ads/2026-10-09-f1/keyframes/k0.png"
```

**K2 — transformation peak**
```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "Vertical 9:16 hyperrealistic commercial product photograph, indistinguishable from a real high-end camera capture, a surreal moment captured for real — same oak table and cream wall, the camera now closer and slightly orbited. The peak of a magical transformation: a strip of wet race-track asphalt unrolls across the table under the car, rain spray and tyre smoke swirl into the giant letters, the car accelerates in place with spinning wheels and streaks of motion blur. Huge physical 3D letters spelling exactly "FAST" (F-A-S-T), made of brushed carbon fibre with red-and-white racing kerb stripes along their edges, stand on the table around the product — some behind it, one partially in front of it, partially occluding it. Every letter correctly spelled. Tyre smoke, rain spray droplets, tiny rubber flecks frozen mid-motion as if shot at 1/8000s, with a hint of motion blur on the fastest elements. The laptop is still softly visible behind, its screen blending into the room. The product is exactly as in the reference — a highly detailed 1:8 scale model of a modern Formula 1 car in gloss racing red with white accents, carbon-fibre aero parts, slick tyres and 'VELOCITÀ' livery on the sidepods — accurate proportions, 'Velocità' branding readable. Hyperrealistic: real-world materials, physically correct light, reflections, refraction and shadows; every surreal element obeys real physics and looks photographed, not rendered. Palette: cream, warm beige, natural oak, soft off-white + brand accent racing red and carbon black. Lighting: motivated natural window daylight from camera-left with physically accurate global illumination, soft contact shadows, real bounce light and specular highlights. Look: shot on ARRI Alexa 35 with a Cooke S7/i 50mm and a Laowa probe macro for close-ups, true optical depth of field and lens breathing, micro-detail (surface pores, fibres, dust motes, fine scratches), accurate refraction and caustics in glass and liquid, subsurface scattering, real-world scale, natural film grain, ungraded-to-premium color." "bambi/outputs/surreal-ads/2026-10-09-f1/keyframes/k2.png" --reference "bambi/cast/surreal-ads/f1-product.png" --reference "bambi/outputs/surreal-ads/2026-10-09-f1/keyframes/k1.png"
```

**K3 — hero**
```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "Vertical 9:16 hyperrealistic commercial product photograph, indistinguishable from a real high-end camera capture, a premium hero packshot, perfectly composed and symmetrical: the car frozen perfectly still on a strip of glistening wet asphalt on the oak table, red-and-white kerbs at its sides, sharp reflections underneath. Keep the upper third of the frame as calm clean negative space (the tagline is added later as animated typography); no text in the image apart from the product's own label. The framing echoes the opening shot — the laptop softly out of focus behind, the same oak table and cream wall. The product is exactly as in the reference — a highly detailed 1:8 scale model of a modern Formula 1 car in gloss racing red with white accents, carbon-fibre aero parts, slick tyres and 'VELOCITÀ' livery on the sidepods — accurate proportions, 'Velocità' branding readable. Hyperrealistic: real-world materials, physically correct light, reflections, refraction and shadows; every surreal element obeys real physics and looks photographed, not rendered. Palette: cream, warm beige, natural oak, soft off-white + brand accent racing red and carbon black. Lighting: motivated natural window daylight from camera-left with physically accurate global illumination, soft contact shadows, real bounce light and specular highlights. Look: shot on ARRI Alexa 35 with a Cooke S7/i 50mm and a Laowa probe macro for close-ups, true optical depth of field and lens breathing, micro-detail (surface pores, fibres, dust motes, fine scratches), accurate refraction and caustics in glass and liquid, subsurface scattering, real-world scale, natural film grain, ungraded-to-premium color." "bambi/outputs/surreal-ads/2026-10-09-f1/keyframes/k3.png" --reference "bambi/cast/surreal-ads/f1-product.png" --reference "bambi/outputs/surreal-ads/2026-10-09-f1/keyframes/k2.png"
```

## 3. וידאו — 3 קליפים, פריים ראשון + אחרון (the-video-man)

מודלים עם `last_frame` ב-OpenRouter: `kwaivgi/kling-v3.0-pro` (מומלץ), `bytedance/seedance-2.0`, `minimax/hailuo-3` (מינימום 5s). מסלול חלופי: Kling MCP `image_to_video` עם tail image.

**S01 Digital → Physical · דיגיטלי → פיזי** (4s)
```bash
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh "Vertical 9:16, one continuous shot. Hyperrealistic live-action look, real physics, real optics. The website on the laptop looks completely normal, then within the first second the red VELOCITÀ Formula 1 car begins to physically push out through the screen glass — the nose wing of the car pierces through the screen glass first, then the whole car rolls out of the website onto the oak table, tyre smoke spilling from the screen behind it. Slow handheld push-in, real reflections and shadows on the oak table. The giant letters "FAST" start to lift off the web page. Calm, premium, magical. No cuts, no random objects, no distorted product, no floating text overlays." "bambi/outputs/surreal-ads/2026-10-09-f1/videos/s01.mp4" --model kwaivgi/kling-v3.0-pro --duration 4 --aspect-ratio 9:16 --reference "bambi/outputs/surreal-ads/2026-10-09-f1/keyframes/k0.png" --end-frame "bambi/outputs/surreal-ads/2026-10-09-f1/keyframes/k1.png"
```

**S02 Transformation · טרנספורמציה** (7s)
```bash
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh "Continuous shot, the camera orbits and pushes closer with accelerating speed. Hyperrealistic live-action look, real physics, real optics. A strip of wet race-track asphalt unrolls across the table under the car, rain spray and tyre smoke swirl into the giant letters, the car accelerates in place with spinning wheels and streaks of motion blur. The huge letters "FAST" are solid brushed carbon fibre with red-and-white racing kerb stripes along their edges, some behind the red VELOCITÀ Formula 1 car, some in front of it. Tyre smoke, rain spray droplets, tiny rubber flecks move with real gravity and depth; motion builds to a euphoric peak. Product shape and branding stay accurate. No cuts, no random objects, no distorted product, no floating text overlays." "bambi/outputs/surreal-ads/2026-10-09-f1/videos/s02.mp4" --model kwaivgi/kling-v3.0-pro --duration 7 --aspect-ratio 9:16 --reference "bambi/outputs/surreal-ads/2026-10-09-f1/keyframes/k1.png" --end-frame "bambi/outputs/surreal-ads/2026-10-09-f1/keyframes/k2.png"
```

**S03 Hero · שוט הירו** (4s)
```bash
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh "Continuous shot. Hyperrealistic live-action look, real physics, real optics. The motion suddenly turns elegant and slow, everything settles with soft inertia, the camera decelerates and locks into a perfectly symmetrical frame: the car frozen perfectly still on a strip of glistening wet asphalt on the oak table, red-and-white kerbs at its sides, sharp reflections underneath. Keep the upper third calm and clean. Soft daylight, a last drift of tyre smoke. Premium, still, iconic. No cuts, no random objects, no distorted product, no floating text overlays." "bambi/outputs/surreal-ads/2026-10-09-f1/videos/s03.mp4" --model kwaivgi/kling-v3.0-pro --duration 4 --aspect-ratio 9:16 --reference "bambi/outputs/surreal-ads/2026-10-09-f1/keyframes/k2.png" --end-frame "bambi/outputs/surreal-ads/2026-10-09-f1/keyframes/k3.png"
```

## 4. הרכבה (video-editor) — hard cuts, הפריימים כבר תואמים

```bash
# concat s01→s03 ללא xfade → bambi/outputs/surreal-ads/2026-10-09-f1/final.mp4 (דורש ffmpeg — או ה-ffmpeg של kinetic-typography venv)
bash .claude/skills/kinetic-typography/scripts/concat.sh "bambi/outputs/surreal-ads/2026-10-09-f1/final.mp4" "bambi/outputs/surreal-ads/2026-10-09-f1/videos/s01.mp4" "bambi/outputs/surreal-ads/2026-10-09-f1/videos/s02.mp4" "bambi/outputs/surreal-ads/2026-10-09-f1/videos/s03.mp4"
```

## 5. שכבת טיפוגרפיה (kinetic-typography)

```bash
bash .claude/skills/kinetic-typography/scripts/extract_matte.sh "bambi/outputs/surreal-ads/2026-10-09-f1/final.mp4" "bambi/outputs/surreal-ads/2026-10-09-f1/matte/fg"
bash .claude/skills/kinetic-typography/scripts/studio.sh "bambi/outputs/surreal-ads/2026-10-09-f1"   # תצוגה מקדימה + כיוונון
bash .claude/skills/kinetic-typography/scripts/render.sh "bambi/outputs/surreal-ads/2026-10-09-f1"   # → final_typo.mp4
```

## One-shot (השוואה זולה)
```bash
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh "$(cat bambi/outputs/surreal-ads/2026-10-09-f1/master_prompt.txt)" "bambi/outputs/surreal-ads/2026-10-09-f1/videos/oneshot.mp4" --model kwaivgi/kling-v3.0-pro --duration 15 --aspect-ratio 9:16 --reference "bambi/outputs/surreal-ads/2026-10-09-f1/keyframes/k0.png"
```
