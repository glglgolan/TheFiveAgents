export interface Env {
  BOT_KV: KVNamespace;
  BOT_USERNAME: string;
  MONTHLY_SEARCH_LIMIT: string;
  SHIPPING_LOCATION: string;
  CLAUDE_MODEL: string;
  RESULTS_PER_PAGE: string;
  // secrets
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  SERPAPI_KEY: string;
  ANTHROPIC_API_KEY: string;
  ALLOWED_CHAT_IDS: string;
  ADMIN_USER_ID?: string;
}

/** סטטוס משלוח חינם לישראל כפי שזוהה מטקסט המשלוח של אמאזון */
export type FreeShipping = "free" | "free_over_49" | "none";

export interface Product {
  asin: string;
  title: string;
  link: string;
  price: number | null;
  priceText: string;
  rating: number | null;
  reviews: number | null;
  shipping: FreeShipping;
  deliveryText: string;
  note?: string;
}

/** תוצאות חיפוש שנשמרות ב-KV כדי שהכפתורים לא יעלו חיפוש נוסף */
export interface CachedSearch {
  title: string;
  products: Product[];
  page: number;
  sort: "relevance" | "price";
  onlyNoMinimum: boolean;
}
