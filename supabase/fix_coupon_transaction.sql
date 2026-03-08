-- ============================================
-- FUNCTION: apply_coupon_transaction
-- PURPOSE: Atomically applies a coupon and increments used_count
--          to prevent race conditions.
-- ============================================

CREATE OR REPLACE FUNCTION public.apply_coupon_transaction(p_coupon_code TEXT, p_restaurant_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_coupon RECORD;
BEGIN
  -- 1. Lock the specific coupon row for update to prevent concurrent access
  SELECT *
  INTO v_coupon
  FROM public.coupons
  WHERE code = p_coupon_code 
    AND restaurant_id = p_restaurant_id
    AND is_active = true
  FOR UPDATE;

  -- 2. If no active coupon found
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Coupon not found or inactive';
  END IF;

  -- 3. Check Expiry
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
    RAISE EXCEPTION 'Coupon is expired';
  END IF;

  -- 4. Check Limits
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
    RAISE EXCEPTION 'Coupon usage limit reached';
  END IF;

  -- 5. Increment Usage
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE id = v_coupon.id;

  -- 6. Return the coupon details as JSON
  RETURN row_to_json(v_coupon)::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
