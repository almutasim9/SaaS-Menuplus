-- ============================================
-- ADD SOFT DELETES TO CORE TABLES
-- ============================================

-- 1. Add deleted_at columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Update Public Read Policies to hide deleted items 
-- (Owners can still technically see them if we add a filter in the dashboard later, 
-- but for now public API should definitely ignore them)

-- Products
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (deleted_at IS NULL);

-- Categories
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (deleted_at IS NULL);

-- Coupons
DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
CREATE POLICY "Public can view active coupons" ON public.coupons FOR SELECT USING (is_active = true AND deleted_at IS NULL);
