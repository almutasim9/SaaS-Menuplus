-- Add out-of-zone minimum order setting to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS out_of_zone_min_order NUMERIC DEFAULT 0;
