"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { checkLimitAccess } from "@/lib/actions/subscription";

export async function getCoupons(restaurantId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

export async function createCoupon(formData: FormData) {
    const restaurantId = formData.get("restaurant_id") as string;

    // --- Feature Gating: Check coupon limit ---
    if (restaurantId) {
        const limit = await checkLimitAccess(restaurantId, "coupons");
        if (!limit.allowed) {
            throw new Error(`لقد وصلت للحد الأقصى من الكوبونات (${limit.max}). قم بترقية خطتك لإضافة المزيد.`);
        }
    }
    // --- End Feature Gating ---

    const supabase = await createClient();

    const isGlobal = formData.get("is_global") === "true";
    const rawCode = formData.get("code") as string | null;
    const code = rawCode ? rawCode.toUpperCase() : `GLOBAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const discountType = formData.get("discount_type") as "percentage" | "fixed" | "free_delivery";
    const discountValue = parseFloat(formData.get("discount_value") as string) || 0;
    const appliesTo = formData.get("applies_to") as "cart" | "product";
    const productId = formData.get("product_id") as string | null;
    const minOrder = formData.get("min_order") ? parseFloat(formData.get("min_order") as string) : null;
    const maxUses = formData.get("max_uses") ? parseInt(formData.get("max_uses") as string) : null;
    const expiresAt = formData.get("expires_at") as string | null;

    const { data, error } = await supabase
        .from("coupons")
        .insert({
            restaurant_id: restaurantId,
            code,
            discount_type: discountType,
            discount_value: discountValue,
            is_global: isGlobal,
            applies_to: appliesTo,
            product_id: productId || null,
            min_order: minOrder,
            max_uses: maxUses,
            expires_at: expiresAt || null,
        })
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/dashboard/discounts");
    return data;
}

export async function updateCoupon(id: string, formData: FormData) {
    const supabase = await createClient();

    const code = (formData.get("code") as string).toUpperCase();
    const discountType = formData.get("discount_type") as "percentage" | "fixed" | "free_delivery";
    const discountValue = parseFloat(formData.get("discount_value") as string) || 0;
    const isGlobal = formData.get("is_global") === "true";
    const appliesTo = formData.get("applies_to") as "cart" | "product";
    const productId = formData.get("product_id") as string | null;
    const minOrder = formData.get("min_order") ? parseFloat(formData.get("min_order") as string) : null;
    const maxUses = formData.get("max_uses") ? parseInt(formData.get("max_uses") as string) : null;
    const expiresAt = formData.get("expires_at") as string | null;
    const isActive = formData.get("is_active") === "true";

    const { data, error } = await supabase
        .from("coupons")
        .update({
            code,
            discount_type: discountType,
            discount_value: discountValue,
            is_global: isGlobal,
            applies_to: appliesTo,
            product_id: productId || null,
            min_order: minOrder,
            max_uses: maxUses,
            expires_at: expiresAt || null,
            is_active: isActive,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/dashboard/discounts");
    return data;
}

export async function deleteCoupon(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("coupons")
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq("id", id);
    if (error) throw error;
    revalidatePath("/dashboard/discounts");
}

export async function validateCoupon(restaurantId: string, code: string, cartTotal: number) {
    const supabase = await createClient();
    const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .is("deleted_at", null)
        .single();

    if (error || !coupon) return { valid: false, message: "Invalid coupon code" };

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return { valid: false, message: "Coupon has expired" };
    }

    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        return { valid: false, message: "Coupon usage limit reached" };
    }

    if (coupon.min_order && cartTotal < coupon.min_order) {
        return { valid: false, message: `الحد الأدنى للطلب هو ${coupon.min_order} د.ع` };
    }

    let discount = 0;
    if (coupon.discount_type === "percentage" && cartTotal) {
        discount = (cartTotal * coupon.discount_value) / 100;
    } else if (coupon.discount_type === "fixed") {
        discount = coupon.discount_value;
    } else if (coupon.discount_type === "free_delivery") {
        discount = 0; // Free delivery is handled separately by the frontend
    }

    return { valid: true, discount, coupon };
}
