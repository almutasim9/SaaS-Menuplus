"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { productSchema } from "@/lib/validations/schemas";
import { z } from "zod";
import type { Product } from "@/lib/types/database.types";
import { checkLimitAccess } from "@/lib/actions/subscription";

export async function getProducts(restaurantId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("products")
        .select(`
            *,
            categories(name),
            product_variants(*),
            product_addons(*)
        `)
        .eq("restaurant_id", restaurantId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

    if (error) throw error;

    // Sort the variants and addons
    if (data) {
        data.forEach((p: any) => {
            if (p.product_variants) p.product_variants.sort((a: any, b: any) => a.sort_order - b.sort_order);
            if (p.product_addons) p.product_addons.sort((a: any, b: any) => a.sort_order - b.sort_order);
        });
    }

    return data;
}

export async function getProductsByCategory(restaurantId: string, categoryId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("category_id", categoryId)
        .is("deleted_at", null)
        .eq("is_available", true)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

export async function createProduct(formData: FormData) {
    try {
        // --- Feature Gating: Check product limit ---
        const restaurantId = formData.get("restaurant_id") as string;
        if (restaurantId) {
            const limit = await checkLimitAccess(restaurantId, "products");
            if (!limit.allowed) {
                throw new Error(`لقد وصلت للحد الأقصى من المنتجات (${limit.max}). قم بترقية خطتك لإضافة المزيد.`);
            }
        }
        // --- End Feature Gating ---

        const variantsJson = formData.get("variants") as string;
        const addonsJson = formData.get("addons") as string;

        const rawData = {
            restaurant_id: formData.get("restaurant_id"),
            category_id: formData.get("category_id") || null,
            name: formData.get("name"),
            name_en: formData.get("name_en") || null,
            name_ku: formData.get("name_ku") || null,
            description: formData.get("description") || null,
            description_en: formData.get("description_en") || null,
            description_ku: formData.get("description_ku") || null,
            price: parseFloat(formData.get("price") as string),
            compare_at_price: formData.get("compare_at_price") ? parseFloat(formData.get("compare_at_price") as string) : null,
            is_available: formData.get("is_available") === "true",
            is_hidden: formData.get("is_hidden") === "true",
            brand: formData.get("brand") || null,
            vendor: formData.get("vendor") || null,
            collection: formData.get("collection") || null,
            tags: formData.get("tags") ? (formData.get("tags") as string).split(',').map(t => t.trim()).filter(Boolean) : null,
            calories: formData.get("calories") ? parseInt(formData.get("calories") as string) : null,
            prep_time_minutes: formData.get("prep_time_minutes") ? parseInt(formData.get("prep_time_minutes") as string) : null,
            stock_count: formData.get("stock_count") && formData.get("stock_count") !== "" ? parseInt(formData.get("stock_count") as string) : null,
            variants: variantsJson ? JSON.parse(variantsJson) : undefined,
            addons: addonsJson ? JSON.parse(addonsJson) : undefined,
            // image_url is handled later
        };

        const validatedData = productSchema.parse(rawData);
        const imageFile = formData.get("image") as File | null;

        const supabase = await createClient();

        let imageUrl: string | null = null;

        if (imageFile && imageFile.size > 0) {
            const fileExt = imageFile.name.split(".").pop();
            const fileName = `${validatedData.restaurant_id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from("menu-assets")
                .upload(fileName, imageFile);

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from("menu-assets")
                    .getPublicUrl(fileName);
                imageUrl = publicUrl;
            }
        }

        const { data, error } = await supabase
            .from("products")
            .insert({
                restaurant_id: validatedData.restaurant_id,
                category_id: validatedData.category_id,
                name: validatedData.name,
                name_en: validatedData.name_en,
                name_ku: validatedData.name_ku,
                description: validatedData.description,
                description_en: validatedData.description_en,
                description_ku: validatedData.description_ku,
                price: validatedData.price,
                compare_at_price: formData.get("compare_at_price") ? parseFloat(formData.get("compare_at_price") as string) : null,
                is_available: validatedData.is_available,
                is_hidden: validatedData.is_hidden,
                brand: validatedData.brand,
                vendor: validatedData.vendor,
                collection: validatedData.collection,
                tags: validatedData.tags,
                calories: validatedData.calories,
                prep_time_minutes: validatedData.prep_time_minutes,
                stock_count: validatedData.stock_count,
                image_url: imageUrl,
            })
            .select()
            .single();

        if (error) throw error;

        const productId = data.id;

        if (validatedData.variants && validatedData.variants.length > 0) {
            await supabase.from("product_variants").insert(
                validatedData.variants.map((v: any, i: number) => ({
                    product_id: productId,
                    name: v.name,
                    name_en: v.name_en || null,
                    name_ku: v.name_ku || null,
                    price: parseFloat(v.price),
                    sort_order: i
                }))
            );
        }

        if (validatedData.addons && validatedData.addons.length > 0) {
            await supabase.from("product_addons").insert(
                validatedData.addons.map((a: any, i: number) => ({
                    product_id: productId,
                    name: a.name,
                    name_en: a.name_en || null,
                    name_ku: a.name_ku || null,
                    price: parseFloat(a.price),
                    sort_order: i
                }))
            );
        }

        revalidatePath("/dashboard/menu");
        return data;
    } catch (e: any) {
        if (e instanceof z.ZodError) {
            console.error("[Zod Validation Error createProduct]", e.issues);
            throw new Error(`Validation failed: ${e.issues[0].message}`);
        }
        console.error("[Server Action Error createProduct]", e);
        throw new Error(e.message || "Internal Server Error");
    }
}

export async function updateProduct(id: string, formData: FormData) {
    try {
        const variantsJson = formData.get("variants") as string;
        const addonsJson = formData.get("addons") as string;

        const rawData = {
            restaurant_id: formData.get("restaurant_id"),
            category_id: formData.get("category_id") || null,
            name: formData.get("name"),
            name_en: formData.get("name_en") || null,
            name_ku: formData.get("name_ku") || null,
            description: formData.get("description") || null,
            description_en: formData.get("description_en") || null,
            description_ku: formData.get("description_ku") || null,
            price: parseFloat(formData.get("price") as string),
            compare_at_price: formData.get("compare_at_price") ? parseFloat(formData.get("compare_at_price") as string) : null,
            is_available: formData.get("is_available") === "true",
            is_hidden: formData.get("is_hidden") === "true",
            brand: formData.get("brand") || null,
            vendor: formData.get("vendor") || null,
            collection: formData.get("collection") || null,
            tags: formData.get("tags") ? (formData.get("tags") as string).split(',').map(t => t.trim()).filter(Boolean) : null,
            calories: formData.get("calories") ? parseInt(formData.get("calories") as string) : null,
            prep_time_minutes: formData.get("prep_time_minutes") ? parseInt(formData.get("prep_time_minutes") as string) : null,
            stock_count: formData.get("stock_count") && formData.get("stock_count") !== "" ? parseInt(formData.get("stock_count") as string) : null,
            variants: variantsJson ? JSON.parse(variantsJson) : undefined,
            addons: addonsJson ? JSON.parse(addonsJson) : undefined,
        };

        const validatedData = productSchema.parse(rawData);
        const imageFile = formData.get("image") as File | null;

        const supabase = await createClient();

        const updateData: Record<string, unknown> = {
            category_id: validatedData.category_id,
            name: validatedData.name,
            name_en: validatedData.name_en,
            name_ku: validatedData.name_ku,
            description: validatedData.description,
            description_en: validatedData.description_en,
            description_ku: validatedData.description_ku,
            price: validatedData.price,
            compare_at_price: formData.get("compare_at_price") ? parseFloat(formData.get("compare_at_price") as string) : null,
            is_available: validatedData.is_available,
            is_hidden: validatedData.is_hidden,
            brand: validatedData.brand,
            vendor: validatedData.vendor,
            collection: validatedData.collection,
            tags: validatedData.tags,
            calories: validatedData.calories,
            prep_time_minutes: validatedData.prep_time_minutes,
            stock_count: validatedData.stock_count,
        };

        if (imageFile && imageFile.size > 0) {
            const fileExt = imageFile.name.split(".").pop();
            const fileName = `${validatedData.restaurant_id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from("menu-assets")
                .upload(fileName, imageFile);

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from("menu-assets")
                    .getPublicUrl(fileName);
                updateData.image_url = publicUrl;
            }
        }

        const { data, error } = await supabase
            .from("products")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        // Update variants (delete existing and insert new)
        await supabase.from("product_variants").delete().eq("product_id", id);
        if (validatedData.variants && validatedData.variants.length > 0) {
            await supabase.from("product_variants").insert(
                validatedData.variants.map((v: any, i: number) => ({
                    product_id: id,
                    name: v.name,
                    name_en: v.name_en || null,
                    name_ku: v.name_ku || null,
                    price: parseFloat(v.price),
                    sort_order: i
                }))
            );
        }

        // Update addons
        await supabase.from("product_addons").delete().eq("product_id", id);
        if (validatedData.addons && validatedData.addons.length > 0) {
            await supabase.from("product_addons").insert(
                validatedData.addons.map((a: any, i: number) => ({
                    product_id: id,
                    name: a.name,
                    name_en: a.name_en || null,
                    name_ku: a.name_ku || null,
                    price: parseFloat(a.price),
                    sort_order: i
                }))
            );
        }

        revalidatePath("/dashboard/menu");
        return data;
    } catch (e: any) {
        if (e instanceof z.ZodError) {
            console.error("[Zod Validation Error updateProduct]", e.issues);
            throw new Error(`Validation failed: ${e.issues[0].message}`);
        }
        console.error("[Server Action Error updateProduct]", e);
        throw new Error(e.message || "Internal Server Error");
    }
}

export async function updateProductDiscount(id: string, compareAtPrice: number | null, isDiscountActive: boolean) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("products")
            .update({
                compare_at_price: compareAtPrice,
                is_discount_active: isDiscountActive
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Supabase Error Update Product Discount:", error);
            throw new Error(`Failed to update product discount: ${error.message}`);
        }

        revalidatePath("/dashboard/menu");
        return data as Product;
    } catch (e: any) {
        console.error("[Server Action Error updateProductDiscount]", e);
        throw new Error(e.message || "Internal Server Error");
    }
}

export async function duplicateProduct(id: string) {
    try {
        const supabase = await createClient();

        // 1. Fetch original product with relations
        const { data: original, error: fetchError } = await supabase
            .from("products")
            .select(`
                *,
                product_variants(*),
                product_addons(*)
            `)
            .eq("id", id)
            .single();

        if (fetchError || !original) {
            throw new Error(`Failed to fetch original product: ${fetchError?.message}`);
        }

        // 2. Prepare new product data (strip ID, created_at, updated_at)
        const { id: _, created_at, updated_at, product_variants, product_addons, ...productData } = original;

        // Append (Copy) to name
        productData.name = `${productData.name} (Copy)`;
        productData.is_available = false; // Set to false by default for safety
        productData.is_hidden = true; // Set to hidden by default

        // 3. Insert new product
        const { data: newProduct, error: insertError } = await supabase
            .from("products")
            .insert(productData)
            .select()
            .single();

        if (insertError || !newProduct) {
            throw new Error(`Failed to create duplicate product: ${insertError?.message}`);
        }

        // 4. Insert Variants
        if (product_variants && product_variants.length > 0) {
            const newVariants = product_variants.map((v: any) => {
                const { id: _vid, created_at: _vca, product_id: _vpid, ...vData } = v;
                return { ...vData, product_id: newProduct.id };
            });
            await supabase.from("product_variants").insert(newVariants);
        }

        // 5. Insert Addons
        if (product_addons && product_addons.length > 0) {
            const newAddons = product_addons.map((a: any) => {
                const { id: _aid, created_at: _aca, product_id: _apid, ...aData } = a;
                return { ...aData, product_id: newProduct.id };
            });
            await supabase.from("product_addons").insert(newAddons);
        }

        revalidatePath("/dashboard/menu");
        return newProduct;
    } catch (e: any) {
        console.error("[Server Action Error duplicateProduct]", e);
        throw new Error(e.message || "Internal Server Error");
    }
}

export async function deleteProduct(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("products")
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq("id", id);
    if (error) throw error;
    revalidatePath("/dashboard/menu");
}

export async function toggleProductAvailability(id: string, isAvailable: boolean) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("products")
        .update({ is_available: isAvailable })
        .eq("id", id);
    if (error) throw error;
    revalidatePath("/dashboard/menu");
}

export async function toggleProductVisibility(id: string, isHidden: boolean) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("products")
        .update({ is_hidden: isHidden })
        .eq("id", id);
    if (error) throw error;
    revalidatePath("/dashboard/menu");
}

export async function updateProductOrder(items: { id: string; sort_order: number }[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Process sequentially to avoid locking conflicts
    const promises = items.map(async (item) => {
        return supabase
            .from("products")
            .update({ sort_order: item.sort_order })
            .eq("id", item.id);
    });

    try {
        await Promise.all(promises);
        revalidatePath("/dashboard/menu");
    } catch (e) {
        console.error("Failed to update product order", e);
        throw new Error("Failed to save the new order.");
    }
}

export async function incrementProductView(productId: string) {
    try {
        const supabase = await createClient();
        const { error } = await supabase.rpc("increment_product_view", { p_id: productId });
        if (error) throw error;
    } catch (e: any) {
        console.error("[incrementProductView error]", e);
        // Silently fail to avoid breaking UX for a non-critical analytics tracker
    }
}
