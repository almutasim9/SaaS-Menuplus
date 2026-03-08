-- Migration for Appearance Customization
-- Phase 15: Add theme_settings to restaurants

-- 1. Add the theme_settings JSONB column
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS theme_settings JSONB DEFAULT '{
  "secondary_color": "#ffffff",
  "theme_mode": "system",
  "layout_products": "grid",
  "layout_categories": "pills",
  "font_family": "cairo",
  "show_search": true,
  "welcome_message": "",
  "favicon_url": null,
  "default_product_image": null
}'::jsonb;
