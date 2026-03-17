"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

interface ActiveOrderBannerProps {
    slug: string;
}

export function ActiveOrderBanner({ slug }: ActiveOrderBannerProps) {
    const { t, dir } = useTranslation();
    const [orderId, setOrderId] = useState<string | null>(null);

    useEffect(() => {
        const id = localStorage.getItem(`active_order_${slug}`);
        setOrderId(id);
    }, [slug]);

    if (!orderId) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-5 mb-4"
            >
                <Link 
                    href={`/menu/${slug}/order/${orderId}`}
                    className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg shadow-primary/20 group active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">{t("storefront.activeOrder")}</p>
                            <p className="text-[10px] opacity-80 uppercase tracking-wider">{t("storefront.trackOrder")}</p>
                        </div>
                    </div>
                    <ArrowRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                </Link>
            </motion.div>
        </AnimatePresence>
    );
}
