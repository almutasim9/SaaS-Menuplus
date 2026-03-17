"use server";

import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/actions/_auth-guard";
import { PLAN_LIMITS } from "@/lib/constants";

export async function getPlatformMetrics() {
    await requireSuperAdmin();
    const supabase = await createClient();

    const now = new Date();
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date(now); sixtyDaysAgo.setDate(now.getDate() - 60);
    const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 7);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twentyFourHoursAgo = new Date(now); twentyFourHoursAgo.setHours(now.getHours() - 24);

    const [restaurantsRes, ordersRes, usersRes, dailyRevenueRes, dailyGrowthRes,
        prevMonthOrdersRes, thisMonthOrdersRes, suspendedRes, activeRestaurantsRes] = await Promise.all([
        supabase.from("restaurants").select("id, subscription_plan, subscription_status, created_at", { count: "exact" }),
        supabase.from("orders").select("id, total, created_at", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("orders").select("created_at, total").gte("created_at", thirtyDaysAgo.toISOString()).order("created_at"),
        supabase.from("restaurants").select("created_at").gte("created_at", thirtyDaysAgo.toISOString()).order("created_at"),
        // Previous month orders for comparison
        supabase.from("orders").select("total")
            .gte("created_at", startOfLastMonth.toISOString())
            .lt("created_at", startOfThisMonth.toISOString()),
        // This month orders
        supabase.from("orders").select("total").gte("created_at", startOfThisMonth.toISOString()),
        // Suspended this month
        supabase.from("restaurants")
            .select("id", { count: "exact", head: true })
            .eq("subscription_status", "expired")
            .gte("created_at", startOfThisMonth.toISOString()),
        // Restaurants with orders in last 7 days (active)
        supabase.from("orders").select("restaurant_id").gte("created_at", sevenDaysAgo.toISOString()),
    ]);

    const restaurants = restaurantsRes.data || [];
    const allOrders = ordersRes.data || [];
    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Active orders in last 24h
    const { count: activeOrders24h } = await supabase
        .from("orders").select("*", { count: "exact", head: true })
        .gte("created_at", twentyFourHoursAgo.toISOString());

    // Top restaurants by order volume
    const { data: topRestaurantsData } = await supabase
        .from("orders").select("restaurant_id, restaurants(name)")
        .gte("created_at", thirtyDaysAgo.toISOString());

    const restaurantCounts: Record<string, { name: string; count: number }> = {};
    topRestaurantsData?.forEach(o => {
        const id = o.restaurant_id;
        const name = (o.restaurants as unknown as { name: string } | null)?.name || "Unknown";
        if (!restaurantCounts[id]) restaurantCounts[id] = { name, count: 0 };
        restaurantCounts[id].count++;
    });
    const topRestaurants = Object.values(restaurantCounts).sort((a, b) => b.count - a.count).slice(0, 5);

    // Plan counts + MRR estimate (IQD)
    const planCounts = {
        free: restaurants.filter(r => !r.subscription_plan || r.subscription_plan === "free").length,
        pro: restaurants.filter(r => r.subscription_plan === "pro").length,
        business: restaurants.filter(r => r.subscription_plan === "business").length,
    };
    // Rough MRR in IQD (placeholder prices — update to match actual pricing)
    const MRR_RATES: Record<string, number> = { free: 0, pro: 15000, business: 35000 };
    const mrr = planCounts.pro * MRR_RATES.pro + planCounts.business * MRR_RATES.business;

    // Month-over-month revenue comparison
    const prevMonthRevenue = (prevMonthOrdersRes.data || []).reduce((s, o) => s + (o.total || 0), 0);
    const thisMonthRevenue = (thisMonthOrdersRes.data || []).reduce((s, o) => s + (o.total || 0), 0);
    const revenueGrowthPct = prevMonthRevenue > 0
        ? Math.round(((thisMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
        : null;

    // Churn: expired this month / total
    const churnCount = suspendedRes.count || 0;
    const churnRate = restaurants.length > 0 ? Math.round((churnCount / restaurants.length) * 100) : 0;

    // Active restaurants (had at least 1 order in last 7 days)
    const activeRestaurantIds = new Set((activeRestaurantsRes.data || []).map((o: any) => o.restaurant_id));
    const activeRestaurantsCount = activeRestaurantIds.size;

    // Avg order value
    const avgOrderValue = allOrders.length > 0 ? Math.round(totalRevenue / allOrders.length) : 0;

    // New restaurants this month vs last month
    const newThisMonth = restaurants.filter(r => new Date(r.created_at) >= startOfThisMonth).length;
    const newLastMonth = restaurants.filter(r => {
        const d = new Date(r.created_at);
        return d >= startOfLastMonth && d < startOfThisMonth;
    }).length;
    const restaurantGrowthPct = newLastMonth > 0
        ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
        : null;

    // Chart data
    const revenueData: Record<string, number> = {};
    dailyRevenueRes.data?.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        revenueData[date] = (revenueData[date] || 0) + (order.total || 0);
    });
    const growthData: Record<string, number> = {};
    dailyGrowthRes.data?.forEach(rest => {
        const date = new Date(rest.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        growthData[date] = (growthData[date] || 0) + 1;
    });
    const chartData = Object.keys({ ...revenueData, ...growthData })
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        .map(date => ({ date, revenue: revenueData[date] || 0, restaurants: growthData[date] || 0 }));

    // Addon metrics
    const { data: activeAddonsData } = await supabase
        .from("restaurant_addons")
        .select("addon_key, price_monthly, restaurant_id")
        .eq("is_active", true);

    const addonMrr = (activeAddonsData || []).reduce((s, a) => s + (a.price_monthly || 0), 0);
    const payingRestaurantIds = new Set(
        restaurants.filter(r => ["pro", "business"].includes(r.subscription_plan || "") && r.subscription_status === "active").map(r => r.id)
    );
    const restaurantsWithAddons = new Set((activeAddonsData || []).map(a => a.restaurant_id)).size;
    const addonAttachRate = payingRestaurantIds.size > 0
        ? Math.round((restaurantsWithAddons / payingRestaurantIds.size) * 100) : 0;

    const addonDistribution: Record<string, number> = {};
    (activeAddonsData || []).forEach(a => {
        addonDistribution[a.addon_key] = (addonDistribution[a.addon_key] || 0) + 1;
    });
    const topAddon = Object.entries(addonDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
        totalRestaurants: restaurantsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalRevenue,
        activeOrders24h: activeOrders24h || 0,
        topRestaurants,
        planCounts,
        chartData,
        // Advanced KPIs
        mrr,
        churnRate,
        churnCount,
        activeRestaurantsCount,
        avgOrderValue,
        revenueGrowthPct,
        restaurantGrowthPct,
        thisMonthRevenue,
        newRestaurantsThisMonth: newThisMonth,
        // Addon KPIs
        addonMrr,
        addonAttachRate,
        topAddon,
        addonDistribution,
    };
}

export async function getAllRestaurants(filters?: {
    search?: string;
    plan?: string;
    status?: string;
    joinedWithin?: string;
    sortBy?: string;
    page?: number;
    pageSize?: number;
}) {
    await requireSuperAdmin();
    const supabase = await createClient();

    const pageSize = filters?.pageSize || 20;
    const page = Math.max(1, filters?.page || 1);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const buildQuery = (withCount: boolean) => {
        let q = supabase
            .from("restaurants")
            .select(
                "id, name, slug, subscription_plan, subscription_status, created_at, owner_id, profiles!restaurants_owner_id_fkey(email, full_name)",
                withCount ? { count: "exact" } : undefined
            );

        if (filters?.plan && filters.plan !== "all") {
            q = q.eq("subscription_plan", filters.plan);
        }
        if (filters?.status && filters.status !== "all") {
            q = q.eq("subscription_status", filters.status);
        }
        if (filters?.joinedWithin) {
            const days = parseInt(filters.joinedWithin);
            const since = new Date();
            since.setDate(since.getDate() - days);
            q = q.gte("created_at", since.toISOString());
        }
        if (filters?.search) {
            q = q.or(`name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`);
        }

        const sortBy = filters?.sortBy || "created_at";
        q = q.order(sortBy, { ascending: sortBy === "name" });

        return q;
    };

    const { data, error, count } = await buildQuery(true).range(from, to);

    if (error) {
        const { data: fallback } = await supabase
            .from("restaurants")
            .select("id, name, slug, subscription_plan, subscription_status, created_at, owner_id")
            .order("created_at", { ascending: false })
            .range(from, to);
        return { data: fallback || [], total: 0, page, pageSize, totalPages: 1 };
    }

    return {
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
    };
}

export async function exportRestaurants() {
    await requireSuperAdmin();
    const supabase = await createClient();

    const { data } = await supabase
        .from("restaurants")
        .select("id, name, slug, subscription_plan, subscription_status, created_at, owner_id, profiles!restaurants_owner_id_fkey(email, full_name)")
        .order("created_at", { ascending: false });

    return (data || []).map((r: any) => ({
        "اسم المطعم": r.name,
        "الرابط": r.slug,
        "الخطة": r.subscription_plan || "free",
        "الحالة": r.subscription_status || "active",
        "صاحب المطعم": r.profiles?.full_name || "",
        "البريد الإلكتروني": r.profiles?.email || "",
        "تاريخ الانضمام": new Date(r.created_at).toLocaleDateString("ar-IQ"),
    }));
}

export async function updateRestaurantPlan(restaurantId: string, plan: string) {
    await requireSuperAdmin();
    const supabase = await createClient();

    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

    const { error } = await supabase
        .from("restaurants")
        .update({
            subscription_plan: plan,
            subscription_status: "active",
            max_products: limits.max_products,
            max_orders_per_month: limits.max_orders_per_month,
        })
        .eq("id", restaurantId);

    if (error) return { error: error.message };

    await logActivity({
        action_type: "PLAN_CHANGE",
        description: `تغيير باقة المطعم إلى ${plan}`,
        restaurant_id: restaurantId,
    });

    return { success: true };
}

export async function suspendRestaurant(restaurantId: string) {
    await requireSuperAdmin();
    const supabase = await createClient();

    const { error } = await supabase
        .from("restaurants")
        .update({ subscription_status: "expired" })
        .eq("id", restaurantId);

    if (error) return { error: error.message };

    await logActivity({
        action_type: "RESTAURANT_SUSPEND",
        description: `تعليق المطعم`,
        restaurant_id: restaurantId,
    });

    return { success: true };
}

export async function activateRestaurant(restaurantId: string) {
    await requireSuperAdmin();
    const supabase = await createClient();

    const { error } = await supabase
        .from("restaurants")
        .update({ subscription_status: "active" })
        .eq("id", restaurantId);

    if (error) return { error: error.message };

    await logActivity({
        action_type: "RESTAURANT_ACTIVATE",
        description: `تفعيل المطعم`,
        restaurant_id: restaurantId,
    });

    return { success: true };
}

export async function adminCreateRestaurant(data: {
    ownerEmail: string;
    ownerPassword: string;
    ownerName: string;
    restaurantName: string;
    plan: string;
}) {
    await requireSuperAdmin();
    const supabase = await createClient();

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.ownerEmail,
        password: data.ownerPassword,
        email_confirm: true,
        user_metadata: { full_name: data.ownerName },
    });

    if (authError) {
        // Fallback: try normal signup if admin API not available
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: data.ownerEmail,
            password: data.ownerPassword,
            options: { data: { full_name: data.ownerName } },
        });

        if (signupError) return { error: signupError.message };
        if (!signupData.user) return { error: "فشل إنشاء الحساب" };

        const userId = signupData.user.id;
        return await createRestaurantForUser(supabase, userId, data);
    }

    if (!authData.user) return { error: "فشل إنشاء الحساب" };
    return await createRestaurantForUser(supabase, authData.user.id, data);
}

