# Realistic SFX — prompt recipe (ElevenLabs `eleven_text_to_sound_v2`, flow node type `sfx`)

Rule: **one prompt per physical action on screen**, never "whoosh"/"cinematic swoosh". Describe
material + force + surface + mic distance + "realistic foley / not synthetic / no music".
`prompt_influence` 0.55–0.65, duration = action length (+tail). `generations_count: 2`, then
`analyze_takes.py` to pick. Typical set ≈ 13 sounds × 2 ≈ $0.10.

| Role | Pattern (MELT wording that worked) |
|---|---|
| impact | "Close-mic laptop screen glass shattering from a heavy blunt impact from behind: one sharp violent crack burst, then dense glass fragments breaking apart, realistic foley, dry room, no music" (2.5s) |
| pre-stress | "Thin glass under pressure, a crack slowly spreading … tense creaking and fine ticking, close mic, quiet room" (2s) |
| debris | "Small glass shards falling and tinkling onto a wooden table and laptop keyboard …" (2s) |
| product exits | "Heavy solid <product> grinding and scraping its way out through broken glass, gritty …" (1.5s) |
| fly-by | "A heavy massive object flying past the camera very close, deep weighty pass-by with real air turbulence and doppler, building then passing, realistic not synthetic" (2s) — also reused pitched ×1.25 + HP as camera air |
| landing | "Thick molten <material> landing heavily on a linen cloth, wet viscous splat …" (1.2s) |
| transformation | "Thick molten <material> slowly rising and stretching, sticky glossy squelches …" (2s) |
| lock thud | "Single heavy dull thud of a solid <material> block settling …, short" (0.6s) — reuse ×4 with varispeed 0.92–1.06 |
| silence detail | "One single thick drop of <liquid> falling onto a wooden floor in a completely silent room, close mic ASMR, nothing else" (1s) |
| whip | "Very fast natural air swish, like a cloth or arm whipped past a microphone, short sharp swoosh with real air, not synthetic" (0.7s) |
| macro | "Extreme close-up of <material> … soft sticky pulls and tiny crackles …, ASMR, quiet" (2s) |
| packaging | "<Gold foil wrapper> crinkling as it is revealed, crisp metallic rustle, close foley, short" (1.2s) |
| room | "Quiet warm room tone with a faint laptop fan hum, steady, no events, no music" (5s, mirror-looped) |

Swap the material per ad: perfume → glass bottle clinks, liquid spritz; coffee → beans pouring, steam hiss;
sneakers → foam squeaks, air puffs; headphones → silk ribbon flutter, bass thump; F1 → tyre squeal, carbon clack.
