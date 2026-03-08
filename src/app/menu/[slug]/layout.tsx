import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { QueryProvider } from "@/components/providers/QueryProvider";

export const dynamic = 'force-dynamic';

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
