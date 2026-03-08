"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const restaurantName = formData.get("restaurantName") as string;
    const plan = (formData.get("plan") as string) || "free";

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName },
        },
    });

    if (authError) {
        return { error: authError.message };
    }

    if (authData.user) {
        // Generate slug with collision detection
        const baseSlug = restaurantName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
            || "restaurant";

        let slug = baseSlug;
        let attempts = 0;

        // Check for slug collisions up to 5 times
        while (attempts < 5) {
            const { data: existing } = await supabase
                .from("restaurants")
                .select("id")
                .eq("slug", slug)
                .maybeSingle();

            if (!existing) break; // Slug is unique
            slug = `${baseSlug}-${Date.now().toString(36)}`;
            attempts++;
        }

        // Plan-based limits
        const planConfig = {
            free: { max_products: 15, max_orders_per_month: 50 },
            pro: { max_products: 100, max_orders_per_month: 500 },
            business: { max_products: 999999, max_orders_per_month: 999999 },
        }[plan] || { max_products: 15, max_orders_per_month: 50 };

        const { data: restaurant, error: restaurantError } = await supabase
            .from("restaurants")
            .insert({
                name: restaurantName,
                slug,
                owner_id: authData.user.id,
            })
            .select()
            .single();

        if (restaurantError) {
            return { error: restaurantError.message };
        }

        // Update profile with restaurant_id
        await supabase
            .from("profiles")
            .update({ restaurant_id: restaurant.id })
            .eq("id", authData.user.id);
    }

    redirect("/dashboard");
}

export async function signIn(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    redirect("/dashboard");
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
}

export async function getSession() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function getProfile() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("*, restaurants(*)")
        .eq("id", user.id)
        .single();

    return profile;
}

export async function forgotPassword(email: string) {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`,
    });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

export async function resetPassword(password: string) {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
        password: password,
    });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}
