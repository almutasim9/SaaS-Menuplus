-- SaaS Plans & Subscriptions
-- Adds subscription-related columns to the restaurants table

ALTER TABLE public.restaurants
    ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'business')),
    ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'expired', 'cancelled')),
    ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS max_products INT DEFAULT 15,
    ADD COLUMN IF NOT EXISTS max_orders_per_month INT DEFAULT 50;

-- Comments
COMMENT ON COLUMN public.restaurants.subscription_plan IS 'Current subscription plan: free, pro, or business';
COMMENT ON COLUMN public.restaurants.subscription_status IS 'Subscription status: active, trial, expired, or cancelled';
COMMENT ON COLUMN public.restaurants.trial_ends_at IS 'When the trial period ends (default 14 days)';
COMMENT ON COLUMN public.restaurants.subscription_expires_at IS 'When the current paid subscription expires';
COMMENT ON COLUMN public.restaurants.max_products IS 'Maximum number of products allowed based on plan';
COMMENT ON COLUMN public.restaurants.max_orders_per_month IS 'Maximum number of orders per month based on plan';
