"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
    UtensilsCrossed, QrCode, BarChart3, Palette, ShoppingCart, Truck,
    ArrowRight, Sparkles, Rocket, Globe, Check, Zap, Crown,
    Tag, TrendingUp, Users, Star, Puzzle, ChevronDown,
    MessageCircle, Bell, Clock, Layers,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const fadeInUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } };

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
    { icon: QrCode,       color: "text-emerald",    bg: "bg-emerald/10",      title: "قائمة QR ذكية",         desc: "قائمة رقمية تفاعلية مع تحديثات لحظية وتصميم يعكس هوية مطعمك." },
    { icon: ShoppingCart, color: "text-blue-400",   bg: "bg-blue-500/10",     title: "إدارة طلبات متكاملة",   desc: "استقبل الطلبات من الطاولة أو التوصيل أو الاستلام في لوحة واحدة." },
    { icon: BarChart3,    color: "text-violet-400", bg: "bg-violet-500/10",   title: "تحليلات دقيقة",         desc: "تتبع مبيعاتك، أفضل منتجاتك، ومصادر الزوار بتقارير واضحة." },
    { icon: Palette,      color: "text-pink-400",   bg: "bg-pink-500/10",     title: "تخصيص الهوية البصرية",  desc: "خصص الألوان والشعار والبانر لتعكس علامتك التجارية بالكامل." },
    { icon: MessageCircle,color: "text-amber-400",  bg: "bg-amber-500/10",    title: "طلبات واتساب",          desc: "استقبل طلبات العملاء مباشرة عبر واتساب بضغطة واحدة." },
    { icon: Bell,         color: "text-emerald",    bg: "bg-emerald/10",      title: "إشعارات فورية",         desc: "إشعارات Push للطلبات الجديدة — لا تفوّت أي طلب حتى وأنت بعيد." },
    { icon: Globe,        color: "text-sky-400",    bg: "bg-sky-500/10",      title: "3 لغات (RTL/LTR)",      desc: "العربية، الكردية، والإنجليزية — المنصة تتكيف مع اتجاه النص تلقائياً." },
    { icon: Clock,        color: "text-orange-400", bg: "bg-orange-500/10",   title: "جدولة المنتجات",        desc: "حدد أوقات توفر كل منتج — وجبات الفطور، الغداء، والعروض الخاصة." },
    { icon: Layers,       color: "text-violet-400", bg: "bg-violet-500/10",   title: "متغيرات وإضافات",       desc: "أضف خيارات الحجم والنكهات والإضافات لكل منتج بمرونة كاملة." },
];

const STATS = [
    { value: "+200", label: "مطعم يثق بنا" },
    { value: "+50K", label: "طلب شهرياً" },
    { value: "3",    label: "لغات مدعومة" },
    { value: "99.9%", label: "وقت التشغيل" },
];

const ADDONS = [
    {
        icon: Tag,     color: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/20",
        key: "discounts",       name: "خصومات وكوبونات",   price: 10,
        desc: "أنشئ كوبونات خصم مرنة — نسبة مئوية، مبلغ ثابت، توصيل مجاني، أو منتجات محددة.",
        features: ["كوبونات بنسبة أو مبلغ ثابت", "توصيل مجاني عند شراء معين", "حد أقصى للاستخدام", "تاريخ انتهاء", "مولّد كودات تلقائي"],
    },
    {
        icon: Truck,   color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20",
        key: "advanced_delivery", name: "توصيل متقدم",    price: 8,
        desc: "تحكم كامل بمناطق التوصيل — ساعات عمل لكل منطقة، حد أدنى للطلب، وحد مجاني للتوصيل.",
        features: ["مناطق توصيل غير محدودة", "توصيل مجاني عند حد معين", "ساعات توصيل لكل منطقة", "قبول طلبات خارج النطاق", "وقت توصيل تقديري"],
    },
    {
        icon: BarChart3, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20",
        key: "analytics_pro",  name: "تحليلات برو",       price: 7,
        desc: "بيانات عميقة تساعدك على قرارات أذكى — معدلات التحويل، تصنيف المنتجات، ومصادر الزيارات.",
        features: ["معدلات تحويل المشاهدات للمبيعات", "تفاصيل مصادر الزيارات", "تصنيف أفضل المنتجات", "رسوم بيانية 7 و30 يوم", "تحليل أكثر المبيعات"],
    },
    {
        icon: Palette, color: "text-pink-400",    bg: "bg-pink-500/10",    border: "border-pink-500/20",
        key: "custom_branding", name: "براند مخصص",       price: 5,
        desc: "هويتك البصرية الكاملة — ألوان، خطوط، شعار، وإزالة شعار Menu Plus.",
        features: ["ألوان وخطوط مخصصة", "رفع شعار وبانر", "وضع داكن/فاتح/تلقائي", "تخطيط شبكي أو قائمة", "إزالة شعار المنصة"],
    },
    {
        icon: Globe,   color: "text-emerald",     bg: "bg-emerald/10",     border: "border-emerald/20",
        key: "custom_domain",  name: "دومين مخصص",        price: 5,
        desc: "استخدم دومينك الخاص مثل menu.restaurant.com مع SSL مجاني.",
        features: ["ربط دومين خاص بك", "شهادة SSL مجانية", "فوائد SEO إضافية"],
    },
];

