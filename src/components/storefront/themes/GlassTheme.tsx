"use client";

import NextImage from "next/image";
import { motion } from "framer-motion";
import { UtensilsCrossed, Plus, ImageIcon } from "lucide-react";
import { CategoryFilter } from "@/components/menu/CategoryFilter";
import { SearchBar } from "@/components/menu/SearchBar";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { FloatingCartButton } from "@/components/menu/FloatingCartButton";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ActiveOrderBanner } from "@/components/menu/ActiveOrderBanner";
import type { Restaurant, Category, ProductWithCustomization } from "@/lib/types/database.types";
import { useCallback, useState } from "react";

export interface ThemeProps {
    restaurant: Restaurant;
    categories: Category[];
    products: ProductWithCustomization[];
    filteredProducts: ProductWithCustomization[];
    activeCategory: string | null;
    onCategorySelect: (id: string | null) => void;
    searchQuery: string;
    onSearch: (query: string) => void;
    slug: string;
    t: any;
    dir: "ltr" | "rtl";
}

export function GlassTheme({
    restaurant,
    categories,
    filteredProducts,
    activeCategory,
    onCategorySelect,
    searchQuery,
    onSearch,
    slug,
    t,
    dir
}: ThemeProps) {
    const ITEMS_PER_PAGE = 40;
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

    const themeSettings = (restaurant.theme_settings as Record<string, any>) || {};
    const primaryColor = restaurant.primary_color || "#ea580c";
    const secondaryColor = themeSettings.secondary_color || "#ffffff";
    const isDark = themeSettings.theme_mode === "dark";
    const showSearch = themeSettings.show_search !== false;
    const welcomeMessage = themeSettings.welcome_message;
    const layoutProducts = themeSettings.layout_products || "grid";
    const fontFamily = themeSettings.font_family || "cairo";

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
            <div className={`max-w-5xl mx-auto min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
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
                            <SearchBar onSearch={onSearch} placeholder={t("storefront.searchPlaceholder")} />
                        </div>
                    )}
                </div>

                {/* Active Order Persistent Banner */}
                <ActiveOrderBanner slug={slug} />

                {/* Banner Wrapper */}
                <div className="px-5 mt-2">
                    <div className="w-full rounded-2xl md:rounded-3xl relative overflow-hidden shadow-sm aspect-[4/1] md:aspect-[6/1] flex flex-col items-center justify-center p-4 md:p-6 text-center" style={{ backgroundColor: primaryColor }}>
                        {restaurant.banner_url ? (
                            <NextImage src={restaurant.banner_url} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-90" fill sizes="100vw" priority />
                        ) : null}

                        <div className="relative z-10 w-full">
                            <h2 className="text-white text-xl md:text-3xl font-bold mb-2 drop-shadow-md">
                                {welcomeMessage || t("storefront.welcome", { name: restaurant.name })}
                            </h2>
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
                                onSelect={onCategorySelect}
                            />
                        </div>
                    )}

                    {/* Products Grid / List */}
                    <div className={`px-5 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        <h2 className="text-xl font-bold mb-4">{t("storefront.products")}</h2>
                        {filteredProducts.length === 0 ? (
                            <div className={`text-center py-16 rounded-3xl shadow-sm border ${isDark ? "bg-[#1a1a1a] border-gray-800" : "bg-white border-gray-100"}`}>
                                <UtensilsCrossed className={`w-14 h-14 mx-auto mb-3 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
                                {searchQuery ? (
                                    <>
                                        <p className="font-medium">{t("storefront.noSearchResults", { query: searchQuery })}</p>
                                        <p className={`text-sm mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{t("storefront.noSearchResultsDesc")}</p>
                                    </>
                                ) : activeCategory ? (
                                    <>
                                        <p className="font-medium">{t("storefront.noCategoryProducts")}</p>
                                        <p className={`text-sm mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{t("storefront.noCategoryProductsDesc")}</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-medium">{t("storefront.menuEmpty")}</p>
                                        <p className={`text-sm mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{t("storefront.menuEmptyDesc")}</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <>
                            <div className={layoutProducts === "list" ? "flex flex-col gap-4" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"}>
                                {filteredProducts.slice(0, visibleCount).map((product, i) => (
                                    <MenuItemCard key={product.id} product={product} index={i} isListLayout={layoutProducts === "list"} isDark={isDark} isFreeDelivery={(restaurant as any).is_free_delivery || false} />
                                ))}
                            </div>
                            {filteredProducts.length > visibleCount && (
                                <div className="flex justify-center mt-8">
                                    <button
                                        onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                                        className="px-8 py-3 rounded-2xl font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
                                        style={{ backgroundColor: 'var(--primary)' }}
                                    >
                                        {t("storefront.loadMore")}
                                    </button>
                                </div>
                            )}
                            </>
                        )}
                    </div>
                </div>

                {/* Floating Cart Button */}
                <FloatingCartButton slug={slug} />
            </div>
        </div>
    );
}
