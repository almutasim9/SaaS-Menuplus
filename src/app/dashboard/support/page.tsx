"use client";

import { useState, useEffect } from "react";
import { createTicket, getRestaurantTickets } from "@/lib/actions/support";
import {
    HeadphonesIcon, Plus, MessageSquare, Clock, CheckCircle, AlertCircle,
    X, Send, Loader2, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

type Ticket = Awaited<ReturnType<typeof getRestaurantTickets>>[number];

const statusColors: Record<string, string> = {
    open: "text-amber-400 bg-amber-500/10",
    in_progress: "text-blue-400 bg-blue-500/10",
    closed: "text-gray-400 bg-gray-500/10",
};
const statusLabels: Record<string, string> = {
    open: "مفتوح", in_progress: "قيد المعالجة", closed: "مغلق",
};

function NewTicketModal({ open, onClose, onCreated }: {
    open: boolean; onClose: () => void; onCreated: () => void;
}) {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [priority, setPriority] = useState("medium");
    const [loading, setLoading] = useState(false);

    if (!open) return null;

    const handleSubmit = async () => {
        if (!subject.trim()) { toast.error("أدخل موضوع التذكرة"); return; }
        if (!message.trim()) { toast.error("أدخل رسالتك"); return; }
        setLoading(true);
        const result = await createTicket({ subject, message, priority });
        if (result?.error) { toast.error(result.error); }
        else { toast.success("تم إرسال التذكرة — سيتواصل معك الدعم قريباً"); setSubject(""); setMessage(""); onCreated(); onClose(); }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg rounded-2xl bg-[#141414] border border-white/[0.06] shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                    <h2 className="font-bold">تذكرة دعم جديدة</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-300 mb-1.5 block">الموضوع</label>
                        <input
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            placeholder="مثال: مشكلة في الطلبات"
                            className="w-full h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm focus:outline-none focus:border-primary/50"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-300 mb-1.5 block">الأولوية</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: "low", label: "منخفضة", color: "gray" },
                                { value: "medium", label: "متوسطة", color: "amber" },
                                { value: "high", label: "عالية", color: "red" },
                            ].map(p => (
                                <button
                                    key={p.value}
                                    onClick={() => setPriority(p.value)}
                                    className={`h-10 rounded-xl text-xs font-medium border transition-all ${priority === p.value
                                        ? `border-${p.color}-500/50 bg-${p.color}-500/10 text-${p.color}-400`
                                        : "border-white/[0.06] bg-white/[0.02] text-gray-500 hover:bg-white/[0.04]"
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-300 mb-1.5 block">الرسالة</label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            rows={5}
                            placeholder="اشرح مشكلتك بالتفصيل..."
                            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm focus:outline-none focus:border-primary/50 resize-none"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-white/[0.06] flex justify-end gap-3">
                    <button onClick={onClose} className="h-10 px-5 rounded-xl border border-white/[0.06] text-sm text-gray-400 hover:text-white transition-colors">
                        إلغاء
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="h-10 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm flex items-center gap-2 disabled:opacity-50 transition-colors"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        إرسال
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function DashboardSupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        const data = await getRestaurantTickets();
        setTickets(data);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-56 bg-secondary/50 rounded-xl animate-pulse" />
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-secondary/30 rounded-2xl animate-pulse" />)}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <HeadphonesIcon className="w-7 h-7" />
                        الدعم الفني
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">تواصل مع فريق الدعم وتابع تذاكرك.</p>
                </div>
                <button
                    onClick={() => setShowNew(true)}
                    className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    تذكرة جديدة
                </button>
            </div>

            {/* Info Box */}
            <div className="glass-card rounded-2xl p-5 border border-border/40 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <p className="font-medium text-sm">كيف نساعدك؟</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        افتح تذكرة دعم وسيتواصل معك فريقنا في أقرب وقت ممكن. وقت الاستجابة المعتاد هو 24-48 ساعة.
                    </p>
                </div>
            </div>

            {/* Tickets List */}
            {tickets.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <HeadphonesIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">لا توجد تذاكر دعم بعد.</p>
                    <button onClick={() => setShowNew(true)} className="mt-3 text-sm text-primary hover:underline">
                        افتح أول تذكرة
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {tickets.map(ticket => (
                        <div key={ticket.id} className="glass-card rounded-2xl border border-border/40 overflow-hidden">
                            <button
                                className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/20 transition-colors text-right"
                                onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[ticket.status]}`}>
                                        {ticket.status === "open" ? <AlertCircle className="w-3 h-3" />
                                            : ticket.status === "closed" ? <CheckCircle className="w-3 h-3" />
                                                : <Clock className="w-3 h-3" />}
                                        {statusLabels[ticket.status]}
                                    </span>
                                    <div className="text-right">
                                        <p className="font-semibold text-sm">{ticket.subject}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {new Date(ticket.created_at).toLocaleDateString("ar-IQ")}
                                        </p>
                                    </div>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === ticket.id ? "rotate-180" : ""}`} />
                            </button>

                            {expandedId === ticket.id && (
                                <div className="border-t border-border/20 px-5 py-4 space-y-4 bg-secondary/5">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1.5">رسالتك</p>
                                        <p className="text-sm leading-relaxed">{ticket.message}</p>
                                    </div>
                                    {ticket.admin_reply && (
                                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                                            <p className="text-xs text-primary font-medium mb-1.5 flex items-center gap-1.5">
                                                <HeadphonesIcon className="w-3 h-3" />
                                                رد فريق الدعم
                                            </p>
                                            <p className="text-sm leading-relaxed">{ticket.admin_reply}</p>
                                            {ticket.replied_at && (
                                                <p className="text-[10px] text-muted-foreground mt-2">
                                                    {new Date(ticket.replied_at).toLocaleString("ar-IQ")}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <NewTicketModal
                open={showNew}
                onClose={() => setShowNew(false)}
                onCreated={load}
            />
        </div>
    );
}
