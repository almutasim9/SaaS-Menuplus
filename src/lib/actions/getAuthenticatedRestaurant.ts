"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Securely retrieves the authenticated user's restaurant_id from their profile.
 * This should be used instead of trusting client-supplied restaurant_id.
 * 
 * @returns The restaurant_id, user id, and subscription info
 * @throws Redirects to login if not authenticated
 */
export async function getAuthenticatedRestaurant() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("NOT_AUTHENTICATED");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("restaurant_id, role")
        .eq("id", user.id)
        .single();

    if (!profile?.restaurant_id) {
        throw new Error("NO_RESTAURANT");
    }

    // Optionally fetch subscription status
    const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id, name, slug, subscription_plan, subscription_status, max_products, max_orders_per_month")
        .eq("id", profile.restaurant_id)
        .single();

    return {
        userId: user.id,
        restaurantId: profile.restaurant_id,
        role: profile.role || "owner",
        restaurant,
    };
}
