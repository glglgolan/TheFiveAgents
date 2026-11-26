import { FREE_SHIPPING_MINIMUM } from "./serpapi";
import type { CachedSearch, Product } from "./types";

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function shorten(s: string, max = 90): string {
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

function shippingLine(p: Product): string {
  if (p.shipping === "free") return "🚚 משלוח חינם לישראל";
  const missing = p.price !== null ? FREE_SHIPPING_MINIMUM - p.price : null;
  if (missing !== null && missing > 0) {
    return `🚚 משלוח חינם מעל ${FREE_SHIPPING_MINIMUM}$ — חסרים ${missing.toFixed(0)}$ בעגלה 💡`;
  }
  return `🚚 משלוח חינם לישראל (בהזמנה מעל ${FREE_SHIPPING_MINIMUM}$)`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/** הרשימה שמוצגת כרגע לפי מיון/סינון */
export function visibleProducts(s: CachedSearch): Product[] {
  let list = s.onlyNoMinimum ? s.products.filter((p) => p.shipping === "free") : [...s.products];
  if (s.sort === "price") list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  return list;
}

export function renderPage(s: CachedSearch, perPage: number): { text: string; hasMore: boolean } {
  const list = visibleProducts(s);
  const start = s.page * perPage;
  const page = list.slice(start, start + perPage);

  const lines: string[] = [`🔎 <b>${escapeHtml(s.title)}</b>`];
  if (page.length === 0) {
    lines.push("", "אין עוד תוצאות שמתאימות לסינון הזה.");
    return { text: lines.join("\n"), hasMore: false };
  }
  lines.push(`נמצאו ${list.length} מוצרים עם משלוח חינם לישראל${s.page > 0 ? ` · עמוד ${s.page + 1}` : ""}:`);

  page.forEach((p, i) => {
    const rating = p.rating !== null ? ` · ⭐ ${p.rating}${p.reviews !== null ? ` (${formatNumber(p.reviews)} ביקורות)` : ""}` : "";
    lines.push(
      "",
      `<b>${start + i + 1}. ${escapeHtml(shorten(p.title))}</b>`,
      `💲 ${escapeHtml(p.priceText)}${rating}`,
      shippingLine(p),
    );
    if (p.note) lines.push(`⚠️ ${escapeHtml(p.note)}`);
    lines.push(`🔗 <a href="${escapeHtml(p.link)}">לצפייה באמאזון</a>`);
  });

  lines.push("", "⏱️ משלוח לישראל לוקח כרגע כמה שבועות · כדאי לוודא את תווית המשלוח בעגלה");
  return { text: lines.join("\n"), hasMore: start + perPage < list.length };
}

export function keyboard(id: string, s: CachedSearch, hasMore: boolean) {
  const row: { text: string; callback_data: string }[] = [];
  if (hasMore) row.push({ text: "עוד תוצאות ⬇️", callback_data: `m:${id}` });
  row.push(
    s.sort === "price"
      ? { text: "מיון לפי התאמה", callback_data: `r:${id}` }
      : { text: "מיון לפי מחיר 💲", callback_data: `p:${id}` },
  );
  row.push(
    s.onlyNoMinimum
      ? { text: "הצג הכל", callback_data: `a:${id}` }
      : { text: "רק בלי מינימום", callback_data: `n:${id}` },
  );
  return { inline_keyboard: [row] };
}
