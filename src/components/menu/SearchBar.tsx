"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
}

export function SearchBar({ onSearch, placeholder }: SearchBarProps) {
    const { t, dir } = useTranslation();
    const [query, setQuery] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => onSearch(query), 200);
        return () => clearTimeout(timer);
    }, [query, onSearch]);

    return (
        <div className="relative w-full">
            <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder || t("storefront.searchPlaceholder")}
                className={`w-full h-12 rounded-2xl bg-gray-50 border border-gray-100 text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all text-sm ${dir === 'rtl' ? 'pr-11 pl-10' : 'pl-11 pr-10'}`}
                dir={dir}
            />
            {query && (
                <button
                    onClick={() => setQuery("")}
                    className={`absolute ${dir === 'rtl' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors`}
                >
                    <X className="w-4 h-4 text-gray-500" />
                </button>
            )}
        </div>
    );
}
