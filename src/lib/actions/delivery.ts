"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getDeliveryZones(restaurantId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("delivery_zones")
        .select(`
            *,
            delivery_areas (*)
        `)
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
}

export async function createDeliveryZone(
    restaurantId: string,
    zoneName: string,
    flatRate: number,
    freeDeliveryThreshold?: number
) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("delivery_zones")
        .insert({
            restaurant_id: restaurantId,
            zone_name: zoneName,
            flat_rate: flatRate,
            free_delivery_threshold: freeDeliveryThreshold || null,
        })
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/dashboard/delivery/zones");
    return data;
}

export async function updateDeliveryZone(
    id: string,
    zoneName: string,
    flatRate: number,
    freeDeliveryThreshold?: number,
    isActive?: boolean
) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("delivery_zones")
        .update({
            zone_name: zoneName,
            flat_rate: flatRate,
            free_delivery_threshold: freeDeliveryThreshold || null,
            is_active: isActive ?? true,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/dashboard/delivery/zones");
    return data;
}

export async function deleteDeliveryZone(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/dashboard/delivery/zones");
}

export async function createDeliveryArea(zoneId: string, areaName: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("delivery_areas")
        .insert({
            zone_id: zoneId,
            area_name: areaName,
        })
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/dashboard/delivery/zones");
    return data;
}

export async function deleteDeliveryArea(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("delivery_areas").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/dashboard/delivery/zones");
}

export async function getWorkingHours(restaurantId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("working_hours")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("day_of_week", { ascending: true });

    if (error) throw error;
    return data;
}

export async function updateWorkingHour(
    restaurantId: string,
    dayOfWeek: number,
    openTime: string,
    closeTime: string,
    isClosed: boolean
) {
    const supabase = await createClient();
    // Use upsert to create or update
    const { data, error } = await supabase
        .from("working_hours")
        .upsert({
            restaurant_id: restaurantId,
            day_of_week: dayOfWeek,
            open_time: openTime,
            close_time: closeTime,
            is_closed: isClosed,
        }, { onConflict: 'restaurant_id,day_of_week' })
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/dashboard/delivery/hours");
    return data;
}

export async function toggleFreeDelivery(restaurantId: string, isActive: boolean) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("restaurants")
        .update({ is_free_delivery: isActive })
        .eq("id", restaurantId)
        .select("is_free_delivery")
        .single();

    if (error) throw error;
    revalidatePath("/dashboard/delivery/zones");
    return data;
}
