-- Migration: Add restaurant_addons table for the Add-ons Module System

CREATE TABLE IF NOT EXISTS restaurant_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  addon_key TEXT NOT NULL CHECK (addon_key IN ('discounts', 'advanced_delivery', 'analytics_pro', 'custom_branding', 'custom_domain')),
  is_active BOOLEAN NOT NULL DEFAULT false,
  price_monthly DECIMAL(10,2) NOT NULL,
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  activated_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(restaurant_id, addon_key)
);

-- Enable RLS
ALTER TABLE restaurant_addons ENABLE ROW LEVEL SECURITY;

-- Restaurant owners can read their own add-ons
CREATE POLICY "Restaurants can view own addons" ON restaurant_addons
  FOR SELECT USING (restaurant_id IN (
    SELECT id FROM restaurants WHERE owner_id = auth.uid()
  ));

-- Super admin can manage all add-ons
CREATE POLICY "Super admin can manage addons" ON restaurant_addons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Index for fast active addon lookups
CREATE INDEX IF NOT EXISTS idx_restaurant_addons_lookup
  ON restaurant_addons(restaurant_id, addon_key)
  WHERE is_active = true;

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_restaurant_addons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER restaurant_addons_updated_at
  BEFORE UPDATE ON restaurant_addons
  FOR EACH ROW EXECUTE FUNCTION update_restaurant_addons_updated_at();
