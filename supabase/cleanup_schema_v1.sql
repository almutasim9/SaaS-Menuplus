-- System Optimization Cleanup
-- Removes redundant and unused columns according to the audit report

-- 1. Remove unused boilerplate columns from products
ALTER TABLE public.products 
DROP COLUMN IF EXISTS brand,
DROP COLUMN IF EXISTS vendor,
DROP COLUMN IF EXISTS collection,
DROP COLUMN IF EXISTS calories,
DROP COLUMN IF EXISTS prep_time_minutes,
DROP COLUMN IF EXISTS tags;

-- 2. Remove redundant global free delivery flag from restaurants
-- (Logic should be handled via delivery_zones)
ALTER TABLE public.restaurants
DROP COLUMN IF EXISTS is_free_delivery;

-- 3. Remove redundant items JSONB from orders 
-- (Now using order_items table for item details)
-- WARNING: Ensure order_items table is fully populated for existing orders before running this in production.
-- For this Dev cleanup, we proceed as the code has been updated to use the join.
ALTER TABLE public.orders
DROP COLUMN IF EXISTS items;

-- 4. Clean up any other identified columns if any (optional)
-- ALTER TABLE public.restaurants DROP COLUMN IF EXISTS some_other_column;
