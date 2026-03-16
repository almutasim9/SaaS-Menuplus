"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { checkLimitAccess } from "@/lib/actions/subscription";
import { requireRestaurantOwnership, requireAuth } from "@/lib/actions/_auth-guard";
import { couponSchema } from "@/lib/validations/schemas";

export async function getCoupons(restaurantId: string) {
    await requireRestaurantOwnership(restaurantId);

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

    // Auth + Ownership check
    await requireRestaurantOwnership(restaurantId);

    // --- Feature Gating: Check coupon limit ---
    const limit = await checkLimitAccess(restaurantId, "coupons");
    if (!limit.allowed) {
        throw new Error(`لقد وصلت للحد الأقصى من الكوبونات (${limit.max}). قم بترقية خطتك لإضافة المزيد.`);
    }

    const isGlobal = formData.get("is_global") === "true";
    const rawCode = formData.get("code") as string | null;
    const code = rawCode ? rawCode.toUpperCase().trim() : `GLOBAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const discountType = formData.get("discount_type") as "percentage" | "fixed" | "free_delivery";
    const discountValue = parseFloat(formData.get("discount_value") as string) || 0;
    const appliesTo = (formData.get("applies_to") as "cart" | "product") || "cart";
    const productId = formData.get("product_id") as string | null;
    const minOrder = formData.get("min_order") ? parseFloat(formData.get("min_order") as string) : null;
    const maxUses = formData.get("max_uses") ? parseInt(formData.get("max_uses") as string) : null;
    const expiresAt = formData.get("expires_at") as string | null;

    // Validate with Zod schema
    const validated = couponSchema.parse({
        restaurant_id: restaurantId,
        code,
        discount_type: discountType,
        discount_value: discountValue,
        applies_to: appliesTo,
        product_id: productId || null,
        min_order: minOrder,
        max_uses: maxUses,
        expires_at: expiresAt || null,
        is_global: isGlobal,
    });

    const supabase = await createClient();
    const { data, error } = await supabase
        .from("coupons")
        .insert({
            restaurant_id: validated.restaurant_id,
            code: validated.code || code,
            discount_type: validated.discount_type,
            discount_value: validated.discount_value,
            is_global: validated.is_global,
            applies_to: validated.applies_to,
            product_id: validated.product_id || null,
            min_order: validated.min_order,
            max_uses: validated.max_uses,
            expires_at: validated.expires_at || null,
        })
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/dashboard/discounts");
    return data;
}

export async function updateCoupon(id: string, formData: FormData) {
    const restaurantId = formData.get("restaurant_id") as string;

    // Auth + Ownership check
    await requireRestaurantOwnership(restaurantId);

    const code = (formData.get("code") as string).toUpperCase().trim();
    const discountType = formData.get("discount_type") as "percentage" | "fixed" | "free_delivery";
    const discountValue = parseFloat(formData.get("discount_value") as string) || 0;
    const isGlobal = formData.get("is_global") === "true";
    const appliesTo = (formData.get("applies_to") as "cart" | "product") || "cart";
    const productId = formData.get("product_id") as string | null;
    const minOrder = formData.get("min_order") ? parseFloat(formData.get("min_order") as string) : null;
    const maxUses = formData.get("max_uses") ? parseInt(formData.get("max_uses") as string) : null;
    const expiresAt = formData.get("expires_at") as string | null;
    const isActive = formData.get("is_active") === "true";

    // Validate with Zod schema
    const validated = couponSchema.parse({
        restaurant_id: restaurantId,
        code,
        discount_type: discountType,
        discount_value: discountValue,
        applies_to: appliesTo,
        product_id: productId || null,
        min_order: minOrder,
        max_uses: maxUses,
        expires_at: expiresAt || null,
        is_global: isGlobal,
        is_active: isActive,
    });

    const supabase = await createClient();
    const { data, error } = await supabase
        .from("coupons")
        .update({
            code: validated.code || code,
            discount_type: validated.discount_type,
            discount_value: validated.discount_value,
            is_global: validated.is_global,
            applies_to: validated.applies_to,
            product_id: validated.product_id || null,
            min_order: validated.min_order,
            max_uses: validated.max_uses,
            expires_at: validated.expires_at || null,
            is_active: validated.is_active,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/dashboard/discounts");
    return data;
}

export async function deleteCoupon(id: string) {
    await requireAuth();

    const supabase = await createClient();
    const { error } = await supabase
        .from("coupons")
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq("id", id);
    if (error) throw error;
    revalidatePath("/dashboard/discounts");
}

export async function validateCoupon(restaurantId: string, code: string, cartTotal: number) {
    // This is a public action (called from storefront), no auth required
    const supabase = await createClient();
    const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("code", code.toUpperCase().trim())
        .eq("is_active", true)
        .is("deleted_at", null)
        .single();

    if (error || !coupon) return { valid: false, message: "كود الخصم غير صالح" };

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return { valid: false, message: "انتهت صلاحية كود الخصم" };
    }

    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        return { valid: false, message: "تم استخدام كود الخصم بالحد الأقصى" };
    }

    if (coupon.min_order && cartTotal < coupon.min_order) {
        return { valid: false, message: `الحد الأدنى للطلب هو ${coupon.min_order} د.ع` };
    }

    // Calculate discount server-side — never trust client calculation
    let discount = 0;
    if (coupon.discount_type === "percentage" && cartTotal) {
        discount = (cartTotal * coupon.discount_value) / 100;
    } else if (coupon.discount_type === "fixed") {
        discount = Math.min(coupon.discount_value, cartTotal);
    } else if (coupon.discount_type === "free_delivery") {
        discount = 0; // Signal free delivery — handled in order creation server-side
    }

    return { valid: true, discount, coupon };
}
