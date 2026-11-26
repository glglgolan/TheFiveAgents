# 🛒 בוט אמאזון משפחתי — משלוח חינם לישראל

בוט טלגרם שמחפש מוצרים באמאזון ומציג רק כאלה עם **משלוח חינם לישראל**.
רץ על Cloudflare Workers — עובד גם כשהמחשב כבוי.

**שלב 1 (כאן):** חיפוש לפי בקשה. **שלב 2 (בהמשך):** מעקב מחירים עם התראה.

## איך זה עובד

```
טלגרם ──webhook──▶ Cloudflare Worker
                      ├─ Claude: מפרש את הבקשה בעברית → מילות חיפוש + תקציב + דרישות
                      ├─ SerpApi: חיפוש ב-amazon.com עם shipping_location=IL
                      ├─ סינון: רק "FREE Shipping to Israel" + טווח מחיר
                      ├─ Claude: מסנן מוצרים לא מתאימים ומדרג
                      └─ KV: שומר תוצאות לכפתורים + מונה חיפושים חודשי
```

## שימוש בקבוצה

| מה כותבים | מה קורה |
|---|---|
| `/find אוזניות עם ביטול רעשים עד 100$` | חיפוש |
| `@שם_הבוט פילמנט ל-AMS בצבע skin עד 14$` | חיפוש |
| reply על הודעה של הבוט | ממשיך את השיחה (למשל תשובה לשאלת הבהרה) |
| `/quota` | כמה חיפושים נוצלו החודש |
| `/chatid` | מזהה הצ'אט (להגדרה) |
| `/debug <מילים>` | (מנהל בלבד) מציג את מבנה התשובה הגולמית מ-SerpApi |

כפתורים מתחת לתוצאות (**עוד תוצאות**, **מיון לפי מחיר**, **רק בלי מינימום**) עובדים על תוצאות שמורות — לא שורפים חיפוש.

## עלויות

| רכיב | עלות |
|---|---|
| Cloudflare Workers + KV | חינם (Free plan) |
| Telegram Bot API | חינם |
| SerpApi | חינם עד 250 חיפושים/חודש (הבוט עוצר בתקרה) |
| Claude API | 2 קריאות קצרות לחיפוש — בערך סנט-שניים לחיפוש |

💡 מומלץ להגדיר **spend limit** חודשי נמוך ב-Anthropic Console (למשל 5$).

## התקנה (פעם אחת, ~15 דקות)

### 1. צור את הבוט בטלגרם
1. ב-@BotFather: `/newbot` → שמור את ה-**token** ואת **שם המשתמש** של הבוט.
2. השאר את **Privacy Mode** דלוק (ברירת מחדל) — הבוט יראה רק פקודות, אזכורים ו-replies.

### 2. מפתחות
- **SerpApi:** הרשמה חינמית ב-serpapi.com → API key.
- **Anthropic:** console.anthropic.com → API key (+ spend limit).

### 3. Cloudflare
```bash
cd amazon-bot
npm install
npx wrangler login
npx wrangler kv namespace create BOT_KV     # הדבק את ה-id ב-wrangler.toml
```
ב-`wrangler.toml` עדכן גם את `BOT_USERNAME` (בלי @).

### 4. Secrets (לא נשמרים בקוד!)
```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET   # מחרוזת אקראית ארוכה, למשל: openssl rand -hex 32
npx wrangler secret put SERPAPI_KEY
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put ADMIN_USER_ID             # ה-user ID שלך בטלגרם (אפשר דרך @userinfobot)
npx wrangler secret put ALLOWED_CHAT_IDS          # בינתיים: 0
```

### 5. פריסה וחיבור
```bash
npx wrangler deploy                               # מדפיס את כתובת ה-Worker
TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... \
  bash scripts/set-webhook.sh https://amazon-israel-bot.<you>.workers.dev
```

### 6. הרשאת הקבוצה
1. הוסף את הבוט לקבוצה המשפחתית — הוא יכתוב את ה-chat ID ויצא (עדיין לא מורשה).
2. `npx wrangler secret put ALLOWED_CHAT_IDS` ← ה-ID של הקבוצה (ואפשר להוסיף בפסיק את הצ'אט הפרטי שלך).
3. הוסף את הבוט שוב לקבוצה. מוכן! ✅

### 7. בדיקה ראשונה (חשוב)
בצ'אט מורשה שלח `/debug filament` ובדוק:
- `results` גדול מ-0
- `delivery_samples` מכילים טקסט משלוח (למשל `FREE Shipping to Israel...`)

אם אין טקסט משלוח או אין תוצאות — כנראה שערך `SHIPPING_LOCATION` לא נכון. נסה ערך אחר ב-`wrangler.toml` (למשל `Israel`) ופרוס שוב.

## אבטחה
- הבוט עונה **רק** בצ'אטים שב-`ALLOWED_CHAT_IDS`; מקבוצה אחרת הוא יוצא.
- כל בקשה ל-Worker נבדקת מול `X-Telegram-Bot-Api-Secret-Token` — אי אפשר להתחזות לטלגרם.
- כל המפתחות הם Cloudflare secrets — לא בקוד ולא ב-git.
- תקרת חיפושים חודשית מגינה על מכסת SerpApi.

## פיתוח
```bash
npm test          # טסטים ללוגיקה (זיהוי משלוח, ניתוב הודעות, עיצוב)
npm run typecheck
```

## מגבלות ידועות
- **לא אומת מול SerpApi אמיתי:** שמות השדות בתשובה וערך `shipping_location` לישראל. הקוד קורא כל שדה שמכיל "delivery"/"shipping" כדי להיות עמיד, ו-`/debug` נועד לאמת.
- **Free plan של Workers:** מגבלת 10ms CPU לבקשה (זמן המתנה לרשת לא נספר). אם יופיעו שגיאות `exceeded CPU` בלוגים (`npx wrangler tail`) — Workers Paid עולה 5$/חודש.
- תנאי המשלוח של אמאזון לישראל משתנים — תמיד לוודא בעגלה.
