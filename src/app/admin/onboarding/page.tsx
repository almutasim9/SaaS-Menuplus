"use client";

import { useState, useEffect } from "react";
import { getOnboardingStatus } from "@/lib/actions/admin";
import Link from "next/link";
import {
    ClipboardList, Image, Package, Clock, Phone,
    CheckCircle, XCircle, ExternalLink, RefreshCw,
} from "lucide-react";

type OnboardingEntry = Awaited<ReturnType<typeof getOnboardingStatus>>[number];

const steps = [
    { key: "hasLogo", label: "لوجو", icon: Image },
    { key: "hasProducts", label: "منتجات", icon: Package },
    { key: "hasHours", label: "أوقات العمل", icon: Clock },
    { key: "hasContact", label: "تواصل", icon: Phone },
] as const;

function ScoreBadge({ pct }: { pct: number }) {
    const color = pct === 100
        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        : pct >= 50
            ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
            : "text-red-400 bg-red-500/10 border-red-500/20";
    const label = pct === 100 ? "مكتمل" : pct === 0 ? "جديد" : "ناقص";
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${color}`}>
            {label} {pct}%
        </span>
    );
}

export default function OnboardingTrackerPage() {
    const [entries, setEntries] = useState<OnboardingEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<"all" | "complete" | "incomplete" | "new">("all");

    const load = async () => {
        setLoading(true);
        const data = await getOnboardingStatus();
        setEntries(data);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const filtered = entries.filter(e => {
        if (filterStatus === "complete") return e.pct === 100;
        if (filterStatus === "incomplete") return e.pct > 0 && e.pct < 100;
        if (filterStatus === "new") return e.pct === 0;
        return true;
    });

    const stats = {
        total: entries.length,
        complete: entries.filter(e => e.pct === 100).length,
        incomplete: entries.filter(e => e.pct > 0 && e.pct < 100).length,
        new: entries.filter(e => e.pct === 0).length,
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-64 bg-secondary/50 rounded-xl animate-pulse" />
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-secondary/30 rounded-2xl animate-pulse" />)}
                </div>
                <div className="h-80 bg-secondary/20 rounded-2xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <ClipboardList className="w-7 h-7" />
                        متابعة الإعداد
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">المطاعم المنضمة خلال آخر 30 يوم ونسبة اكتمال إعدادها.</p>
                </div>
                <button
                    onClick={load}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 hover:bg-secondary/80 border border-border/40 text-sm font-medium transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    تحديث
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "الكل", value: stats.total, color: "text-foreground", bg: "bg-secondary/30", key: "all" },
                    { label: "مكتمل", value: stats.complete, color: "text-emerald-400", bg: "bg-emerald-500/10", key: "complete" },
                    { label: "ناقص", value: stats.incomplete, color: "text-amber-400", bg: "bg-amber-500/10", key: "incomplete" },
                    { label: "جديد (0%)", value: stats.new, color: "text-red-400", bg: "bg-red-500/10", key: "new" },
                ].map(s => (
                    <button
                        key={s.key}
                        onClick={() => setFilterStatus(s.key as any)}
                        className={`glass-card rounded-2xl p-5 border text-right transition-all ${filterStatus === s.key ? "border-primary/50" : "border-border/40 hover:border-border/60"}`}
                    >
                        <p className="text-xs text-muted-foreground mb-2">{s.label}</p>
                        <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    </button>
                ))}
            </div>

            {/* Onboarding Steps Legend */}
            <div className="flex flex-wrap items-center gap-4 px-1">
                {steps.map(s => (
                    <div key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <s.icon className="w-3.5 h-3.5" />
                        {s.label}
                    </div>
                ))}
                <span className="text-xs text-muted-foreground mr-auto">
                    {filtered.length} نتيجة
                </span>
            </div>

            {/* Table */}
            <div className="glass-card rounded-2xl border border-border/40 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/30 bg-secondary/10">
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">المطعم</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">صاحب المطعم</th>
                                <th className="text-center px-3 py-3.5 text-muted-foreground font-medium text-xs">لوجو</th>
                                <th className="text-center px-3 py-3.5 text-muted-foreground font-medium text-xs">منتجات</th>
                                <th className="text-center px-3 py-3.5 text-muted-foreground font-medium text-xs">أوقات</th>
                                <th className="text-center px-3 py-3.5 text-muted-foreground font-medium text-xs">تواصل</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">الاكتمال</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">الانضمام</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(entry => (
                                <tr key={entry.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                                    <td className="px-5 py-4">
                                        <div>
                                            <Link
                                                href={`/admin/restaurants/${entry.id}`}
                                                className="font-semibold hover:text-primary transition-colors"
                                            >
                                                {entry.name}
                                            </Link>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                /{entry.slug}
                                                <a href={`/menu/${entry.slug}`} target="_blank" className="hover:text-primary">
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        {entry.owner ? (
                                            <div>
                                                <p className="text-sm">{(entry.owner as any).full_name || "—"}</p>
                                                <p className="text-xs text-muted-foreground">{(entry.owner as any).email}</p>
                                            </div>
                                        ) : <span className="text-muted-foreground">—</span>}
                                    </td>
                                    {(["hasLogo", "hasProducts", "hasHours", "hasContact"] as const).map(key => (
                                        <td key={key} className="px-3 py-4 text-center">
                                            {entry.steps[key]
                                                ? <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />
                                                : <XCircle className="w-4 h-4 text-red-400/40 mx-auto" />}
                                        </td>
                                    ))}
                                    <td className="px-5 py-4">
                                        <div className="space-y-1.5">
                                            <ScoreBadge pct={entry.pct} />
                                            <div className="w-24 h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${entry.pct === 100 ? "bg-emerald-500" : entry.pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                                                    style={{ width: `${entry.pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-muted-foreground">
                                        {new Date(entry.created_at).toLocaleDateString("ar-IQ")}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                        <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">لا توجد نتائج مطابقة.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