async function createRestaurantForUser(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    data: { ownerName: string; restaurantName: string; plan: string; ownerEmail: string }
) {
    // 2. Generate unique slug
    const baseSlug = data.restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9\u0621-\u064A]+/g, "-")
        .replace(/(^-|-$)/g, "")
        || "restaurant";

    let slug = baseSlug;
    let attempts = 0;

    while (attempts < 5) {
        const { data: existing } = await supabase
            .from("restaurants")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();

        if (!existing) break;
        slug = `${baseSlug}-${Date.now().toString(36)}`;
        attempts++;
    }

    // 3. Plan config
    const limits = PLAN_LIMITS[data.plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

    // 4. Create restaurant
    const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .insert({
            name: data.restaurantName,
            slug,
            owner_id: userId,
            subscription_plan: data.plan,
            subscription_status: "active",
            max_products: limits.max_products,
            max_orders_per_month: limits.max_orders_per_month,
        })
        .select()
        .single();

    if (restaurantError) return { error: restaurantError.message };

    // 5. Link profile to restaurant
    await supabase
        .from("profiles")
        .update({
            restaurant_id: restaurant.id,
            full_name: data.ownerName,
            role: "owner",
        })
        .eq("id", userId);

    await logActivity({
        action_type: "RESTAURANT_CREATE",
        description: `إنشاء مطعم جديد باسم ${data.restaurantName}`,
        restaurant_id: restaurant.id,
    });

    return { success: true, restaurant };
}

