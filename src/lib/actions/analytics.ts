"use server";

import { createClient } from "@/lib/supabase/server";

export async function getDashboardMetrics(restaurantId: string, startDate?: string, endDate?: string) {
    const supabase = await createClient();

    // PERFORMANCE OPTIMIZATION (Level 2): Use server-side RPC for aggregation
    try {
        const { data: rpcData, error: rpcError } = await supabase.rpc("get_dashboard_analytics", {
            p_restaurant_id: restaurantId,
            p_start_date: startDate || null,
            p_end_date: endDate || null
        });

        if (!rpcError && rpcData) {
            return {
                totalOrders: Number(rpcData.totalOrders),
                totalRevenue: Number(rpcData.totalRevenue),
                topProducts: rpcData.topProducts || [],
                dailyData: rpcData.dailyData || [],
                conversionRates: rpcData.conversionRates || []
            };
        }
        
        if (rpcError) {
            console.warn("Analytics RPC failed, falling back to JS aggregation:", rpcError.message);
        }
    } catch (e) {
        console.error("Critical RPC error, using fallback:", e);
    }

    // FALLBACK: Optimized parallel JS aggregation
    const effectiveStart = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const effectiveEnd = endDate || new Date().toISOString();
    
    const [ordersResult, orderItemsResult, productsResult] = await Promise.all([
        supabase
            .from("orders")
            .select("total, status, created_at")
            .eq("restaurant_id", restaurantId)
            .neq("status", "cancelled")
            .neq("status", "rejected")
            .gte("created_at", effectiveStart)
            .lte("created_at", effectiveEnd),
        
        supabase
            .from("order_items")
            .select(`
                quantity,
                product_id,
                item_name,
                orders!inner(restaurant_id, status, created_at)
            `)
            .eq("orders.restaurant_id", restaurantId)
            .neq("orders.status", "cancelled")
            .neq("orders.status", "rejected")
            .gte("orders.created_at", effectiveStart)
            .lte("orders.created_at", effectiveEnd),
        
        // 3. Fetch Products for Intent Analytics
        supabase
            .from("products")
            .select("id, name, view_count")
            .eq("restaurant_id", restaurantId)
            .is("deleted_at", null)
    ]);

    if (ordersResult.error) throw new Error("Failed to load analytics data");
    
    const orders = ordersResult.data;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);

    // if (orderItemsResult.error) { // This check is removed as per the new code
    //     console.error("Error fetching order items for analytics", orderItemsResult.error);
    //     throw new Error("Failed to load top products");
    // }

    const orderItemsData = orderItemsResult.data || [];

    // Aggregate quantities by product name
    const productSales: { [key: string]: number } = {};
    orderItemsData.forEach(item => {
        const name = item.item_name || "Unknown Product";
        productSales[name] = (productSales[name] || 0) + item.quantity;
    });

    // Sort and slice top products
    const topProducts = Object.entries(productSales)
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

    // Dynamic Daily Data (Revenue & Orders)
    const startDateObj = new Date(effectiveStart);
    const endDateObj = new Date(effectiveEnd);
    const dayDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) || 7;
    const chartPeriods = dayDiff > 31 ? 31 : dayDiff; // Cap fallback chart at 31 days

    const dailyMap: { [key: string]: { revenue: number, orders: number } } = {};
    for (let i = 0; i < chartPeriods; i++) {
        const d = new Date(endDateObj);
        d.setDate(d.getDate() - i);
        const dayKey = d.toISOString().split('T')[0];
        dailyMap[dayKey] = { revenue: 0, orders: 0 };
    }

    orders.forEach(order => {
        const dateStr = order.created_at.split('T')[0];
        if (dailyMap[dateStr]) {
            dailyMap[dateStr].revenue += Number(order.total);
            dailyMap[dateStr].orders += 1;
        }
    });

    const dailyData = Object.entries(dailyMap)
        .map(([date, vals]) => ({
            date: date.substring(5), 
            revenue: vals.revenue,
            orders: vals.orders
        }))
        .reverse();

    // 5. Intent Analytics (Conversion Rates)
    let conversionRates: any[] = [];

    if (!productsResult.error && productsResult.data) {
        conversionRates = productsResult.data.map(p => {
            const views = p.view_count || 0;
            const sales = productSales[p.name] || 0;
            const rate = views > 0 ? Math.min((sales / views) * 100, 100) : 0;
            return { name: p.name, views, sales, rate: Number(rate.toFixed(1)) };
        })
            .filter(p => p.views > 0)
            .sort((a, b) => b.views - a.views);
    }

    return { totalOrders, totalRevenue, topProducts, dailyData, conversionRates };
}
