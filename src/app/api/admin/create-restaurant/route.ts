import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { RestaurantService } from "@/lib/services/restaurant.service";
import { createRestaurantSchema } from "@/lib/validations/restaurant";
import { z } from "zod";

export async function POST(request: NextRequest) {
    try {
        // 1. Verify the caller is a super_admin
        const serverSupabase = await createServerClient();
        const { data: { user } } = await serverSupabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const { data: profile } = await serverSupabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "super_admin") {
            return NextResponse.json({ error: "صلاحيات غير كافية" }, { status: 403 });
        }

        // 2. Parse & validate request body
        const body = await request.json();
        const validatedData = createRestaurantSchema.parse(body);

        // 3. Delegate to service layer
        const restaurant = await RestaurantService.createRestaurant(validatedData);

        return NextResponse.json({ success: true, restaurant });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "فشل إنشاء المطعم" },
            { status: 400 }
        );
    }
}
