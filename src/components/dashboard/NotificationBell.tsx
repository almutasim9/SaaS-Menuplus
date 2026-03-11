"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/context";
import { useNotifications } from "@/lib/hooks/useNotifications";
import {
    Bell,
    AlertTriangle,
    Info,
    CheckCircle,
    XCircle,
    X,
    ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

const typeConfig = {
    warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    success: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    error: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
};

export function NotificationBell() {
    const { t, dir } = useTranslation();
    const [open, setOpen] = useState(false);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const { data: notifications = [] } = useNotifications();

    const visible = notifications.filter(n => !dismissed.has(n.id));
    const unreadCount = visible.length;

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button className="relative p-2 rounded-xl hover:bg-secondary/50 transition-colors">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </SheetTrigger>
            <SheetContent
                className="w-full sm:max-w-md p-0 border-s border-border/40 bg-background/95 backdrop-blur-xl"
                side="left" // In RTL "left" acts as the start logically depending on shadcn implementation, we will use "left" since sidebar is right in RTL
                dir={dir}
            >
                <div className="flex flex-col h-full">
                    <SheetHeader className="px-5 py-4 border-b border-border/30 bg-secondary/10 shrink-0">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-lg font-bold">{t("notifications.title")}</SheetTitle>
                            <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
                                {unreadCount} {t("notifications.newCount")}
                            </span>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto">
                        {visible.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                                <Bell className="w-12 h-12 text-muted-foreground/20 mb-4" />
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t("notifications.noNew")}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/10">
                                {visible.map((n) => {
                                    const config = typeConfig[n.type];
                                    const Icon = config.icon;
                                    return (
                                        <div key={n.id} className="p-4 flex gap-4 hover:bg-secondary/20 transition-colors relative group">
                                            <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                                                <Icon className={`w-5 h-5 ${config.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0 pr-6">
                                                <p className="text-sm font-semibold">{n.title}</p>
                                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                                            </div>
                                            <button
                                                onClick={() => setDismissed(prev => new Set(prev).add(n.id))}
                                                className="absolute top-4 right-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary/50 transition-all text-muted-foreground hover:text-foreground rtl:left-4 rtl:right-auto"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {visible.some(n => n.type === "warning" || n.type === "error") && (
                        <div className="p-4 border-t border-border/30 shrink-0">
                            <Link
                                href="/dashboard/billing"
                                onClick={() => setOpen(false)}
                                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                            >
                                <ArrowUpRight className="w-4 h-4" />
                                {t("notifications.upgradePlan")}
                            </Link>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
