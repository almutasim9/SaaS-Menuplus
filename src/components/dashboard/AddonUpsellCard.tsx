"use client";

import { Sparkles, MessageCircle } from "lucide-react";
import { ADDON_DEFINITIONS, type AddonKey } from "@/lib/addons/addon-definitions";

interface AddonUpsellCardProps {
    addonKey: AddonKey;
    /** Override language — defaults to 'ar' */
    lang?: "en" | "ar" | "ku";
}

/**
 * Shown in the restaurant dashboard when a feature is blocked
 * because the restaurant needs an add-on (Phase 1: manual activation).
 */
export function AddonUpsellCard({ addonKey, lang = "ar" }: AddonUpsellCardProps) {
    const def = ADDON_DEFINITIONS[addonKey];

    return (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6 flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/15 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-violet-400" />
            </div>
            <div>
                <p className="font-bold text-sm">{def.name[lang]}</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">{def.description[lang]}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-xl font-medium">
                <Sparkles className="w-3 h-3" />
                ${def.price} / شهر
            </div>
            <a
                href="https://wa.me/9647700000000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold transition-colors"
            >
                <MessageCircle className="w-4 h-4" />
                تواصل معنا لتفعيل الإضافة
            </a>
        </div>
    );
}
