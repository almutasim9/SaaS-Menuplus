"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { signOut } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { BottomTabBar } from "@/components/dashboard/BottomTabBar";
import { MobileHeader } from "@/components/dashboard/MobileHeader";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher";
import { GlobalAnnouncement } from "@/components/dashboard/GlobalAnnouncement";
import { useTranslation } from "@/lib/i18n/context";
import {
    LayoutDashboard,
    UtensilsCrossed,
    Truck,
    Tags,
    Palette,
    LogOut,
    ChevronRight,
    ClipboardList,
    Clock,
    CheckCircle,
    MapPin,
    Sun,
    Moon,
    BarChart3,
    CreditCard,
    Globe,
    Settings,
    HeadphonesIcon,
} from "lucide-react";

type Role = "owner" | "manager" | "cashier" | "kitchen";

type NavItem = {
    href?: string;
    labelKey: string;
    icon: typeof LayoutDashboard;
    allowedRoles: string[];
    children?: NavItem[];
};

const navItems: NavItem[] = [
    { href: "/dashboard", labelKey: "sidebar.dashboard", icon: LayoutDashboard, allowedRoles: ["owner", "manager"] },
    {
        labelKey: "sidebar.orders", icon: ClipboardList, allowedRoles: ["owner", "manager", "cashier", "kitchen"],
        children: [
            { href: "/dashboard/orders/active", labelKey: "sidebar.activeOrders", icon: Clock, allowedRoles: ["owner", "manager", "cashier", "kitchen"] },
            { href: "/dashboard/orders/history", labelKey: "sidebar.orderHistory", icon: CheckCircle, allowedRoles: ["owner", "manager", "cashier"] },
        ],
    },
    { href: "/dashboard/menu", labelKey: "sidebar.menu", icon: UtensilsCrossed, allowedRoles: ["owner", "manager"] },
    {
        labelKey: "deliverySettings.title", icon: Truck, allowedRoles: ["owner", "manager"],
        children: [
            { href: "/dashboard/delivery/zones", labelKey: "deliverySettings.zones", icon: MapPin, allowedRoles: ["owner", "manager"] },
            { href: "/dashboard/delivery/locations", labelKey: "sidebar.locations", icon: Globe, allowedRoles: ["owner", "manager"] },
            { href: "/dashboard/delivery/hours", labelKey: "settings.workingHours", icon: Clock, allowedRoles: ["owner", "manager"] },
        ],
    },
    { href: "/dashboard/discounts", labelKey: "sidebar.discounts", icon: Tags, allowedRoles: ["owner", "manager"] },
    { href: "/dashboard/analytics", labelKey: "sidebar.analytics", icon: BarChart3, allowedRoles: ["owner", "manager"] },
    { href: "/dashboard/appearance", labelKey: "sidebar.appearance", icon: Palette, allowedRoles: ["owner"] },
    { href: "/dashboard/billing", labelKey: "sidebar.billing", icon: CreditCard, allowedRoles: ["owner"] },
    { href: "/dashboard/support", labelKey: "sidebar.support", icon: HeadphonesIcon, allowedRoles: ["owner", "manager"] },
    {
        labelKey: "sidebar.settings", icon: Settings, allowedRoles: ["owner"],
        children: [
            { href: "/dashboard/settings/domain", labelKey: "settings.slug", icon: Globe, allowedRoles: ["owner"] },
        ],
    },
];

function DesktopSidebar({ pathname, theme, toggleTheme, userRole }: { pathname: string; theme: string; toggleTheme: () => void; userRole: string | null }) {
    const { t } = useTranslation();

    const filteredNavItems = navItems
        .filter(item => !userRole || !item.allowedRoles || item.allowedRoles.includes(userRole as Role))
        .map(item => {
            if (item.children) {
                return {
                    ...item,
                    children: item.children.filter(child => !userRole || !child.allowedRoles || child.allowedRoles.includes(userRole as Role)),
                };
            }
            return item;
        });

    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl gradient-emerald">
                        <UtensilsCrossed className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-gradient">MenuPlus</span>
                </div>
            </div>

            <Separator className="opacity-50" />

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {filteredNavItems.map((item) => {
                    if ("children" in item && item.children) {
                        const isParentActive = item.children.some((c) => pathname === c.href);
                        return (
                            <div key={item.labelKey} className="space-y-0.5">
                                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${isParentActive ? "text-foreground" : "text-muted-foreground"}`}>
                                    <item.icon className="w-5 h-5" />
                                    {t(item.labelKey)}
                                </div>
                                <div className="ms-4 ps-4 border-s border-border/30 space-y-0.5">
                                    {item.children.map((child) => {
                                        const isChildActive = pathname === child.href;
                                        return (
                                            <Link
                                                key={child.href}
                                                href={child.href!}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isChildActive
                                                    ? "gradient-emerald text-white shadow-lg shadow-emerald/20"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                                    }`}
                                            >
                                                <child.icon className="w-4 h-4" />
                                                {t(child.labelKey)}
                                                {isChildActive && <ChevronRight className="w-4 h-4 ms-auto rtl:rotate-180" />}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    }

                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href!}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                ? "gradient-emerald text-white shadow-lg shadow-emerald/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {t(item.labelKey)}
                            {isActive && <ChevronRight className="w-4 h-4 ms-auto rtl:rotate-180" />}
                        </Link>
                    );
                })}
            </nav>

            <Separator className="opacity-50" />

            {/* Language + Theme + Logout */}
            <div className="p-4 space-y-1">
                <LanguageSwitcher />
                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-200"
                >
                    {theme === "dark" ? (
                        <><Sun className="w-5 h-5" /> Light Mode</>
                    ) : (
                        <><Moon className="w-5 h-5" /> Dark Mode</>
                    )}
                </button>
                <Button
                    onClick={async () => { await signOut(); window.location.href = "/login"; }}
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                >
                    <LogOut className="w-5 h-5" />
                    {t("sidebar.logout")}
                </Button>
            </div>
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        async function fetchRole() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                if (data) setUserRole(data.role);
            }
        }
        fetchRole();
    }, []);

    const currentTheme = mounted ? (resolvedTheme || theme || "dark") : "dark";
    const toggleTheme = () => setTheme(currentTheme === "dark" ? "light" : "dark");

    return (
        <div className="min-h-screen flex bg-background">
            {/* ============ DESKTOP: Sidebar ============ */}
            <aside className="hidden lg:flex w-72 flex-col border-r border-border/50 glass-card rounded-none">
                <DesktopSidebar pathname={pathname} theme={currentTheme} toggleTheme={toggleTheme} userRole={userRole} />
            </aside>

            {/* ============ MOBILE: Top Header + Bottom Tab Bar ============ */}
            <MobileHeader />
            <BottomTabBar />

            {/* ============ Main Content ============ */}
            <main className="flex-1 lg:max-h-screen lg:overflow-y-auto relative">
                {/* Floating Desktop Notification Bell */}
                <div className="hidden lg:flex fixed top-6 end-8 z-50">
                    <div className="glass-card rounded-2xl p-1 shadow-sm border border-border/40">
                        <NotificationBell />
                    </div>
                </div>

                {/* pt-16 on mobile for header, pb-20 for bottom bar */}
                <div className="p-4 pt-[68px] pb-24 lg:p-8 lg:pt-8 lg:pb-8">
                    <GlobalAnnouncement />
                    {children}
                </div>
            </main>
        </div>
    );
}
