import React from "react";
import { MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/context";

interface DeliveryFormProps {
    name: string;
    setName: (val: string) => void;
    phone: string;
    setPhone: (val: string) => void;
    areaName: string;
    setAreaName: (val: string) => void;
    landmark: string;
    setLandmark: (val: string) => void;
    address: string;
    setAddress: (val: string) => void;
    sortedAreas: string[];
    isOutOfZone: boolean;
    isMinOrderReached: boolean;
    minOrderAmount?: number;
    governorate?: string | null;
}

export const DeliveryForm: React.FC<DeliveryFormProps> = ({
    name,
    setName,
    phone,
    setPhone,
    areaName,
    setAreaName,
    landmark,
    setLandmark,
    address,
    setAddress,
    sortedAreas,
    isOutOfZone,
    isMinOrderReached,
    minOrderAmount,
    governorate,
}) => {
    const { t, dir } = useTranslation();

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">{t("storefront.checkout.fields.name")}</Label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("storefront.checkout.fields.namePlaceholder")}
                        required
                        className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:outline-none focus:border-primary/50 transition-colors"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">{t("storefront.checkout.fields.phone")}</Label>
                    <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t("storefront.checkout.fields.phonePlaceholder")}
                        type="tel"
                        required
                        className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:outline-none focus:border-primary/50 transition-colors"
                        dir="ltr"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">{t("storefront.checkout.fields.area")}</Label>
                <div className="relative">
                    <MapPin className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                    <select
                        required
                        value={areaName}
                        onChange={(e) => setAreaName(e.target.value)}
                        className={`w-full h-11 ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} rounded-xl bg-background border border-border focus:outline-none focus:border-primary/50 transition-colors appearance-none`}
                    >
                        <option value="" disabled>{t("storefront.checkout.fields.areaPlaceholder")}</option>
                        {sortedAreas.map((name) => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                </div>
                {isOutOfZone && (
                    <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 font-medium">
                        ⚠️ {dir === 'rtl' ? 'هذه المنطقة خارج نطاق التوصيل المباشر. سيتم الاتصال بك لتحديد سعر التوصيل.' : 'This area is outside direct delivery zones. We will contact you to determine the delivery fee.'}
                    </div>
                )}
                {!isMinOrderReached && (
                    <div className="mt-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-bold">
                        ⚠️ {dir === 'rtl' 
                            ? `أقل مقدار للطلب هو ${minOrderAmount} د.ع. يرجى إضافة المزيد من الأصناف.` 
                            : `Minimum order for this area is ${minOrderAmount} IQD. Please add more items.`}
                    </div>
                )}
                {governorate && (
                    <p className="text-[10px] text-muted-foreground">
                        {dir === 'rtl' ? `يتم التوصيل ضمن محافظة ${governorate} فقط` : `Delivery available within ${governorate} only`}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">{t("storefront.checkout.fields.landmark")}</Label>
                <input
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder={t("storefront.checkout.fields.landmarkPlaceholder")}
                    className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:outline-none focus:border-primary/50 transition-colors"
                />
            </div>

            <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">{t("storefront.checkout.fields.address")}</Label>
                <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t("storefront.checkout.fields.addressPlaceholder")}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none"
                />
            </div>
        </div>
    );
};
