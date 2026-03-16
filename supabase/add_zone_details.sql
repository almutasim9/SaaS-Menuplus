-- Add estimated_delivery_time and min_order_amount to delivery_zones
ALTER TABLE delivery_zones 
ADD COLUMN IF NOT EXISTS estimated_delivery_time TEXT,
ADD COLUMN IF NOT EXISTS min_order_amount DECIMAL(12, 2) DEFAULT 0;

-- Optional: Add comments for clarity
COMMENT ON COLUMN delivery_zones.estimated_delivery_time IS 'Estimated time for delivery in this zone (e.g., 30-45 min)';
COMMENT ON COLUMN delivery_zones.min_order_amount IS 'Minimum order subtotal required for delivery to this zone';
