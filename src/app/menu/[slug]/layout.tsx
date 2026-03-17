import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { QueryProvider } from "@/components/providers/QueryProvider";
import type { Metadata, Viewport } from "next";

export const dynamic = 'force-dynamic';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;

    return {
        manifest: `/menu/${slug}/manifest.webmanifest`,
    };
}

export async function generateViewport({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Viewport> {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: restaurant } = await supabase
        .from("restaurants")
        .select("primary_color")
        .eq("slug", slug)
        .single();

    return {
        themeColor: restaurant?.primary_color || "#10b981",
    };
}

export default async function MenuLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: restaurant } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .single();

    if (!restaurant) notFound();

    return (
        <QueryProvider>
            <div className="min-h-screen bg-background">
                {children}
            </div>
        </QueryProvider>
    );
}
