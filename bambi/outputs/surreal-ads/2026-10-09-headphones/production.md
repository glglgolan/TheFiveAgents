# Production — Hush (headphones)

מצב: image_route=`gpt` · typography_mode=`hybrid` · משך 15s · 9:16

## 1. עוגן מוצר (יובל)

```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "Clean premium studio packshot, vertical 9:16, of premium over-ear wireless headphones in matte graphite with brushed aluminium sliders, olive-green fabric ear cushions, and a small engraved 'HUSH' logo. Brand name 'Hush' clearly printed. Centered on a cream seamless background, soft daylight, realistic materials, no other objects. Hyperrealistic: real-world materials, physically correct light, reflections, refraction and shadows; every surreal element obeys real physics and looks photographed, not rendered." "bambi/cast/surreal-ads/headphones-product.png"
```

## 2. Keyframes K0→K3 (יובל — או ידני ב-Midjourney: `midjourney_prompts.md`)

**K0 — plain website**
```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "Vertical 9:16 hyperrealistic commercial product photograph, indistinguishable from a real high-end camera capture. A silver MacBook Pro standing open on a warm natural oak table, a soft linen cloth and a ceramic cup at the edge of frame, a sunlit cream plaster wall behind. On the laptop screen: a minimal audio-brand website in graphite and olive: a product photo of the headphones, the logo 'HUSH', thin sound-wave graphics, and the giant editorial headline 'HEAR'. Everything is completely normal and calm — nothing has emerged yet. The laptop fills the central two thirds of the frame, slightly angled toward camera. Hyperrealistic: real-world materials, physically correct light, reflections, refraction and shadows; every surreal element obeys real physics and looks photographed, not rendered. Palette: cream, warm beige, natural oak, soft off-white + brand accent deep olive and graphite. Lighting: motivated natural window daylight from camera-left with physically accurate global illumination, soft contact shadows, real bounce light and specular highlights. Look: shot on ARRI Alexa 35 with a Cooke S7/i 50mm and a Laowa probe macro for close-ups, true optical depth of field and lens breathing, micro-detail (surface pores, fibres, dust motes, fine scratches), accurate refraction and caustics in glass and liquid, subsurface scattering, real-world scale, natural film grain, ungraded-to-premium color." "bambi/outputs/surreal-ads/2026-10-09-headphones/keyframes/k0.png" --reference "bambi/cast/surreal-ads/headphones-product.png"
```

**K1 — product half-out**
```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "Vertical 9:16 hyperrealistic commercial product photograph, indistinguishable from a real high-end camera capture, the exact same laptop, table, wall and light as the reference scene. The graphite HUSH headphones is physically emerging from the laptop screen: the headphones slide out of the screen with the sound-wave graphics peeling off the web page as physical ribbons of olive silk. About half of the product is already out in the real room, casting a real contact shadow on the oak table; the rest is still inside the website. The giant editorial serif letters spelling exactly "HEAR" (H-E-A-R) are starting to lift off the web page, about to become physical. Hyperrealistic: real-world materials, physically correct light, reflections, refraction and shadows; every surreal element obeys real physics and looks photographed, not rendered. Palette: cream, warm beige, natural oak, soft off-white + brand accent deep olive and graphite. Lighting: motivated natural window daylight from camera-left with physically accurate global illumination, soft contact shadows, real bounce light and specular highlights. Look: shot on ARRI Alexa 35 with a Cooke S7/i 50mm and a Laowa probe macro for close-ups, true optical depth of field and lens breathing, micro-detail (surface pores, fibres, dust motes, fine scratches), accurate refraction and caustics in glass and liquid, subsurface scattering, real-world scale, natural film grain, ungraded-to-premium color." "bambi/outputs/surreal-ads/2026-10-09-headphones/keyframes/k1.png" --reference "bambi/cast/surreal-ads/headphones-product.png" --reference "bambi/outputs/surreal-ads/2026-10-09-headphones/keyframes/k0.png"
```

