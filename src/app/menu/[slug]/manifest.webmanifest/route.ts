import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: restaurant } = await supabase
        .from("restaurants")
        .select("name, slug, logo_url, primary_color")
        .eq("slug", slug)
        .single();

    if (!restaurant) {
        return new NextResponse("Not found", { status: 404 });
    }

    const themeColor = restaurant.primary_color || "#10b981";
    const icons = restaurant.logo_url
        ? [
            { src: restaurant.logo_url, sizes: "192x192", type: "image/png" },
            { src: restaurant.logo_url, sizes: "512x512", type: "image/png" },
        ]
        : [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ];

    const manifest = {
        name: restaurant.name,
        short_name: restaurant.name,
        description: `قائمة طعام ${restaurant.name}`,
        start_url: `/menu/${slug}`,
        display: "standalone",
        background_color: "#ffffff",
        theme_color: themeColor,
        orientation: "portrait",
        icons,
    };

    return NextResponse.json(manifest, {
        headers: { "Content-Type": "application/manifest+json" },
    });
}
