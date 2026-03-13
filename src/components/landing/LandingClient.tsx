"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { UtensilsCrossed, QrCode, BarChart3, Palette, ShoppingCart, Truck, Tags, ArrowRight, Play, Sparkles, Rocket, Globe } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } } };
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

export default function LandingClient() {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans" dir="rtl">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald/10 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] bg-violet-500/10 rounded-full blur-[120px]" />
            </div>

            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 glass-card">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl gradient-emerald shadow-lg shadow-emerald/20">
                            <UtensilsCrossed className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tight text-foreground">
                            Menu <span className="text-emerald">Plus</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                            دخول
                        </Link>
                        <Link href="/signup" className="px-6 py-2.5 bg-foreground text-background font-bold rounded-full transition-transform hover:scale-105 flex items-center gap-2">
                            ابدأ مجاناً <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                        </Link>
                    </div>
                </div>
            </nav>

            <section className="relative pt-40 pb-32 px-6 z-10">
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-5xl mx-auto text-center relative">
                    <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight mb-8">
                        ارتقِ بمطعمك مع <span className="text-gradient">تجربة رقمية </span> لا تُضاهى
                    </motion.h1>
                    <motion.p variants={fadeInUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
                        قائمة طعام رقمية ذكية، نظام طلبات متكامل، وتحليلات دقيقة — كل ما يحتاجه مطعمك في منصة واحدة أنيقة وسهلة الاستخدام.
                    </motion.p>
                    <motion.div variants={fadeInUp} className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <Link href="/signup" className="flex items-center gap-3 bg-emerald text-emerald-foreground font-bold px-8 py-4 rounded-2xl text-lg transition-transform hover:-translate-y-1">
                            <Sparkles className="w-5 h-5" /> ابدأ رحلتك الآن
                        </Link>
                        <a href="#how-it-works" className="flex items-center gap-3 text-muted-foreground hover:text-foreground font-semibold px-8 py-4 rounded-2xl border border-border hover:bg-secondary/50">
                            <Play className="w-5 h-5" /> شاهد كيف يعمل
                        </a>
                    </motion.div>
                </motion.div>
            </section>

            <section id="features" className="py-32 px-6 bg-secondary/30 relative z-10 border-y border-border/50">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-4xl font-black mb-16">
                        مزايا ترفع <span className="text-emerald">مستوى مطعمك</span>
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: QrCode, title: "قائمة QR ذكية", desc: "قائمة رقمية تفاعلية جذابة بتحديثات لحظية." },
                            { icon: ShoppingCart, title: "إدارة الطلبات بثقة", desc: "نظام طلبات شامل للطاولات والتوصيل." },
                            { icon: BarChart3, title: "تحليلات دقيقة", desc: "تتبع مبيعاتك وأفضل الأطباق بسهولة." },
                            { icon: Palette, title: "تخصيص الهوية", desc: "خصص الألوان والشعارات لتعكس علامتك." },
                            { icon: Tags, title: "حملات تسويقية", desc: "كوبونات خصم لزيادة المبيعات." },
                            { icon: Globe, title: "لغات متعددة", desc: "العربية، الكردية، والإنجليزية (RTL/LTR)." },
                        ].map((f, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="p-8 rounded-3xl border border-border bg-card hover:bg-secondary/50 transition-colors text-right">
                                <f.icon className="w-10 h-10 text-emerald mb-6" />
                                <h3 className="font-bold text-xl mb-3">{f.title}</h3>
                                <p className="text-muted-foreground">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
