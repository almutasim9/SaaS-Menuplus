-- ترقية حساب admin@mplus.com إلى Super Admin
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'admin@mplus.com';

-- التحقق من النتيجة
SELECT id, email, full_name, role FROM public.profiles WHERE role = 'super_admin';
