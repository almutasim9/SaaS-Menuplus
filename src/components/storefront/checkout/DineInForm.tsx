import React from "react";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/context";

interface DineInFormProps {
    tableNumber: string;
    setTableNumber: (val: string) => void;
    numPeople: string;
    setNumPeople: (val: string) => void;
}

export const DineInForm: React.FC<DineInFormProps> = ({
    tableNumber,
    setTableNumber,
    numPeople,
    setNumPeople,
}) => {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">{t("storefront.checkout.fields.table")}</Label>
                <input
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder={t("storefront.checkout.fields.tablePlaceholder")}
                    required
                    className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:outline-none focus:border-primary/50 transition-colors"
                />
            </div>
            <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">{t("storefront.checkout.fields.people")}</Label>
                <input
                    value={numPeople}
                    onChange={(e) => setNumPeople(e.target.value)}
                    placeholder={t("storefront.checkout.fields.peoplePlaceholder")}
                    type="number"
                    className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:outline-none focus:border-primary/50 transition-colors"
                />
            </div>
        </div>
    );
};
