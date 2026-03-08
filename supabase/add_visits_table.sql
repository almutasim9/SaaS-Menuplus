-- ============================================
-- VISITS TABLE (for tracking menu page visits)
-- ============================================
CREATE TABLE IF NOT EXISTS public.visits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'direct' CHECK (source IN ('qr', 'direct')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Public can insert visits (customers visiting the menu)
CREATE POLICY "Public can insert visits" ON public.visits
  FOR INSERT WITH CHECK (true);

-- Restaurant owners can read their visits
CREATE POLICY "Owners can view visits" ON public.visits
  FOR SELECT USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
  );

-- Create index for fast aggregation queries
CREATE INDEX IF NOT EXISTS idx_visits_restaurant_created
  ON public.visits (restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_visits_restaurant_source
  ON public.visits (restaurant_id, source);