export async function getSystemLogs() {
    const supabase = await createClient();

    const { data: logsData } = await supabase
        .from("platform_activity_logs")
        .select("*, restaurants(name)")
        .order("created_at", { ascending: false })
        .limit(15);

    if (logsData && logsData.length > 0) {
        return logsData.map(log => ({
            type: log.action_type.toLowerCase().includes('restaurant') ? 'restaurant' : 'info',
            title: log.action_type.replace(/_/g, ' '),
            subtitle: log.description + (log.restaurants ? ` - ${log.restaurants.name}` : ''),
            time: log.created_at,
            color: log.action_type === 'RESTAURANT_CREATE' ? 'text-emerald-500' : 
                   log.action_type === 'PLAN_CHANGE' ? 'text-blue-500' : 'text-gray-500'
        }));
    }

    // Fallback if no logs table or no data
    const [restaurantsRes, ordersRes] = await Promise.all([
        supabase.from("restaurants").select("name, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("orders").select("total, created_at, restaurants(name)").order("created_at", { ascending: false }).limit(5),
    ]);

    const logs: { type: string; title: string; subtitle: string; time: string; color: string }[] = [];

    restaurantsRes.data?.forEach(r => {
        logs.push({
            type: "restaurant",
            title: "مطعم جديد",
            subtitle: `تم انضمام "${r.name}" للمنصة`,
            time: r.created_at,
            color: "text-emerald-500",
        });
    });

    ordersRes.data?.forEach(o => {
        const restaurantName = (o.restaurants as unknown as { name: string } | null)?.name || "مطعم";
        logs.push({
            type: "order",
            title: "طلب جديد",
            subtitle: `طلب بقيمة ${o.total?.toLocaleString()} من ${restaurantName}`,
            time: o.created_at,
            color: "text-blue-500",
        });
    });

    return logs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);
}

