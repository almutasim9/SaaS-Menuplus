-- Add order type toggles to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS is_dine_in_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS is_takeaway_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS is_delivery_enabled BOOLEAN NOT NULL DEFAULT true;
