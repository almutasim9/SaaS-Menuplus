import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
    Package,
    FolderOpen,
    ShoppingCart,
    DollarSign,
    TrendingUp,
    Clock,
} from "lucide-react";
import { StoreQrButton } from "./store-qr-button";
import { StoreSettingsToggles } from "./store-settings-toggles";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { getI18n } from "@/lib/i18n/server";

export default async function DashboardPage() {
    try {
        const { t } = await getI18n();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) redirect("/login");

        const { data: profile } = await supabase
            .from("profiles")
            .select("*, restaurants(*)")
            .eq("id", user.id)
            .single();

        if (!profile?.restaurant_id) {
            return (
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="text-center glass-card rounded-3xl p-12">
                        <h2 className="text-2xl font-semibold mb-2">Setup Required</h2>
                        <p className="text-muted-foreground">Please complete your restaurant setup.</p>
                    </div>
                </div>
            );
        }

        const restaurantId = profile.restaurant_id;

        // Fetch counts
        const [productsRes, categoriesRes, ordersRes] = await Promise.all([
            supabase.from("products").select("id", { count: "exact" }).eq("restaurant_id", restaurantId),
            supabase.from("categories").select("id", { count: "exact" }).eq("restaurant_id", restaurantId),
            supabase.from("orders").select("id, total, status, created_at", { count: "exact" }).eq("restaurant_id", restaurantId),
        ]);

        const totalProducts = productsRes.count || 0;
        const totalCategories = categoriesRes.count || 0;
        const totalOrders = ordersRes.count || 0;
        const orders = ordersRes.data || [];
        const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const pendingOrders = orders.filter((o) => o.status === "pending").length;

        const stats = [
            {
                label: t("dashboard.totalProducts"),
                value: totalProducts,
                icon: Package,
                color: "from-emerald-500 to-emerald-600",
                bgColor: "bg-emerald-500/10",
            },
            {
                label: t("dashboard.totalCategories"),
                value: totalCategories,
                icon: FolderOpen,
                color: "from-blue-500 to-blue-600",
                bgColor: "bg-blue-500/10",
            },
            {
                label: t("dashboard.totalOrders"),
                value: totalOrders,
                icon: ShoppingCart,
                color: "from-purple-500 to-purple-600",
                bgColor: "bg-purple-500/10",
            },
            {
                label: t("dashboard.monthlyRevenue"),
                value: `${revenue.toFixed(0)} د.ع`,
                icon: DollarSign,
                color: "from-amber-500 to-amber-600",
                bgColor: "bg-amber-500/10",
            },
        ];

        return (
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">
                            {t("dashboard.welcomeBack")}
                            {profile.full_name && <span className="text-gradient">, {profile.full_name}</span>}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {t("dashboard.subtitle")}
                        </p>
                    </div>
                    {profile.restaurants?.slug && (
                        <StoreQrButton slug={profile.restaurants.slug} />
                    )}
                </div>

                {/* Settings Toggles */}
                {profile.restaurants && (
                    <StoreSettingsToggles
                        restaurantId={restaurantId}
                        initialSettings={{
                            is_dine_in_enabled: profile.restaurants.is_dine_in_enabled,
                            is_takeaway_enabled: profile.restaurants.is_takeaway_enabled,
                            is_delivery_enabled: profile.restaurants.is_delivery_enabled
                        }}
                    />
                )}

                {/* Onboarding Checklist */}
                <OnboardingChecklist />

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="glass-card rounded-2xl p-6 hover:scale-[1.02] transition-transform duration-200"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                    <stat.icon className="w-5 h-5 text-foreground" />
                                </div>
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                            </div>
                            <p className="text-2xl font-bold">{stat.value}</p>
                            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Recent Orders */}
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold">{t("orders.activeOrders")}</h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {pendingOrders} {t("orders.pending")}
                        </div>
                    </div>

                    {orders.length === 0 ? (
                        <div className="text-center py-12">
                            <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground">{t("orders.noOrders")}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {orders.slice(0, 5).map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <ShoppingCart className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{t("orders.orderId")} #{order.id.slice(0, 8)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-sm">{Number(order.total).toFixed(0)} د.ع</p>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full ${order.status === "pending"
                                                ? "bg-amber-500/10 text-amber-500"
                                                : order.status === "confirmed"
                                                    ? "bg-blue-500/10 text-blue-500"
                                                    : order.status === "delivered"
                                                        ? "bg-emerald-500/10 text-emerald-500"
                                                        : order.status === "cancelled"
                                                            ? "bg-red-500/10 text-red-500"
                                                            : "bg-purple-500/10 text-purple-500"
                                                }`}
                                        >
                                            {t(`orders.${order.status}`)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    } catch (error: any) {
        return <div className="p-8"><h1 className="text-red-500 font-bold mb-4">Dashboard Render Error:</h1><pre className="bg-black/50 p-4 text-xs overflow-auto">{error.stack || error.message || String(error)}</pre></div>;
    }
}
