import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { restaurantId, source } = body;

        if (!restaurantId) {
            return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
        }

        const validSource = source === "qr" ? "qr" : "direct";

        // Use anon key — RLS allows public inserts
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        await supabase.from("visits").insert({
            restaurant_id: restaurantId,
            source: validSource,
        });

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