export async function sendBroadcast(data: {
    title: string; message: string; type: string;
    target_plan?: string; expires_at?: string;
}) {
    await requireSuperAdmin();
    const supabase = await createClient();

    const insertData: Record<string, unknown> = {
        title: data.title,
        message: data.message,
        type: data.type,
        is_active: true,
    };
    // Optional fields — only add if present (columns may not exist in all DB setups)
    if (data.target_plan && data.target_plan !== "all") insertData.target_plan = data.target_plan;
    if (data.expires_at) insertData.expires_at = data.expires_at;

    const { error } = await supabase.from("admin_announcements").insert(insertData);

    if (error) return { error: error.message };
    return { success: true };
}

export async function getActiveAnnouncements() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("admin_announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    if (error) return [];
    return data;
}

export async function getAllAnnouncements() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("admin_announcements")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) return [];
    return data;
}

export async function getGovernorates() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("master_governorates")
        .select("*")
        .order("name_ar");
    
    if (error) return [];
    return data;
}

export async function getLocationsByGovernorate(governorateId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("master_locations")
        .select("*")
        .eq("governorate_id", governorateId)
        .order("name_ar");

    if (error) return [];
    return data;
}

export async function getMasterGovernoratesWithCount() {
    await requireSuperAdmin();
    const supabase = await createClient();

    const [governoratesRes, locationsRes] = await Promise.all([
        supabase.from("master_governorates").select("*").order("name_ar"),
        supabase.from("master_locations").select("governorate_id"),
    ]);

    const counts: Record<string, number> = {};
    locationsRes.data?.forEach((l: any) => {
        counts[l.governorate_id] = (counts[l.governorate_id] || 0) + 1;
    });

    return (governoratesRes.data || []).map((g: any) => ({
        ...g,
        locationCount: counts[g.id] || 0,
    }));
}

export async function addGovernorate(name_ar: string) {
    await requireSuperAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from("master_governorates").insert({ name_ar });
    if (error) return { error: error.message };
    return { success: true };
}

export async function addLocation(data: { governorate_id: string; name_ar: string; city_name_ar?: string }) {
    await requireSuperAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from("master_locations").insert(data);
    if (error) return { error: error.message };
    return { success: true };
}

export async function deleteGovernorate(id: string) {
    await requireSuperAdmin();
    const supabase = await createClient();
    // Delete locations first
    await supabase.from("master_locations").delete().eq("governorate_id", id);
    const { error } = await supabase.from("master_governorates").delete().eq("id", id);
    if (error) return { error: error.message };
    return { success: true };
}

