import { describe, expect, it } from "vitest";
import { detectFreeShipping, normalizeResult } from "../src/serpapi";
import { extractRequest, botIdFromToken } from "../src/index";
import { renderPage, keyboard, visibleProducts } from "../src/format";
import type { CachedSearch, Product } from "../src/types";

describe("detectFreeShipping", () => {
  it("free to Israel", () => {
    expect(detectFreeShipping("FREE Shipping to Israel")).toBe("free");
  });
  it("free over $49", () => {
    expect(detectFreeShipping("FREE Shipping to Israel when you spend over $49.00 on eligible items")).toBe("free_over_49");
  });
  it("paid shipping", () => {
    expect(detectFreeShipping("$12.99 shipping to Israel")).toBe("none");
  });
  it("free shipping to another country is not free to Israel", () => {
    expect(detectFreeShipping("FREE Shipping to Canada")).toBe("none");
  });
  it("generic free delivery (with shipping_location filter) counts", () => {
    expect(detectFreeShipping("FREE delivery Fri, Dec 12")).toBe("free");
  });
  it("empty", () => {
    expect(detectFreeShipping("")).toBe("none");
  });
});

describe("normalizeResult", () => {
  it("reads common SerpApi fields and any delivery-like key", () => {
    const p = normalizeResult({
      asin: "B0TEST",
      title: "PLA Filament 1.75mm Skin",
      link: "https://www.amazon.com/dp/B0TEST",
      extracted_price: 12.99,
      rating: 4.6,
      reviews: 1234,
      delivery: ["FREE Shipping to Israel when you spend over $49.00"],
    })!;
    expect(p.price).toBe(12.99);
    expect(p.shipping).toBe("free_over_49");
    expect(p.reviews).toBe(1234);
  });
  it("drops items with no title/link", () => {
    expect(normalizeResult({ price: "$3" })).toBeNull();
  });
});

describe("extractRequest", () => {
  const botId = botIdFromToken("12345:ABC");
  const group = { id: -100, type: "supergroup" };

  it("ignores regular group chatter", () => {
    expect(extractRequest({ text: "מה נשמע?", chat: group }, "MyBot", botId)).toBeNull();
  });
  it("handles /find with @bot suffix", () => {
    expect(extractRequest({ text: "/find@MyBot אוזניות", chat: group }, "MyBot", botId)).toMatchObject({
      command: "find",
      text: "אוזניות",
    });
  });
  it("ignores commands addressed to another bot", () => {
    expect(extractRequest({ text: "/find@OtherBot x", chat: group }, "MyBot", botId)).toBeNull();
  });
  it("handles a mention", () => {
    expect(extractRequest({ text: "@mybot פילמנט skin עד 14$", chat: group }, "MyBot", botId)).toMatchObject({
      command: null,
      text: "פילמנט skin עד 14$",
    });
  });
  it("handles a reply to the bot", () => {
    const msg = { text: "לאמא, בישול", chat: group, reply_to_message: { from: { id: 12345 } } };
    expect(extractRequest(msg, "MyBot", botId)).toMatchObject({ replyToBot: true, text: "לאמא, בישול" });
  });
  it("private chat: every message counts", () => {
    expect(extractRequest({ text: "מטען", chat: { id: 1, type: "private" } }, "MyBot", botId)).toMatchObject({ text: "מטען" });
  });
});

describe("renderPage", () => {
  const mk = (i: number, price: number, shipping: Product["shipping"]): Product => ({
    asin: `A${i}`, title: `Product <${i}>`, link: `https://amazon.com/dp/A${i}`, price,
    priceText: `$${price.toFixed(2)}`, rating: 4.5, reviews: 100, shipping, deliveryText: "",
  });
  const s: CachedSearch = {
    title: "בדיקה",
    products: [mk(1, 60, "free"), mk(2, 10, "free_over_49"), mk(3, 30, "free"), mk(4, 5, "free"), mk(5, 7, "free"), mk(6, 8, "free")],
    page: 0, sort: "relevance", onlyNoMinimum: false,
  };

  it("escapes HTML, shows missing amount, paginates", () => {
    const { text, hasMore } = renderPage(s, 5);
    expect(text).toContain("Product &lt;1&gt;");
    expect(text).toContain("חסרים 39$");
    expect(hasMore).toBe(true);
    expect(keyboard("abc", s, hasMore).inline_keyboard[0][0].callback_data).toBe("m:abc");
  });
  it("sorts by price and filters no-minimum", () => {
    expect(visibleProducts({ ...s, sort: "price" }).map((p) => p.price)).toEqual([5, 7, 8, 10, 30, 60]);
    expect(visibleProducts({ ...s, onlyNoMinimum: true }).some((p) => p.shipping !== "free")).toBe(false);
  });
});
