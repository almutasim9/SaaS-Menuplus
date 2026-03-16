import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { RATE_LIMITS } from "@/lib/constants";

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiter: max 30 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = RATE_LIMITS.PUBLIC_API_PER_MIN;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return true;
    }
    if (entry.count >= RATE_LIMIT) return false;
    entry.count++;
    return true;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const ip = (request.headers as Headers).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!checkRateLimit(ip)) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { slug } = await params;
    const supabase = await createClient();

    // Select only core columns first to avoid 500 errors if migrations are pending
    const { data: restaurant, error } = await supabase
        .from("restaurants")
        .select("id, name, slug, primary_color, is_dine_in_enabled, is_takeaway_enabled, is_delivery_enabled, is_free_delivery, whatsapp_number, is_whatsapp_ordering_enabled, governorate, city, accept_out_of_zone_orders")
        .eq("slug", slug)
        .single();

    if (error) {
        // Fallback for un-migrated databases without the new WhatsApp/Delivery columns
        const { data: fallbackRestaurant, error: fallbackError } = await supabase
            .from("restaurants")
            .select("id, name, slug, primary_color")
            .eq("slug", slug)
            .single();

        if (fallbackError || !fallbackRestaurant) {
            return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
        }

        return NextResponse.json({
            ...fallbackRestaurant,
            is_dine_in_enabled: true,
            is_takeaway_enabled: true,
            is_delivery_enabled: true,
            is_free_delivery: false,
            whatsapp_number: null,
            is_whatsapp_ordering_enabled: false,
            accept_out_of_zone_orders: false
        });
    }

    if (!restaurant) {
        return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Fetch categories and products for full menu (useful for Flutter/PWA)
    const [categoriesRes, productsRes] = await Promise.all([
        supabase
            .from("categories")
            .select("id, name, name_en, name_ku, sort_order, is_hidden")
            .eq("restaurant_id", restaurant.id)
            .eq("is_hidden", false)
            .is("deleted_at", null)
            .order("sort_order", { ascending: true }),
        supabase
            .from("products")
            .select("id, name, name_en, name_ku, description, description_en, description_ku, price, image_url, category_id, is_available, product_variants(id, name, name_en, name_ku, price, is_available), product_addons(id, name, name_en, name_ku, price, is_required, max_selections)")
            .eq("restaurant_id", restaurant.id)
            .eq("is_available", true)
            .is("deleted_at", null)
            .order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
        ...restaurant,
        categories: categoriesRes.data || [],
        products: productsRes.data || []
    });
}
