"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSubscriptionStatus, upgradePlan, type PlanType } from "@/lib/actions/subscription";
import {
    CreditCard,
    Zap,
    Crown,
    Rocket,
    CheckCircle2,
    ArrowUpRight,
    Package,
    ShoppingCart,
    Tags,
    TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

const planDetails: Record<PlanType, { name: string; nameAr: string; price: string; icon: typeof Zap; color: string; gradient: string }> = {
    free: { name: "Free", nameAr: "مجانية", price: "$0", icon: Zap, color: "text-gray-400", gradient: "from-gray-500/20 to-gray-600/10" },
    pro: { name: "Pro", nameAr: "احترافية", price: "$25", icon: Crown, color: "text-emerald-400", gradient: "from-emerald-500/20 to-emerald-600/10" },
    business: { name: "Business", nameAr: "أعمال", price: "$50", icon: Rocket, color: "text-violet-400", gradient: "from-violet-500/20 to-violet-600/10" },
};

const allFeatures = [
    { key: "qr_menu", label: "قائمة QR رقمية" },
    { key: "orders", label: "استقبال الطلبات" },
    { key: "basic_analytics", label: "تحليلات أساسية" },
    { key: "advanced_analytics", label: "تحليلات متقدمة" },
    { key: "theme_customization", label: "تخصيص الثيم" },
    { key: "whatsapp_ordering", label: "طلبات واتساب" },
    { key: "coupons", label: "كوبونات خصم" },
    { key: "custom_domain", label: "دومين مخصص" },
    { key: "priority_support", label: "دعم أولوية" },
];

export default function BillingPage() {
    const { t } = useTranslation();
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [subscription, setSubscription] = useState<Awaited<ReturnType<typeof getSubscriptionStatus>>>(null);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(false);

    useEffect(() => {
        async function load() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("restaurant_id")
                .eq("id", user.id)
                .single();

            if (!profile?.restaurant_id) return;
            setRestaurantId(profile.restaurant_id);

            const status = await getSubscriptionStatus(profile.restaurant_id);
            setSubscription(status);
            setLoading(false);
        }
        load();
    }, []);

    async function handleUpgrade(plan: PlanType) {
        if (!restaurantId) return;
        setUpgrading(true);
        const result = await upgradePlan(restaurantId, plan);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(`تم الترقية إلى خطة ${planDetails[plan].nameAr} بنجاح!`);
            const status = await getSubscriptionStatus(restaurantId);
            setSubscription(status);
        }
        setUpgrading(false);
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-secondary/50 rounded-xl animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-secondary/30 rounded-2xl animate-pulse" />)}
                </div>
                <div className="h-64 bg-secondary/30 rounded-2xl animate-pulse" />
            </div>
        );
    }

    if (!subscription) {
        return <div className="text-center text-muted-foreground py-20">لم يتم العثور على بيانات الاشتراك.</div>;
    }

    const currentPlan = subscription.plan;
    const CurrentIcon = planDetails[currentPlan].icon;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    <CreditCard className="w-7 h-7 text-primary" />
                    {t("sidebar.billing") || "الفوترة والاشتراك"}
                </h1>
                <p className="text-muted-foreground mt-1">{t("billing.title") || "إدارة خطتك الحالية وتتبع استخدامك."}</p>
            </div>

            {/* Current Plan Card */}
            <div className={`glass-card rounded-2xl p-6 bg-gradient-to-br ${planDetails[currentPlan].gradient} border border-border/40`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-background/50 flex items-center justify-center ${planDetails[currentPlan].color}`}>
                            <CurrentIcon className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{t("billing.currentPlan") || "الخطة الحالية"}</p>
                            <h2 className="text-2xl font-bold">{planDetails[currentPlan].nameAr}</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {subscription.status === "trial" && subscription.trialEndsAt
                                    ? `فترة تجريبية تنتهي ${new Date(subscription.trialEndsAt).toLocaleDateString("ar-IQ")}`
                                    : subscription.status === "active"
                                        ? "اشتراك نشط"
                                        : "منتهي الصلاحية"
                                }
                            </p>
                        </div>
                    </div>
                    <div className="text-left">
                        <span className="text-3xl font-bold">{planDetails[currentPlan].price}</span>
                        <span className="text-muted-foreground text-sm">/شهرياً</span>
                    </div>
                </div>
            </div>

            {/* Usage Meters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: "المنتجات", icon: Package, ...subscription.usage.products, color: "bg-emerald-500" },
                    { label: "الطلبات (هذا الشهر)", icon: ShoppingCart, ...subscription.usage.orders, color: "bg-blue-500" },
                    { label: "الكوبونات", icon: Tags, ...subscription.usage.coupons, color: "bg-violet-500" },
                ].map((meter, i) => {
                    const percentage = meter.max >= 999999 ? 0 : Math.min((meter.current / meter.max) * 100, 100);
                    const isNearLimit = percentage >= 80;
                    return (
                        <div key={i} className="glass-card rounded-2xl p-5 border border-border/40">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <meter.icon className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">{meter.label}</span>
                                </div>
                                {isNearLimit && <TrendingUp className="w-4 h-4 text-amber-500" />}
                            </div>
                            <div className="flex items-baseline gap-1 mb-3">
                                <span className="text-2xl font-bold">{meter.current}</span>
                                <span className="text-sm text-muted-foreground">
                                    / {meter.max >= 999999 ? "∞" : meter.max}
                                </span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${isNearLimit ? "bg-amber-500" : meter.color}`}
                                    style={{ width: meter.max >= 999999 ? "5%" : `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Plan Comparison */}
            <div>
                <h3 className="text-lg font-bold mb-4">مقارنة الخطط</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(["free", "pro", "business"] as PlanType[]).map((plan) => {
                        const detail = planDetails[plan];
                        const Icon = detail.icon;
                        const isCurrent = currentPlan === plan;
                        return (
                            <div
                                key={plan}
                                className={`glass-card rounded-2xl p-6 border-2 transition-all flex flex-col ${isCurrent ? "border-primary shadow-lg shadow-primary/10" : "border-border/40"
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center ${detail.color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">{detail.nameAr}</h4>
                                        <p className="text-xs text-muted-foreground">{detail.name}</p>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <span className="text-3xl font-bold">{detail.price}</span>
                                    <span className="text-sm text-muted-foreground">/شهرياً</span>
                                </div>
                                <ul className="space-y-2.5 mb-6 flex-1">
                                    {allFeatures.map((f) => {
                                        const hasFeature = (plan === "free" && ["qr_menu", "orders", "basic_analytics"].includes(f.key)) ||
                                            (plan === "pro" && f.key !== "custom_domain" && f.key !== "priority_support") ||
                                            plan === "business";
                                        return (
                                            <li key={f.key} className="flex items-center gap-2 text-sm">
                                                <CheckCircle2 className={`w-4 h-4 shrink-0 ${hasFeature ? "text-emerald-500" : "text-muted-foreground/30"}`} />
                                                <span className={hasFeature ? "" : "text-muted-foreground/50 line-through"}>{f.label}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                                {isCurrent ? (
                                    <div className="w-full py-3 text-center text-sm font-medium rounded-xl bg-primary/10 text-primary">
                                        الخطة الحالية
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleUpgrade(plan)}
                                        disabled={upgrading}
                                        className="w-full py-3 text-center text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {upgrading ? (
                                            <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <ArrowUpRight className="w-4 h-4" />
                                                {currentPlan === "free" || (currentPlan === "pro" && plan === "business") ? "ترقية" : "تغيير"}
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
