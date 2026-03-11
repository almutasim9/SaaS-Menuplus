-- Create product_availability table
CREATE TABLE IF NOT EXISTS public.product_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time TIME NOT NULL DEFAULT '00:00:00',
    close_time TIME NOT NULL DEFAULT '23:59:59',
    is_available_all_day BOOLEAN DEFAULT FALSE,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.product_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public products availability are viewable by everyone" 
ON public.product_availability FOR SELECT 
USING (true);

CREATE POLICY "Owners can manage their products availability" 
ON public.product_availability FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.products p
        JOIN public.restaurants r ON p.restaurant_id = r.id
        WHERE p.id = product_availability.product_id
        AND r.owner_id = auth.uid()
    )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_product_availability_product_id ON public.product_availability(product_id);
