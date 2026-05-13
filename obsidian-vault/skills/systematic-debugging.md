---
file_path: .claude/skills/systematic-debugging/SKILL.md
last_updated: 2026-05-13
owner: ראובן
---

# systematic-debugging

## מה זה עושה

**חוק ברזל:** לא מתקנים בלי למצוא שורש הבעיה קודם. תיקון תסמינים = כישלון.

תהליך:
1. הבנת הבעיה (symptom vs root cause)
2. איסוף ראיות (logs, tests, traces)
3. גיבוש השערות
4. בדיקת השערות בשיטתיות
5. תיקון שורש הבעיה

## שייך ל

כל הצוות — מופעל לכל bug, כישלון בדיקה, או התנהגות בלתי צפויה.

## קבצים קשורים

- `CREATION-LOG.md` — היסטוריית יצירת הסקיל
- `condition-based-waiting.md` — טכניקה לבדיקות async
- `condition-based-waiting-example.ts` — דוגמת קוד
- `defense-in-depth.md` — עומק ההגנה
- `root-cause-tracing.md` — איתור שורש הבעיה
- `find-polluter.sh` — סקריפט לאיתור זיהום בדיקות
- [[test-driven-development]] — כתיבת בדיקות נכונות
- [[dispatching-parallel-agents]] — דיבוג מקביל

## מיקום

`.claude/skills/systematic-debugging/SKILL.md`
