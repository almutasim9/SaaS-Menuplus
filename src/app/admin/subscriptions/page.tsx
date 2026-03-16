"use client";

import { useState, useEffect } from "react";
import { getExpiringRestaurants, extendSubscription, getRestaurantAddonsForList } from "@/lib/actions/admin";
import Link from "next/link";
import {
    CalendarClock, AlertTriangle, Crown, Zap, Rocket,
    CheckCircle, Ban, RefreshCw, Loader2, Puzzle,
} from "lucide-react";
import { toast } from "sonner";

const PLAN_PRICES: Record<string, number> = { free: 0, business: 22, pro: 39 };
const ADDON_LABELS: Record<string, string> = {
    discounts: "خصومات",
    advanced_delivery: "توصيل",
    analytics_pro: "تحليلات",
    custom_branding: "براند",
    custom_domain: "دومين",
};
const planIcons: Record<string, typeof Zap> = { free: Zap, pro: Crown, business: Rocket };
const planColors: Record<string, string> = {
    free: "text-gray-400 bg-gray-500/10",
    pro: "text-emerald-400 bg-emerald-500/10",
    business: "text-violet-400 bg-violet-500/10",
};
const planLabels: Record<string, string> = { free: "مجاني", pro: "احترافي", business: "أعمال" };

function daysUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function UrgencyBadge({ days }: { days: number }) {
    if (days <= 7) return <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">عاجل ({days} أيام)</span>;
    if (days <= 14) return <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">قريب ({days} أيام)</span>;
    return <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">{days} يوم</span>;
}