const PLAN_FEATURES = {
    free: ["15 منتج", "50 طلب/شهر", "منطقتا توصيل", "قائمة QR + كود", "3 أنواع طلبات", "3 لغات", "إشعارات فورية", "تحليلات أساسية", "ساعات العمل", "PWA"],
    business: ["60 منتج", "300 طلب/شهر", "5 مناطق توصيل", "كل مزايا المجاني", "متغيرات وإضافات للمنتجات", "جدولة المنتجات", "تخصيص الثيم", "طلبات واتساب", "روابط سوشيال ميديا"],
    pro: ["منتجات وطلبات غير محدودة", "مناطق توصيل غير محدودة", "كل مزايا أعمال", "تحليلات متقدمة", "تتبع المصادر والتحويل", "دومين مخصص", "5 أدوار للموظفين", "قبول طلبات خارج النطاق", "تتبع المخزون", "دعم أولوية"],
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function LandingClient() {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans" dir="rtl">

            {/* ── Ambient glows ── */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-15%] left-[-5%]  w-[45%] h-[45%] bg-emerald/8  rounded-full blur-[140px]" />
                <div className="absolute top-[30%]  right-[-5%] w-[35%] h-[55%] bg-violet-500/8 rounded-full blur-[140px]" />
                <div className="absolute bottom-[10%] left-[20%] w-[30%] h-[30%] bg-blue-500/6  rounded-full blur-[120px]" />
            </div>

            {/* ══════════════════════════════════════════════
                NAV
            ══════════════════════════════════════════════ */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 glass-card">
                <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl gradient-emerald shadow-lg shadow-emerald/20">
                            <UtensilsCrossed className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tight">
                            Menu <span className="text-emerald">Plus</span>
                        </span>
                    </div>

                    {/* Links */}
                    <div className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
                        <a href="#features" className="hover:text-foreground transition-colors">المميزات</a>
                        <a href="#addons"   className="hover:text-foreground transition-colors">الإضافات</a>
                        <a href="#pricing"  className="hover:text-foreground transition-colors">الأسعار</a>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                            دخول
                        </Link>
                        <Link href="/signup" className="px-5 py-2 bg-foreground text-background font-bold rounded-full text-sm transition-transform hover:scale-105 flex items-center gap-2">
                            ابدأ مجاناً <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ══════════════════════════════════════════════
                HERO
            ══════════════════════════════════════════════ */}
            <section className="relative pt-44 pb-28 px-6 z-10">
                <motion.div variants={stagger} initial="hidden" animate="visible" className="max-w-5xl mx-auto text-center">

                    {/* Badge */}
                    <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald/30 bg-emerald/5 text-emerald text-sm font-medium mb-8">
                        <Star className="w-3.5 h-3.5 fill-emerald" />
                        منصة إدارة المطاعم الأولى بالعراق
                    </motion.div>

                    <motion.h1 variants={fadeInUp} className="text-5xl md:text-[72px] font-black leading-[1.08] tracking-tight mb-7">
                        ارتقِ بمطعمك مع{" "}
                        <span className="text-gradient">تجربة رقمية</span>{" "}
                        لا تُضاهى
                    </motion.h1>

                    <motion.p variants={fadeInUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                        قائمة طعام رقمية ذكية، نظام طلبات متكامل، وتحليلات دقيقة —
                        كل ما يحتاجه مطعمك في منصة واحدة أنيقة وسهلة الاستخدام.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
                        <Link href="/signup" className="flex items-center gap-2.5 bg-emerald text-emerald-foreground font-bold px-8 py-3.5 rounded-2xl text-base transition-transform hover:-translate-y-0.5 shadow-lg shadow-emerald/25">
                            <Sparkles className="w-4 h-4" /> ابدأ رحلتك الآن — مجاناً
                        </Link>
                        <a href="#pricing" className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-semibold px-6 py-3.5 rounded-2xl border border-border hover:bg-secondary/50 transition-colors text-sm">
                            عرض الأسعار <ChevronDown className="w-4 h-4" />
                        </a>
                    </motion.div>

                    {/* Stats bar */}
                    <motion.div variants={fadeInUp} className="inline-flex flex-wrap justify-center gap-x-10 gap-y-4">
                        {STATS.map(s => (
                            <div key={s.label} className="text-center">
                                <p className="text-2xl font-black text-foreground">{s.value}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {/* ══════════════════════════════════════════════
                FEATURES
            ══════════════════════════════════════════════ */}
            <section id="features" className="py-28 px-6 bg-secondary/20 relative z-10 border-y border-border/40">
                <div className="max-w-7xl mx-auto">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
                        <motion.p variants={fadeInUp} className="text-xs font-bold uppercase tracking-widest text-emerald mb-3">المميزات</motion.p>
                        <motion.h2 variants={fadeInUp} className="text-4xl font-black mb-4">
                            كل ما يحتاجه مطعمك،{" "}
                            <span className="text-emerald">في مكان واحد</span>
                        </motion.h2>
                        <motion.p variants={fadeInUp} className="text-muted-foreground max-w-xl mx-auto">
                            بُنيت المنصة خصيصاً لمطاعم المنطقة — بلغاتها وطريقة عملها
                        </motion.p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {FEATURES.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.07 }}
                                className="group p-6 rounded-2xl border border-border/60 bg-card hover:border-border transition-all hover:shadow-lg hover:shadow-black/10 text-right"
                            >
                                <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-5`}>
                                    <f.icon className={`w-5 h-5 ${f.color}`} />
                                </div>
                                <h3 className="font-bold text-base mb-2">{f.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                ADD-ONS
            ══════════════════════════════════════════════ */}
            <section id="addons" className="py-28 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
                        <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/5 text-violet-400 text-xs font-bold uppercase tracking-widest mb-4">
                            <Puzzle className="w-3.5 h-3.5" /> إضافات اختيارية
                        </motion.div>
                        <motion.h2 variants={fadeInUp} className="text-4xl font-black mb-4">
                            خصّص منصتك{" "}
                            <span className="text-gradient">بالإضافات التي تحتاجها</span>
                        </motion.h2>
                        <motion.p variants={fadeInUp} className="text-muted-foreground max-w-xl mx-auto">
                            متاحة لخطط أعمال وبرو — فعّل ما تحتاجه وادفع فقط على ما تستخدمه
                        </motion.p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {ADDONS.map((a, i) => (
                            <motion.div
                                key={a.key}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className={`rounded-2xl border ${a.border} bg-card p-6 text-right flex flex-col gap-5 hover:shadow-lg hover:shadow-black/10 transition-all`}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className={`w-11 h-11 rounded-xl ${a.bg} flex items-center justify-center shrink-0`}>
                                        <a.icon className={`w-5 h-5 ${a.color}`} />
                                    </div>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${a.bg} ${a.color} mr-auto`}>
                                        ${a.price}/شهر
                                    </span>
                                </div>

                                {/* Name + desc */}
                                <div>
                                    <h3 className="font-bold text-base mb-1.5">{a.name}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
                                </div>

                                {/* Features */}
                                <ul className="space-y-2 flex-1">
                                    {a.features.map(f => (
                                        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Check className={`w-3.5 h-3.5 ${a.color} shrink-0`} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}

                        {/* Total value card */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: ADDONS.length * 0.08 }}
                            className="rounded-2xl border border-dashed border-border bg-secondary/20 p-6 text-right flex flex-col items-center justify-center gap-4 text-center"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-bold text-sm mb-1">جميع الإضافات الخمسة</p>
                                <p className="text-3xl font-black mb-1">$35<span className="text-base font-medium text-muted-foreground">/شهر</span></p>
                                <p className="text-xs text-muted-foreground">بدلاً من $35 إذا اشتريتها منفردة</p>
                            </div>
                            <Link href="/signup" className="inline-flex items-center gap-2 text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                                اشترك الآن <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                PRICING
            ══════════════════════════════════════════════ */}
            <section id="pricing" className="py-28 px-6 bg-secondary/20 relative z-10 border-y border-border/40">
                <div className="max-w-6xl mx-auto">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
                        <motion.p variants={fadeInUp} className="text-xs font-bold uppercase tracking-widest text-emerald mb-3">الأسعار</motion.p>
                        <motion.h2 variants={fadeInUp} className="text-4xl font-black mb-4">
                            خطط واضحة،{" "}
                            <span className="text-emerald">بدون مفاجآت</span>
                        </motion.h2>
                        <motion.p variants={fadeInUp} className="text-muted-foreground max-w-xl mx-auto">
                            ابدأ مجاناً وطوّر اشتراكك متى تريد — لا بطاقة ائتمانية مطلوبة للبدء
                        </motion.p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

                        {/* ── Free ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}
                            className="rounded-3xl border border-border bg-card p-8 text-right flex flex-col gap-6"
                        >
                            <div>
                                <div className="flex items-center gap-2.5 mb-5">
                                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <span className="font-bold text-base">مجاني</span>
                                </div>
                                <div className="flex items-end gap-1 mb-1.5">
                                    <span className="text-5xl font-black">$0</span>
                                    <span className="text-muted-foreground pb-1">/شهر</span>
                                </div>
                                <p className="text-sm text-muted-foreground">للمطاعم التي تبدأ رحلتها الرقمية</p>
                            </div>
                            <ul className="space-y-2.5 flex-1">
                                {PLAN_FEATURES.free.map(f => (
                                    <li key={f} className="flex items-center gap-2.5 text-sm">
                                        <Check className="w-4 h-4 text-emerald shrink-0" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/signup" className="block w-full text-center py-3 rounded-2xl border border-border font-semibold text-sm hover:bg-secondary/60 transition-colors">
                                ابدأ مجاناً
                            </Link>
                        </motion.div>

                        {/* ── Business (highlighted) ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                            className="rounded-3xl border-2 border-emerald bg-card p-8 text-right flex flex-col gap-6 relative shadow-2xl shadow-emerald/10 md:-translate-y-2"
                        >
                            <div className="absolute -top-3.5 right-6">
                                <span className="bg-emerald text-emerald-foreground text-[11px] font-bold px-3.5 py-1 rounded-full shadow-lg shadow-emerald/30">
                                    ⭐ الأكثر شيوعاً
                                </span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2.5 mb-5">
                                    <div className="w-9 h-9 rounded-xl bg-emerald/15 flex items-center justify-center">
                                        <Crown className="w-4 h-4 text-emerald" />
                                    </div>
                                    <span className="font-bold text-base">أعمال</span>
                                </div>
                                <div className="flex items-end gap-1 mb-1.5">
                                    <span className="text-5xl font-black">$22</span>
                                    <span className="text-muted-foreground pb-1">/شهر</span>
                                </div>
                                <p className="text-sm text-muted-foreground">للمطاعم النشطة التي تريد النمو</p>
                            </div>
                            <ul className="space-y-2.5 flex-1">
                                {PLAN_FEATURES.business.map(f => (
                                    <li key={f} className="flex items-center gap-2.5 text-sm">
                                        <Check className="w-4 h-4 text-emerald shrink-0" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/signup" className="block w-full text-center py-3 rounded-2xl bg-emerald text-emerald-foreground font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-emerald/25">
                                ابدأ الآن
                            </Link>
                        </motion.div>

                        {/* ── Pro ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                            className="rounded-3xl border border-violet-500/25 bg-card p-8 text-right flex flex-col gap-6"
                        >
                            <div>
                                <div className="flex items-center gap-2.5 mb-5">
                                    <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
                                        <Rocket className="w-4 h-4 text-violet-400" />
                                    </div>
                                    <span className="font-bold text-base">برو</span>
                                </div>
                                <div className="flex items-end gap-1 mb-1.5">
                                    <span className="text-5xl font-black">$39</span>
                                    <span className="text-muted-foreground pb-1">/شهر</span>
                                </div>
                                <p className="text-sm text-muted-foreground">للمطاعم الكبيرة — بلا حدود</p>
                            </div>
                            <ul className="space-y-2.5 flex-1">
                                {PLAN_FEATURES.pro.map(f => (
                                    <li key={f} className="flex items-center gap-2.5 text-sm">
                                        <Check className="w-4 h-4 text-violet-400 shrink-0" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/signup" className="block w-full text-center py-3 rounded-2xl border border-violet-500/40 text-violet-400 font-semibold text-sm hover:bg-violet-500/10 transition-colors">
                                ابدأ الآن
                            </Link>
                        </motion.div>
                    </div>

                    {/* Add-ons footnote */}
                    <motion.p
                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
                        className="text-center text-sm text-muted-foreground mt-8"
                    >
                        الإضافات الاختيارية متاحة لخطط أعمال وبرو — من{" "}
                        <a href="#addons" className="text-violet-400 hover:underline font-medium">$5/شهر لكل إضافة</a>
                    </motion.p>
                </div>
            </section>

            {/* ══════════════════════════════════════════════
                SOCIAL PROOF / TRUST
            ══════════════════════════════════════════════ */}
            <section className="py-20 px-6 relative z-10">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto text-center">
                    <motion.p variants={fadeInUp} className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-10">
                        يثق بنا أصحاب المطاعم في المنطقة
                    </motion.p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {STATS.map(s => (
                            <motion.div key={s.label} variants={fadeInUp} className="text-center">
                                <p className="text-4xl font-black text-foreground mb-1">{s.value}</p>
                                <p className="text-sm text-muted-foreground">{s.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ══════════════════════════════════════════════
                FOOTER CTA
            ══════════════════════════════════════════════ */}
            <section className="py-24 px-6 relative z-10 border-t border-border/50">
                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-2xl mx-auto text-center">
                    <motion.div variants={fadeInUp} className="w-16 h-16 rounded-3xl gradient-emerald shadow-2xl shadow-emerald/30 flex items-center justify-center mx-auto mb-8">
                        <UtensilsCrossed className="w-8 h-8 text-white" />
                    </motion.div>
                    <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-black mb-4">
                        جاهز تبدأ؟
                    </motion.h2>
                    <motion.p variants={fadeInUp} className="text-muted-foreground text-lg mb-10">
                        سجّل مطعمك الآن مجاناً — لا بطاقة ائتمانية مطلوبة.
                    </motion.p>
                    <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/signup" className="inline-flex items-center gap-2.5 bg-emerald text-emerald-foreground font-bold px-9 py-4 rounded-2xl text-base transition-transform hover:-translate-y-0.5 shadow-xl shadow-emerald/25">
                            <Sparkles className="w-5 h-5" /> ابدأ مجاناً الآن
                        </Link>
                        <Link href="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors">
                            لديك حساب؟ سجّل دخولك <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                        </Link>
                    </motion.div>
                </motion.div>
            </section>

            {/* Footer bar */}
            <footer className="border-t border-border/40 py-6 px-6 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg gradient-emerald">
                            <UtensilsCrossed className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-sm font-bold">Menu <span className="text-emerald">Plus</span></span>
                    </div>
                    <div className="flex items-center gap-5 text-xs text-muted-foreground">
                        <a href="#features" className="hover:text-foreground transition-colors">المميزات</a>
                        <a href="#addons"   className="hover:text-foreground transition-colors">الإضافات</a>
                        <a href="#pricing"  className="hover:text-foreground transition-colors">الأسعار</a>
                        <Link href="/login" className="hover:text-foreground transition-colors">دخول</Link>
                    </div>
                    <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Menu Plus. جميع الحقوق محفوظة.</p>
                </div>
            </footer>

        </div>
    );
}
