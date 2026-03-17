export interface AvailabilityRule {
    day_of_week: number;
    open_time: string;
    close_time: string;
    is_available_all_day: boolean;
    is_enabled: boolean;
}

export function isProductCurrentlyAvailable(availability: AvailabilityRule[] | undefined): { isAvailable: boolean; nextOpening?: string } {
    if (!availability || availability.length === 0) {
        return { isAvailable: true };
    }

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday
    const currentTimeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS

    const todayRule = availability.find(a => a.day_of_week === dayOfWeek);

    if (!todayRule || !todayRule.is_enabled) {
        return { isAvailable: false };
    }

    if (todayRule.is_available_all_day) {
        return { isAvailable: true };
    }

    const isAvailable = currentTimeStr >= todayRule.open_time && currentTimeStr <= todayRule.close_time;
    // Only show nextOpening if we haven't reached today's open time yet (not if close time already passed)
    const notOpenedYetToday = !isAvailable && currentTimeStr < todayRule.open_time;

    return {
        isAvailable,
        nextOpening: notOpenedYetToday ? todayRule.open_time : undefined
    };
}
