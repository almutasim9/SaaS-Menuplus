import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Protect dashboard routes
    if (!user && pathname.startsWith("/dashboard")) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // Redirect super_admin from /dashboard to /admin
    if (user && pathname.startsWith("/dashboard")) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role === "super_admin") {
            const url = request.nextUrl.clone();
            url.pathname = "/admin";
            return NextResponse.redirect(url);
        }
    }

    // Protect admin routes — only super_admin role
    if (pathname.startsWith("/admin")) {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            return NextResponse.redirect(url);
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (!profile || profile.role !== "super_admin") {
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard";
            return NextResponse.redirect(url);
        }
    }

    // Subscription expiry check for dashboard (except billing page)
    if (user && pathname.startsWith("/dashboard") && !pathname.startsWith("/dashboard/billing")) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("restaurant_id")
            .eq("id", user.id)
            .single();

        if (profile?.restaurant_id) {
            const { data: restaurant } = await supabase
                .from("restaurants")
                .select("subscription_status")
                .eq("id", profile.restaurant_id)
                .single();

            if (restaurant?.subscription_status === "expired") {
                const url = request.nextUrl.clone();
                url.pathname = "/dashboard/billing";
                return NextResponse.redirect(url);
            }
        }
    }

    // Redirect authenticated users away from auth pages
    if (user && (pathname === "/login" || pathname === "/signup")) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

