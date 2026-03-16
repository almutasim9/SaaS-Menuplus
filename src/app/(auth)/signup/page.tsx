"use client";

import { useState } from "react";
import { signUp } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    UtensilsCrossed,
    Mail,
    Lock,
    User,
    Store,
    ArrowRight,
    ArrowLeft,
    Check,
    Zap,
    Crown,
    Rocket,
    Link2,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { arabicToEnglishNumbers } from "@/lib/utils";

type Plan = "free" | "pro" | "business";

const plans = [
    {
        id: "free" as Plan,
        name: "مجانية",
        nameEn: "Free",
        price: "$0",
        desc: "15 منتج • 50 طلب/شهر",
        icon: Zap,
        color: "from-gray-500/20 to-gray-600/10",
        border: "border-white/10",
        activeBorder: "border-emerald-500",
        activeGlow: "shadow-emerald-500/20",
    },
    {
        id: "pro" as Plan,
        name: "احترافية",
        nameEn: "Pro",
        price: "$25",
        desc: "100 منتج • 500 طلب/شهر",
        icon: Crown,
        color: "from-emerald-500/20 to-emerald-600/10",
        border: "border-emerald-500/20",
        activeBorder: "border-emerald-500",
        activeGlow: "shadow-emerald-500/30",
        popular: true,
    },
    {
        id: "business" as Plan,
        name: "أعمال",
        nameEn: "Business",
        price: "$50",
        desc: "غير محدود • دومين مخصص",
        icon: Rocket,
        color: "from-violet-500/20 to-violet-600/10",
        border: "border-violet-500/20",
        activeBorder: "border-violet-500",
        activeGlow: "shadow-violet-500/20",
    },
];

