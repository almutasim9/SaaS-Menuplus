-- ============================================
-- ENHANCED SECURITY & RLS FIXES (V2)
-- ============================================

-- Ensure all necessary columns exist first
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- 1. Orders: Ensure restaurant_id exists and is valid on insert
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
CREATE POLICY "Public can create orders" ON public.orders 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id)
);

-- 2. Order Items: Ensure order_id exists on insert
-- Note: Check if table exists first as it was added in a separate migration
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_items') THEN
        DROP POLICY IF EXISTS "Public can create order items" ON public.order_items;
        CREATE POLICY "Public can create order items" ON public.order_items 
        FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM public.orders WHERE id = order_id)
        );
    END IF;
END $$;

-- 3. Categories: Ensure public can only view non-hidden, non-deleted categories
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories" ON public.categories 
FOR SELECT USING (
  (is_hidden = false OR is_hidden IS NULL) AND 
  (deleted_at IS NULL)
);

-- 4. Products: Ensure public can only view non-deleted, available products
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products 
FOR SELECT USING (
  is_available = true AND 
  (deleted_at IS NULL)
);

-- 5. Restaurants: Add subscription check helper (optional but good for RLS)
-- We can't easily block SELECT on restaurants based on status if we want to show 'Expired' UI,
-- but we could block Order insertion if the restaurant is expired.

DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
CREATE POLICY "Public can create orders" ON public.orders 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE id = restaurant_id 
    AND (subscription_status != 'expired' OR subscription_status IS NULL)
  )
);
