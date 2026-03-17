"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/context";
import { 
    Clock, 
    CheckCircle2, 
    Utensils, 
    Truck, 
    PackageCheck, 
    ArrowLeft, 
    MessageCircle,
    ShoppingBag,
    ChefHat,
    MapPin
} from "lucide-react";
import Link from "next/link";

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'on_the_way' | 'delivered' | 'cancelled' | 'completed' | 'rejected';

interface Order {
    id: string;
    status: OrderStatus;
    total: number;
    order_type: 'dine_in' | 'takeaway' | 'delivery';
    customer_name: string;
    restaurant_id: string;
    created_at: string;
    restaurants: {
        name: string;
        whatsapp_number: string | null;
        primary_color: string | null;
    };
}

const statusConfig: Record<OrderStatus, { icon: any; color: string; labelKey: string }> = {
    pending: { icon: Clock, color: "text-amber-500", labelKey: "orders.pending" },
    confirmed: { icon: CheckCircle2, color: "text-blue-500", labelKey: "orders.confirmed" },
    preparing: { icon: ChefHat, color: "text-orange-500", labelKey: "orders.preparing" },
    ready: { icon: Utensils, color: "text-emerald-500", labelKey: "orders.ready" },
    on_the_way: { icon: Truck, color: "text-indigo-500", labelKey: "orders.on_the_way" },
    delivered: { icon: PackageCheck, color: "text-green-600", labelKey: "orders.delivered" },
    completed: { icon: CheckCircle2, color: "text-green-600", labelKey: "orders.completed" },
    cancelled: { icon: ArrowLeft, color: "text-red-500", labelKey: "orders.cancelled" },
    rejected: { icon: ArrowLeft, color: "text-red-600", labelKey: "orders.rejected" },
};

