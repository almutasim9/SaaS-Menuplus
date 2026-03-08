"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore, useCartItems, useCartTotals } from "@/lib/store/cartStore";
import { createOrder } from "@/lib/actions/orders";
import { validateCoupon } from "@/lib/actions/discounts";
import { getDeliveryZones } from "@/lib/actions/delivery";
import { ArrowLeft, Minus, Plus, Trash2, Tag, Check, ShoppingBag, Store, Truck, Car, MapPin } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/context";

export default function CheckoutPage() {
    const { t, dir } = useTranslation();
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const items = useCartItems(slug);
    const { total, itemCount } = useCartTotals(slug);

    const updateQuantity = (id: string, qty: number) => useCartStore.getState().updateQuantity(slug, id, qty);
    const removeItem = (id: string) => useCartStore.getState().removeItem(slug, id);
    const clearCart = () => useCartStore.getState().clearCart(slug);

    const [orderType, setOrderType] = useState<"dine_in" | "delivery" | "takeaway">("dine_in");

    // Shared
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    // Dine-in
    const [tableNumber, setTableNumber] = useState("");
    const [numPeople, setNumPeople] = useState("");

    // Delivery
    const [address, setAddress] = useState("");
    const [areaName, setAreaName] = useState("");
    const [landmark, setLandmark] = useState("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [zones, setZones] = useState<any[]>([]);

    // Takeaway
    const [carDetails, setCarDetails] = useState("");

    const [couponCode, setCouponCode] = useState("");
    const [discount, setDiscount] = useState(0);
    const [validatedCoupon, setValidatedCoupon] = useState(false);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderSettings, setOrderSettings] = useState<{
        is_dine_in_enabled: boolean;
        is_takeaway_enabled: boolean;
        is_delivery_enabled: boolean;
        is_whatsapp_ordering_enabled: boolean;
        whatsapp_number: string | null;
    } | null>(null);
    const [isFreeDelivery, setIsFreeDelivery] = useState(false);
    const [showCouponInput, setShowCouponInput] = useState(false);

    // Persistence Effect - Load
    useEffect(() => {
        const savedName = localStorage.getItem('checkout_name');
        const savedPhone = localStorage.getItem('checkout_phone');
        const savedAddress = localStorage.getItem('checkout_address');
        const savedCar = localStorage.getItem('checkout_car');
        const savedArea = localStorage.getItem('checkout_area');
        if (savedName) setName(savedName);
        if (savedPhone) setPhone(savedPhone);
        if (savedAddress) setAddress(savedAddress);
        if (savedCar) setCarDetails(savedCar);
        if (savedArea) setAreaName(savedArea);
    }, []);

    // Persistence Effect - Save
    useEffect(() => {
        localStorage.setItem('checkout_name', name);
        localStorage.setItem('checkout_phone', phone);
        localStorage.setItem('checkout_address', address);
        localStorage.setItem('checkout_car', carDetails);
        localStorage.setItem('checkout_area', areaName);
    }, [name, phone, address, carDetails, areaName]);

    useEffect(() => {
        async function fetchRestaurant() {
            const res = await fetch(`/api/restaurant/${slug}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setRestaurantId(data.id);
                setOrderSettings({
                    is_dine_in_enabled: data.is_dine_in_enabled ?? true,
                    is_takeaway_enabled: data.is_takeaway_enabled ?? true,
                    is_delivery_enabled: data.is_delivery_enabled ?? true,
                    is_whatsapp_ordering_enabled: data.is_whatsapp_ordering_enabled ?? false,
                    whatsapp_number: data.whatsapp_number ?? null,
                });
                setIsFreeDelivery(data.is_free_delivery ?? false);

                // Auto-select valid initial order type if default is disabled
                if (!(data.is_dine_in_enabled ?? true)) {
                    if (data.is_takeaway_enabled ?? true) setOrderType("takeaway");
                    else if (data.is_delivery_enabled ?? true) setOrderType("delivery");
                }

                try {
                    const zonesData = await getDeliveryZones(data.id);
                    setZones(zonesData || []);
                } catch (e) {
                    console.error("Failed to fetch zones");
                }
            }
        }
        fetchRestaurant();
    }, [slug]);

    const [deliveryFee, setDeliveryFee] = useState(0);
    useEffect(() => {
        if (orderType === "delivery" && areaName) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const zone = zones.find(z => z.delivery_areas?.some((a: any) => a.area_name === areaName));
            if (zone) {
                if (zone.free_delivery_threshold && total >= zone.free_delivery_threshold) {
                    setDeliveryFee(0);
                } else {
                    setDeliveryFee(Number(zone.flat_rate) || 0);
                }
            } else {
                setDeliveryFee(0);
            }
        } else {
            setDeliveryFee(0);
        }
    }, [areaName, orderType, zones, total, isFreeDelivery]);
    // Override: if restaurant has global free delivery, always zero it
    const effectiveDeliveryFee = isFreeDelivery ? 0 : deliveryFee;

    const subtotal = total;
    const grandTotal = subtotal - discount + effectiveDeliveryFee;

    const handleApplyCoupon = async () => {
        if (!restaurantId || !couponCode.trim()) return;

        const result = await validateCoupon(restaurantId, couponCode, subtotal);
        if (result.valid && result.discount) {
            setDiscount(result.discount);
            setValidatedCoupon(true);
            toast.success(t("storefront.checkout.coupon.success", { discount: result.discount.toFixed(0) + " " + t("storefront.currency") }));
        } else {
            toast.error(result.message || t("storefront.checkout.coupon.invalid"));
            setDiscount(0);
            setValidatedCoupon(false);
        }
    };

    // Auto re-validate coupon if subtotal changes (e.g., items removed)
    useEffect(() => {
        if (validatedCoupon && couponCode) {
            handleApplyCoupon();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subtotal, items]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurantId || items.length === 0) return;

        if (orderType === "dine_in" && !tableNumber) {
            toast.error(t("storefront.checkout.errors.dineInTable"));
            return;
        }

        if (orderType === "delivery" && (!name || !phone || !areaName)) {
            toast.error(t("storefront.checkout.errors.deliveryDetails"));
            return;
        }

        if (orderType === "takeaway" && (!name || !phone || !carDetails)) {
            toast.error(t("storefront.checkout.errors.takeawayDetails"));
            return;
        }

        setLoading(true);
        try {
            await createOrder({
                restaurant_id: restaurantId,
                customer_name: name || "Guest",
                customer_phone: phone || "N/A",
                customer_address: address || "N/A",
                items,
                subtotal,
                discount_amount: discount,
                delivery_fee: effectiveDeliveryFee,
                total: grandTotal,
                coupon_code: validatedCoupon ? couponCode : null,
                order_type: orderType,
                table_number: orderType === "dine_in" ? tableNumber : null,
                number_of_people: orderType === "dine_in" && numPeople ? parseInt(numPeople) : null,
                area_name: orderType === "delivery" ? areaName : null,
                nearest_landmark: orderType === "delivery" ? landmark : null,
                car_details: orderType === "takeaway" ? carDetails : null,
                status: "pending",
            });

            setOrderPlaced(true);
            clearCart();
        } catch {
            toast.error(t("storefront.checkout.errors.general"));
        }
        setLoading(false);
    };

    const handleWhatsAppSubmit = async () => {
        if (!restaurantId || items.length === 0 || !orderSettings?.whatsapp_number) return;

        if (orderType === "dine_in" && !tableNumber) {
            toast.error(t("storefront.checkout.errors.dineInTable"));
            return;
        }

        if (orderType === "delivery" && (!name || !phone || !areaName)) {
            toast.error(t("storefront.checkout.errors.deliveryDetails"));
            return;
        }

        if (orderType === "takeaway" && (!name || !phone || !carDetails)) {
            toast.error(t("storefront.checkout.errors.takeawayDetails"));
            return;
        }

        setLoading(true);

        try {
            // Optimistically save the order first
            await createOrder({
                restaurant_id: restaurantId,
                customer_name: name || "Guest",
                customer_phone: phone || "N/A",
                customer_address: address || "N/A",
                items,
                subtotal,
                discount_amount: discount,
                delivery_fee: effectiveDeliveryFee,
                total: grandTotal,
                coupon_code: validatedCoupon ? couponCode : null,
                order_type: orderType,
                table_number: orderType === "dine_in" ? tableNumber : null,
                number_of_people: orderType === "dine_in" && numPeople ? parseInt(numPeople) : null,
                area_name: orderType === "delivery" ? areaName : null,
                nearest_landmark: orderType === "delivery" ? landmark : null,
                car_details: orderType === "takeaway" ? carDetails : null,
                status: "pending", // Could add 'pending_whatsapp' later if needed
            });

            // Build WhatsApp Message
            let message = `*New Order - ${orderType.toUpperCase()}*\n`;
            message += `------------------------\n`;
            message += `*Customer:* ${name || "Guest"}\n`;
            message += `*Phone:* ${phone || "N/A"}\n`;

            if (orderType === 'dine_in') {
                message += `*Table Number:* ${tableNumber}\n`;
                if (numPeople) message += `*Number of People:* ${numPeople}\n`;
            } else if (orderType === 'delivery') {
                message += `*Delivery Area:* ${areaName}\n`;
                if (landmark) message += `*Landmark:* ${landmark}\n`;
                if (address) message += `*Address:* ${address}\n`;
            } else if (orderType === 'takeaway') {
                message += `*Car Details:* ${carDetails}\n`;
            }

            message += `------------------------\n*Items:*\n`;
            items.forEach(item => {
                message += `- ${item.quantity}x ${item.name}`;
                if (item.variant) message += ` (${item.variant.name})`;
                if (item.addons && item.addons.length > 0) message += ` + ${item.addons.map(a => a.name).join(", ")}`;
                message += ` [${(item.quantity * item.price).toFixed(0)} د.ع]\n`;
            });

            message += `------------------------\n`;
            message += `*Subtotal:* ${subtotal.toFixed(0)} د.ع\n`;
            if (discount > 0) message += `*Discount:* -${discount.toFixed(0)} د.ع\n`;
            if (orderType === 'delivery') message += `*Delivery Fee:* ${effectiveDeliveryFee.toFixed(0)} د.ع\n`;
            message += `*TOTAL:* ${grandTotal.toFixed(0)} د.ع\n`;

            // Redirect to WhatsApp
            const cleanNumber = orderSettings.whatsapp_number.replace(/[^0-9]/g, '');
            const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

            clearCart();
            window.location.href = url; // Hard redirect instead of setOrderPlaced, or open in new tab

        } catch {
            toast.error(t("storefront.checkout.errors.general"));
            setLoading(false);
        }
    };

    if (orderPlaced) {
        return (
            <div className="max-w-lg mx-auto px-5 py-20 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="w-20 h-20 gradient-emerald rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <Check className="w-10 h-10 text-white" />
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold mb-2"
                >
                    {t("storefront.checkout.orderPlaced")}
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-muted-foreground mb-8"
                >
                    {t("storefront.checkout.orderReceived")}
                </motion.p>
                <Link
                    href={`/menu/${slug}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-emerald text-white font-medium hover:opacity-90 transition-opacity"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t("storefront.backToMenu")}
                </Link>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="max-w-lg mx-auto px-5 py-20 text-center">
                <ShoppingBag className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">{t("storefront.checkout.cartEmpty")}</h2>
                <p className="text-muted-foreground mb-6">{t("storefront.checkout.addItems")}</p>
                <Link
                    href={`/menu/${slug}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-emerald text-white font-medium hover:opacity-90 transition-opacity"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t("storefront.checkout.browseMenu")}
                </Link>
            </div>
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allAreas = zones.filter(z => z.is_active).flatMap(z => z.delivery_areas || []);
    const seen = new Set<string>();
    const activeAreas = allAreas.filter(a => {
        if (seen.has(a.area_name)) return false;
        seen.add(a.area_name);
        return true;
    });

    return (
        <div className="max-w-lg mx-auto pb-8" dir={dir}>
            {/* Header */}
            <div className={`sticky top-0 z-40 glass-strong px-5 py-4 flex items-center gap-4 border-b border-border/40 ${dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`} dir="ltr">
                <Link
                    href={`/menu/${slug}`}
                    className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 flex-shrink-0" />
                </Link>
                <h1 className="text-lg font-semibold">{t("storefront.checkout.title")}</h1>
                <span className={`text-sm font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full ${dir === 'rtl' ? 'mr-auto' : 'ml-auto'}`}>
                    {t("storefront.checkout.itemsCount", { count: itemCount })}
                </span>
            </div>

            <div className={`px-5 space-y-8 mt-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                {/* Order Type Selection */}
                <div className="space-y-3">
                    <Label className="text-base font-semibold">{t("storefront.checkout.chooseOrderType")}</Label>
                    {!orderSettings ? (
                        <div className="flex gap-3">
                            <div className="flex-1 h-28 rounded-2xl bg-secondary/50 animate-pulse border-2 border-border/50" />
                            <div className="flex-1 h-28 rounded-2xl bg-secondary/50 animate-pulse border-2 border-border/50" />
                            <div className="flex-1 h-28 rounded-2xl bg-secondary/50 animate-pulse border-2 border-border/50" />
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            {(
                                [
                                    { id: "dine_in", label: t("storefront.checkout.orderTypes.dine_in"), icon: Store },
                                    { id: "takeaway", label: t("storefront.checkout.orderTypes.takeaway"), icon: Car },
                                    { id: "delivery", label: t("storefront.checkout.orderTypes.delivery"), icon: Truck },
                                ] as const
                            ).filter(type => {
                                if (type.id === "dine_in") return orderSettings.is_dine_in_enabled;
                                if (type.id === "takeaway") return orderSettings.is_takeaway_enabled;
                                if (type.id === "delivery") return orderSettings.is_delivery_enabled;
                                return true;
                            }).map((type) => {
                                const Icon = type.icon;
                                const isActive = orderType === type.id;
                                return (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setOrderType(type.id)}
                                        className={`flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 transition-all ${isActive
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-border/50 bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:border-border"
                                            }`}
                                    >
                                        <Icon className="w-6 h-6 mb-2" />
                                        <span className="font-medium text-sm">{type.label}</span>
                                        {isActive && (
                                            <motion.div layoutId="orderTypeIndicator" className="w-1.5 h-1.5 rounded-full bg-primary mt-2 absolute bottom-2" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Delivery Details Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="glass-card p-5 rounded-2xl space-y-4 shadow-sm border border-border/40">
                        <Label className="text-base font-semibold mb-1 block">
                            {orderType === "dine_in" ? t("storefront.checkout.sectionTitles.tableDetails") : orderType === "takeaway" ? t("storefront.checkout.sectionTitles.pickupDetails") : t("storefront.checkout.sectionTitles.deliveryDetails")}
                        </Label>

                        <AnimatePresence mode="wait">
                            {/* DINE IN FIELDS */}
                            {orderType === "dine_in" && (
                                <motion.div
                                    key="dine_in_fields"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="grid grid-cols-2 gap-4"
                                >
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground text-xs">{t("storefront.checkout.fields.tableNumber")}</Label>
                                        <input
                                            value={tableNumber}
                                            onChange={(e) => setTableNumber(e.target.value)}
                                            placeholder={t("storefront.checkout.fields.tableNumberPlaceholder")}
                                            required
                                            className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground text-xs">{t("storefront.checkout.fields.numPeople")}</Label>
                                        <input
                                            value={numPeople}
                                            type="number"
                                            min="1"
                                            onChange={(e) => setNumPeople(e.target.value)}
                                            placeholder={t("storefront.checkout.fields.numPeoplePlaceholder")}
                                            className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label className="text-muted-foreground text-xs">{t("storefront.checkout.fields.nameOptional")}</Label>
                                        <input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder={t("storefront.checkout.fields.namePlaceholder")}
                                            className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* TAKEAWAY FIELDS */}
                            {orderType === "takeaway" && (
                                <motion.div
                                    key="takeaway_fields"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-2 gap-4">
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
                                        <Label className="text-muted-foreground text-xs">{t("storefront.checkout.fields.carDetails")}</Label>
                                        <input
                                            value={carDetails}
                                            onChange={(e) => setCarDetails(e.target.value)}
                                            placeholder={t("storefront.checkout.fields.carDetailsPlaceholder")}
                                            required
                                            className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* DELIVERY FIELDS */}
                            {orderType === "delivery" && (
                                <motion.div
                                    key="delivery_fields"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-2 gap-4">
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
                                                {activeAreas.map((area: any) => (
                                                    <option key={area.id} value={area.area_name}>{area.area_name}</option>
                                                ))}
                                            </select>
                                        </div>
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
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Cart Items */}
                    <div className="glass-card p-5 rounded-2xl space-y-4 border border-border/40">
                        <Label className="text-base font-semibold block">{t("storefront.checkout.sectionTitles.orderItems")}</Label>
                        <div className="space-y-3">
                            {items.map((item, index) => (
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
                                                + {item.addons.map(a => a.name).join(", ")}
                                            </p>
                                        )}
                                        <p className="text-sm text-primary font-semibold mt-0.5" dir="ltr">
                                            {(item.price * item.quantity).toFixed(0)} {t("storefront.currency")}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-background border border-border/50 rounded-lg p-1">
                                        <button type="button" onClick={() => updateQuantity(item.cart_item_id || item.id, item.quantity - 1)} className="w-7 h-7 rounded hover:bg-secondary flex items-center justify-center transition-colors">
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                                        <button type="button" onClick={() => updateQuantity(item.cart_item_id || item.id, item.quantity + 1)} className="w-7 h-7 rounded hover:bg-secondary flex items-center justify-center transition-colors">
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

                    {/* Coupon Accordion */}
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
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
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
                                            onChange={(e) => { setCouponCode(e.target.value); setValidatedCoupon(false); setDiscount(0); }}
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

                    {/* Order Summary */}
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
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t("storefront.checkout.summary.deliveryFee")}</span>
                                    {isFreeDelivery ? (
                                        <span className="text-emerald-500 font-bold">{t("storefront.checkout.summary.free")}</span>
                                    ) : (
                                        <span dir="ltr">{effectiveDeliveryFee.toFixed(0)} {t("storefront.currency")}</span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="border-t border-border/50 pt-4 flex justify-between font-bold text-xl">
                            <span>{t("storefront.checkout.summary.total")}</span>
                            <span className="text-primary" dir="ltr">{grandTotal.toFixed(0)} {t("storefront.currency")}</span>
                        </div>
                    </div>

                    {/* Submit Options */}
                    <div className="space-y-3">
                        {(() => {
                            const isFormValid = () => {
                                if (orderType === "dine_in") return !!tableNumber;
                                if (orderType === "takeaway") return !!name && !!phone && !!carDetails;
                                if (orderType === "delivery") return !!name && !!phone && !!areaName;
                                return false;
                            };
                            const isDisabled = loading || !isFormValid();

                            return orderSettings?.is_whatsapp_ordering_enabled && orderSettings?.whatsapp_number ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={handleWhatsAppSubmit}
                                        disabled={isDisabled}
                                        className="w-full h-14 rounded-2xl bg-[#25D366] text-white text-base font-bold shadow-lg shadow-[#25D366]/25 disabled:opacity-50 transition-all hover:shadow-[#25D366]/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.174.087.289.129.332.202.043.073.043.423-.101.828z" /></svg>
                                                {t("storefront.checkout.submit.whatsapp")}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isDisabled}
                                        className="w-full h-14 rounded-2xl bg-secondary text-foreground text-base font-bold shadow-md disabled:opacity-50 transition-all hover:-translate-y-0.5 active:translate-y-0 border border-border/50 flex items-center justify-center gap-2"
                                        dir="ltr"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-muted-foreground/40 border-t-muted-foreground rounded-full animate-spin mx-auto" />
                                        ) : (
                                            t("storefront.checkout.submit.direct", { total: `${grandTotal.toFixed(0)} ${t("storefront.currency")}` })
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isDisabled}
                                    className="w-full h-14 rounded-2xl gradient-emerald text-white text-base font-bold shadow-lg shadow-emerald-500/25 disabled:opacity-50 transition-all hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                                    dir="ltr"
                                >
                                    {loading ? (
                                        <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin mx-auto" />
                                    ) : (
                                        t("storefront.checkout.submit.regular", { total: `${grandTotal.toFixed(0)} ${t("storefront.currency")}` })
                                    )}
                                </button>
                            );
                        })()}
                    </div>
                </form>
            </div>
        </div>
    );
}
