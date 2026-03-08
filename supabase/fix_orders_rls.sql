-- Run this in your Supabase SQL Editor to fix the Orders RLS policies

-- Drop the old overly restrictive policy
DROP POLICY IF EXISTS "Owners can update orders" ON public.orders;

-- Create the new policy that checks if the authenticated user owns the restaurant the order belongs to
CREATE POLICY "Owners can update orders" ON public.orders FOR UPDATE USING (
  restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
);