export async function deleteLocation(id: string) {
    await requireSuperAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from("master_locations").delete().eq("id", id);
    if (error) return { error: error.message };
    return { success: true };
}

export async function searchLocations(query: string) {
    await requireSuperAdmin();
    const supabase = await createClient();
    const { data } = await supabase
        .from("master_locations")
        .select("*, master_governorates(name_ar)")
        .ilike("name_ar", `%${query}%`)
        .limit(20);
    return data || [];
}

export async function globalSearch(query: string) {
    await requireSuperAdmin();
    if (!query || query.trim().length < 2) return { restaurants: [], users: [] };

    const supabase = await createClient();
    const q = query.trim();

    const [restaurantsRes, usersRes] = await Promise.all([
        supabase
            .from("restaurants")
            .select("id, name, slug, subscription_plan, subscription_status")
            .or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
            .limit(5),
        supabase
            .from("profiles")
            .select("id, email, full_name, role, restaurant_id")
            .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
            .limit(5),
    ]);

    return {
        restaurants: restaurantsRes.data || [],
        users: usersRes.data || [],
    };
}

export async function getExpiringRestaurants(days = 30) {
    await requireSuperAdmin();
    const supabase = await createClient();

    const now = new Date();
    const future = new Date(now);
    future.setDate(now.getDate() + days);

    const { data } = await supabase
        .from("restaurants")
        .select("id, name, slug, subscription_plan, subscription_status, subscription_expires_at, profiles!restaurants_owner_id_fkey(email, full_name)")
        .eq("subscription_status", "active")
        .not("subscription_expires_at", "is", null)
        .lte("subscription_expires_at", future.toISOString())
        .gte("subscription_expires_at", now.toISOString())
        .order("subscription_expires_at");

    return (data || []) as unknown as Array<{ id: string; name: string; slug: string; subscription_plan: string; subscription_status: string; subscription_expires_at: string | null; profiles: { email: string; full_name: string } | null }>;
}

export async function getOnboardingStatus() {
    await requireSuperAdmin();
    const supabase = await createClient();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get new restaurants (last 30 days) with relevant fields
    const { data: restaurants } = await supabase
        .from("restaurants")
        .select("id, name, slug, logo_url, whatsapp_number, social_links, is_whatsapp_ordering_enabled, created_at, profiles!restaurants_owner_id_fkey(email, full_name)")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });

    if (!restaurants) return [];

    // Get product counts for each restaurant
    const restaurantIds = restaurants.map(r => r.id);
    const { data: productCounts } = await supabase
        .from("products")
        .select("restaurant_id")
        .in("restaurant_id", restaurantIds);

    const { data: workingHoursCounts } = await supabase
        .from("working_hours")
        .select("restaurant_id")
        .in("restaurant_id", restaurantIds);

    const productsByRestaurant: Record<string, number> = {};
    productCounts?.forEach(p => {
        productsByRestaurant[p.restaurant_id] = (productsByRestaurant[p.restaurant_id] || 0) + 1;
    });

    const hoursbyRestaurant: Record<string, number> = {};
    workingHoursCounts?.forEach(w => {
        hoursbyRestaurant[w.restaurant_id] = (hoursbyRestaurant[w.restaurant_id] || 0) + 1;
    });

    return restaurants.map((r: any) => {
        const hasLogo = !!r.logo_url;
        const hasProducts = (productsByRestaurant[r.id] || 0) > 0;
        const hasHours = (hoursbyRestaurant[r.id] || 0) > 0;
        const hasContact = !!(r.whatsapp_number || r.is_whatsapp_ordering_enabled ||
            (r.social_links && Object.values(r.social_links as Record<string, string>).some(v => v)));
        const score = [hasLogo, hasProducts, hasHours, hasContact].filter(Boolean).length;

        return {
            id: r.id,
            name: r.name,
            slug: r.slug,
            created_at: r.created_at,
            owner: r.profiles,
            steps: { hasLogo, hasProducts, hasHours, hasContact },
            score,
            pct: Math.round((score / 4) * 100),
        };
    });
}

