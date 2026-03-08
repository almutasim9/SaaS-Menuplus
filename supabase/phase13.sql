-- Migration for Categories UI Enhancements
-- Phase 13: Unique Category Names per Restaurant

-- 1. Add unique constraint to prevent duplicate category names within the same restaurant
ALTER TABLE public.categories
ADD CONSTRAINT unique_category_name_per_restaurant UNIQUE (restaurant_id, name);
