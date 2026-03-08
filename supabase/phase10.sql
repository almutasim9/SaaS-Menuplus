-- Phase 10: Enhance Products with Meta-fields

ALTER TABLE public.products
ADD COLUMN brand TEXT,
ADD COLUMN vendor TEXT,
ADD COLUMN collection TEXT,
ADD COLUMN tags TEXT[] DEFAULT '{}'::TEXT[],
ADD COLUMN calories INT,
ADD COLUMN prep_time_minutes INT;
