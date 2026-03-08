-- Fix RLS Policies for Delivery Zones and Areas
-- The previous policies lacked a WITH CHECK clause, preventing new INSERTS

-- 1. Fix delivery_zones table
DROP POLICY IF EXISTS "Owners can manage delivery zones" ON public.delivery_zones;

CREATE POLICY "Owners can manage delivery zones" 
ON public.delivery_zones FOR ALL 
USING (
  restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
) 
WITH CHECK (
  restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
);

-- 2. Fix delivery_areas table
DROP POLICY IF EXISTS "Owners can manage delivery areas" ON public.delivery_areas;

CREATE POLICY "Owners can manage delivery areas" 
ON public.delivery_areas FOR ALL 
USING (
  zone_id IN (
    SELECT id FROM public.delivery_zones 
    WHERE restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
  )
) 
WITH CHECK (
  zone_id IN (
    SELECT id FROM public.delivery_zones 
    WHERE restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
  )
);
