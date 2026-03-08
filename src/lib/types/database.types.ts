export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    email: string;
                    full_name: string | null;
                    role: string;
                    restaurant_id: string | null;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    full_name?: string | null;
                    role?: string;
                    restaurant_id?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    full_name?: string | null;
                    role?: string;
                    restaurant_id?: string | null;
                    created_at?: string;
                };
            };
            restaurants: {
                Row: {
                    id: string;
                    name: string;
                    slug: string;
                    owner_id: string;
                    primary_color: string;
                    logo_url: string | null;
                    banner_url: string | null;
                    is_dine_in_enabled: boolean;
                    is_takeaway_enabled: boolean;
                    is_delivery_enabled: boolean;
                    is_free_delivery: boolean;
                    whatsapp_number: string | null;
                    is_whatsapp_ordering_enabled: boolean;
                    social_links: Json | null;
                    theme_settings: Json | null;
                    subscription_plan: string;
                    subscription_status: string;
                    trial_ends_at: string | null;
                    subscription_expires_at: string | null;
                    max_products: number;
                    max_orders_per_month: number;
                    custom_domain: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    slug: string;
                    owner_id: string;
                    primary_color?: string;
                    logo_url?: string | null;
                    banner_url?: string | null;
                    is_dine_in_enabled?: boolean;
                    is_takeaway_enabled?: boolean;
                    is_delivery_enabled?: boolean;
                    is_free_delivery?: boolean;
                    whatsapp_number?: string | null;
                    is_whatsapp_ordering_enabled?: boolean;
                    social_links?: Json | null;
                    theme_settings?: Json | null;
                    subscription_plan?: string;
                    subscription_status?: string;
                    trial_ends_at?: string | null;
                    subscription_expires_at?: string | null;
                    max_products?: number;
                    max_orders_per_month?: number;
                    custom_domain?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    slug?: string;
                    owner_id?: string;
                    primary_color?: string;
                    logo_url?: string | null;
                    banner_url?: string | null;
                    is_dine_in_enabled?: boolean;
                    is_takeaway_enabled?: boolean;
                    is_delivery_enabled?: boolean;
                    whatsapp_number?: string | null;
                    is_whatsapp_ordering_enabled?: boolean;
                    social_links?: Json | null;
                    theme_settings?: Json | null;
                    subscription_plan?: string;
                    subscription_status?: string;
                    trial_ends_at?: string | null;
                    subscription_expires_at?: string | null;
                    max_products?: number;
                    max_orders_per_month?: number;
                    custom_domain?: string | null;
                    created_at?: string;
                };
            };
            categories: {
                Row: {
                    id: string;
                    restaurant_id: string;
                    name: string;
                    name_en: string | null;
                    name_ku: string | null;
                    sort_order: number;
                    is_hidden: boolean;
                    deleted_at: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    restaurant_id: string;
                    name: string;
                    name_en?: string | null;
                    name_ku?: string | null;
                    sort_order?: number;
                    is_hidden?: boolean;
                    deleted_at?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    restaurant_id?: string;
                    name?: string;
                    name_en?: string | null;
                    name_ku?: string | null;
                    sort_order?: number;
                    is_hidden?: boolean;
                    deleted_at?: string | null;
                    created_at?: string;
                };
            };
            products: {
                Row: {
                    id: string;
                    restaurant_id: string;
                    category_id: string;
                    name: string;
                    name_en: string | null;
                    name_ku: string | null;
                    description: string | null;
                    description_en: string | null;
                    description_ku: string | null;
                    price: number;
                    compare_at_price: number | null;
                    is_discount_active: boolean | null;
                    image_url: string | null;
                    is_available: boolean;
                    is_hidden: boolean;
                    sort_order: number;
                    brand: string | null;
                    vendor: string | null;
                    collection: string | null;
                    tags: string[] | null;
                    calories: number | null;
                    prep_time_minutes: number | null;
                    stock_count: number | null;
                    view_count: number | null;
                    deleted_at: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    restaurant_id: string;
                    category_id: string;
                    name: string;
                    name_en?: string | null;
                    name_ku?: string | null;
                    description?: string | null;
                    description_en?: string | null;
                    description_ku?: string | null;
                    price: number;
                    compare_at_price?: number | null;
                    is_discount_active?: boolean | null;
                    image_url?: string | null;
                    is_available?: boolean;
                    is_hidden?: boolean;
                    sort_order?: number;
                    brand?: string | null;
                    vendor?: string | null;
                    collection?: string | null;
                    tags?: string[] | null;
                    calories?: number | null;
                    prep_time_minutes?: number | null;
                    stock_count?: number | null;
                    view_count?: number | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    restaurant_id?: string;
                    category_id?: string;
                    name?: string;
                    name_en?: string | null;
                    name_ku?: string | null;
                    description?: string | null;
                    description_en?: string | null;
                    description_ku?: string | null;
                    price?: number;
                    compare_at_price?: number | null;
                    is_discount_active?: boolean | null;
                    image_url?: string | null;
                    is_available?: boolean;
                    is_hidden?: boolean;
                    sort_order?: number;
                    brand?: string | null;
                    vendor?: string | null;
                    collection?: string | null;
                    tags?: string[] | null;
                    calories?: number | null;
                    prep_time_minutes?: number | null;
                    stock_count?: number | null;
                    view_count?: number | null;
                    created_at?: string;
                };
            };
            product_variants: {
                Row: {
                    id: string;
                    product_id: string;
                    name: string;
                    name_en: string | null;
                    name_ku: string | null;
                    price: number;
                    sort_order: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    product_id: string;
                    name: string;
                    name_en?: string | null;
                    name_ku?: string | null;
                    price: number;
                    sort_order?: number;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    product_id?: string;
                    name?: string;
                    name_en?: string | null;
                    name_ku?: string | null;
                    price?: number;
                    sort_order?: number;
                    created_at?: string;
                };
            };
            product_addons: {
                Row: {
                    id: string;
                    product_id: string;
                    name: string;
                    name_en: string | null;
                    name_ku: string | null;
                    price: number;
                    sort_order: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    product_id: string;
                    name: string;
                    name_en?: string | null;
                    name_ku?: string | null;
                    price: number;
                    sort_order?: number;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    product_id?: string;
                    name?: string;
                    name_en?: string | null;
                    name_ku?: string | null;
                    price?: number;
                    sort_order?: number;
                    created_at?: string;
                };
            };
            delivery_zones: {
                Row: {
                    id: string;
                    restaurant_id: string;
                    zone_name: string;
                    flat_rate: number;
                    free_delivery_threshold: number | null;
                    is_active: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    restaurant_id: string;
                    zone_name: string;
                    flat_rate: number;
                    free_delivery_threshold?: number | null;
                    is_active?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    restaurant_id?: string;
                    zone_name?: string;
                    flat_rate?: number;
                    free_delivery_threshold?: number | null;
                    is_active?: boolean;
                    created_at?: string;
                };
            };
            delivery_areas: {
                Row: {
                    id: string;
                    zone_id: string;
                    area_name: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    zone_id: string;
                    area_name: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    zone_id?: string;
                    area_name?: string;
                    created_at?: string;
                };
            };
            working_hours: {
                Row: {
                    id: string;
                    restaurant_id: string;
                    day_of_week: number;
                    open_time: string;
                    close_time: string;
                    is_closed: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    restaurant_id: string;
                    day_of_week: number;
                    open_time?: string;
                    close_time?: string;
                    is_closed?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    restaurant_id?: string;
                    day_of_week?: number;
                    open_time?: string;
                    close_time?: string;
                    is_closed?: boolean;
                    created_at?: string;
                };
            };
            coupons: {
                Row: {
                    id: string;
                    restaurant_id: string;
                    code: string;
                    discount_type: "percentage" | "fixed" | "free_delivery";
                    discount_value: number;
                    applies_to: "cart" | "product";
                    product_id: string | null;
                    min_order: number | null;
                    max_uses: number | null;
                    used_count: number;
                    is_active: boolean;
                    is_global: boolean;
                    deleted_at: string | null;
                    expires_at: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    restaurant_id: string;
                    code: string;
                    discount_type: "percentage" | "fixed" | "free_delivery";
                    discount_value: number;
                    applies_to?: "cart" | "product";
                    product_id?: string | null;
                    min_order?: number | null;
                    max_uses?: number | null;
                    used_count?: number;
                    is_active?: boolean;
                    is_global?: boolean;
                    expires_at?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    restaurant_id?: string;
                    code?: string;
                    discount_type?: "percentage" | "fixed" | "free_delivery";
                    discount_value?: number;
                    applies_to?: "cart" | "product";
                    product_id?: string | null;
                    min_order?: number | null;
                    max_uses?: number | null;
                    used_count?: number;
                    is_active?: boolean;
                    is_global?: boolean;
                    expires_at?: string | null;
                    created_at?: string;
                };
            };
            orders: {
                Row: {
                    id: string;
                    restaurant_id: string;
                    customer_name: string | null;
                    customer_phone: string | null;
                    customer_address: string | null;
                    order_type: "dine_in" | "delivery" | "takeaway";
                    table_number: string | null;
                    number_of_people: number | null;
                    area_name: string | null;
                    nearest_landmark: string | null;
                    car_details: string | null;
                    items: Json;
                    subtotal: number;
                    discount_amount: number;
                    delivery_fee: number;
                    total: number;
                    coupon_code: string | null;
                    status: "pending" | "confirmed" | "preparing" | "delivered" | "cancelled" | "completed" | "rejected";
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    restaurant_id: string;
                    customer_name?: string | null;
                    customer_phone?: string | null;
                    customer_address?: string | null;
                    order_type?: "dine_in" | "delivery" | "takeaway";
                    table_number?: string | null;
                    number_of_people?: number | null;
                    area_name?: string | null;
                    nearest_landmark?: string | null;
                    car_details?: string | null;
                    items: Json;
                    subtotal: number;
                    discount_amount?: number;
                    delivery_fee?: number;
                    total: number;
                    coupon_code?: string | null;
                    status?: "pending" | "confirmed" | "preparing" | "delivered" | "cancelled" | "completed" | "rejected";
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    restaurant_id?: string;
                    customer_name?: string | null;
                    customer_phone?: string | null;
                    customer_address?: string | null;
                    order_type?: "dine_in" | "delivery" | "takeaway";
                    table_number?: string | null;
                    number_of_people?: number | null;
                    area_name?: string | null;
                    nearest_landmark?: string | null;
                    car_details?: string | null;
                    items?: Json;
                    subtotal?: number;
                    discount_amount?: number;
                    delivery_fee?: number;
                    total?: number;
                    coupon_code?: string | null;
                    status?: "pending" | "confirmed" | "preparing" | "delivered" | "cancelled" | "completed" | "rejected";
                    created_at?: string;
                };
            };
            order_items: {
                Row: {
                    id: string;
                    order_id: string;
                    product_id: string | null;
                    quantity: number;
                    unit_price: number;
                    item_name: string;
                    variant_details: Json | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    order_id: string;
                    product_id?: string | null;
                    quantity: number;
                    unit_price: number;
                    item_name: string;
                    variant_details?: Json | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    order_id?: string;
                    product_id?: string | null;
                    quantity?: number;
                    unit_price?: number;
                    item_name?: string;
                    variant_details?: Json | null;
                    created_at?: string;
                };
            };
        };
    };
}

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"];
export type ProductAddon = Database["public"]["Tables"]["product_addons"]["Row"];
export type DeliveryZone = Database["public"]["Tables"]["delivery_zones"]["Row"];
export type DeliveryArea = Database["public"]["Tables"]["delivery_areas"]["Row"];
export type WorkingHour = Database["public"]["Tables"]["working_hours"]["Row"];
export type Coupon = Database["public"]["Tables"]["coupons"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];

export type OrderItem = {
    cart_item_id: string;
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
    variant?: { name: string; price: number };
    addons?: { name: string; price: number }[];
};

export type ProductWithCustomization = Product & {
    product_variants?: ProductVariant[];
    product_addons?: ProductAddon[];
};
