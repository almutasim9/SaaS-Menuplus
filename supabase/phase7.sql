-- Run this in your Supabase SQL Editor to create the Variants and Add-ons tables:

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_addons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_addons ENABLE ROW LEVEL SECURITY;

-- Product Variants RLS
CREATE POLICY "Owners can manage product variants" ON public.product_variants FOR ALL USING (
  product_id IN (SELECT id FROM public.products WHERE restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()))
);
CREATE POLICY "Public can view product variants" ON public.product_variants FOR SELECT USING (true);

-- Product Addons RLS
CREATE POLICY "Owners can manage product addons" ON public.product_addons FOR ALL USING (
  product_id IN (SELECT id FROM public.products WHERE restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()))
);
CREATE POLICY "Public can view product addons" ON public.product_addons FOR SELECT USING (true);
