-- Add accept_out_of_zone_orders column to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS accept_out_of_zone_orders BOOLEAN DEFAULT false;
