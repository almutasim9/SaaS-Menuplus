-- Add the missing is_hidden column to the products table
-- Run this in the Supabase SQL Editor

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Force schema cache reload just in case
NOTIFY pgrst, 'reload schema';
