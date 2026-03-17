"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireRestaurantOwnership } from "@/lib/actions/_auth-guard";
import { validateImageFile } from "@/lib/utils/file-validation";

export async function getRestaurantAppearance(restaurantId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("restaurants")
        .select("primary_color, logo_url, banner_url, name, slug, social_links, theme_settings, whatsapp_number, is_whatsapp_ordering_enabled")
        .eq("id", restaurantId)
        .single();

    if (error) throw error;
    return data;
}

export async function updateAppearance(restaurantId: string, formData: FormData) {
    await requireRestaurantOwnership(restaurantId);

    // Validate all uploaded files before processing
    const filesToValidate = [
        { file: formData.get("logo") as File | null, name: "اللوجو" },
        { file: formData.get("banner") as File | null, name: "البانر" },
        { file: formData.get("favicon") as File | null, name: "الأيقونة" },
        { file: formData.get("default_product_image_file") as File | null, name: "الصورة الافتراضية" },
    ];
    for (const { file, name } of filesToValidate) {
        if (file && file.size > 0) validateImageFile(file, name);
    }

    const supabase = await createClient();

    const primaryColor = formData.get("primary_color") as string;

    const socialLinks = {
        facebook: formData.get("social_facebook") as string || "",
        instagram: formData.get("social_instagram") as string || "",
        twitter: formData.get("social_twitter") as string || "",
        tiktok: formData.get("social_tiktok") as string || "",
    };

    const themeSettings: Record<string, any> = {
        secondary_color: formData.get("secondary_color") as string || "#ffffff",
        theme_mode: formData.get("theme_mode") as string || "system",
        layout_products: formData.get("layout_products") as string || "grid",
        layout_categories: formData.get("layout_categories") as string || "pills",
        font_family: formData.get("font_family") as string || "cairo",
        show_search: formData.get("show_search") === "true",
        welcome_message: formData.get("welcome_message") as string || "",
        theme: formData.get("theme") as string || "glass",
    };

    // Existing theme_settings pass-through for images if they exist
    const existingThemeSettingsStr = formData.get("existing_theme_settings") as string;
    let existingThemeSettings = {};
    if (existingThemeSettingsStr) {
        try {
            existingThemeSettings = JSON.parse(existingThemeSettingsStr);
        } catch (e) {
            console.error("Failed to parse existing theme settings", e);
        }
    }

    themeSettings.favicon_url = (existingThemeSettings as any).favicon_url || null;
    themeSettings.default_product_image = (existingThemeSettings as any).default_product_image || null;

    const whatsappNumber = formData.get("whatsapp_number") as string || null;
    const isWhatsappOrderingEnabled = formData.get("is_whatsapp_ordering_enabled") === "true";

    const updateData: Record<string, unknown> = {
        primary_color: primaryColor,
        social_links: socialLinks,
        theme_settings: themeSettings,
        whatsapp_number: whatsappNumber,
        is_whatsapp_ordering_enabled: isWhatsappOrderingEnabled
    };

    // Handle logo upload
    const logoFile = formData.get("logo") as File | null;
    if (logoFile && logoFile.size > 0) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `${restaurantId}/logo.${fileExt}`;
        await supabase.storage.from("menu-assets").upload(fileName, logoFile, { upsert: true });
        const { data: { publicUrl } } = supabase.storage.from("menu-assets").getPublicUrl(fileName);
        updateData.logo_url = publicUrl;
    }

    // Handle banner upload
    const bannerFile = formData.get("banner") as File | null;
    if (bannerFile && bannerFile.size > 0) {
        const fileExt = bannerFile.name.split(".").pop();
        const fileName = `${restaurantId}/banner.${fileExt}`;
        await supabase.storage.from("menu-assets").upload(fileName, bannerFile, { upsert: true });
        const { data: { publicUrl } } = supabase.storage.from("menu-assets").getPublicUrl(fileName);
        updateData.banner_url = publicUrl;
    }

    // Handle favicon upload
    const faviconFile = formData.get("favicon") as File | null;
    if (faviconFile && faviconFile.size > 0) {
        const fileExt = faviconFile.name.split(".").pop();
        const fileName = `${restaurantId}/favicon.${fileExt}`;
        await supabase.storage.from("menu-assets").upload(fileName, faviconFile, { upsert: true });
        const { data: { publicUrl } } = supabase.storage.from("menu-assets").getPublicUrl(fileName);
        themeSettings.favicon_url = publicUrl;
    }

    // Handle default product image upload
    const defaultProductImageFile = formData.get("default_product_image_file") as File | null;
    if (defaultProductImageFile && defaultProductImageFile.size > 0) {
        const fileExt = defaultProductImageFile.name.split(".").pop();
        const fileName = `${restaurantId}/default_product_image.${fileExt}`;
        await supabase.storage.from("menu-assets").upload(fileName, defaultProductImageFile, { upsert: true });
        const { data: { publicUrl } } = supabase.storage.from("menu-assets").getPublicUrl(fileName);
        themeSettings.default_product_image = publicUrl;
    }

    const { data, error } = await supabase
        .from("restaurants")
        .update(updateData)
        .eq("id", restaurantId)
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/dashboard/appearance");
    return data;
}
