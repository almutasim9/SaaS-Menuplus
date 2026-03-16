"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { globalSearch } from "@/lib/actions/admin";
import { Search, Store, User, X, Command, Crown, Zap, Rocket } from "lucide-react";

const planIcons: Record<string, typeof Zap> = { free: Zap, pro: Crown, business: Rocket };
const planColors: Record<string, string> = {
    free: "text-gray-400", pro: "text-emerald-400", business: "text-violet-400",
};

type SearchResults = Awaited<ReturnType<typeof globalSearch>>;

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Ctrl+K / Cmd+K to open
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setOpen(prev => !prev);
            }
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50);
        else { setQuery(""); setResults(null); }
    }, [open]);

    const doSearch = useCallback(async (q: string) => {
        if (q.length < 2) { setResults(null); return; }
        setLoading(true);
        const data = await globalSearch(q);
        setResults(data);
        setSelectedIndex(0);
        setLoading(false);
    }, []);

    const onInput = (val: string) => {
        setQuery(val);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => doSearch(val), 300);
    };

    const allItems = results ? [
        ...results.restaurants.map(r => ({ type: "restaurant", id: r.id, label: r.name, sub: `/${r.slug}`, plan: r.subscription_plan, href: `/admin/restaurants/${r.id}` })),
        ...results.users.map(u => ({ type: "user", id: u.id, label: u.full_name || u.email, sub: u.email, plan: null, href: u.restaurant_id ? `/admin/restaurants/${u.restaurant_id}` : null })),
    ] : [];

    const handleSelect = (item: typeof allItems[number]) => {
        if (item.href) router.push(item.href);
        setOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, allItems.length - 1)); }
        if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
        if (e.key === "Enter" && allItems[selectedIndex]) handleSelect(allItems[selectedIndex]);
    };

    const hasResults = results && (results.restaurants.length > 0 || results.users.length > 0);

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 h-9 px-3 rounded-xl bg-secondary/30 border border-border/40 text-sm text-muted-foreground hover:bg-secondary/50 transition-colors"
            >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">بحث سريع...</span>
                <div className="hidden sm:flex items-center gap-0.5 mr-auto">
                    <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-secondary/50 border border-border/40 font-mono">⌘</kbd>
                    <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-secondary/50 border border-border/40 font-mono">K</kbd>
                </div>
            </button>

            {/* Modal */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <div className="relative w-full max-w-xl rounded-2xl bg-[#141414] border border-white/[0.08] shadow-2xl overflow-hidden">
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                            <Search className="w-4 h-4 text-gray-500 shrink-0" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={e => onInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="ابحث عن مطعم أو مستخدم..."
                                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-600"
                            />
                            {query && (
                                <button onClick={() => { setQuery(""); setResults(null); }} className="text-gray-600 hover:text-gray-400">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            <kbd className="px-2 py-1 rounded-lg text-[10px] bg-secondary/40 border border-white/[0.06] text-gray-500 font-mono">ESC</kbd>
                        </div>

                        {/* Results */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading && (
                                <div className="flex items-center justify-center py-10 text-muted-foreground">
                                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                </div>
                            )}

                            {!loading && query.length >= 2 && !hasResults && (
                                <div className="text-center py-10 text-sm text-muted-foreground">
                                    لا توجد نتائج لـ "{query}"
                                </div>
                            )}

                            {!loading && hasResults && (
                                <div className="py-2">
                                    {results!.restaurants.length > 0 && (
                                        <>
                                            <p className="px-4 py-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">المطاعم</p>
                                            {results!.restaurants.map((r, i) => {
                                                const idx = i;
                                                const PlanIcon = planIcons[r.subscription_plan || "free"] || Zap;
                                                const isSelected = selectedIndex === idx;
                                                return (
                                                    <button
                                                        key={r.id}
                                                        onClick={() => { router.push(`/admin/restaurants/${r.id}`); setOpen(false); }}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors ${isSelected ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"}`}
                                                    >
                                                        <div className="w-8 h-8 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
                                                            <Store className="w-4 h-4 text-muted-foreground" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{r.name}</p>
                                                            <p className="text-xs text-muted-foreground">/{r.slug}</p>
                                                        </div>
                                                        <PlanIcon className={`w-3.5 h-3.5 shrink-0 ${planColors[r.subscription_plan || "free"]}`} />
                                                    </button>
                                                );
                                            })}
                                        </>
                                    )}

                                    {results!.users.length > 0 && (
                                        <>
                                            <p className="px-4 py-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider mt-1">المستخدمون</p>
                                            {results!.users.map((u, i) => {
                                                const idx = results!.restaurants.length + i;
                                                const isSelected = selectedIndex === idx;
                                                return (
                                                    <button
                                                        key={u.id}
                                                        onClick={() => {
                                                            if (u.restaurant_id) router.push(`/admin/restaurants/${u.restaurant_id}`);
                                                            setOpen(false);
                                                        }}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors ${isSelected ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"}`}
                                                    >
                                                        <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                                                            <User className="w-4 h-4 text-violet-400" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{u.full_name || "—"}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                                        </div>
                                                        {u.role === "super_admin" && (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">أدمن</span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>
                            )}

                            {!query && (
                                <div className="px-4 py-6 text-center text-xs text-muted-foreground space-y-1">
                                    <p>ابدأ الكتابة للبحث</p>
                                    <p className="opacity-60">مطاعم • مستخدمون</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-white/[0.04] px-4 py-2 flex items-center gap-4 text-[10px] text-gray-600">
                            <span className="flex items-center gap-1"><kbd className="px-1 rounded bg-white/[0.04] font-mono">↑↓</kbd> تنقل</span>
                            <span className="flex items-center gap-1"><kbd className="px-1 rounded bg-white/[0.04] font-mono">↵</kbd> فتح</span>
                            <span className="flex items-center gap-1"><kbd className="px-1 rounded bg-white/[0.04] font-mono">ESC</kbd> إغلاق</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
