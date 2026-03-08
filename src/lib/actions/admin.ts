"use server";

import { createClient } from "@/lib/supabase/server";

export async function getPlatformMetrics() {
    const supabase = await createClient();

    const [restaurantsRes, ordersRes, usersRes] = await Promise.all([
        supabase.from("restaurants").select("id, subscription_plan", { count: "exact" }),
        supabase.from("orders").select("id, total", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
    ]);

    const restaurants = restaurantsRes.data || [];
    const totalRevenue = (ordersRes.data || []).reduce((sum, o: { total: number }) => sum + (o.total || 0), 0);

    const planCounts = {
        free: restaurants.filter(r => !r.subscription_plan || r.subscription_plan === "free").length,
        pro: restaurants.filter(r => r.subscription_plan === "pro").length,
        business: restaurants.filter(r => r.subscription_plan === "business").length,
    };

    return {
        totalRestaurants: restaurantsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalRevenue,
        planCounts,
    };
}

export async function getAllRestaurants() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, slug, subscription_plan, subscription_status, created_at, owner_id, profiles!restaurants_owner_id_fkey(email, full_name)")
        .order("created_at", { ascending: false });

    if (error) {
        // Fallback without join if FK doesn't exist
        const { data: fallback } = await supabase
            .from("restaurants")
            .select("id, name, slug, subscription_plan, subscription_status, created_at, owner_id")
            .order("created_at", { ascending: false });
        return fallback || [];
    }

    return data || [];
}

export async function updateRestaurantPlan(restaurantId: string, plan: string) {
    const supabase = await createClient();

    const planLimits: Record<string, { max_products: number; max_orders_per_month: number }> = {
        free: { max_products: 15, max_orders_per_month: 50 },
        pro: { max_products: 100, max_orders_per_month: 500 },
        business: { max_products: 999999, max_orders_per_month: 999999 },
    };

    const limits = planLimits[plan] || planLimits.free;

    const { error } = await supabase
        .from("restaurants")
        .update({
            subscription_plan: plan,
            subscription_status: "active",
            max_products: limits.max_products,
            max_orders_per_month: limits.max_orders_per_month,
        })
        .eq("id", restaurantId);

    if (error) return { error: error.message };
    return { success: true };
}

export async function suspendRestaurant(restaurantId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("restaurants")
        .update({ subscription_status: "expired" })
        .eq("id", restaurantId);

    if (error) return { error: error.message };
    return { success: true };
}

export async function activateRestaurant(restaurantId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("restaurants")
        .update({ subscription_status: "active" })
        .eq("id", restaurantId);

    if (error) return { error: error.message };
    return { success: true };
}

export async function adminCreateRestaurant(data: {
    ownerEmail: string;
    ownerPassword: string;
    ownerName: string;
    restaurantName: string;
    plan: string;
}) {
    const supabase = await createClient();

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.ownerEmail,
        password: data.ownerPassword,
        email_confirm: true,
        user_metadata: { full_name: data.ownerName },
    });

    if (authError) {
        // Fallback: try normal signup if admin API not available
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: data.ownerEmail,
            password: data.ownerPassword,
            options: { data: { full_name: data.ownerName } },
        });

        if (signupError) return { error: signupError.message };
        if (!signupData.user) return { error: "فشل إنشاء الحساب" };

        const userId = signupData.user.id;
        return await createRestaurantForUser(supabase, userId, data);
    }

    if (!authData.user) return { error: "فشل إنشاء الحساب" };
    return await createRestaurantForUser(supabase, authData.user.id, data);
}

async function createRestaurantForUser(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    data: { ownerName: string; restaurantName: string; plan: string; ownerEmail: string }
) {
    // 2. Generate unique slug
    const baseSlug = data.restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9\u0621-\u064A]+/g, "-")
        .replace(/(^-|-$)/g, "")
        || "restaurant";

    let slug = baseSlug;
    let attempts = 0;

    while (attempts < 5) {
        const { data: existing } = await supabase
            .from("restaurants")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();

        if (!existing) break;
        slug = `${baseSlug}-${Date.now().toString(36)}`;
        attempts++;
    }

    // 3. Plan config
    const planConfig: Record<string, { max_products: number; max_orders_per_month: number }> = {
        free: { max_products: 15, max_orders_per_month: 50 },
        pro: { max_products: 100, max_orders_per_month: 500 },
        business: { max_products: 999999, max_orders_per_month: 999999 },
    };

    const limits = planConfig[data.plan] || planConfig.free;

    // 4. Create restaurant
    const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .insert({
            name: data.restaurantName,
            slug,
            owner_id: userId,
            subscription_plan: data.plan,
            subscription_status: "active",
            max_products: limits.max_products,
            max_orders_per_month: limits.max_orders_per_month,
        })
        .select()
        .single();

    if (restaurantError) return { error: restaurantError.message };

    // 5. Link profile to restaurant
    await supabase
        .from("profiles")
        .update({
            restaurant_id: restaurant.id,
            full_name: data.ownerName,
            role: "owner",
        })
        .eq("id", userId);

    return { success: true, restaurant };
}
