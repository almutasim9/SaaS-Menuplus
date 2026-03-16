"use client";

import { useState, useEffect, useCallback } from "react";
import { getAddonOverviewMetrics } from "@/lib/actions/admin";
import Link from "next/link";
import {
    Puzzle, RefreshCw, TrendingUp, Tag, Truck, BarChart3,
    Palette, Globe, CheckCircle, XCircle, Search,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from "recharts";

type Metrics = Awaited<ReturnType<typeof getAddonOverviewMetrics>>;

const ADDON_CONFIG: Record<string, { label: string; icon: typeof Tag; color: string; bg: string }> = {
    discounts:        { label: "خصومات وكوبونات",   icon: Tag,      color: "#f43f5e", bg: "bg-rose-500/10" },
    advanced_delivery:{ label: "توصيل متقدم",       icon: Truck,    color: "#3b82f6", bg: "bg-blue-500/10" },
    analytics_pro:   { label: "تحليلات برو",        icon: BarChart3,color: "#8b5cf6", bg: "bg-violet-500/10" },
    custom_branding: { label: "براند مخصص",         icon: Palette,  color: "#ec4899", bg: "bg-pink-500/10" },
    custom_domain:   { label: "دومين مخصص",        icon: Globe,    color: "#10b981", bg: "bg-emerald-500/10" },
};

const PIE_COLORS = ["#f43f5e", "#3b82f6", "#8b5cf6", "#ec4899", "#10b981"];

export default function AddonsOverviewPage() {
    const [data, setData] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [addonFilter, setAddonFilter] = useState("all");

    const load = useCallback(async () => {
        setLoading(true);
        const d = await getAddonOverviewMetrics();
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

    const topAddonLabel = data.topAddon ? (ADDON_CONFIG[data.topAddon]?.label || data.topAddon) : "—";

    const kpiCards = [
        { label: "إجمالي الإضافات النشطة", value: data.totalActive, icon: Puzzle, color: "text-violet-400", bg: "bg-violet-500/10" },
        { label: "إيرادات الإضافات (MRR)", value: `$${data.addonMRR}`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        { label: "معدل الاعتماد", value: `${data.attachRate}%`, icon: CheckCircle, color: "text-blue-400", bg: "bg-blue-500/10" },
        { label: "أكثر إضافة شيوعاً", value: topAddonLabel, icon: Tag, color: "text-amber-400", bg: "bg-amber-500/10" },
    ];

    // Chart data
    const barData = Object.entries(data.distribution).map(([key, d]) => ({
        name: ADDON_CONFIG[key]?.label || key,
        count: d.count,
        revenue: d.revenue,
    })).sort((a, b) => b.revenue - a.revenue);

    const pieData = barData.map((d, i) => ({ name: d.name, value: d.count, color: PIE_COLORS[i % PIE_COLORS.length] }));

    // Table filter
    const tableRows = data.restaurantTable.filter(r => {
        const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase());
        const matchAddon = addonFilter === "all" || r.addons.includes(addonFilter);
        return matchSearch && matchAddon;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Puzzle className="w-7 h-7 text-violet-400" />
                        نظرة عامة على الإضافات
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">إحصائيات تفصيلية لجميع الإضافات النشطة على المنصة.</p>
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
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar: revenue per addon */}
                <div className="glass-card rounded-2xl p-6 border border-border/40">
                    <h3 className="font-bold mb-5">إيرادات كل إضافة ($/شهر)</h3>
                    {barData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={barData} layout="vertical" margin={{ right: 20 }}>
                                <XAxis type="number" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={90} />
                                <Tooltip
                                    contentStyle={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", fontSize: "12px" }}
                                    formatter={(v: any, name: string | undefined) => [name === "revenue" ? `$${v}` : v, name === "revenue" ? "إيرادات" : "عدد"]}
                                />
                                <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">لا توجد إضافات نشطة بعد</div>
                    )}
                </div>

                {/* Pie: distribution */}
                <div className="glass-card rounded-2xl p-6 border border-border/40">
                    <h3 className="font-bold mb-5">توزيع الإضافات النشطة</h3>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                                    {pieData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", fontSize: "12px" }}
                                    formatter={(v: any) => [v, "تفعيلات"]}
                                />
                                <Legend
                                    formatter={(value) => <span style={{ fontSize: 10, color: "#9ca3af" }}>{value}</span>}
                                    iconSize={8}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">لا توجد إضافات نشطة بعد</div>
                    )}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-card rounded-2xl p-6 border border-border/40">
                <h3 className="font-bold mb-5">آخر نشاطات الإضافات</h3>
                {data.recentActivity.length > 0 ? (
                    <div className="space-y-2">
                        {data.recentActivity.map((log: any, i: number) => {
                            const isActivated = log.action_type === "ADDON_ACTIVATED";
                            return (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 border border-border/10">
                                    {isActivated
                                        ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                        : <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                                    }
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">{log.description}</p>
                                        {log.restaurants && (
                                            <p className="text-xs text-muted-foreground mt-0.5">{log.restaurants.name}</p>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleDateString("ar-IQ")}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">لا توجد نشاطات مسجلة بعد.</p>
                )}
            </div>

            {/* Active Addons Table */}
            <div className="glass-card rounded-2xl border border-border/40 overflow-hidden">
                <div className="p-5 border-b border-border/20 flex items-center justify-between flex-wrap gap-3">
                    <h3 className="font-bold">المطاعم مع إضافات نشطة</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="ابحث بالاسم..."
                                className="h-9 pr-10 pl-4 rounded-xl bg-secondary/30 border border-border/40 text-sm focus:outline-none w-48"
                            />
                        </div>
                        <select
                            value={addonFilter}
                            onChange={e => setAddonFilter(e.target.value)}
                            className="h-9 px-3 rounded-xl bg-secondary/30 border border-border/40 text-sm"
                        >
                            <option value="all">كل الإضافات</option>
                            {Object.entries(ADDON_CONFIG).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/30 bg-secondary/10">
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">المطعم</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">الخطة</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">الإضافات النشطة</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">إجمالي/شهر</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-12 text-muted-foreground text-sm">لا توجد نتائج</td>
                                </tr>
                            ) : tableRows.map((row, i) => (
                                <tr key={i} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                                    <td className="px-5 py-3.5 font-semibold">{row.name}</td>
                                    <td className="px-5 py-3.5">
                                        <span className="text-xs text-muted-foreground capitalize">{row.plan}</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex flex-wrap gap-1">
                                            {row.addons.map(k => (
                                                <span key={k} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                                    {ADDON_CONFIG[k]?.label || k}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="font-bold text-emerald-400">${row.total}/شهر</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
