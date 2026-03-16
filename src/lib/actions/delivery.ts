"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireRestaurantOwnership, requireAuth } from "@/lib/actions/_auth-guard";
import { deliveryZoneSchema } from "@/lib/validations/schemas";

export async function getCityAreas(cityName: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("master_locations")
        .select("name_ar")
        .eq("city_name_ar", cityName)
        .order("name_ar", { ascending: true });

    if (error) throw error;
    return data.map(area => area.name_ar);
}

export async function getDeliveryZones(restaurantId: string) {
    await requireRestaurantOwnership(restaurantId);
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
    freeDeliveryThreshold?: number,
    estimatedDeliveryTime?: string,
    minOrderAmount?: number
) {
    await requireRestaurantOwnership(restaurantId);

    // Validate inputs
    const validated = deliveryZoneSchema.parse({
        zone_name: zoneName,
        flat_rate: flatRate,
        free_delivery_threshold: freeDeliveryThreshold,
        estimated_delivery_time: estimatedDeliveryTime,
        min_order_amount: minOrderAmount,
    });

    const supabase = await createClient();
    const { data, error } = await supabase
        .from("delivery_zones")
        .insert({
            restaurant_id: restaurantId,
            zone_name: validated.zone_name,
            flat_rate: validated.flat_rate,
            free_delivery_threshold: validated.free_delivery_threshold || null,
            estimated_delivery_time: validated.estimated_delivery_time || null,
            min_order_amount: validated.min_order_amount || 0,
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
    isActive?: boolean,
    estimatedDeliveryTime?: string,
    minOrderAmount?: number
) {
    const supabase = await createClient();
    const { data: zone } = await supabase
        .from("delivery_zones")
        .select("restaurant_id")
        .eq("id", id)
        .single();
    if (!zone) throw new Error("Zone not found");
    await requireRestaurantOwnership(zone.restaurant_id);

    const validated = deliveryZoneSchema.parse({
        zone_name: zoneName,
        flat_rate: flatRate,
        free_delivery_threshold: freeDeliveryThreshold,
        estimated_delivery_time: estimatedDeliveryTime,
        min_order_amount: minOrderAmount,
    });

    const { data, error } = await supabase
        .from("delivery_zones")
        .update({
            zone_name: validated.zone_name,
            flat_rate: validated.flat_rate,
            free_delivery_threshold: validated.free_delivery_threshold || null,
            is_active: isActive ?? true,
            estimated_delivery_time: validated.estimated_delivery_time || null,
            min_order_amount: validated.min_order_amount || 0,
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
    const { data: zone } = await supabase
        .from("delivery_zones")
        .select("restaurant_id")
        .eq("id", id)
        .single();
    if (!zone) throw new Error("Zone not found");
    await requireRestaurantOwnership(zone.restaurant_id);
    const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/dashboard/delivery/zones");
}

export async function createDeliveryArea(zoneId: string, areaName: string) {
    const supabase = await createClient();

    try {
        // 1. Get the restaurant ID for this zone
        const { data: zone } = await supabase
            .from("delivery_zones")
            .select("restaurant_id")
            .eq("id", zoneId)
            .single();

        if (!zone) throw new Error("المنطقة غير موجودة");
        await requireRestaurantOwnership(zone.restaurant_id);

        // 2. Check if this area name is already assigned to ANY zone of this restaurant
        const { data: existingArea } = await supabase
            .from("delivery_areas")
            .select("id, delivery_zones!inner(zone_name)")
            .eq("area_name", areaName)
            .eq("delivery_zones.restaurant_id", zone.restaurant_id)
            .maybeSingle();

        if (existingArea) {
            throw new Error(`هذه المنطقة مضافة مسبقاً في زون (${(existingArea as any).delivery_zones.zone_name})`);
        }

        // 3. Add to delivery_areas
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
    } catch (error) {
        console.error("Error creating delivery area:", error);
        throw error;
    }
}

/**
 * Adds multiple areas to a delivery zone in a single transaction with uniqueness checks
 */
export async function createMultipleDeliveryAreas(zoneId: string, areaNames: string[]) {
    const supabase = await createClient();

    try {
        // 1. Get the restaurant ID for this zone
        const { data: zone } = await supabase
            .from("delivery_zones")
            .select("restaurant_id")
            .eq("id", zoneId)
            .single();

        if (!zone) throw new Error("المنطقة غير موجودة");
        await requireRestaurantOwnership(zone.restaurant_id);

        // 2. Check for any areas already assigned to this restaurant
        const { data: assigned } = await supabase
            .from("delivery_areas")
            .select("area_name, delivery_zones!inner(zone_name)")
            .in("area_name", areaNames)
            .eq("delivery_zones.restaurant_id", zone.restaurant_id);

        if (assigned && assigned.length > 0) {
            const names = assigned.map((a: any) => `${a.area_name} (في زون ${a.delivery_zones.zone_name})`).join(", ");
            throw new Error(`بعض المناطق مضافة مسبقاً: ${names}`);
        }

        // 3. Batch insert
        const { data, error } = await supabase
            .from("delivery_areas")
            .insert(areaNames.map(name => ({
                zone_id: zoneId,
                area_name: name
            })))
            .select();

        if (error) throw error;
        revalidatePath("/dashboard/delivery/zones");
        return { success: true, count: data.length };
    } catch (error: any) {
        console.error("Error creating multiple delivery areas:", error);
        throw error;
    }
}

export async function deleteDeliveryArea(id: string) {
    const supabase = await createClient();
    const { data: area } = await supabase
        .from("delivery_areas")
        .select("zone_id")
        .eq("id", id)
        .single();
    if (!area) throw new Error("Area not found");
    const { data: zone } = await supabase
        .from("delivery_zones")
        .select("restaurant_id")
        .eq("id", area.zone_id)
        .single();
    if (!zone) throw new Error("Zone not found");
    await requireRestaurantOwnership(zone.restaurant_id);
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
    await requireRestaurantOwnership(restaurantId);
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
    await requireRestaurantOwnership(restaurantId);
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

export async function toggleOutOfZoneOrders(restaurantId: string, accept: boolean, minOrder?: number) {
    await requireRestaurantOwnership(restaurantId);
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("restaurants")
        .update({ 
            accept_out_of_zone_orders: accept,
            out_of_zone_min_order: minOrder ?? 0
        })
        .eq("id", restaurantId)
        .select("accept_out_of_zone_orders, out_of_zone_min_order")
        .single();

    if (error) throw error;
    revalidatePath("/dashboard/delivery/zones");
    return data;
}

export async function syncRestaurantAreas(restaurantId: string) {
    await requireRestaurantOwnership(restaurantId);
    const supabase = await createClient();
    
    // 1. Get restaurant city
    const { data: restaurant, error: restError } = await supabase
        .from("restaurants")
        .select("city")
        .eq("id", restaurantId)
        .single();
    
    if (restError || !restaurant?.city) {
        return { error: "لم يتم تحديد مدينة للمطعم بعد" };
    }

    // 2. Import areas using the service logic
    // (I'll implement it directly here to avoid circular dependencies or import issues if any)
    const { data: areas, error: fetchError } = await supabase
        .from("master_locations")
        .select("name_ar")
        .eq("city_name_ar", restaurant.city);

    if (fetchError || !areas || areas.length === 0) {
        return { error: `لم يتم العثور على مناطق للمدنية: ${restaurant.city}` };
    }

    // 3. Create/Get zone
    const { data: zone, error: zoneError } = await supabase
        .from("delivery_zones")
        .upsert({
            restaurant_id: restaurantId,
            zone_name: restaurant.city,
            flat_rate: 0,
            is_active: true
        }, { onConflict: 'restaurant_id,zone_name' })
        .select()
        .single();

    if (zoneError) return { error: zoneError.message };
    if (!zone) return { error: "فشل في إنشاء منطقة التوصيل" };

    // 4. Insert areas in a single batch (ignoring duplicates)
    const areaInserts = areas.map(area => ({
        zone_id: zone.id,
        area_name: area.name_ar
    }));

    const { error: areaError } = await supabase
        .from("delivery_areas")
        .upsert(areaInserts, { onConflict: 'zone_id,area_name' });

    if (areaError) return { error: areaError.message };

    revalidatePath("/dashboard/delivery/zones");
    return { success: true, count: areas.length };
}

export async function addCustomMasterLocation(restaurantId: string, locationName: string) {
    await requireRestaurantOwnership(restaurantId);
    const supabase = await createClient();
    
    // 1. Get restaurant city and governorate name
    const { data: restaurant } = await supabase
        .from("restaurants")
        .select("city, governorate")
        .eq("id", restaurantId)
        .single();
        
    if (!restaurant?.city || !restaurant?.governorate) {
        return { error: "معلومات المطعم غير مكتملة" };
    }

    const trimmedName = locationName.trim();

    // 2. Check if already exists in master_locations (either global OR for this specific restaurant)
    const { data: existingMaster } = await supabase
        .from("master_locations")
        .select("id")
        .eq("city_name_ar", restaurant.city)
        .eq("name_ar", trimmedName)
        .or(`restaurant_id.is.null,restaurant_id.eq.${restaurantId}`)
        .maybeSingle();

    if (!existingMaster) {
        // 3. Get governorate_id from master_governorates
        const { data: gov } = await supabase
            .from("master_governorates")
            .select("id")
            .eq("name_ar", restaurant.governorate)
            .maybeSingle();
            
        if (!gov) {
            return { error: "المحافظة غير موجودة في القائمة الرئيسية. يرجى التأكد من إعدادات المطعم." };
        }

        // 4. Insert new location into master list - TAGGED TO THIS RESTAURANT ONLY
        const { error: insertMasterError } = await supabase
            .from("master_locations")
            .insert({
                governorate_id: gov.id,
                governorate_name_ar: restaurant.governorate,
                city_name_ar: restaurant.city,
                name_ar: trimmedName,
                restaurant_id: restaurantId // Exclusive to this restaurant
            });

        if (insertMasterError) return { error: insertMasterError.message };
    }

    // 5. Always ensure it's added to the restaurant's active delivery areas
    // First, find/create the default zone for this city
    const { data: zone, error: zoneError } = await supabase
        .from("delivery_zones")
        .upsert({
            restaurant_id: restaurantId,
            zone_name: restaurant.city,
            flat_rate: 0,
            is_active: true
        }, { onConflict: 'restaurant_id,zone_name' })
        .select()
        .single();

    if (zoneError || !zone) return { error: "فشل في إعداد منطقة التوصيل" };

    // Add to delivery_areas
    const { error: areaError } = await supabase
        .from("delivery_areas")
        .upsert({
            zone_id: zone.id,
            area_name: trimmedName
        }, { onConflict: 'zone_id,area_name' });

    if (areaError) return { error: areaError.message };

    revalidatePath("/dashboard/delivery/locations");
    revalidatePath("/dashboard/delivery/zones");
    return { success: true };
}

/**
 * Fetches areas that are:
 * 1. In the restaurant's city
 * 2. NOT in the restaurant's hidden_locations
 * 3. NOT already assigned to ANY of the restaurant's zones
 */
export async function getRestaurantAvailableAreas(restaurantId: string) {
    const supabase = await createClient();
    
    try {
        // 1. Get restaurant city
        const { data: restaurant } = await supabase
            .from("restaurants")
            .select("city")
            .eq("id", restaurantId)
            .single();
        
        if (!restaurant?.city) return [];

        // 2. Get hidden area IDs
        const { data: hidden } = await supabase
            .from("restaurant_hidden_locations")
            .select("master_location_id")
            .eq("restaurant_id", restaurantId);
        
        const hiddenIds = hidden?.map(h => h.master_location_id) || [];

        // 3. Get already assigned area names for this restaurant
        const { data: assigned } = await supabase
            .from("delivery_areas")
            .select("area_name, delivery_zones!inner(restaurant_id)")
                .eq("delivery_zones.restaurant_id", restaurantId);
        
        const assignedNames = assigned?.map(a => a.area_name) || [];

        // 4. Query master_locations
        let query = supabase
            .from("master_locations")
            .select("name_ar")
            .eq("city_name_ar", restaurant.city);
        
        if (hiddenIds.length > 0) {
            query = query.not("id", "in", `(${hiddenIds.join(",")})`);
        }
        
        if (assignedNames.length > 0) {
            // Using a simple filter for name since we don't have standard column for this array-like check in PostgREST unless we use .not.in
            query = query.not("name_ar", "in", `(${assignedNames.map(n => `"${n}"`).join(",")})`);
        }

        const { data: areas, error } = await query.order("name_ar", { ascending: true });

        if (error) throw error;
        return areas.map(a => a.name_ar);
    } catch (error) {
        console.error("Error fetching available areas:", error);
        return [];
    }
}

/**
 * Deletes a custom master location and its assignments for a specific restaurant
 */
export async function deleteCustomMasterLocation(restaurantId: string, masterLocationId: string) {
    await requireRestaurantOwnership(restaurantId);
    const supabase = await createClient();
    
    try {
        // 1. Get the location details to check ownership and get the name
        const { data: masterLoc, error: fetchError } = await supabase
            .from("master_locations")
            .select("name_ar, restaurant_id")
            .eq("id", masterLocationId)
            .single();

        if (fetchError || !masterLoc) return { error: "المنطقة غير موجودة" };
        
        const isPrivate = masterLoc.restaurant_id === restaurantId;

        // 2. Action based on ownership
        if (isPrivate) {
            // Delete from master_locations (Only if it's the restaurant's private one)
            const { error: deleteMasterError } = await supabase
                .from("master_locations")
                .delete()
                .eq("id", masterLocationId)
                .eq("restaurant_id", restaurantId); // Extra safety

            if (deleteMasterError) return { error: deleteMasterError.message };
        } else {
            // It's a global area - Hide it for this restaurant
            const { error: hideError } = await supabase
                .from("restaurant_hidden_locations")
                .upsert({
                    restaurant_id: restaurantId,
                    master_location_id: masterLocationId
                }, { onConflict: 'restaurant_id,master_location_id' });

            if (hideError) return { error: "فشل إخفاء المنطقة الرسمية" };
        }

        // 3. Always delete from delivery_areas for this restaurant
        // Find all zones for this restaurant to clear the area from all of them
        const { data: zones } = await supabase
            .from("delivery_zones")
            .select("id")
            .eq("restaurant_id", restaurantId);
        
        if (zones && zones.length > 0) {
            const zoneIds = zones.map(z => z.id);
            await supabase
                .from("delivery_areas")
                .delete()
                .eq("area_name", masterLoc.name_ar)
                .in("zone_id", zoneIds);
        }

        revalidatePath("/dashboard/delivery/locations");
        revalidatePath("/dashboard/delivery/zones");
        return { success: true };
    } catch (error) {
        console.error("Error deleting custom location:", error);
        return { error: "فشل مسح المنطقة" };
    }
}

/**
 * Removes an area from a restaurant's delivery zones (Uncovers it)
 * without deleting it from the master dictionary.
 */
export async function removeAreaFromCoverage(restaurantId: string, areaName: string) {
    await requireRestaurantOwnership(restaurantId);
    const supabase = await createClient();
    
    try {
        // Find all zones for this restaurant
        const { data: zones } = await supabase
            .from("delivery_zones")
            .select("id")
            .eq("restaurant_id", restaurantId);
        
        if (!zones || zones.length === 0) return { success: true };

        const zoneIds = zones.map(z => z.id);
        
        // Delete from delivery_areas
        const { error: deleteError } = await supabase
            .from("delivery_areas")
            .delete()
            .eq("area_name", areaName)
            .in("zone_id", zoneIds);

        if (deleteError) return { error: deleteError.message };

        revalidatePath("/dashboard/delivery/locations");
        revalidatePath("/dashboard/delivery/zones");
        return { success: true };
    } catch (error) {
        console.error("Error removing area from coverage:", error);
        return { error: "فشل إزالة المنطقة من التغطية" };
    }
}
