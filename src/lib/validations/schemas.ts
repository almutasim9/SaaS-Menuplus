import { z } from "zod";

export const variantSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, "Variant name is required"),
    name_en: z.string().nullable().optional(),
    name_ku: z.string().nullable().optional(),
    price: z.number().min(0, "Price must be 0 or greater"),
    is_active: z.boolean().default(true),
});

export const addonSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, "Add-on name is required"),
    name_en: z.string().nullable().optional(),
    name_ku: z.string().nullable().optional(),
    price: z.number().min(0, "Price must be 0 or greater"),
    is_active: z.boolean().default(true),
});

export const productSchema = z.object({
    id: z.string().uuid().optional(),
    restaurant_id: z.string().uuid("Invalid restaurant ID"),
    category_id: z.string().uuid("Invalid category ID").nullable(),
    name: z.string().min(1, "Product name is required"),
    name_en: z.string().nullable().optional(),
    name_ku: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    description_en: z.string().nullable().optional(),
    description_ku: z.string().nullable().optional(),
    price: z.number().min(0, "Price must be 0 or greater"),
    image_url: z.string().url().nullable().optional(),
    is_available: z.boolean().default(true),
    is_hidden: z.boolean().default(false),
    brand: z.string().nullable().optional(),
    vendor: z.string().nullable().optional(),
    collection: z.string().nullable().optional(),
    tags: z.array(z.string()).nullable().optional(),
    calories: z.number().nullable().optional(),
    prep_time_minutes: z.number().nullable().optional(),
    stock_count: z.number().nullable().optional(),
    variants: z.array(variantSchema).optional(),
    addons: z.array(addonSchema).optional(),
});

export const orderItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    price: z.number().min(0),
    quantity: z.number().int().min(1),
    cart_item_id: z.string().optional(),
    variant: z.object({
        id: z.string(),
        name: z.string(),
        price: z.number()
    }).optional().nullable(),
    addons: z.array(z.object({
        id: z.string(),
        name: z.string(),
        price: z.number()
    })).optional().nullable()
});

export const createOrderSchema = z.object({
    restaurant_id: z.string().uuid(),
    customer_name: z.string().min(1, "Name is required").optional().nullable(),
    customer_phone: z.string().optional().nullable(),
    customer_address: z.string().optional().nullable(),
    items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
    subtotal: z.number().min(0),
    discount_amount: z.number().min(0).default(0),
    delivery_fee: z.number().min(0).default(0),
    total: z.number().min(0),
    status: z.enum(['pending', 'confirmed', 'preparing', 'delivered', 'cancelled', 'completed', 'rejected']).default('pending'),
    coupon_code: z.string().optional().nullable(),
    order_type: z.enum(['dine_in', 'delivery', 'takeaway']),
    table_number: z.string().optional().nullable(),
    number_of_people: z.number().optional().nullable(),
    area_name: z.string().optional().nullable(),
    nearest_landmark: z.string().optional().nullable(),
    car_details: z.string().optional().nullable(),
});
