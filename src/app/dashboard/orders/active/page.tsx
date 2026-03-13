"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateOrderStatus, getOrders } from "@/lib/actions/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ClipboardList,
    Clock,
    CheckCircle2,
    XCircle,
    ChefHat,
    Car,
    Store,
    Truck,
    Package,
    Phone,
    MapPin,
    User,
    RefreshCw,
    Undo2,
    Printer,
} from "lucide-react";
import { toast } from "sonner";
import { OrderReceipt } from "@/components/orders/OrderReceipt";
import { useTranslation } from "@/lib/i18n/context";

interface Order {
    id: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    items: Array<{ id: string; name: string; price: number; quantity: number }>;
    subtotal: number;
    discount_amount: number;
    delivery_fee: number;
    total: number;
    status: string;
    coupon_code: string | null;
    order_type: "dine_in" | "delivery" | "takeaway";
    table_number: string | null;
    number_of_people: number | null;
    area_name: string | null;
    nearest_landmark: string | null;
    car_details: string | null;
    created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType; cardColor: string }> = {
    pending: { label: "Pending Approval", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock, cardColor: "!border-amber-500/50 bg-amber-500/5 shadow-amber-500/10" },
    preparing: { label: "Preparing", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: ChefHat, cardColor: "!border-purple-500/50 bg-purple-500/5 shadow-purple-500/10" },
    completed: { label: "Completed", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2, cardColor: "!border-emerald-500/50 bg-emerald-500/5 shadow-emerald-500/10" },
    rejected: { label: "Rejected", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle, cardColor: "!border-red-500/50 bg-red-500/5 shadow-red-500/10" },
};

const typeConfig: Record<string, { label: string; icon: React.ElementType }> = {
    dine_in: { label: "Dine-in", icon: Store },
    delivery: { label: "Delivery", icon: Truck },
    takeaway: { label: "Takeaway", icon: Car },
};

