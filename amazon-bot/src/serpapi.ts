import type { Env, FreeShipping, Product } from "./types";

export const FREE_SHIPPING_MINIMUM = 49;

/**
 * מזהה משלוח חינם לישראל מתוך טקסט המשלוח.
 * אמאזון כותבת למשל: "FREE Shipping to Israel" או
 * "FREE Shipping to Israel when you spend over $49.00 on eligible items".
 */
export function detectFreeShipping(text: string): FreeShipping {
  const t = text.replace(/\s+/g, " ");
  if (!/free (shipping|delivery)/i.test(t)) return "none";
  // אם יש טקסט משלוח שמציין מדינה, היא חייבת להיות ישראל
  const mentionsCountry = /\bto [A-Z][a-z]+/.test(t);
  if (mentionsCountry && !/israel/i.test(t)) return "none";
  if (/(over|spend|orders? of|on orders?)[^.]*\$\s?\d/i.test(t)) return "free_over_49";
  return "free";
}

/** אוסף את כל טקסטי המשלוח מתוצאה, בלי להניח שם שדה מדויק */
export function collectDeliveryText(item: Record<string, unknown>): string {
  const parts: string[] = [];
  const visit = (v: unknown) => {
    if (typeof v === "string") parts.push(v);
    else if (Array.isArray(v)) v.forEach(visit);
    else if (v && typeof v === "object") Object.values(v).forEach(visit);
  };
  for (const [key, value] of Object.entries(item)) {
    if (/deliver|shipping|ship/i.test(key)) visit(value);
  }
  return parts.join(" · ");
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function normalizeResult(item: Record<string, unknown>): Product | null {
  const title = typeof item.title === "string" ? item.title : "";
  const link = typeof item.link_clean === "string" ? item.link_clean : typeof item.link === "string" ? item.link : "";
  if (!title || !link) return null;
  const deliveryText = collectDeliveryText(item);
  const price = toNumber(item.extracted_price ?? item.price);
  return {
    asin: typeof item.asin === "string" ? item.asin : link,
    title,
    link,
    price,
    priceText: price !== null ? `$${price.toFixed(2)}` : typeof item.price === "string" ? item.price : "—",
    rating: toNumber(item.rating),
    reviews: toNumber(item.reviews),
    shipping: detectFreeShipping(deliveryText),
    deliveryText,
  };
}

export class SerpApiError extends Error {}

/** חיפוש באמאזון דרך SerpApi. מחזיר גם את ה-JSON הגולמי לצורכי /debug */
export async function searchAmazon(env: Env, keywords: string): Promise<{ products: Product[]; raw: any }> {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "amazon");
  url.searchParams.set("amazon_domain", "amazon.com");
  url.searchParams.set("k", keywords);
  if (env.SHIPPING_LOCATION) url.searchParams.set("shipping_location", env.SHIPPING_LOCATION);
  url.searchParams.set("api_key", env.SERPAPI_KEY);

  const res = await fetch(url.toString());
  const raw: any = await res.json().catch(() => ({}));
  if (!res.ok || raw.error) {
    throw new SerpApiError(raw.error ?? `SerpApi HTTP ${res.status}`);
  }
  const items: Record<string, unknown>[] = Array.isArray(raw.organic_results) ? raw.organic_results : [];
  const products = items
    .filter((i) => !i.sponsored)
    .map(normalizeResult)
    .filter((p): p is Product => p !== null);
  return { products, raw };
}
