export const ADDON_DEFINITIONS = {
    discounts: {
        key: 'discounts',
        name: { en: 'Discounts & Coupons', ar: 'الخصومات والكوبونات', ku: 'داشکاندن و کوپۆنەکان' },
        description: { en: 'Full flexible discount system', ar: 'نظام خصومات مرن ومتكامل', ku: 'سیستەمی داشکاندنی تەواو' },
        price: 10,
        features: [
            'create_coupons',
            'percentage_discount',
            'fixed_discount',
            'free_delivery_discount',
            'min_order_requirement',
            'usage_limits',
            'expiration_dates',
            'promo_code_generator',
            'product_specific_coupons',
        ],
    },
    advanced_delivery: {
        key: 'advanced_delivery',
        name: { en: 'Advanced Delivery', ar: 'التوصيل المتقدم', ku: 'گەیاندنی پێشکەوتوو' },
        description: { en: 'Full delivery zone control', ar: 'تحكم كامل بمناطق التوصيل', ku: 'کۆنترۆڵی تەواوی ناوچەی گەیاندن' },
        price: 8,
        features: [
            'unlimited_zones',
            'free_delivery_threshold',
            'min_order_per_zone',
            'delivery_hours',
            'out_of_zone_orders',
            'estimated_delivery_time',
        ],
    },
    analytics_pro: {
        key: 'analytics_pro',
        name: { en: 'Analytics Pro', ar: 'تحليلات متقدمة', ku: 'شیکاری پێشکەوتوو' },
        description: { en: 'Deep data insights', ar: 'بيانات وتحليلات عميقة', ku: 'داتا و شیکاری قوول' },
        price: 7,
        features: [
            'conversion_rates',
            'visit_source_breakdown',
            'product_ranking',
            'revenue_trends_30d',
            'top_sellers_analysis',
        ],
    },
    custom_branding: {
        key: 'custom_branding',
        name: { en: 'Custom Branding', ar: 'تخصيص البراند', ku: 'تایبەتمەندکردنی براند' },
        description: { en: 'Full brand control', ar: 'تحكم كامل بالهوية البصرية', ku: 'کۆنترۆڵی تەواوی ناسنامەی بینەیی' },
        price: 5,
        features: [
            'custom_colors',
            'custom_fonts',
            'logo_upload',
            'banner_upload',
            'theme_mode',
            'layout_options',
            'remove_branding',
            'welcome_message',
        ],
    },
    custom_domain: {
        key: 'custom_domain',
        name: { en: 'Custom Domain', ar: 'دومين مخصص', ku: 'دۆمەینی تایبەت' },
        description: { en: 'Use your own domain', ar: 'استخدم دومينك الخاص', ku: 'دۆمەینی خۆت بەکاربهێنە' },
        price: 5,
        features: [
            'domain_mapping',
            'ssl_included',
            'seo_benefits',
        ],
    },
} as const;

export type AddonKey = keyof typeof ADDON_DEFINITIONS;

/** Returns the addon definition that provides a given feature key, or null. */
export function findAddonForFeature(featureKey: string): typeof ADDON_DEFINITIONS[AddonKey] | null {
    for (const addon of Object.values(ADDON_DEFINITIONS)) {
        if ((addon.features as readonly string[]).includes(featureKey)) {
            return addon;
        }
    }
    return null;
}
