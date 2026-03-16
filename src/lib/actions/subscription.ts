"use server";

import { createClient } from "@/lib/supabase/server";
import { checkAddonFeatureAccess } from "@/lib/actions/addons";

export type PlanType = "free" | "pro" | "business";

export const PLAN_LIMITS: Record<PlanType, { max_products: number; max_orders_per_month: number; max_coupons: number }> = {
    free: { max_products: 15, max_orders_per_month: 50, max_coupons: 3 },
    pro: { max_products: 100, max_orders_per_month: 500, max_coupons: 20 },
    business: { max_products: 999999, max_orders_per_month: 999999, max_coupons: 999999 },
};

const PLAN_FEATURES: Record<PlanType, string[]> = {
    free: ["qr_menu", "orders", "basic_analytics"],
    pro: ["qr_menu", "orders", "basic_analytics", "advanced_analytics", "theme_customization", "whatsapp_ordering", "coupons", "product_scheduling"],
    business: ["qr_menu", "orders", "basic_analytics", "advanced_analytics", "theme_customization", "whatsapp_ordering", "coupons", "custom_domain", "priority_support", "product_scheduling"],
};

export async function getSubscriptionStatus(restaurantId: string) {
    const supabase = await createClient();

    const { data: restaurant } = await supabase
        .from("restaurants")
        .select("subscription_plan, subscription_status, trial_ends_at, subscription_expires_at, max_products, max_orders_per_month")
        .eq("id", restaurantId)
        .single();

    if (!restaurant) return null;

    const plan = (restaurant.subscription_plan || "free") as PlanType;

    // Count current usage
    const [productsRes, ordersRes, couponsRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId).is("deleted_at", null),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId).gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from("coupons").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId).is("deleted_at", null),
    ]);

    const limits = PLAN_LIMITS[plan];

    return {
        plan,
        status: restaurant.subscription_status || "active",
        trialEndsAt: restaurant.trial_ends_at,
        expiresAt: restaurant.subscription_expires_at,
        usage: {
            products: { current: productsRes.count || 0, max: limits.max_products },
            orders: { current: ordersRes.count || 0, max: limits.max_orders_per_month },
            coupons: { current: couponsRes.count || 0, max: limits.max_coupons },
        },
        features: PLAN_FEATURES[plan],
    };
}

export async function checkFeatureAccess(restaurantId: string, feature: string): Promise<boolean> {
    const status = await getSubscriptionStatus(restaurantId);
    if (!status) return false;
    if (status.status === "expired" || status.status === "cancelled") return false;

    // Step 1: plan includes the feature
    if (status.features.includes(feature)) return true;

    // Step 2: an active add-on enables the feature (only for paid plans)
    if (status.plan === "free") return false;
    return checkAddonFeatureAccess(restaurantId, feature);
}

export async function checkLimitAccess(restaurantId: string, resource: "products" | "orders" | "coupons"): Promise<{ allowed: boolean; current: number; max: number }> {
    const status = await getSubscriptionStatus(restaurantId);
    if (!status) return { allowed: false, current: 0, max: 0 };

    const usage = status.usage[resource];
    return {
        allowed: usage.current < usage.max,
        current: usage.current,
        max: usage.max,
    };
}

export async function upgradePlan(restaurantId: string, newPlan: PlanType) {
    const supabase = await createClient();
    const limits = PLAN_LIMITS[newPlan];

    const { error } = await supabase
        .from("restaurants")
        .update({
            subscription_plan: newPlan,
            subscription_status: "active",
            max_products: limits.max_products,
            max_orders_per_month: limits.max_orders_per_month,
        })
        .eq("id", restaurantId);

    if (error) return { error: error.message };
    return { success: true };
}
