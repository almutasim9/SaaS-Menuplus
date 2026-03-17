"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createOrderSchema } from "@/lib/validations/schemas";
import { z } from "zod";
import { checkLimitAccess } from "@/lib/actions/subscription";
import { headers } from "next/headers";
import { sendPushNotification } from "@/lib/supabase/firebase-admin";
import { requireRestaurantOwnership } from "@/lib/actions/_auth-guard";
import { RATE_LIMITS } from "@/lib/constants";
import { isProductCurrentlyAvailable } from "@/lib/utils/availability";

export async function getOrders(restaurantId: string) {
    // Ensure the caller owns this restaurant
    await requireRestaurantOwnership(restaurantId);

    const supabase = await createClient();
    const { data, error } = await supabase
        .from("orders")
        .select("id, restaurant_id, order_type, status, subtotal, discount_amount, delivery_fee, total, table_number, customer_name, customer_phone, customer_address, coupon_code, created_at, number_of_people, area_name, nearest_landmark, car_details, order_items(id, product_id, quantity, unit_price, item_name, variant_details)")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map(order => ({
        ...order,
        items: ((order.order_items as unknown as Array<{ product_id: string; item_name: string; unit_price: number; quantity: number; variant_details?: Record<string, unknown> }>) || []).map(item => ({
            id: item.product_id,
            name: item.item_name,
            price: item.unit_price,
            quantity: item.quantity,
            ...(item.variant_details || {})
        }))
    }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createOrder(orderData: any) {
    try {
        const validatedData = createOrderSchema.parse(orderData);
        const headersList = await headers();
        const clientIp = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';

        // --- Feature Gating: Check order limit ---
        const limit = await checkLimitAccess(validatedData.restaurant_id, "orders");
        if (!limit.allowed) {
            throw new Error(`هذا المطعم وصل للحد الأقصى من الطلبات الشهرية (${limit.max}). يرجى التواصل مع صاحب المطعم.`);
        }

        const adminClient = createAdminClient();

        // --- Rate Limiting (Spam Prevention) ---
        if (clientIp !== 'unknown') {
            const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
            const { count, error: ipCountError } = await adminClient
                .from("orders")
                .select("*", { count: 'exact', head: true })
                .eq("restaurant_id", validatedData.restaurant_id)
                .eq("client_ip", clientIp)
                .gte("created_at", fifteenMinsAgo);

            if (!ipCountError && count && count >= RATE_LIMITS.IP_ORDERS_PER_15_MIN) {
                throw new Error("لقد تجاوزت الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.");
            }
        }

        if (validatedData.customer_phone && validatedData.customer_phone !== "N/A" && validatedData.customer_phone.trim() !== "") {
            const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
            const { count, error: countError } = await adminClient
                .from("orders")
                .select("*", { count: 'exact', head: true })
                .eq("restaurant_id", validatedData.restaurant_id)
                .eq("customer_phone", validatedData.customer_phone)
                .gte("created_at", twoMinutesAgo);

            if (!countError && count && count >= RATE_LIMITS.PHONE_ORDERS_PER_2_MIN) {
                throw new Error("عذراً، لقد قمت بإرسال طلبات كثيرة. يرجى الانتظار قليلاً قبل المحاولة مرة أخرى.");
            }
        }
        // --- End Rate Limiting ---

        // -------------------------------------------------------
        // SERVER-SIDE PRICE VERIFICATION
        // Never trust prices sent from the client — always recalculate from DB.
        // -------------------------------------------------------
        const productIds = validatedData.items
            .map((item: any) => item.id)
            .filter(Boolean);

        // Fetch all products for this restaurant in one query (including availability schedule)
        const { data: dbProducts, error: productsError } = await adminClient
            .from("products")
            .select("id, price, name, is_available, product_availability(*)")
            .in("id", productIds)
            .eq("restaurant_id", validatedData.restaurant_id)
            .is("deleted_at", null);

        if (productsError) throw new Error("فشل في التحقق من المنتجات");
        if (!dbProducts || dbProducts.length === 0) {
            throw new Error("المنتجات المطلوبة غير موجودة");
        }

        // --- Availability check: reject if any item is unavailable at this moment ---
        const unavailableItems: string[] = [];
        for (const item of validatedData.items) {
            const dbProduct = dbProducts.find((p: any) => p.id === item.id);
            if (!dbProduct) continue;

            const isUnavailable = !dbProduct.is_available;
            const { isAvailable: isScheduled } = isProductCurrentlyAvailable(
                (dbProduct as any).product_availability ?? []
            );

            if (isUnavailable || !isScheduled) {
                unavailableItems.push(dbProduct.name);
            }
        }
        if (unavailableItems.length > 0) {
            throw new Error(
                `ITEMS_UNAVAILABLE:${unavailableItems.join(",")}`
            );
        }

        // Fetch all variants and addons for the requested products
        const variantIds = validatedData.items
            .map((item: any) => item.variant?.id)
            .filter(Boolean);

        const addonIds = validatedData.items
            .flatMap((item: any) => (item.addons || []).map((a: any) => a.id))
            .filter(Boolean);

        const [variantsResult, addonsResult] = await Promise.all([
            variantIds.length > 0
                ? adminClient.from("product_variants").select("id, price").in("id", variantIds)
                : Promise.resolve({ data: [], error: null }),
            addonIds.length > 0
                ? adminClient.from("product_addons").select("id, price").in("id", addonIds)
                : Promise.resolve({ data: [], error: null }),
        ]);

        const dbVariantsMap = new Map((variantsResult.data || []).map((v: any) => [v.id, v.price]));
        const dbAddonsMap = new Map((addonsResult.data || []).map((a: any) => [a.id, a.price]));
        const dbProductsMap = new Map(dbProducts.map((p: any) => [p.id, p]));

        // Calculate server-side subtotal
        let calculatedSubtotal = 0;
        const verifiedItems: any[] = [];

        for (const item of validatedData.items) {
            const dbProduct = dbProductsMap.get(item.id);
            if (!dbProduct) {
                throw new Error(`المنتج غير موجود أو لا ينتمي لهذا المطعم`);
            }

            let itemPrice = dbProduct.price;

            // Add variant price from DB — reject if variant was deleted
            if (item.variant?.id) {
                const variantPrice = dbVariantsMap.get(item.variant.id);
                if (variantPrice === undefined) {
                    throw new Error("ITEMS_MODIFIED");
                }
                itemPrice += variantPrice;
            }

            // Add addons price from DB — reject if any addon was deleted
            if (item.addons && item.addons.length > 0) {
                for (const addon of item.addons) {
                    if (addon.id) {
                        const addonPrice = dbAddonsMap.get(addon.id);
                        if (addonPrice === undefined) {
                            throw new Error("ITEMS_MODIFIED");
                        }
                        itemPrice += addonPrice;
                    }
                }
            }

            calculatedSubtotal += itemPrice * item.quantity;
            verifiedItems.push({ ...item, price: itemPrice });
        }

        // Calculate delivery fee from DB (not from client)
        let calculatedDeliveryFee = 0;
        if (validatedData.order_type === 'delivery' && validatedData.area_name) {
            const { data: deliveryArea } = await adminClient
                .from("delivery_areas")
                .select("zone_id, delivery_zones!inner(flat_rate, free_delivery_threshold, min_order_amount, is_active, restaurant_id)")
                .eq("area_name", validatedData.area_name)
                .eq("delivery_zones.restaurant_id", validatedData.restaurant_id)
                .maybeSingle();

            if (deliveryArea) {
                const zone = (deliveryArea as any).delivery_zones;
                if (zone?.is_active) {
                    const threshold = zone.free_delivery_threshold;
                    if (!threshold || calculatedSubtotal < threshold) {
                        calculatedDeliveryFee = zone.flat_rate || 0;
                    }
                    // Min order check
                    const minOrder = zone.min_order_amount || 0;
                    if (minOrder > 0 && calculatedSubtotal < minOrder) {
                        throw new Error(`الحد الأدنى للطلب في هذه المنطقة هو ${minOrder} د.ع`);
                    }
                }
            } else {
                // Area not in any zone — check out_of_zone settings
                const { data: restaurant } = await adminClient
                    .from("restaurants")
                    .select("accept_out_of_zone_orders, out_of_zone_min_order, is_free_delivery")
                    .eq("id", validatedData.restaurant_id)
                    .single();

                if (!restaurant?.accept_out_of_zone_orders) {
                    throw new Error("عذراً، منطقتك خارج نطاق التوصيل");
                }
                const outOfZoneMin = restaurant.out_of_zone_min_order || 0;
                if (outOfZoneMin > 0 && calculatedSubtotal < outOfZoneMin) {
                    throw new Error(`الحد الأدنى للطلب خارج النطاق هو ${outOfZoneMin} د.ع`);
                }
                // Out-of-zone delivery fee stays 0 (or could be configurable)
            }

            // Check global free delivery toggle
            const { data: restFreeDelivery } = await adminClient
                .from("restaurants")
                .select("is_free_delivery")
                .eq("id", validatedData.restaurant_id)
                .single();

            if (restFreeDelivery?.is_free_delivery) {
                calculatedDeliveryFee = 0;
            }
        }

        // Calculate discount from DB via validateCoupon server logic (not from client)
        let calculatedDiscount = 0;
        if (validatedData.coupon_code) {
            const { data: coupon } = await adminClient
                .from("coupons")
                .select("*")
                .eq("restaurant_id", validatedData.restaurant_id)
                .eq("code", validatedData.coupon_code.toUpperCase())
                .eq("is_active", true)
                .is("deleted_at", null)
                .single();

            if (coupon) {
                const now = new Date();
                const notExpired = !coupon.expires_at || new Date(coupon.expires_at) >= now;
                const underLimit = !coupon.max_uses || coupon.used_count < coupon.max_uses;
                const meetsMinOrder = !coupon.min_order || calculatedSubtotal >= coupon.min_order;

                if (notExpired && underLimit && meetsMinOrder) {
                    if (coupon.discount_type === "percentage") {
                        calculatedDiscount = (calculatedSubtotal * coupon.discount_value) / 100;
                    } else if (coupon.discount_type === "fixed") {
                        calculatedDiscount = Math.min(coupon.discount_value, calculatedSubtotal);
                    } else if (coupon.discount_type === "free_delivery") {
                        calculatedDeliveryFee = 0;
                    }
                }
            }
        }

        const calculatedTotal = Math.max(0, calculatedSubtotal - calculatedDiscount + calculatedDeliveryFee);

        // --- COUPON: Increment BEFORE order creation to prevent silent bypass ---
        // If coupon increment fails here, we throw and no order is created.
        // If order creation later fails, we decrement to compensate.
        let couponWasIncremented = false;
        if (validatedData.coupon_code && calculatedDiscount > 0) {
            const { error: couponRpcError } = await adminClient.rpc("apply_coupon_transaction", {
                p_coupon_code: validatedData.coupon_code,
                p_restaurant_id: validatedData.restaurant_id,
            });
            if (couponRpcError) {
                console.error("[RPC Error apply_coupon_transaction pre-order]", couponRpcError);
                throw new Error("حدث خطأ في تطبيق الخصم. يرجى المحاولة مرة أخرى. | Error applying discount. Please try again. | هەڵە لە جێبەجێکردنی داشکاندن. تکایە دووبارە هەوڵبدە");
            }
            couponWasIncremented = true;
        }

        // Build the payload using ONLY server-calculated values
        const payloadToInsert = {
            restaurant_id: validatedData.restaurant_id,
            customer_name: validatedData.customer_name,
            customer_phone: validatedData.customer_phone,
            customer_address: validatedData.customer_address,
            order_type: validatedData.order_type,
            table_number: validatedData.table_number,
            number_of_people: validatedData.number_of_people,
            area_name: validatedData.area_name,
            nearest_landmark: validatedData.nearest_landmark,
            car_details: validatedData.car_details,
            coupon_code: validatedData.coupon_code,
            status: 'pending',
            subtotal: calculatedSubtotal,
            discount_amount: calculatedDiscount,
            delivery_fee: calculatedDeliveryFee,
            total: calculatedTotal,
            items: [], // Schema requires this, though items are stored in order_items
        };

        const { data, error } = await adminClient
            .from("orders")
            .insert(payloadToInsert)
            .select()
            .single();

        if (error) {
            // Compensate: roll back the coupon increment if order insert failed
            if (couponWasIncremented && validatedData.coupon_code) {
                // Best-effort rollback: undo the coupon increment
                const { data: couponRow } = await adminClient
                    .from("coupons")
                    .select("id, used_count")
                    .eq("code", validatedData.coupon_code.toUpperCase())
                    .eq("restaurant_id", validatedData.restaurant_id)
                    .single();
                if (couponRow) {
                    const { error: rollbackErr } = await adminClient
                        .from("coupons")
                        .update({ used_count: Math.max(0, (couponRow.used_count ?? 1) - 1) })
                        .eq("id", couponRow.id);
                    if (rollbackErr) console.error("[Coupon rollback failed]", rollbackErr);
                }
            }
            throw error;
        }

        // Insert normalized order_items
        if (data && verifiedItems.length > 0) {
            const orderItemsInsert = verifiedItems.map((item: any) => ({
                order_id: data.id,
                product_id: item.id || null,
                quantity: item.quantity,
                unit_price: item.price,
                item_name: item.name,
                variant_details: {
                    variant: item.variant || null,
                    addons: item.addons || []
                }
            }));

            const { error: itemsError } = await adminClient
                .from("order_items")
                .insert(orderItemsInsert);

            if (itemsError) {
                // Compensating transaction: remove orphaned order if items insertion fails
                console.error("[Supabase Error inserting order items]", itemsError);
                await adminClient.from("orders").delete().eq("id", data.id);
                throw new Error("فشل في حفظ تفاصيل الطلب. يرجى المحاولة مجدداً.");
            }

            // Decrement Stock atomically (parallel)
            await Promise.all(
                verifiedItems
                    .filter(item => item.id)
                    .map(item =>
                        adminClient.rpc("decrement_stock", {
                            p_product_id: item.id,
                            p_quantity: item.quantity,
                        }).then(({ error: stockError }) => {
                            if (stockError) {
                                console.error(`[RPC Error decrement_stock for product ${item.id}]`, stockError);
                            }
                        })
                    )
            );
        }

        // FCM Push Notification
        try {
            const { data: restaurant } = await adminClient
                .from("restaurants")
                .select("owner_id, name")
                .eq("id", validatedData.restaurant_id)
                .single();

            if (restaurant?.owner_id) {
                const { data: tokensData } = await adminClient
                    .from("fcm_tokens")
                    .select("token")
                    .eq("user_id", restaurant.owner_id);

                const fcmTokens = tokensData?.map(t => t.token) || [];

                if (fcmTokens.length > 0) {
                    const priceLabel = calculatedTotal.toLocaleString();
                    const typeLabel = data.order_type === 'delivery' ? '🛵 توصيل' :
                        data.order_type === 'takeaway' ? '🥡 سفري' : '🍽️ محلي';

                    await sendPushNotification({
                        tokens: fcmTokens,
                        title: `🔔 طلب جديد - ${restaurant.name}`,
                        body: `طلب ${typeLabel} بمبلغ ${priceLabel} د.ع من ${data.customer_name || 'عميل'}`,
                        data: {
                            order_id: data.id,
                            restaurant_id: data.restaurant_id,
                            type: 'new_order'
                        }
                    });
                }
            }
        } catch (pushError) {
            console.error("[FCM Push Error]", pushError);
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
        const validatedStatus = z.enum(['pending', 'confirmed', 'preparing', 'ready', 'on_the_way', 'delivered', 'cancelled', 'completed', 'rejected']).parse(status);

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        // Verify the order belongs to this user's restaurant
        const { data: profile } = await supabase
            .from("profiles")
            .select("restaurant_id, role")
            .eq("id", user.id)
            .single();

        if (!profile) throw new Error("Unauthorized");

        // Fetch the order to verify restaurant ownership
        const { data: order } = await supabase
            .from("orders")
            .select("restaurant_id")
            .eq("id", id)
            .single();

        if (!order) throw new Error("الطلب غير موجود");

        if (profile.role !== "super_admin" && order.restaurant_id !== profile.restaurant_id) {
            throw new Error("Forbidden: لا تملك صلاحية تعديل هذا الطلب");
        }

        const { data, error } = await supabase
            .from("orders")
            .update({ status: validatedStatus } as { status: string })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("[Supabase Error updateOrderStatus]", error);
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
