#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build storyboard_v3.json for Raz Bar Mitzva from storyboard_v2.json + footage tier map.
Breaks each v2 scene into 1-3 shots to cover full narration duration, tags existing
footage (tier A/B/C), and marks 8 dedicated boundary transition shots (first/tail Kling)."""
import json, os

BASE = "/Users/lirazgolan/claude_projects/TheFiveAgents"
V2_DIR = f'{BASE}/bambi/outputs/Raz Bar Mitzva/2026-06-27-bar-mitzva'
V3_DIR = f'{BASE}/bambi/outputs/Raz Bar Mitzva/2026-07-26-v3'
VIDEO_DIR = f'{BASE}/the-video-man/outputs/Raz Bar Mitzva'

GLOBAL_STYLE = ("clean modern comic-book / graphic-novel illustration style, crisp precise "
    "linework, smooth cel shading, natural realistic proportions, warm tanned natural skin "
    "tones, detailed modern casual clothing, bright even lighting, vibrant true-to-life "
    "colors, high detail — NOT painterly, NO visible brushwork, NOT photorealistic — "
    "absolutely no readable text, writing, letters, numbers, logos, or gibberish signage "
    "anywhere in the image (clothing, floors, rugs, walls, packaging must be plain/blank)")

# full character description strings — reused verbatim so every prompt (including short
# transition hooks) carries the same face-lock instruction the main shots always had
CHAR_DESC = {
    'raz_toddler': 'Toddler Raz, soft dark brown curly hair, big dark brown eyes, round chubby cheeks',
    'raz_child': 'Child Raz around 9, slim, short straight dark brown hair, warm deep brown eyes',
    'raz_teen': 'Teen Raz, 13, tall lean-athletic build, short dark hair buzzed on the sides, warm deep brown eyes',
    'mom_adi': 'mom Adi, dark wavy hair, warm big smile, dark eyes',
    'dad_amos': 'dad Amos, athletic build, short dark hair, big white smile, tanned skin',
    'taya': ('Taya — an Australian Cattle Dog / blue heeler DOG (not a person), grey-and-white '
             'speckled mottled coat, black pointed ears, tan facial markings, four legs, a dog\'s body'),
    'grandparents_amos': ('Ruti, colorful headscarf (mitpachat) and glasses, gentle smile; David, '
                           'white sun hat, glasses, white polo shirt'),
    'grandparents_adi': ('Rafi, short greying hair, light blue striped shirt; Michal, curly '
                          'reddish-brown shoulder-length hair, warm bright smile'),
}
KEEP_FACE = 'Keep the exact face, hair and appearance from the reference image.'

v2 = json.load(open(f'{V2_DIR}/storyboard_v2.json'))

# ---- footage tier map: scene_number -> list of existing-clip dicts (shot 1 primary) ----
# tier: A = spec-compliant (>=1176x784, 3:2), B = usable off-standard, C = reject
FOOTAGE = {
 1:  [dict(image='scenes_v2/s01.png', img_dim='1764x1176', video=f'{VIDEO_DIR}/s01 ofra.mp4', vid_dim='1764x1176', dur=10.1, tier='A')],
 2:  [dict(image='scenes_v2/s02.png', img_dim='1176x784', video=f'{VIDEO_DIR}/s02.mp4', vid_dim='1176x784', dur=5.0, tier='A')],
 3:  [dict(image='scenes_v2/s03.png', img_dim='1176x784', video=f'{VIDEO_DIR}/s03.mp4', vid_dim='1176x784', dur=5.0, tier='A')],
 4:  [dict(image='scenes_v2/s04_v2_faceswap.png', img_dim='1620x1080', video=f'{VIDEO_DIR}/s04.mp4', vid_dim='1620x1080', dur=5.2, tier='B')],
 5:  [dict(image='scenes_v2/s05.png', img_dim='1176x784', video=f'{VIDEO_DIR}/s05.mp4', vid_dim='1176x784', dur=10.0, tier='A')],
 6:  [dict(image='scenes_v2/s06.png', img_dim='1620x1080', video=f'{VIDEO_DIR}/s06.mp4', vid_dim='1620x1080', dur=5.2, tier='B')],
 7:  [dict(image='scenes_v2/s07.png', img_dim='1176x784', video=f'{VIDEO_DIR}/s07.mp4', vid_dim='1176x784', dur=5.0, tier='A')],
 8:  [dict(image=f'{V3_DIR}/scenes/s08_1.png', img_dim='1536x1024', video=f'{VIDEO_DIR}/kling_20260726_VIDEO_the_young__907_0.mp4', vid_dim='1176x780', dur=6.0, tier='A')],
 9:  [dict(image=f'{V3_DIR}/scenes/s09_1.png', img_dim='1536x1024', video=f'{VIDEO_DIR}/s09.mp4', vid_dim='1280x720', dur=10.0, tier='B',
           video_notes='רז ביקש: אין צורך בתמונה/וידאו נוסף לסצנה זו (s09.2 בוטל) — בשלב הוידאו: או לרנדר וידאו חדש מ-s09.1, או להאריך (extend) את הקליפ הקיים s09.mp4.')],
 10: [dict(image='scenes_v2/s10.png', img_dim='1176x784', video=f'{VIDEO_DIR}/s10.mp4', vid_dim='1176x784', dur=8.0, tier='A',
           first_tail=True, frame_a='scenes_v2/s10.png', frame_b='scenes_v2/s10b.png',
           needs_regen=True, img_note='אמא (עדי) לא דומה מספיק לרפרנס — לרנדר מחדש את שני הפריימים כדי שאמא תהיה נאמנה לרפרנס, תוך שמירה על הרעיון: רז קטן ונמוך ממנה ← רז נער גבוה ממנה')],
 11: [],  # nothing usable — full rebuild, split into 3 single-food shots per user request
 12: [dict(image='scenes_v2/s12.png', img_dim='1176x784', video=f'{VIDEO_DIR}/s12.mp4', vid_dim='1176x784', dur=6.0, tier='A')],
 13: [dict(image='scenes_v2/s13.png', img_dim='1176x784', video=f'{VIDEO_DIR}/s13.mp4', vid_dim='1176x784', dur=5.0, tier='A')],
 14: [dict(image='scenes_v2/s14.png', img_dim='1176x784', video=f'{VIDEO_DIR}/s14.mp4', vid_dim='1176x784', dur=5.0, tier='A')],
 15: [dict(image='scenes_v2/s15.png', img_dim='1176x784', video=f'{VIDEO_DIR}/s15.mp4', vid_dim='1176x784', dur=5.0, tier='A')],
 16: [dict(image='scenes_v2/s16.png', img_dim='1176x784', video=f'{VIDEO_DIR}/s16.mp4', vid_dim='1176x784', dur=9.0, tier='A')],
 17: [dict(image='scenes_v2/s17.png', img_dim='1176x784', video=f'{VIDEO_DIR}/s17.mp4', vid_dim='1176x784', dur=5.0, tier='A')],
 18: [dict(image='scenes_v2/s18.png', img_dim='1176x784', video=f'{VIDEO_DIR}/kling_20260725_VIDEO_Low_fast_t_580_0.mp4', vid_dim='1176x784', dur=9.0, tier='A')],
 19: [dict(image='scenes_v2/s19.png', img_dim='1176x784', video=f'{VIDEO_DIR}/s19.mp4', vid_dim='1176x784', dur=5.0, tier='A')],
 20: [dict(image='scenes_v2/s20.png', img_dim='1176x784', video=f'{VIDEO_DIR}/s20.mp4', vid_dim='1176x784', dur=5.0, tier='A',
           video_notes='רז ביקש: s20.2 בוטל (אבא לא דמה לרפרנס). בשלב הוידאו — להאריך/ליצור וידאו נוסף מ-s20.1, עם רעיון שונה ומיוחד לחלק השני, לא ריצה בנאלית.')],
 21: [dict(image='scenes_v2/s21.png', img_dim='1764x1176', video=f'{VIDEO_DIR}/s21-22.mp4', vid_dim='1764x1176', dur=7.5, tier='A', shared_clip_note='חולק את s21-22.mp4 (15.0s) עם סצנה 22')],
 22: [dict(image='scenes_v2/s22_A.png', img_dim='1764x1176', video=f'{VIDEO_DIR}/s21-22.mp4', vid_dim='1764x1176', dur=7.5, tier='A',
           first_tail=True, frame_a='scenes_v2/s22_A.png', frame_b='scenes_v2/s22_B.png', shared_clip_note='חולק את s21-22.mp4 עם סצנה 21')],
 23: [dict(image='scenes_v2/s23.png', img_dim='1176x784', video=f'{VIDEO_DIR}/s23.mp4', vid_dim='1176x784', dur=5.0, tier='A')],
 24: [dict(image='scenes_v2/s24_A.png', img_dim='1764x1176', video=f'{VIDEO_DIR}/s24.mp4', vid_dim='1764x1176', dur=14.0, tier='A',
           first_tail=True, frame_a='scenes_v2/s24_A.png', frame_b='scenes_v2/s24_B.png')],
 25: [],  # split into 3 distinct beats per user request — old combined s25_A/B portal montage discarded
 26: [dict(image='scenes_v2/s26a.png', img_dim='1024x1024', video=f'{VIDEO_DIR}/s26.mp4', vid_dim='1280x720', dur=6.0, tier='B', label='ספר'),
      dict(image='scenes_v2/s26b.png', img_dim='1024x1024', video=None, vid_dim=None, dur=0, tier='B', label='מוזיקה')],
 27: [dict(image='scenes_v2/s27_1.png', img_dim='1024x1024', video=f'{VIDEO_DIR}/s27.mp4', vid_dim='1764x1176', dur=15.0, tier='A')],
}

# ---- shot-count plan per scene (how many shots needed to cover full duration) ----
SHOTS_NEEDED = {1:2,2:2,3:2,4:2,5:2,6:2,7:2,8:2,9:1,10:1,11:3,12:2,13:2,14:2,15:2,16:2,
                17:2,18:1,19:2,20:1,21:2,22:2,23:2,24:1,25:3,26:4,27:3}
# s09.2 and s20.2 discarded per round-2 QA (see FOOTAGE[9]/[20] video_notes)

# single-shot content overrides for round-2 QA fixes — same pattern as SCENE10/11/25/27
# but for exactly one shot each (keyed by (scene_number, shot_index))
SINGLE_SHOT_OVERRIDES = {
    (7, 2): dict(
        narr='בגיל שנה הוא הגיע לבית גמליאל — וכבר טיפס על הכל.',
        characters=['raz_toddler'],
        reference='yuval/reference/Raz/_proxy/2016-toddler-zoomz.jpg',
        img=f"{CHAR_DESC['raz_toddler']}, alone, playfully climbing up a stack of plain unmarked "
            "cardboard moving boxes inside the new village home's living room, determined delighted "
            "expression, warm afternoon light through a window, no other people in frame. " + KEEP_FACE,
        vid='The toddler clambers determinedly up a stack of moving boxes alone in the sunlit living '
            'room, wobbles, grins triumphantly at the top. Playful, independent, already in motion.'),
    (14, 2): dict(
        narr='עם העוגות הכי שוות.',
        characters=[], reference='',
        img='Close-up food-styling shot: a wooden table absolutely full of an abundant spread of fresh '
            'homemade cakes and cookies — layered cakes, cookies, pastries — steam and warm afternoon '
            'light catching the icing and crumbs, no people in frame, inviting and delicious.',
        vid='Slow push-in across a table overflowing with fresh homemade cakes and cookies, warm '
            'afternoon light catching the icing and crumbs. Warm, abundant, inviting — grandma\'s table.'),
}

# scene 25 split per user request: barber / New Zealand / teleportation as 3 distinct shots
SCENE25_SHOTS = [
    dict(title_suffix='ברבר', narr='ללמוד לספר חברים.',
         img='Teen Raz, 13, tall lean-athletic build, short dark hair buzzed on the sides, warm deep '
             'brown eyes, playfully giving a friend a haircut with clippers, wearing a barber cape, '
             'comically confident wink, bright barbershop-style setup at home. Keep the exact face, '
             'hair and appearance from the reference image.',
         vid='The teen snips a friend\'s hair with a confident barber flourish, spins the clippers, winks at camera. Playful, comic, self-assured.'),
    dict(title_suffix='ניו זילנד', narr='ואולי יום אחד, גם להגיע לניו זילנד הרחוקה.',
         img='Dream sequence: Teen Raz, 13, tall lean-athletic build, short dark hair buzzed on the sides, '
             'warm deep brown eyes, standing atop a lush green fjord-lined mountain ridge in New Zealand, '
             'small backpack, arms open wide to the view, wind in his hair, adventurous joyful expression, '
             'morning mist catching the light like fine drifting stardust over the peaks, dramatic green '
             'peaks and still blue fjord water below. Keep the exact face, hair and appearance from the reference image.',
         vid='Sweeping reveal across New Zealand\'s green fjords and mountains, sunlit mist drifting through the valley like scattered stardust, the teen turns to camera with an adventurous grin, wind moving his hair. Epic, hopeful, wide open world — a shot that pulls both kids and adults into the dream.',
         model='kling-video-v3_0_turbo'),
    dict(title_suffix='טלפורטציה', narr='ואם הוא היה יכול לקבל כוח-על? הוא היה מבקש טלפורטציה, כדי להיות בכל מקום בבת אחת.',
         img='Dream sequence: Teen Raz, 13, tall lean-athletic build, short dark hair buzzed on the sides, '
             'warm deep brown eyes, stepping through a glowing teleportation portal made of swirling '
             'stardust and light particles, one foot already through the portal, excited grin looking '
             'back at camera, trails of glittering stardust curling around his silhouette. Keep the exact face, hair and appearance from the reference image.',
         vid='A glowing portal tears open in a burst of swirling stardust; the teen steps through, grinning back at the camera, glittering light particles trailing behind him as the portal swallows him in a flash. Fun, magical, limitless — the film\'s clearest "wow" beat, built to catch both a kid\'s imagination and an adult\'s nostalgia.',
         model='kling-video-v3_0_turbo'),
]

# scene 10 recreate: mom must match reference closely; explicit growth arc (shorter -> taller than mom)
SCENE10_OVERRIDE = dict(
    narr='רז הוא ילד של אנשים, של עשייה ושל נחישות — פיקח, אכפתי, בוגר, נחוש, ועם ידיים טובות. '
         'רזי שלנו הוא שילוב נדיר של גובה (הגנים מאמא!) עם לב ענק. שוט של שני פריימים: רז קטן וקומתו '
         'מגיעה בקושי לכתף אמא ← רז נער שגדל וגבוה ממנה בהרבה — אותה קומפוזיציה בדיוק, כדי שהמעבר יבליט '
         'את השינוי בגובה.',
    frame_a='[FIRST FRAME] Warm living room, low-angle medium shot: Child Raz around 9, slim, short '
            'straight dark brown hair, warm deep brown eyes, standing side by side with his mom — mom '
            'Adi, dark wavy hair, warm big smile, dark eyes — his head reaching only about her shoulder '
            'height (clearly shorter than her), both smiling warmly at camera, soft bright daylight '
            'through a window behind them. Keep the exact face, hair and appearance of the mother '
            'faithfully matching the reference image — this is the part that must be corrected from the '
            'previous version.',
    frame_b='[LAST FRAME] Same warm living room, exact same low-angle medium shot, same camera position '
            'and composition, same window light: Teen Raz, 13, tall lean-athletic build, short dark hair '
            'buzzed on the sides, warm deep brown eyes, wearing his round black-framed glasses (updated '
            'direction: teen Raz wears glasses in all newly generated shots), now standing noticeably '
            'taller than his mom — towering well above her shoulder — mom Adi, dark wavy hair, warm big '
            'smile, dark eyes, looking up at him proudly. Keep the exact face, hair and appearance of the '
            'mother faithfully matching the reference image.',
    vid='Smooth growth-transition, same room and camera position throughout: starting on a child barely '
        'reaching his mom\'s shoulder, morphing seamlessly frame by frame as he grows taller until he '
        'towers well above her as a teen. Warm, funny, full of love — years of growth in one continuous breath.',
)

# scene 11 split per user request: one food per shot, Raz present in every shot
SCENE11_SHOTS = [
    dict(title_suffix='פנקייקים', narr='פנקייקים של ימי ראשון.',
         img='Sunny family kitchen, Sunday morning: Teen Raz, 13, tall lean-athletic build, short dark '
             'hair buzzed on the sides, warm deep brown eyes, sitting at the table happily digging into '
             'a tall stack of fluffy pancakes drizzled with syrup — ONLY pancakes on the table, no other '
             'food — warm morning light, cozy home atmosphere. Keep the exact face, hair and appearance '
             'from the reference image.',
         vid='The teen cuts into a tall stack of syrup-drizzled pancakes at the sunny breakfast table, takes a happy bite, morning light streaming in. Warm, cozy, a simple Sunday ritual.'),
    dict(title_suffix='פיצה', narr='ערב פיצות מעשה ידי אבא.',
         img='Warm family kitchen in the evening: Teen Raz, 13, tall lean-athletic build, short dark hair '
             'buzzed on the sides, warm deep brown eyes, and dad Amos, athletic build, short dark hair, '
             'big white smile, tanned skin, together pulling a fresh homemade pizza out of the oven — '
             'ONLY pizza on the table, no other food — steam rising, proud grins, warm kitchen light. '
             'Keep the exact face, hair and appearance from the reference image.',
         vid='Dad slides a fresh homemade pizza out of the oven, the teen leans in eagerly, steam rising, both grinning at the first slice. Warm, proud, a father-son tradition.'),
    dict(title_suffix='שניצלים', narr='והשניצלים של שישי, שרזי מטגן בעצמו.',
         img='Sunny family kitchen, Friday afternoon: Teen Raz, 13, tall lean-athletic build, short dark '
             'hair buzzed on the sides, warm deep brown eyes, wearing an apron, confidently frying a '
             'golden schnitzel in a pan at the stove with a proud grin — ONLY schnitzels on the stove and '
             'plate, no other food — steam rising, warm golden light. Keep the exact face, hair and '
             'appearance from the reference image.',
         vid='The teen flips a golden schnitzel in the pan like a pro, plates it with a proud grin, steam and warm light filling the kitchen. Confident, capable, a Friday ritual he owns.'),
]

# scene 27 finale extension (shots 2-3 only — shot 1 keeps the existing s27.1 tier-A footage)
SCENE27_EXTRA_SHOTS = {
    2: dict(title_suffix='זיכרון הפעוט', narr='ואנחנו עדיין רואים בך, גם את הילד הקטן שלנו, שנרדם עם מכונית ביד.',
        img='Emotional finale, golden hour: the family group around teen Raz softly blurs at the edges of '
            'frame as a warm glowing double-exposure memory rises behind them — a sleeping toddler hugging '
            'a toy car — fine golden dust motes drifting through the light like scattered stardust '
            'connecting past and present. Keep the exact face, hair and appearance from the reference image.',
        vid='The family group softens at the edges as a warm glowing memory rises behind them — the sleeping toddler with his toy car — fine golden stardust drifting through the light, bridging past and present in one breath. Tender, cinematic, the emotional hinge of the film.',
        model='kling-video-v3_0_turbo'),
    # index 3 (חתימת המשפחה) handled separately below — round-2 QA reuses the v2 asset instead
}

# ---- boundary transition shots (Kling first/tail, generated fresh) ----
# round-2 QA rewrite: every frame now carries the FULL English character description + KEEP_FACE
# instruction (the short Hebrew-only hooks were the root cause of unrecognizable faces and of
# "Taya" being drawn as a human girl instead of the dog — CHAR_DESC['taya'] now says DOG explicitly).
BOUNDARY_TRANSITIONS = [
 dict(after_scene=1, hook='שלג יורד ונמס לתוך אור הגן החם — כל פתית נוצץ כמו אבק כוכבים לרגע לפני שהוא נמס',
      frame_a_desc='Extreme close-up on a single snowflake in Ofra melting on a windowsill, catching the '
                    'light like a grain of drifting stardust, soft winter morning light, no people.',
      frame_b_desc='Warm golden sunlight pours into a bright sunny garden, the last melting snowflake '
                    'dissolving into the light, no people — establishes the cut to the grandparents\' garden.'),
 dict(after_scene=2, hook='המצלמה נעה הצידה מהגן של רות ודוד אל הגן של מיכל ורפי — הזוג השני של המשפחה',
      frame_a_desc=f"{CHAR_DESC['grandparents_amos']}, standing together in a bright sunny garden, waving "
                   f"warmly as if the camera is about to pan away from them. {KEEP_FACE}",
      frame_b_desc=f"{CHAR_DESC['grandparents_adi']}, standing together in their own bright sunny garden, "
                   f"smiling warmly as the camera arrives on them. {KEEP_FACE}",
      characters=['grandparents_amos', 'grandparents_adi']),
 dict(after_scene=4, hook='עלי הכותרת של החתונה יורדים ונוצצים באור השמש כמו אבק כוכבים לפני שהם הופכים לשמיכת התינוק',
      frame_a_desc='Wedding petals drifting through bright golden-hour light, catching the light like '
                   'scattered stardust, no people, close-up macro shot.',
      frame_b_desc='The drifting petals dissolve into the soft folds of a baby blanket, warm nursery '
                   'light, no people — establishes the cut to the newborn scene.'),
 dict(after_scene=5, hook='יד התינוק הפתוחה נסגרת סביב מכונית צעצוע',
      frame_a_desc="A newborn baby's small open hand reaching out in soft warm nursery light, close-up, "
                   "plain blanket with no pattern or text, no other people visible.",
      frame_b_desc="The baby's small fist closing gently around a single blue toy car, close-up, same "
                   "plain blanket, warm light — establishes the cut to the toddler-with-cars scene."),
 dict(after_scene=12, hook='התנועה האנרגטית של טאיה מתייצבת לשקט מול המחשב הנייד',
      frame_a_desc=f"{CHAR_DESC['taya']}, bounding and leaping energetically across a bright living room "
                   f"floor, tail a blur of motion, joyful puppy energy. {KEEP_FACE}",
      frame_b_desc=f"{CHAR_DESC['raz_child']}, sitting calmly and quietly at a desk in front of a laptop "
                   f"for a video call, {CHAR_DESC['taya']} now lying settled and quiet at his feet. {KEEP_FACE}",
      characters=['taya', 'raz_child']),
 dict(after_scene=17, hook='רז זורק כדור לטאיה, והיא עפה באוויר לתפוס אותו בשדה פתוח',
      frame_a_desc=f"{CHAR_DESC['raz_teen']}, standing in an open sunlit field, winding up to throw a "
                   f"bright tennis ball, {CHAR_DESC['taya']} crouched and alert beside him ready to run. "
                   f"{KEEP_FACE} Taya is a dog on four legs, not a person.",
      frame_b_desc=f"{CHAR_DESC['taya']} leaping joyfully through the air mid-flight over the open field "
                   f"to catch the ball, ears flying, pure motion and energy; {CHAR_DESC['raz_teen']} "
                   f"watching and laughing in the background. {KEEP_FACE} Taya is a dog on four legs, not a person.",
      characters=['raz_teen', 'taya']),
 dict(after_scene=20, hook='קצב הריצה נדחף לתוך תקריב נחוש',
      frame_a_desc=f"{CHAR_DESC['raz_teen']} and {CHAR_DESC['dad_amos']}, running side by side on a bright "
                   f"golden-hour country road, open green fields on both sides, matching strides. {KEEP_FACE}",
      frame_b_desc=f"Close-up on {CHAR_DESC['raz_teen']}'s determined face mid-run, same golden-hour country "
                   f"road and green fields softly blurred behind him, focused resolute expression, wind in "
                   f"his hair. {KEEP_FACE}",
      characters=['raz_teen', 'dad_amos']),
 dict(after_scene=25, hook='ניצוצות הפורטל מתפזרים כמו אבק כוכבים ונוחתים בעדינות על דפי הספר הפתוח בפינת הקריאה',
      frame_a_desc=f"{CHAR_DESC['raz_teen']} stepping through a glowing teleportation portal made of "
                   f"swirling stardust and light particles, trails of glitter curling around him. {KEEP_FACE}",
      frame_b_desc=f"A book lies open on a cozy reading-nook cushion, the last sparkles of stardust from "
                   f"the portal drifting down and settling gently onto its pages, warm soft light, no people.",
      characters=['raz_teen']),
 dict(after_scene=26, hook='זוהר מסך הפלייסטיישן מתרך ומתמוסס לענני אבק אור חמים שמתמזגים לתמונת המשפחה — כמו כוכבים חוזרים הביתה',
      frame_a_desc="Close-up on a glowing TV/PlayStation screen in a dim cozy room, soft blue-white light "
                   "and gentle light particles drifting off the screen, no people visible.",
      frame_b_desc=f"The screen's glow softens into warm golden dust motes that drift and settle over "
                   f"{CHAR_DESC['raz_teen']} gathered warmly with {CHAR_DESC['mom_adi']} and "
                   f"{CHAR_DESC['dad_amos']} at golden-hour, like starlight coming home. {KEEP_FACE}",
      characters=['raz_teen', 'mom_adi', 'dad_amos']),
]

def esc(s): return s

shots_out = []

# ---- s00.5: cold-open intro shot, before scene 1 — "he's always in motion" ----
# per round-2 QA request: aerial drone shot of Ofra in SUMMER (contrast with scene 1's winter
# snow reveal), teen Raz a small distant figure running through the fields below.
shots_out.append({
    "shot_id": "s00.5",
    "scene_number": 0,
    "scene_title": "אינטרו — רז תמיד בתנועה",
    "narration_excerpt": "רז תמיד בתנועה — עוד לפני שהסיפור מתחיל.",
    "characters": ["raz_teen"],
    "shot": {"type": "EWS", "angle": "high", "camera_move": "slow aerial drone push"},
    "reference": "yuval/reference/Raz/ofra.webp + yuval/reference/Raz/_proxy/2026-teen-book-raz-22.jpg",
    "image_prompt": GLOBAL_STYLE + "; Wide aerial drone shot over the town of Ofra in bright summer "
        "daylight — dry golden hills, white flat-roofed houses, green trees, clear blue sky (deliberate "
        "contrast with the winter snow of the film's opening scene) — a small distant figure of "
        f"{CHAR_DESC['raz_teen']} visible far below, running through open sunlit fields at the edge of "
        "town, caught mid-stride. Keep the exact town layout and geography from the reference image; "
        "the running figure is small and distant.",
    "video_prompt": "Slow aerial drone push forward over sunlit summer Ofra, hills and rooftops passing "
        "below, the camera drifting toward a small figure running through the golden fields at the edge "
        "of town — motion before the story even begins. Establishes: he never stops moving.",
    "image_existing": None, "image_dim": None, "video_existing": None, "video_dim": None,
    "video_duration_sec": None, "tier": None, "type": "missing",
    "recommended_model": "kling-video-v2_5", "enable_audio": False,
})

for sc in v2['scenes']:
    n = sc['scene_number']
    need = SHOTS_NEEDED.get(n, 1)
    foot = FOOTAGE.get(n, [])
    for i in range(need):
        shot_id = f"s{n:02d}.{i+1}"
        if (n, i+1) in SINGLE_SHOT_OVERRIDES:
            ov = SINGLE_SHOT_OVERRIDES[(n, i+1)]
            entry = {
                "shot_id": shot_id,
                "scene_number": n,
                "scene_title": sc['title'],
                "narration_excerpt": ov['narr'],
                "characters": ov['characters'],
                "shot": sc['shot'],
                "reference": ov['reference'],
                "image_prompt": GLOBAL_STYLE + "; " + ov['img'],
                "video_prompt": ov['vid'],
                "image_existing": None, "image_dim": None, "video_existing": None, "video_dim": None,
                "video_duration_sec": None, "tier": None, "type": "missing",
            }
            shots_out.append(entry)
            continue
        if n == 10:
            ov = SCENE10_OVERRIDE
            entry = {
                "shot_id": shot_id,
                "scene_number": n,
                "scene_title": sc['title'],
                "narration_excerpt": ov['narr'],
                "characters": sc['characters'],
                "shot": sc['shot'],
                "reference": "yuval/reference/Raz/_proxy/2026-parents-kisim-109.jpg (mom_adi likeness) + yuval/reference/Raz/_proxy/2026-teen-book-raz-22.jpg (teen face+glasses)",
                "image_prompt": (GLOBAL_STYLE + "; " + ov['frame_a'] + " || " + GLOBAL_STYLE + "; " + ov['frame_b']),
                "video_prompt": ov['vid'],
                "image_existing": 'scenes_v2/s10.png', "image_dim": '1176x784',
                "video_existing": f'{VIDEO_DIR}/s10.mp4', "video_dim": '1176x784', "video_duration_sec": 8.0,
                "tier": 'A', "type": "needs_regen", "needs_regen": True,
                "image_note": 'אמא (עדי) לא דומה מספיק לרפרנס — לרנדר מחדש: פריים A (רז קטן, נמוך מאמא) ופריים B (רז נער, גבוה ממנה בהרבה — עם משקפיים)',
                "frame_a": 'scenes_v2/s10.png', "frame_b": 'scenes_v2/s10b.png',
                "skip_auto_glasses": True,
            }
            shots_out.append(entry)
            continue
        if n == 11:
            ov = SCENE11_SHOTS[i]
            entry = {
                "shot_id": shot_id,
                "scene_number": n,
                "scene_title": f"{sc['title']} — {ov['title_suffix']}",
                "narration_excerpt": ov['narr'],
                "characters": ['raz_teen'] + (['dad_amos'] if ov['title_suffix']=='פיצה' else []),
                "shot": sc['shot'],
                "reference": sc['reference'],
                "image_prompt": GLOBAL_STYLE + "; " + ov['img'],
                "video_prompt": ov['vid'],
                "image_existing": None, "image_dim": None, "video_existing": None, "video_dim": None,
                "video_duration_sec": None, "tier": None, "type": "missing",
            }
            shots_out.append(entry)
            continue
        if n == 25:
            ov = SCENE25_SHOTS[i]
            entry = {
                "shot_id": shot_id,
                "scene_number": n,
                "scene_title": f"{sc['title']} — {ov['title_suffix']}",
                "narration_excerpt": ov['narr'],
                "characters": sc['characters'],
                "shot": sc['shot'],
                "reference": sc['reference'],
                "image_prompt": GLOBAL_STYLE + "; " + ov['img'],
                "video_prompt": ov['vid'],
                "image_existing": None, "image_dim": None, "video_existing": None, "video_dim": None,
                "video_duration_sec": None, "tier": None, "type": "missing",
                "recommended_model": ov.get('model', 'kling-video-v2_5'),
            }
            shots_out.append(entry)
            continue
        if n == 27 and i+1 == 3:
            # round-2 QA: generated s27.3 didn't resemble the family — reuse the v2 face-swapped
            # asset instead; that beat is already covered by the shared s27.mp4, no new video needed
            entry = {
                "shot_id": shot_id,
                "scene_number": n,
                "scene_title": f"{sc['title']} — חתימת המשפחה",
                "narration_excerpt": 'אוהבים אותך המון — אמא, אבא, יאיר ותומר.',
                "characters": sc['characters'],
                "shot": sc['shot'],
                "reference": sc['reference'],
                "image_prompt": "[מתוך v2 — s27_sw1.png, אושר ע\"י המשתמש כדומה למשפחה]",
                "video_prompt": "מכוסה ע\"י s27.mp4 הקיים (משותף עם s27.1) — אין צורך בקליפ נפרד",
                "image_existing": 'scenes_v2/s27_sw1.png', "image_dim": '1536x1024', "tier": "A",
                "video_existing": f'{VIDEO_DIR}/s27.mp4', "video_dim": '1764x1176', "video_duration_sec": 15.0,
                "type": "i2v", "shared_clip_note": 'חולק את s27.mp4 עם s27.1 — לא נדרש רינדור וידאו נוסף',
            }
            shots_out.append(entry)
            continue
        if n == 27 and i+1 in SCENE27_EXTRA_SHOTS:
            ov = SCENE27_EXTRA_SHOTS[i+1]
            entry = {
                "shot_id": shot_id,
                "scene_number": n,
                "scene_title": f"{sc['title']} — {ov['title_suffix']}",
                "narration_excerpt": ov['narr'],
                "characters": sc['characters'],
                "shot": sc['shot'],
                "reference": sc['reference'].replace('2026-teen-book-raz-10.jpg', '2026-teen-book-raz-22.jpg'),
                "image_prompt": GLOBAL_STYLE + "; " + ov['img'],
                "video_prompt": ov['vid'],
                "image_existing": None, "image_dim": None, "video_existing": None, "video_dim": None,
                "video_duration_sec": None, "tier": None, "type": "missing",
                "recommended_model": ov.get('model', 'kling-video-v2_5'),
            }
            shots_out.append(entry)
            continue
        entry = {
            "shot_id": shot_id,
            "scene_number": n,
            "scene_title": sc['title'],
            "narration_excerpt": sc['description'],
            "characters": sc['characters'],
            "shot": sc['shot'],
            "reference": sc['reference'],
        }
        if i < len(foot):
            f = foot[i]
            entry["image_prompt"] = GLOBAL_STYLE + "; " + sc['image_prompt'].split(';',1)[-1].strip() if i==0 else "[ADDITIONAL COVERAGE SHOT] " + GLOBAL_STYLE + "; continuation angle, same characters/setting as shot 1 — " + sc['image_prompt'].split(';',1)[-1].strip()[:300]
            entry["video_prompt"] = sc['video_prompt'] if i==0 else "[Additional coverage] " + sc['video_prompt'][:250]
            entry["image_existing"] = f.get('image')
            entry["image_dim"] = f.get('img_dim')
            entry["image_note"] = f.get('img_note')
            entry["video_existing"] = f.get('video')
            entry["video_dim"] = f.get('vid_dim')
            entry["video_duration_sec"] = f.get('dur')
            entry["tier"] = f.get('tier')
            entry["type"] = "first_tail" if f.get('first_tail') else ("i2v" if f.get('video') else "missing")
            if f.get('first_tail'):
                entry["frame_a"] = f.get('frame_a'); entry["frame_b"] = f.get('frame_b')
            if f.get('shared_clip_note'):
                entry["shared_clip_note"] = f.get('shared_clip_note')
            if f.get('label'):
                entry["label"] = f.get('label')
            if f.get('needs_regen'):
                entry["needs_regen"] = True
                entry["image_note"] = f.get('img_note')
                entry["type"] = "needs_regen"
        else:
            entry["image_prompt"] = "[NEW SHOT — needed for coverage] " + GLOBAL_STYLE + "; " + sc['image_prompt'].split(';',1)[-1].strip()[:350] + " (alternate angle/beat, same scene)"
            entry["video_prompt"] = "[NEW SHOT] " + sc['video_prompt'][:250]
            entry["image_existing"] = None
            entry["image_dim"] = None
            entry["video_existing"] = None
            entry["video_dim"] = None
            entry["video_duration_sec"] = None
            entry["tier"] = None
            entry["type"] = "missing"
        shots_out.append(entry)
    # boundary transition after this scene?
    bt = next((b for b in BOUNDARY_TRANSITIONS if b['after_scene']==n), None)
    if bt:
        img_prompt = f"[BOUNDARY TRANSITION — first frame] {GLOBAL_STYLE}; {bt['frame_a_desc']} || [last frame] {GLOBAL_STYLE}; {bt['frame_b_desc']}"
        chars = bt.get('characters') or (['raz_teen'] if bt.get('features_raz_teen') else [])
        shots_out.append({
            "shot_id": f"t{n:02d}-{n+1:02d}",
            "scene_number": n,
            "scene_title": f"מעבר: {sc['title']} → סצנה {n+1}",
            "narration_excerpt": bt['hook'],
            "characters": chars,
            "shot": {"type":"TRANSITION","angle":"-","camera_move":"first/tail interpolation"},
            "reference": "",
            "image_prompt": img_prompt,
            "video_prompt": f"Kling first/tail interpolation: {bt['hook']}",
            "image_existing": None, "image_dim": None, "video_existing": None, "video_dim": None,
            "video_duration_sec": None, "tier": None, "type": "first_tail_new",
            "frame_a": None, "frame_b": None, "is_boundary": True,
        })

# ---- round-2 QA: video-stage notes on existing (already-generated) shots — no image work ----
VIDEO_NOTES = {
    's12.1': 'רז ביקש: s12.2 יצא טוב יותר — לשקול ליצור משני התמונות שני קטעי וידאו (או קטע ארוך אחד מ-s12.2 בלבד).',
    's12.2': 'רז ביקש: התמונה הזו יצאה טוב יותר מ-s12.1 — להשתמש בה ליצירת וידאו (שני קטעים או קטע ארוך).',
    's19.2': 'רז ביקש: בעת יצירת הוידאו, לוודא שנכנס חבר אימון נוסף לסצנה ומבצע תרגיל קראטה יחד עם רז.',
    's23.2': 'רז ביקש: התמונה הזו יצאה טוב יותר מ-s23.1 — להשתמש בה ליצירת קליפ ארוך.',
}
for entry in shots_out:
    if entry['shot_id'] in VIDEO_NOTES:
        entry['video_notes'] = VIDEO_NOTES[entry['shot_id']]

# ---- glasses directive: any newly generated/regenerated shot with teen Raz wears his glasses ----
GLASSES_PROXY = 'yuval/reference/Raz/_proxy/2026-teen-book-raz-22.jpg'
GLASSES_NOTE_EN = (" Teen Raz wears his round black-framed glasses in this shot (updated direction: "
                    "every newly generated or regenerated shot featuring teen Raz shows him with glasses).")
GLASSES_NOTE_HE = " [הנחיה מעודכנת: בכל שוט חדש/מחודש עם רז הנער — הוא עונד את המשקפיים העגולות שלו.]"

for entry in shots_out:
    if entry.get('skip_auto_glasses'):
        ref = entry.get('reference') or ''
        entry['reference'] = ref.replace('2026-teen-book-raz-10.jpg', '2026-teen-book-raz-22.jpg') if 'book-raz-10' in ref else ref
        entry['glasses_applied'] = True
        continue
    if entry.get('type') not in ('missing', 'needs_regen', 'first_tail_new'):
        continue
    chars = entry.get('characters') or []
    if 'raz_teen' not in chars:
        continue
    ip = entry.get('image_prompt', '')
    if 'BOUNDARY TRANSITION' in ip or '||' in ip:
        entry['image_prompt'] = ip + GLASSES_NOTE_HE
    else:
        entry['image_prompt'] = ip + GLASSES_NOTE_EN
    ref = entry.get('reference') or ''
    if 'book-raz-10' in ref:
        entry['reference'] = ref.replace('2026-teen-book-raz-10.jpg', '2026-teen-book-raz-22.jpg')
    # NOTE: when ref is empty and there are multiple characters (e.g. raz_teen + taya), leave it
    # empty — build_jobs.py resolves each character's reference from the cast list itself, and
    # (as of the round-2 fix) does so glasses-aware for raz_teen. Overwriting here would silently
    # drop every other character's reference (this is exactly what broke t17-18's Taya reference).
    entry['glasses_applied'] = True

# ---- generation defaults: Kling 2.5 unless a shot earned v3.0_turbo, always no audio ----
for entry in shots_out:
    if entry.get('type') in ('missing', 'needs_regen', 'first_tail_new'):
        entry.setdefault('recommended_model', 'kling-video-v2_5')
        entry['enable_audio'] = False

v3 = {
    "project": v2['project'],
    "title": v2['title'].replace('(v2)', '(v3)'),
    "logline": v2['logline'],
    "language": v2['language'],
    "aspect_ratio": "3:2 (production) → export 16:9 crop for CapCut",
    "narration_source": "bambi/input/Raz Bar Mitzva/קריינות - רז פסדר בר מצווה גרסה 2.md (unchanged wording; timing from CapCut)",
    "timing_source": "bambi/outputs/Raz Bar Mitzva/2026-07-26-v3/timing.json (to be filled by user from CapCut)",
    "style_reference": v2['style_reference'],
    "global_style_block": GLOBAL_STYLE,
    "technical_standard": {
        "image_size": "1536x1024 (3:2)",
        "video_size": "1764x1176 or 1080p 3:2 via Kling",
        "capcut_project": "1920x1080, scale-to-fill crop",
        "reject_below": "1176x784",
        "audio": "enable_audio=false on every Kling generation — narration and music are mixed separately in CapCut, no baked-in audio/SFX from Kling",
        "model_policy": "kling-video-v2_5 by default (supports first_image+tail_image natively up to 10s — covers nearly all shots incl. first/tail transitions). "
                         "kling-video-v3_0_turbo reserved for the film's designated 'wow' beats only: s25.2 (New Zealand), s25.3 (teleportation — the stardust centerpiece), s27.2/s27.3 (finale). "
                         "Cinematic touch: fine drifting stardust / warm light-dust motes are used where they earn it emotionally — dream sequences, magical transitions, the finale — not applied indiscriminately.",
    },
    "visual_theme": v2['visual_theme'],
    "glasses_rule": (v2['glasses_rule'] + " | עדכון v3: בכל שוט חדש או מחודש (missing/needs_regen/first_tail_new) שבו "
                      "מופיע רז הנער — הוא עונד תמיד את המשקפיים העגולות שלו (רפרנס book-raz-22), ללא קשר למספר "
                      "הסצנה. חל רק על תוכן חדש/מחודש; פוטג' Tier A קיים שלא מרונדר מחדש נשאר כפי שהוא."),
    "cast": v2['cast'],
    "shots": shots_out,
}

os.makedirs(V3_DIR, exist_ok=True)
with open(f'{V3_DIR}/storyboard_v3.json', 'w', encoding='utf-8') as f:
    json.dump(v3, f, ensure_ascii=False, indent=2)

n_shots = len(shots_out)
n_existing_img = sum(1 for s in shots_out if s.get('image_existing'))
n_existing_vid = sum(1 for s in shots_out if s.get('video_existing'))
n_first_tail = sum(1 for s in shots_out if s.get('type') in ('first_tail','first_tail_new'))
covered_sec = sum(s.get('video_duration_sec') or 0 for s in shots_out)
print(f"shots={n_shots} existing_img={n_existing_img} existing_vid={n_existing_vid} first_tail={n_first_tail} covered_sec={covered_sec:.1f}")
