"use client";

import { useState, useRef, memo } from "react";
import NextImage from "next/image";
import { motion } from "framer-motion";
import { Plus, Check, ImageIcon, Truck } from "lucide-react";
import { useParams } from "next/navigation";
import { useCartStore } from "@/lib/store/cartStore";
import { ProductCustomizationModal } from "./ProductCustomizationModal";
import type { ProductWithCustomization } from "@/lib/types/database.types";
import { Badge } from "@/components/ui/badge";
import { incrementProductView } from "@/lib/actions/products";
import { useTranslation } from "@/lib/i18n/context";
import { isProductCurrentlyAvailable } from "@/lib/utils/availability";
import { Clock } from "lucide-react";
import { format24to12String } from "@/lib/time-utils";


interface MenuItemCardProps {
    product: ProductWithCustomization;
    index: number;
    isListLayout?: boolean;
    isDark?: boolean;
    isFreeDelivery?: boolean;
}

export const MenuItemCard = memo(function MenuItemCard({ product, index, isListLayout = false, isDark = false, isFreeDelivery = false }: MenuItemCardProps) {
    const { t, dir, locale } = useTranslation();
    const params = useParams();
    const slug = params.slug as string;
    const addItem = useCartStore((state) => state.addItem);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [justAdded, setJustAdded] = useState(false);
    const justAddedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const hasOptions = (product.product_variants && product.product_variants.length > 0) ||
        (product.product_addons && product.product_addons.length > 0);

    const localizedName = locale === 'en' && product.name_en ? product.name_en : locale === 'ku' && product.name_ku ? product.name_ku : product.name;
    const localizedDesc = locale === 'en' && product.description_en ? product.description_en : locale === 'ku' && product.description_ku ? product.description_ku : product.description;

    const handleAddClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isCurrentlyUnavailable) return; // Prevent if out of stock or scheduled away

        if (hasOptions) {
            setIsModalOpen(true);
        } else {
            if (slug) {
                addItem(slug, {
                    id: product.id,
                    name: localizedName,
                    price: Number(product.price),
                    image_url: product.image_url || undefined,
                });
                incrementProductView(product.id);
                // Visual feedback: show checkmark for 1.5s
                if (justAddedTimer.current) clearTimeout(justAddedTimer.current);
                setJustAdded(true);
                justAddedTimer.current = setTimeout(() => setJustAdded(false), 1500);
            }
        }
    };

    const hasImage = !!product.image_url;

    const isDiscounted = !!(product.is_discount_active && product.compare_at_price && product.compare_at_price > product.price);
    const discountPercent = isDiscounted
        ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
        : 0;

    const isOutOfStock = !product.is_available || product.stock_count === 0;

    const { isAvailable: isScheduledAvailable, nextOpening } = isProductCurrentlyAvailable(product.product_availability as any);
    const isCurrentlyUnavailable = isOutOfStock || !isScheduledAvailable;
    
    // Price calculation
    const variants = product.product_variants || [];
    const hasVariants = variants.length > 0;
    const minPrice = hasVariants 
        ? Math.min(...variants.map(v => Number(v.price))) 
        : Number(product.price);
    const hasPriceRange = hasVariants && new Set(variants.map(v => Number(v.price))).size > 1;

    return (
        <>
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className={`flex ${isListLayout ? "flex-row h-28 items-center p-3 gap-3" : "flex-col p-2.5 h-auto"} rounded-[2rem] ${isDark ? "bg-[#141414] border-gray-800" : "bg-white border-gray-50"} border shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] ${isCurrentlyUnavailable ? "opacity-60 grayscale cursor-not-allowed" : "hover:shadow-lg transition-transform hover:-translate-y-1 duration-300 cursor-pointer"} relative group overflow-hidden`}
            onClick={() => { if (!isCurrentlyUnavailable) setIsModalOpen(true) }}
        >
            {/* Image Section - Takes top space in Grid */}
            <div className={`relative ${isListLayout ? "w-20 h-20 shrink-0" : "aspect-square w-full"} rounded-3xl overflow-hidden ${isDark ? "bg-[#2a2a2a]" : "bg-gray-100/70"} flex items-center justify-center`} style={hasImage || isDark ? undefined : { backgroundColor: 'var(--primary)05' }}>
                {hasImage ? (
                    <NextImage
                        src={product.image_url!}
                        alt={localizedName}
                        className="w-[85%] h-[85%] object-contain scale-95 group-hover:scale-105 transition-transform duration-300"
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        loading={index < 4 ? "eager" : "lazy"}
                        priority={index === 0}
                    />
                ) : (
                    <div className="w-[85%] h-[85%] rounded-3xl bg-white/50 flex items-center justify-center">
                        <ImageIcon className={`w-8 h-8 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
                    </div>
                )}
            </div>

            {/* Info Section - Bottom area */}
            <div className={`flex flex-col justify-between flex-1 w-full relative ${isListLayout ? "h-full py-1" : "pt-4 px-2 pb-1"}`}>
                <div className="flex flex-col gap-0.5">
                    <h3 className={`font-bold text-[14px] leading-tight line-clamp-2 ${isDark ? "text-white" : "text-gray-900"}`}>{localizedName}</h3>
                    {localizedDesc && (
                        <p className={`text-[11px] leading-snug line-clamp-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{localizedDesc}</p>
                    )}
                </div>

                <div className={`flex items-end justify-between gap-2 w-full mt-3`}>
                    <div className="flex flex-col">
                        {isDiscounted && (
                            <span className="text-[10px] text-muted-foreground line-through font-medium opacity-60">
                                {Number(product.compare_at_price).toFixed(0)} {t("storefront.currency")}
                            </span>
                        )}
                        <div className="flex flex-col">
                            {hasPriceRange && (
                                <span className="text-[10px] text-muted-foreground font-medium opacity-70">
                                    {t("storefront.startsFrom")}
                                </span>
                            )}
                            <p className="text-base font-bold whitespace-nowrap" style={{ color: isDiscounted ? '#ef4444' : 'var(--primary)' }}>
                                {minPrice.toFixed(0)} <span className="text-[11px] font-medium opacity-80">{t("storefront.currency")}</span>
                            </p>
                        </div>
                        {isFreeDelivery && (
                            <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-semibold mt-0.5">
                                <Truck className="w-2.5 h-2.5" />
                                {t("storefront.freeDelivery")}
                            </span>
                        )}
                    </div>

                    {/* Add Button OR Out of Stock Badge */}
                    {!isCurrentlyUnavailable ? (
                        <div className="mr-auto self-end flex items-center justify-center">
                            <button
                                onClick={handleAddClick}
                                className={`w-8 h-8 shrink-0 rounded-full text-white flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all z-10`}
                                style={{ backgroundColor: justAdded ? '#16a34a' : 'var(--primary)' }}
                                aria-label={justAdded ? t("storefront.addedToCart") : t("storefront.addToCart")}
                            >
                                {justAdded
                                    ? <Check className="w-4 h-4" />
                                    : <Plus className="w-5 h-5" />
                                }
                            </button>
                        </div>
                    ) : (
                        <div className={`self-end ${dir === 'rtl' ? 'mr-auto' : 'ml-auto'} flex flex-col items-end gap-1`}>
                            {!isScheduledAvailable && !isOutOfStock ? (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-2 py-0 h-6 text-[9px] flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {nextOpening ? t("storefront.availableAt", { time: format24to12String(nextOpening) }) : t("storefront.notAvailableNow")}
                                </Badge>
                            ) : (
                                <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-2 py-0 h-6 text-[10px] border-none">
                                    {t("menu.unavailable")}
                                </Badge>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* Discount Badge */}
            {product.is_available && isDiscounted && (
                <div className={`absolute top-3 ${dir === 'rtl' ? 'right-3' : 'left-3'} bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm z-20 pointer-events-none flex items-center gap-1`}>
                    {t("storefront.discount")} %{discountPercent}
                </div>
            )}

        </motion.div>
        <ProductCustomizationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            product={product}
        />
        </>
    );
});