export default function SignUpPage() {
    const [step, setStep] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Step 1: Account
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");

    // Step 2: Restaurant
    const [restaurantName, setRestaurantName] = useState("");
    const [phone, setPhone] = useState("");

    // Step 3: Plan
    const [selectedPlan, setSelectedPlan] = useState<Plan>("free");

    const slugPreview = restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
        .replace(/(^-|-$)/g, "")
        || "your-restaurant";

    const canProceedStep1 = fullName.trim() && email.trim() && password.length >= 6;
    const canProceedStep2 = restaurantName.trim();

    async function handleSubmit() {
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.set("email", email);
        formData.set("password", password);
        formData.set("fullName", fullName);
        formData.set("restaurantName", restaurantName);
        formData.set("phone", phone);
        formData.set("plan", selectedPlan);

        const result = await signUp(formData);
        if (result?.error) {
            setError(result.error);
            setLoading(false);
            // Go back to step 1 for auth errors
            if (result.error.includes("email") || result.error.includes("password") || result.error.includes("already")) {
                setStep(1);
            }
        }
    }

    const stepLabels = ["الحساب", "المطعم", "الخطة"];

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
            {/* Background decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl" />
            </div>

            <div className="w-full max-w-md relative">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600">
                            <UtensilsCrossed className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">MenuPlus</h1>
                    </Link>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step > s
                                        ? "bg-emerald-500 text-white"
                                        : step === s
                                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                                            : "bg-white/5 text-gray-500 border border-white/10"
                                    }`}
                            >
                                {step > s ? <Check className="w-4 h-4" /> : s}
                            </div>
                            {s < 3 && (
                                <div className={`w-8 h-0.5 rounded ${step > s ? "bg-emerald-500" : "bg-white/10"}`} />
                            )}
                        </div>
                    ))}
                </div>
                <p className="text-center text-sm text-gray-500 mb-6">{stepLabels[step - 1]}</p>

                {/* Card */}
                <div className="rounded-3xl p-8 border border-white/10 bg-white/[0.02] backdrop-blur-sm">
                    {error && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-5">
                            {error}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {/* Step 1: Account */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-5"
                            >
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-semibold text-white">أنشئ حسابك</h2>
                                    <p className="text-gray-400 mt-1 text-sm">ابدأ رحلتك مع MenuPlus</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-300">الاسم الكامل</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <Input
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="أحمد محمد"
                                            className="pl-10 h-12 rounded-xl bg-white/5 border-white/10 focus:border-emerald-500/50 text-white placeholder:text-gray-600"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-300">البريد الإلكتروني</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <Input
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            type="email"
                                            placeholder="you@example.com"
                                            className="pl-10 h-12 rounded-xl bg-white/5 border-white/10 focus:border-emerald-500/50 text-white placeholder:text-gray-600"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-300">كلمة المرور</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <Input
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            type="password"
                                            placeholder="••••••••"
                                            minLength={6}
                                            className="pl-10 h-12 rounded-xl bg-white/5 border-white/10 focus:border-emerald-500/50 text-white placeholder:text-gray-600"
                                        />
                                    </div>
                                    {password.length > 0 && password.length < 6 && (
                                        <p className="text-xs text-red-400">كلمة المرور يجب أن تكون 6 أحرف على الأقل</p>
                                    )}
                                </div>

                                <Button
                                    onClick={() => { setError(null); setStep(2); }}
                                    disabled={!canProceedStep1}
                                    className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium text-base hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    التالي
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                </Button>
                            </motion.div>
                        )}

                        {/* Step 2: Restaurant */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-5"
                            >
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-semibold text-white">معلومات المطعم</h2>
                                    <p className="text-gray-400 mt-1 text-sm">أخبرنا عن مطعمك</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-300">اسم المطعم</Label>
                                    <div className="relative">
                                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <Input
                                            value={restaurantName}
                                            onChange={(e) => setRestaurantName(e.target.value)}
                                            placeholder="مطعم مشمش"
                                            className="pl-10 h-12 rounded-xl bg-white/5 border-white/10 focus:border-emerald-500/50 text-white placeholder:text-gray-600"
                                        />
                                    </div>
                                </div>

                                {/* Slug Preview */}
                                {restaurantName && (
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-sm">
                                        <Link2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span className="text-gray-400">رابط القائمة:</span>
                                        <code className="text-emerald-400 font-mono text-xs truncate">
                                            menuplus.com/menu/{slugPreview}
                                        </code>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-300">رقم الهاتف (اختياري)</Label>
                                    <Input
                                        value={phone}
                                        onChange={(e) => setPhone(arabicToEnglishNumbers(e.target.value))}
                                        type="tel"
                                        placeholder="07XX XXX XXXX"
                                        className="h-12 rounded-xl bg-white/5 border-white/10 focus:border-emerald-500/50 text-white placeholder:text-gray-600"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setStep(1)}
                                        className="h-12 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-white/10"
                                    >
                                        <ArrowRight className="w-4 h-4 ml-1" />
                                        رجوع
                                    </Button>
                                    <Button
                                        onClick={() => { setError(null); setStep(3); }}
                                        disabled={!canProceedStep2}
                                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium text-base hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-40"
                                    >
                                        التالي
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Plan Selection */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-5"
                            >
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-semibold text-white">اختر خطتك</h2>
                                    <p className="text-gray-400 mt-1 text-sm">يمكنك الترقية لاحقاً في أي وقت</p>
                                </div>

                                <div className="space-y-3">
                                    {plans.map((plan) => {
                                        const Icon = plan.icon;
                                        const isSelected = selectedPlan === plan.id;
                                        return (
                                            <button
                                                key={plan.id}
                                                type="button"
                                                onClick={() => setSelectedPlan(plan.id)}
                                                className={`w-full p-4 rounded-2xl border-2 transition-all text-right flex items-center gap-4 ${isSelected
                                                        ? `${plan.activeBorder} bg-gradient-to-r ${plan.color} shadow-lg ${plan.activeGlow}`
                                                        : `${plan.border} bg-white/[0.02] hover:bg-white/[0.04]`
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? "bg-white/10" : "bg-white/5"
                                                    }`}>
                                                    <Icon className={`w-5 h-5 ${isSelected ? "text-emerald-400" : "text-gray-500"}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-white">{plan.name}</span>
                                                        {plan.popular && (
                                                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">مُوصى</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-0.5">{plan.desc}</p>
                                                </div>
                                                <span className="font-bold text-lg text-white shrink-0">{plan.price}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setStep(2)}
                                        className="h-12 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-white/10"
                                    >
                                        <ArrowRight className="w-4 h-4 ml-1" />
                                        رجوع
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium text-base hover:from-emerald-600 hover:to-emerald-700 transition-all"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                إنشاء المطعم
                                                <Check className="w-4 h-4 mr-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        لديك حساب بالفعل؟{" "}
                        <Link href="/login" className="text-emerald-400 hover:underline font-medium">
                            سجّل دخولك
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
