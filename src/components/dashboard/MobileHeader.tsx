"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { NotificationBell } from "./NotificationBell";

export function MobileHeader() {
    const [restaurantName, setRestaurantName] = useState<string>("");
    const [greeting, setGreeting] = useState("");

    useEffect(() => {
        // Time-based greeting
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("صباح الخير");
        else if (hour < 18) setGreeting("مساء الخير");
        else setGreeting("مساء النور");

        // Fetch restaurant name
        async function load() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("full_name, restaurants(name)")
                .eq("id", user.id)
                .single();

            if (profile?.restaurants) {
                const restaurant = profile.restaurants as unknown as { name: string };
                setRestaurantName(restaurant.name || "");
            }
        }
        load();
    }, []);

    return (
        <div
            className="lg:hidden fixed top-0 left-0 right-0 z-40 px-5 flex items-center justify-between"
            style={{
                height: '60px',
                background: 'rgba(10,10,10,0.85)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                paddingTop: 'env(safe-area-inset-top, 0px)',
            }}
        >
            <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-500 font-medium">{greeting} 👋</p>
                <h1 className="text-sm font-bold truncate">{restaurantName || "MenuPlus"}</h1>
            </div>
            <NotificationBell />
        </div>
    );
}
