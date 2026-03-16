"use server";

import { createClient } from "@/lib/supabase/server";

export type VisitStats = {
    totalVisits: number;
    qrVisits: number;
    directVisits: number;
    dailyVisits: { date: string; qr: number; direct: number; total: number }[];
};

export async function getVisitStats(restaurantId: string, days: number = 7): Promise<VisitStats> {
    const supabase = await createClient();

    const startDate = days > 0 
        ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
        : '1970-01-01T00:00:00Z';

    // Total counts by source (Time Bound)
    const [totalRes, qrRes, directRes] = await Promise.all([
        supabase
            .from("visits")
            .select("id", { count: "exact", head: true })
            .eq("restaurant_id", restaurantId)
            .gte("created_at", startDate),
        supabase
            .from("visits")
            .select("id", { count: "exact", head: true })
            .eq("restaurant_id", restaurantId)
            .eq("source", "qr")
            .gte("created_at", startDate),
        supabase
            .from("visits")
            .select("id", { count: "exact", head: true })
            .eq("restaurant_id", restaurantId)
            .eq("source", "direct")
            .gte("created_at", startDate),
    ]);

    // Daily breakdown for the selected period (max 30 days for the chart to avoid clutter)
    const chartDays = days > 0 ? (days > 30 ? 30 : days) : 30;
    const chartStartDate = new Date(Date.now() - chartDays * 24 * 60 * 60 * 1000);

    const { data: recentVisits } = await supabase
        .from("visits")
        .select("source, created_at")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", chartStartDate.toISOString())
        .order("created_at", { ascending: true });

    // Aggregate by day
    const dayMap: Record<string, { qr: number; direct: number }> = {};

    // Initialize the chart periods
    for (let i = chartDays - 1; i >= 0; i--) {
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
