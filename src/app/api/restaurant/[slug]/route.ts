import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const supabase = await createClient();

    // Select only core columns first to avoid 500 errors if migrations are pending
    const { data: restaurant, error } = await supabase
        .from("restaurants")
        .select("id, name, slug, primary_color, is_dine_in_enabled, is_takeaway_enabled, is_delivery_enabled, is_free_delivery, whatsapp_number, is_whatsapp_ordering_enabled")
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
            is_whatsapp_ordering_enabled: false
        });
    }

    if (!restaurant) {
        return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    return NextResponse.json(restaurant);
}
