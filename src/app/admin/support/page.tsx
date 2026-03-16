"use client";

import { useState, useEffect } from "react";
import { getAllTickets, replyToTicket, updateTicketStatus } from "@/lib/actions/support";
import {
    HeadphonesIcon, MessageSquare, Clock, CheckCircle, AlertCircle,
    Send, X, RefreshCw, Loader2,
} from "lucide-react";
import { toast } from "sonner";

type Ticket = Awaited<ReturnType<typeof getAllTickets>>[number];

const statusColors: Record<string, string> = {
    open: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    in_progress: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    closed: "text-gray-400 bg-gray-500/10 border-gray-500/20",
};
const statusLabels: Record<string, string> = {
    open: "مفتوح", in_progress: "قيد المعالجة", closed: "مغلق",
};
const priorityColors: Record<string, string> = {
    low: "text-gray-400 bg-gray-500/10",
    medium: "text-amber-400 bg-amber-500/10",
    high: "text-red-400 bg-red-500/10",
};
const priorityLabels: Record<string, string> = {
    low: "منخفض", medium: "متوسط", high: "عالي",
};

function TicketModal({ ticket, onClose, onUpdated }: {
    ticket: Ticket; onClose: () => void; onUpdated: () => void;
}) {
    const [reply, setReply] = useState(ticket.admin_reply || "");
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState(ticket.status);

    const handleReply = async () => {
        if (!reply.trim()) { toast.error("أدخل الرد"); return; }
        setSubmitting(true);
        const result = await replyToTicket(ticket.id, reply);
        if (result?.error) { toast.error(result.error); }
        else { toast.success("تم إرسال الرد"); onUpdated(); onClose(); }
        setSubmitting(false);
    };

    const handleStatusChange = async (newStatus: string) => {
        setStatus(newStatus);
        const result = await updateTicketStatus(ticket.id, newStatus);
        if (result?.error) { toast.error(result.error); setStatus(ticket.status); }
        else { toast.success(`تم تحديث الحالة إلى ${statusLabels[newStatus]}`); onUpdated(); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl rounded-2xl bg-[#141414] border border-white/[0.06] shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                    <div>
                        <h2 className="font-bold">{ticket.subject}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {(ticket as any).restaurants?.name} — {new Date(ticket.created_at).toLocaleString("ar-IQ")}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Ticket Message */}
                    <div className="p-4 rounded-xl bg-secondary/20 border border-border/20">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                            <MessageSquare className="w-3 h-3" />
                            رسالة العميل
                        </p>
                        <p className="text-sm leading-relaxed">{ticket.message}</p>
                    </div>

                    {/* Status Change */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">تغيير الحالة:</span>
                        <div className="flex gap-2">
                            {["open", "in_progress", "closed"].map(s => (
                                <button
                                    key={s}
                                    onClick={() => handleStatusChange(s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${status === s ? statusColors[s] : "text-muted-foreground border-border/30 hover:bg-secondary/30"}`}
                                >
                                    {statusLabels[s]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Admin Reply */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-2 block">الرد على التذكرة</label>
                        <textarea
                            value={reply}
                            onChange={e => setReply(e.target.value)}
                            rows={5}
                            placeholder="اكتب ردك هنا..."
                            className="w-full px-4 py-3 rounded-xl bg-secondary/20 border border-border/30 text-sm focus:outline-none focus:border-primary/50 resize-none"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-white/[0.06] flex justify-end">
                    <button
                        onClick={handleReply}
                        disabled={submitting}
                        className="h-10 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm flex items-center gap-2 disabled:opacity-50 transition-colors"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        إرسال الرد
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminSupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");
    const [selected, setSelected] = useState<Ticket | null>(null);

    const load = async () => {
        setLoading(true);
        const data = await getAllTickets({ status: filterStatus, priority: filterPriority });
        setTickets(data);
        setLoading(false);
    };

    useEffect(() => { load(); }, [filterStatus, filterPriority]);

    const openCount = tickets.filter(t => t.status === "open").length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <HeadphonesIcon className="w-7 h-7" />
                        الدعم الفني
                        {openCount > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-sm font-medium">
                                {openCount} مفتوحة
                            </span>
                        )}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">{tickets.length} تذكرة</p>
                </div>
                <button onClick={load} className="h-10 px-4 rounded-xl bg-secondary/50 hover:bg-secondary/80 border border-border/40 text-sm font-medium flex items-center gap-2 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    تحديث
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-10 px-3 rounded-xl bg-secondary/30 border border-border/40 text-sm">
                    <option value="all">كل الحالات</option>
                    <option value="open">مفتوح</option>
                    <option value="in_progress">قيد المعالجة</option>
                    <option value="closed">مغلق</option>
                </select>
                <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="h-10 px-3 rounded-xl bg-secondary/30 border border-border/40 text-sm">
                    <option value="all">كل الأولويات</option>
                    <option value="high">عالي</option>
                    <option value="medium">متوسط</option>
                    <option value="low">منخفض</option>
                </select>
            </div>

            {/* Tickets Table */}
            <div className="glass-card rounded-2xl border border-border/40 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/30 bg-secondary/10">
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">الموضوع</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">المطعم</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">الأولوية</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">الحالة</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">التاريخ</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(4)].map((_, i) => (
                                    <tr key={i} className="border-b border-border/10">
                                        <td className="px-5 py-4" colSpan={6}><div className="h-5 bg-secondary/30 rounded-lg animate-pulse" /></td>
                                    </tr>
                                ))
                            ) : tickets.map(ticket => (
                                <tr key={ticket.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => setSelected(ticket)}>
                                    <td className="px-5 py-4">
                                        <p className="font-medium">{ticket.subject}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ticket.message}</p>
                                    </td>
                                    <td className="px-5 py-4 text-sm">{(ticket as any).restaurants?.name || "—"}</td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${priorityColors[ticket.priority]}`}>
                                            {priorityLabels[ticket.priority]}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${statusColors[ticket.status]}`}>
                                            {ticket.status === "open" ? <AlertCircle className="w-3 h-3" />
                                                : ticket.status === "closed" ? <CheckCircle className="w-3 h-3" />
                                                    : <Clock className="w-3 h-3" />}
                                            {statusLabels[ticket.status]}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-muted-foreground">
                                        {new Date(ticket.created_at).toLocaleDateString("ar-IQ")}
                                    </td>
                                    <td className="px-5 py-4">
                                        <button className="text-xs text-primary hover:underline">
                                            {ticket.admin_reply ? "رد موجود" : "رد"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && tickets.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                        <HeadphonesIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">لا توجد تذاكر دعم.</p>
                    </div>
                )}
            </div>

            {/* Ticket Modal */}
            {selected && (
                <TicketModal
                    ticket={selected}
                    onClose={() => setSelected(null)}
                    onUpdated={() => { load(); setSelected(null); }}
                />
            )}
        </div>
    );
}
