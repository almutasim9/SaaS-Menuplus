"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Ensures the user is authenticated.
 * Throws an error if not logged in.
 */
export async function requireAuth() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Unauthorized: يجب تسجيل الدخول أولاً");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("id, role, restaurant_id")
        .eq("id", user.id)
        .single();

    if (!profile) {
        throw new Error("Unauthorized: الملف الشخصي غير موجود");
    }

    return { user, profile, supabase };
}

/**
 * Ensures the authenticated user owns the given restaurant,
 * or is a super_admin (who can access all restaurants).
 */
export async function requireRestaurantOwnership(restaurantId: string) {
    const { user, profile, supabase } = await requireAuth();

    // super_admin bypasses ownership check
    if (profile.role === "super_admin") {
        return { user, profile, supabase };
    }

    if (!profile.restaurant_id || profile.restaurant_id !== restaurantId) {
        throw new Error("Forbidden: لا تملك صلاحية الوصول لهذا المطعم");
    }

    return { user, profile, supabase };
}

/**
 * Ensures the authenticated user is a super_admin.
 */
export async function requireSuperAdmin() {
    const { user, profile, supabase } = await requireAuth();

    if (profile.role !== "super_admin") {
        throw new Error("Forbidden: هذه الوظيفة للمشرفين العامين فقط");
    }

    return { user, profile, supabase };
}
