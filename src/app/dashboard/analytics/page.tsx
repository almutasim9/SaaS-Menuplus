"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart3, TrendingUp, ShoppingBag, Package, Eye,
    QrCode, Link2, Users, Lock, Crown, Rocket,
} from "lucide-react";
import { getDashboardMetrics } from "@/lib/actions/analytics";
import { getVisitStats, type VisitStats } from "@/lib/actions/visits";
import { useTranslation } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { getSubscriptionStatus } from "@/lib/actions/subscription";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";

function PlanBadge({ plan }: { plan: "business" | "pro" }) {
    if (plan === "pro") {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/20">
                <Rocket className="w-2.5 h-2.5" /> Pro
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <Crown className="w-2.5 h-2.5" /> Business+
        </span>
    );
}

export default function AnalyticsPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState("7");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [chartMetric, setChartMetric] = useState<"revenue" | "orders">("revenue");
    const [hasAdvanced, setHasAdvanced] = useState(false);
    const [isPro, setIsPro] = useState(false);

    const [metrics, setMetrics] = useState<{
        totalOrders: number;
        totalRevenue: number;
        topProducts: { name: string; sales: number }[];
        dailyData: { date: string; revenue: number; orders: number }[];
        conversionRates: { name: string; views: number; sales: number; rate: number }[];
    } | null>(null);
    const [visitStats, setVisitStats] = useState<VisitStats | null>(null);

    useEffect(() => {
        async function fetchAnalytics() {
            setLoading(true);
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: restaurant } = await supabase
                    .from("restaurants")
                    .select("id")
                    .eq("owner_id", user.id)
                    .single();

                if (!restaurant) return;

                const subscription = await getSubscriptionStatus(restaurant.id);
                const advanced = subscription?.features.includes("advanced_analytics") ?? false;
                const pro = subscription?.plan === "pro";
                setHasAdvanced(advanced);
                setIsPro(pro);

                // Business: max 30 days. Pro: unlimited + custom range.
                const effectiveRange = (!pro && (timeRange === "0" || timeRange === "custom")) ? "30" : timeRange;

                let start: string | undefined;
                let end: string | undefined;

                if (effectiveRange === "custom") {
                    if (customStart) start = new Date(customStart).toISOString();
                    if (customEnd) end = new Date(customEnd).toISOString();
                } else if (effectiveRange !== "0") {
                    const days = parseInt(effectiveRange);
                    start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
                }

                if (advanced) {
                    const [metricsData, visitsData] = await Promise.all([
                        getDashboardMetrics(restaurant.id, start, end),
                        getVisitStats(restaurant.id, parseInt(timeRange) || 7).catch(() => null),
                    ]);
                    setMetrics(metricsData);
                    setVisitStats(visitsData);
                } else {
                    const metricsData = await getDashboardMetrics(restaurant.id, start, end);
                    setMetrics(metricsData);
                }
            } catch (err) {
                console.error("Failed to load analytics", err);
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, [timeRange, customStart, customEnd]);

    const getRangeLabel = () => {
        if (timeRange === "1") return t("analytics.today");
        if (timeRange === "7") return t("analytics.last7Days");
        if (timeRange === "30") return t("analytics.last30Days");
        if (timeRange === "custom") return t("analytics.customRange");
        return t("analytics.allTime");
    };

    if (loading && !metrics) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!metrics) {
        return <div>فشل تحميل لوحة التحليلات. حاول مرة أخرى.</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{t("analytics.title")}</h1>
                    <p className="text-muted-foreground text-sm mt-1">{t("analytics.subtitle")}</p>
                </div>

                {hasAdvanced && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground hidden md:inline">{t("analytics.filterRange")}:</span>
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[180px] glass-card border-border/50">
                                <SelectValue placeholder={t("analytics.selectRange")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">{t("analytics.today")}</SelectItem>
                                <SelectItem value="7">{t("analytics.last7Days")}</SelectItem>
                                <SelectItem value="30">{t("analytics.last30Days")}</SelectItem>
                                {isPro && <SelectItem value="0">{t("analytics.allTime")}</SelectItem>}
                                {isPro && <SelectItem value="custom">{t("analytics.customRange")}</SelectItem>}
                            </SelectContent>
                        </Select>
                        {!isPro && (
                            <span className="text-xs text-muted-foreground hidden md:inline">(آخر 30 يوم كحد أقصى)</span>
                        )}
                    </div>
                )}
            </div>

            {/* Pro upgrade banner for Business users */}
            {hasAdvanced && !isPro && (
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-sm">
                    <div className="flex items-center gap-2 text-violet-400">
                        <Lock className="w-4 h-4 shrink-0" />
                        <span>خطة Pro تتيح لك عرض كل التاريخ وفلترة تواريخ مخصصة</span>
                    </div>
                    <Button asChild size="sm" variant="outline" className="border-violet-500/40 text-violet-400 hover:bg-violet-500/10 shrink-0">
                        <Link href="/dashboard/billing">ترقية</Link>
                    </Button>
                </div>
            )}

            {/* Custom date range picker — Pro only */}
            {hasAdvanced && isPro && timeRange === "custom" && (
                <div className="flex flex-wrap items-center gap-3 p-4 bg-secondary/20 rounded-2xl border border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground px-1">{t("analytics.from")}</p>
                        <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-[160px] h-9 glass-card border-border/50" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground px-1">{t("analytics.to")}</p>
                        <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-[160px] h-9 glass-card border-border/50" />
                    </div>
                </div>
            )}

            {/* ============================== */}
            {/* BASIC ANALYTICS — ALL PLANS   */}
            {/* ============================== */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Total Revenue */}
                <Card className="glass-card border-border/50 shadow-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                    <CardTitle className="text-sm font-medium text-muted-foreground">{t("analytics.totalRevenue")}</CardTitle>
                                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">مجموع قيمة الطلبات المكتملة</p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold bg-gradient-to-br from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                            {metrics.totalRevenue.toLocaleString()} <span className="text-sm">د.ع</span>
                        </div>
                        <p className="text-xs text-emerald-600/80 mt-1 font-medium">{getRangeLabel()}</p>
                    </CardContent>
                </Card>

                {/* Total Orders */}
                <Card className="glass-card border-border/50 shadow-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <CardTitle className="text-sm font-medium text-muted-foreground">{t("analytics.totalOrders")}</CardTitle>
                                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">الطلبات التي نُفِّذت بنجاح</p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{metrics.totalOrders}</div>
                        <p className="text-xs text-muted-foreground mt-1">{t("analytics.fulfilled")}</p>
                    </CardContent>
                </Card>

                {/* Top Product */}
                <Card className="glass-card border-border/50 shadow-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <CardTitle className="text-sm font-medium text-muted-foreground">{t("analytics.topProduct")}</CardTitle>
                                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">الأكثر مبيعاً بعدد الوحدات</p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold truncate">
                            {metrics.topProducts.length > 0 ? metrics.topProducts[0].name : t("common.noData")}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {metrics.topProducts.length > 0
                                ? `${metrics.topProducts[0].sales} ${t("analytics.unitsSold")}`
                                : t("analytics.waitingOrders")}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* ================================ */}
            {/* ADVANCED — BUSINESS + PRO        */}
            {/* ================================ */}
            {hasAdvanced ? (
                <>
                    {/* Visit Stats Cards */}
                    {visitStats && (
                        <>
                            <div className="grid gap-4 md:grid-cols-3">
                                {/* Total Visits */}
                                <Card className="glass-card border-border/50 shadow-sm relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <CardTitle className="text-sm font-medium text-muted-foreground">{t("analytics.totalVisits")}</CardTitle>
                                                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">عدد مرات فتح قائمتك</p>
                                                </div>
                                            </div>
                                            <PlanBadge plan="business" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-blue-400 bg-clip-text text-transparent">
                                            {visitStats.totalVisits.toLocaleString()}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{getRangeLabel()}</p>
                                    </CardContent>
                                </Card>

                                {/* QR Visits */}
                                <Card className="glass-card border-border/50 shadow-sm relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <QrCode className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <CardTitle className="text-sm font-medium text-muted-foreground">{t("analytics.viaQr")}</CardTitle>
                                                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">زبائن وصلوا عبر مسح QR</p>
                                                </div>
                                            </div>
                                            <PlanBadge plan="business" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-violet-500">
                                            {visitStats.qrVisits.toLocaleString()}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {visitStats.totalVisits > 0
                                                ? `${Math.round((visitStats.qrVisits / visitStats.totalVisits) * 100)}% ${t("analytics.ofTotal")}`
                                                : t("common.noData")}
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Direct Visits */}
                                <Card className="glass-card border-border/50 shadow-sm relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <Link2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <CardTitle className="text-sm font-medium text-muted-foreground">{t("analytics.viaDirect")}</CardTitle>
                                                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">زبائن وصلوا عبر مشاركة الرابط</p>
                                                </div>
                                            </div>
                                            <PlanBadge plan="business" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-emerald-500">
                                            {visitStats.directVisits.toLocaleString()}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {visitStats.totalVisits > 0
                                                ? `${Math.round((visitStats.directVisits / visitStats.totalVisits) * 100)}% ${t("analytics.ofTotal")}`
                                                : t("common.noData")}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Daily Visits Chart */}
                            <Card className="glass-card border-border/50 shadow-sm">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Eye className="w-5 h-5 text-blue-500" />
                                                {t("analytics.visitsTrend")} ({getRangeLabel()})
                                            </CardTitle>
                                            <p className="text-[11px] text-muted-foreground/70 mt-1 ms-7">توزيع الزيارات اليومية بين QR والرابط المباشر</p>
                                        </div>
                                        <PlanBadge plan="business" />
                                    </div>
                                </CardHeader>
                                <CardContent className="pl-2">
                                    <div className="h-[280px] w-full mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={visitStats.dailyVisits}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }}
                                                />
                                                <Legend />
                                                <Bar dataKey="qr" name={t("analytics.qrCode")} fill="#8b5cf6" radius={[4, 4, 0, 0]} stackId="visits" />
                                                <Bar dataKey="direct" name={t("analytics.directLink")} fill="#10b981" radius={[4, 4, 0, 0]} stackId="visits" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Revenue/Orders Chart + Top Products */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                        {/* Revenue/Orders Chart */}
                        <Card className="col-span-4 glass-card border-border/50 shadow-sm">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-lg font-semibold">
                                            {chartMetric === 'revenue' ? t("analytics.revenueTrend") : t("analytics.ordersTrend")} ({getRangeLabel()})
                                        </CardTitle>
                                        <p className="text-[11px] text-muted-foreground/70 mt-1">
                                            {chartMetric === 'revenue'
                                                ? "تطور الإيرادات يومياً خلال الفترة المحددة"
                                                : "تطور عدد الطلبات يومياً خلال الفترة المحددة"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <PlanBadge plan="business" />
                                        <div className="flex bg-secondary/50 p-1 rounded-xl border border-border/50">
                                            <button
                                                onClick={() => setChartMetric('revenue')}
                                                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${chartMetric === 'revenue' ? 'bg-primary text-white shadow-md scale-[1.02]' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                {t("analytics.revenue")}
                                            </button>
                                            <button
                                                onClick={() => setChartMetric('orders')}
                                                className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${chartMetric === 'orders' ? 'bg-primary text-white shadow-md scale-[1.02]' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                {t("analytics.orders")}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[300px] w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={metrics.dailyData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis
                                                stroke="#888888" fontSize={12} tickLine={false} axisLine={false}
                                                tickFormatter={(value) => chartMetric === 'revenue' ? `${value.toLocaleString()}` : `${value}`}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 4 }}
                                                contentStyle={{
                                                    backgroundColor: 'rgba(255,255,255,0.95)',
                                                    backdropFilter: 'blur(8px)',
                                                    borderRadius: '12px',
                                                    border: '1px solid rgba(0,0,0,0.1)',
                                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                                    color: '#000',
                                                }}
                                                formatter={(value: number | undefined) => [
                                                    chartMetric === 'revenue' ? `${(value ?? 0).toLocaleString()} د.ع` : (value ?? 0),
                                                    chartMetric === 'revenue' ? (t("analytics.revenue") || "المبيعات") : (t("analytics.orders") || "الطلبات"),
                                                ]}
                                            />
                                            <Bar dataKey={chartMetric} radius={[6, 6, 0, 0]} className={chartMetric === 'revenue' ? "fill-emerald-500" : "fill-primary"} animationDuration={1500} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Selling Products */}
                        <Card className="col-span-3 glass-card border-border/50 shadow-sm">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle>{t("analytics.topSelling")}</CardTitle>
                                        <p className="text-[11px] text-muted-foreground/70 mt-1">المنتجات مرتبةً حسب الوحدات المباعة</p>
                                    </div>
                                    <PlanBadge plan="business" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6 mt-4">
                                    {metrics.topProducts.length > 0 ? (
                                        metrics.topProducts.map((product, index) => (
                                            <div key={index} className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center mr-4">
                                                    <Package className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <p className="text-sm font-medium leading-none">{product.name}</p>
                                                </div>
                                                <div className="font-medium text-sm">
                                                    {product.sales} <span className="text-muted-foreground font-normal text-xs">{t("analytics.unitsSold")}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 text-muted-foreground text-sm">
                                            {t("analytics.noSalesData")}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Intent Analytics */}
                    <Card className="glass-card border-border/50 shadow-sm w-full outline-emerald-500/20 outline">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Eye className="w-5 h-5 text-emerald-500" />
                                        {t("analytics.intentAnalytics")}
                                    </CardTitle>
                                    <p className="text-[11px] text-muted-foreground/70 mt-1 ms-7">نسبة تحويل مشاهدات المنتج إلى مبيعات فعلية</p>
                                </div>
                                <PlanBadge plan="business" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full overflow-x-auto">
                                <table className="w-full text-sm text-left whitespace-nowrap">
                                    <thead className="text-xs text-muted-foreground uppercase bg-secondary/30 rounded-lg">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 rounded-l-lg">{t("analytics.productName")}</th>
                                            <th scope="col" className="px-6 py-3 text-center">{t("analytics.totalViews")}</th>
                                            <th scope="col" className="px-6 py-3 text-center">{t("analytics.totalSold")}</th>
                                            <th scope="col" className="px-6 py-3 text-right rounded-r-lg">{t("analytics.conversionRate")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {metrics.conversionRates.length > 0 ? (
                                            metrics.conversionRates.map((item, idx) => (
                                                <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4 font-medium">{item.name}</td>
                                                    <td className="px-6 py-4 text-center">{item.views}</td>
                                                    <td className="px-6 py-4 text-center">{item.sales}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full ${item.rate > 10 ? 'bg-emerald-500' : item.rate > 2 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                                    style={{ width: `${item.rate}%` }}
                                                                />
                                                            </div>
                                                            <span className="font-bold min-w-[40px]">{item.rate}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                                                    {t("analytics.noViewData")}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : (
                /* Upgrade prompt for Free plan */
                <Card className="glass-card border-border/50 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-violet-500/5" />
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4 relative">
                        <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center">
                            <Lock className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-1">التحليلات المتقدمة</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                احصل على تقارير الزيارات اليومية، مخططات الإيرادات، أفضل المنتجات، ونسب تحويل الزبائن.
                                متاح في خطة Business وما فوق.
                            </p>
                        </div>
                        <Button asChild className="mt-2">
                            <Link href="/dashboard/billing">ترقية الخطة</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