export default function SubscriptionsPage() {
    const [expiring, setExpiring] = useState<any[]>([]);
    const [addonsMap, setAddonsMap] = useState<Record<string, { keys: string[]; total: number }>>({});
    const [loading, setLoading] = useState(true);
    const [extending, setExtending] = useState<string | null>(null);
    const [daysFilter, setDaysFilter] = useState(30);
    const [addonFilter, setAddonFilter] = useState("all");

    const load = async () => {
        setLoading(true);
        const data = await getExpiringRestaurants(daysFilter);
        setExpiring(data);
        if (data.length > 0) {
            const map = await getRestaurantAddonsForList(data.map((r: any) => r.id));
            setAddonsMap(map);
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, [daysFilter]);

    const handleQuickExtend = async (id: string, months: number) => {
        setExtending(id);
        const result = await extendSubscription(id, months);
        if (result?.error) {
            toast.error(result.error);
        } else {
            toast.success(`تم تمديد الاشتراك ${months} شهر`);
            await load();
        }
        setExtending(null);
    };

    const filtered = addonFilter === "all"
        ? expiring
        : addonFilter === "has_addons"
            ? expiring.filter(r => addonsMap[r.id]?.keys.length > 0)
            : addonFilter === "no_addons"
                ? expiring.filter(r => !addonsMap[r.id]?.keys.length)
                : expiring.filter(r => addonsMap[r.id]?.keys.includes(addonFilter));

    const urgentCount = filtered.filter(r => daysUntil(r.subscription_expires_at) <= 7).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <CalendarClock className="w-7 h-7" />
                        إدارة الاشتراكات
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">المطاعم التي تنتهي اشتراكاتها قريباً.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Days filter */}
                    <select
                        value={daysFilter}
                        onChange={e => setDaysFilter(parseInt(e.target.value))}
                        className="h-10 px-3 rounded-xl bg-secondary/30 border border-border/40 text-sm"
                    >
                        <option value={7}>آخر 7 أيام</option>
                        <option value={14}>آخر 14 يوم</option>
                        <option value={30}>آخر 30 يوم</option>
                        <option value={60}>آخر 60 يوم</option>
                    </select>
                    {/* Addon filter */}
                    <select
                        value={addonFilter}
                        onChange={e => setAddonFilter(e.target.value)}
                        className="h-10 px-3 rounded-xl bg-secondary/30 border border-border/40 text-sm"
                    >
                        <option value="all">كل الإضافات</option>
                        <option value="has_addons">لديهم إضافات</option>
                        <option value="no_addons">بدون إضافات</option>
                        <option disabled>──────</option>
                        <option value="discounts">خصومات وكوبونات</option>
                        <option value="advanced_delivery">توصيل متقدم</option>
                        <option value="analytics_pro">تحليلات برو</option>
                        <option value="custom_branding">براند مخصص</option>
                        <option value="custom_domain">دومين مخصص</option>
                    </select>
                    <button
                        onClick={load}
                        className="h-10 px-4 rounded-xl bg-secondary/50 hover:bg-secondary/80 border border-border/40 text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        تحديث
                    </button>
                </div>
            </div>

            {/* Alert Banner */}
            {urgentCount > 0 && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/20">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                    <p className="text-sm text-red-300">
                        <span className="font-bold">{urgentCount} مطعم</span> اشتراكه ينتهي خلال 7 أيام — يُنصح بالتواصل معهم فوراً.
                    </p>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card rounded-2xl p-5 border border-border/40">
                    <p className="text-xs text-muted-foreground mb-1">إجمالي تنتهي خلال {daysFilter} يوم</p>
                    <p className="text-3xl font-bold">{filtered.length}</p>
                </div>
                <div className="glass-card rounded-2xl p-5 border border-border/40">
                    <p className="text-xs text-muted-foreground mb-1">عاجل (≤ 7 أيام)</p>
                    <p className="text-3xl font-bold text-red-400">{urgentCount}</p>
                </div>
                <div className="glass-card rounded-2xl p-5 border border-border/40">
                    <p className="text-xs text-muted-foreground mb-1">Pro + Business</p>
                    <p className="text-3xl font-bold text-emerald-400">
                        {filtered.filter(r => ["pro", "business"].includes(r.subscription_plan)).length}
                    </p>
                </div>
                <div className="glass-card rounded-2xl p-5 border border-border/40">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Puzzle className="w-3 h-3 text-violet-400" /> لديهم إضافات
                    </p>
                    <p className="text-3xl font-bold text-violet-400">
                        {filtered.filter(r => addonsMap[r.id]?.keys.length > 0).length}
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="glass-card rounded-2xl border border-border/40 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/30 bg-secondary/10">
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">المطعم</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">صاحب المطعم</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">الخطة</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">الإضافات النشطة</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">القيمة الشهرية</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">ينتهي في</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">المتبقي</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">تمديد سريع</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(4)].map((_, i) => (
                                    <tr key={i} className="border-b border-border/10">
                                        <td className="px-5 py-4" colSpan={8}>
                                            <div className="h-5 bg-secondary/30 rounded-lg animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : filtered.map(r => {
                                const plan = r.subscription_plan || "free";
                                const PlanIcon = planIcons[plan] || Zap;
                                const days = daysUntil(r.subscription_expires_at);
                                const isExtending = extending === r.id;
                                const addonInfo = addonsMap[r.id];
                                const planPrice = PLAN_PRICES[plan] || 0;
                                const totalMonthly = planPrice + (addonInfo?.total || 0);

                                return (
                                    <tr key={r.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                                        <td className="px-5 py-4">
                                            <Link href={`/admin/restaurants/${r.id}`} className="font-semibold hover:text-primary transition-colors">
                                                {r.name}
                                            </Link>
                                            <p className="text-xs text-muted-foreground mt-0.5">/{r.slug}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            {r.profiles ? (
                                                <div>
                                                    <p className="text-sm">{r.profiles.full_name || "—"}</p>
                                                    <p className="text-xs text-muted-foreground">{r.profiles.email}</p>
                                                </div>
                                            ) : <span className="text-muted-foreground">—</span>}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${planColors[plan]}`}>
                                                <PlanIcon className="w-3 h-3" />
                                                {planLabels[plan]}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            {addonInfo?.keys.length ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {addonInfo.keys.map(k => (
                                                        <span key={k} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                                            {ADDON_LABELS[k] || k}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : <span className="text-xs text-muted-foreground/50">—</span>}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm font-bold text-emerald-400">${totalMonthly}/شهر</span>
                                        </td>
                                        <td className="px-5 py-4 text-sm">
                                            {new Date(r.subscription_expires_at).toLocaleDateString("ar-IQ")}
                                        </td>
                                        <td className="px-5 py-4">
                                            <UrgencyBadge days={days} />
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5">
                                                {[1, 3, 6].map(m => (
                                                    <button
                                                        key={m}
                                                        onClick={() => handleQuickExtend(r.id, m)}
                                                        disabled={isExtending}
                                                        className="h-8 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1"
                                                    >
                                                        {isExtending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                                        +{m}ش
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {!loading && filtered.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">لا توجد اشتراكات تطابق الفلتر المحدد.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
