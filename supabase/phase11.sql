-- Phase 11: Free Delivery and Global Coupons

ALTER TABLE public.coupons
ADD COLUMN is_global BOOLEAN DEFAULT false;

-- Drop the old exact check constraint on discount_type
ALTER TABLE public.coupons DROP CONSTRAINT coupons_discount_type_check;

-- Add new constraint with free_delivery
ALTER TABLE public.coupons 
ADD CONSTRAINT coupons_discount_type_check 
CHECK (discount_type IN ('percentage', 'fixed', 'free_delivery'));
