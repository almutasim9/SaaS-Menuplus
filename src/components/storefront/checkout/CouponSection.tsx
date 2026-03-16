import React from "react";
import { Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";

interface CouponSectionProps {
    couponCode: string;
    setCouponCode: (code: string) => void;
    showCouponInput: boolean;
    setShowCouponInput: (show: boolean) => void;
    handleApplyCoupon: () => void;
    setValidatedCoupon: (valid: boolean) => void;
    setDiscount: (discount: number) => void;
}

export const CouponSection: React.FC<CouponSectionProps> = ({
    couponCode,
    setCouponCode,
    showCouponInput,
    setShowCouponInput,
    handleApplyCoupon,
    setValidatedCoupon,
    setDiscount,
}) => {
    const { t, dir } = useTranslation();

    return (
        <div className="glass-card p-4 rounded-2xl border border-border/40 shadow-sm">
            <button
                type="button"
                onClick={() => setShowCouponInput(!showCouponInput)}
                className="flex items-center justify-between w-full text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
                <span className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    {showCouponInput ? t("storefront.checkout.coupon.hide") : t("storefront.checkout.coupon.show")}
                </span>
                <motion.div animate={{ rotate: showCouponInput ? 180 : 0 }} className="text-muted-foreground">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                </motion.div>
            </button>

            <AnimatePresence>
                {showCouponInput && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        className="overflow-hidden flex gap-2"
                    >
                        <div className="flex-1 relative">
                            <Tag className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                            <input
                                value={couponCode}
                                onChange={(e) => { 
                                    setCouponCode(e.target.value); 
                                    setValidatedCoupon(false); 
                                    setDiscount(0); 
                                }}
                                placeholder={t("storefront.checkout.coupon.placeholder")}
                                className={`w-full h-12 ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-primary/50 shadow-sm`}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleApplyCoupon}
                            className="px-6 h-12 rounded-xl bg-secondary text-foreground text-sm font-semibold hover:bg-secondary/80 transition-colors border border-border/50 shadow-sm"
                        >
                            {t("storefront.checkout.coupon.apply")}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
