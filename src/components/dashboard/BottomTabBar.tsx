"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import {
    LayoutDashboard,
    ClipboardList,
    UtensilsCrossed,
    BarChart3,
    MoreHorizontal,
    Tags,
    Palette,
    CreditCard,
    Globe,
    Truck,
    LogOut,
    X,
    Settings,
    MapPin,
    Clock,
    CheckCircle,
} from "lucide-react";

const mainTabs = [
    { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
    { href: "/dashboard/orders/active", label: "الطلبات", icon: ClipboardList },
    { href: "/dashboard/menu", label: "القائمة", icon: UtensilsCrossed },
    { href: "/dashboard/analytics", label: "التحليلات", icon: BarChart3 },
    { id: "more", label: "المزيد", icon: MoreHorizontal },
];

const moreItems = [
    { href: "/dashboard/orders/history", label: "سجل الطلبات", icon: CheckCircle },
    { href: "/dashboard/discounts", label: "الخصومات", icon: Tags },
    { href: "/dashboard/appearance", label: "المظهر", icon: Palette },
    { href: "/dashboard/delivery/zones", label: "مناطق التوصيل", icon: MapPin },
    { href: "/dashboard/delivery/hours", label: "ساعات العمل", icon: Clock },
    { href: "/dashboard/billing", label: "الفوترة", icon: CreditCard },
    { href: "/dashboard/settings/domain", label: "الدومين المخصص", icon: Globe },
];

export function BottomTabBar() {
    const pathname = usePathname();
    const [showMore, setShowMore] = useState(false);

    const isTabActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(href);
    };

    // Check if any "more" item is active
    const isMoreActive = moreItems.some(item => pathname.startsWith(item.href));

    return (
        <>
            {/* More Sheet Overlay */}
            {showMore && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMore(false)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-[#111] border-t border-white/[0.06] rounded-t-3xl max-h-[70vh] overflow-y-auto animate-[slideUp_0.3s_ease-out]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 rounded-full bg-white/20" />
                        </div>

                        <div className="flex items-center justify-between px-5 pb-3">
                            <h3 className="text-sm font-bold">المزيد</h3>
                            <button onClick={() => setShowMore(false)} className="p-1.5 rounded-lg hover:bg-white/[0.06]">
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>

                        <div className="px-3 pb-4 space-y-0.5">
                            {moreItems.map(item => {
                                const isActive = pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setShowMore(false)}
                                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm transition-colors ${isActive
                                                ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                                                : "text-gray-300 hover:bg-white/[0.04]"
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                    </Link>
                                );
                            })}

                            {/* Logout */}
                            <form action={signOut}>
                                <button
                                    type="submit"
                                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm text-red-400 hover:bg-red-500/5 transition-colors mt-2"
                                >
                                    <LogOut className="w-5 h-5" />
                                    تسجيل الخروج
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Tab Bar */}
            <div
                className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.04]"
                style={{
                    background: 'rgba(10,10,10,0.85)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                }}
            >
                <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
                    {mainTabs.map(tab => {
                        if (tab.id === "more") {
                            return (
                                <button
                                    key="more"
                                    onClick={() => setShowMore(true)}
                                    className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-[56px] ${isMoreActive || showMore
                                            ? "text-emerald-400"
                                            : "text-gray-500"
                                        }`}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    <span className="text-[10px] font-medium">{tab.label}</span>
                                </button>
                            );
                        }

                        const active = isTabActive(tab.href!);
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href!}
                                className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-[56px] ${active ? "text-emerald-400" : "text-gray-500"
                                    }`}
                            >
                                {active && (
                                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-emerald-400" />
                                )}
                                <tab.icon className="w-5 h-5" />
                                <span className="text-[10px] font-medium">{tab.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* CSS for slide-up animation */}
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </>
    );
}
