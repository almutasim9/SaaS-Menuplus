import React from "react";
import { Check } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

interface OrderSummaryProps {
    subtotal: number;
    discount: number;
    effectiveDeliveryFee: number;
    grandTotal: number;
    orderType: string;
    isOutOfZone: boolean;
    isFreeDelivery: boolean;
    isFreeDeliveryCoupon: boolean;
    isAreaInZone: boolean;
    estimatedDeliveryTime?: string | null;
    validatedCoupon: boolean;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
    subtotal,
    discount,
    effectiveDeliveryFee,
    grandTotal,
    orderType,
    isOutOfZone,
    isFreeDelivery,
    isFreeDeliveryCoupon,
    isAreaInZone,
    estimatedDeliveryTime,
    validatedCoupon,
}) => {
    const { t, dir } = useTranslation();

    return (
        <div className="glass-card rounded-2xl p-6 space-y-4 border border-border/40 shadow-sm">
            <h3 className="font-semibold text-lg pb-2 border-b border-border/50">{t("storefront.checkout.sectionTitles.summary")}</h3>
            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("storefront.checkout.summary.subtotal")}</span>
                    <span dir="ltr">{subtotal.toFixed(0)} {t("storefront.currency")}</span>
                </div>
                {discount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-500 font-medium">
                        <span>{t("storefront.checkout.summary.discount")} {validatedCoupon && <Check className="inline w-3 h-3 ml-1" />}</span>
                        <span dir="ltr">-{discount.toFixed(0)} {t("storefront.currency")}</span>
                    </div>
                )}
                {orderType === "delivery" && (
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t("storefront.checkout.summary.deliveryFee")}</span>
                            {isOutOfZone ? (
                                <span className="text-amber-600 font-medium">{dir === 'rtl' ? 'سيتم الاتصال بك' : 'Contact for price'}</span>
                            ) : (isFreeDelivery || isFreeDeliveryCoupon) && isAreaInZone ? (
                                <span className="text-emerald-500 font-bold">{t("storefront.checkout.summary.free")}</span>
                            ) : (
                                <span dir="ltr">{effectiveDeliveryFee.toFixed(0)} {t("storefront.currency")}</span>
                            )}
                        </div>
                        {estimatedDeliveryTime && !isOutOfZone && (
                            <div className="flex justify-between text-[10px] text-muted-foreground italic">
                                <span>{dir === 'rtl' ? 'وقت التوصيل المتوقع:' : 'Estimated Delivery:'}</span>
                                <span>{estimatedDeliveryTime}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="border-t border-border/50 pt-4 flex justify-between font-bold text-xl">
                <span>{t("storefront.checkout.summary.total")}</span>
                <span className="text-primary" dir="ltr">{grandTotal.toFixed(0)} {t("storefront.currency")}</span>
            </div>
        </div>
    );
};
