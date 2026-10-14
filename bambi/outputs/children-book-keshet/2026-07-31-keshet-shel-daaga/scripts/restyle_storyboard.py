#!/usr/bin/env python3
"""Restyle storyboard.json: new painterly-digital style + grandpa/ziva/shulamit redesigns.

Run with --dry-run first to review a diff; run without it to write.
Every substitution is asserted before being applied — a mismatch aborts loudly
rather than silently leaving the file in a partially-edited state.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STORYBOARD = ROOT / "storyboard.json"

OLD_STYLE = (
    "Soft watercolor children's book illustration with delicate pencil linework, "
    "light airy pastel palette, white and cream background washing out toward the "
    "edges in a soft vignette, lime-yellow and soft green foliage, gentle rainbow "
    "light accents in pink, sky blue and yellow, warm late-afternoon light, "
    "childlike and warm, no heavy outlines, square 1:1 composition. Absolutely no "
    "text, no letters, no words, no writing, no numbers, no captions, no signage "
    "anywhere in the image."
)
NEW_STYLE = (
    "Ultra-detailed painterly digital rendering, rich soft textures, cinematic "
    "soft lighting with gentle rim light, shallow depth of field, polished "
    "premium storybook character-art style, warm and tender mood, very large "
    "expressive eyes with visible catchlights and detailed lashes, hair rendered "
    "in soft dimensional curls/detail, square 1:1 composition. Absolutely no "
    "text, no letters, no words, no writing, no numbers, no captions, no signage "
    "anywhere in the image."
)

NEW_VISUAL_THEME = {
    "palette": "rich, saturated painterly digital palette with warm skin tones, "
               "soft cinematic warmth, deep tender colour grading, still carrying "
               "the lime-yellow/leaf-green garden foliage and rainbow accents from "
               "the story world",
    "lighting": "cinematic soft lighting with a gentle warm rim light, shallow "
                "depth of field, polished premium storybook rendering",
    "film_look": "ultra-detailed painterly digital character-art rendering, rich "
                 "soft textures, very large expressive eyes with visible "
                 "catchlights and detailed lashes, hair rendered in soft "
                 "dimensional curls/detail, square 1:1 page",
    "motion": "N/A — still illustrations only",
    "mood": "childlike, warm, tender and reassuring; a small worry held inside a "
            "lovingly rendered world",
}

CAST_EDITS = {
    "grandpa_avraham": (
        "Grandpa Avraham, a kind elderly gardener around 72, tanned lined face, "
        "full short white beard and thin white hair, small round glasses, "
        "wearing a light beige button-up work shirt with rolled sleeves, "
        "olive-green work trousers, a wide straw sun hat and brown garden "
        "gloves, slightly stooped gentle posture.",
        "Grandpa Avraham, a warm and attractive man in his late 50s, broad face "
        "with a strong jaw and warm laugh-lines around his eyes, short "
        "salt-and-pepper hair neatly combed, clean-shaven, tanned skin, wearing "
        "a light beige button-up work shirt with rolled sleeves, olive-green "
        "work trousers, a wide straw sun hat and brown garden gloves, confident "
        "upright posture with an easy, genuine smile.",
    ),
    "aunt_ziva": (
        "Aunt Ziva, a warm woman about 45, wavy shoulder-length auburn hair tied "
        "back loosely, hazel eyes, wearing a soft terracotta-brown blouse with "
        "short sleeves and a cream apron skirt, small gold hoop earrings, caring "
        "energetic posture.",
        "Aunt Ziva, a warm woman in her 60s, wavy shoulder-length dark "
        "auburn-mahogany hair tied back loosely, hazel eyes, soft gentle smile "
        "lines, wearing a soft terracotta-brown blouse with short sleeves and a "
        "cream apron skirt, small gold hoop earrings, caring energetic posture.",
    ),
    "aunt_shulamit": (
        "Aunt Shulamit, a gentle woman about 50, straight silver-streaked dark "
        "hair in a low bun, brown eyes, wearing a sage-green linen dress with a "
        "pale mint cardigan and simple canvas shoes, calm reassuring posture.",
        "Aunt Shulamit, a beautiful young woman in her 30s, straight blonde hair "
        "worn loose, bright blue eyes, wearing a soft dusty-rose linen dress and "
        "simple flat sandals, calm reassuring posture, warm gentle smile.",
    ),
}

# (scene_number, old_substring, new_substring)
SCENE_EDITS = [
    (2,
     "Grandpa Avraham, a kind elderly gardener with a full white beard, small "
     "round glasses, straw sun hat, beige rolled-sleeve work shirt, olive work "
     "trousers and brown garden gloves, kneels on the soil",
     "Grandpa Avraham, a warm and attractive man in his late 50s with short "
     "salt-and-pepper hair and a clean-shaven face, wearing a straw sun hat, "
     "beige rolled-sleeve work shirt, olive work trousers and brown garden "
     "gloves, kneels on the soil"),
    (3,
     "Grandpa Avraham, elderly gardener with white beard, round glasses and "
     "straw hat, crouches down to eye level",
     "Grandpa Avraham, a warm and attractive man in his late 50s with short "
     "salt-and-pepper hair, clean-shaven, and a straw hat, crouches down to eye "
     "level"),
    (6,
     "Grandpa Avraham hurries in from the left, straw hat slipping back",
     "Grandpa Avraham, his short salt-and-pepper hair catching the light, "
     "hurries in from the left, straw hat slipping back"),
    (7,
     "Grandpa Avraham kneels beside Dedush",
     "Grandpa Avraham, salt-and-pepper hair, clean-shaven and warm-faced, kneels "
     "beside Dedush"),
    (8,
     "Grandpa Avraham holds up a small glass bottle of bright yellow iodine",
     "Grandpa Avraham, salt-and-pepper hair and clean-shaven, holds up a small "
     "glass bottle of bright yellow iodine"),
    (9,
     "Aunt Ziva, a warm woman about 45 with wavy auburn shoulder-length hair "
     "tied back, terracotta-brown blouse and cream apron skirt, arrives from "
     "the left",
     "Aunt Ziva, a warm woman in her 60s with wavy dark auburn-mahogany "
     "shoulder-length hair tied back, terracotta-brown blouse and cream apron "
     "skirt, arrives from the left"),
    (9,
     "Grandpa Avraham stands behind on the right, hand on the boy's back.",
     "Grandpa Avraham, salt-and-pepper hair, stands behind on the right, hand on "
     "the boy's back."),
    (10,
     "Aunt Shulamit, a gentle woman about 50 with silver-streaked dark hair in a "
     "low bun, sage-green linen dress and pale mint cardigan, steps in from the "
     "right",
     "Aunt Shulamit, a beautiful young woman in her 30s with straight blonde "
     "hair and bright blue eyes, wearing a soft dusty-rose linen dress, steps in "
     "from the right"),
    (10,
     "Aunt Ziva stands behind on the left, still holding her brown bottle.",
     "Aunt Ziva, her dark auburn-mahogany hair catching the light, stands "
     "behind on the left, still holding her brown bottle."),
    (11,
     "Aunt Ziva and Aunt Shulamit stand behind on the right watching with "
     "concern.",
     "Aunt Ziva (dark auburn-mahogany hair) and Aunt Shulamit (blonde hair, "
     "bright blue eyes) stand behind on the right watching with concern."),
    (13,
     "Grandpa Avraham with white beard and straw hat smiles proudly on the "
     "left; Aunt Ziva in terracotta and Aunt Shulamit in sage green stand "
     "beside him;",
     "Grandpa Avraham, salt-and-pepper hair, clean-shaven and warmly handsome, "
     "wearing his straw hat, smiles proudly on the left; Aunt Ziva, dark "
     "auburn-mahogany hair, in terracotta, and Aunt Shulamit, blonde hair and "
     "bright blue eyes, in a dusty-rose dress, stand beside him;"),
]

# Story pages now render into a new folder; old scenes/ archive is untouched.
IMAGE_OUTPUT_OLD_PREFIX = (
    "bambi/outputs/children-book-keshet/2026-07-31-keshet-shel-daaga/scenes/"
)
IMAGE_OUTPUT_NEW_PREFIX = (
    "bambi/outputs/children-book-keshet/2026-07-31-keshet-shel-daaga/scenes_painterly/"
)


def apply_edit(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise AssertionError(
            f"[{label}] expected exactly 1 occurrence, found {count}\n--- old ---\n{old}"
        )
    return text.replace(old, new)


def main() -> int:
    dry_run = "--dry-run" in sys.argv
    data = json.loads(STORYBOARD.read_text(encoding="utf-8"))

    diffs = []

    # 1. visual_theme
    old_theme = json.dumps(data["visual_theme"], ensure_ascii=False, indent=1)
    data["visual_theme"] = NEW_VISUAL_THEME
    new_theme = json.dumps(data["visual_theme"], ensure_ascii=False, indent=1)
    diffs.append(("visual_theme", old_theme, new_theme))

    # 2. shared style boilerplate, field by field (8 cast + 13 scenes = 21)
    style_swaps = 0
    for c in data["cast"]:
        before = c["description"]
        after = apply_edit(before, OLD_STYLE, NEW_STYLE, f"cast[{c['id']}].style")
        if before != after:
            style_swaps += 1
            diffs.append((f"cast[{c['id']}].description (style)", before, after))
        c["description"] = after
    for s in data["scenes"]:
        before = s["image_prompt"]
        after = apply_edit(
            before, OLD_STYLE, NEW_STYLE, f"scenes[{s['scene_number']}].style"
        )
        if before != after:
            style_swaps += 1
            diffs.append(
                (f"scenes[{s['scene_number']}].image_prompt (style)", before, after)
            )
        s["image_prompt"] = after
    if style_swaps != 21:
        raise AssertionError(f"expected 21 style swaps, applied {style_swaps}")

    # 3. character redesign — cast descriptions
    for cid, (old, new) in CAST_EDITS.items():
        c = next(c for c in data["cast"] if c["id"] == cid)
        before = c["description"]
        after = apply_edit(before, old, new, f"cast[{cid}].redesign")
        diffs.append((f"cast[{cid}].description (redesign)", before, after))
        c["description"] = after

    # 3b. character redesign — per-scene clauses
    scenes_by_num = {s["scene_number"]: s for s in data["scenes"]}
    for scene_num, old, new in SCENE_EDITS:
        s = scenes_by_num[scene_num]
        before = s["image_prompt"]
        after = apply_edit(before, old, new, f"scenes[{scene_num}].redesign")
        diffs.append((f"scenes[{scene_num}].image_prompt (redesign)", before, after))
        s["image_prompt"] = after

    # 4. image_output -> new scenes_painterly/ folder (old scenes/ left untouched)
    redirected = 0
    for s in data["scenes"]:
        old_path = s["image_output"]
        if old_path.startswith(IMAGE_OUTPUT_OLD_PREFIX):
            s["image_output"] = old_path.replace(
                IMAGE_OUTPUT_OLD_PREFIX, IMAGE_OUTPUT_NEW_PREFIX, 1
            )
            redirected += 1
    if redirected != 13:
        raise AssertionError(f"expected 13 image_output redirects, got {redirected}")

    print(f"OK: {len(diffs)} field edits, 21 style swaps, {redirected} path redirects\n")

    if dry_run:
        for label, before, after in diffs:
            print(f"=== {label} ===")
            print(f"- {before}")
            print(f"+ {after}")
            print()
        print("[dry-run] no file written")
        return 0

    STORYBOARD.write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"written: {STORYBOARD}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
