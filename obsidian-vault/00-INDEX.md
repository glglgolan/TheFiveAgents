---
last_updated: 2026-09-07
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
| במבי | [[במבי-הבמאי]] | הבמאי — סיפור → סטוריבורד |
| the-video-man | [[the-video-man]] | מפיק הווידאו |

---

## קונפיגורציה (Config)

- [[CLAUDE-md]] — הוראות ראשיות לסוכן ראובן
- [[env-example]] — משתני סביבה לפרויקט
- [[gitignore]] — קבצים להתעלמות מ-Git
- [[launch-json]] — שרת preview סטטי (פורט 8765)

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

### וידאו / סטוריבורד
- [[storyboard-director]] — סיפור גולמי → סטוריבורד מובנה (במבי)
- [[sitcom-recreation]] — סצנה בסגנון סדרה קיימת ב-MiniMax H3 (cast + theme עקביים)
- [[openrouter-video-gen]] — יצירת קליפים דרך OpenRouter (the-video-man)
- [[video-editor]] — עריכה/הרכבה ב-ffmpeg: מעברים, מהירות, אודיו, ייצוא (the-video-man)
- [[kinetic-typography]] — טיפוגרפיה מונפשת ב-Remotion: keyframes פר-אות, 3D, טקסט מאחורי המוצר (the-video-man)
- [[cinematic-finish]] — גימור ברמת סוכנות: אפקטים בקוד + סאונד היברידי (MELT)
- [[scroll-relay]] — אתר שגולל בלפטופ + דקדוק relay/exploded/cadence (פענוח enky)
- [[surreal-product-ad-series]] — סדרת פרסומות 9:16 מ-brief: דיגיטלי→פיזי→טרנספורמציה→הירו (במבי)

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
- [[canva_designer]]
- [[presentation_builder]]
- [[spa-builder]]
- [[face-fidelity]]
- [[gemini-image-gen]]
- [[presentation-builder]]
