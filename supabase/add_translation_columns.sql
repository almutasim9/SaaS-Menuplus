-- Add translation columns for Categories
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS name_en text,
ADD COLUMN IF NOT EXISTS name_ku text;

-- Add translation columns for Products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS name_en text,
ADD COLUMN IF NOT EXISTS name_ku text,
ADD COLUMN IF NOT EXISTS description_en text,
ADD COLUMN IF NOT EXISTS description_ku text;

-- Add translation columns for Product Variants
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS name_en text,
ADD COLUMN IF NOT EXISTS name_ku text;

-- Add translation columns for Product Addons
ALTER TABLE public.product_addons 
ADD COLUMN IF NOT EXISTS name_en text,
ADD COLUMN IF NOT EXISTS name_ku text;
