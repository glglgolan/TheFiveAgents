# Production — MELT (chocolate)

מצב: image_route=`midjourney` · typography_mode=`hybrid` · משך 15s · 9:16

## 1. עוגן מוצר (יובל)

```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "Clean premium studio packshot, vertical 9:16, of a thick dark chocolate bar half-wrapped in matte cocoa-brown paper with a gold foil inner wrapper and an embossed 'MELT' label. Brand name 'MELT' clearly printed. Centered on a cream seamless background, soft daylight, realistic materials, no other objects. Hyperrealistic: real-world materials, physically correct light, reflections, refraction and shadows; every surreal element obeys real physics and looks photographed, not rendered." "bambi/cast/surreal-ads/chocolate-product.png"
```

## 2. Keyframes K0→K3 (יובל — או ידני ב-Midjourney: `midjourney_prompts.md`)

**K0 — plain website**
```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "Vertical 9:16 hyperrealistic commercial product photograph, indistinguishable from a real high-end camera capture. A silver MacBook Pro standing open on a warm natural oak table, a soft linen cloth and a ceramic cup at the edge of frame, a sunlit cream plaster wall behind. On the laptop screen: an artisan chocolatier website in cocoa brown and gold: the serif logo 'MELT' at the top, a large photo of the broken chocolate bar, and the giant editorial headline 'MELT'. Everything is completely normal and calm — nothing has emerged yet. The laptop fills the central two thirds of the frame, slightly angled toward camera. Hyperrealistic: real-world materials, physically correct light, reflections, refraction and shadows; every surreal element obeys real physics and looks photographed, not rendered. Palette: cream, warm beige, natural oak, soft off-white + brand accent cocoa brown and gold foil. Lighting: motivated natural window daylight from camera-left with physically accurate global illumination, soft contact shadows, real bounce light and specular highlights. Look: shot on ARRI Alexa 35 with a Cooke S7/i 50mm and a Laowa probe macro for close-ups, true optical depth of field and lens breathing, micro-detail (surface pores, fibres, dust motes, fine scratches), accurate refraction and caustics in glass and liquid, subsurface scattering, real-world scale, natural film grain, ungraded-to-premium color." "bambi/outputs/surreal-ads/2026-10-09-chocolate/keyframes/k0.png" --reference "bambi/cast/surreal-ads/chocolate-product.png"
```

**K1 — product half-out**
```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "Vertical 9:16 hyperrealistic commercial product photograph, indistinguishable from a real high-end camera capture, the exact same laptop, table, wall and light as the reference scene. The MELT dark chocolate bar is physically emerging from the laptop screen: the chocolate bar breaks out through the screen with a crisp snap, the screen glass cracking like a chocolate shell as the bar lands on the oak table. About half of the product is already out in the real room, casting a real contact shadow on the oak table; the rest is still inside the website. The giant editorial serif letters spelling exactly "MELT" (M-E-L-T) are starting to lift off the web page, about to become physical. Hyperrealistic: real-world materials, physically correct light, reflections, refraction and shadows; every surreal element obeys real physics and looks photographed, not rendered. Palette: cream, warm beige, natural oak, soft off-white + brand accent cocoa brown and gold foil. Lighting: motivated natural window daylight from camera-left with physically accurate global illumination, soft contact shadows, real bounce light and specular highlights. Look: shot on ARRI Alexa 35 with a Cooke S7/i 50mm and a Laowa probe macro for close-ups, true optical depth of field and lens breathing, micro-detail (surface pores, fibres, dust motes, fine scratches), accurate refraction and caustics in glass and liquid, subsurface scattering, real-world scale, natural film grain, ungraded-to-premium color." "bambi/outputs/surreal-ads/2026-10-09-chocolate/keyframes/k1.png" --reference "bambi/cast/surreal-ads/chocolate-product.png" --reference "bambi/outputs/surreal-ads/2026-10-09-chocolate/keyframes/k0.png"
```

