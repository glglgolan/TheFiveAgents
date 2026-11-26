import { parseIntent, rankProducts } from "./claude";
import { escapeHtml, keyboard, renderPage } from "./format";
import { countSearch, monthlyLimit, usedThisMonth } from "./quota";
import { searchAmazon, SerpApiError } from "./serpapi";
import { editMessage, sendMessage, tg } from "./telegram";
import type { CachedSearch, Env } from "./types";

const HELP = `👋 אני מחפש מוצרים באמאזון עם <b>משלוח חינם לישראל</b>.

איך לבקש:
• <code>/find אוזניות עם ביטול רעשים עד 100 דולר</code>
• או לתייג אותי: <code>@BOT פילמנט ל-AMS בצבע skin עד 14$</code>
• או לענות (reply) על הודעה שלי

פקודות: /quota — כמה חיפושים נשארו החודש · /chatid — מזהה הצ'אט`;

const SEARCH_TTL = 60 * 60 * 24 * 3; // 3 ימים לכפתורים
const CLARIFY_TTL = 60 * 60; // שעה לענות על שאלת הבהרה

/* ---------- עזרי ניתוב (נבדקים בטסטים) ---------- */

export function botIdFromToken(token: string): number {
  return parseInt(token.split(":")[0] ?? "0", 10);
}

export function allowedChats(env: Env): Set<number> {
  return new Set(
    (env.ALLOWED_CHAT_IDS ?? "")
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n)),
  );
}

/**
 * מחליט אם הודעה מיועדת לבוט ומחלץ ממנה את הבקשה.
 * בצ'אט פרטי — כל הודעה. בקבוצה — פקודה, אזכור, או reply להודעה של הבוט.
 */
export function extractRequest(
  msg: any,
  botUsername: string,
  botId: number,
): { command: string | null; text: string; replyToBot: boolean } | null {
  const raw: string = (msg.text ?? "").trim();
  if (!raw) return null;
  const isPrivate = msg.chat?.type === "private";
  const replyToBot = msg.reply_to_message?.from?.id === botId;

  const cmd = raw.match(/^\/([a-z_]+)(?:@(\w+))?(?:\s+([\s\S]*))?$/i);
  if (cmd) {
    const target = cmd[2];
    if (target && target.toLowerCase() !== botUsername.toLowerCase()) return null; // פקודה לבוט אחר
    return { command: cmd[1].toLowerCase(), text: (cmd[3] ?? "").trim(), replyToBot };
  }

  const mention = new RegExp(`@${botUsername}\\b`, "i");
  if (mention.test(raw)) return { command: null, text: raw.replace(mention, "").trim(), replyToBot };
  if (replyToBot || isPrivate) return { command: null, text: raw, replyToBot };
  return null;
}

/* ---------- חיפוש ---------- */

async function handleSearch(env: Env, chatId: number, replyTo: number, text: string) {
  if (!text) {
    await sendMessage(env, chatId, "מה לחפש? לדוגמה: <code>/find מטען USB-C מהיר עד 30$</code>", { replyTo });
    return;
  }
  const limit = monthlyLimit(env);
  if ((await usedThisMonth(env)) >= limit) {
    await sendMessage(env, chatId, `😕 נגמרו ${limit} החיפושים של החודש. המכסה מתאפסת ב-1 לחודש.`, { replyTo });
    return;
  }
  await tg(env, "sendChatAction", { chat_id: chatId, action: "typing" });

  const intent = await parseIntent(env, text);
  if (intent.action === "not_a_search" || !intent.keywords) {
    await sendMessage(env, chatId, HELP.replace("@BOT", `@${env.BOT_USERNAME}`), { replyTo });
    return;
  }
  if (intent.action === "clarify") {
    const sent = await sendMessage(env, chatId, `🤔 ${escapeHtml(intent.question_he)}\n\n<i>ענו על ההודעה הזו (reply)</i>`, { replyTo });
    if (sent?.message_id) {
      await env.BOT_KV.put(`clarify:${chatId}:${sent.message_id}`, text, { expirationTtl: CLARIFY_TTL });
    }
    return;
  }

  const { products } = await searchAmazon(env, intent.keywords);
  const used = await countSearch(env);

  const candidates = products.filter(
    (p) =>
      p.shipping !== "none" &&
      (intent.max_price === null || p.price === null || p.price <= intent.max_price) &&
      (intent.min_price === null || p.price === null || p.price >= intent.min_price),
  );
  const ranked = await rankProducts(env, intent, candidates);

  if (ranked.length === 0) {
    await sendMessage(
      env,
      chatId,
      `🔎 <b>${escapeHtml(intent.title_he)}</b>\n\nלא מצאתי מוצרים מתאימים עם משלוח חינם לישראל 😕\nאפשר לנסות ניסוח אחר או תקציב גבוה יותר.`,
      { replyTo },
    );
    return;
  }

  const id = crypto.randomUUID().slice(0, 8);
  const search: CachedSearch = { title: intent.title_he, products: ranked, page: 0, sort: "relevance", onlyNoMinimum: false };
  await env.BOT_KV.put(`search:${id}`, JSON.stringify(search), { expirationTtl: SEARCH_TTL });

  const perPage = parseInt(env.RESULTS_PER_PAGE || "5", 10);
  const { text: body, hasMore } = renderPage(search, perPage);
  const remaining = limit - used;
  const warn = remaining <= 25 ? `\n\n⚠️ נשארו ${remaining} חיפושים החודש` : "";
  await sendMessage(env, chatId, body + warn, { replyTo, keyboard: keyboard(id, search, hasMore) });
}

