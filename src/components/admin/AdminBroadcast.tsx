"use client";

import { useState, useEffect } from "react";
import { sendBroadcast, getAllAnnouncements, deleteAnnouncement, toggleAnnouncementActive } from "@/lib/actions/admin";
import {
    Megaphone, Send, Loader2, Info, AlertTriangle, CheckCircle, XCircle,
    Trash2, Power, PowerOff, Eye, X, Crown, Zap, Rocket,
} from "lucide-react";
import { toast } from "sonner";

const typeIcons: Record<string, typeof Info> = {
    info: Info, warning: AlertTriangle, success: CheckCircle, error: XCircle,
};
const typeColors: Record<string, string> = {
    info: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    error: "text-red-400 bg-red-500/10 border-red-500/20",
};

function PreviewModal({ form, onClose }: { form: any; onClose: () => void }) {
    const Icon = typeIcons[form.type] || Info;
    const colorClass = typeColors[form.type] || typeColors.info;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md rounded-2xl bg-[#141414] border border-white/[0.06] shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                    <span className="text-sm font-bold">معاينة الإعلان</span>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-[10px] text-gray-500 mb-3">هكذا يظهر الإعلان للمطاعم:</p>
                    <div className={`p-4 rounded-xl border ${colorClass} flex items-start gap-3`}>
                        <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-bold">{form.title || "عنوان الإعلان"}</p>
                            <p className="text-xs mt-1 opacity-80">{form.message || "محتوى الرسالة..."}</p>
                        </div>
                    </div>
                    {(form.target_plan && form.target_plan !== "all") && (
                        <p className="text-[10px] text-muted-foreground mt-3 text-center">
                            يُعرض فقط لمطاعم الخطة: <span className="font-medium">{{free:"مجاني",pro:"احترافي",business:"أعمال"}[form.target_plan as string]}</span>
                        </p>
                    )}
                    {form.expires_at && (
                        <p className="text-[10px] text-muted-foreground mt-1 text-center">
                            ينتهي في: {new Date(form.expires_at).toLocaleDateString("ar-IQ")}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export function AdminBroadcast() {
    const [loading, setLoading] = useState(false);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [form, setForm] = useState({
        title: "",
        message: "",
        type: "info",
        target_plan: "all",
        expires_at: "",
    });

    const loadAnnouncements = async () => {
        const data = await getAllAnnouncements();
        setAnnouncements(data);
    };

    useEffect(() => { loadAnnouncements(); }, []);

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.message.trim()) {
            toast.error("يرجى ملء جميع الحقول");
            return;
        }
        setLoading(true);
        const result = await sendBroadcast({
            title: form.title,
            message: form.message,
            type: form.type,
            target_plan: form.target_plan,
            expires_at: form.expires_at || undefined,
        });
        setLoading(false);

        if (result.error) { toast.error(result.error); return; }
        toast.success("تم إرسال التنبيه بنجاح");
        setForm({ title: "", message: "", type: "info", target_plan: "all", expires_at: "" });
        loadAnnouncements();
    };

    const handleDelete = async (id: string) => {
        const result = await deleteAnnouncement(id);
        if (result.error) { toast.error(result.error); return; }
        toast.success("تم حذف التنبيه");
        loadAnnouncements();
    };

    const handleToggle = async (id: string, active: boolean) => {
        const result = await toggleAnnouncementActive(id, !active);
        if (result.error) { toast.error(result.error); return; }
        loadAnnouncements();
    };

    return (
        <div className="space-y-5">
            {/* Form */}
            <div className="space-y-3">
                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">عنوان التنبيه</label>
                    <input
                        value={form.title}
                        onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="مثلاً: تحديث جديد للنظام"
                        className="w-full h-10 px-4 rounded-xl bg-secondary/20 border border-border/40 text-sm focus:outline-none focus:border-primary/50"
                    />
                </div>

                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">محتوى الرسالة</label>
                    <textarea
                        value={form.message}
                        onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="اكتب تفاصيل الرسالة هنا..."
                        rows={3}
                        className="w-full p-4 rounded-xl bg-secondary/20 border border-border/40 text-sm focus:outline-none focus:border-primary/50 resize-none"
                    />
                </div>

                {/* Type */}
                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">نوع التنبيه</label>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { id: "info", icon: Info, color: "text-blue-400" },
                            { id: "warning", icon: AlertTriangle, color: "text-amber-400" },
                            { id: "success", icon: CheckCircle, color: "text-emerald-400" },
                            { id: "error", icon: XCircle, color: "text-red-400" },
                        ].map(type => (
                            <button
                                key={type.id}
                                onClick={() => setForm(prev => ({ ...prev, type: type.id }))}
                                className={`flex flex-col items-center p-2 rounded-xl border transition-all ${form.type === type.id
                                    ? "border-primary/50 bg-primary/10"
                                    : "border-border/40 bg-secondary/10 hover:bg-secondary/20"
                                }`}
                            >
                                <type.icon className={`w-4 h-4 ${type.color}`} />
                                <span className="text-[10px] mt-1 text-muted-foreground">{type.id}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Targeting */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">الاستهداف</label>
                        <select
                            value={form.target_plan}
                            onChange={e => setForm(prev => ({ ...prev, target_plan: e.target.value }))}
                            className="w-full h-10 px-3 rounded-xl bg-secondary/20 border border-border/40 text-sm focus:outline-none"
                        >
                            <option value="all">الكل</option>
                            <option value="free">مجاني فقط</option>
                            <option value="pro">احترافي فقط</option>
                            <option value="business">أعمال فقط</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">ينتهي في (اختياري)</label>
                        <input
                            type="date"
                            value={form.expires_at}
                            onChange={e => setForm(prev => ({ ...prev, expires_at: e.target.value }))}
                            className="w-full h-10 px-3 rounded-xl bg-secondary/20 border border-border/40 text-sm focus:outline-none"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowPreview(true)}
                        disabled={!form.title && !form.message}
                        className="h-10 px-4 rounded-xl border border-border/40 bg-secondary/20 hover:bg-secondary/40 text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-30"
                    >
                        <Eye className="w-4 h-4" />
                        معاينة
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" />إرسال</>}
                    </button>
                </div>
            </div>

            {/* Previous Announcements */}
            <div className="space-y-3 pt-4 border-t border-border/40">
                <h4 className="text-xs font-bold text-muted-foreground px-1">التنبيهات السابقة</h4>
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {announcements.map((ann) => {
                        const Icon = typeIcons[ann.type] || Info;
                        return (
                            <div key={ann.id} className={`p-3 rounded-xl border border-border/40 bg-secondary/10 transition-opacity ${!ann.is_active ? "opacity-40" : ""}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Icon className={`w-3 h-3 shrink-0 ${typeColors[ann.type]?.split(" ")[0] || "text-blue-400"}`} />
                                            <span className="text-xs font-bold truncate">{ann.title}</span>
                                            {ann.target_plan && ann.target_plan !== "all" && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground">
                                                    {ann.target_plan}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground line-clamp-2">{ann.message}</p>
                                        {ann.expires_at && (
                                            <p className="text-[9px] text-muted-foreground mt-1">
                                                ينتهي: {new Date(ann.expires_at).toLocaleDateString("ar-IQ")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => handleToggle(ann.id, ann.is_active)}
                                            className={`p-1.5 rounded-lg hover:bg-secondary transition-colors ${ann.is_active ? "text-emerald-500" : "text-gray-500"}`}
                                        >
                                            {ann.is_active ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                                        </button>
                                        <button onClick={() => handleDelete(ann.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {announcements.length === 0 && (
                        <p className="text-[10px] text-center text-muted-foreground py-4 italic">لا توجد تنبيهات سابقة</p>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && <PreviewModal form={form} onClose={() => setShowPreview(false)} />}
        </div>
    );
}
