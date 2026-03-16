"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getRestaurantDetails, extendSubscription, suspendRestaurant, activateRestaurant, updateRestaurantPlan } from "@/lib/actions/admin";
import { getRestaurantAddonsAdmin, toggleRestaurantAddon } from "@/lib/actions/addons";
import { ADDON_DEFINITIONS, type AddonKey } from "@/lib/addons/addon-definitions";
import type { RestaurantAddon } from "@/lib/actions/addons";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
    ArrowRight, Store, ShoppingCart, DollarSign, Package,
    Clock, Crown, Zap, Rocket, CheckCircle, Ban, CalendarClock,
    Mail, User, ExternalLink, Loader2, ChevronDown, Puzzle,
    Tag, Truck, BarChart3, Palette, Globe,
} from "lucide-react";
import { toast } from "sonner";

type RestaurantDetails = Awaited<ReturnType<typeof getRestaurantDetails>>;

const addonIcons: Record<AddonKey, typeof Zap> = {
    discounts: Tag,
    advanced_delivery: Truck,
    analytics_pro: BarChart3,
    custom_branding: Palette,
    custom_domain: Globe,
};

const planIcons: Record<string, typeof Zap> = { free: Zap, pro: Crown, business: Rocket };
const planColors: Record<string, string> = {
    free: "text-gray-400 bg-gray-500/10",
    pro: "text-emerald-400 bg-emerald-500/10",
    business: "text-violet-400 bg-violet-500/10",
};
const planLabels: Record<string, string> = { free: "مجاني", pro: "احترافي", business: "أعمال" };
const statusColors: Record<string, string> = {
    active: "text-emerald-500 bg-emerald-500/10",
    trial: "text-blue-500 bg-blue-500/10",
    expired: "text-red-500 bg-red-500/10",
    cancelled: "text-gray-500 bg-gray-500/10",
};
const statusLabels: Record<string, string> = {
    active: "نشط", trial: "تجريبي", expired: "منتهي", cancelled: "ملغي",
};
const orderStatusLabels: Record<string, string> = {
    pending: "معلق", confirmed: "مؤكد", preparing: "يُحضَّر",
    ready: "جاهز", delivered: "مُسلَّم", cancelled: "ملغي",
};

