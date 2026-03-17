"use client";

import type { ThemeProps } from "./GlassTheme";
import NextImage from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { UtensilsCrossed, ArrowRight, Search, MapPin, Globe, Leaf } from "lucide-react";
import { SearchBar } from "@/components/menu/SearchBar";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { FloatingCartButton } from "@/components/menu/FloatingCartButton";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { ActiveOrderBanner } from "@/components/menu/ActiveOrderBanner";
import { useTranslation } from "@/lib/i18n/context";
import { useState, useRef, useEffect } from "react";

export function GridTheme({
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
    const { locale } = useTranslation();
    const ITEMS_PER_PAGE = 24;
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const scrollRef = useRef<HTMLDivElement>(null);

    const themeSettings = (restaurant.theme_settings as Record<string, any>) || {};
    const primaryColor = restaurant.primary_color || "#ea580c";
    const isDark = themeSettings.theme_mode === "dark";
    const showSearch = themeSettings.show_search !== false;
    const welcomeMessage = themeSettings.welcome_message;

    // Reset visible count when category changes
    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
    }, [activeCategory]);

    return (
        <div
            dir={dir}
            className={`min-h-screen pb-32 font-sans selection:bg-primary/20 ${dir === 'rtl' ? 'text-right' : 'text-left'} ${isDark ? "bg-[#050505] text-zinc-100" : "bg-[#fcfcfc] text-zinc-900"}`}
            style={{ '--primary': primaryColor } as React.CSSProperties}
        >
            {/* Minimalist Navigation */}
            <nav className="fixed top-0 inset-x-0 z-50 h-16 px-6 flex items-center justify-between border-b border-white/5 backdrop-blur-xl bg-black/10">
                <div className="flex items-center gap-4">
                     <LanguageSwitcher className="bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-xs px-3 h-8 transition-colors" showLabel={false} />
                </div>
                
                <motion.div 
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center gap-2"
                >
                    <span className="text-sm font-black uppercase tracking-widest">{restaurant.name}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                </motion.div>

                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-primary/20 flex items-center justify-center">
                    {restaurant.logo_url ? (
                        <NextImage src={restaurant.logo_url} alt={restaurant.name} width={32} height={32} />
                    ) : <Globe className="w-4 h-4 text-white" />}
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative h-[45vh] md:h-[60vh] w-full overflow-hidden">
                <motion.div 
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.2 }}
                    className="absolute inset-0"
                >
                    {restaurant.banner_url ? (
                        <NextImage src={restaurant.banner_url} alt="" className="w-full h-full object-cover" fill priority />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-black" />
                    )}
                </motion.div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/20" />
                
                <div className="absolute inset-x-0 bottom-0 p-8 md:p-16 flex flex-col items-center text-center">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="max-w-2xl"
                    >
                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 drop-shadow-2xl leading-[1.1]">
                            {welcomeMessage || t("storefront.welcome", { name: restaurant.name })}
                        </h2>
                        <div className="flex items-center justify-center gap-4 text-white/60 text-sm md:text-base font-medium">
                            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" /> {t("common.available")}</span>
                            <div className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="flex items-center gap-1.5"><Leaf className="w-4 h-4 text-emerald-500" /> Fresh Ingredients</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-10">
                <ActiveOrderBanner slug={slug} />

                {/* Floating Search & Category Section */}
                <div className="sticky top-20 z-40 my-8">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-3 rounded-[2.5rem] bg-white/70 dark:bg-zinc-900/70 border border-white/20 dark:border-white/5 backdrop-blur-2xl shadow-2xl">
                        {/* Categories Scrollable Area */}
                        <div className="flex-1 w-full overflow-x-auto no-scrollbar mask-fade">
                            <div className="flex gap-2 p-1 min-w-max">
                                <button
                                    onClick={() => onCategorySelect(null)}
                                    className={`px-5 py-2.5 rounded-full font-bold transition-all text-xs uppercase tracking-wider ${!activeCategory ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'hover:bg-primary/10'}`}
                                >
                                    {t("common.all")}
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => onCategorySelect(cat.id)}
                                        className={`px-5 py-2.5 rounded-full font-bold transition-all text-xs uppercase tracking-wider ${activeCategory === cat.id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'hover:bg-primary/10 text-zinc-500'}`}
                                    >
                                        {locale === 'en' && cat.name_en ? cat.name_en : locale === 'ku' && cat.name_ku ? cat.name_ku : cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {showSearch && (
                            <div className="w-full md:w-64 h-11 relative">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <Search className="w-4 h-4 text-zinc-400" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => onSearch(e.target.value)}
                                    placeholder={t("storefront.searchPlaceholder")}
                                    className="w-full h-full pl-10 pr-4 rounded-full bg-zinc-100 dark:bg-zinc-800/50 border-none text-xs focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Products Grid */}
                <motion.div 
                    layout
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredProducts.slice(0, visibleCount).map((product, i) => (
                            <MenuItemCard 
                                key={product.id} 
                                product={product} 
                                index={i} 
                                isListLayout={false} 
                                isDark={isDark} 
                                isFreeDelivery={(restaurant as any).is_free_delivery || false}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>

                {filteredProducts.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-32 rounded-[3rem] bg-zinc-100/50 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800"
                    >
                        <UtensilsCrossed className="w-20 h-20 mx-auto mb-6 opacity-5 animate-pulse" />
                        <h3 className="text-xl font-bold mb-2">{t("storefront.menuEmpty")}</h3>
                        <p className="text-zinc-500 text-sm max-w-xs mx-auto">{t("storefront.menuEmptyDesc")}</p>
                    </motion.div>
                )}

                {filteredProducts.length > visibleCount && (
                    <div className="flex justify-center mt-20">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                            className="group flex items-center gap-3 px-12 py-5 rounded-full font-black text-white shadow-[0_20px_40px_-10px_rgba(var(--primary-rgb),0.3)] transition-all text-xl"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {t("storefront.loadMore")}
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                    </div>
                )}
            </div>

            <FloatingCartButton slug={slug} />
            
            {/* Minimalist Footer */}
            <footer className="mt-32 py-16 px-8 border-t border-zinc-100 dark:border-zinc-900 text-center">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <UtensilsCrossed className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-black text-lg uppercase tracking-wider">{restaurant.name}</span>
                </div>
                <p className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold">
                    Powered by MenuPlus &copy; 2026
                </p>
            </footer>
        </div>
    );
}
