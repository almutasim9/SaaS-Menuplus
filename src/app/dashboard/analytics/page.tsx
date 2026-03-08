"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, ShoppingBag, Package, Eye, Percent, QrCode, Link2, Users } from "lucide-react";
import { getDashboardMetrics } from "@/lib/actions/analytics";
import { getVisitStats, type VisitStats } from "@/lib/actions/visits";
import { useTranslation } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

export default function AnalyticsPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<{
        totalOrders: number;
        totalRevenue: number;
        topProducts: { name: string; sales: number }[];
        revenueData: { date: string; revenue: number }[];
        conversionRates: { name: string; views: number; sales: number; rate: number }[];
    } | null>(null);
    const [visitStats, setVisitStats] = useState<VisitStats | null>(null);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: restaurant } = await supabase
                    .from("restaurants")
                    .select("id")
                    .eq("owner_id", user.id)
                    .single();

                if (restaurant) {
                    const [metricsData, visitsData] = await Promise.all([
                        getDashboardMetrics(restaurant.id),
                        getVisitStats(restaurant.id).catch(() => null),
                    ]);
                    setMetrics(metricsData);
                    setVisitStats(visitsData);
                }
            } catch (err) {
                console.error("Failed to load analytics", err);
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, []);

    if (loading) {
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
            <div>
                <h1 className="text-2xl font-bold">{t("analytics.title")}</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    {t("analytics.subtitle")}
                </p>
            </div>

            {/* ============================== */}
            {/* VISIT STATS SECTION */}
            {/* ============================== */}
            {visitStats && (
                <>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="glass-card border-border/50 shadow-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t("analytics.totalVisits")}</CardTitle>
                                <Users className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-blue-400 bg-clip-text text-transparent">
                                    {visitStats.totalVisits.toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{t("analytics.allTime")}</p>
                            </CardContent>
                        </Card>

                        <Card className="glass-card border-border/50 shadow-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t("analytics.viaQr")}</CardTitle>
                                <QrCode className="h-4 w-4 text-violet-500" />
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

                        <Card className="glass-card border-border/50 shadow-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t("analytics.viaDirect")}</CardTitle>
                                <Link2 className="h-4 w-4 text-emerald-500" />
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
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="w-5 h-5 text-blue-500" />
                                {t("analytics.visitsLast7")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[280px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={visitStats.dailyVisits}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
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

            {/* ============================== */}
            {/* REVENUE & ORDERS */}
            {/* ============================== */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="glass-card border-border/50 shadow-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{t("analytics.totalRevenue")}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold bg-gradient-to-br from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                            {metrics.totalRevenue.toLocaleString()} <span className="text-sm">د.ع</span>
                        </div>
                        <p className="text-xs text-emerald-600/80 mt-1 font-medium">{t("analytics.allTime")}</p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-border/50 shadow-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{t("analytics.totalOrders")}</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{metrics.totalOrders}</div>
                        <p className="text-xs text-muted-foreground mt-1">{t("analytics.fulfilled")}</p>
                    </CardContent>
                </Card>
                <Card className="glass-card border-border/50 shadow-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{t("analytics.topProduct")}</CardTitle>
                        <BarChart3 className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold truncate">
                            {metrics.topProducts.length > 0 ? metrics.topProducts[0].name : t("common.noData")}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {metrics.topProducts.length > 0 ? `${metrics.topProducts[0].sales} ${t("analytics.unitsSold")}` : t("analytics.waitingOrders")}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 glass-card border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle>{t("analytics.revenueLast7")}</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    />
                                    <Bar dataKey="revenue" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-emerald-500" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 glass-card border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle>{t("analytics.topSelling")}</CardTitle>
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

            {/* INTENT ANALYTICS */}
            <div className="grid gap-6">
                <Card className="glass-card border-border/50 shadow-sm w-full outline-emerald-500/20 outline">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="w-5 h-5 text-emerald-500" />
                            {t("analytics.intentAnalytics")}
                        </CardTitle>
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
            </div>
        </div>
    );
}
