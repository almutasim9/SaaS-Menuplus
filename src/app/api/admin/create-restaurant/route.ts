import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
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
    const { ownerEmail, ownerPassword, ownerName, restaurantName, plan } = body;

    if (!ownerEmail || !ownerPassword || !ownerName || !restaurantName) {
        return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    // 3. Resolve slug BEFORE creating user (validate early)
    const providedSlug: string | undefined = body.slug;
    const baseSlug = (
        providedSlug?.trim()
            ? providedSlug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/(^-|-$)/g, "")
            : restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    ) || "restaurant";

    let slug = baseSlug;

    // Check slug uniqueness BEFORE creating the user
    const { data: existingSlug } = await serverSupabase
        .from("restaurants")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

    if (existingSlug) {
        if (providedSlug?.trim()) {
            return NextResponse.json(
                { error: `الرابط "${slug}" مستخدم بالفعل. اختر رابطاً آخر.` },
                { status: 400 }
            );
        }
        slug = `${baseSlug}-${Date.now().toString(36)}`;
    }

    // 4. Check email uniqueness
    const { data: existingUser } = await serverSupabase
        .from("profiles")
        .select("id, email")
        .eq("email", ownerEmail.toLowerCase().trim())
        .maybeSingle();

    if (existingUser) {
        return NextResponse.json(
            { error: `البريد "${ownerEmail}" مستخدم بالفعل. استخدم بريداً آخر.` },
            { status: 400 }
        );
    }

    // 5. Setup admin Supabase client (for user creation + rollback)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Build admin client if possible (needed for rollback)
    const adminSupabase = serviceRoleKey
        ? createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        })
        : null;

    // 5. Create auth user
    let userId: string;

    if (adminSupabase) {
        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
            email: ownerEmail,
            password: ownerPassword,
            email_confirm: true,
            user_metadata: { full_name: ownerName },
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }
        userId = authData.user.id;
    } else {
        // Fallback: direct Supabase Auth API
        const signupRes = await fetch(`${supabaseUrl}/auth/v1/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            },
            body: JSON.stringify({
                email: ownerEmail,
                password: ownerPassword,
                data: { full_name: ownerName },
            }),
        });

        const signupResult = await signupRes.json();

        if (!signupRes.ok || !signupResult.id) {
            return NextResponse.json(
                { error: signupResult.error_description || signupResult.msg || "فشل إنشاء الحساب" },
                { status: 400 }
            );
        }
        userId = signupResult.id;
    }

    // Helper: rollback — delete the auth user if anything below fails
    const rollbackUser = async () => {
        if (adminSupabase) {
            await adminSupabase.auth.admin.deleteUser(userId);
        }
        // Without service role key we can't delete, but we log it
        console.error(`[ROLLBACK NEEDED] Orphan user created: ${userId} (${ownerEmail}). Delete manually in Supabase Auth.`);
    };

    // DB client: use admin client (bypasses RLS) when available, else fallback
    const dbClient = adminSupabase || serverSupabase;

    // 6. Plan limits
    const planConfig: Record<string, { max_products: number; max_orders_per_month: number }> = {
        free: { max_products: 15, max_orders_per_month: 50 },
        pro: { max_products: 100, max_orders_per_month: 500 },
        business: { max_products: 999999, max_orders_per_month: 999999 },
    };
    const limits = planConfig[plan || "free"] || planConfig.free;

    // 7. Create restaurant
    const { data: restaurant, error: restaurantError } = await dbClient
        .from("restaurants")
        .insert({
            name: restaurantName,
            slug,
            owner_id: userId,
            subscription_plan: plan || "free",
            subscription_status: "active",
            max_products: limits.max_products,
            max_orders_per_month: limits.max_orders_per_month,
        })
        .select()
        .single();

    if (restaurantError) {
        await rollbackUser();
        return NextResponse.json(
            { error: `فشل إنشاء المطعم: ${restaurantError.message}` },
            { status: 500 }
        );
    }

    // 8. Link profile to restaurant
    const { error: profileError } = await dbClient
        .from("profiles")
        .update({
            restaurant_id: restaurant.id,
            full_name: ownerName,
            role: "owner",
        })
        .eq("id", userId);

    if (profileError) {
        // Rollback: delete both restaurant and user
        await dbClient.from("restaurants").delete().eq("id", restaurant.id);
        await rollbackUser();
        return NextResponse.json(
            { error: `فشل ربط الحساب بالمطعم: ${profileError.message}` },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true, restaurant });
}