// ==========================================
// Extend Subscription Modal
// ==========================================
function ExtendModal({ open, onClose, restaurantId, currentPlan, onExtended }: {
    open: boolean; onClose: () => void; restaurantId: string;
    currentPlan: string; onExtended: (expiry: string) => void;
}) {
    const [months, setMonths] = useState(1);
    const [plan, setPlan] = useState(currentPlan);
    const [loading, setLoading] = useState(false);

    if (!open) return null;

    const handleSubmit = async () => {
        setLoading(true);
        const result = await extendSubscription(restaurantId, months, plan !== currentPlan ? plan : undefined);
        if (result?.error) { toast.error(result.error); setLoading(false); return; }
        toast.success(`تم تمديد الاشتراك ${months} شهر`);
        onExtended(result.newExpiry || "");
        onClose();
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-sm rounded-2xl bg-[#141414] border border-white/[0.06] shadow-2xl p-6 space-y-5">
                <h3 className="font-bold text-base">تمديد الاشتراك</h3>

                <div>
                    <label className="text-xs text-gray-400 mb-2 block">عدد الأشهر</label>
                    <div className="grid grid-cols-4 gap-2">
                        {[1, 3, 6, 12].map(m => (
                            <button
                                key={m}
                                onClick={() => setMonths(m)}
                                className={`h-10 rounded-xl text-sm font-medium border transition-all ${months === m
                                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                                    : "bg-white/[0.03] border-white/[0.06] text-gray-400 hover:bg-white/[0.06]"
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs text-gray-400 mb-2 block">تغيير الخطة (اختياري)</label>
                    <div className="grid grid-cols-3 gap-2">
                        {["free", "pro", "business"].map(p => {
                            const Icon = planIcons[p];
                            return (
                                <button
                                    key={p}
                                    onClick={() => setPlan(p)}
                                    className={`p-2.5 rounded-xl border text-center transition-all ${plan === p
                                        ? "border-emerald-500/40 bg-emerald-500/10"
                                        : "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04]"
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 mx-auto mb-1 ${plan === p ? "text-emerald-400" : "text-gray-600"}`} />
                                    <p className="text-xs">{planLabels[p]}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex gap-3 pt-1">
                    <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-white/[0.06] text-sm text-gray-400 hover:text-white transition-colors">
                        إلغاء
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        تمديد
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// Main Page
// ==========================================
export default function RestaurantDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const restaurantId = params.id as string;

    const [data, setData] = useState<RestaurantDetails>(null);
    const [loading, setLoading] = useState(true);
    const [showExtend, setShowExtend] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [addons, setAddons] = useState<RestaurantAddon[]>([]);
    const [addonLoading, setAddonLoading] = useState<AddonKey | null>(null);
    const [addonNotes, setAddonNotes] = useState<Record<string, string>>({});

    useEffect(() => {
        Promise.all([
            getRestaurantDetails(restaurantId),
            getRestaurantAddonsAdmin(restaurantId),
        ]).then(([d, a]) => {
            setData(d);
            setAddons(a);
            setLoading(false);
        });
    }, [restaurantId]);

    const handleToggleAddon = async (addonKey: AddonKey, currentlyActive: boolean) => {
        setAddonLoading(addonKey);
        const result = await toggleRestaurantAddon(
            restaurantId,
            addonKey,
            !currentlyActive,
            addonNotes[addonKey] || undefined
        );
        if (result.error) {
            toast.error(result.error);
        } else {
            const label = ADDON_DEFINITIONS[addonKey].name.ar;
            toast.success(!currentlyActive ? `تم تفعيل: ${label}` : `تم إيقاف: ${label}`);
            // Update local addon state
            setAddons(prev => {
                const existing = prev.find(a => a.addon_key === addonKey);
                if (existing) {
                    return prev.map(a => a.addon_key === addonKey
                        ? { ...a, is_active: !currentlyActive, activated_at: !currentlyActive ? new Date().toISOString() : null }
                        : a
                    );
                }
                return [...prev, {
                    id: "",
                    restaurant_id: restaurantId,
                    addon_key: addonKey,
                    is_active: true,
                    price_monthly: ADDON_DEFINITIONS[addonKey].price,
                    activated_at: new Date().toISOString(),
                    expires_at: null,
                    activated_by: null,
                    notes: addonNotes[addonKey] || null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }];
            });
        }
        setAddonLoading(null);
    };

    const handleSuspend = async () => {
        setActionLoading(true);
        const result = await suspendRestaurant(restaurantId);
        if (result.error) { toast.error(result.error); }
        else {
            toast.success("تم تعليق المطعم");
            setData(prev => prev ? { ...prev, restaurant: { ...prev.restaurant, subscription_status: "expired" } } : prev);
        }
        setActionLoading(false);
    };

    const handleActivate = async () => {
        setActionLoading(true);
        const result = await activateRestaurant(restaurantId);
        if (result.error) { toast.error(result.error); }
        else {
            toast.success("تم تفعيل المطعم");
            setData(prev => prev ? { ...prev, restaurant: { ...prev.restaurant, subscription_status: "active" } } : prev);
        }
        setActionLoading(false);
    };

    const handleChangePlan = async (plan: string) => {
        setActionLoading(true);
        const result = await updateRestaurantPlan(restaurantId, plan);
        if (result.error) { toast.error(result.error); }
        else {
            toast.success(`تم تغيير الخطة إلى ${planLabels[plan]}`);
            setData(prev => prev ? { ...prev, restaurant: { ...prev.restaurant, subscription_plan: plan } } : prev);
        }
        setActionLoading(false);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-64 bg-secondary/50 rounded-xl animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-secondary/30 rounded-2xl animate-pulse" />)}
                </div>
                <div className="h-72 bg-secondary/20 rounded-2xl animate-pulse" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-24 text-muted-foreground">
                <Store className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>المطعم غير موجود</p>
                <button onClick={() => router.back()} className="mt-4 text-sm text-primary hover:underline">
                    العودة
                </button>
            </div>
        );
    }

    const { restaurant, owner, stats, recentOrders, chartData, activityLogs } = data;
    const plan = restaurant.subscription_plan || "free";
    const status = restaurant.subscription_status || "active";
    const PlanIcon = planIcons[plan] || Zap;

    const kpiCards = [
        { label: "إجمالي الطلبات", value: stats.totalOrders.toLocaleString(), icon: ShoppingCart, color: "text-blue-400", bg: "bg-blue-500/10" },
        { label: "إجمالي الإيرادات", value: `${stats.totalRevenue.toLocaleString()} د.ع`, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        { label: "المنتجات", value: stats.productCount.toLocaleString(), icon: Package, color: "text-violet-400", bg: "bg-violet-500/10" },
        {
            label: "آخر نشاط",
            value: new Date(stats.lastActivity).toLocaleDateString("ar-IQ"),
            icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Back + Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
                    >
                        <ArrowRight className="w-4 h-4" />
                        العودة إلى المطاعم
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center overflow-hidden">
                            {restaurant.logo_url ? (
                                <Image src={restaurant.logo_url} alt={restaurant.name} className="w-full h-full object-cover" width={48} height={48} unoptimized />
                            ) : (
                                <Store className="w-6 h-6 text-muted-foreground" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{restaurant.name}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-sm text-muted-foreground font-mono">/{restaurant.slug}</span>
                                <a href={`/menu/${restaurant.slug}`} target="_blank" className="text-muted-foreground hover:text-primary">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setShowExtend(true)}
                        className="h-10 px-4 rounded-xl bg-secondary/50 hover:bg-secondary/80 border border-border/40 text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        <CalendarClock className="w-4 h-4" />
                        تمديد الاشتراك
                    </button>
                    {status === "active" ? (
                        <button
                            onClick={handleSuspend}
                            disabled={actionLoading}
                            className="h-10 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            <Ban className="w-4 h-4" />
                            تعليق
                        </button>
                    ) : (
                        <button
                            onClick={handleActivate}
                            disabled={actionLoading}
                            className="h-10 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            <CheckCircle className="w-4 h-4" />
                            تفعيل
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((card, i) => (
                    <div key={i} className="glass-card rounded-2xl p-5 border border-border/40">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-muted-foreground">{card.label}</span>
                            <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                                <card.icon className={`w-4 h-4 ${card.color}`} />
                            </div>
                        </div>
                        <span className="text-xl font-bold">{card.value}</span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-border/40">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold">إيرادات آخر 30 يوم</h3>
                        <span className="text-xs text-muted-foreground">
                            {stats.totalRevenue.toLocaleString()} د.ع إجمالي
                        </span>
                    </div>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ background: "#141414", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", fontSize: "12px" }}
                                    formatter={(v: any) => [`${v.toLocaleString()} د.ع`, "الإيرادات"]}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#rGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                            لا توجد بيانات كافية
                        </div>
                    )}
                </div>

                {/* Subscription + Owner Info */}
                <div className="space-y-4">
                    {/* Subscription Card */}
                    <div className="glass-card rounded-2xl p-5 border border-border/40 space-y-4">
                        <h3 className="font-bold text-sm">معلومات الاشتراك</h3>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">الخطة</span>
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${planColors[plan]}`}>
                                    <PlanIcon className="w-3 h-3" />
                                    {planLabels[plan]}
                                </span>
                                <div className="relative group">
                                    <button className="p-1 rounded-lg hover:bg-secondary/50 text-muted-foreground">
                                        <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10">
                                        <div className="bg-[#141414] border border-white/[0.06] rounded-xl overflow-hidden shadow-xl min-w-28">
                                            {["free", "pro", "business"].map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => handleChangePlan(p)}
                                                    className="w-full text-right px-3 py-2 text-xs hover:bg-white/[0.05] transition-colors"
                                                >
                                                    {planLabels[p]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">الحالة</span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[status] || statusColors.active}`}>
                                {status === "active" ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                                {statusLabels[status] || status}
                            </span>
                        </div>
                        {restaurant.subscription_expires_at && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">ينتهي في</span>
                                <span className="text-xs font-medium">
                                    {new Date(restaurant.subscription_expires_at).toLocaleDateString("ar-IQ")}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">انضم في</span>
                            <span className="text-xs">{new Date(restaurant.created_at).toLocaleDateString("ar-IQ")}</span>
                        </div>
                    </div>

                    {/* Owner Info */}
                    {owner && (
                        <div className="glass-card rounded-2xl p-5 border border-border/40 space-y-3">
                            <h3 className="font-bold text-sm">صاحب المطعم</h3>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{owner.full_name || "—"}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                        <Mail className="w-3 h-3" />
                                        {owner.email}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Orders + Activity Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="glass-card rounded-2xl p-6 border border-border/40">
                    <h3 className="font-bold mb-5">آخر الطلبات</h3>
                    {recentOrders.length > 0 ? (
                        <div className="space-y-2">
                            {recentOrders.slice(0, 6).map((order: any) => (
                                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/10">
                                    <div>
                                        <p className="text-xs font-mono text-muted-foreground">#{order.id.slice(-6).toUpperCase()}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {new Date(order.created_at).toLocaleDateString("ar-IQ")}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold">{(order.total || 0).toLocaleString()} د.ع</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{orderStatusLabels[order.status] || order.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">لا توجد طلبات بعد</p>
                    )}
                </div>

                {/* Activity Logs */}
                <div className="glass-card rounded-2xl p-6 border border-border/40">
                    <h3 className="font-bold mb-5">سجل النشاطات</h3>
                    {activityLogs.length > 0 ? (
                        <div className="space-y-3">
                            {activityLogs.map((log: any) => (
                                <div key={log.id} className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">{log.description}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                            {new Date(log.created_at).toLocaleString("ar-IQ")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">لا توجد نشاطات مسجلة</p>
                    )}
                </div>
            </div>

            {/* Add-ons Section */}
            <div className="glass-card rounded-2xl p-6 border border-border/40">
                <div className="flex items-center gap-2 mb-5">
                    <Puzzle className="w-4 h-4 text-violet-400" />
                    <h3 className="font-bold">الإضافات (Add-ons)</h3>
                    {plan === "free" && (
                        <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg mr-auto">
                            الإضافات متاحة للخطط المدفوعة فقط
                        </span>
                    )}
                </div>
                <div className="space-y-3">
                    {(Object.keys(ADDON_DEFINITIONS) as AddonKey[]).map(addonKey => {
                        const def = ADDON_DEFINITIONS[addonKey];
                        const row = addons.find(a => a.addon_key === addonKey);
                        const isActive = row?.is_active ?? false;
                        const isLoading = addonLoading === addonKey;
                        const Icon = addonIcons[addonKey];

                        return (
                            <div key={addonKey} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${isActive
                                ? "border-violet-500/30 bg-violet-500/5"
                                : "border-border/20 bg-white/[0.01]"
                            }`}>
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isActive ? "bg-violet-500/15" : "bg-secondary/40"}`}>
                                    <Icon className={`w-4 h-4 ${isActive ? "text-violet-400" : "text-muted-foreground"}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium">{def.name.ar}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{def.description.ar}</p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xs text-muted-foreground">${def.price}/شهر</span>
                                            {isLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                            ) : (
                                                <button
                                                    onClick={() => handleToggleAddon(addonKey, isActive)}
                                                    disabled={!!addonLoading}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-40 ${isActive ? "bg-violet-500" : "bg-secondary"}`}
                                                >
                                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-4" : "translate-x-0.5"}`} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {isActive && row?.activated_at && (
                                        <p className="text-[10px] text-violet-400/70 mt-2">
                                            مفعّل منذ {new Date(row.activated_at).toLocaleDateString("ar-IQ")}
                                        </p>
                                    )}
                                    {/* Notes field */}
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            placeholder="ملاحظة (اختياري)"
                                            value={addonNotes[addonKey] || ""}
                                            onChange={e => setAddonNotes(prev => ({ ...prev, [addonKey]: e.target.value }))}
                                            className="w-full text-xs bg-transparent border border-border/20 rounded-lg px-2.5 py-1.5 text-muted-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-border/50 transition-colors"
                                        />
                                    </div>
                                    {row?.notes && (
                                        <p className="text-[10px] text-muted-foreground/60 mt-1 truncate">💬 {row.notes}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Extend Modal */}
            <ExtendModal
                open={showExtend}
                onClose={() => setShowExtend(false)}
                restaurantId={restaurantId}
                currentPlan={plan}
                onExtended={(expiry) => {
                    setData(prev => prev ? {
                        ...prev,
                        restaurant: { ...prev.restaurant, subscription_expires_at: expiry, subscription_status: "active" }
                    } : prev);
                }}
            />
        </div>
    );
}