export async function getRestaurantDetails(restaurantId: string) {
    await requireSuperAdmin();
    const supabase = await createClient();

    const [restaurantRes, ordersRes, productsRes, logsRes] = await Promise.all([
        supabase
            .from("restaurants")
            .select("id, name, slug, logo_url, subscription_plan, subscription_status, subscription_expires_at, owner_id, created_at, whatsapp_number, profiles!restaurants_owner_id_fkey(email, full_name)")
            .eq("id", restaurantId)
            .single(),
        supabase
            .from("orders")
            .select("id, total, status, created_at")
            .eq("restaurant_id", restaurantId)
            .order("created_at", { ascending: false })
            .limit(10),
        supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("restaurant_id", restaurantId),
        supabase
            .from("platform_activity_logs")
            .select("*")
            .eq("restaurant_id", restaurantId)
            .order("created_at", { ascending: false })
            .limit(8),
    ]);

    if (restaurantRes.error || !restaurantRes.data) {
        console.error("[getRestaurantDetails] Query error:", restaurantRes.error?.message, "| restaurantId:", restaurantId);
        return null;
    }

    const restaurant = restaurantRes.data;
    const orders = ordersRes.data || [];
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((s: number, o: { total?: number }) => s + (o.total || 0), 0);

    // Last 30 days revenue for chart
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: revenueData } = await supabase
        .from("orders")
        .select("created_at, total")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at");

    const dailyRevenue: Record<string, number> = {};
    revenueData?.forEach((o: any) => {
        const date = new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        dailyRevenue[date] = (dailyRevenue[date] || 0) + (o.total || 0);
    });
    const chartData = Object.entries(dailyRevenue).map(([date, revenue]) => ({ date, revenue }));

    // Last activity
    const { data: lastOrderData } = await supabase
        .from("orders")
        .select("created_at")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    // Supabase returns joins as arrays — normalize to single object
    type OwnerProfile = { email: string; full_name: string | null } | null;
    const profilesRaw = restaurant.profiles as unknown as OwnerProfile[] | OwnerProfile;
    const ownerProfile: OwnerProfile = Array.isArray(profilesRaw) ? (profilesRaw[0] ?? null) : profilesRaw;

    return {
        restaurant,
        owner: ownerProfile,
        stats: {
            totalOrders,
            totalRevenue,
            productCount: productsRes.count || 0,
            lastActivity: lastOrderData?.created_at || restaurant.created_at,
        },
        recentOrders: orders,
        chartData,
        activityLogs: logsRes.data || [],
    };
}

export async function extendSubscription(restaurantId: string, months: number, plan?: string) {
    await requireSuperAdmin();
    const supabase = await createClient();

    const { data: restaurant } = await supabase
        .from("restaurants")
        .select("subscription_expires_at, subscription_plan")
        .eq("id", restaurantId)
        .single();

    const baseDate = restaurant?.subscription_expires_at
        ? new Date(restaurant.subscription_expires_at)
        : new Date();
    if (baseDate < new Date()) baseDate.setTime(new Date().getTime());
    baseDate.setMonth(baseDate.getMonth() + months);

    const updateData: Record<string, unknown> = {
        subscription_expires_at: baseDate.toISOString(),
        subscription_status: "active",
    };
    if (plan) {
        updateData.subscription_plan = plan;
        Object.assign(updateData, PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free);
    }

    const { error } = await supabase
        .from("restaurants")
        .update(updateData)
        .eq("id", restaurantId);

    if (error) return { error: error.message };

    await logActivity({
        action_type: "SUBSCRIPTION_EXTEND",
        description: `تمديد الاشتراك ${months} شهر${months > 1 ? "ور" : ""}`,
        restaurant_id: restaurantId,
    });

    return { success: true, newExpiry: baseDate.toISOString() };
}

export async function logActivity(data: {
    action_type: string;
    description: string;
    metadata?: any;
    restaurant_id?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("platform_activity_logs").insert({
        ...data,
        performed_by: user?.id,
    });
}

export async function deleteAnnouncement(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("admin_announcements")
        .delete()
        .eq("id", id);
    
    if (error) return { error: error.message };
    return { success: true };
}

export async function toggleAnnouncementActive(id: string, active: boolean) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("admin_announcements")
        .update({ is_active: active })
        .eq("id", id);

    if (error) return { error: error.message };
    return { success: true };
}

// ─── PLAN PRICES (USD) ────────────────────────────────────────────────────────
const PLAN_PRICES_USD: Record<string, number> = { free: 0, business: 22, pro: 39 };
const EARLY_ADOPTER_PRICES: Record<string, number> = { business: 15, pro: 29 };
const ADDON_LABELS: Record<string, string> = {
    discounts: "خصومات وكوبونات",
    advanced_delivery: "توصيل متقدم",
    analytics_pro: "تحليلات برو",
    custom_branding: "براند مخصص",
    custom_domain: "دومين مخصص",
};

