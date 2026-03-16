/**
 * Utility functions for delivery fee and minimum order calculations.
 */

export interface DeliveryZone {
    id: string;
    zone_name: string;
    flat_rate: number;
    free_delivery_threshold?: number | null;
    min_order_amount?: number | null;
    estimated_delivery_time?: string | null;
    delivery_areas?: { area_name: string }[];
}

export interface OrderSettings {
    is_free_delivery?: boolean;
    out_of_zone_min_order?: number;
    accept_out_of_zone_orders?: boolean;
}

/**
 * Calculates the raw delivery fee for a specific area based on defined zones.
 */
export function calculateRawDeliveryFee(
    areaName: string,
    zones: DeliveryZone[],
    subtotal: number
): number {
    if (!areaName) return 0;

    const zone = zones.find(z => 
        z.delivery_areas?.some(a => a.area_name === areaName)
    );

    if (!zone) return 0;

    if (zone.free_delivery_threshold && subtotal >= zone.free_delivery_threshold) {
        return 0;
    }

    return Number(zone.flat_rate) || 0;
}

/**
 * Calculates the final effective delivery fee, considering global settings and coupons.
 */
export function calculateEffectiveDeliveryFee({
    rawFee,
    isAreaInZone,
    isRestaurantFreeDelivery,
    isFreeDeliveryCoupon,
}: {
    rawFee: number;
    isAreaInZone: boolean;
    isRestaurantFreeDelivery: boolean;
    isFreeDeliveryCoupon: boolean;
}): number {
    if ((isRestaurantFreeDelivery || isFreeDeliveryCoupon) && isAreaInZone) {
        return 0;
    }
    return rawFee;
}

/**
 * Validates if the minimum order amount is reached for the selected area.
 */
export function validateMinOrder({
    subtotal,
    selectedZone,
    outOfZoneMinOrder = 0,
}: {
    subtotal: number;
    selectedZone?: DeliveryZone;
    outOfZoneMinOrder?: number;
}): boolean {
    if (selectedZone) {
        return !selectedZone.min_order_amount || subtotal >= selectedZone.min_order_amount;
    }
    // If no zone is selected, it's considered out-of-zone
    return subtotal >= outOfZoneMinOrder;
}

/**
 * Checks if a specific area is covered by any of the restaurant's zones.
 */
export function checkIfAreaInZone(areaName: string, zones: DeliveryZone[]): boolean {
    if (!areaName) return false;
    return zones.some(z => 
        z.delivery_areas?.some(a => a.area_name === areaName)
    );
}
