"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createOrderSchema } from "@/lib/validations/schemas";
import { z } from "zod";
import { checkLimitAccess } from "@/lib/actions/subscription";

export async function getOrders(restaurantId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createOrder(orderData: any) {
    try {
        const validatedData = createOrderSchema.parse(orderData);

        // --- Feature Gating: Check order limit ---
        const limit = await checkLimitAccess(validatedData.restaurant_id, "orders");
        if (!limit.allowed) {
            throw new Error(`هذا المطعم وصل للحد الأقصى من الطلبات الشهرية (${limit.max}). يرجى التواصل مع صاحب المطعم.`);
        }
        // --- End Feature Gating ---

        const supabase = await createClient();

        // ----------------------------------------------------
        // Rate Limiting (Spam Prevention)
        // ----------------------------------------------------
        if (validatedData.customer_phone) {
            // Check if there's an order with the same phone in the last 2 minutes
            const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

            const { count, error: countError } = await supabase
                .from("orders")
                .select("*", { count: 'exact', head: true })
                .eq("restaurant_id", validatedData.restaurant_id)
                .eq("customer_phone", validatedData.customer_phone)
                .gte("created_at", twoMinutesAgo);

            if (!countError && count && count >= 2) { // Max 2 orders per 2 minutes
                throw new Error("عذراً، لقد قمت بإرسال طلبات كثيرة. يرجى الانتظار قليلاً قبل المحاولة مرة أخرى.");
            }
        }
        // ----------------------------------------------------

        const { data, error } = await supabase
            .from("orders")
            .insert(validatedData)
            .select()
            .single();

        if (error) throw error;

        // Insert into order_items table for Analytics
        if (data && validatedData.items && Array.isArray(validatedData.items)) {
            const orderItemsInsert = validatedData.items.map((item: any) => ({
                order_id: data.id,
                product_id: item.id || null, // Might be null if it's a custom fee or something, but usually a product ID
                quantity: item.quantity,
                unit_price: item.price,
                item_name: item.name,
                variant_details: {
                    variant: item.variant || null,
                    addons: item.addons || []
                }
            }));

            const { error: itemsError } = await supabase
                .from("order_items")
                .insert(orderItemsInsert);

            if (itemsError) {
                console.error("[Superbase Error inserting order items]", itemsError);
                // We don't throw an error here to prevent failing the entire order if only analytics fails,
                // but in a strict system we might want to rollback the order.
            }

            // Decrement Stock for each item using the RPC
            for (const item of validatedData.items) {
                if (item.id) {
                    const { error: stockError } = await supabase.rpc("decrement_stock", {
                        p_product_id: item.id,
                        p_quantity: item.quantity
                    });

                    if (stockError) {
                        console.error(`[RPC Error decrement_stock for product ${item.id}]`, stockError);
                        // Similar to analytics, we log it. If a strict e-commerce block is needed, 
                        // this should happen before the initial order insertion.
                    }
                }
            }
        }

        // Increment coupon usage using the atomic RPC
        if (orderData.coupon_code) {
            const { error: rpcError } = await supabase.rpc("apply_coupon_transaction", {
                p_coupon_code: orderData.coupon_code,
                p_restaurant_id: orderData.restaurant_id
            });

            if (rpcError) {
                console.error("[RPC Error apply_coupon_transaction]", rpcError);
                // We don't fail the order if coupon fails post-insertion,
                // but we log it. Ideally, validation happens before inserting the order.
            }
        }

        return data;
    } catch (e: any) {
        if (e instanceof z.ZodError) {
            console.error("[Zod Validation Error createOrder]", e.issues);
            throw new Error(`Validation failed: ${e.issues[0].message}`);
        }
        console.error("[Server Action Error createOrder]", e);
        throw new Error(e.message || "Internal Server Error");
    }
}

export async function updateOrderStatus(id: string, status: string) {
    try {
        const validatedStatus = z.enum(['pending', 'confirmed', 'preparing', 'delivered', 'cancelled', 'completed', 'rejected']).parse(status);

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await supabase
            .from("orders")
            .update({ status } as any)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("[Superbase Error updateOrderStatus]", error);
            throw new Error(error.message || "Failed to update order status in DB");
        }
        revalidatePath("/dashboard");
        return data;
    } catch (e: any) {
        if (e instanceof z.ZodError) {
            throw new Error(`Invalid status: ${status}`);
        }
        console.error("[Server Action Error updateOrderStatus]", e);
        throw new Error(e.message || "Internal Server Error");
    }
}
