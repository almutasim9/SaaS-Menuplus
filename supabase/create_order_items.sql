-- ============================================
-- CREATE ORDER ITEMS TABLE FOR ANALYTICS
-- ============================================

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  item_name TEXT NOT NULL,
  variant_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Owners can view order items for their restaurants
CREATE POLICY "Owners can view order items" ON public.order_items FOR SELECT USING (
  order_id IN (SELECT id FROM public.orders WHERE restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()))
);

-- Public can insert order items (when placing an order)
CREATE POLICY "Public can create order items" ON public.order_items FOR INSERT WITH CHECK (true);
