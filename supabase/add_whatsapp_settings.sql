-- Add WhatsApp configuration columns to the restaurants table
ALTER TABLE public.restaurants
    ADD COLUMN whatsapp_number TEXT DEFAULT NULL,
    ADD COLUMN is_whatsapp_ordering_enabled BOOLEAN DEFAULT false;

-- Add helpful comments to the columns
COMMENT ON COLUMN public.restaurants.whatsapp_number IS 'The WhatsApp Business number for receiving orders (e.g., +1234567890)';
COMMENT ON COLUMN public.restaurants.is_whatsapp_ordering_enabled IS 'Toggle to enable/disable the WhatsApp checkout flow on the public storefront';