// ─── HELPER: fetch addons for a list of restaurant IDs ───────────────────────
export async function getRestaurantAddonsForList(restaurantIds: string[]) {
    await requireSuperAdmin();
    if (!restaurantIds.length) return {} as Record<string, { keys: string[]; total: number }>;
    const supabase = await createClient();

    const { data } = await supabase
        .from("restaurant_addons")
        .select("restaurant_id, addon_key, price_monthly")
        .in("restaurant_id", restaurantIds)
        .eq("is_active", true);

    const result: Record<string, { keys: string[]; total: number }> = {};
    (data || []).forEach((a: any) => {
        if (!result[a.restaurant_id]) result[a.restaurant_id] = { keys: [], total: 0 };
        result[a.restaurant_id].keys.push(a.addon_key);
        result[a.restaurant_id].total += (a.price_monthly || 0);
    });
    return result;
}

// ─── ADDON OVERVIEW METRICS ──────────────────────────────────────────────────
export async function getAddonOverviewMetrics() {
    await requireSuperAdmin();
    const supabase = await createClient();

    const [activeAddonsRes, payingCountRes, activityRes] = await Promise.all([
        supabase
            .from("restaurant_addons")
            .select("addon_key, price_monthly, restaurant_id, activated_at, restaurants(name, subscription_plan)")
            .eq("is_active", true),
        supabase
            .from("restaurants")
            .select("id", { count: "exact", head: true })
            .in("subscription_plan", ["pro", "business"])
            .eq("subscription_status", "active"),
        supabase
            .from("platform_activity_logs")
            .select("*, restaurants(name)")
            .in("action_type", ["ADDON_ACTIVATED", "ADDON_DEACTIVATED"])
            .order("created_at", { ascending: false })
            .limit(20),
    ]);

    const activeAddons = activeAddonsRes.data || [];
    const totalActive = activeAddons.length;
    const addonMRR = activeAddons.reduce((s, a) => s + (a.price_monthly || 0), 0);

    const payingCount = payingCountRes.count || 0;
    const restaurantsWithAddons = new Set(activeAddons.map(a => a.restaurant_id)).size;
    const attachRate = payingCount > 0 ? Math.round((restaurantsWithAddons / payingCount) * 100) : 0;

    const distribution: Record<string, { count: number; revenue: number }> = {};
    activeAddons.forEach((a: any) => {
        if (!distribution[a.addon_key]) distribution[a.addon_key] = { count: 0, revenue: 0 };
        distribution[a.addon_key].count++;
        distribution[a.addon_key].revenue += (a.price_monthly || 0);
    });

    const topAddon = Object.entries(distribution).sort((a, b) => b[1].count - a[1].count)[0]?.[0] || null;

    // Build restaurant-grouped table
    const restaurantMap: Record<string, { name: string; plan: string; addons: string[]; total: number }> = {};
    (activeAddons as unknown as Array<{ restaurant_id: string; addon_key: string; price_monthly?: number; restaurants?: { name: string; subscription_plan: string } | null }>).forEach((a) => {
        const rid = a.restaurant_id;
        if (!restaurantMap[rid]) {
            restaurantMap[rid] = {
                name: a.restaurants?.name || "—",
                plan: a.restaurants?.subscription_plan || "free",
                addons: [],
                total: 0,
            };
        }
        restaurantMap[rid].addons.push(a.addon_key);
        restaurantMap[rid].total += (a.price_monthly || 0);
    });

    return {
        totalActive,
        addonMRR,
        attachRate,
        topAddon,
        distribution,
        recentActivity: (activityRes.data || []) as Array<{ id: string; action_type: string; created_at: string; restaurant_id: string; metadata: Record<string, unknown> | null; restaurants: { name: string } | null }>,
        restaurantTable: Object.values(restaurantMap).sort((a, b) => b.total - a.total),
        addonLabels: ADDON_LABELS,
    };
}

