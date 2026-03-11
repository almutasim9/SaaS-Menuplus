import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { MenuPageClient } from "./menu-client";

export default async function MenuPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const supabase = await createClient();

    // Fetch restaurant
    const { data: restaurant } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .single();

    if (!restaurant) notFound();

    // Fetch categories and products
    const [categoriesRes, productsRes] = await Promise.all([
        supabase
            .from("categories")
            .select("*")
            .eq("restaurant_id", restaurant.id)
            .eq("is_hidden", false)
            .is("deleted_at", null)
            .order("sort_order", { ascending: true }),
        supabase
            .from("products")
            .select("*, product_variants(*), product_addons(*), product_availability(*)")
            .eq("restaurant_id", restaurant.id)
            .eq("is_available", true)
            .is("deleted_at", null)
            .order("created_at", { ascending: false }),
    ]);

    return (
        <MenuPageClient
            restaurant={restaurant}
            categories={categoriesRes.data || []}
            products={productsRes.data || []}
            slug={slug}
        />
    );
}