/* ---------- כפתורים ---------- */

async function handleCallback(env: Env, cq: any) {
  const chatId: number | undefined = cq.message?.chat?.id;
  const answer = (text?: string) => tg(env, "answerCallbackQuery", { callback_query_id: cq.id, ...(text ? { text } : {}) });
  if (!chatId || !allowedChats(env).has(chatId)) return answer();

  const [action, id] = String(cq.data ?? "").split(":");
  const stored = await env.BOT_KV.get(`search:${id}`);
  if (!stored) return answer("התוצאות פגו — חפשו שוב 🙂");
  const s: CachedSearch = JSON.parse(stored);

  if (action === "m") s.page += 1;
  else if (action === "p") { s.sort = "price"; s.page = 0; }
  else if (action === "r") { s.sort = "relevance"; s.page = 0; }
  else if (action === "n") { s.onlyNoMinimum = true; s.page = 0; }
  else if (action === "a") { s.onlyNoMinimum = false; s.page = 0; }

  await env.BOT_KV.put(`search:${id}`, JSON.stringify(s), { expirationTtl: SEARCH_TTL });
  const { text, hasMore } = renderPage(s, parseInt(env.RESULTS_PER_PAGE || "5", 10));
  await editMessage(env, chatId, cq.message.message_id, text, keyboard(id, s, hasMore));
  return answer();
}

/* ---------- הודעות ---------- */

async function handleMessage(env: Env, msg: any) {
  const chatId: number = msg.chat.id;
  const botId = botIdFromToken(env.TELEGRAM_BOT_TOKEN);
  const req = extractRequest(msg, env.BOT_USERNAME, botId);

  // הבוט נוסף לקבוצה שלא ברשימה → מודיע ויוצא
  const addedMe = (msg.new_chat_members ?? []).some((m: any) => m.id === botId);
  if (!allowedChats(env).has(chatId)) {
    if (req?.command === "chatid" || req?.command === "start" || addedMe) {
      await sendMessage(env, chatId, `ה-chat ID כאן הוא <code>${chatId}</code>.\nהבוט עדיין לא מורשה לצ'אט הזה.`);
      if (msg.chat.type !== "private") await tg(env, "leaveChat", { chat_id: chatId });
    }
    return;
  }
  if (!req) return;

  switch (req.command) {
    case "start":
    case "help":
      return sendMessage(env, chatId, HELP.replace("@BOT", `@${env.BOT_USERNAME}`));
    case "chatid":
      return sendMessage(env, chatId, `chat ID: <code>${chatId}</code>`);
    case "quota": {
      const used = await usedThisMonth(env);
      return sendMessage(env, chatId, `📊 השתמשנו ב-${used} מתוך ${monthlyLimit(env)} חיפושים החודש.`);
    }
    case "debug": {
      if (String(msg.from?.id) !== env.ADMIN_USER_ID) return;
      const { products, raw } = await searchAmazon(env, req.text || "filament");
      await countSearch(env);
      const first = raw.organic_results?.[0] ?? {};
      const info = {
        shipping_location: env.SHIPPING_LOCATION,
        results: raw.organic_results?.length ?? 0,
        first_result_keys: Object.keys(first),
        delivery_samples: products.slice(0, 5).map((p) => [p.shipping, p.deliveryText]),
      };
      return sendMessage(env, chatId, `<pre>${JSON.stringify(info, null, 2).replace(/</g, "&lt;")}</pre>`);
    }
    case "find":
    case "search":
    case null:
      break;
    default:
      return; // פקודה לא מוכרת — מתעלמים
  }

  // תשובה לשאלת הבהרה → מצרפים את הבקשה המקורית
  let text = req.text;
  if (req.replyToBot && msg.reply_to_message?.message_id) {
    const original = await env.BOT_KV.get(`clarify:${chatId}:${msg.reply_to_message.message_id}`);
    if (original) text = `${original}\n(הבהרה: ${text})`;
  }
  await handleSearch(env, chatId, msg.message_id, text);
}

async function handleUpdate(env: Env, update: any) {
  const chatId = update.message?.chat?.id ?? update.callback_query?.message?.chat?.id;
  try {
    if (update.callback_query) await handleCallback(env, update.callback_query);
    else if (update.message) await handleMessage(env, update.message);
  } catch (err) {
    console.error("update failed", err);
    if (chatId && allowedChats(env).has(chatId)) {
      const why = err instanceof SerpApiError ? "שירות החיפוש לא זמין כרגע" : "משהו השתבש";
      await sendMessage(env, chatId, `😕 ${why}. נסו שוב בעוד כמה דקות.`).catch(() => {});
    }
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/webhook") {
      return new Response("ok");
    }
    // רק טלגרם יודעת את הסוד שהוגדר ב-setWebhook
    if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.TELEGRAM_WEBHOOK_SECRET) {
      return new Response("forbidden", { status: 403 });
    }
    const update = await request.json();
    // עונים מיד לטלגרם (כדי שלא תשלח שוב), ומעבדים ברקע
    ctx.waitUntil(handleUpdate(env, update));
    return new Response("ok");
  },
};
