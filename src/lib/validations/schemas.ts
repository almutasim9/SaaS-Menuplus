import { z } from "zod";
import { MAX_PRICE } from "@/lib/constants";

export const variantSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, "Variant name is required"),
    name_en: z.string().nullable().optional(),
    name_ku: z.string().nullable().optional(),
    price: z.coerce.number().min(0, "Price must be 0 or greater").max(MAX_PRICE),
    is_active: z.boolean().default(true),
});

export const addonSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, "Add-on name is required"),
    name_en: z.string().nullable().optional(),
    name_ku: z.string().nullable().optional(),
    price: z.coerce.number().min(0, "Price must be 0 or greater").max(MAX_PRICE),
    is_active: z.boolean().default(true),
});

export const productSchema = z.object({
    id: z.string().uuid().optional(),
    restaurant_id: z.string().uuid("Invalid restaurant ID"),
    category_id: z.string().uuid("Invalid category ID").nullable(),
    name: z.string().min(1, "Product name is required").max(200),
    name_en: z.string().max(200).nullable().optional(),
    name_ku: z.string().max(200).nullable().optional(),
    description: z.string().max(2000).nullable().optional(),
    description_en: z.string().max(2000).nullable().optional(),
    description_ku: z.string().max(2000).nullable().optional(),
    price: z.number().min(0, "Price must be 0 or greater").max(MAX_PRICE),
    image_url: z.string().url().nullable().optional(),
    is_available: z.boolean().default(true),
    is_hidden: z.boolean().default(false),
    variants: z.array(variantSchema).optional(),
    addons: z.array(addonSchema).optional(),
});

export const orderItemSchema = z.object({
    id: z.string(),
    name: z.string().max(500),
    price: z.number().min(0).max(MAX_PRICE),
    quantity: z.number().int().min(1).max(999),
    cart_item_id: z.string().optional(),
    variant: z.object({
        id: z.string(),
        name: z.string(),
        price: z.number().min(0).max(MAX_PRICE)
    }).optional().nullable(),
    addons: z.array(z.object({
        id: z.string(),
        name: z.string(),
        price: z.number().min(0).max(MAX_PRICE)
    })).optional().nullable()
});

export const createOrderSchema = z.object({
    restaurant_id: z.string().uuid(),
    customer_name: z.string().min(1, "Name is required").max(200).optional().nullable(),
    customer_phone: z.string().max(30).optional().nullable(),
    customer_address: z.string().max(500).optional().nullable(),
    items: z.array(orderItemSchema).min(1, "Order must contain at least one item").max(100),
    subtotal: z.number().min(0).max(MAX_PRICE),
    discount_amount: z.number().min(0).max(MAX_PRICE).default(0),
    delivery_fee: z.number().min(0).max(MAX_PRICE).default(0),
    total: z.number().min(0).max(MAX_PRICE),
    status: z.enum(['pending', 'confirmed', 'preparing', 'delivered', 'cancelled', 'completed', 'rejected']).default('pending'),
    coupon_code: z.string().max(100).optional().nullable(),
    order_type: z.enum(['dine_in', 'delivery', 'takeaway']),
    table_number: z.string().max(20).optional().nullable(),
    number_of_people: z.number().int().min(1).max(999).optional().nullable(),
    area_name: z.string().max(200).optional().nullable(),
    nearest_landmark: z.string().max(500).optional().nullable(),
    car_details: z.string().max(200).optional().nullable(),
});

// Auth schemas
export const signUpSchema = z.object({
    email: z.string().email("البريد الإلكتروني غير صالح"),
    password: z.string()
        .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
        .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير واحد على الأقل")
        .regex(/[0-9]/, "يجب أن تحتوي على رقم واحد على الأقل"),
    name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100),
});

// Coupon schema
export const couponSchema = z.object({
    restaurant_id: z.string().uuid(),
    code: z.string().min(1).max(50).optional().nullable(),
    discount_type: z.enum(["percentage", "fixed", "free_delivery"]),
    discount_value: z.number().min(0).max(MAX_PRICE).refine((val) => val >= 0, {
        message: "قيمة الخصم يجب أن تكون موجبة",
    }),
    applies_to: z.enum(["cart", "product"]),
    product_id: z.string().uuid().optional().nullable(),
    min_order: z.number().min(0).max(MAX_PRICE).nullable().optional(),
    max_uses: z.number().int().min(1).max(1_000_000).nullable().optional(),
    expires_at: z.string().nullable().optional(),
    is_global: z.boolean().default(false),
    is_active: z.boolean().default(true),
}).refine((data) => {
    if (data.discount_type === "percentage") {
        return data.discount_value <= 100;
    }
    return true;
}, { message: "نسبة الخصم لا يمكن أن تتجاوز 100%", path: ["discount_value"] });

// Delivery zone schema
export const deliveryZoneSchema = z.object({
    zone_name: z.string().min(1).max(200),
    flat_rate: z.number().min(0).max(MAX_PRICE),
    free_delivery_threshold: z.number().min(0).max(MAX_PRICE).optional().nullable(),
    estimated_delivery_time: z.string().max(100).optional().nullable(),
    min_order_amount: z.number().min(0).max(MAX_PRICE).optional(),
});
