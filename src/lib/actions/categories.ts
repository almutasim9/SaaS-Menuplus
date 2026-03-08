"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getCategories(restaurantId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true });

    if (error) {
        console.error("Error fetching categories:", error);
        throw error;
    }
    return data;
}

export async function createCategory(restaurantId: string, name: string, name_en?: string | null, name_ku?: string | null, sortOrder: number = 0) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("categories")
        .insert({ restaurant_id: restaurantId, name, name_en, name_ku, sort_order: sortOrder })
        .select()
        .single();

    if (error) {
        if (error.code === '23505' && error.message.includes('unique_category_name_per_restaurant')) {
            throw new Error(`A category named "${name}" already exists.`);
        }
        console.error("Error creating category:", error);
        throw new Error("Failed to create category");
    }

    revalidatePath("/dashboard/categories");
    return data;
}

export async function updateCategory(id: string, name: string, name_en?: string | null, name_ku?: string | null, sortOrder?: number) {
    const supabase = await createClient();
    const updateData: Record<string, unknown> = { name, name_en, name_ku };
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;

    const { data, error } = await supabase
        .from("categories")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        if (error.code === '23505' && error.message.includes('unique_category_name_per_restaurant')) {
            throw new Error(`A category named "${name}" already exists.`);
        }
        console.error("Error updating category:", error);
        throw new Error("Failed to update category");
    }

    revalidatePath("/dashboard/categories");
    return data;
}

export async function deleteCategory(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("categories")
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq("id", id);

    if (error) {
        console.error("Error deleting category:", error);
        throw new Error("Failed to delete category");
    }
    revalidatePath("/dashboard/categories");
}

export async function updateCategoryOrder(items: { id: string; sort_order: number }[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Process sequentially to avoid locking conflicts, or write a Postgres RPC.
    // For small arrays like categories, bulk promises run easily.
    const promises = items.map(async (item) => {
        return supabase
            .from("categories")
            .update({ sort_order: item.sort_order })
            .eq("id", item.id);
    });

    try {
        await Promise.all(promises);
        revalidatePath("/dashboard/categories");
    } catch (e) {
        console.error("Failed to update category order", e);
        throw new Error("Failed to save the new order.");
    }
}

export async function toggleCategoryVisibility(id: string, isHidden: boolean) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("categories")
        .update({ is_hidden: isHidden })
        .eq("id", id);

    if (error) {
        console.error("Error toggling category visibility:", error);
        throw new Error("Failed to update category visibility");
    }
    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/menu");
}
