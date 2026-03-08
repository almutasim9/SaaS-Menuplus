"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getOrderTypeSettings(restaurantId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("restaurants")
        .select("is_dine_in_enabled, is_takeaway_enabled, is_delivery_enabled")
        .eq("id", restaurantId)
        .single();

    if (error) throw error;
    return data;
}

export async function updateOrderTypeSettings(
    restaurantId: string,
    settings: {
        is_dine_in_enabled: boolean;
        is_takeaway_enabled: boolean;
        is_delivery_enabled: boolean;
    }
) {
    // Prevent disabling all order types
    if (!settings.is_dine_in_enabled && !settings.is_takeaway_enabled && !settings.is_delivery_enabled) {
        throw new Error("Cannot disable all order types. At least one must be active.");
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .from("restaurants")
        .update(settings)
        .eq("id", restaurantId)
        .select()
        .single();

    if (error) throw error;

    // Revalidate paths that might depend on this (like public menu or dashboard settings/overview)
    revalidatePath("/dashboard");
    revalidatePath("/menu/[slug]", "layout");

    return data;
}
