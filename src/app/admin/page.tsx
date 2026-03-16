"use client";

import { useState, useEffect, useCallback } from "react";
import { getPlatformMetrics } from "@/lib/actions/admin";
import { RevenueChart, GrowthChart } from "@/components/admin/AdminCharts";
import { AdminActivityLogs } from "@/components/admin/AdminActivityLogs";
import { AdminBroadcast } from "@/components/admin/AdminBroadcast";
import {
    Store, ShoppingCart, Users, DollarSign,
    Zap, Crown, Rocket, Megaphone, RefreshCw, Clock,
    TrendingUp, TrendingDown, Activity, BarChart3, Minus,
    Puzzle, Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";

export default function AdminOverviewPage() {
    const [metrics, setMetrics] = useState<Awaited<ReturnType<typeof getPlatformMetrics>> | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        const data = await getPlatformMetrics();
        setMetrics(data);
        setLastUpdated(new Date());
        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-64 bg-secondary/50 rounded-xl animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-secondary/30 rounded-2xl animate-pulse" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-80 bg-secondary/20 rounded-2xl animate-pulse" />
                    <div className="h-80 bg-secondary/20 rounded-2xl animate-pulse" />
                </div>
            </div>
        );
    }

    if (!metrics) return null;

    const m = metrics as any;

    const GrowthBadge = ({ pct }: { pct: number | null }) => {
        if (pct === null) return null;
        const positive = pct >= 0;
        return (
            <span className={`flex items-center gap-0.5 text-[10px] font-medium ${positive ? "text-emerald-400" : "text-red-400"}`}>
                {pct === 0 ? <Minus className="w-3 h-3" /> : positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(pct)}%
            </span>
        );
    };

    const kpiCards = [
        {
            label: "إجمالي المطاعم",
            value: metrics.totalRestaurants,
            sub: `${m.newRestaurantsThisMonth} جديد هذا الشهر`,
            growth: m.restaurantGrowthPct,
            icon: Store, color: "text-emerald-400", bg: "bg-emerald-500/10",
        },
        {
            label: "الطلبات (آخر 24س)",
            value: metrics.activeOrders24h,
            sub: `${metrics.totalOrders.toLocaleString()} إجمالي`,
            growth: null,
            icon: ShoppingCart, color: "text-blue-400", bg: "bg-blue-500/10",
        },
        {
            label: "إيرادات هذا الشهر",
            value: `${(m.thisMonthRevenue / 1000).toFixed(0)}K`,
            sub: `متوسط الطلب ${m.avgOrderValue.toLocaleString()} د.ع`,
            growth: m.revenueGrowthPct,
            icon: DollarSign, color: "text-amber-400", bg: "bg-amber-500/10",
        },
        {
            label: "إجمالي المستخدمين",
            value: metrics.totalUsers,
            sub: `${m.activeRestaurantsCount} مطعم نشط (7 أيام)`,
            growth: null,
            icon: Users, color: "text-violet-400", bg: "bg-violet-500/10",
        },
    ];

    const ADDON_LABELS_AR: Record<string, string> = {
        discounts: "خصومات",
        advanced_delivery: "توصيل متقدم",
        analytics_pro: "تحليلات برو",
        custom_branding: "براند مخصص",
        custom_domain: "دومين",
    };

    const advancedKPIs = [
        {
            label: "MRR (تقديري)",
            value: `${(m.mrr / 1000).toFixed(0)}K`,
            unit: "د.ع/شهر",
            icon: BarChart3, color: "text-cyan-400", bg: "bg-cyan-500/10",
        },
        {
            label: "معدل الانقطاع",
            value: `${m.churnRate}%`,
            unit: `${m.churnCount} مطعم هذا الشهر`,
            icon: TrendingDown, color: "text-red-400", bg: "bg-red-500/10",
        },
        {
            label: "المطاعم النشطة",
            value: m.activeRestaurantsCount,
            unit: `من أصل ${metrics.totalRestaurants}`,
            icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10",
        },
        {
            label: "إيرادات الإضافات",
            value: `$${(m.addonMrr || 0).toFixed(0)}`,
            unit: "شهرياً",
            icon: Puzzle, color: "text-violet-400", bg: "bg-violet-500/10",
        },
        {
            label: "معدل اعتماد الإضافات",
            value: `${m.addonAttachRate || 0}%`,
            unit: "من المطاعم المدفوعة",
            icon: LinkIcon, color: "text-amber-400", bg: "bg-amber-500/10",
        },
        {
            label: "أكثر إضافة مستخدمة",
            value: m.topAddon ? (ADDON_LABELS_AR[m.topAddon] || m.topAddon) : "—",
            unit: m.topAddon ? `${(m.addonDistribution || {})[m.topAddon] || 0} تفعيل` : "لا توجد بعد",
            icon: Puzzle, color: "text-pink-400", bg: "bg-pink-500/10",
        },
    ];

    const planItems = [
        { plan: "مجاني", count: metrics.planCounts.free, icon: Zap, color: "text-gray-400", bg: "bg-gray-500/10" },
        { plan: "احترافي", count: metrics.planCounts.pro, icon: Crown, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        { plan: "أعمال", count: metrics.planCounts.business, icon: Rocket, color: "text-violet-400", bg: "bg-violet-500/10" },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">نظرة عامة على المنصة</h1>
                    <p className="text-muted-foreground mt-1 text-sm">إحصائيات شاملة لجميع المطاعم المسجلة.</p>
                </div>
                <div className="flex items-center gap-3">
                    {lastUpdated && (
                        <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            آخر تحديث: {lastUpdated.toLocaleTimeString("ar-IQ")}
                        </span>
                    )}
                    <button
                        onClick={() => load(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 hover:bg-secondary/80 border border-border/40 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                        تحديث
                    </button>
                </div>
            </div>

            {/* Main KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((card, i) => (
                    <div key={i} className="glass-card rounded-2xl p-5 border border-border/40">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-muted-foreground">{card.label}</span>
                            <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                                <card.icon className={`w-4 h-4 ${card.color}`} />
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold">{card.value}</span>
                            <GrowthBadge pct={card.growth} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Advanced KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {advancedKPIs.map((kpi, i) => (
                    <div key={i} className="glass-card rounded-2xl p-5 border border-border/40 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl ${kpi.bg} flex items-center justify-center shrink-0`}>
                            <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">{kpi.label}</p>
                            <p className="text-2xl font-bold mt-0.5">{kpi.value}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.unit}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Top Restaurants & Plan Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-border/40">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Store className="w-5 h-5 text-emerald-400" />
                        أهم المطاعم (آخر 30 يوم)
                    </h3>
                    <div className="space-y-3">
                        {m.topRestaurants?.map((rest: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-xs font-bold text-emerald-500">
                                        #{i + 1}
                                    </div>
                                    <span className="text-sm font-medium">{rest.name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground font-mono">{rest.count} طلب</span>
                            </div>
                        ))}
                        {!m.topRestaurants?.length && (
                            <p className="text-center py-8 text-xs text-muted-foreground italic">لا توجد بيانات كافية</p>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1 glass-card rounded-2xl p-6 border border-border/40 space-y-6">
                    {/* Plan distribution */}
                    <div>
                        <h3 className="text-base font-bold mb-4">توزيع الباقات</h3>
                        <div className="space-y-3">
                            {planItems.map((item, i) => {
                                const total = metrics.totalRestaurants || 1;
                                const pct = Math.round((item.count / total) * 100);
                                return (
                                    <div key={i} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center`}>
                                                    <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                                                </div>
                                                <span className="text-sm font-medium">{item.plan}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">{pct}%</span>
                                                <span className="text-sm font-bold w-6 text-right">{item.count}</span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${item.color.replace("text-", "bg-").replace("400", "500")}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Addon distribution */}
                    {m.addonDistribution && Object.keys(m.addonDistribution).length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold">توزيع الإضافات</h3>
                                <Link href="/admin/addons" className="text-xs text-violet-400 hover:underline">عرض الكل</Link>
                            </div>
                            <div className="space-y-2">
                                {Object.entries(m.addonDistribution as Record<string, number>)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([key, count]) => (
                                        <div key={key} className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">{ADDON_LABELS_AR[key] || key}</span>
                                            <span className="font-bold text-violet-400">{count}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card rounded-2xl p-6 border border-border/40">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold">نمو الإيرادات</h3>
                        <span className="text-xs text-muted-foreground">آخر 30 يوم</span>
                    </div>
                    <RevenueChart data={metrics.chartData} />
                </div>

                <div className="glass-card rounded-2xl p-6 border border-border/40">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold">نمو المطاعم</h3>
                        <span className="text-xs text-muted-foreground">آخر 30 يوم</span>
                    </div>
                    <GrowthChart data={metrics.chartData} />
                </div>
            </div>

            {/* Activity Logs & Broadcast */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 glass-card rounded-2xl p-6 border border-border/40">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-primary" />
                        إعلان للمطاعم
                    </h3>
                    <AdminBroadcast />
                </div>

                <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-border/40">
                    <h3 className="text-lg font-bold mb-6">نشاطات المنصة</h3>
                    <AdminActivityLogs />
                </div>
            </div>
        </div>
    );
}
