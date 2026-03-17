"use client";

import { useState, useCallback, useEffect } from "react";
import NextImage from "next/image";
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
import { ActiveOrderBanner } from "@/components/menu/ActiveOrderBanner";

import { GlassTheme } from "@/components/storefront/themes/GlassTheme";
import { GridTheme } from "@/components/storefront/themes/GridTheme";

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
    const ITEMS_PER_PAGE = 40;
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

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
                    product_addons (*),
                    product_availability (*)
                `)
                .eq('restaurant_id', restaurant.id)
                .eq('is_available', true)
                .eq('is_hidden', false)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });
            return (data || []) as ProductWithCustomization[];
        },
        initialData: initialProducts,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    if (restaurant.subscription_status === "expired") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center">
                <div className="max-w-md space-y-4">
                    <div className="p-4 rounded-full bg-destructive/10 w-16 h-16 flex items-center justify-center mx-auto">
                        <Bell className="w-8 h-8 text-destructive" />
                    </div>
                    <h2 className="text-2xl font-bold">{t("storefront.subscriptionExpired")}</h2>
                    <p className="text-muted-foreground">{restaurant.name}</p>
                </div>
            </div>
        );
    }

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setVisibleCount(ITEMS_PER_PAGE);
    };

    const handleCategorySelect = (id: string | null) => {
        setActiveCategory(id);
        setVisibleCount(ITEMS_PER_PAGE);
    };

    const filtered = products.filter((p) => {
        const matchesCategory = !activeCategory || p.category_id === activeCategory;
        const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const themeSettings = (restaurant.theme_settings as Record<string, any>) || {};
    const theme = themeSettings.theme || "glass";

    const themeProps = {
        restaurant,
        categories,
        products,
        filteredProducts: filtered,
        activeCategory,
        onCategorySelect: handleCategorySelect,
        searchQuery,
        onSearch: handleSearch,
        slug,
        t,
        dir: dir as "ltr" | "rtl"
    };

    if (theme === "grid") {
        return <GridTheme {...themeProps} />;
    }

    return <GlassTheme {...themeProps} />;
}
