-- Add is_hidden column to categories table for visibility toggling
ALTER TABLE public.categories
    ADD COLUMN is_hidden BOOLEAN DEFAULT false;

-- Add a comment to the column
COMMENT ON COLUMN public.categories.is_hidden IS 'Whether the category is hidden from the public menu';
