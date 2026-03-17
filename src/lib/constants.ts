export const MAX_PRICE = 10_000_000;

export type PlanType = "free" | "pro" | "business";

export const PLAN_LIMITS: Record<PlanType, { max_products: number; max_orders_per_month: number; max_coupons: number }> = {
    free:     { max_products: 15,     max_orders_per_month: 50,     max_coupons: 3 },
    business: { max_products: 100,    max_orders_per_month: 500,    max_coupons: 20 },
    pro:      { max_products: 999999, max_orders_per_month: 999999, max_coupons: 999999 },
} as const;

export const RATE_LIMITS = {
  IP_ORDERS_PER_15_MIN: 5,
  PHONE_ORDERS_PER_2_MIN: 2,
  PUBLIC_API_PER_MIN: 30,
} as const;

export const IMAGE_CONSTRAINTS = {
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"] as const,
} as const;
