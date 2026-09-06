---
file_path: .claude/skills/font-foundry/SKILL.md
last_updated: 2026-09-06
owner: the-font-designer
---

# font-foundry

## מה זה עושה
מנוע פונטים עם שני מצבים:
- **מצב A — וריאציה מבסיס OFL:** לוקח בסיס (Heebo / Rubik / Assistant / dana-yad), ממנף משקל, ומחיל טרנספורמציות: עיגול (Chaikin), נטייה, רוחב, contrast, embolden (שמנמן), ליגטורות, סלסול-למ"ד.
- **מצב B — image-to-font:** המשתמש מצייר אותיות על גיליון תבנית (7×7, מרקרי פינה, קווי בסיס); הבנאי מתחקה כל גליף ב-OpenCV `findContours` ובונה TTF Regular + Bold. האותיות של המשתמש עצמו.

## תקינות התקנה
`fix_maxp_for_glyf()` מבטיח TTF תקין להתקנה: דגל TrueType (`sfntVersion 0x00010000`, לא `OTTO`) + `maxp v1.0` + עקביות macStyle/fsSelection. בלי זה macOS נותן "contains no fonts which can be installed" (קרה עם בסיס dana-yad שהומר מ-CFF).

## שייך ל
מעצב הפונטים (the-font-designer)

## קבצים קשורים
- [[מעצב-הפונטים]]
- [[ראובן-מנכל]]

## מיקום
`.claude/skills/font-foundry/`
- מצב A: `make_variation.py` + `make-variation.sh`, `bases/` (Heebo/Rubik/Assistant/DanaYad)
- מצב B: `make_template.py` + `build_from_template.py` + wrappers, `glyph_set.py`, `template/` (font-template.png/pdf + template_spec.json)
