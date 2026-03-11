-- ============================================
-- MenuPlus: Database Cleanup Script
-- Purpose: Remove accidental/foreign system elements
-- Date: 2026-03-10
-- ============================================

-- 1. DROP REDUNDANT TABLES
-- --------------------------------------------
-- This is a duplicate of the 'delivery_zones' table
DROP TABLE IF EXISTS public.delivery_settings CASCADE;

-- Not used in the current MenuPlus codebase (No Firebase dependencies)
DROP TABLE IF EXISTS public.fcm_tokens CASCADE;


-- 2. REMOVE UNUSED COLUMNS IN PRODUCTS
-- --------------------------------------------
-- These retail-centric and unreferenced columns are being removed to clean up the schema
ALTER TABLE public.products 
    DROP COLUMN IF EXISTS brand,
    DROP COLUMN IF EXISTS vendor,
    DROP COLUMN IF EXISTS collection,
    DROP COLUMN IF EXISTS tags,
    DROP COLUMN IF EXISTS calories,
    DROP COLUMN IF EXISTS prep_time_minutes,
    DROP COLUMN IF EXISTS stock_count,
    DROP COLUMN IF EXISTS view_count;


-- 3. DROP UNUSED FUNCTIONS
-- --------------------------------------------
DROP FUNCTION IF EXISTS increment_product_view(UUID);

-- ============================================
-- ✅ Cleanup Complete
-- ============================================
