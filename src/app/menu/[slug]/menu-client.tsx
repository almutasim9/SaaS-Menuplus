"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { UtensilsCrossed, Bell, User as UserIcon, Truck } from "lucide-react";
import { CategoryFilter } from "@/components/menu/CategoryFilter";
import { SearchBar } from "@/components/menu/SearchBar";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { FloatingCartButton } from "@/components/menu/FloatingCartButton";
import type { Restaurant, Category, ProductWithCustomization } from "@/lib/types/database.types";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/context";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";

interface MenuPageClientProps {
    restaurant: Restaurant;
    categories: Category[];
    products: ProductWithCustomization[];
    slug: string;
}

export function MenuPageClient({ restaurant, categories, products: initialProducts, slug }: MenuPageClientProps) {
    const { t, dir } = useTranslation();
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Track visit once per session
    useEffect(() => {
        const key = `visited_${restaurant.id}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");

        const params = new URLSearchParams(window.location.search);
        const source = params.get("ref") === "qr" ? "qr" : "direct";

        fetch("/api/track-visit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ restaurantId: restaurant.id, source }),
        }).catch(() => { }); // fire-and-forget
    }, [restaurant.id]);

    const { data: products } = useQuery({
        queryKey: ['products', restaurant.id],
        queryFn: async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('products')
                .select(`
                    *,
                    product_variants (*),
                    product_addons (*)
                `)
                .eq('restaurant_id', restaurant.id)
                .order('created_at', { ascending: false });
            return (data || []) as ProductWithCustomization[];
        },
        initialData: initialProducts,
    });

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    const filtered = products.filter((p) => {
        const matchesCategory = !activeCategory || p.category_id === activeCategory;
        const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const themeSettings = (restaurant.theme_settings as Record<string, any>) || {};
    const primaryColor = restaurant.primary_color || "#ea580c";
    const secondaryColor = themeSettings.secondary_color || "#ffffff";
    const isDark = themeSettings.theme_mode === "dark";
    const showSearch = themeSettings.show_search !== false; // default true
    const welcomeMessage = themeSettings.welcome_message;
    const layoutProducts = themeSettings.layout_products || "grid";
    const fontFamily = themeSettings.font_family || "cairo";
    // For sidebar categories we'd need a bigger layout shift. For now we just implement the settings visually.

    // Map font family to actual CSS font string
    const fontFamilies: Record<string, string> = {
        cairo: "'Cairo', sans-serif",
        tajawal: "'Tajawal', sans-serif",
        ibm: "'IBM Plex Sans Arabic', sans-serif",
        inter: "'Inter', sans-serif",
    };

    return (
        <div
            dir={dir}
            className={`min-h-screen pb-24 font-sans ${dir === 'rtl' ? 'text-right' : 'text-left'} ${isDark ? "bg-[#0a0a0a] text-white" : "bg-white text-black"}`}
            style={{
                backgroundColor: isDark ? '#0a0a0a' : secondaryColor,
                fontFamily: fontFamilies[fontFamily] || fontFamilies.cairo,
                '--primary': primaryColor
            } as React.CSSProperties}
        >
            <div className="max-w-5xl mx-auto bg-white min-h-screen">
                {/* Header Top Bar */}
                <div className="flex flex-col gap-4 px-5 pt-8 pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <LanguageSwitcher className="p-1 px-2 h-8 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700" showLabel={false} />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 line-clamp-1 dark:text-gray-100 mx-auto">{restaurant.name}</h1>
                        <UtensilsCrossed className="w-6 h-6 shrink-0" style={{ color: primaryColor }} />
                    </div>

                    {/* Search inside header */}
                    {showSearch && (
                        <div className="w-full">
                            <SearchBar onSearch={handleSearch} placeholder={t("storefront.searchPlaceholder")} />
                        </div>
                    )}
                </div>

                {/* Banner Wrapper */}
                <div className="px-5 mt-2">
                    <div className="w-full rounded-2xl md:rounded-3xl relative overflow-hidden shadow-sm aspect-[4/1] md:aspect-[6/1] flex flex-col items-center justify-center p-4 md:p-6 text-center" style={{ backgroundColor: primaryColor }}>
                        {restaurant.banner_url ? (
                            <img src={restaurant.banner_url} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                        ) : null}

                        <div className="relative z-10 w-full">
                            {/* In the mockup there is some text on the banner. We only have welcome message and name. */}
                            <h2 className="text-white text-xl md:text-3xl font-bold mb-2 drop-shadow-md">
                                {welcomeMessage || t("storefront.welcome", { name: restaurant.name })}
                            </h2>
                            {/* If there's an active coupon or something, we could check DB, but user said remove mock data. So we just show welcome text. */}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className={`mt-8 ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
                    {/* Categories Pill List - Hide if only 1 category */}
                    {categories.length > 1 && (
                        <div className="px-5 mb-8 flex justify-center">
                            <CategoryFilter
                                categories={categories}
                                activeCategory={activeCategory}
                                onSelect={setActiveCategory}
                            />
                        </div>
                    )}

                    {/* Products Grid / List */}
                    <div className={`px-5 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        <h2 className="text-xl font-bold mb-4">{t("storefront.products")}</h2>
                        {filtered.length === 0 ? (
                            <div className={`text-center py-16 rounded-3xl shadow-sm border ${isDark ? "bg-[#1a1a1a] border-gray-800" : "bg-white border-gray-100"}`}>
                                <UtensilsCrossed className={`w-14 h-14 mx-auto mb-3 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
                                <p className="font-medium">{t("storefront.noProductsTitle")}</p>
                                <p className={`text-sm mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{t("storefront.noProductsDesc")}</p>
                            </div>
                        ) : (
                            <div className={layoutProducts === "list" ? "flex flex-col gap-4" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"}>
                                {filtered.map((product, i) => (
                                    <MenuItemCard key={product.id} product={product} index={i} isListLayout={layoutProducts === "list"} isDark={isDark} isFreeDelivery={restaurant.is_free_delivery} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Floating Cart Button */}
                <FloatingCartButton slug={slug} />
            </div>
        </div>
    );
}