**K2 — transformation peak**
```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "Vertical 9:16 hyperrealistic commercial product photograph, indistinguishable from a real high-end camera capture, a surreal moment captured for real — same oak table and cream wall, the camera now closer and slightly orbited. The peak of a magical transformation: the bar melts into a silky river of liquid chocolate that flows through and around the glossy letters, cocoa pods and nibs bloom out of the stream like flowers. Huge physical 3D letters spelling exactly "MELT" (M-E-L-T), made of glossy tempered dark chocolate with a mirror-like surface, stand on the table around the product — some behind it, one partially in front of it, partially occluding it. Every letter correctly spelled. Cocoa nibs, cocoa powder dust, glossy chocolate droplets frozen mid-motion as if shot at 1/8000s, with a hint of motion blur on the fastest elements. The laptop is still softly visible behind, its screen blending into the room. The product is exactly as in the reference — a thick dark chocolate bar half-wrapped in matte cocoa-brown paper with a gold foil inner wrapper and an embossed 'MELT' label — accurate proportions, 'MELT' branding readable. Hyperrealistic: real-world materials, physically correct light, reflections, refraction and shadows; every surreal element obeys real physics and looks photographed, not rendered. Palette: cream, warm beige, natural oak, soft off-white + brand accent cocoa brown and gold foil. Lighting: motivated natural window daylight from camera-left with physically accurate global illumination, soft contact shadows, real bounce light and specular highlights. Look: shot on ARRI Alexa 35 with a Cooke S7/i 50mm and a Laowa probe macro for close-ups, true optical depth of field and lens breathing, micro-detail (surface pores, fibres, dust motes, fine scratches), accurate refraction and caustics in glass and liquid, subsurface scattering, real-world scale, natural film grain, ungraded-to-premium color." "bambi/outputs/surreal-ads/2026-10-09-chocolate/keyframes/k2.png" --reference "bambi/cast/surreal-ads/chocolate-product.png" --reference "bambi/outputs/surreal-ads/2026-10-09-chocolate/keyframes/k1.png"
```

**K2b — brand macro**
```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "Vertical 9:16 hyperrealistic commercial product photograph, indistinguishable from a real high-end camera capture, an extreme macro close-up: a bitten thick dark chocolate bar with large embossed gold letters 'MELT' on its surface, a glossy melted center where it was bitten, a dusting of cocoa powder, resting on dark wood. Calm and still after the rush, true optical shallow depth of field. The product is exactly as in the reference — a thick dark chocolate bar half-wrapped in matte cocoa-brown paper with a gold foil inner wrapper and an embossed 'MELT' label — accurate proportions, 'MELT' branding readable. Hyperrealistic: real-world materials, physically correct light, reflections, refraction and shadows; every surreal element obeys real physics and looks photographed, not rendered. Palette: cream, warm beige, natural oak, soft off-white + brand accent cocoa brown and gold foil. Lighting: motivated natural window daylight from camera-left with physically accurate global illumination, soft contact shadows, real bounce light and specular highlights. Look: shot on ARRI Alexa 35 with a Cooke S7/i 50mm and a Laowa probe macro for close-ups, true optical depth of field and lens breathing, micro-detail (surface pores, fibres, dust motes, fine scratches), accurate refraction and caustics in glass and liquid, subsurface scattering, real-world scale, natural film grain, ungraded-to-premium color." "bambi/outputs/surreal-ads/2026-10-09-chocolate/keyframes/k2b.png" --reference "bambi/cast/surreal-ads/chocolate-product.png" --reference "bambi/outputs/surreal-ads/2026-10-09-chocolate/keyframes/k2.png"
```

