"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
    LayoutDashboard,
    Store,
    Shield,
    Menu,
    LogOut,
    ChevronRight,
    UtensilsCrossed,
    MapPin,
    ClipboardList,
    HeadphonesIcon,
    CalendarClock,
    Puzzle,
    DollarSign,
    Star,
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { GlobalSearch } from "@/components/admin/GlobalSearch";

const adminNavItems = [
    { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard },
    { href: "/admin/restaurants", label: "المطاعم", icon: Store },
    { href: "/admin/onboarding", label: "متابعة الإعداد", icon: ClipboardList },
    { href: "/admin/subscriptions", label: "الاشتراكات", icon: CalendarClock },
    { href: "/admin/addons", label: "الإضافات", icon: Puzzle },
    { href: "/admin/revenue", label: "الإيرادات", icon: DollarSign },
    { href: "/admin/early-adopters", label: "الروّاد الأوائل", icon: Star },
    { href: "/admin/locations", label: "إدارة المواقع", icon: MapPin },
    { href: "/admin/support", label: "الدعم الفني", icon: HeadphonesIcon },
];

function AdminSidebarContent({ pathname }: { pathname: string }) {
    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <span className="text-xl font-bold bg-gradient-to-r from-red-400 to-red-300 bg-clip-text text-transparent">لوحة الأدمن</span>
                        <p className="text-[10px] text-muted-foreground -mt-0.5">إدارة المنصة</p>
                    </div>
                </div>
            </div>

            <Separator className="opacity-50" />

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {adminNavItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                                ${isActive
                                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                }
                            `}
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                        </Link>
                    );
                })}
            </nav>

            <Separator className="opacity-50" />

            {/* Footer */}
            <div className="p-4 space-y-2">
                <div className="px-1">
                    <GlobalSearch />
                </div>
                <Link
                    href="/dashboard"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-200"
                >
                    <UtensilsCrossed className="w-5 h-5" />
                    لوحة تحكم المطعم
                </Link>
                <form action={signOut}>
                    <Button
                        type="submit"
                        variant="ghost"
                        className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                    >
                        <LogOut className="w-5 h-5" />
                        تسجيل الخروج
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    return (
        <div className="min-h-screen flex bg-background">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-72 flex-col border-r border-border/50 glass-card rounded-none">
                <AdminSidebarContent pathname={pathname} />
            </aside>

            {/* Mobile Sidebar */}
            <Sheet open={open} onOpenChange={setOpen}>
                <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass-strong px-4 py-3 flex items-center gap-3">
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl">
                            <Menu className="w-5 h-5" />
                        </Button>
                    </SheetTrigger>
                    <div className="flex items-center gap-2 flex-1">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-500 to-red-600">
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold bg-gradient-to-r from-red-400 to-red-300 bg-clip-text text-transparent">لوحة الأدمن</span>
                    </div>
                    <GlobalSearch />
                </div>
                <SheetContent side="left" className="w-72 p-0 glass-card border-border/50 flex flex-col h-full">
                    <SheetTitle className="sr-only">قائمة الأدمن</SheetTitle>
                    <div className="flex-1 overflow-y-auto">
                        <AdminSidebarContent pathname={pathname} />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <main className="flex-1 lg:max-h-screen lg:overflow-y-auto">
                <div className="p-6 lg:p-8 pt-20 lg:pt-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
