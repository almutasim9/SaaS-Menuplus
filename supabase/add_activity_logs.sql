-- Create Activity Logs Table
CREATE TABLE IF NOT EXISTS public.platform_activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action_type TEXT NOT NULL, -- e.g., 'RESTAURANT_CREATE', 'PLAN_CHANGE', 'RESTAURANT_SUSPEND'
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.platform_activity_logs ENABLE ROW LEVEL SECURITY;

-- Cleanup existing policies to avoid re-run errors
DROP POLICY IF EXISTS "Admins can manage activity logs" ON public.platform_activity_logs;

-- Only platform admins can view or manage activity logs
CREATE POLICY "Admins can manage activity logs" 
ON public.platform_activity_logs FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);
