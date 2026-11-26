import type { Env } from "./types";

function monthKey(now = new Date()): string {
  return `quota:${now.toISOString().slice(0, 7)}`;
}

export async function usedThisMonth(env: Env): Promise<number> {
  return parseInt((await env.BOT_KV.get(monthKey())) ?? "0", 10);
}

export function monthlyLimit(env: Env): number {
  return parseInt(env.MONTHLY_SEARCH_LIMIT || "250", 10);
}

/** סופר חיפוש אחד. KV לא אטומי — מספיק טוב לבוט משפחתי */
export async function countSearch(env: Env): Promise<number> {
  const used = (await usedThisMonth(env)) + 1;
  await env.BOT_KV.put(monthKey(), String(used), { expirationTtl: 60 * 60 * 24 * 40 });
  return used;
}
