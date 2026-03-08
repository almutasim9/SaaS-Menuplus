-- ============================================
-- SQL PHASE: SMART INVENTORY (Add Stock Count)
-- ============================================

-- 1. Add stock_count to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_count INT DEFAULT NULL;

-- 2. Create RPC for atomic stock decrementing during orders
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id UUID, p_quantity INT)
RETURNS JSONB AS $$
DECLARE
  v_product RECORD;
BEGIN
  -- Lock the specific product row for update to prevent concurrent access
  SELECT *
  INTO v_product
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  -- If no active product found
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product % not found', p_product_id;
  END IF;

  -- Check if stock is managed (not null)
  IF v_product.stock_count IS NOT NULL THEN
    -- Check limits
    IF v_product.stock_count < p_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %. Available: %', v_product.name, v_product.stock_count;
    END IF;

    -- Decrement Usage
    UPDATE public.products
    SET stock_count = stock_count - p_quantity
    WHERE id = p_product_id;
  END IF;

  -- Return the product details as JSON
  RETURN row_to_json(v_product)::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
