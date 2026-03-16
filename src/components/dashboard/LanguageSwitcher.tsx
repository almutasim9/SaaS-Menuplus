"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/context";
import { localeConfig, type Locale } from "@/lib/i18n/types";
import { Globe, Check } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LanguageSwitcherProps {
    compact?: boolean;
    className?: string;
    showLabel?: boolean;
}

export function LanguageSwitcher({ compact = false, className = "", showLabel = true }: LanguageSwitcherProps) {
    const { locale, setLocale } = useTranslation();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className={className || `flex items-center gap-2 rounded-xl border border-transparent ${compact ? "p-2" : "px-3 py-2 text-sm"}`}>
                <Globe className="w-4 h-4 text-muted-foreground" />
            </div>
        );
    }

    const current = localeConfig[locale];
    const locales = Object.entries(localeConfig) as [Locale, typeof current][];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={className || `flex items-center gap-2 rounded-xl transition-colors hover:bg-secondary/50 focus:outline-none ${compact ? "p-2" : "px-3 py-2 text-sm"}`}
                >
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    {!compact && showLabel && (
                        <span className="text-sm text-foreground font-medium">
                            {current.flag} {current.nativeName}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-[180px] rounded-xl z-[100]">
                {locales.map(([key, config]) => (
                    <DropdownMenuItem
                        key={key}
                        onClick={() => setLocale(key)}
                        className={`cursor-pointer flex items-center justify-between px-3 py-2.5 rounded-lg ${locale === key ? "bg-emerald-500/10 text-emerald-500 focus:bg-emerald-500/10 focus:text-emerald-500" : ""}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-base">{config.flag}</span>
                            <span className="font-medium">{config.nativeName}</span>
                        </div>
                        {locale === key && <Check className="w-4 h-4" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