**K2 — transformation peak**
```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "Vertical 9:16 hyperrealistic commercial product photograph, indistinguishable from a real high-end camera capture, a surreal moment captured for real — same oak table and cream wall, the camera now closer and slightly orbited. The peak of a magical transformation: visible sound waves become flowing silk ribbons that wrap around the room and through the letters, the aluminium letters ripple and pulse to the bass, then everything suddenly goes silent and still. Huge physical 3D letters spelling exactly "HEAR" (H-E-A-R), made of brushed aluminium with softly bevelled edges, stand on the table around the product — some behind it, one partially in front of it, partially occluding it. Every letter correctly spelled. Olive silk ribbons, fine dust in light beams frozen mid-motion as if shot at 1/8000s, with a hint of motion blur on the fastest elements. The laptop is still softly visible behind, its screen blending into the room. The product is exactly as in the reference — premium over-ear wireless headphones in matte graphite with brushed aluminium sliders, olive-green fabric ear cushions, and a small engraved 'HUSH' logo — accurate proportions, 'Hush' branding readable. Hyperrealistic: real-world materials, physically correct light, reflections, refraction and shadows; every surreal element obeys real physics and looks photographed, not rendered. Palette: cream, warm beige, natural oak, soft off-white + brand accent deep olive and graphite. Lighting: motivated natural window daylight from camera-left with physically accurate global illumination, soft contact shadows, real bounce light and specular highlights. Look: shot on ARRI Alexa 35 with a Cooke S7/i 50mm and a Laowa probe macro for close-ups, true optical depth of field and lens breathing, micro-detail (surface pores, fibres, dust motes, fine scratches), accurate refraction and caustics in glass and liquid, subsurface scattering, real-world scale, natural film grain, ungraded-to-premium color." "bambi/outputs/surreal-ads/2026-10-09-headphones/keyframes/k2.png" --reference "bambi/cast/surreal-ads/headphones-product.png" --reference "bambi/outputs/surreal-ads/2026-10-09-headphones/keyframes/k1.png"
```

**K3 — hero**
```bash
bash .claude/skills/gpt-image-gen/scripts/generate.sh "Vertical 9:16 hyperrealistic commercial product photograph, indistinguishable from a real high-end camera capture, a premium hero packshot, perfectly composed and symmetrical: the headphones resting on a minimal walnut stand on the oak table, a single olive silk ribbon draped softly beside it, calm still light. Keep the upper third of the frame as calm clean negative space (the tagline is added later as animated typography); no text in the image apart from the product's own label. The framing echoes the opening shot — the laptop softly out of focus behind, the same oak table and cream wall. The product is exactly as in the reference — premium over-ear wireless headphones in matte graphite with brushed aluminium sliders, olive-green fabric ear cushions, and a small engraved 'HUSH' logo — accurate proportions, 'Hush' branding readable. Hyperrealistic: real-world materials, physically correct light, reflections, refraction and shadows; every surreal element obeys real physics and looks photographed, not rendered. Palette: cream, warm beige, natural oak, soft off-white + brand accent deep olive and graphite. Lighting: motivated natural window daylight from camera-left with physically accurate global illumination, soft contact shadows, real bounce light and specular highlights. Look: shot on ARRI Alexa 35 with a Cooke S7/i 50mm and a Laowa probe macro for close-ups, true optical depth of field and lens breathing, micro-detail (surface pores, fibres, dust motes, fine scratches), accurate refraction and caustics in glass and liquid, subsurface scattering, real-world scale, natural film grain, ungraded-to-premium color." "bambi/outputs/surreal-ads/2026-10-09-headphones/keyframes/k3.png" --reference "bambi/cast/surreal-ads/headphones-product.png" --reference "bambi/outputs/surreal-ads/2026-10-09-headphones/keyframes/k2.png"
```

## 3. וידאו — 3 קליפים, פריים ראשון + אחרון (the-video-man)

מודלים עם `last_frame` ב-OpenRouter: `kwaivgi/kling-v3.0-pro` (מומלץ), `bytedance/seedance-2.0`, `minimax/hailuo-3` (מינימום 5s). מסלול חלופי: Kling MCP `image_to_video` עם tail image.

**S01 Digital → Physical · דיגיטלי → פיזי** (4s)
```bash
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh "Vertical 9:16, one continuous shot. Hyperrealistic live-action look, real physics, real optics. The website on the laptop looks completely normal, then within the first second the graphite HUSH headphones begins to physically push out through the screen glass — the headphones slide out of the screen with the sound-wave graphics peeling off the web page as physical ribbons of olive silk. Slow handheld push-in, real reflections and shadows on the oak table. The giant letters "HEAR" start to lift off the web page. Calm, premium, magical. No cuts, no random objects, no distorted product, no floating text overlays." "bambi/outputs/surreal-ads/2026-10-09-headphones/videos/s01.mp4" --model kwaivgi/kling-v3.0-pro --duration 4 --aspect-ratio 9:16 --reference "bambi/outputs/surreal-ads/2026-10-09-headphones/keyframes/k0.png" --end-frame "bambi/outputs/surreal-ads/2026-10-09-headphones/keyframes/k1.png"
```

