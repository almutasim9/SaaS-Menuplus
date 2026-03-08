"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Clock, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getWorkingHours, updateWorkingHour } from "@/lib/actions/delivery";
import { toast } from "sonner";
import type { WorkingHour } from "@/lib/types/database.types";

const DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];

const DEFAULT_HOURS: Omit<WorkingHour, "id" | "restaurant_id" | "created_at">[] = DAYS.map((_, i) => ({
    day_of_week: i,
    open_time: "09:00",
    close_time: "22:00",
    is_closed: false,
}));

export default function WorkingHoursPage() {
    const [hours, setHours] = useState<Omit<WorkingHour, "id" | "restaurant_id" | "created_at">[]>(DEFAULT_HOURS);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("restaurant_id")
                .eq("id", user.id)
                .single();

            if (profile?.restaurant_id) {
                setRestaurantId(profile.restaurant_id);
                const data = await getWorkingHours(profile.restaurant_id);
                if (data && data.length > 0) {
                    // Merge saved hours with default hours to ensure all 7 days exist in state
                    const merged = DEFAULT_HOURS.map(dh => {
                        const saved = data.find(d => d.day_of_week === dh.day_of_week);
                        return saved ? saved : dh;
                    });
                    setHours(merged);
                }
            }
            setLoading(false);
        };
        load();
    }, []);

    const handleTimeChange = (dayIndex: number, field: "open_time" | "close_time", value: string) => {
        const newHours = [...hours];
        newHours[dayIndex] = { ...newHours[dayIndex], [field]: value };
        setHours(newHours);
    };

    const handleToggleClosed = (dayIndex: number) => {
        const newHours = [...hours];
        newHours[dayIndex] = { ...newHours[dayIndex], is_closed: !newHours[dayIndex].is_closed };
        setHours(newHours);
    };

    const handleSave = async () => {
        if (!restaurantId) return;
        setSaving(true);
        try {
            await Promise.all(
                hours.map(h =>
                    updateWorkingHour(restaurantId, h.day_of_week, h.open_time, h.close_time, h.is_closed)
                )
            );
            toast.success("Working hours saved successfully");
        } catch {
            toast.error("Failed to save working hours");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Working Hours</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Set your restaurant's weekly schedule for accepting orders
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="gradient-emerald text-white rounded-xl gap-2 w-32"
                >
                    {saving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                        "Save Changes"
                    )}
                </Button>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border/20">
                {hours.map((hour, idx) => (
                    <div key={idx} className={`p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${hour.is_closed ? 'bg-secondary/10 opacity-70' : 'bg-transparent'}`}>
                        <div className="flex items-center gap-4 w-48">
                            <Clock className={`w-5 h-5 ${hour.is_closed ? 'text-muted-foreground' : 'text-primary'}`} />
                            <span className="font-semibold text-base">{DAYS[hour.day_of_week]}</span>
                        </div>

                        <div className="flex items-center justify-between flex-1 gap-4 sm:gap-8">
                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={!hour.is_closed}
                                    onCheckedChange={() => handleToggleClosed(idx)}
                                />
                                <span className={`text-sm font-medium ${!hour.is_closed ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                    {hour.is_closed ? 'Closed' : 'Open'}
                                </span>
                            </div>

                            <div className={`flex items-center gap-2 transition-opacity duration-200 ${hour.is_closed ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                                <Input
                                    type="time"
                                    value={hour.open_time}
                                    onChange={(e) => handleTimeChange(idx, "open_time", e.target.value)}
                                    className="w-28 rounded-xl bg-secondary/50 text-center font-medium"
                                />
                                <span className="text-muted-foreground mx-1">to</span>
                                <Input
                                    type="time"
                                    value={hour.close_time}
                                    onChange={(e) => handleTimeChange(idx, "close_time", e.target.value)}
                                    className="w-28 rounded-xl bg-secondary/50 text-center font-medium"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
