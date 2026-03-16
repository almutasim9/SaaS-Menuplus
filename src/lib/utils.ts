import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts Arabic numerals (٠١٢٣٤٥٦٧٨٩) to English numerals (0123456789)
 */
export function arabicToEnglishNumbers(str: string | number): string {
    if (typeof str === 'number') return str.toString();
    if (!str) return "";
    
    return str.replace(/[٠-٩]/g, (d) => {
        return (d.charCodeAt(0) - 1632).toString();
    });
}
