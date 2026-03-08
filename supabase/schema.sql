-- MenuPlus V1 Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- RESTAURANTS
-- ============================================
CREATE TABLE public.restaurants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_color TEXT DEFAULT '#10b981',
  logo_url TEXT,
  banner_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'owner',
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false,
  brand TEXT,
  vendor TEXT,
  collection TEXT,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  calories INT,
  prep_time_minutes INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCT VARIANTS & ADD-ONS
-- ============================================
CREATE TABLE public.product_variants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.product_addons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DELIVERY SETTINGS (ZONES & AREAS)
-- ============================================
CREATE TABLE public.delivery_zones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  zone_name TEXT NOT NULL,
  flat_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  free_delivery_threshold NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.delivery_areas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.delivery_zones(id) ON DELETE CASCADE,
  area_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKING HOURS
-- ============================================
CREATE TABLE public.working_hours (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME NOT NULL DEFAULT '09:00',
  close_time TIME NOT NULL DEFAULT '22:00',
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, day_of_week)
);
-- ============================================
-- COUPONS
-- ============================================
CREATE TABLE public.coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_delivery')),
  discount_value NUMERIC(10,2) NOT NULL,
  applies_to TEXT DEFAULT 'cart' CHECK (applies_to IN ('cart', 'product')),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  min_order NUMERIC(10,2),
  max_uses INT,
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_global BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, code)
);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  order_type TEXT NOT NULL DEFAULT 'delivery' CHECK (order_type IN ('dine_in', 'delivery', 'takeaway')),
  table_number TEXT,
  number_of_people INT,
  area_name TEXT,
  nearest_landmark TEXT,
  car_details TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  coupon_code TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'delivered', 'cancelled', 'completed', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Restaurants: owners can manage their own restaurant
CREATE POLICY "Owners can view their restaurant" ON public.restaurants FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners can update their restaurant" ON public.restaurants FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can insert restaurant" ON public.restaurants FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Public can view restaurants by slug" ON public.restaurants FOR SELECT USING (true);

-- Categories: restaurant owners can manage, public can read
CREATE POLICY "Owners can manage categories" ON public.categories FOR ALL USING (
  restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
);
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);

-- Products: restaurant owners can manage, public can read
CREATE POLICY "Owners can manage products" ON public.products FOR ALL USING (
  restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
);
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);

-- Product Variants
CREATE POLICY "Owners can manage product variants" ON public.product_variants FOR ALL USING (
  product_id IN (SELECT id FROM public.products WHERE restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()))
);
CREATE POLICY "Public can view product variants" ON public.product_variants FOR SELECT USING (true);

-- Product Addons
CREATE POLICY "Owners can manage product addons" ON public.product_addons FOR ALL USING (
  product_id IN (SELECT id FROM public.products WHERE restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()))
);
CREATE POLICY "Public can view product addons" ON public.product_addons FOR SELECT USING (true);


-- Delivery settings: restaurant owners can manage, public can read
CREATE POLICY "Owners can manage delivery zones" ON public.delivery_zones FOR ALL USING (
  restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
);
CREATE POLICY "Public can view delivery zones" ON public.delivery_zones FOR SELECT USING (true);

CREATE POLICY "Owners can manage delivery areas" ON public.delivery_areas FOR ALL USING (
  zone_id IN (SELECT id FROM public.delivery_zones WHERE restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()))
);
CREATE POLICY "Public can view delivery areas" ON public.delivery_areas FOR SELECT USING (true);

CREATE POLICY "Owners can manage working hours" ON public.working_hours FOR ALL USING (
  restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
);
CREATE POLICY "Public can view working hours" ON public.working_hours FOR SELECT USING (true);

-- Coupons: restaurant owners can manage, public can read active ones
CREATE POLICY "Owners can manage coupons" ON public.coupons FOR ALL USING (
  restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
);
CREATE POLICY "Public can view active coupons" ON public.coupons FOR SELECT USING (is_active = true);

-- Orders: restaurant owners can view/manage, public can insert
CREATE POLICY "Owners can view orders" ON public.orders FOR SELECT USING (
  restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
);
CREATE POLICY "Owners can update orders" ON public.orders FOR UPDATE USING (
  restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
);
CREATE POLICY "Public can create orders" ON public.orders FOR INSERT WITH CHECK (true);

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
