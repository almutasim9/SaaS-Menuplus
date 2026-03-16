"use server";

import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin, requireRestaurantOwnership } from "@/lib/actions/_auth-guard";
import { ADDON_DEFINITIONS, findAddonForFeature, type AddonKey } from "@/lib/addons/addon-definitions";

export type RestaurantAddon = {
    id: string;
    restaurant_id: string;
    addon_key: AddonKey;
    is_active: boolean;
    price_monthly: number;
    activated_at: string | null;
    expires_at: string | null;
    activated_by: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

/** Fetch all addon rows for a restaurant. Missing rows mean the addon was never touched. */
export async function getRestaurantAddons(restaurantId: string): Promise<RestaurantAddon[]> {
    await requireRestaurantOwnership(restaurantId);
    const supabase = await createClient();

    const { data } = await supabase
        .from("restaurant_addons")
        .select("*")
        .eq("restaurant_id", restaurantId);

    return (data || []) as RestaurantAddon[];
}

/** Admin-only: fetch all addon rows for a restaurant (no ownership check). */
export async function getRestaurantAddonsAdmin(restaurantId: string): Promise<RestaurantAddon[]> {
    await requireSuperAdmin();
    const supabase = await createClient();

    const { data } = await supabase
        .from("restaurant_addons")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("addon_key");

    return (data || []) as RestaurantAddon[];
}

/**
 * Returns true if the restaurant has an active addon that provides the given feature key.
 * Does NOT check plan — call this only after the plan check fails.
 */
export async function checkAddonFeatureAccess(restaurantId: string, featureKey: string): Promise<boolean> {
    const addon = findAddonForFeature(featureKey);
    if (!addon) return false;

    const supabase = await createClient();
    const { data } = await supabase
        .from("restaurant_addons")
        .select("is_active")
        .eq("restaurant_id", restaurantId)
        .eq("addon_key", addon.key)
        .eq("is_active", true)
        .maybeSingle();

    return !!data;
}

/** Admin-only: activate or deactivate an addon for a restaurant. */
export async function toggleRestaurantAddon(
    restaurantId: string,
    addonKey: AddonKey,
    activate: boolean,
    notes?: string
): Promise<{ success: boolean; error?: string }> {
    const { user } = await requireSuperAdmin();
    const supabase = await createClient();

    const definition = ADDON_DEFINITIONS[addonKey];
    if (!definition) return { success: false, error: "Invalid addon key" };

    // Upsert the addon row
    const { error } = await supabase
        .from("restaurant_addons")
        .upsert(
            {
                restaurant_id: restaurantId,
                addon_key: addonKey,
                is_active: activate,
                price_monthly: definition.price,
                activated_at: activate ? new Date().toISOString() : null,
                activated_by: activate ? user.id : null,
                notes: notes ?? null,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "restaurant_id,addon_key" }
        );

    if (error) return { success: false, error: error.message };

    // Log activity (non-fatal)
    const actionType = activate ? "ADDON_ACTIVATED" : "ADDON_DEACTIVATED";
    const description = activate
        ? `تم تفعيل إضافة: ${definition.name.ar}`
        : `تم إيقاف إضافة: ${definition.name.ar}`;

    try {
        await supabase.from("platform_activity_logs").insert({
            restaurant_id: restaurantId,
            action_type: actionType,
            description,
            performed_by: user.id,
        });
    } catch {
        // non-fatal
    }

    return { success: true };
}
