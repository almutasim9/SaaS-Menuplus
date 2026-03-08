"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import { getCoupons, createCoupon, deleteCoupon } from "@/lib/actions/discounts";
import { Plus, Trash2, Tags, Percent, DollarSign, Dices, CalendarOff, Infinity } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";
import type { Coupon } from "@/lib/types/database.types";

export default function DiscountsPage() {
    const { t } = useTranslation();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [discountType, setDiscountType] = useState<string>("percentage");
    const [appliesTo, setAppliesTo] = useState<string>("cart");

    // Form states for UX improvements
    const [promoCode, setPromoCode] = useState("");
    const [discountValue, setDiscountValue] = useState("");
    const [isGlobal, setIsGlobal] = useState(false);
    const [hasMinOrder, setHasMinOrder] = useState(false);
    const [hasMaxUses, setHasMaxUses] = useState(false);
    const [hasExpiry, setHasExpiry] = useState(false);
    const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string>("");

    useEffect(() => {
        async function load() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("restaurant_id")
                .eq("id", user.id)
                .single();

            if (profile?.restaurant_id) {
                setRestaurantId(profile.restaurant_id);
                const data = await getCoupons(profile.restaurant_id);
                setCoupons(data);

                // Fetch products for the Specific Product picker
                const { data: prods } = await supabase
                    .from("products")
                    .select("id, name")
                    .eq("restaurant_id", profile.restaurant_id)
                    .order("name");
                if (prods) setProducts(prods);
            }
            setLoading(false);
        }
        load();
    }, []);

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!restaurantId) return;

        const form = e.currentTarget;
        const formData = new FormData(form);
        formData.set("restaurant_id", restaurantId);

        try {
            const created = await createCoupon(formData);
            setCoupons([created, ...coupons]);
            setDialogOpen(false);
            resetForm();
            toast.success("تم إنشاء الكوبون بنجاح");
        } catch {
            toast.error("Failed to create coupon. Code may already exist.");
        }
    };

    const generateRandomCode = () => {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const numbers = "0123456789";
        let code = "";
        for (let i = 0; i < 3; i++) {
            code += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        code += "-";
        for (let i = 0; i < 3; i++) {
            code += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }
        setPromoCode(code);
    };

    const resetForm = () => {
        setPromoCode("");
        setDiscountValue("");
        setDiscountType("percentage");
        setAppliesTo("cart");
        setSelectedProductId("");
        setIsGlobal(false);
        setHasMinOrder(false);
        setHasMaxUses(false);
        setHasExpiry(false);
    };

    const renderLivePreview = () => {
        if (!discountValue || isNaN(Number(discountValue))) return null;
        const val = Number(discountValue);
        const exampleOrder = 10000;

        let newTotal = exampleOrder;
        if (discountType === "percentage") {
            const reduction = exampleOrder * (val / 100);
            newTotal = Math.max(0, exampleOrder - reduction);
            return <p className="text-xs text-muted-foreground mt-1">مثال: طلب بـ 10,000 د.ع سيصبح <span className="font-bold text-emerald-600">{newTotal.toLocaleString()} د.ع</span></p>;
        } else if (discountType === "fixed") {
            newTotal = Math.max(0, exampleOrder - val);
            return <p className="text-xs text-muted-foreground mt-1">مثال: طلب بـ 10,000 د.ع سيصبح <span className="font-bold text-emerald-600">{newTotal.toLocaleString()} د.ع</span></p>;
        }
        return null;
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCoupon(id);
            setCoupons(coupons.filter((c) => c.id !== id));
            toast.success("Coupon deleted");
        } catch {
            toast.error("Failed to delete");
        }
    };

    const getStatusBadge = (coupon: Coupon) => {
        if (!coupon.is_active) return <Badge variant="secondary" className="rounded-lg">Inactive</Badge>;
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
            return <Badge variant="destructive" className="rounded-lg">Expired</Badge>;
        if (coupon.max_uses && coupon.used_count >= coupon.max_uses)
            return <Badge variant="secondary" className="rounded-lg">Used Up</Badge>;
        return <Badge className="gradient-emerald text-white rounded-lg border-0">Active</Badge>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{t("sidebar.discounts") || "Discount Engine"}</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {t("discounts.title") || "Create promo codes and manage discounts"}
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gradient-emerald text-white rounded-xl gap-2 hover:opacity-90">
                            <Plus className="w-4 h-4" />
                            {t("discounts.addCoupon") || "Create Coupon"}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-border/50 rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>New Coupon</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 mt-4">
                            {/* Promo Code Logic: Hidden if Global is checked */}
                            {!isGlobal && (
                                <div className="space-y-2">
                                    <Label>Promo Code</Label>
                                    <div className="relative">
                                        <Input
                                            name="code"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                            placeholder="e.g., WELCOME20"
                                            required={!isGlobal}
                                            className="rounded-xl bg-secondary/50 uppercase pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-primary"
                                            onClick={generateRandomCode}
                                            title="Generate Random Code"
                                        >
                                            <Dices className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Discount Type</Label>
                                    <Select name="discount_type" value={discountType} onValueChange={setDiscountType}>
                                        <SelectTrigger className="rounded-xl bg-secondary/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                                            <SelectItem value="fixed">مبلغ ثابت (د.ع)</SelectItem>
                                            <SelectItem value="free_delivery">توصيل مجاني</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Value</Label>
                                    <div className="relative">
                                        <Input
                                            name="discount_value"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required={discountType !== "free_delivery"}
                                            disabled={discountType === "free_delivery"}
                                            className="rounded-xl bg-secondary/50 disabled:opacity-50 pr-8 pl-3"
                                            value={discountType === "free_delivery" ? "0" : discountValue}
                                            onChange={(e) => setDiscountValue(e.target.value)}
                                        />
                                        {discountType !== "free_delivery" && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                                                {discountType === "percentage" ? "%" : "د.ع"}
                                            </div>
                                        )}
                                    </div>
                                    {renderLivePreview()}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>يطبق على</Label>
                                <Select name="applies_to" value={appliesTo} onValueChange={setAppliesTo}>
                                    <SelectTrigger className="rounded-xl bg-secondary/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cart">السلة بالكامل</SelectItem>
                                        <SelectItem value="product">منتج محدد</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {appliesTo === "product" && (
                                <div className="space-y-2">
                                    <Label>اختر المنتج</Label>
                                    <Select name="product_id" value={selectedProductId} onValueChange={setSelectedProductId}>
                                        <SelectTrigger className="rounded-xl bg-secondary/50">
                                            <SelectValue placeholder="اختر منتجاً..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {products.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Switch id="min_order_toggle" checked={hasMinOrder} onCheckedChange={setHasMinOrder} />
                                        <Label htmlFor="min_order_toggle">Min. Order</Label>
                                    </div>
                                    <Input
                                        name="min_order"
                                        type="number"
                                        step="0.01"
                                        placeholder="Min Amount"
                                        className="rounded-xl bg-secondary/50 disabled:opacity-30 disabled:cursor-not-allowed"
                                        disabled={!hasMinOrder}
                                        required={hasMinOrder}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Switch id="max_uses_toggle" checked={hasMaxUses} onCheckedChange={setHasMaxUses} />
                                        <Label htmlFor="max_uses_toggle">Limit Uses</Label>
                                    </div>
                                    <Input
                                        name="max_uses"
                                        type="number"
                                        placeholder="Max Uses"
                                        className="rounded-xl bg-secondary/50 disabled:opacity-30 disabled:cursor-not-allowed"
                                        disabled={!hasMaxUses}
                                        required={hasMaxUses}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Switch id="expiry_toggle" checked={hasExpiry} onCheckedChange={setHasExpiry} />
                                        <Label htmlFor="expiry_toggle">Set Expiry Date</Label>
                                    </div>
                                </div>
                                <Input
                                    name="expires_at"
                                    type="datetime-local"
                                    className="rounded-xl bg-secondary/50 disabled:opacity-30 disabled:cursor-not-allowed"
                                    disabled={!hasExpiry}
                                    required={hasExpiry}
                                />
                            </div>
                            <div className={`p-4 rounded-xl border-2 transition-colors ${isGlobal ? 'bg-amber-500/10 border-amber-500/20' : 'bg-secondary/30 border-border/50'}`}>
                                <div className="flex items-center gap-3">
                                    <Switch id="is_global_switch" name="is_global" value="true" checked={isGlobal} onCheckedChange={setIsGlobal} className="data-[state=checked]:bg-amber-500" />
                                    <div className="space-y-0.5">
                                        <Label htmlFor="is_global_switch" className={isGlobal ? 'text-amber-600 font-bold' : ''}>Global Discount</Label>
                                        <p className="text-xs text-muted-foreground">Applies automatically to all orders</p>
                                    </div>
                                </div>
                                {isGlobal && (
                                    <div className="mt-2 text-xs text-amber-600 font-medium">
                                        ⚠️ تحذير: هذا الخصم سيتم تطبيقه تلقائياً على سلة المشتريات لجميع الزبائن دون الحاجة لإدخال كود.
                                    </div>
                                )}
                            </div>
                            <Button type="submit" className="w-full gradient-emerald text-white rounded-xl">
                                Create Coupon
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {coupons.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                    <Tags className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No coupons yet</h3>
                    <p className="text-sm text-muted-foreground">
                        Create your first promo code to offer discounts
                    </p>
                </div>
            ) : (
                <div className="glass-card rounded-2xl overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border/30 hover:bg-transparent">
                                <TableHead>Code</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead>Applies To</TableHead>
                                <TableHead>Usage</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {coupons.map((coupon) => (
                                <TableRow key={coupon.id} className="border-border/20 hover:bg-secondary/30">
                                    <TableCell>
                                        <code className="px-2 py-1 rounded-lg bg-primary/10 text-primary font-mono text-sm">
                                            {coupon.code}
                                        </code>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            {coupon.discount_type === "percentage" && <Percent className="w-3.5 h-3.5 text-muted-foreground" />}
                                            {coupon.discount_type === "fixed" && <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />}
                                            {coupon.discount_type !== "free_delivery" ? coupon.discount_value : "Free Delivery"}
                                            {coupon.discount_type === "percentage" ? "%" : ""}
                                            {coupon.is_global && (
                                                <Badge variant="outline" className="ml-2 text-[10px] uppercase bg-secondary/50 tracking-wider">
                                                    Global
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="capitalize">{coupon.applies_to}</TableCell>
                                    <TableCell>
                                        {coupon.used_count}/{coupon.max_uses || "∞"}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(coupon)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.id)} className="rounded-lg hover:bg-destructive/10 hover:text-destructive">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
