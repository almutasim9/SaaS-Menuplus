-- Add Admin Announcements Table
-- Allows platform admins to send global messages to all restaurant owners

CREATE TABLE IF NOT EXISTS public.admin_announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS Policies
ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;

-- Cleanup existing policies to avoid re-run errors
DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.admin_announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.admin_announcements;

-- 1. Anyone (authenticated) can read active announcements
CREATE POLICY "Anyone can view active announcements" 
ON public.admin_announcements FOR SELECT 
USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- 2. Only platform admins can manage announcements 
-- (Matches super_admin role from project middleware)
CREATE POLICY "Admins can manage announcements" 
ON public.admin_announcements FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);
