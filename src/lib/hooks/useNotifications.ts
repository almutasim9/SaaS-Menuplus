import { useQuery } from '@tanstack/react-query';
import { getNotifications, type Notification } from '@/lib/actions/notifications';
import { createClient } from '@/lib/supabase/client';

export function useNotifications(restaurantId?: string | null) {
    return useQuery<Notification[]>({
        queryKey: ['notifications', restaurantId],
        queryFn: async () => {
            let idToUse = restaurantId;

            if (!idToUse) {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return [];

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('restaurant_id')
                    .eq('id', user.id)
                    .single();

                if (!profile?.restaurant_id) return [];
                idToUse = profile.restaurant_id;
            }

            if (!idToUse) return [];

            return await getNotifications(idToUse);
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: true,
    });
}
