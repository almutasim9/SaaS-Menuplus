"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Store, Car, Truck } from "lucide-react";
import { updateOrderTypeSettings } from "@/lib/actions/settings";
import { toast } from "sonner";

interface StoreSettingsTogglesProps {
    restaurantId: string;
    initialSettings: {
        is_dine_in_enabled: boolean;
        is_takeaway_enabled: boolean;
        is_delivery_enabled: boolean;
    };
}

export function StoreSettingsToggles({ restaurantId, initialSettings }: StoreSettingsTogglesProps) {
    const [settings, setSettings] = useState(initialSettings);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleToggle = async (key: keyof typeof initialSettings, checked: boolean) => {
        const newSettings = { ...settings, [key]: checked };

        // Prevent disabling all
        if (!newSettings.is_dine_in_enabled && !newSettings.is_takeaway_enabled && !newSettings.is_delivery_enabled) {
            toast.error("You must have at least one order type enabled.");
            return;
        }

        setSettings(newSettings);
        setIsUpdating(true);

        try {
            await updateOrderTypeSettings(restaurantId, newSettings);
            toast.success("Order settings updated successfully.");
        } catch (error: any) {
            toast.error(error.message || "Failed to update settings.");
            // Revert on error
            setSettings(settings);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="glass-card rounded-3xl p-6 border-border/50 col-span-1 md:col-span-full mb-8">
            <div className="mb-4">
                <h2 className="text-xl font-semibold">Order Methods</h2>
                <p className="text-sm text-muted-foreground">Turn specific ordering types on or off for your customers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Dine in Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <Store className="w-5 h-5" />
                        </div>
                        <div>
                            <Label htmlFor="dine-in" className="font-semibold text-base cursor-pointer">Dine-in</Label>
                            <p className="text-xs text-muted-foreground">Orders from tables inside the restaurant</p>
                        </div>
                    </div>
                    <Switch
                        id="dine-in"
                        checked={settings.is_dine_in_enabled}
                        disabled={isUpdating}
                        onCheckedChange={(c) => handleToggle("is_dine_in_enabled", c)}
                    />
                </div>

                {/* Takeaway Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                            <Car className="w-5 h-5" />
                        </div>
                        <div>
                            <Label htmlFor="takeaway" className="font-semibold text-base cursor-pointer">Takeaway</Label>
                            <p className="text-xs text-muted-foreground">Customer picks up the order</p>
                        </div>
                    </div>
                    <Switch
                        id="takeaway"
                        checked={settings.is_takeaway_enabled}
                        disabled={isUpdating}
                        onCheckedChange={(c) => handleToggle("is_takeaway_enabled", c)}
                    />
                </div>

                {/* Delivery Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600">
                            <Truck className="w-5 h-5" />
                        </div>
                        <div>
                            <Label htmlFor="delivery" className="font-semibold text-base cursor-pointer">Delivery</Label>
                            <p className="text-xs text-muted-foreground">Orders delivered to the customer</p>
                        </div>
                    </div>
                    <Switch
                        id="delivery"
                        checked={settings.is_delivery_enabled}
                        disabled={isUpdating}
                        onCheckedChange={(c) => handleToggle("is_delivery_enabled", c)}
                    />
                </div>
            </div>
        </div>
    );
}
