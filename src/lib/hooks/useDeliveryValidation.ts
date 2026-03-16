import { useMemo } from 'react';
import { 
    calculateRawDeliveryFee, 
    calculateEffectiveDeliveryFee, 
    validateMinOrder, 
    checkIfAreaInZone,
    type DeliveryZone,
    type OrderSettings
} from '@/lib/utils/delivery-calculations';

interface UseDeliveryValidationProps {
    orderType: string;
    areaName: string;
    zones: DeliveryZone[];
    subtotal: number;
    orderSettings: OrderSettings | null;
    isRestaurantFreeDelivery: boolean;
    appliedCoupon: any;
}

export function useDeliveryValidation({
    orderType,
    areaName,
    zones,
    subtotal,
    orderSettings,
    isRestaurantFreeDelivery,
    appliedCoupon,
}: UseDeliveryValidationProps) {
    const isAreaInZone = useMemo(() => 
        checkIfAreaInZone(areaName, zones), 
    [areaName, zones]);

    const selectedZone = useMemo(() => 
        zones.find(z => z.delivery_areas?.some(a => a.area_name === areaName)),
    [areaName, zones]);

    const rawDeliveryFee = useMemo(() => 
        orderType === 'delivery' ? calculateRawDeliveryFee(areaName, zones, subtotal) : 0,
    [orderType, areaName, zones, subtotal]);

    const isFreeDeliveryCoupon = appliedCoupon?.discount_type === 'free_delivery';

    const effectiveDeliveryFee = useMemo(() => 
        calculateEffectiveDeliveryFee({
            rawFee: rawDeliveryFee,
            isAreaInZone,
            isRestaurantFreeDelivery,
            isFreeDeliveryCoupon,
        }),
    [rawDeliveryFee, isAreaInZone, isRestaurantFreeDelivery, isFreeDeliveryCoupon]);

    const isMinOrderReached = useMemo(() => 
        validateMinOrder({
            subtotal,
            selectedZone,
            outOfZoneMinOrder: orderSettings?.out_of_zone_min_order ?? 0,
        }),
    [subtotal, selectedZone, orderSettings]);

    const isOutOfZone = orderType === 'delivery' && areaName && !isAreaInZone;

    return {
        isAreaInZone,
        selectedZone,
        effectiveDeliveryFee,
        isMinOrderReached,
        isOutOfZone,
        isFreeDeliveryCoupon,
    };
}
