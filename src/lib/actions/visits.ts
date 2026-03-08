"use server";

import { createClient } from "@/lib/supabase/server";

export type VisitStats = {
    totalVisits: number;
    qrVisits: number;
    directVisits: number;
    dailyVisits: { date: string; qr: number; direct: number; total: number }[];
};

export async function getVisitStats(restaurantId: string): Promise<VisitStats> {
    const supabase = await createClient();

    // Total counts by source
    const [totalRes, qrRes, directRes] = await Promise.all([
        supabase
            .from("visits")
            .select("id", { count: "exact", head: true })
            .eq("restaurant_id", restaurantId),
        supabase
            .from("visits")
            .select("id", { count: "exact", head: true })
            .eq("restaurant_id", restaurantId)
            .eq("source", "qr"),
        supabase
            .from("visits")
            .select("id", { count: "exact", head: true })
            .eq("restaurant_id", restaurantId)
            .eq("source", "direct"),
    ]);

    // Last 7 days daily breakdown
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentVisits } = await supabase
        .from("visits")
        .select("source, created_at")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: true });

    // Aggregate by day
    const dayMap: Record<string, { qr: number; direct: number }> = {};

    // Initialize all 7 days
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        dayMap[key] = { qr: 0, direct: 0 };
    }

    (recentVisits || []).forEach((v) => {
        const day = new Date(v.created_at).toISOString().split("T")[0];
        if (dayMap[day]) {
            if (v.source === "qr") dayMap[day].qr++;
            else dayMap[day].direct++;
        }
    });

    const dailyVisits = Object.entries(dayMap).map(([date, counts]) => ({
        date: new Date(date).toLocaleDateString("ar-IQ", { weekday: "short", day: "numeric" }),
        qr: counts.qr,
        direct: counts.direct,
        total: counts.qr + counts.direct,
    }));

    return {
        totalVisits: totalRes.count || 0,
        qrVisits: qrRes.count || 0,
        directVisits: directRes.count || 0,
        dailyVisits,
    };
}