// ─── REVENUE METRICS ─────────────────────────────────────────────────────────
export async function getRevenueMetrics() {
    await requireSuperAdmin();
    const supabase = await createClient();

    const [restaurantsRes, addonsRes] = await Promise.all([
        supabase
            .from("restaurants")
            .select("id, subscription_plan, subscription_status"),
        supabase
            .from("restaurant_addons")
            .select("addon_key, price_monthly")
            .eq("is_active", true),
    ]);

    const restaurants = restaurantsRes.data || [];
    const addons = addonsRes.data || [];

    const activeRestaurants = restaurants.filter(r => r.subscription_status === "active");
    const planMRR = activeRestaurants.reduce((s, r) => s + (PLAN_PRICES_USD[r.subscription_plan || "free"] || 0), 0);
    const addonMRR = addons.reduce((s, a) => s + (a.price_monthly || 0), 0);
    const totalMRR = planMRR + addonMRR;

    const planCounts = { free: 0, business: 0, pro: 0 };
    activeRestaurants.forEach(r => {
        const p = (r.subscription_plan || "free") as keyof typeof planCounts;
        if (p in planCounts) planCounts[p]++;
    });

    const payingRestaurants = planCounts.business + planCounts.pro;
    const arpu = payingRestaurants > 0 ? Math.round((totalMRR / payingRestaurants) * 100) / 100 : 0;

    const addonCounts: Record<string, number> = {};
    addons.forEach(a => { addonCounts[a.addon_key] = (addonCounts[a.addon_key] || 0) + 1; });

    return {
        totalMRR,
        planMRR,
        addonMRR,
        arpu,
        planCounts,
        addonCounts,
        totalAddons: addons.length,
        planPrices: PLAN_PRICES_USD,
        addonLabels: ADDON_LABELS,
    };
}

// ─── EARLY ADOPTERS ───────────────────────────────────────────────────────────
export async function getEarlyAdopters() {
    await requireSuperAdmin();
    const supabase = await createClient();

    const { data } = await supabase
        .from("restaurants")
        .select("id, name, slug, subscription_plan, subscription_status, is_early_adopter, locked_price, early_adopter_at, profiles!restaurants_owner_id_fkey(email, full_name)")
        .eq("is_early_adopter", true)
        .order("early_adopter_at", { ascending: false });

    return (data || []) as unknown as Array<{ id: string; name: string; slug: string; subscription_plan: string; subscription_status: string; is_early_adopter: boolean; locked_price: number | null; early_adopter_at: string | null; profiles: { email: string; full_name: string } | null }>;
}

export async function getEarlyAdopterCount() {
    await requireSuperAdmin();
    const supabase = await createClient();
    const { count } = await supabase
        .from("restaurants")
        .select("id", { count: "exact", head: true })
        .eq("is_early_adopter", true);
    return count || 0;
}

export async function flagEarlyAdopter(restaurantId: string) {
    await requireSuperAdmin();
    const supabase = await createClient();

    const { data: restaurant } = await supabase
        .from("restaurants")
        .select("subscription_plan, name")
        .eq("id", restaurantId)
        .single();

    const plan = restaurant?.subscription_plan || "free";
    const lockedPrice = EARLY_ADOPTER_PRICES[plan] ?? null;

    const { error } = await supabase
        .from("restaurants")
        .update({
            is_early_adopter: true,
            locked_price: lockedPrice,
            early_adopter_at: new Date().toISOString(),
        })
        .eq("id", restaurantId);

    if (error) return { error: error.message };

    await logActivity({
        action_type: "EARLY_ADOPTER_FLAGGED",
        description: `تم تحديد "${restaurant?.name}" كرائد أوائل — سعر مقفول $${lockedPrice}/شهر`,
        restaurant_id: restaurantId,
    });

    return { success: true, lockedPrice };
}

export async function removeEarlyAdopter(restaurantId: string) {
    await requireSuperAdmin();
    const supabase = await createClient();

    const { data: restaurant } = await supabase
        .from("restaurants")
        .select("name")
        .eq("id", restaurantId)
        .single();

    const { error } = await supabase
        .from("restaurants")
        .update({ is_early_adopter: false, locked_price: null, early_adopter_at: null })
        .eq("id", restaurantId);

    if (error) return { error: error.message };

    await logActivity({
        action_type: "EARLY_ADOPTER_REMOVED",
        description: `تم إلغاء وضع رائد الأوائل لـ "${restaurant?.name}"`,
        restaurant_id: restaurantId,
    });

    return { success: true };
}

// ─── ADDON ACTIVITY LOGS ─────────────────────────────────────────────────────
export async function getAddonActivityLogs(limit = 30) {
    await requireSuperAdmin();
    const supabase = await createClient();

    const { data } = await supabase
        .from("platform_activity_logs")
        .select("*, restaurants(name)")
        .in("action_type", ["ADDON_ACTIVATED", "ADDON_DEACTIVATED", "EARLY_ADOPTER_FLAGGED", "EARLY_ADOPTER_REMOVED"])
        .order("created_at", { ascending: false })
        .limit(limit);

    return (data || []) as any[];
}
