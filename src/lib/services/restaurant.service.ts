import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { CreateRestaurantInput } from "../validations/restaurant";

export class RestaurantService {
    static async createRestaurant(input: CreateRestaurantInput) {
        const { ownerEmail, ownerPassword, ownerName, restaurantName, plan } = input;
        
        const serverSupabase = await createServerClient();
        
        // 1. Resolve slug BEFORE creating user
        const providedSlug = input.slug;
        const baseSlug = (
            providedSlug?.trim()
                ? providedSlug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/(^-|-$)/g, "")
                : restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
        ) || "restaurant";

        let slug = baseSlug;

        // Check slug uniqueness
        const { data: existingSlug } = await serverSupabase
            .from("restaurants")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();

        if (existingSlug) {
            if (providedSlug?.trim()) {
                throw new Error(`الرابط "${slug}" مستخدم بالفعل. اختر رابطاً آخر.`);
            }
            slug = `${baseSlug}-${Date.now().toString(36)}`;
        }

        // 2. Check email uniqueness
        const { data: existingUser } = await serverSupabase
            .from("profiles")
            .select("id, email")
            .eq("email", ownerEmail.toLowerCase().trim())
            .maybeSingle();

        if (existingUser) {
            throw new Error(`البريد "${ownerEmail}" مستخدم بالفعل. استخدم بريداً آخر.`);
        }

        // 3. Setup admin Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        const adminSupabase = serviceRoleKey
            ? createClient(supabaseUrl, serviceRoleKey, {
                auth: { autoRefreshToken: false, persistSession: false },
            })
            : null;

        // 4. Create auth user
        let userId: string;

        if (adminSupabase) {
            const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
                email: ownerEmail,
                password: ownerPassword,
                email_confirm: true,
                user_metadata: { full_name: ownerName },
            });

            if (authError) {
                throw new Error(authError.message);
            }
            userId = authData.user.id;
        } else {
            // Fallback
            const signupRes = await fetch(`${supabaseUrl}/auth/v1/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                },
                body: JSON.stringify({
                    email: ownerEmail,
                    password: ownerPassword,
                    data: { full_name: ownerName },
                }),
            });

            const signupResult = await signupRes.json();

            if (!signupRes.ok || !signupResult.id) {
                throw new Error(signupResult.error_description || signupResult.msg || "فشل إنشاء الحساب");
            }
            userId = signupResult.id;
        }

        // Helper: rollback
        const rollbackUser = async () => {
            if (adminSupabase) {
                await adminSupabase.auth.admin.deleteUser(userId);
            }
            console.error(`[ROLLBACK NEEDED] Orphan user created: ${userId} (${ownerEmail}). Delete manually in Supabase Auth.`);
        };

        const dbClient = adminSupabase || serverSupabase;

        // 5. Plan limits
        const planConfig: Record<string, { max_products: number; max_orders_per_month: number }> = {
            free: { max_products: 15, max_orders_per_month: 50 },
            pro: { max_products: 100, max_orders_per_month: 500 },
            business: { max_products: 999999, max_orders_per_month: 999999 },
        };
        const limits = planConfig[plan || "free"] || planConfig.free;

        // 6. Create restaurant
        const { data: restaurant, error: restaurantError } = await dbClient
            .from("restaurants")
            .insert({
                name: restaurantName,
                slug,
                owner_id: userId,
                subscription_plan: plan || "free",
                subscription_status: "active",
                max_products: limits.max_products,
                max_orders_per_month: limits.max_orders_per_month,
                governorate: input.governorate,
                city: input.city,
            })
            .select()
            .single();

        if (restaurantError) {
            await rollbackUser();
            throw new Error(`فشل إنشاء المطعم: ${restaurantError.message}`);
        }

        // 7. Link profile to restaurant
        const { error: profileError } = await dbClient
            .from("profiles")
            .update({
                restaurant_id: restaurant.id,
                full_name: ownerName,
                role: "owner",
            })
            .eq("id", userId);

        if (profileError) {
            await dbClient.from("restaurants").delete().eq("id", restaurant.id);
            await rollbackUser();
            throw new Error(`فشل ربط الحساب بالمطعم: ${profileError.message}`);
        }

        // 8. Auto-populate delivery zones if city is provided
        if (input.city) {
            try {
                await this.populateDeliveryZones(restaurant.id, input.city, dbClient);
            } catch (e) {
                console.error("Failed to populate delivery zones:", e);
                // We don't fail the whole creation for this, but log it.
            }
        }

        return restaurant;
    }

    static async populateDeliveryZones(restaurantId: string, city: string, dbClient: any) {
        // 1. Fetch areas for this city from master_locations
        const { data: areas, error: fetchError } = await dbClient
            .from("master_locations")
            .select("name_ar")
            .eq("city_name_ar", city);

        if (fetchError || !areas || areas.length === 0) {
            console.log(`No areas found for city: ${city}`);
            return;
        }

        // 2. Create a default Delivery Zone for this city
        const { data: zone, error: zoneError } = await dbClient
            .from("delivery_zones")
            .insert({
                restaurant_id: restaurantId,
                zone_name: city,
                flat_rate: 0,
                is_active: true
            })
            .select()
            .single();

        if (zoneError) throw zoneError;

        // 3. Insert specific areas into delivery_areas
        const deliveryAreas = areas.map((a: any) => ({
            zone_id: zone.id,
            area_name: a.name_ar
        }));

        const { error: areaError } = await dbClient
            .from("delivery_areas")
            .insert(deliveryAreas);

        if (areaError) throw areaError;
    }
}