export default function OrderTrackingPage() {
    const { slug, id } = useParams();
    const { t, dir } = useTranslation();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchOrder = async () => {
            const { data, error } = await supabase
                .from("orders")
                .select("*, restaurants(name, whatsapp_number, primary_color)")
                .eq("id", id)
                .single();

            if (!error && data) {
                setOrder(data as Order);
            }
            setLoading(false);
        };

        fetchOrder();

        // Subscribe to real-time updates
        const channel = supabase
            .channel(`order-status-${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${id}`,
                },
                (payload) => {
                    const nextStatus = payload.new.status as OrderStatus;
                    
                    setOrder((prev) => {
                        if (prev && prev.status !== nextStatus) {
                            // Status changed!
                            
                            // 1. Play sound
                            try {
                                const context = new (window.AudioContext || (window as any).webkitAudioContext)();
                                const oscillator = context.createOscillator();
                                const gainNode = context.createGain();
                                oscillator.type = "sine";
                                oscillator.frequency.setValueAtTime(880, context.currentTime);
                                oscillator.connect(gainNode);
                                gainNode.connect(context.destination);
                                gainNode.gain.setValueAtTime(0, context.currentTime);
                                gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.1);
                                gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
                                oscillator.start(context.currentTime);
                                oscillator.stop(context.currentTime + 0.5);
                            } catch (e) {}

                            // 2. Flash Title if tab not in focus
                            if (document.hidden) {
                                const originalTitle = document.title;
                                let isFlash = false;
                                const interval = setInterval(() => {
                                    document.title = isFlash ? t("orders.status") + " 🍕" : originalTitle;
                                    isFlash = !isFlash;
                                }, 1000);
                                
                                const stopFlash = () => {
                                    clearInterval(interval);
                                    document.title = originalTitle;
                                    window.removeEventListener('focus', stopFlash);
                                };
                                window.addEventListener('focus', stopFlash);
                            }

                            // 3. Cleanup localStorage if finalized
                            const finalized = ['delivered', 'completed', 'cancelled', 'rejected'];
                            if (finalized.includes(nextStatus)) {
                                localStorage.removeItem(`active_order_${slug}`);
                            }

                            return { ...prev, status: nextStatus };
                        }
                        return prev;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id, supabase, slug, t]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <ShoppingBag className="w-16 h-16 text-muted-foreground/20 mb-4" />
                <h1 className="text-xl font-bold mb-2">{t("common.noData")}</h1>
                <Link href={`/menu/${slug}`} className="text-primary font-medium hover:underline">
                    {t("storefront.backToMenu")}
                </Link>
            </div>
        );
    }

    const currentStatus = order.status;
    const config = statusConfig[currentStatus] || statusConfig.pending;
    const StatusIcon = config.icon;

    const handleWhatsAppContact = () => {
        if (!order.restaurants.whatsapp_number) return;
        const msg = `مرحباً ${order.restaurants.name}، أنا أستفسر عن طلبي رقم ${id?.slice(0, 8)}`;
        const url = `https://wa.me/${order.restaurants.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    const isCancelled = currentStatus === 'cancelled' || currentStatus === 'rejected';

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-black" dir={dir}>
            {/* Header */}
            <header className="sticky top-0 z-50 glass-strong border-b border-border/40 px-5 py-4">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    <Link href={`/menu/${slug}`} className="p-2 -ml-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <ArrowLeft className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                    </Link>
                    <h1 className="text-lg font-bold truncate max-w-[200px]">
                        {order.restaurants.name}
                    </h1>
                    <div className="w-9" /> {/* Spacer */}
                </div>
            </header>

            <main className="max-w-xl mx-auto px-5 py-8 space-y-6">
                {/* Status Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 rounded-3xl shadow-xl shadow-black/5 text-center space-y-4 border border-border/40"
                >
                    <div className="relative mx-auto w-24 h-24">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStatus}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 1.5, opacity: 0 }}
                                className={`w-full h-full rounded-2xl flex items-center justify-center bg-white dark:bg-zinc-900 border-2 border-border/50 shadow-inner ${config.color}`}
                            >
                                <StatusIcon className="w-12 h-12" />
                            </motion.div>
                        </AnimatePresence>
                        {!isCancelled && currentStatus !== 'delivered' && currentStatus !== 'completed' && (
                            <div className="absolute -inset-2 rounded-3xl border-2 border-primary/20 border-t-primary animate-spin" style={{ animationDuration: '3s' }} />
                        )}
                    </div>

                    <div className="space-y-1">
                        <h2 className={`text-2xl font-black ${config.color}`}>
                            {t(config.labelKey)}
                        </h2>
                        <p className="text-muted-foreground text-sm font-medium">
                            {t("orders.orderId")}: <span className="text-foreground uppercase tracking-wider">{id?.slice(0, 8)}</span>
                        </p>
                    </div>

                    {!isCancelled && (
                        <div className="pt-2">
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden flex">
                                {['pending', 'confirmed', 'preparing', 'ready', 'on_the_way', 'delivered'].map((step, idx) => {
                                    const steps = ['pending', 'confirmed', 'preparing', 'ready', 'on_the_way', 'delivered'];
                                    const activeIdx = steps.indexOf(currentStatus);
                                    const isActive = idx <= activeIdx;
                                    return (
                                        <div 
                                            key={step}
                                            className={`h-full flex-1 transition-all duration-500 border-r border-white/10 ${isActive ? 'bg-primary' : 'bg-transparent'}`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Details Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-card p-4 rounded-2xl border border-border/40 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center shrink-0">
                                <Utensils className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">{t("dashboard.orderMethods")}</p>
                                <p className="font-bold text-sm truncate">{t(`storefront.checkout.orderTypes.${order.order_type}`)}</p>
                            </div>
                        </div>
                        <div className="glass-card p-4 rounded-2xl border border-border/40 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">{t("sidebar.locations")}</p>
                                <p className="font-bold text-sm truncate">{order.customer_name}</p>
                            </div>
                        </div>
                    </div>

                    {order.restaurants.whatsapp_number && (
                        <div className="space-y-3">
                            <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest px-4">
                                {t("orders.shareTracking")}
                            </p>
                            <div className="grid grid-cols-1 gap-3">
                                <button 
                                    onClick={() => {
                                        const shareUrl = window.location.href;
                                        const msg = t("orders.shareTracking") + ": \n" + shareUrl;
                                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                    }}
                                    className="w-full h-14 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-emerald-500/20 text-emerald-600 font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                                >
                                    <ShoppingBag className="w-5 h-5" />
                                    {t("orders.sendToMe")}
                                </button>
                                <button 
                                    onClick={handleWhatsAppContact}
                                    className="w-full h-14 rounded-2xl bg-[#25D366] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 active:scale-[0.98] transition-all"
                                >
                                    <MessageCircle className="w-5 h-5 fill-current" />
                                    تواصل مع المطعم عبر الواتساب
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="glass-card p-5 rounded-3xl border border-border/40">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">{t("storefront.checkout.sectionTitles.summary")}</h3>
                            <span className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                         </div>
                         <div className="space-y-3 border-t border-border/40 pt-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t("storefront.checkout.summary.total")}</span>
                                <span className="font-black text-lg">{order.total.toLocaleString()} {t("storefront.currency")}</span>
                            </div>
                         </div>
                    </div>
                </motion.div>
                
                {/* Back to Home */}
                <div className="text-center pt-4">
                    <Link 
                        href={`/menu/${slug}`}
                        className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors flex items-center justify-center gap-1"
                    >
                        <ArrowLeft className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                        {t("storefront.backToMenu")}
                    </Link>
                </div>
            </main>
        </div>
    );
}
