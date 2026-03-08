"use client";

import { useState, useEffect } from "react";
import { getAllRestaurants, updateRestaurantPlan, suspendRestaurant, activateRestaurant } from "@/lib/actions/admin";
import {
    Store,
    Search,
    Ban,
    CheckCircle,
    Crown,
    Zap,
    Rocket,
    ExternalLink,
    Plus,
    X,
    User,
    Mail,
    Lock,
    UtensilsCrossed,
    CreditCard,
    Loader2,
    Eye,
    EyeOff,
} from "lucide-react";
import { toast } from "sonner";

type Restaurant = {
    id: string;
    name: string;
    slug: string;
    subscription_plan: string | null;
    subscription_status: string | null;
    created_at: string;
    owner_id: string;
    profiles?: { email: string; full_name: string | null } | null;
};

const planIcons: Record<string, typeof Zap> = {
    free: Zap,
    pro: Crown,
    business: Rocket,
};

const planColors: Record<string, string> = {
    free: "text-gray-400 bg-gray-500/10",
    pro: "text-emerald-400 bg-emerald-500/10",
    business: "text-violet-400 bg-violet-500/10",
};

const statusColors: Record<string, string> = {
    active: "text-emerald-500 bg-emerald-500/10",
    trial: "text-blue-500 bg-blue-500/10",
    expired: "text-red-500 bg-red-500/10",
    cancelled: "text-gray-500 bg-gray-500/10",
};

