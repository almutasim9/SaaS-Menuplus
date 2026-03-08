-- Phase 12: Restaurant Social Links

ALTER TABLE public.restaurants
ADD COLUMN social_links JSONB DEFAULT '{}'::jsonb;
