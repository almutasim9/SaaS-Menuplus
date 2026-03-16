-- Add location tracking to restaurants
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS governorate TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS city TEXT;

-- Master table for Governorates (Cities in Excel)
CREATE TABLE IF NOT EXISTS public.master_governorates (
    id UUID PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    name_ku TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Master table for Areas (Districts in Excel)
CREATE TABLE IF NOT EXISTS public.master_locations (
    id UUID PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    name_ku TEXT,
    governorate_id UUID REFERENCES public.master_governorates(id),
    governorate_name_ar TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_master_locations_governorate_name_ar ON public.master_locations(governorate_name_ar);
CREATE INDEX IF NOT EXISTS idx_master_locations_governorate_id ON public.master_locations(governorate_id);

-- RLS Policies (Public read access)
ALTER TABLE public.master_governorates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on governorates" ON public.master_governorates;
CREATE POLICY "Allow public read on governorates" ON public.master_governorates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on locations" ON public.master_locations;
CREATE POLICY "Allow public read on locations" ON public.master_locations FOR SELECT USING (true);
