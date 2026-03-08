"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useParams } from "next/navigation";
import { ProductWithCustomization, ProductVariant, ProductAddon } from "@/lib/types/database.types";
import { useCartStore } from "@/lib/store/cartStore";
import { incrementProductView } from "@/lib/actions/products";
import { useTranslation } from "@/lib/i18n/context";

interface ProductCustomizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: ProductWithCustomization;
}

export function ProductCustomizationModal({ isOpen, onClose, product }: ProductCustomizationModalProps) {
    const { t, dir, locale } = useTranslation();
    const params = useParams();
    const slug = params.slug as string;
    const addItem = useCartStore((state) => state.addItem);

    const localizedProductName = locale === 'en' && product.name_en ? product.name_en : locale === 'ku' && product.name_ku ? product.name_ku : product.name;
    const localizedProductDesc = locale === 'en' && product.description_en ? product.description_en : locale === 'ku' && product.description_ku ? product.description_ku : product.description;

    // Sort variants and addons just in case
    const variants = [...(product.product_variants || [])].sort((a, b) => a.sort_order - b.sort_order);
    const addons = [...(product.product_addons || [])].sort((a, b) => a.sort_order - b.sort_order);

    const hasVariants = variants.length > 0;
    const hasAddons = addons.length > 0;

    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(hasVariants ? variants[0] : null);
    const [selectedAddons, setSelectedAddons] = useState<ProductAddon[]>([]);

    // Calculate total price based on selection
    const basePrice = selectedVariant ? Number(selectedVariant.price) : Number(product.price);
    const addonsPrice = selectedAddons.reduce((sum, item) => sum + Number(item.price), 0);
    const total = basePrice + addonsPrice;

    const handleToggleAddon = (addon: ProductAddon) => {
        if (selectedAddons.find(a => a.id === addon.id)) {
            setSelectedAddons(selectedAddons.filter(a => a.id !== addon.id));
        } else {
            setSelectedAddons([...selectedAddons, addon]);
        }
    };

    const handleAddToCart = () => {
        if (!slug) return;

        const vName = selectedVariant ? (locale === 'en' && selectedVariant.name_en ? selectedVariant.name_en : locale === 'ku' && selectedVariant.name_ku ? selectedVariant.name_ku : selectedVariant.name) : undefined;

        addItem(slug, {
            id: product.id,
            name: localizedProductName,
            price: total,
            image_url: product.image_url || undefined,
            variant: selectedVariant ? { name: vName as string, price: Number(selectedVariant.price) } : undefined,
            addons: selectedAddons.length > 0 ? selectedAddons.map(a => ({
                name: locale === 'en' && a.name_en ? a.name_en : locale === 'ku' && a.name_ku ? a.name_ku : a.name,
                price: Number(a.price)
            })) : undefined,
        });
        onClose();
        // Reset state for next open if needed
        setSelectedVariant(hasVariants ? variants[0] : null);
        setSelectedAddons([]);
    };

    // Intent Tracking
    useEffect(() => {
        if (isOpen && product.id) {
            incrementProductView(product.id);
        }
    }, [isOpen, product.id]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" dir={dir}>
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-lg bg-background border-t sm:border border-border/50 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="relative aspect-video bg-secondary/30 flex-shrink-0">
                        {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-secondary/50" />
                        )}
                        <button
                            onClick={onClose}
                            className={`absolute top-4 ${dir === 'rtl' ? 'left-4' : 'right-4'} w-8 h-8 bg-background/50 backdrop-blur border border-white/10 rounded-full flex items-center justify-center text-foreground hover:bg-background/80 transition-colors`}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-5 overflow-y-auto pb-24">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold">{localizedProductName}</h2>
                            {localizedProductDesc && (
                                <p className="text-sm text-muted-foreground mt-1">{localizedProductDesc}</p>
                            )}
                            {product.is_discount_active && product.compare_at_price && product.compare_at_price > product.price && (
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="text-sm line-through text-muted-foreground">{product.compare_at_price.toFixed(0)} {t("storefront.currency")}</span>
                                    <span className="text-sm font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">{t("storefront.saveDiscount")} {(product.compare_at_price - product.price).toFixed(0)} {t("storefront.currency")}</span>
                                </div>
                            )}
                        </div>

                        {/* Variants Selection (e.g. Size) */}
                        {hasVariants && (
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-base">{t("storefront.selectOption")}</h3>
                                    <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">{t("common.required")}</span>
                                </div>
                                <div className="space-y-2">
                                    {variants.map((v) => (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVariant(v)}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedVariant?.id === v.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50 bg-secondary/20 hover:bg-secondary/40'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedVariant?.id === v.id ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'}`}>
                                                    {selectedVariant?.id === v.id && <div className="w-2 h-2 rounded-full bg-current" />}
                                                </div>
                                                <span className="font-medium text-sm">
                                                    {locale === 'en' && v.name_en ? v.name_en : locale === 'ku' && v.name_ku ? v.name_ku : v.name}
                                                </span>
                                            </div>
                                            <span className="font-semibold text-sm rtl:mr-auto ltr:ml-auto">{Number(v.price).toFixed(0)} {t("storefront.currency")}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add-ons Selection */}
                        {hasAddons && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-base">{t("storefront.addExtras")}</h3>
                                    <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded uppercase">{t("common.optional")}</span>
                                </div>
                                <div className="space-y-2">
                                    {addons.map((a) => {
                                        const isSelected = selectedAddons.some(sa => sa.id === a.id);
                                        return (
                                            <button
                                                key={a.id}
                                                onClick={() => handleToggleAddon(a)}
                                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50 bg-secondary/20 hover:bg-secondary/40'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30 bg-background'}`}>
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-current" strokeWidth={3} />}
                                                    </div>
                                                    <span className="font-medium text-sm">
                                                        {locale === 'en' && a.name_en ? a.name_en : locale === 'ku' && a.name_ku ? a.name_ku : a.name}
                                                    </span>
                                                </div>
                                                <span className={`font-semibold text-sm text-muted-foreground ${dir === 'rtl' ? 'mr-auto' : 'ml-auto'}`}>
                                                    + {Number(a.price).toFixed(0)} {t("storefront.currency")}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer / Add to Order Button */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur border-t border-border/50">
                        <button
                            onClick={handleAddToCart}
                            className={`w-full h-12 sm:h-14 gradient-emerald text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-between px-6 ${dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            <span>{t("storefront.addToOrder")}</span>
                            <div className={`flex items-center gap-2 ${dir === 'rtl' ? 'text-left flex-row-reverse' : 'text-right'}`}>
                                {product.compare_at_price && product.compare_at_price > product.price && !hasVariants && selectedAddons.length === 0 && (
                                    <span className="text-xs line-through opacity-70">
                                        {product.compare_at_price.toFixed(0)} {t("storefront.currency")}
                                    </span>
                                )}
                                <span className="font-bold">{total.toFixed(0)} {t("storefront.currency")}</span>
                            </div>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
