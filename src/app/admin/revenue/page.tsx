"use client";

import { useState, useEffect, useCallback } from "react";
import { getRevenueMetrics } from "@/lib/actions/admin";
import { DollarSign, RefreshCw, TrendingUp, Users, Puzzle, Zap, Crown, Rocket } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Metrics = Awaited<ReturnType<typeof getRevenueMetrics>>;

const PLAN_LABELS: Record<string, string> = { free: "مجاني", business: "أعمال", pro: "برو" };
const PLAN_ICONS: Record<string, typeof Zap> = { free: Zap, business: Crown, pro: Rocket };
const PLAN_COLORS: Record<string, string> = { free: "text-gray-400", business: "text-emerald-400", pro: "text-violet-400" };
const ADDON_LABELS: Record<string, string> = {
    discounts: "خصومات وكوبونات",
    advanced_delivery: "توصيل متقدم",
    analytics_pro: "تحليلات برو",
    custom_branding: "براند مخصص",
    custom_domain: "دومين مخصص",
};

export default function RevenuePage() {
    const [data, setData] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const d = await getRevenueMetrics();
        setData(d);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-56 bg-secondary/50 rounded-xl animate-pulse" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-secondary/30 rounded-2xl animate-pulse" />)}
                </div>
            </div>
        );
    }

    if (!data) return null;

    const kpiCards = [
        { label: "إجمالي MRR", value: `$${data.totalMRR.toFixed(0)}`, sub: "خطط + إضافات", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        { label: "إيرادات الخطط", value: `$${data.planMRR.toFixed(0)}`, sub: "من اشتراكات الخطط فقط", icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10" },
        { label: "إيرادات الإضافات", value: `$${data.addonMRR.toFixed(0)}`, sub: `${data.totalAddons} تفعيل نشط`, icon: Puzzle, color: "text-violet-400", bg: "bg-violet-500/10" },
        { label: "ARPU", value: `$${data.arpu}`, sub: "متوسط الإيرادات / مطعم مدفوع", icon: Users, color: "text-amber-400", bg: "bg-amber-500/10" },
    ];

    const pieData = [
        { name: "إيرادات الخطط", value: data.planMRR, color: "#3b82f6" },
        { name: "إيرادات الإضافات", value: data.addonMRR, color: "#8b5cf6" },
    ].filter(d => d.value > 0);

    const planRows = [
        { plan: "free", price: 0, count: data.planCounts.free },
        { plan: "business", price: data.planPrices.business, count: data.planCounts.business },
        { plan: "pro", price: data.planPrices.pro, count: data.planCounts.pro },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <DollarSign className="w-7 h-7 text-emerald-400" />
                        لوحة الإيرادات
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">نظرة مالية شاملة على إيرادات المنصة.</p>
                </div>
                <button onClick={load} className="h-10 px-4 rounded-xl bg-secondary/50 hover:bg-secondary/80 border border-border/40 text-sm font-medium flex items-center gap-2 transition-colors">
                    <RefreshCw className="w-4 h-4" /> تحديث
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {kpiCards.map((card, i) => (
                    <div key={i} className="glass-card rounded-2xl p-5 border border-border/40">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-muted-foreground">{card.label}</span>
                            <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                                <card.icon className={`w-4 h-4 ${card.color}`} />
                            </div>
                        </div>
                        <span className="text-2xl font-bold">{card.value}</span>
                        <p className="text-[10px] text-muted-foreground mt-1.5">{card.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* MRR Breakdown Pie */}
                <div className="glass-card rounded-2xl p-6 border border-border/40">
                    <h3 className="font-bold mb-5">توزيع MRR</h3>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} dataKey="value" paddingAngle={4}>
                                    {pieData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", fontSize: "12px" }}
                                    formatter={(v: any) => [`$${v}`, ""]}
                                />
                                <Legend
                                    formatter={(value) => <span style={{ fontSize: 11, color: "#9ca3af" }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">لا توجد إيرادات بعد</div>
                    )}
                    {/* Pct breakdown */}
                    {data.totalMRR > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-center">
                                <p className="text-xs text-muted-foreground mb-1">الخطط</p>
                                <p className="font-bold text-blue-400">{Math.round((data.planMRR / data.totalMRR) * 100)}%</p>
                            </div>
                            <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/15 text-center">
                                <p className="text-xs text-muted-foreground mb-1">الإضافات</p>
                                <p className="font-bold text-violet-400">{Math.round((data.addonMRR / data.totalMRR) * 100)}%</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Revenue per plan table */}
                <div className="glass-card rounded-2xl p-6 border border-border/40">
                    <h3 className="font-bold mb-5">إيرادات كل خطة</h3>
                    <div className="space-y-0">
                        <div className="grid grid-cols-4 text-xs text-muted-foreground pb-2 border-b border-border/20 mb-2">
                            <span>الخطة</span>
                            <span className="text-center">العدد</span>
                            <span className="text-center">السعر</span>
                            <span className="text-left">الإيرادات</span>
                        </div>
                        {planRows.map(row => {
                            const Icon = PLAN_ICONS[row.plan] || Zap;
                            const revenue = row.price * row.count;
                            return (
                                <div key={row.plan} className="grid grid-cols-4 py-3 border-b border-border/10 items-center">
                                    <div className="flex items-center gap-2">
                                        <Icon className={`w-3.5 h-3.5 ${PLAN_COLORS[row.plan]}`} />
                                        <span className="text-sm font-medium">{PLAN_LABELS[row.plan]}</span>
                                    </div>
                                    <span className="text-center text-sm">{row.count}</span>
                                    <span className="text-center text-sm text-muted-foreground">${row.price}</span>
                                    <span className="text-left text-sm font-bold text-emerald-400">${revenue}</span>
                                </div>
                            );
                        })}
                        {/* Addon row */}
                        <div className="grid grid-cols-4 py-3 border-b border-border/10 items-center">
                            <div className="flex items-center gap-2">
                                <Puzzle className="w-3.5 h-3.5 text-violet-400" />
                                <span className="text-sm font-medium">الإضافات</span>
                            </div>
                            <span className="text-center text-sm">{data.totalAddons}</span>
                            <span className="text-center text-sm text-muted-foreground">متغير</span>
                            <span className="text-left text-sm font-bold text-violet-400">${data.addonMRR}</span>
                        </div>
                        {/* Total */}
                        <div className="grid grid-cols-4 py-3 items-center bg-emerald-500/5 rounded-xl px-2 mt-2">
                            <span className="text-sm font-bold col-span-3">إجمالي MRR</span>
                            <span className="text-left text-base font-black text-emerald-400">${data.totalMRR.toFixed(0)}</span>
                        </div>
                    </div>

                    {/* Addon breakdown */}
                    {Object.keys(data.addonCounts).length > 0 && (
                        <div className="mt-5">
                            <p className="text-xs text-muted-foreground mb-3 font-medium">تفاصيل الإضافات</p>
                            <div className="space-y-1.5">
                                {Object.entries(data.addonCounts).map(([key, count]) => (
                                    <div key={key} className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">{ADDON_LABELS[key] || key}</span>
                                        <span className="text-violet-400 font-medium">{count} × ${[10, 8, 7, 5, 5][["discounts","advanced_delivery","analytics_pro","custom_branding","custom_domain"].indexOf(key)] || 0}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
