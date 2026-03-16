-- Create table for restaurant-specific hidden locations
CREATE TABLE IF NOT EXISTS public.restaurant_hidden_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    master_location_id UUID NOT NULL REFERENCES public.master_locations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(restaurant_id, master_location_id)
);

-- Add index for fast exclusion lookups
CREATE INDEX IF NOT EXISTS idx_hidden_locations_restaurant ON public.restaurant_hidden_locations(restaurant_id);

-- Enable RLS
ALTER TABLE public.restaurant_hidden_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Restaurants can manage their own hidden locations
CREATE POLICY "Restaurants can manage their own hidden locations" 
ON public.restaurant_hidden_locations 
FOR ALL 
USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));
