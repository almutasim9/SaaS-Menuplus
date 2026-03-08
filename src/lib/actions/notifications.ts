"use server";

import { createClient } from "@/lib/supabase/server";

export type Notification = {
    id: string;
    type: "warning" | "info" | "success" | "error";
    title: string;
    message: string;
    createdAt: string;
    read: boolean;
};

export async function getNotifications(restaurantId: string): Promise<Notification[]> {
    const supabase = await createClient();
    const notifications: Notification[] = [];
    const now = new Date();

    // --- Check usage limits ---
    const [productsRes, ordersRes, couponsRes, restaurantRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId).is("deleted_at", null),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId).gte("created_at", new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),
        supabase.from("coupons").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId).is("deleted_at", null),
        supabase.from("restaurants").select("subscription_plan, subscription_status, trial_ends_at, max_products, max_orders_per_month").eq("id", restaurantId).single(),
    ]);

    const restaurant = restaurantRes.data;
    if (!restaurant) return notifications;

    const maxProducts = restaurant.max_products || 15;
    const maxOrders = restaurant.max_orders_per_month || 50;
    const maxCoupons = restaurant.subscription_plan === "business" ? 999999 : restaurant.subscription_plan === "pro" ? 20 : 3;

    const productCount = productsRes.count || 0;
    const orderCount = ordersRes.count || 0;
    const couponCount = couponsRes.count || 0;

    // Product limit warning (80%+)
    if (maxProducts < 999999 && productCount >= maxProducts * 0.8) {
        const isAtLimit = productCount >= maxProducts;
        notifications.push({
            id: "product-limit",
            type: isAtLimit ? "error" : "warning",
            title: isAtLimit ? "وصلت للحد الأقصى من المنتجات" : "اقتربت من حد المنتجات",
            message: `لديك ${productCount} من أصل ${maxProducts} منتج. ${isAtLimit ? "قم بالترقية لإضافة المزيد." : ""}`,
            createdAt: now.toISOString(),
            read: false,
        });
    }

    // Order limit warning (80%+)
    if (maxOrders < 999999 && orderCount >= maxOrders * 0.8) {
        const isAtLimit = orderCount >= maxOrders;
        notifications.push({
            id: "order-limit",
            type: isAtLimit ? "error" : "warning",
            title: isAtLimit ? "وصلت للحد الأقصى من الطلبات الشهرية" : "اقتربت من حد الطلبات",
            message: `لديك ${orderCount} من أصل ${maxOrders} طلب هذا الشهر. ${isAtLimit ? "قم بالترقية لاستقبال المزيد." : ""}`,
            createdAt: now.toISOString(),
            read: false,
        });
    }

    // Coupon limit warning
    if (maxCoupons < 999999 && couponCount >= maxCoupons * 0.8) {
        const isAtLimit = couponCount >= maxCoupons;
        notifications.push({
            id: "coupon-limit",
            type: isAtLimit ? "error" : "warning",
            title: isAtLimit ? "وصلت للحد الأقصى من الكوبونات" : "اقتربت من حد الكوبونات",
            message: `لديك ${couponCount} من أصل ${maxCoupons} كوبون.`,
            createdAt: now.toISOString(),
            read: false,
        });
    }

    // Trial ending warning
    if (restaurant.subscription_status === "trial" && restaurant.trial_ends_at) {
        const trialEnd = new Date(restaurant.trial_ends_at);
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 3 && daysLeft > 0) {
            notifications.push({
                id: "trial-ending",
                type: "warning",
                title: "فترة التجربة تنتهي قريباً",
                message: `تبقى ${daysLeft} ${daysLeft === 1 ? "يوم" : "أيام"} على انتهاء الفترة التجريبية. قم بالترقية للاحتفاظ بجميع المزايا.`,
                createdAt: now.toISOString(),
                read: false,
            });
        }
    }

    // Welcome notification for new restaurants
    const restaurantAge = (now.getTime() - new Date(now).getTime()) / (1000 * 60 * 60 * 24);
    if (productCount === 0) {
        notifications.push({
            id: "setup-incomplete",
            type: "info",
            title: "أكمل إعداد مطعمك",
            message: "لم تقم بإضافة أي منتجات بعد. ابدأ بإضافة أول صنف من قائمة الطعام!",
            createdAt: now.toISOString(),
            read: false,
        });
    }

    return notifications;
}
