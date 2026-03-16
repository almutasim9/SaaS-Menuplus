"use client";

import { useState, useEffect } from "react";
import { getSystemLogs } from "@/lib/actions/admin";
import { Store, ShoppingCart, Clock } from "lucide-react";

export function AdminActivityLogs() {
    const [logs, setLogs] = useState<Awaited<ReturnType<typeof getSystemLogs>>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await getSystemLogs();
            setLogs(data);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-secondary/30" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-24 bg-secondary/30 rounded" />
                            <div className="h-3 w-48 bg-secondary/20 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {logs.map((log, i) => (
                <div key={i} className="flex gap-4 relative">
                    {/* Timeline Line */}
                    {i !== logs.length - 1 && (
                        <div className="absolute left-[19px] top-10 bottom-[-24px] w-[2px] bg-border/20" />
                    )}

                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-secondary/20 border border-border/40`}>
                        {log.type === "restaurant" ? (
                            <Store className={`w-4 h-4 ${log.color}`} />
                        ) : (
                            <ShoppingCart className={`w-4 h-4 ${log.color}`} />
                        )
                        }
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                            <h4 className="text-sm font-bold truncate">{log.title}</h4>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(log.time).toLocaleTimeString("ar-IQ", { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{log.subtitle}</p>
                    </div>
                </div>
            ))}

            {logs.length === 0 && (
                <div className="text-center py-6">
                    <p className="text-xs text-muted-foreground">لا توجد نشاطات مؤخراً.</p>
                </div>
            )}
        </div>
    );
}
