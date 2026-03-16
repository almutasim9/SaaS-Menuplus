"use client";

import { useState, useEffect } from "react";
import { getActiveAnnouncements } from "@/lib/actions/admin";
import { Info, AlertTriangle, CheckCircle, XCircle, X, Megaphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function GlobalAnnouncement() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [dismissed, setDismissed] = useState<string[]>([]);

    useEffect(() => {
        const load = async () => {
            const data = await getActiveAnnouncements();
            setAnnouncements(data);
        };
        load();

        // Load dismissed IDs from localStorage
        const saved = localStorage.getItem("dismissed_announcements");
        if (saved) setDismissed(JSON.parse(saved));
    }, []);

    const handleDismiss = (id: string) => {
        const updated = [...dismissed, id];
        setDismissed(updated);
        localStorage.setItem("dismissed_announcements", JSON.stringify(updated));
    };

    const activeAnnouncements = announcements.filter(a => !dismissed.includes(a.id));

    if (activeAnnouncements.length === 0) return null;

    return (
        <div className="space-y-3 mb-6">
            <AnimatePresence>
                {activeAnnouncements.map((ann) => (
                    <motion.div
                        key={ann.id}
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 0 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className={`relative overflow-hidden rounded-2xl border flex items-start gap-4 p-4 pr-12 transition-all shadow-sm ${
                            ann.type === 'info' ? 'bg-blue-500/5 border-blue-500/20' :
                            ann.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                            ann.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
                            'bg-red-500/5 border-red-500/20'
                        }`}
                    >
                        <div className={`p-2 rounded-xl shrink-0 ${
                            ann.type === 'info' ? 'bg-blue-500/10 text-blue-500' :
                            ann.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                            ann.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                            'bg-red-500/10 text-red-500'
                        }`}>
                            {ann.type === 'info' && <Info className="w-5 h-5" />}
                            {ann.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                            {ann.type === 'success' && <CheckCircle className="w-5 h-5" />}
                            {ann.type === 'error' && <XCircle className="w-5 h-5" />}
                        </div>

                        <div className="min-w-0 pt-0.5">
                            <h4 className="text-sm font-bold flex items-center gap-2 mb-1">
                                {ann.title}
                                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {ann.message}
                            </p>
                        </div>

                        <button
                            onClick={() => handleDismiss(ann.id)}
                            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Background Decor */}
                        <div className="absolute -bottom-6 -right-6 opacity-5 rotate-12">
                            <Megaphone className="w-24 h-24" />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
