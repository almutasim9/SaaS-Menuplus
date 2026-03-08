-- ============================================
-- MenuPlus SaaS: Full Database Reset + Setup
-- ============================================
-- ⚠️ WARNING: This will DELETE ALL DATA!
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Clean all data (order matters due to foreign keys)
TRUNCATE TABLE public.order_items CASCADE;
TRUNCATE TABLE public.orders CASCADE;
TRUNCATE TABLE public.product_variants CASCADE;
TRUNCATE TABLE public.product_addons CASCADE;
TRUNCATE TABLE public.products CASCADE;
TRUNCATE TABLE public.categories CASCADE;
TRUNCATE TABLE public.coupons CASCADE;
TRUNCATE TABLE public.delivery_zones CASCADE;
TRUNCATE TABLE public.profiles CASCADE;
TRUNCATE TABLE public.restaurants CASCADE;

-- Step 2: Delete all auth users
DELETE FROM auth.users;

-- Step 3: Apply SaaS schema migrations
-- Subscription columns
ALTER TABLE public.restaurants
    ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'business')),
    ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'expired', 'cancelled')),
    ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS max_products INT DEFAULT 15,
    ADD COLUMN IF NOT EXISTS max_orders_per_month INT DEFAULT 50,
    ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE DEFAULT NULL;

-- Step 4: Ensure profiles table has the right trigger for auto-creation
-- This trigger creates a profile automatically when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'owner'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ✅ Done! Now:
-- 1. Go to your app and sign up with your admin email
-- 2. Then come back here and run the PROMOTE script below
-- ============================================
