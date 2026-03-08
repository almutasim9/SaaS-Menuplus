"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";

interface CategoryFilterProps {
    categories: { id: string; name: string; name_en?: string | null; name_ku?: string | null }[];
    activeCategory: string | null;
    onSelect: (id: string | null) => void;
}

export function CategoryFilter({ categories, activeCategory, onSelect }: CategoryFilterProps) {
    const { t, locale } = useTranslation();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeCategory && scrollRef.current) {
            const activeEl = scrollRef.current.querySelector(`[data-cat-id="${activeCategory}"]`);
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            }
        }
    }, [activeCategory]);

    return (
        <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hidden py-2 px-1"
        >
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(null)}
                className={`
          px-5 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors duration-200
          ${!activeCategory
                        ? "text-white"
                        : "bg-gray-100/80 text-gray-800 hover:bg-gray-200"
                    }
        `}
                style={!activeCategory ? { backgroundColor: 'var(--primary)' } : undefined}
            >
                {t("common.all")}
            </motion.button>
            {categories.map((cat) => (
                <motion.button
                    key={cat.id}
                    data-cat-id={cat.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelect(cat.id)}
                    className={`
            px-5 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors duration-200
            ${activeCategory === cat.id
                            ? "text-white"
                            : "bg-gray-100/80 text-gray-800 hover:bg-gray-200"
                        }
          `}
                    style={activeCategory === cat.id ? { backgroundColor: 'var(--primary)' } : undefined}
                >
                    {locale === 'en' && cat.name_en ? cat.name_en : locale === 'ku' && cat.name_ku ? cat.name_ku : cat.name}
                </motion.button>
            ))}
        </div>
    );
}
