import { IMAGE_CONSTRAINTS } from "@/lib/constants";

const ALLOWED_IMAGE_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    ...IMAGE_CONSTRAINTS.ALLOWED_TYPES,
];

/**
 * Validates an uploaded image file for MIME type and size.
 * Throws a descriptive error if validation fails.
 */
export function validateImageFile(file: File, fieldName = "الملف"): void {
    if (!file || file.size === 0) return;

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
        throw new Error(
            `${fieldName}: نوع الملف غير مدعوم. الأنواع المسموح بها: JPEG, PNG, WebP, GIF`
        );
    }

    if (file.size > IMAGE_CONSTRAINTS.MAX_SIZE_BYTES) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        throw new Error(
            `${fieldName}: حجم الملف (${sizeMB}MB) يتجاوز الحد المسموح (5MB)`
        );
    }
}
