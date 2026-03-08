"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Globe, ExternalLink, AlertTriangle, CheckCircle, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";

export default function DomainSettingsPage() {
    const { t } = useTranslation();
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [currentDomain, setCurrentDomain] = useState<string | null>(null);
    const [newDomain, setNewDomain] = useState("");
    const [slug, setSlug] = useState("");
    const [plan, setPlan] = useState("free");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function load() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from("profiles").select("restaurant_id").eq("id", user.id).single();
            if (!profile?.restaurant_id) return;

            setRestaurantId(profile.restaurant_id);

            const { data: restaurant } = await supabase
                .from("restaurants")
                .select("custom_domain, slug, subscription_plan")
                .eq("id", profile.restaurant_id)
                .single();

            if (restaurant) {
                setCurrentDomain(restaurant.custom_domain || null);
                setNewDomain(restaurant.custom_domain || "");
                setSlug(restaurant.slug);
                setPlan(restaurant.subscription_plan || "free");
            }
            setLoading(false);
        }
        load();
    }, []);

    async function handleSave() {
        if (!restaurantId) return;
        setSaving(true);

        const domain = newDomain.trim().toLowerCase();

        // Basic validation
        if (domain && !/^[a-z0-9][a-z0-9-]*\.[a-z]{2,}(\.[a-z]{2,})?$/.test(domain)) {
            toast.error("صيغة الدومين غير صحيحة. مثال: menu.myrestaurant.com");
            setSaving(false);
            return;
        }

        const supabase = createClient();
        const { error } = await supabase
            .from("restaurants")
            .update({ custom_domain: domain || null })
            .eq("id", restaurantId);

        if (error) {
            if (error.message.includes("unique") || error.message.includes("duplicate")) {
                toast.error("هذا الدومين مستخدم بالفعل من قبل مطعم آخر.");
            } else {
                toast.error(error.message);
            }
        } else {
            setCurrentDomain(domain || null);
            toast.success("تم حفظ الدومين بنجاح!");
        }
        setSaving(false);
    }

    function handleRemove() {
        setNewDomain("");
        // Will save on next Save click
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-secondary/50 rounded-xl animate-pulse" />
                <div className="h-64 bg-secondary/30 rounded-2xl animate-pulse" />
            </div>
        );
    }

    const isBusinessPlan = plan === "business";

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    <Globe className="w-7 h-7 text-primary" />
                    {t("sidebar.settings")}
                </h1>
                <p className="text-muted-foreground mt-1">{t("settings.domainDesc") || "استخدم دومين خاص بك لعرض قائمة الطعام."}</p>
            </div>

            {/* Current Default URL */}
            <div className="glass-card rounded-2xl p-5 border border-border/40">
                <p className="text-sm text-muted-foreground mb-2">{t("settings.defaultUrl") || "الرابط الافتراضي"}</p>
                <div className="flex items-center gap-2">
                    <code className="text-sm bg-secondary/50 px-3 py-1.5 rounded-lg font-mono">
                        menuplus.com/menu/{slug}
                    </code>
                    <a href={`/menu/${slug}`} target="_blank" className="p-1.5 rounded-lg hover:bg-secondary/50">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                </div>
            </div>

            {!isBusinessPlan ? (
                <div className="glass-card rounded-2xl p-8 border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent text-center">
                    <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                    <h3 className="text-lg font-bold mb-2">{t("settings.businessFeature") || "ميزة حصرية لخطة الأعمال"}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{t("settings.businessDesc") || "الدومين المخصص متاح فقط في خطة Business ($50/شهر)."}</p>
                    <a href="/dashboard/billing" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90">
                        {t("billing.upgrade") || "ترقية الآن"}
                    </a>
                </div>
            ) : (
                <div className="glass-card rounded-2xl p-6 border border-border/40 space-y-5">
                    <div>
                        <label className="text-sm font-medium mb-2 block">الدومين المخصص</label>
                        <div className="flex gap-3">
                            <input
                                value={newDomain}
                                onChange={e => setNewDomain(e.target.value)}
                                placeholder="menu.myrestaurant.com"
                                className="flex-1 h-11 px-4 rounded-xl bg-secondary/30 border border-border/40 text-sm font-mono focus:outline-none focus:border-primary/50"
                            />
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {t("common.save") || "حفظ"}
                            </button>
                        </div>
                    </div>

                    {currentDomain && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">الدومين الحالي نشط</p>
                                <code className="text-xs text-emerald-400 font-mono">{currentDomain}</code>
                            </div>
                            <button
                                onClick={handleRemove}
                                className="text-xs text-red-400 hover:underline"
                            >
                                إزالة
                            </button>
                        </div>
                    )}

                    <div className="p-4 rounded-xl bg-secondary/20 border border-border/30">
                        <p className="text-sm font-medium mb-2">خطوات الإعداد:</p>
                        <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
                            <li>أضف سجل CNAME يشير إلى <code className="bg-secondary/50 px-1.5 py-0.5 rounded text-xs">cname.vercel-dns.com</code></li>
                            <li>أدخل الدومين أعلاه واضغط حفظ</li>
                            <li>انتظر حتى يتم تفعيل شهادة SSL (قد يستغرق بضع دقائق)</li>
                        </ol>
                    </div>
                </div>
            )}
        </div>
    );
}
