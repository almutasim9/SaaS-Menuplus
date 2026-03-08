"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDashboardMetrics(restaurantId: string) {
    const supabase = await createClient();

    // 1. Total Orders & Revenue (All Time - for simple start, can be filtered by date later)
    const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("total, status, created_at")
        .eq("restaurant_id", restaurantId)
        .neq("status", "cancelled")
        .neq("status", "rejected");

    if (ordersError) {
        console.error("Error fetching orders for analytics", ordersError);
        throw new Error("Failed to load analytics data");
    }

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);

    // 2. Fetch Order Items for Top Products
    // We need to join order_items with orders to ensure we only count items from valid (non-cancelled) orders
    const { data: orderItemsData, error: itemsError } = await supabase
        .from("order_items")
        .select(`
            quantity,
            product_id,
            item_name,
            orders!inner(restaurant_id, status)
        `)
        .eq("orders.restaurant_id", restaurantId)
        .neq("orders.status", "cancelled")
        .neq("orders.status", "rejected");

    if (itemsError) {
        console.error("Error fetching order items for analytics", itemsError);
        throw new Error("Failed to load top products");
    }

    // Aggregate quantities by product name
    const productSales: { [key: string]: number } = {};
    orderItemsData.forEach(item => {
        const name = item.item_name || "Unknown Product";
        productSales[name] = (productSales[name] || 0) + item.quantity;
    });

    // Convert to sorted array for charts
    const topProducts = Object.entries(productSales)
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5); // Get top 5

    // 3. Simple Revenue Over Time (Last 7 Days)
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const revenueByDay: { [key: string]: number } = {};
    last7Days.forEach(day => revenueByDay[day] = 0);

    orders.forEach(order => {
        const dateStr = order.created_at.split('T')[0];
        if (revenueByDay[dateStr] !== undefined) {
            revenueByDay[dateStr] += Number(order.total);
        }
    });

    const revenueData = last7Days.map(date => ({
        date: date.substring(5), // MM-DD for cleaner chart labels
        revenue: revenueByDay[date]
    }));

    // 4. Intent Analytics (Conversion Rates)
    const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, view_count")
        .eq("restaurant_id", restaurantId)
        .is("deleted_at", null);

    let conversionRates: { name: string; views: number; sales: number; rate: number }[] = [];

    if (!productsError && productsData) {
        conversionRates = productsData.map(p => {
            const views = p.view_count || 0;
            const sales = productSales[p.name] || 0;
            let rate = 0;
            if (views > 0) {
                rate = (sales / views) * 100;
                // Cap at 100% just in case of historical anomalies
                if (rate > 100) rate = 100;
            }
            return {
                name: p.name,
                views: views,
                sales: sales,
                rate: Number(rate.toFixed(1))
            };
        })
            .filter(p => p.views > 0) // Only show items that have been viewed
            .sort((a, b) => b.views - a.views); // Sort by most viewed first
    }

    return {
        totalOrders,
        totalRevenue,
        topProducts,
        revenueData,
        conversionRates
    };
}
