import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProductAvailability, updateProductAvailability } from "@/lib/actions/products";
import { checkFeatureAccess } from "@/lib/actions/subscription";
import { toast } from "sonner";

export function useProductAvailability(productId: string | null) {
    const queryClient = useQueryClient();

    const { data: availability, isLoading } = useQuery({
        queryKey: ["product-availability", productId],
        queryFn: () => (productId ? getProductAvailability(productId) : Promise.resolve([])),
        enabled: !!productId,
    });

    const updateMutation = useMutation({
        mutationFn: ({ productId, data }: { productId: string; data: any[] }) => 
            updateProductAvailability(productId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["product-availability", productId] });
        },
        onError: (error: any) => {
            toast.error(error.message || "فشل تحديث حالة التوفر");
        }
    });

    return {
        availability,
        isLoading,
        updateAvailability: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending
    };
}

export function useFeatureAccess(restaurantId: string | null, feature: string) {
    return useQuery({
        queryKey: ["feature-access", restaurantId, feature],
        queryFn: () => (restaurantId ? checkFeatureAccess(restaurantId, feature) : Promise.resolve(false)),
        enabled: !!restaurantId,
    });
}