// ==========================================
// Add Restaurant Modal Component
// ==========================================
function AddRestaurantModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [slugEdited, setSlugEdited] = useState(false);
    const [form, setForm] = useState({
        ownerName: "",
        ownerEmail: "",
        ownerPassword: "",
        restaurantName: "",
        slug: "",
        plan: "free",
    });

    const toSlug = (val: string) =>
        val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "restaurant";

    const update = (key: string, value: string) => {
        if (key === "restaurantName") {
            setForm(prev => ({
                ...prev,
                restaurantName: value,
                slug: slugEdited ? prev.slug : toSlug(value),
            }));
        } else {
            setForm(prev => ({ ...prev, [key]: value }));
        }
    };

    const updateSlug = (value: string) => {
        setSlugEdited(true);
        const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
        setForm(prev => ({ ...prev, slug: clean }));
    };

    const handleSubmit = async () => {
        // Validate
        if (!form.ownerName.trim()) { toast.error("أدخل اسم صاحب المطعم"); return; }
        if (!form.ownerEmail.trim()) { toast.error("أدخل البريد الإلكتروني"); return; }
        if (form.ownerPassword.length < 6) { toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
        if (!form.restaurantName.trim()) { toast.error("أدخل اسم المطعم"); return; }
        if (!form.slug.trim()) { toast.error("أدخل رابط المطعم"); return; }

        setLoading(true);

        try {
            const response = await fetch("/api/admin/create-restaurant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                toast.error(result.error || "فشل إنشاء المطعم");
                setLoading(false);
                return;
            }

            toast.success(`تم إنشاء مطعم "${form.restaurantName}" بنجاح!`);
            setForm({ ownerName: "", ownerEmail: "", ownerPassword: "", restaurantName: "", slug: "", plan: "free" });
            setSlugEdited(false);
            setStep(1);
            onCreated();
            onClose();
        } catch {
            toast.error("حدث خطأ في الاتصال");
        }

        setLoading(false);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg rounded-2xl bg-[#141414] border border-white/[0.06] shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Plus className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm">إضافة مطعم جديد</h2>
                            <p className="text-[11px] text-gray-500">الخطوة {step} من 2</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-white/[0.04]">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                        style={{ width: step === 1 ? "50%" : "100%" }}
                    />
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {step === 1 ? (
                        <>
                            {/* Step 1: Owner Info */}
                            <p className="text-xs text-gray-400 font-medium">معلومات صاحب المطعم</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-300 mb-1.5 block">الاسم الكامل</label>
                                    <div className="relative">
                                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            value={form.ownerName}
                                            onChange={e => update("ownerName", e.target.value)}
                                            placeholder="أحمد محمد"
                                            className="w-full h-11 pr-10 pl-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-300 mb-1.5 block">البريد الإلكتروني</label>
                                    <div className="relative">
                                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            value={form.ownerEmail}
                                            onChange={e => update("ownerEmail", e.target.value)}
                                            placeholder="owner@restaurant.com"
                                            type="email"
                                            dir="ltr"
                                            className="w-full h-11 pr-10 pl-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm focus:outline-none focus:border-emerald-500/50 transition-colors text-left"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-300 mb-1.5 block">كلمة المرور</label>
                                    <div className="relative">
                                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            value={form.ownerPassword}
                                            onChange={e => update("ownerPassword", e.target.value)}
                                            placeholder="••••••••"
                                            type={showPassword ? "text" : "password"}
                                            dir="ltr"
                                            className="w-full h-11 pr-10 pl-10 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm focus:outline-none focus:border-emerald-500/50 transition-colors text-left"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-600 mt-1">6 أحرف على الأقل</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Step 2: Restaurant Info & Plan */}
                            <p className="text-xs text-gray-400 font-medium">معلومات المطعم والخطة</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-300 mb-1.5 block">اسم المطعم</label>
                                    <div className="relative">
                                        <UtensilsCrossed className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            value={form.restaurantName}
                                            onChange={e => update("restaurantName", e.target.value)}
                                            placeholder="مطعم الشرق"
                                            className="w-full h-11 pr-10 pl-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Slug Field */}
                                <div>
                                    <label className="text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1.5 block">
                                        رابط المطعم
                                        <span className="text-[10px] text-gray-600 font-normal">(يمكن تعديله)</span>
                                    </label>
                                    <div className="flex items-center gap-0 rounded-xl border border-white/[0.06] bg-white/[0.04] focus-within:border-emerald-500/50 transition-colors overflow-hidden">
                                        <span className="text-[11px] text-gray-500 px-3 whitespace-nowrap border-r border-white/[0.06] h-11 flex items-center font-mono bg-white/[0.02]">
                                            /menu/
                                        </span>
                                        <input
                                            value={form.slug}
                                            onChange={e => updateSlug(e.target.value)}
                                            placeholder="restaurant"
                                            dir="ltr"
                                            spellCheck={false}
                                            autoCapitalize="none"
                                            autoCorrect="off"
                                            style={{ textTransform: "lowercase" }}
                                            className="flex-1 h-11 px-3 bg-transparent text-sm font-mono focus:outline-none text-emerald-300"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-600 mt-1.5 font-mono" dir="ltr">
                                        menuplus.com/menu/<span className="text-emerald-500">{form.slug || "restaurant"}</span>
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-gray-300 mb-2 block">الخطة</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: "free", label: "مجانية", icon: Zap, desc: "15 منتج", color: "gray" },
                                            { id: "pro", label: "احترافية", icon: Crown, desc: "100 منتج", color: "emerald" },
                                            { id: "business", label: "أعمال", icon: Rocket, desc: "غير محدود", color: "violet" },
                                        ].map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => update("plan", p.id)}
                                                className={`p-3 rounded-xl border text-center transition-all ${form.plan === p.id
                                                    ? `border-${p.color === "gray" ? "white/20" : p.color + "-500/50"} bg-${p.color === "gray" ? "white/[0.06]" : p.color + "-500/10"}`
                                                    : "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04]"
                                                    }`}
                                            >
                                                <p.icon className={`w-5 h-5 mx-auto mb-1.5 ${form.plan === p.id
                                                    ? `text-${p.color === "gray" ? "white" : p.color + "-400"}`
                                                    : "text-gray-600"
                                                    }`} />
                                                <p className="text-xs font-bold">{p.label}</p>
                                                <p className="text-[10px] text-gray-500 mt-0.5">{p.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
                    {step === 2 ? (
                        <button
                            onClick={() => setStep(1)}
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            ← الرجوع
                        </button>
                    ) : (
                        <div />
                    )}

                    {step === 1 ? (
                        <button
                            onClick={() => {
                                if (!form.ownerName.trim()) { toast.error("أدخل اسم صاحب المطعم"); return; }
                                if (!form.ownerEmail.trim()) { toast.error("أدخل البريد الإلكتروني"); return; }
                                if (form.ownerPassword.length < 6) { toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
                                setStep(2);
                            }}
                            className="h-10 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm transition-colors"
                        >
                            التالي →
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="h-10 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    جاري الإنشاء...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    إنشاء المطعم
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ==========================================
// Main Page
// ==========================================
export default function AdminRestaurantsPage() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterPlan, setFilterPlan] = useState("all");
    const [showAddModal, setShowAddModal] = useState(false);

    const loadRestaurants = async () => {
        const data = await getAllRestaurants();
        setRestaurants(data as Restaurant[]);
        setLoading(false);
    };

    useEffect(() => { loadRestaurants(); }, []);

    const handleSuspend = async (id: string) => {
        const result = await suspendRestaurant(id);
        if (result.error) { toast.error(result.error); return; }
        toast.success("تم تعليق المطعم");
        setRestaurants(prev => prev.map(r => r.id === id ? { ...r, subscription_status: "expired" } : r));
    };

    const handleActivate = async (id: string) => {
        const result = await activateRestaurant(id);
        if (result.error) { toast.error(result.error); return; }
        toast.success("تم تفعيل المطعم");
        setRestaurants(prev => prev.map(r => r.id === id ? { ...r, subscription_status: "active" } : r));
    };

    const handleChangePlan = async (id: string, plan: string) => {
        const result = await updateRestaurantPlan(id, plan);
        if (result.error) { toast.error(result.error); return; }
        toast.success(`تم تغيير الخطة إلى ${plan}`);
        setRestaurants(prev => prev.map(r => r.id === id ? { ...r, subscription_plan: plan } : r));
    };

    const filtered = restaurants.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.slug.includes(search.toLowerCase());
        const matchesPlan = filterPlan === "all" || (r.subscription_plan || "free") === filterPlan;
        return matchesSearch && matchesPlan;
    });

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-secondary/50 rounded-xl animate-pulse" />
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-secondary/30 rounded-2xl animate-pulse" />)}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Store className="w-7 h-7" />
                        إدارة المطاعم
                    </h1>
                    <p className="text-muted-foreground mt-1">{restaurants.length} مطعم مسجل على المنصة.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    إضافة مطعم
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="ابحث بالاسم أو الرابط..."
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-secondary/30 border border-border/40 text-sm focus:outline-none focus:border-primary/50"
                    />
                </div>
                <select
                    value={filterPlan}
                    onChange={e => setFilterPlan(e.target.value)}
                    className="h-11 px-4 rounded-xl bg-secondary/30 border border-border/40 text-sm focus:outline-none"
                >
                    <option value="all">كل الخطط</option>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="business">Business</option>
                </select>
            </div>

            {/* Table */}
            <div className="glass-card rounded-2xl border border-border/40 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/30">
                                <th className="text-right px-5 py-3 text-muted-foreground font-medium">المطعم</th>
                                <th className="text-right px-5 py-3 text-muted-foreground font-medium">الخطة</th>
                                <th className="text-right px-5 py-3 text-muted-foreground font-medium">الحالة</th>
                                <th className="text-right px-5 py-3 text-muted-foreground font-medium">تاريخ الانضمام</th>
                                <th className="text-right px-5 py-3 text-muted-foreground font-medium">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(r => {
                                const plan = (r.subscription_plan || "free") as string;
                                const status = (r.subscription_status || "active") as string;
                                const PlanIcon = planIcons[plan] || Zap;
                                return (
                                    <tr key={r.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                                        <td className="px-5 py-4">
                                            <div>
                                                <p className="font-semibold">{r.name}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    /{r.slug}
                                                    <a href={`/menu/${r.slug}`} target="_blank" className="hover:text-primary">
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${planColors[plan] || planColors.free}`}>
                                                <PlanIcon className="w-3 h-3" />
                                                {plan}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[status] || statusColors.active}`}>
                                                {status === "active" ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                                                {status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-muted-foreground">
                                            {new Date(r.created_at).toLocaleDateString("ar-IQ")}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={plan}
                                                    onChange={e => handleChangePlan(r.id, e.target.value)}
                                                    className="h-8 px-2 rounded-lg bg-secondary/30 border border-border/40 text-xs"
                                                >
                                                    <option value="free">Free</option>
                                                    <option value="pro">Pro</option>
                                                    <option value="business">Business</option>
                                                </select>
                                                {status === "active" ? (
                                                    <button onClick={() => handleSuspend(r.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors" title="تعليق">
                                                        <Ban className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleActivate(r.id)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400 transition-colors" title="تفعيل">
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                        <Store className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">لا توجد مطاعم مسجلة بعد.</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-4 text-sm text-emerald-400 hover:underline flex items-center gap-1 mx-auto"
                        >
                            <Plus className="w-3 h-3" />
                            أضف أول مطعم
                        </button>
                    </div>
                )}
            </div>

            {/* Add Restaurant Modal */}
            <AddRestaurantModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreated={loadRestaurants}
            />
        </div>
    );
}
