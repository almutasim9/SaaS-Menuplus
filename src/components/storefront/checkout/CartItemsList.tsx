import React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { Label } from "@/components/ui/label";

interface CartItemsListProps {
    items: any[];
    updateQuantity: (id: string, qty: number) => void;
    removeItem: (id: string) => void;
}

export const CartItemsList: React.FC<CartItemsListProps> = ({ items, updateQuantity, removeItem }) => {
    const { t } = useTranslation();

    return (
        <div className="glass-card p-5 rounded-2xl space-y-4 border border-border/40">
            <Label className="text-base font-semibold block">{t("storefront.checkout.sectionTitles.orderItems")}</Label>
            <div className="space-y-3">
                {items.map((item) => (
                    <div
                        key={item.cart_item_id || item.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30"
                    >
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{item.name}</h3>
                            {item.variant && (
                                <p className="text-xs text-muted-foreground mt-0.5">{item.variant.name}</p>
                            )}
                            {item.addons && item.addons.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                    + {item.addons.map((a: any) => a.name).join(", ")}
                                </p>
                            )}
                            <p className="text-sm text-primary font-semibold mt-0.5" dir="ltr">
                                {(item.price * item.quantity).toFixed(0)} {t("storefront.currency")}
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-background border border-border/50 rounded-lg p-1">
                            <button 
                                type="button" 
                                onClick={() => updateQuantity(item.cart_item_id || item.id, item.quantity - 1)} 
                                className="w-7 h-7 rounded hover:bg-secondary flex items-center justify-center transition-colors"
                            >
                                <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                            <button 
                                type="button" 
                                onClick={() => updateQuantity(item.cart_item_id || item.id, item.quantity + 1)} 
                                className="w-7 h-7 rounded hover:bg-secondary flex items-center justify-center transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => removeItem(item.cart_item_id || item.id)}
                            className="w-9 h-9 rounded-lg hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors ml-1"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
