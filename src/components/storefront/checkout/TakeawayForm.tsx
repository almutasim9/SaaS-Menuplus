import React from "react";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/context";

interface TakeawayFormProps {
    name: string;
    setName: (val: string) => void;
    phone: string;
    setPhone: (val: string) => void;
    carDetails: string;
    setCarDetails: (val: string) => void;
}

export const TakeawayForm: React.FC<TakeawayFormProps> = ({
    name,
    setName,
    phone,
    setPhone,
    carDetails,
    setCarDetails,
}) => {
    const { t } = useTranslation();

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
                <Label className="text-muted-foreground text-xs">{t("storefront.checkout.fields.car")}</Label>
                <input
                    value={carDetails}
                    onChange={(e) => setCarDetails(e.target.value)}
                    placeholder={t("storefront.checkout.fields.carPlaceholder")}
                    required
                    className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:outline-none focus:border-primary/50 transition-colors"
                />
            </div>
        </div>
    );
};
