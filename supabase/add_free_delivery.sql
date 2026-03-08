ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS is_free_delivery BOOLEAN DEFAULT false;
