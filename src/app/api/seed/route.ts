import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = await createClient();

    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized - Please login first" }, { status: 401 });
    }

    // Get restaurant
    const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .single();

    if (!restaurant) {
        return NextResponse.json({ error: "Restaurant not found for this user" }, { status: 404 });
    }

    // Insert categories
    const categoriesToInsert = [
        { restaurant_id: restaurant.id, name: "برجر 🍔", sort_order: 1 },
        { restaurant_id: restaurant.id, name: "بيتزا 🍕", sort_order: 2 },
        { restaurant_id: restaurant.id, name: "مشروبات 🥤", sort_order: 3 },
        { restaurant_id: restaurant.id, name: "حلويات 🍰", sort_order: 4 }
    ];

    const { data: categories, error: catError } = await supabase
        .from("categories")
        .insert(categoriesToInsert)
        .select();

    if (catError || !categories) {
        return NextResponse.json({ error: catError?.message || "Failed to insert categories" }, { status: 500 });
    }

    // Categories mapping by name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const catMap = categories.reduce((acc: any, cat: any) => {
        acc[cat.name] = cat.id;
        return acc;
    }, {});

    // Insert products
    const productsToInsert = [
        {
            restaurant_id: restaurant.id,
            category_id: catMap["برجر 🍔"],
            name: "سماش برجر كلاسيك",
            description: "شريحتين من اللحم البلدي مع الجبن الأمريكي الذائب والصوص الخاص",
            price: 6500,
            image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
            is_available: true,
            sort_order: 1
        },
        {
            restaurant_id: restaurant.id,
            category_id: catMap["برجر 🍔"],
            name: "دبل تشيز برجر بيكن",
            description: "برجر ضخم مع قطع البيكن المقرمشة وجبن الشيدر الممتاز",
            price: 8500,
            image_url: "https://images.unsplash.com/photo-1586816001966-79b736744398?w=500&q=80",
            is_available: true,
            sort_order: 2
        },
        {
            restaurant_id: restaurant.id,
            category_id: catMap["بيتزا 🍕"],
            name: "بيتزا مارغريتا",
            description: "عجينة نابولي الشهيرة مع صوص الطماطم الإيطالي وجبن الموزاريلا والريحان الطازج",
            price: 12000,
            image_url: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=500&q=80",
            is_available: true,
            sort_order: 1
        },
        {
            restaurant_id: restaurant.id,
            category_id: catMap["بيتزا 🍕"],
            name: "بيتزا بيبروني",
            description: "شرائح البيبروني الايطالية مع الجبن والصوص",
            price: 14000,
            image_url: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&q=80",
            is_available: true,
            sort_order: 2
        },
        {
            restaurant_id: restaurant.id,
            category_id: catMap["مشروبات 🥤"],
            name: "بيبسي دايت",
            description: "مشروب غازي بارد بدون سعرات حرارية",
            price: 1500,
            image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80",
            is_available: true,
            sort_order: 1
        },
        {
            restaurant_id: restaurant.id,
            category_id: catMap["مشروبات 🥤"],
            name: "عصير برتقال فريش",
            description: "عصير برتقال طازج محضّر يومياً بدون إضافات",
            price: 3500,
            image_url: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=500&q=80",
            is_available: true,
            sort_order: 2
        },
        {
            restaurant_id: restaurant.id,
            category_id: catMap["حلويات 🍰"],
            name: "كيكة الشوكولاتة الداكنة",
            description: "كيكة اسفنجية غنية بالشوكولاتة البلجيكية الداكنة والفدج",
            price: 4500,
            image_url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80",
            is_available: true,
            sort_order: 1
        },
        {
            restaurant_id: restaurant.id,
            category_id: catMap["حلويات 🍰"],
            name: "تشيز كيك التوت",
            description: "كلاسيك تشيز كيك مع صوص التوت البري ومربى الفراولة المخبوزة في الفرن",
            price: 6000,
            image_url: "https://images.unsplash.com/photo-1542826438-bd32f43d626f?w=500&q=80",
            is_available: true,
            sort_order: 2
        }
    ];

    const { error: prodError } = await supabase
        .from("products")
        .insert(productsToInsert);

    if (prodError) {
        return NextResponse.json({ error: prodError.message }, { status: 500 });
    }

    // Insert Delivery Zone "مركز المدينة"
    const { data: zone, error: zoneError } = await supabase
        .from("delivery_zones")
        .insert({
            restaurant_id: restaurant.id,
            zone_name: "مركز المدينة",
            flat_rate: 2000,
            free_delivery_threshold: 25000,
            is_active: true
        })
        .select()
        .single();

    if (!zoneError && zone) {
        await supabase.from("delivery_areas").insert([
            { zone_id: zone.id, area_name: "المنصور" },
            { zone_id: zone.id, area_name: "الكرادة" },
            { zone_id: zone.id, area_name: "اليرموك" }
        ]);
    }

    // Insert Coupons
    await supabase.from("coupons").insert([
        {
            restaurant_id: restaurant.id,
            code: "TEST25",
            discount_type: "percentage",
            discount_value: 25,
            applies_to: "cart",
            min_order: 10000,
            is_active: true,
            is_global: true
        },
        {
            restaurant_id: restaurant.id,
            code: "FREE5",
            discount_type: "fixed",
            discount_value: 5000,
            applies_to: "cart",
            min_order: 20000,
            is_active: true,
            is_global: true
        }
    ]);

    return NextResponse.json({ success: true, message: "تمت إضافة البيانات التجريبية بنجاح! عد إلى لوحة التحكم لرؤيتها." });
}