**K3 — hero**
```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "Vertical 9:16 hyperrealistic commercial product photograph, indistinguishable from a real high-end camera capture, a premium hero packshot, perfectly composed and symmetrical: the broken chocolate bar on its gold-foil wrapper with a single glossy drip of melted chocolate, a split cocoa pod beside it, warm soft light. Keep the upper third of the frame as calm clean negative space (the tagline is added later as animated typography); no text in the image apart from the product's own label. The framing echoes the opening shot — the laptop softly out of focus behind, the same oak table and cream wall. The product is exactly as in the reference — a thick dark chocolate bar half-wrapped in matte cocoa-brown paper with a gold foil inner wrapper and an embossed 'MELT' label — accurate proportions, 'MELT' branding readable. Hyperrealistic: real-world materials, physically correct light, reflections, refraction and shadows; every surreal element obeys real physics and looks photographed, not rendered. Palette: cream, warm beige, natural oak, soft off-white + brand accent cocoa brown and gold foil. Lighting: motivated natural window daylight from camera-left with physically accurate global illumination, soft contact shadows, real bounce light and specular highlights. Look: shot on ARRI Alexa 35 with a Cooke S7/i 50mm and a Laowa probe macro for close-ups, true optical depth of field and lens breathing, micro-detail (surface pores, fibres, dust motes, fine scratches), accurate refraction and caustics in glass and liquid, subsurface scattering, real-world scale, natural film grain, ungraded-to-premium color." "bambi/outputs/surreal-ads/2026-10-09-chocolate/keyframes/k3.png" --reference "bambi/cast/surreal-ads/chocolate-product.png" --reference "bambi/outputs/surreal-ads/2026-10-09-chocolate/keyframes/k2b.png"
```

## 3. וידאו — 3 קליפים, פריים ראשון + אחרון (the-video-man)

מודלים עם `last_frame` ב-OpenRouter: `kwaivgi/kling-v3.0-pro` (מומלץ), `bytedance/seedance-2.0`, `minimax/hailuo-3` (מינימום 5s). מסלול חלופי: Kling MCP `image_to_video` עם tail image.

**S01 Digital → Physical · דיגיטלי → פיזי** (4s)
```bash
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh "Vertical 9:16, one continuous shot. Hyperrealistic live-action look, real physics, real optics. The website on the laptop looks completely normal, then within the first second the MELT dark chocolate bar begins to physically push out through the screen glass — the chocolate bar breaks out through the screen with a crisp snap, the screen glass cracking like a chocolate shell as the bar lands on the oak table. Slow handheld push-in, real reflections and shadows on the oak table. The giant letters "MELT" start to lift off the web page. Calm, premium, magical. No cuts, no random objects, no distorted product, no floating text overlays." "bambi/outputs/surreal-ads/2026-10-09-chocolate/videos/s01.mp4" --model kwaivgi/kling-v3.0-pro --duration 4 --aspect-ratio 9:16 --reference "bambi/outputs/surreal-ads/2026-10-09-chocolate/keyframes/k0.png" --end-frame "bambi/outputs/surreal-ads/2026-10-09-chocolate/keyframes/k1.png"
```

**S02 Transformation · טרנספורמציה** (4s)
```bash
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh "Continuous shot, the camera orbits and pushes closer with accelerating speed. Hyperrealistic live-action look, real physics, real optics. The bar melts into a silky river of liquid chocolate that flows through and around the glossy letters, cocoa pods and nibs bloom out of the stream like flowers. The huge letters "MELT" are solid glossy tempered dark chocolate with a mirror-like surface, some behind the MELT dark chocolate bar, some in front of it. Cocoa nibs, cocoa powder dust, glossy chocolate droplets move with real gravity and depth; motion builds to a euphoric peak. Product shape and branding stay accurate. No cuts, no random objects, no distorted product, no floating text overlays." "bambi/outputs/surreal-ads/2026-10-09-chocolate/videos/s02.mp4" --model kwaivgi/kling-v3.0-pro --duration 4 --aspect-ratio 9:16 --reference "bambi/outputs/surreal-ads/2026-10-09-chocolate/keyframes/k1.png" --end-frame "bambi/outputs/surreal-ads/2026-10-09-chocolate/keyframes/k2.png"
```

