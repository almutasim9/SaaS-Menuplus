import { z } from "zod";

export const createRestaurantSchema = z.object({
    ownerEmail: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
    ownerPassword: z.string().min(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }),
    ownerName: z.string().min(2, { message: "اسم المالك مطلوب" }),
    restaurantName: z.string().min(2, { message: "اسم المطعم مطلوب" }),
    slug: z.string().optional(),
    plan: z.enum(["free", "pro", "business"]).optional().default("free"),
});

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
