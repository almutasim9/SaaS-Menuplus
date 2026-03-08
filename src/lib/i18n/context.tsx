"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Locale, TranslationKeys } from "./types";
import { localeConfig } from "./types";

import ar from "./locales/ar.json";
import ku from "./locales/ku.json";
import en from "./locales/en.json";

const translations: Record<Locale, TranslationKeys> = {
    ar: ar as unknown as TranslationKeys,
    ku: ku as unknown as TranslationKeys,
    en: en as unknown as TranslationKeys,
};

type I18nContextType = {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    dir: "rtl" | "ltr";
};

const I18nContext = createContext<I18nContextType | null>(null);

function getNestedValue(obj: Record<string, unknown>, path: string): string {
    const keys = path.split(".");
    let current: unknown = obj;
    for (const key of keys) {
        if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
            current = (current as Record<string, unknown>)[key];
        } else {
            return path; // fallback: return key itself
        }
    }
    return typeof current === "string" ? current : path;
}

export function LanguageProvider({
    children,
    initialLocale = "ar"
}: {
    children: ReactNode,
    initialLocale?: Locale
}) {
    const [locale, setLocaleState] = useState<Locale>(initialLocale);

    useEffect(() => {
        const stored = localStorage.getItem("menuplus_locale") as Locale | null;
        if (stored && translations[stored] && stored !== initialLocale) {
            setLocaleState(stored);
        }
    }, [initialLocale]);

    useEffect(() => {
        const config = localeConfig[locale];
        document.documentElement.dir = config.dir;
        document.documentElement.lang = locale;
    }, [locale]);

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem("menuplus_locale", newLocale);
        document.cookie = `menuplus_locale=${newLocale}; path=/; max-age=31536000`; // 1 year
    }, []);

    const t = useCallback((key: string, params?: Record<string, string | number>): string => {
        let text = getNestedValue(translations[locale] as unknown as Record<string, unknown>, key);
        if (params && text) {
            for (const [k, v] of Object.entries(params)) {
                text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
            }
        }
        return text;
    }, [locale]);

    const dir = localeConfig[locale].dir;

    return (
        <I18nContext.Provider value={{ locale, setLocale, t, dir }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error("useTranslation must be used within a LanguageProvider");
    }
    return context;
}
