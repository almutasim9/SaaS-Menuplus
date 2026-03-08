"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateOrderStatus } from "@/lib/actions/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Clock,
    CheckCircle2,
    XCircle,
    ChefHat,
    Car,
    Store,
    Truck,
    Package,
    RefreshCw,
    History,
    Search,
    Filter,
    User,
    MapPin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

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

export default function OrderHistoryPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");

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

        const { data } = await supabase
            .from("orders")
            .select("*")
            .eq("restaurant_id", profile.restaurant_id)
            .order("created_at", { ascending: false });

        setOrders((data as Order[]) || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
        toast.success("Orders refreshed");
    };

    const historyOrders = orders.filter((o) => {
        // Only completed or rejected
        if (!["completed", "rejected"].includes(o.status)) return false;

        // Status filter
        if (statusFilter !== "all" && o.status !== statusFilter) return false;

        // Type filter
        if (typeFilter !== "all" && o.order_type !== typeFilter) return false;

        // Search filter (ID or Phone)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesId = o.id.toLowerCase().includes(query);
            const matchesPhone = o.customer_phone?.toLowerCase().includes(query) || false;
            if (!matchesId && !matchesPhone) return false;
        }

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
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const OrderRow = ({ order }: { order: Order }) => {
        const config = statusConfig[order.status] || statusConfig.pending;
        const StatusIcon = config.icon;

        return (
            <div className={`glass-card border rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center opacity-80 hover:opacity-100 transition-opacity shadow-sm ${config.cardColor || ''}`}>
                {/* Header / Left Side */}
                <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">#{order.id.slice(0, 8)}</h3>
                        <Badge variant="outline" className={`${config.color} border text-[10px] h-5 px-1.5`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                        </Badge>
                        {order.order_type && typeConfig[order.order_type] && (
                            <Badge variant="outline" className="bg-secondary text-foreground text-[10px] h-5 px-1.5 border-border/50">
                                {(() => {
                                    const TypeIcon = typeConfig[order.order_type].icon;
                                    return <TypeIcon className="w-3 h-3 mr-1" />;
                                })()}
                                {typeConfig[order.order_type].label}
                            </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto md:ml-2">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {formatTime(order.created_at)}
                        </span>
                    </div>

                    {/* Customer & Order Details */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {order.customer_name && (
                            <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                <span>{order.customer_name}</span>
                                {order.customer_phone && <span className="opacity-70">({order.customer_phone})</span>}
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
                            <div className="flex items-center gap-1.5">
                                <Car className="w-3.5 h-3.5" />
                                <span>{order.car_details}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side / Items & Total */}
                <div className="w-full md:w-64 flex flex-col gap-2 bg-secondary/10 rounded-lg p-3">
                    <div className="max-h-20 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-xs text-muted-foreground">
                                <span className="truncate pr-2">
                                    <span className="mr-1 text-foreground/50">{item.quantity}×</span>
                                    {item.name}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-border/30 pt-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">Total</span>
                        <span className="font-bold text-lg">{order.total.toFixed(0)} د.ع</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Order History</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        View completed and rejected orders
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="rounded-xl gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by Order ID or Phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-secondary/20 border-white/10"
                    />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-secondary/20 border-white/10">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <SelectValue placeholder="Filter by Status" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="bg-secondary/20 border-white/10">
                        <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-muted-foreground" />
                            <SelectValue placeholder="Filter by Order Type" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="dine_in">Dine-in</SelectItem>
                        <SelectItem value="takeaway">Takeaway</SelectItem>
                        <SelectItem value="delivery">Delivery</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {historyOrders.length === 0 ? (
                <div className="text-center py-20 glass-card rounded-2xl">
                    <History className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-1">No order history</h3>
                    <p className="text-muted-foreground text-sm">
                        Completed and rejected orders will appear here
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {historyOrders.map((order) => (
                        <OrderRow key={order.id} order={order} />
                    ))}
                </div>
            )}
        </div>
    );
}
