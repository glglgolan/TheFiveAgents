import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { Env, Product } from "./types";

const FALLBACK_BETA = "server-side-fallback-2026-07-01";

function client(env: Env) {
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 25_000 });
}

/* ---------- שלב 1: פירוש הבקשה ---------- */

const SearchIntent = z.object({
  action: z.enum(["search", "clarify", "not_a_search"]),
  /** מילות חיפוש באנגלית לאמאזון */
  keywords: z.string(),
  max_price: z.number().nullable(),
  min_price: z.number().nullable(),
  /** דרישות שהמוצר חייב לעמוד בהן (צבע, תאימות, מידה...) — לסינון התוצאות */
  requirements: z.array(z.string()),
  /** כותרת קצרה בעברית לתשובה */
  title_he: z.string(),
  /** שאלת הבהרה בעברית, כש-action=clarify */
  question_he: z.string(),
});
export type SearchIntent = z.infer<typeof SearchIntent>;

const INTENT_SYSTEM = `You turn a family member's shopping request (usually Hebrew) into an Amazon.com search.
The bot only shows products with free shipping to Israel; you don't need to add that to the keywords.
- keywords: concise English Amazon search terms (product type + key attributes, no price).
- max_price/min_price: USD numbers if stated (convert ₪ to USD at ~3.7 ILS per USD), else null.
- requirements: hard constraints to verify against product titles (e.g. "skin/beige color", "compatible with Bambu Lab AMS", "1.75mm"). Empty if none.
- title_he: short Hebrew title for the reply, e.g. "אוזניות עם ביטול רעשים · עד 100$".
- action "clarify" only when the request is too vague to search (e.g. "something for mom"); then ask ONE short Hebrew question in question_he, suggesting 2-3 directions. Otherwise question_he is "".
- action "not_a_search" if the message isn't a product request; keywords "" then.`;

export async function parseIntent(env: Env, text: string): Promise<SearchIntent> {
  const response = await client(env).beta.messages.parse({
    model: env.CLAUDE_MODEL,
    max_tokens: 4000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(SearchIntent) },
    system: INTENT_SYSTEM,
    messages: [{ role: "user", content: text }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    return {
      action: "not_a_search", keywords: "", max_price: null, min_price: null,
      requirements: [], title_he: "", question_he: "",
    };
  }
  return response.parsed_output;
}

/* ---------- שלב 2: סינון ודירוג התוצאות ---------- */

const Ranking = z.object({
  picks: z.array(
    z.object({
      index: z.number().int(),
      /** הערה קצרה בעברית אם יש משהו שחשוב לדעת (אחרת "") */
      note_he: z.string(),
    }),
  ),
});

const RANK_SYSTEM = `You filter Amazon search results for a shopping request.
Keep only products that genuinely match the request and every requirement (wrong color, wrong size, accessories instead of the product, etc. must be dropped).
Order the kept ones best first, weighing relevance, rating, number of reviews and price.
note_he: at most one short Hebrew sentence when there's a caveat worth knowing (e.g. "סליל קרטון — ב-AMS עדיף מתאם"), else "".
Return at most 15 picks, using the given indices.`;

export async function rankProducts(env: Env, intent: SearchIntent, products: Product[]): Promise<Product[]> {
  if (products.length === 0) return [];
  const list = products
    .map((p, i) => `${i}. ${p.title} | ${p.priceText} | rating ${p.rating ?? "?"} (${p.reviews ?? "?"} reviews)`)
    .join("\n");
  const request =
    `Request: ${intent.keywords}\n` +
    `Requirements: ${intent.requirements.join("; ") || "none"}\n` +
    `Price range: ${intent.min_price ?? 0}-${intent.max_price ?? "any"} USD\n\nResults:\n${list}`;

  const response = await client(env).beta.messages.parse({
    model: env.CLAUDE_MODEL,
    max_tokens: 4000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(Ranking) },
    system: RANK_SYSTEM,
    messages: [{ role: "user", content: request }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) return products;

  const seen = new Set<number>();
  const ranked: Product[] = [];
  for (const pick of response.parsed_output.picks) {
    const p = products[pick.index];
    if (!p || seen.has(pick.index)) continue;
    seen.add(pick.index);
    ranked.push(pick.note_he ? { ...p, note: pick.note_he } : p);
  }
  return ranked;
}
