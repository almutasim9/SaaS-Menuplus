"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useCartTotals } from "@/lib/store/cartStore";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

export function FloatingCartButton({ slug }: { slug: string }) {
    const { t, dir } = useTranslation();
    const { itemCount, total } = useCartTotals(slug);

    return (
        <AnimatePresence>
            {itemCount > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-6 left-4 right-4 z-50 max-w-sm mx-auto"
                >
                    <Link href={`/menu/${slug}/checkout`}>
                        <motion.div
                            whileTap={{ scale: 0.98 }}
                            className="bg-[#ea580c] rounded-2xl p-4 shadow-2xl shadow-orange-500/40 flex items-center justify-between cursor-pointer"
                            style={{ backgroundColor: 'var(--primary)' }}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-white font-bold text-lg">{t("storefront.viewCart")}</span>
                                <div className="relative">
                                    <ShoppingCart className="w-6 h-6 text-white" />
                                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-orange-600 rounded-full text-xs font-bold flex items-center justify-center">
                                        {itemCount}
                                    </span>
                                </div>
                            </div>

                            <div className={`flex items-center gap-1 font-bold text-white ${dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`} dir="ltr">
                                <span>{total.toFixed(0)}</span>
                                <span className="text-sm">{t("storefront.currency")}</span>
                            </div>
                        </motion.div>
                    </Link>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
