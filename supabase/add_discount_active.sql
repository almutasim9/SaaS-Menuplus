ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_discount_active BOOLEAN DEFAULT false;
