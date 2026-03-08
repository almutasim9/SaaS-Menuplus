-- Custom Domain Support
-- Adds custom_domain column to restaurants table for SaaS Business plan feature

ALTER TABLE public.restaurants
    ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE DEFAULT NULL;

COMMENT ON COLUMN public.restaurants.custom_domain IS 'Custom domain for the restaurant menu (Business plan only), e.g. menu.myrestaurant.com';
