"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/context";
import {
    CheckCircle,
    Circle,
    FolderPlus,
    Package,
    QrCode,
    Palette,
    ArrowRight,
    Sparkles,
    X,
} from "lucide-react";
import Link from "next/link";

type OnboardingStep = {
    id: string;
    label: string;
    icon: typeof FolderPlus;
    href: string;
    completed: boolean;
};

export function OnboardingChecklist() {
    const { t } = useTranslation();
    const [steps, setSteps] = useState<OnboardingStep[]>([]);
    const [loading, setLoading] = useState(true);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if user previously dismissed
        const stored = localStorage.getItem("onboarding_dismissed");
        if (stored === "true") {
            setDismissed(true);
            setLoading(false);
            return;
        }

        async function load() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }

            const { data: profile } = await supabase.from("profiles").select("restaurant_id").eq("id", user.id).single();
            if (!profile?.restaurant_id) { setLoading(false); return; }

            const restaurantId = profile.restaurant_id;

            // Check each step
            const [categoriesRes, productsRes, restaurantRes] = await Promise.all([
                supabase.from("categories").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId).is("deleted_at", null),
                supabase.from("products").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId).is("deleted_at", null),
                supabase.from("restaurants").select("logo_url, primary_color").eq("id", restaurantId).single(),
            ]);

            const hasCategories = (categoriesRes.count || 0) > 0;
            const hasProducts = (productsRes.count || 0) > 0;
            const restaurant = restaurantRes.data;
            const hasCustomized = !!(restaurant?.logo_url || (restaurant?.primary_color && restaurant.primary_color.toLowerCase() !== "#10b981"));

            setSteps([
                { id: "category", label: t("onboarding.addCategory"), icon: FolderPlus, href: "/dashboard/menu", completed: hasCategories },
                { id: "product", label: t("onboarding.addProduct"), icon: Package, href: "/dashboard/menu", completed: hasProducts },
                { id: "appearance", label: t("onboarding.customizeAppearance"), icon: Palette, href: "/dashboard/appearance", completed: hasCustomized },
                { id: "share", label: t("onboarding.shareQr"), icon: QrCode, href: "/dashboard", completed: false },
            ]);
            setLoading(false);
        }
        load();
    }, []);

    if (loading || dismissed) return null;

    const completedCount = steps.filter(s => s.completed).length;
    const totalSteps = steps.length;
    const progress = (completedCount / totalSteps) * 100;

    // If all done, don't show
    if (completedCount === totalSteps) return null;

    return (
        <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent mb-6 relative">
            {/* Dismiss */}
            <button
                onClick={() => { setDismissed(true); localStorage.setItem("onboarding_dismissed", "true"); }}
                className="absolute top-3 left-3 rtl:left-auto rtl:right-3 p-1 rounded-lg hover:bg-secondary/50 text-muted-foreground"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h3 className="font-bold text-sm">{t("onboarding.title")}</h3>
                    <p className="text-xs text-muted-foreground">{completedCount} {t("onboarding.stepsCompleted")} ({totalSteps})</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-4">
                <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Steps */}
            <div className="space-y-2">
                {steps.map((step) => {
                    const Icon = step.icon;
                    return (
                        <Link
                            key={step.id}
                            href={step.href}
                            className={`flex items-center gap-3 p-3 rounded-xl text-sm transition-colors ${step.completed
                                ? "bg-emerald-500/5 text-muted-foreground"
                                : "hover:bg-secondary/30"
                                }`}
                        >
                            {step.completed ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                                <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                            )}
                            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className={step.completed ? "line-through" : "font-medium"}>{step.label}</span>
                            {!step.completed && <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground rtl:rotate-180" />}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
