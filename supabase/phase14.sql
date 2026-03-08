-- Migration for Unified Menu Management
-- Phase 14: Product Ordering

-- 1. Add sort_order to products table
ALTER TABLE public.products
ADD COLUMN sort_order INT NOT NULL DEFAULT 0;
