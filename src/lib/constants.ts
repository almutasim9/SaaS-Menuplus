export const MAX_PRICE = 10_000_000;

export const RATE_LIMITS = {
  IP_ORDERS_PER_15_MIN: 5,
  PHONE_ORDERS_PER_2_MIN: 2,
  PUBLIC_API_PER_MIN: 30,
} as const;

export const IMAGE_CONSTRAINTS = {
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"] as const,
} as const;
