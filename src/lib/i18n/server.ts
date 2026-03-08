import { cookies } from "next/headers";
import { type Locale, type TranslationKeys, localeConfig } from "./types";
import ar from "./locales/ar.json";
import ku from "./locales/ku.json";
import en from "./locales/en.json";

const translations: Record<Locale, TranslationKeys> = {
    ar: ar as unknown as TranslationKeys,
    ku: ku as unknown as TranslationKeys,
    en: en as unknown as TranslationKeys,
};

function getNestedValue(obj: Record<string, unknown>, path: string): string {
    const keys = path.split(".");
    let current: unknown = obj;
    for (const key of keys) {
        if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
            current = (current as Record<string, unknown>)[key];
        } else {
            return path;
        }
    }
    return typeof current === "string" ? current : path;
}

export async function getI18n() {
    const cookieStore = await cookies();
    const locale = (cookieStore.get("menuplus_locale")?.value as Locale) || "ar";

    // Fallback to "ar" if the cookie is invalid
    const activeLocale = translations[locale] ? locale : "ar";

    const t = (key: string): string => {
        return getNestedValue(translations[activeLocale] as unknown as Record<string, unknown>, key);
    };

    return {
        t,
        locale: activeLocale,
        dir: localeConfig[activeLocale].dir,
    };
}
