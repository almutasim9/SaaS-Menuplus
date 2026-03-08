import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "No user" }, { status: 401 });

        // Let's test just the profile fetch first
        const { data: profile, error: profileErr } = await supabase
            .from("profiles")
            .select("*, restaurants(*)")
            .eq("id", user.id)
            .single();

        if (profileErr) return NextResponse.json({ error: "Profile fetch failed", details: profileErr });

        return NextResponse.json({ profile });
    } catch (e: any) {
        return NextResponse.json({ error: "Caught Exception", message: e.message }, { status: 500 });
    }
}
