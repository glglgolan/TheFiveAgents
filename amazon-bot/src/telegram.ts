import type { Env } from "./types";

export async function tg(env: Env, method: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json: any = await res.json().catch(() => ({}));
  if (!json.ok) console.error(`telegram ${method} failed`, json.description);
  return json.result;
}

export function sendMessage(
  env: Env,
  chatId: number,
  text: string,
  opts: { replyTo?: number; keyboard?: unknown } = {},
) {
  return tg(env, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...(opts.replyTo ? { reply_parameters: { message_id: opts.replyTo, allow_sending_without_reply: true } } : {}),
    ...(opts.keyboard ? { reply_markup: opts.keyboard } : {}),
  });
}

export function editMessage(env: Env, chatId: number, messageId: number, text: string, keyboard?: unknown) {
  return tg(env, "editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...(keyboard ? { reply_markup: keyboard } : {}),
  });
}