export default function ActiveOrdersPage() {
    const { t } = useTranslation();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [restaurantName, setRestaurantName] = useState("MenuPlus");
    const [printOrder, setPrintOrder] = useState<Order | null>(null);

    const fetchOrders = useCallback(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from("profiles")
            .select("restaurant_id")
            .eq("id", user.id)
            .single();

        if (!profile?.restaurant_id) return;

        setRestaurantId(profile.restaurant_id);

        const { data: rest } = await supabase
            .from("restaurants")
            .select("name")
            .eq("id", profile.restaurant_id)
            .single();
        if (rest) setRestaurantName(rest.name);

        try {
            const data = await getOrders(profile.restaurant_id);
            setOrders((data as Order[]) || []);
        } catch (error) {
            console.error("Failed to fetch orders", error);
            toast.error("Failed to load orders");
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Set up Realtime Subscription
    useEffect(() => {
        if (!restaurantId) return;

        const supabase = createClient();
        const channel = supabase
            .channel(`public:orders:restaurant_id=eq.${restaurantId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders",
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                (payload) => {
                    console.log("Realtime order payload:", payload);
                    if (payload.eventType === "INSERT") {
                        setOrders((prev) => [payload.new as Order, ...prev]);
                        toast.success("New order received!");
                    } else if (payload.eventType === "UPDATE") {
                        setOrders((prev) =>
                            prev.map((order) =>
                                order.id === payload.new.id ? (payload.new as Order) : order
                            )
                        );
                    } else if (payload.eventType === "DELETE") {
                        setOrders((prev) => prev.filter((order) => order.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [restaurantId]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
        toast.success("Orders refreshed");
    };

    const handlePrint = (order: Order) => {
        setPrintOrder(order);
        setTimeout(() => {
            window.print();
            // Clear it after a short delay so the print dialog can capture it
            setTimeout(() => setPrintOrder(null), 500);
        }, 100);
    };

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            setOrders((prev) =>
                prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
            );
            toast.success(`Order updated to ${statusConfig[newStatus]?.label || newStatus}`);
        } catch (e: any) {
            toast.error(e.message || "Failed to update order status");
        }
    };

    const activeOrders = orders.filter((o) => {
        if (!["pending", "preparing"].includes(o.status)) return false;
        if (statusFilter !== "all" && o.status !== statusFilter) return false;
        return true;
    });

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="glass-card rounded-2xl p-5 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2 w-1/2">
                                <Skeleton className="h-6 w-3/4 rounded-lg bg-primary/10 dark:bg-primary/20" />
                                <Skeleton className="h-4 w-1/2 rounded-lg bg-secondary" />
                            </div>
                            <Skeleton className="h-6 w-16 rounded-lg bg-secondary" />
                        </div>
                        <Skeleton className="h-20 w-full rounded-xl bg-secondary" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full rounded-md bg-secondary/50" />
                            <Skeleton className="h-4 w-3/4 rounded-md bg-secondary/50" />
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-4">
                            <Skeleton className="h-10 w-full rounded-xl bg-secondary" />
                            <Skeleton className="h-10 w-full rounded-xl bg-primary/20" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Extracted out of inline component declaration to avoid remounts
    const renderOrderCard = (order: Order) => {
        const config = statusConfig[order.status] || statusConfig.pending;
        const StatusIcon = config.icon;

        return (
            <div key={order.id} className={`glass-card rounded-2xl p-5 space-y-4 border-2 transition-all duration-300 shadow-lg ${config.cardColor || ''}`}>
                {/* Header */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold">#{order.id.slice(0, 8)}</h3>
                                <Badge variant="outline" className={`${config.color} border text-xs`}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {config.label}
                                </Badge>
                                {order.order_type && typeConfig[order.order_type] && (
                                    <Badge variant="outline" className="bg-secondary text-foreground text-xs border-border/50">
                                        {(() => {
                                            const TypeIcon = typeConfig[order.order_type].icon;
                                            return <TypeIcon className="w-3 h-3 mr-1" />;
                                        })()}
                                        {typeConfig[order.order_type].label}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {formatTime(order.created_at)}
                            </p>
                        </div>
                        <span className="text-lg font-bold text-primary">{order.total.toFixed(0)} د.ع</span>
                    </div>

                    {/* Customer & Order Details */}
                    <div className="bg-secondary/20 rounded-xl p-3 space-y-2 text-sm text-muted-foreground">
                        {order.customer_name && (
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-foreground/50" />
                                <span className="font-medium text-foreground">{order.customer_name}</span>
                                {order.customer_phone && <span>({order.customer_phone})</span>}
                            </div>
                        )}

                        {order.order_type === "dine_in" && (
                            <div className="flex items-center gap-2 text-primary">
                                <Store className="w-4 h-4" />
                                <span>Table: <strong className="font-bold">{order.table_number || "N/A"}</strong></span>
                                {order.number_of_people && <span>• {order.number_of_people} People</span>}
                            </div>
                        )}

                        {order.order_type === "delivery" && (
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 mt-0.5" />
                                <div>
                                    <div className="text-foreground">{order.area_name || "Unknown Area"}</div>
                                    <div>{order.customer_address}</div>
                                    {order.nearest_landmark && <div className="text-xs mt-0.5 italic">Landmark: {order.nearest_landmark}</div>}
                                </div>
                            </div>
                        )}

                        {order.order_type === "takeaway" && order.car_details && (
                            <div className="flex items-center gap-2">
                                <Car className="w-4 h-4" />
                                <span>Car: {order.car_details}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Items */}
                <div className="bg-white/[0.02] rounded-xl p-3 space-y-2">
                    {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                            <span>
                                <span className="text-muted-foreground mr-2">{item.quantity}×</span>
                                {item.name}
                            </span>
                            <span className="font-medium">{(item.price * item.quantity).toFixed(0)} د.ع</span>
                        </div>
                    ))}
                    <div className="border-t border-white/5 pt-2 space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Subtotal</span>
                            <span>{order.subtotal.toFixed(0)} د.ع</span>
                        </div>
                        {order.discount_amount > 0 && (
                            <div className="flex justify-between text-xs text-emerald-400">
                                <span>Discount {order.coupon_code && `(${order.coupon_code})`}</span>
                                <span>-{order.discount_amount.toFixed(0)} د.ع</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Delivery</span>
                            <span>{order.delivery_fee.toFixed(0)} د.ع</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    {order.status === "preparing" && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleUpdateStatus(order.id, "pending")}
                            className="rounded-xl h-10 px-4 border-purple-500/30 text-purple-500 hover:bg-purple-500/10 shadow-sm"
                            title="Back to Pending"
                        >
                            <Undo2 className="w-4 h-4" />
                        </Button>
                    )}
                    {order.status === "pending" && (
                        <Button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, "preparing")}
                            className="flex-1 gradient-emerald text-white rounded-xl h-10 gap-2 font-medium shadow-md shadow-emerald-500/20"
                        >
                            <ChefHat className="w-4 h-4" />
                            Accept & Start Prep
                        </Button>
                    )}
                    {order.status === "preparing" && (
                        <Button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, "completed")}
                            className="flex-1 gradient-emerald text-white rounded-xl h-10 gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Mark as Completed
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleUpdateStatus(order.id, "rejected")}
                        className="rounded-xl h-10 px-4 border-destructive/30 text-destructive hover:bg-destructive/10"
                        title="Reject Order"
                    >
                        <XCircle className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handlePrint(order)}
                        className="rounded-xl h-10 px-4 border-muted-foreground/30 text-muted-foreground hover:bg-muted-foreground/10"
                        title="Print Receipt"
                    >
                        <Printer className="w-4 h-4 shrink-0" />
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{t("sidebar.orders")}</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {t("orders.subtitle") || "Manage incoming orders and view history"}
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="rounded-xl gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                    {t("common.refresh") || "Refresh"}
                </Button>
            </div>

            <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                <TabsList className="bg-secondary/40 p-1 rounded-xl glass-card border border-white/5 shadow-sm">
                    <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">{t("common.all") || "All Active"}</TabsTrigger>
                    <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all">{t("orders.pending") || "Pending"}</TabsTrigger>
                    <TabsTrigger value="preparing" className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white transition-all">{t("orders.preparing") || "Preparing"}</TabsTrigger>
                </TabsList>
            </Tabs>

            {activeOrders.length === 0 ? (
                <div className="text-center py-20 glass-card rounded-2xl">
                    <ClipboardList className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-1">{t("orders.noOrders") || "No active orders"}</h3>
                    <p className="text-muted-foreground text-sm">
                        {t("orders.noActiveOrdersSub") || "New orders needing approval or preparation will appear here"}
                    </p>
                </div>
            ) : (
                <div className="grid lg:grid-cols-2 gap-4">
                    {activeOrders.map(renderOrderCard)}
                </div>
            )}

            {/* Hidden thermal receipt for printing */}
            {printOrder && (
                <OrderReceipt order={printOrder} restaurantName={restaurantName} />
            )}
        </div>
    );
}
