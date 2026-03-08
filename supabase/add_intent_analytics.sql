-- Add view_count to products table
ALTER TABLE "public"."products"
ADD COLUMN IF NOT EXISTS "view_count" INT DEFAULT 0;

-- Create atomic RPC function to increment product view without race conditions
CREATE OR REPLACE FUNCTION increment_product_view(p_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE "public"."products"
    SET "view_count" = COALESCE("view_count", 0) + 1
    WHERE "id" = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
