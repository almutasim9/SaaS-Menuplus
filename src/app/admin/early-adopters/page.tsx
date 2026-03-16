"use client";

import { useState, useEffect, useCallback } from "react";
import { getEarlyAdopters, getEarlyAdopterCount, flagEarlyAdopter, removeEarlyAdopter, getAllRestaurants } from "@/lib/actions/admin";
import Link from "next/link";
import {
    Star, RefreshCw, Crown, Zap, Rocket, CheckCircle, Ban, Search,
    Lock, Trash2, Loader2, UserPlus,
} from "lucide-react";
import { toast } from "sonner";

const MAX_EARLY_ADOPTERS = 50;

const PLAN_ICONS: Record<string, typeof Zap> = { free: Zap, pro: Crown, business: Rocket };
const PLAN_LABELS: Record<string, string> = { free: "مجاني", pro: "احترافي", business: "أعمال" };
const PLAN_NORMAL_PRICES: Record<string, number> = { free: 0, business: 22, pro: 39 };
const PLAN_EARLY_PRICES: Record<string, number> = { free: 0, business: 15, pro: 29 };

export default function EarlyAdoptersPage() {
    const [earlyAdopters, setEarlyAdopters] = useState<any[]>([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Flag modal state
    const [showFlagModal, setShowFlagModal] = useState(false);
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [restSearch, setRestSearch] = useState("");
    const [loadingRest, setLoadingRest] = useState(false);
    const [flagging, setFlagging] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const [adopters, c] = await Promise.all([getEarlyAdopters(), getEarlyAdopterCount()]);
        setEarlyAdopters(adopters);
        setCount(c);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const openFlagModal = async () => {
        setShowFlagModal(true);
        setLoadingRest(true);
        const res = await getAllRestaurants({ plan: "business", status: "active", pageSize: 50 });
        const resB = await getAllRestaurants({ plan: "pro", status: "active", pageSize: 50 });
        setRestaurants([...(res.data || []), ...(resB.data || [])]);
        setLoadingRest(false);
    };

    const handleFlag = async (restaurantId: string) => {
        if (count >= MAX_EARLY_ADOPTERS) {
            toast.error("تم الوصول للحد الأقصى للروّاد (50 مطعم)");
            return;
        }
        setFlagging(restaurantId);
        const result = await flagEarlyAdopter(restaurantId);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(`تم التحديد كرائد أوائل — السعر المقفول: $${result.lockedPrice}/شهر`);
            setShowFlagModal(false);
            await load();
        }
        setFlagging(null);
    };

    const handleRemove = async (restaurantId: string, name: string) => {
        if (!confirm(`هل تريد إلغاء وضع رائد الأوائل لـ "${name}"؟`)) return;
        setActionLoading(restaurantId);
        const result = await removeEarlyAdopter(restaurantId);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("تم إلغاء وضع رائد الأوائل");
            await load();
        }
        setActionLoading(null);
    };

    const filteredRest = restaurants.filter(r =>
        !earlyAdopters.find(e => e.id === r.id) &&
        (r.name.toLowerCase().includes(restSearch.toLowerCase()) || r.slug.includes(restSearch))
    );

    const progressPct = Math.min(100, Math.round((count / MAX_EARLY_ADOPTERS) * 100));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Star className="w-7 h-7 text-amber-400 fill-amber-400/30" />
                        الروّاد الأوائل
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">أول 50 مطعم بسعر مقفول للأبد — برنامج الإطلاق.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={load} className="h-10 px-4 rounded-xl bg-secondary/50 hover:bg-secondary/80 border border-border/40 text-sm font-medium flex items-center gap-2 transition-colors">
                        <RefreshCw className="w-4 h-4" /> تحديث
                    </button>
                    {count < MAX_EARLY_ADOPTERS && (
                        <button
                            onClick={openFlagModal}
                            className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-sm transition-colors flex items-center gap-2"
                        >
                            <UserPlus className="w-4 h-4" />
                            إضافة رائد
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="glass-card rounded-2xl p-6 border border-border/40">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="font-bold">مقاعد الروّاد الأوائل</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{count} من {MAX_EARLY_ADOPTERS} مقعد مشغول</p>
                    </div>
                    <span className={`text-2xl font-black ${count >= MAX_EARLY_ADOPTERS ? "text-red-400" : "text-amber-400"}`}>
                        {count}/{MAX_EARLY_ADOPTERS}
                    </span>
                </div>
                <div className="h-3 bg-secondary/30 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${count >= MAX_EARLY_ADOPTERS ? "bg-red-500" : "bg-amber-500"}`}
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>
                        {count >= MAX_EARLY_ADOPTERS ? (
                            <span className="text-red-400 font-medium">البرنامج ممتلئ — لا يمكن إضافة المزيد</span>
                        ) : (
                            `${MAX_EARLY_ADOPTERS - count} مقعد متبقي`
                        )}
                    </span>
                    <span>{progressPct}%</span>
                </div>
            </div>

            {/* Pricing Info */}
            <div className="grid grid-cols-2 gap-4">
                {(["business", "pro"] as const).map(plan => {
                    const Icon = PLAN_ICONS[plan];
                    return (
                        <div key={plan} className="glass-card rounded-2xl p-5 border border-border/40">
                            <div className="flex items-center gap-2 mb-3">
                                <Icon className="w-4 h-4 text-amber-400" />
                                <span className="font-bold text-sm">{PLAN_LABELS[plan]}</span>
                                <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full mr-auto">رائد</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground">السعر العادي</p>
                                    <p className="text-lg font-bold line-through text-muted-foreground">${PLAN_NORMAL_PRICES[plan]}</p>
                                </div>
                                <div className="text-muted-foreground">→</div>
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground">السعر المقفول</p>
                                    <p className="text-2xl font-black text-amber-400">${PLAN_EARLY_PRICES[plan]}</p>
                                </div>
                                <div className="mr-auto">
                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                                        توفير ${PLAN_NORMAL_PRICES[plan] - PLAN_EARLY_PRICES[plan]}/شهر
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Early Adopters Table */}
            <div className="glass-card rounded-2xl border border-border/40 overflow-hidden">
                <div className="p-5 border-b border-border/20">
                    <h3 className="font-bold">قائمة الروّاد الأوائل</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/30 bg-secondary/10">
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">المطعم</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">الخطة</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">السعر العادي</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">السعر المقفول</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">تاريخ التسجيل</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">الحالة</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <tr key={i} className="border-b border-border/10">
                                        <td colSpan={7} className="px-5 py-4">
                                            <div className="h-5 bg-secondary/30 rounded-lg animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : earlyAdopters.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-16 text-muted-foreground">
                                        <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm">لا يوجد روّاد أوائل بعد</p>
                                    </td>
                                </tr>
                            ) : earlyAdopters.map(r => {
                                const plan = r.subscription_plan || "free";
                                const Icon = PLAN_ICONS[plan] || Zap;
                                const normalPrice = PLAN_NORMAL_PRICES[plan] || 0;
                                const isRemoving = actionLoading === r.id;

                                return (
                                    <tr key={r.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                                        <td className="px-5 py-4">
                                            <Link href={`/admin/restaurants/${r.id}`} className="font-semibold hover:text-primary transition-colors">
                                                {r.name}
                                            </Link>
                                            <p className="text-xs text-muted-foreground mt-0.5">/{r.slug}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center gap-1.5 text-xs">
                                                <Icon className="w-3 h-3 text-muted-foreground" />
                                                {PLAN_LABELS[plan]}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm text-muted-foreground line-through">${normalPrice}/شهر</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-400">
                                                <Lock className="w-3 h-3" />
                                                ${r.locked_price || 0}/شهر
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-muted-foreground">
                                            {r.early_adopter_at
                                                ? new Date(r.early_adopter_at).toLocaleDateString("ar-IQ")
                                                : "—"}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${r.subscription_status === "active"
                                                ? "text-emerald-400 bg-emerald-500/10"
                                                : "text-red-400 bg-red-500/10"
                                            }`}>
                                                {r.subscription_status === "active"
                                                    ? <><CheckCircle className="w-3 h-3" /> نشط</>
                                                    : <><Ban className="w-3 h-3" /> منتهي</>
                                                }
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <button
                                                onClick={() => handleRemove(r.id, r.name)}
                                                disabled={isRemoving}
                                                className="h-8 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1"
                                            >
                                                {isRemoving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                إلغاء
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Flag Modal */}
            {showFlagModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFlagModal(false)} />
                    <div className="relative w-full max-w-md rounded-2xl bg-[#141414] border border-white/[0.06] shadow-2xl p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                                <Star className="w-4 h-4 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">تحديد رائد أوائل</h3>
                                <p className="text-xs text-muted-foreground">اختر مطعم من خطة أعمال أو برو</p>
                            </div>
                        </div>

                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                value={restSearch}
                                onChange={e => setRestSearch(e.target.value)}
                                placeholder="ابحث بالاسم..."
                                className="w-full h-10 pr-10 pl-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm focus:outline-none focus:border-amber-500/50"
                            />
                        </div>

                        <div className="max-h-64 overflow-y-auto space-y-1.5">
                            {loadingRest ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="h-12 bg-secondary/30 rounded-xl animate-pulse" />
                                ))
                            ) : filteredRest.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-6">لا توجد نتائج</p>
                            ) : filteredRest.map(r => {
                                const plan = r.subscription_plan || "free";
                                const Icon = PLAN_ICONS[plan] || Zap;
                                const isFlagging = flagging === r.id;
                                return (
                                    <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                                        <div className="flex items-center gap-2.5">
                                            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">{r.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{PLAN_LABELS[plan]} → ${PLAN_EARLY_PRICES[plan] || 0}/شهر</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleFlag(r.id)}
                                            disabled={!!flagging}
                                            className="h-8 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-xs font-semibold transition-colors disabled:opacity-40 flex items-center gap-1"
                                        >
                                            {isFlagging ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3" />}
                                            تحديد
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <button onClick={() => setShowFlagModal(false)} className="w-full h-10 rounded-xl border border-border/40 text-sm text-muted-foreground hover:text-foreground transition-colors">
                            إلغاء
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
