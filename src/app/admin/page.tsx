"use client";

import { useState, useEffect } from "react";
import { getPlatformMetrics } from "@/lib/actions/admin";
import { Store, ShoppingCart, Users, DollarSign, Zap, Crown, Rocket } from "lucide-react";

export default function AdminOverviewPage() {
    const [metrics, setMetrics] = useState<Awaited<ReturnType<typeof getPlatformMetrics>> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await getPlatformMetrics();
            setMetrics(data);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-64 bg-secondary/50 rounded-xl animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-secondary/30 rounded-2xl animate-pulse" />)}
                </div>
            </div>
        );
    }

    if (!metrics) return null;

    const cards = [
        { label: "إجمالي المطاعم", value: metrics.totalRestaurants, icon: Store, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "إجمالي الطلبات", value: metrics.totalOrders, icon: ShoppingCart, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "إجمالي المستخدمين", value: metrics.totalUsers, icon: Users, color: "text-violet-500", bg: "bg-violet-500/10" },
        { label: "إجمالي الإيرادات", value: `${(metrics.totalRevenue / 1000).toFixed(0)}K`, icon: DollarSign, color: "text-amber-500", bg: "bg-amber-500/10" },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">نظرة عامة على المنصة</h1>
                <p className="text-muted-foreground mt-1">إحصائيات شاملة لجميع المطاعم المسجلة.</p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, i) => (
                    <div key={i} className="glass-card rounded-2xl p-5 border border-border/40">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-muted-foreground">{card.label}</span>
                            <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                                <card.icon className={`w-4 h-4 ${card.color}`} />
                            </div>
                        </div>
                        <span className="text-3xl font-bold">{card.value}</span>
                    </div>
                ))}
            </div>

            {/* Plan Distribution */}
            <div className="glass-card rounded-2xl p-6 border border-border/40">
                <h3 className="text-lg font-bold mb-4">توزيع الخطط</h3>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { plan: "Free", count: metrics.planCounts.free, icon: Zap, color: "text-gray-400", bg: "bg-gray-500/10" },
                        { plan: "Pro", count: metrics.planCounts.pro, icon: Crown, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                        { plan: "Business", count: metrics.planCounts.business, icon: Rocket, color: "text-violet-400", bg: "bg-violet-500/10" },
                    ].map((item, i) => (
                        <div key={i} className="text-center p-4 rounded-xl bg-secondary/30">
                            <item.icon className={`w-6 h-6 mx-auto mb-2 ${item.color}`} />
                            <p className="text-2xl font-bold">{item.count}</p>
                            <p className="text-xs text-muted-foreground">{item.plan}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
