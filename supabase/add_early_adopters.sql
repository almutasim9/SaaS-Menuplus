-- Migration: Add early adopter fields to restaurants table

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS is_early_adopter BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS early_adopter_at TIMESTAMPTZ;

-- Index for fast early adopter queries
CREATE INDEX IF NOT EXISTS idx_restaurants_early_adopter
  ON restaurants(is_early_adopter)
  WHERE is_early_adopter = true;
