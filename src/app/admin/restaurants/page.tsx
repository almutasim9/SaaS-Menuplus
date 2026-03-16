"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { getAllRestaurants, updateRestaurantPlan, suspendRestaurant, activateRestaurant, exportRestaurants, getGovernorates, getLocationsByGovernorate } from "@/lib/actions/admin";
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
    Loader2,
    Eye,
    EyeOff,
    MapPin,
    Navigation,
    Download,
    ChevronLeft,
    ChevronRight,
    Filter,
    SlidersHorizontal,
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
    
    const [governorates, setGovernorates] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    
    const [form, setForm] = useState({
        ownerName: "",
        ownerEmail: "",
        ownerPassword: "",
        restaurantName: "",
        slug: "",
        plan: "free",
        governorate: "",
        city: "",
    });

    useEffect(() => {
        if (open) {
            getGovernorates().then(setGovernorates);
        }
    }, [open]);

    const toSlug = (val: string) =>
        val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "restaurant";

    const update = (key: string, value: string) => {
        if (key === "restaurantName") {
            setForm(prev => ({
                ...prev,
                restaurantName: value,
                slug: slugEdited ? prev.slug : toSlug(value),
            }));
        } else if (key === "governorate") {
            setForm(prev => ({ ...prev, governorate: value, city: "" }));
            // Fetch cities for this governorate
            const gov = governorates.find(g => g.name_ar === value);
            if (gov) {
                // Actually the Excel logic had Districts linked to Governorates.
                // But wait, my populateDeliveryZones uses city equality?
                // I'll fetch locations for the selected governorate to show as "Cities"
                getLocationsByGovernorate(gov.id).then(locs => {
                    // Extract unique city names if available, or just use areas as cities
                    // Given the excel, I'll show unique Districts (areas) as cities.
                    setCities(locs);
                });
            } else {
                setCities([]);
            }
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
        if (!form.governorate) { toast.error("اختر محافظة المطعم"); return; }

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
            setForm({ ownerName: "", ownerEmail: "", ownerPassword: "", restaurantName: "", slug: "", plan: "free", governorate: "", city: "" });
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
                            <p className="text-xs text-gray-400 font-medium">معلومات المطعم والموقع</p>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-gray-300 mb-1.5 block">المحافظة</label>
                                        <div className="relative">
                                            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <select
                                                value={form.governorate}
                                                onChange={e => update("governorate", e.target.value)}
                                                className="w-full h-11 pr-10 pl-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                                            >
                                                <option value="" disabled className="bg-[#141414]">اختر المحافظة</option>
                                                {governorates.map(g => (
                                                    <option key={g.id} value={g.name_ar} className="bg-[#141414]">{g.name_ar}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-gray-300 mb-1.5 block">المدينة (اختياري)</label>
                                        <div className="relative">
                                            <Navigation className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <select
                                                value={form.city}
                                                onChange={e => update("city", e.target.value)}
                                                disabled={!form.governorate}
                                                className="w-full h-11 pr-10 pl-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none disabled:opacity-50"
                                            >
                                                <option value="" className="bg-[#141414]">{form.governorate ? "كل المدن" : "اختر المحافظة أولاً"}</option>
                                                {/* In a real app we might want unique city names, but here we'll just show what's available */}
                                                {Array.from(new Set(cities.map(c => c.city_name_ar))).map(cityName => (
                                                    <option key={cityName} value={cityName} className="bg-[#141414]">{cityName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

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

const statusLabels: Record<string, string> = {
    active: "نشط",
    trial: "تجريبي",
    expired: "منتهي",
    cancelled: "ملغي",
};

const planLabels: Record<string, string> = {
    free: "مجاني",
    pro: "احترافي",
    business: "أعمال",
};

// ==========================================
// Main Page
// ==========================================
export default function AdminRestaurantsPage() {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    // Filters
    const [search, setSearch] = useState("");
    const [filterPlan, setFilterPlan] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterJoined, setFilterJoined] = useState("");
    const [sortBy, setSortBy] = useState("created_at");
    const [page, setPage] = useState(1);

    const [showAddModal, setShowAddModal] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const loadRestaurants = useCallback(async (overrides?: {
        search?: string; plan?: string; status?: string;
        joined?: string; sort?: string; pg?: number;
    }) => {
        setLoading(true);
        const result = await getAllRestaurants({
            search: overrides?.search ?? search,
            plan: overrides?.plan ?? filterPlan,
            status: overrides?.status ?? filterStatus,
            joinedWithin: overrides?.joined ?? filterJoined,
            sortBy: overrides?.sort ?? sortBy,
            page: overrides?.pg ?? page,
            pageSize: 20,
        });
        setRestaurants(result.data as Restaurant[]);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        setLoading(false);
    }, [search, filterPlan, filterStatus, filterJoined, sortBy, page]);

    useEffect(() => { loadRestaurants(); }, []);

    const applyFilter = (key: string, value: string) => {
        const next = { plan: filterPlan, status: filterStatus, joined: filterJoined, sort: sortBy, pg: 1 };
        if (key === "plan") { setFilterPlan(value); next.plan = value; }
        if (key === "status") { setFilterStatus(value); next.status = value; }
        if (key === "joined") { setFilterJoined(value); next.joined = value; }
        if (key === "sort") { setSortBy(value); next.sort = value; }
        setPage(1);
        loadRestaurants({ ...next, search });
    };

    const onSearchChange = (val: string) => {
        setSearch(val);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setPage(1);
            loadRestaurants({ search: val, pg: 1 });
        }, 350);
    };

    const goToPage = (pg: number) => {
        setPage(pg);
        loadRestaurants({ pg });
    };

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
        toast.success(`تم تغيير الخطة إلى ${planLabels[plan] || plan}`);
        setRestaurants(prev => prev.map(r => r.id === id ? { ...r, subscription_plan: plan } : r));
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const rows = await exportRestaurants();
            const XLSX = (await import("xlsx")).default;
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "المطاعم");
            XLSX.writeFile(wb, `restaurants-${new Date().toISOString().slice(0, 10)}.xlsx`);
            toast.success("تم تصدير البيانات بنجاح");
        } catch {
            toast.error("فشل التصدير");
        }
        setExporting(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Store className="w-7 h-7" />
                        إدارة المطاعم
                    </h1>
                    <p className="text-muted-foreground mt-1">{total} مطعم مسجل على المنصة.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="h-10 px-4 rounded-xl bg-secondary/50 hover:bg-secondary/80 border border-border/40 text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        تصدير Excel
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        إضافة مطعم
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card rounded-2xl p-4 border border-border/40">
                <div className="flex items-center gap-2 mb-3">
                    <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">الفلاتر والترتيب</span>
                </div>
                <div className="flex flex-wrap gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={e => onSearchChange(e.target.value)}
                            placeholder="ابحث بالاسم أو الرابط..."
                            className="w-full h-10 pr-10 pl-4 rounded-xl bg-secondary/30 border border-border/40 text-sm focus:outline-none focus:border-primary/50"
                        />
                    </div>
                    {/* Plan */}
                    <select
                        value={filterPlan}
                        onChange={e => applyFilter("plan", e.target.value)}
                        className="h-10 px-3 rounded-xl bg-secondary/30 border border-border/40 text-sm focus:outline-none"
                    >
                        <option value="all">كل الخطط</option>
                        <option value="free">مجاني</option>
                        <option value="pro">احترافي</option>
                        <option value="business">أعمال</option>
                    </select>
                    {/* Status */}
                    <select
                        value={filterStatus}
                        onChange={e => applyFilter("status", e.target.value)}
                        className="h-10 px-3 rounded-xl bg-secondary/30 border border-border/40 text-sm focus:outline-none"
                    >
                        <option value="all">كل الحالات</option>
                        <option value="active">نشط</option>
                        <option value="trial">تجريبي</option>
                        <option value="expired">منتهي</option>
                        <option value="cancelled">ملغي</option>
                    </select>
                    {/* Joined Within */}
                    <select
                        value={filterJoined}
                        onChange={e => applyFilter("joined", e.target.value)}
                        className="h-10 px-3 rounded-xl bg-secondary/30 border border-border/40 text-sm focus:outline-none"
                    >
                        <option value="">كل الأوقات</option>
                        <option value="7">آخر 7 أيام</option>
                        <option value="30">آخر 30 يوم</option>
                        <option value="90">آخر 90 يوم</option>
                    </select>
                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={e => applyFilter("sort", e.target.value)}
                        className="h-10 px-3 rounded-xl bg-secondary/30 border border-border/40 text-sm focus:outline-none"
                    >
                        <option value="created_at">الأحدث أولاً</option>
                        <option value="name">الاسم (أ-ي)</option>
                    </select>
                    {/* Clear Filters */}
                    {(filterPlan !== "all" || filterStatus !== "all" || filterJoined || search) && (
                        <button
                            onClick={() => {
                                setSearch(""); setFilterPlan("all"); setFilterStatus("all");
                                setFilterJoined(""); setSortBy("created_at"); setPage(1);
                                loadRestaurants({ search: "", plan: "all", status: "all", joined: "", sort: "created_at", pg: 1 });
                            }}
                            className="h-10 px-3 rounded-xl border border-border/40 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                            مسح
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="glass-card rounded-2xl border border-border/40 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/30 bg-secondary/10">
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">المطعم</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">الخطة</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">الحالة</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">الصاحب</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">تاريخ الانضمام</th>
                                <th className="text-right px-5 py-3.5 text-muted-foreground font-medium">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="border-b border-border/10">
                                        <td className="px-5 py-4" colSpan={6}>
                                            <div className="h-5 bg-secondary/30 rounded-lg animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : restaurants.map(r => {
                                const plan = (r.subscription_plan || "free") as string;
                                const status = (r.subscription_status || "active") as string;
                                const PlanIcon = planIcons[plan] || Zap;
                                return (
                                    <tr key={r.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                                        <td className="px-5 py-4">
                                            <div>
                                                <p className="font-semibold">{r.name}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
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
                                                {planLabels[plan] || plan}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[status] || statusColors.active}`}>
                                                {status === "active" ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                                                {statusLabels[status] || status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            {r.profiles ? (
                                                <div>
                                                    <p className="text-sm">{r.profiles.full_name || "—"}</p>
                                                    <p className="text-xs text-muted-foreground">{r.profiles.email}</p>
                                                </div>
                                            ) : <span className="text-muted-foreground text-xs">—</span>}
                                        </td>
                                        <td className="px-5 py-4 text-muted-foreground text-sm">
                                            {new Date(r.created_at).toLocaleDateString("ar-IQ")}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/admin/restaurants/${r.id}`}
                                                    className="h-8 px-3 rounded-lg bg-secondary/30 border border-border/40 text-xs hover:bg-secondary/60 transition-colors flex items-center"
                                                >
                                                    تفاصيل
                                                </Link>
                                                <select
                                                    value={plan}
                                                    onChange={e => handleChangePlan(r.id, e.target.value)}
                                                    className="h-8 px-2 rounded-lg bg-secondary/30 border border-border/40 text-xs"
                                                >
                                                    <option value="free">مجاني</option>
                                                    <option value="pro">احترافي</option>
                                                    <option value="business">أعمال</option>
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
                {!loading && restaurants.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                        <Store className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">لا توجد نتائج مطابقة.</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-border/20">
                        <span className="text-xs text-muted-foreground">
                            صفحة {page} من {totalPages} ({total} مطعم)
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => goToPage(page - 1)}
                                disabled={page <= 1}
                                className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                const pg = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
                                if (pg > totalPages) return null;
                                return (
                                    <button
                                        key={pg}
                                        onClick={() => goToPage(pg)}
                                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${pg === page
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-secondary/50 text-muted-foreground"
                                        }`}
                                    >
                                        {pg}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => goToPage(page + 1)}
                                disabled={page >= totalPages}
                                className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Restaurant Modal */}
            <AddRestaurantModal
                open={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreated={() => { setPage(1); loadRestaurants({ pg: 1 }); }}
            />
        </div>
    );
}