**S02 Transformation · טרנספורמציה** (7s)
```bash
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh "Continuous shot, the camera orbits and pushes closer with accelerating speed. Hyperrealistic live-action look, real physics, real optics. Visible sound waves become flowing silk ribbons that wrap around the room and through the letters, the aluminium letters ripple and pulse to the bass, then everything suddenly goes silent and still. The huge letters "HEAR" are solid brushed aluminium with softly bevelled edges, some behind the graphite HUSH headphones, some in front of it. Olive silk ribbons, fine dust in light beams move with real gravity and depth; motion builds to a euphoric peak. Product shape and branding stay accurate. No cuts, no random objects, no distorted product, no floating text overlays." "bambi/outputs/surreal-ads/2026-10-09-headphones/videos/s02.mp4" --model kwaivgi/kling-v3.0-pro --duration 7 --aspect-ratio 9:16 --reference "bambi/outputs/surreal-ads/2026-10-09-headphones/keyframes/k1.png" --end-frame "bambi/outputs/surreal-ads/2026-10-09-headphones/keyframes/k2.png"
```

**S03 Hero · שוט הירו** (4s)
```bash
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh "Continuous shot. Hyperrealistic live-action look, real physics, real optics. The motion suddenly turns elegant and slow, everything settles with soft inertia, the camera decelerates and locks into a perfectly symmetrical frame: the headphones resting on a minimal walnut stand on the oak table, a single olive silk ribbon draped softly beside it, calm still light. Keep the upper third calm and clean. Soft daylight, a last drift of olive silk ribbons. Premium, still, iconic. No cuts, no random objects, no distorted product, no floating text overlays." "bambi/outputs/surreal-ads/2026-10-09-headphones/videos/s03.mp4" --model kwaivgi/kling-v3.0-pro --duration 4 --aspect-ratio 9:16 --reference "bambi/outputs/surreal-ads/2026-10-09-headphones/keyframes/k2.png" --end-frame "bambi/outputs/surreal-ads/2026-10-09-headphones/keyframes/k3.png"
```

## 4. הרכבה (video-editor) — hard cuts, הפריימים כבר תואמים

```bash
# concat s01→s03 ללא xfade → bambi/outputs/surreal-ads/2026-10-09-headphones/final.mp4 (דורש ffmpeg — או ה-ffmpeg של kinetic-typography venv)
bash .claude/skills/kinetic-typography/scripts/concat.sh "bambi/outputs/surreal-ads/2026-10-09-headphones/final.mp4" "bambi/outputs/surreal-ads/2026-10-09-headphones/videos/s01.mp4" "bambi/outputs/surreal-ads/2026-10-09-headphones/videos/s02.mp4" "bambi/outputs/surreal-ads/2026-10-09-headphones/videos/s03.mp4"
```

## 5. שכבת טיפוגרפיה (kinetic-typography)

```bash
bash .claude/skills/kinetic-typography/scripts/extract_matte.sh "bambi/outputs/surreal-ads/2026-10-09-headphones/final.mp4" "bambi/outputs/surreal-ads/2026-10-09-headphones/matte/fg"
bash .claude/skills/kinetic-typography/scripts/studio.sh "bambi/outputs/surreal-ads/2026-10-09-headphones"   # תצוגה מקדימה + כיוונון
bash .claude/skills/kinetic-typography/scripts/render.sh "bambi/outputs/surreal-ads/2026-10-09-headphones"   # → final_typo.mp4
```

## One-shot (השוואה זולה)
```bash
bash .claude/skills/openrouter-video-gen/scripts/generate-video.sh "$(cat bambi/outputs/surreal-ads/2026-10-09-headphones/master_prompt.txt)" "bambi/outputs/surreal-ads/2026-10-09-headphones/videos/oneshot.mp4" --model kwaivgi/kling-v3.0-pro --duration 15 --aspect-ratio 9:16 --reference "bambi/outputs/surreal-ads/2026-10-09-headphones/keyframes/k0.png"
```