**S03 Macro beat · מאקרו מותג** (3s)
```bash
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh "Continuous shot. Hyperrealistic live-action look, real physics, real optics. The rush suddenly snaps into stillness: the camera dives into an extreme macro of the MELT dark chocolate bar — a bitten thick dark chocolate bar with large embossed gold letters 'MELT' on its surface, a glossy melted center where it was bitten, a dusting of cocoa powder, resting on dark wood. Shallow depth of field, a slow gentle drift, a few particles settling. Premium, sensual, calm. No cuts, no random objects, no distorted product, no floating text overlays." "bambi/outputs/surreal-ads/2026-10-09-chocolate/videos/s03.mp4" --model kwaivgi/kling-v3.0-pro --duration 3 --aspect-ratio 9:16 --reference "bambi/outputs/surreal-ads/2026-10-09-chocolate/keyframes/k2.png" --end-frame "bambi/outputs/surreal-ads/2026-10-09-chocolate/keyframes/k2b.png"
```

**S04 Hero · שוט הירו** (4s)
```bash
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh "Continuous shot. Hyperrealistic live-action look, real physics, real optics. The motion suddenly turns elegant and slow, everything settles with soft inertia, the camera decelerates and locks into a perfectly symmetrical frame: the broken chocolate bar on its gold-foil wrapper with a single glossy drip of melted chocolate, a split cocoa pod beside it, warm soft light. Keep the upper third calm and clean. Soft daylight, a last drift of cocoa nibs. Premium, still, iconic. No cuts, no random objects, no distorted product, no floating text overlays." "bambi/outputs/surreal-ads/2026-10-09-chocolate/videos/s04.mp4" --model kwaivgi/kling-v3.0-pro --duration 4 --aspect-ratio 9:16 --reference "bambi/outputs/surreal-ads/2026-10-09-chocolate/keyframes/k2b.png" --end-frame "bambi/outputs/surreal-ads/2026-10-09-chocolate/keyframes/k3.png"
```

## 4. הרכבה (video-editor) — hard cuts, הפריימים כבר תואמים

```bash
# concat s01→s03 ללא xfade → bambi/outputs/surreal-ads/2026-10-09-chocolate/final.mp4 (דורש ffmpeg — או ה-ffmpeg של kinetic-typography venv)
bash .claude/skills/kinetic-typography/scripts/concat.sh "bambi/outputs/surreal-ads/2026-10-09-chocolate/final.mp4" "bambi/outputs/surreal-ads/2026-10-09-chocolate/videos/s01.mp4" "bambi/outputs/surreal-ads/2026-10-09-chocolate/videos/s02.mp4" "bambi/outputs/surreal-ads/2026-10-09-chocolate/videos/s03.mp4" "bambi/outputs/surreal-ads/2026-10-09-chocolate/videos/s04.mp4"
```

## 5. שכבת טיפוגרפיה (kinetic-typography)

```bash
bash .claude/skills/kinetic-typography/scripts/extract_matte.sh "bambi/outputs/surreal-ads/2026-10-09-chocolate/final.mp4" "bambi/outputs/surreal-ads/2026-10-09-chocolate/matte/fg"
bash .claude/skills/kinetic-typography/scripts/studio.sh "bambi/outputs/surreal-ads/2026-10-09-chocolate"   # תצוגה מקדימה + כיוונון
bash .claude/skills/kinetic-typography/scripts/render.sh "bambi/outputs/surreal-ads/2026-10-09-chocolate"   # → final_typo.mp4
```

## One-shot (השוואה זולה)
```bash
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh "$(cat bambi/outputs/surreal-ads/2026-10-09-chocolate/master_prompt.txt)" "bambi/outputs/surreal-ads/2026-10-09-chocolate/videos/oneshot.mp4" --model kwaivgi/kling-v3.0-pro --duration 15 --aspect-ratio 9:16 --reference "bambi/outputs/surreal-ads/2026-10-09-chocolate/keyframes/k0.png"
```
