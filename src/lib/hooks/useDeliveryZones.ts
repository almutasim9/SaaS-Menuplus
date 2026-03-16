import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getDeliveryZones, 
    createDeliveryZone, 
    updateDeliveryZone, 
    deleteDeliveryZone, 
    createDeliveryArea, 
    deleteDeliveryArea, 
    toggleFreeDelivery,
    toggleOutOfZoneOrders
} from '@/lib/actions/delivery';
import { createClient } from '@/lib/supabase/client';
import type { DeliveryZone, DeliveryArea } from '@/lib/types/database.types';

export interface ZoneWithAreas extends DeliveryZone {
    delivery_areas: DeliveryArea[];
}

export function useRestaurantId() {
    return useQuery({
        queryKey: ['restaurantId'],
        queryFn: async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;
            
            const { data: profile } = await supabase
                .from('profiles')
                .select('restaurant_id')
                .eq('id', user.id)
                .single();
                
            return profile?.restaurant_id || null;
        },
        staleTime: Infinity,
    });
}

export function useFreeDeliveryStatus(restaurantId: string | null) {
    return useQuery({
        queryKey: ['freeDelivery', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return false;
            const supabase = createClient();
            const { data } = await supabase
                .from('restaurants')
                .select('is_free_delivery')
                .eq('id', restaurantId)
                .single();
            return data?.is_free_delivery ?? false;
        },
        enabled: !!restaurantId,
    });
}

export function useOutOfZoneStatus(restaurantId: string | null) {
    return useQuery({
        queryKey: ['outOfZoneStatus', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return { accept: false, minOrder: 0 };
            const supabase = createClient();
            const { data } = await supabase
                .from('restaurants')
                .select('accept_out_of_zone_orders, out_of_zone_min_order')
                .eq('id', restaurantId)
                .single();
            return { 
                accept: data?.accept_out_of_zone_orders ?? false,
                minOrder: data?.out_of_zone_min_order ?? 0
            };
        },
        enabled: !!restaurantId,
    });
}

export function useDeliveryZones(restaurantId: string | null) {
    return useQuery<ZoneWithAreas[]>({
        queryKey: ['deliveryZones', restaurantId],
        queryFn: async () => {
            if (!restaurantId) return [];
            return await getDeliveryZones(restaurantId) as ZoneWithAreas[];
        },
        enabled: !!restaurantId,
    });
}

export function useCreateDeliveryZoneMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ restaurantId, zoneName, flatRate, freeThreshold, estimatedDeliveryTime, minOrderAmount }: { 
            restaurantId: string, 
            zoneName: string, 
            flatRate: number, 
            freeThreshold?: number,
            estimatedDeliveryTime?: string,
            minOrderAmount?: number
        }) => 
            createDeliveryZone(restaurantId, zoneName, flatRate, freeThreshold, estimatedDeliveryTime, minOrderAmount),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['deliveryZones', variables.restaurantId] });
        },
    });
}

export function useUpdateDeliveryZoneMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, zoneName, flatRate, freeThreshold, isActive, estimatedDeliveryTime, minOrderAmount }: { 
            id: string, 
            zoneName: string, 
            flatRate: number, 
            freeThreshold?: number, 
            isActive: boolean,
            estimatedDeliveryTime?: string,
            minOrderAmount?: number
        }) => 
            updateDeliveryZone(id, zoneName, flatRate, freeThreshold, isActive, estimatedDeliveryTime, minOrderAmount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deliveryZones'] });
        },
    });
}

export function useDeleteDeliveryZoneMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteDeliveryZone(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deliveryZones'] });
        },
    });
}

export function useCreateDeliveryAreaMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ zoneId, areaName }: { zoneId: string, areaName: string }) => createDeliveryArea(zoneId, areaName),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deliveryZones'] });
        },
    });
}

export function useDeleteDeliveryAreaMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (areaId: string) => deleteDeliveryArea(areaId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deliveryZones'] });
        },
    });
}

export function useToggleFreeDeliveryMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ restaurantId, isFree }: { restaurantId: string, isFree: boolean }) => toggleFreeDelivery(restaurantId, isFree),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['freeDelivery', variables.restaurantId] });
        },
    });
}

export function useToggleOutOfZoneOrdersMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ restaurantId, accept, minOrder }: { restaurantId: string, accept: boolean, minOrder?: number }) => 
            toggleOutOfZoneOrders(restaurantId, accept, minOrder),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['outOfZoneStatus', variables.restaurantId] });
        },
    });
}
