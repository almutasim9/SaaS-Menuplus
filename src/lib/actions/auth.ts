"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signUpSchema } from "@/lib/validations/schemas";
import { z } from "zod";
import { PLAN_LIMITS } from "@/lib/constants";

export async function signUp(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const restaurantName = formData.get("restaurantName") as string;
    const plan = (formData.get("plan") as string) || "free";

    // Validate password strength and email format
    try {
        signUpSchema.parse({ email, password, name: fullName });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return { error: e.issues[0].message };
        }
        return { error: "بيانات غير صالحة" };
    }

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
        const planConfig = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

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
    return { success: true };
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

import { headers } from "next/headers";

export async function forgotPassword(email: string) {
    const headerList = await headers();
    const host = headerList.get("host");
    const protocol = headerList.get("x-forwarded-proto") || "http";
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/auth/callback?next=/reset-password`,
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
