---
last_updated: 2026-05-13
---

# TheFiveAgents — מפתח ידע

> מערכת צוות סוכנים ליצירת תוכן. ראובן הוא המנכ"ל שמתאם בין יעל, יובל, וחן.

---

## הצוות (Agents)

| סוכן | קישור | תפקיד |
|------|-------|--------|
| ראובן | [[ראובן-מנכל]] | מנכ"ל הצוות — ניתוב ותיאום |
| יעל | [[יעל-כותבת]] | כותבת התוכן |
| יובל | [[יובל-מעצב]] | מעצב התמונות |
| חן | [[חן-חוקרת]] | החוקרת |

---

## קונפיגורציה (Config)

- [[CLAUDE-md]] — הוראות ראשיות לסוכן ראובן
- [[env-example]] — משתני סביבה לפרויקט
- [[gitignore]] — קבצים להתעלמות מ-Git

---

## סקילס (Skills)

### ניהול תהליכים
- [[brainstorming]] — מחקר ועיצוב לפני כל יצירה
- [[writing-plans]] — כתיבת תוכנית יישום
- [[executing-plans]] — ביצוע תוכנית ב-session נפרד
- [[subagent-driven-development]] — הפעלת תתי-סוכנים לביצוע מקביל

### פיתוח
- [[test-driven-development]] — TDD — כתיבת בדיקות לפני קוד
- [[systematic-debugging]] — דיבוג שיטתי מהשורש
- [[verification-before-completion]] — אימות לפני הכרזת סיום

### עבודת צוות
- [[dispatching-parallel-agents]] — שיגור סוכנים מקבילים
- [[requesting-code-review]] — בקשת סקירת קוד
- [[receiving-code-review]] — קבלת משוב קוד

### תשתית
- [[using-superpowers]] — מטא-סקיל: כיצד למצוא ולהשתמש בסקילס
- [[using-git-worktrees]] — בידוד עבודה ב-git worktrees
- [[finishing-a-development-branch]] — סיום ומיזוג ענף פיתוח
- [[writing-skills]] — כתיבה ובדיקה של סקילס חדשים
- [[obsidian-vault-workflow]] — תחזוקת ה-vault הזה

---

## מבנה תיקיות

```
obsidian-vault/
├── 00-INDEX.md          ← אתה כאן
├── Project-Overview.md  ← סקירת הפרויקט
├── agents/              ← תיעוד לכל סוכן
├── skills/              ← תיעוד לכל סקיל
└── config/              ← תיעוד לקבצי הגדרות
```
