import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  UtensilsCrossed,
  QrCode,
  BarChart3,
  Palette,
  ShoppingCart,
  Truck,
  Tags,
  Zap,
  ArrowRight,
  CheckCircle2,
  Star,
  Globe,
  Shield,
  Smartphone,
  Play,
  Users,
  TrendingUp,
  Clock,
  CreditCard,
  Sparkles,
  ChevronRight,
  Crown,
  Rocket,
  MessageCircle,
  Heart,
  Timer,
} from "lucide-react";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Only redirect regular users — let super_admin preview the landing page
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-emerald-500/30">

      {/* === Animated Background Grid === */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
          backgroundSize: '48px 48px',
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-gradient-to-b from-emerald-500/8 via-emerald-500/3 to-transparent rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-violet-500/5 to-transparent rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-[80px]" />
      </div>

      {/* === Navigation === */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04]" style={{ backdropFilter: 'blur(24px) saturate(180%)', background: 'rgba(5,5,5,0.75)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/25">
                <UtensilsCrossed className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 opacity-20 blur-md" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Menu<span className="text-emerald-400">Plus</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">المزايا</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">كيف يعمل</a>
            <a href="#pricing" className="hover:text-white transition-colors">الأسعار</a>
            <a href="#testimonials" className="hover:text-white transition-colors">آراء العملاء</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2 hidden sm:block">
              تسجيل الدخول
            </Link>
            <Link
              href="/signup"
              className="group text-sm font-semibold bg-white text-black px-5 py-2.5 rounded-full transition-all hover:shadow-lg hover:shadow-white/10 hover:-translate-y-0.5 flex items-center gap-2"
            >
              ابدأ مجاناً
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* === Hero Section === */}
      <section className="relative pt-36 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center relative">
          {/* Announcement Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 mb-10 animate-[fadeInUp_0.5s_ease-out]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-300">منصة إدارة المطاعم الرقمية الأولى في العراق</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black leading-[1.05] tracking-tight mb-8 animate-[fadeInUp_0.6s_ease-out_0.1s_both]">
            <span className="block text-white/90">حوّل مطعمك إلى</span>
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                تجربة رقمية
              </span>
              {/* Animated underline */}
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path d="M2 10C50 2 100 2 150 6C200 10 250 4 298 8" stroke="url(#underline-gradient)" strokeWidth="3" strokeLinecap="round" className="animate-[draw_1.5s_ease-out_0.8s_both]" style={{ strokeDasharray: 300, strokeDashoffset: 300, animation: 'draw 1.5s ease-out 0.8s forwards' }} />
                <defs>
                  <linearGradient id="underline-gradient" x1="0" y1="0" x2="300" y2="0">
                    <stop stopColor="#34d399" />
                    <stop offset="1" stopColor="#2dd4bf" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span className="block text-white/90 mt-2">متكاملة</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
            قائمة طعام رقمية بكود QR، نظام طلبات متكامل، تحليلات ذكية — كل ما يحتاجه مطعمك في منصة واحدة. <span className="text-white/80 font-medium">ابدأ في أقل من 3 دقائق.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-[fadeInUp_0.6s_ease-out_0.3s_both]">
            <Link
              href="/signup"
              className="group flex items-center gap-3 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-black font-bold px-8 py-4 rounded-2xl text-base transition-all shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:-translate-y-1"
            >
              <Sparkles className="w-5 h-5" />
              أنشئ قائمتك الآن — مجاناً
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
            <a
              href="#how-it-works"
              className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-6 py-4 rounded-2xl border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.03]"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/15 transition-colors">
                <Play className="w-3 h-3 text-white ml-0.5" />
              </div>
              شاهد كيف يعمل
            </a>
          </div>

          {/* Stats Ticker */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 animate-[fadeInUp_0.6s_ease-out_0.4s_both]">
            {[
              { value: "100+", label: "مطعم نشط", icon: UtensilsCrossed },
              { value: "10K+", label: "طلب شهرياً", icon: ShoppingCart },
              { value: "4.9", label: "تقييم العملاء", icon: Star },
              { value: "<3 دقائق", label: "وقت الإعداد", icon: Timer },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className="p-2 rounded-lg bg-white/[0.04] group-hover:bg-white/[0.08] transition-colors">
                  <stat.icon className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-right rtl:text-right ltr:text-left">
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                  <p className="text-[11px] text-gray-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Mockup */}
        <div className="max-w-5xl mx-auto mt-20 relative animate-[fadeInUp_0.8s_ease-out_0.5s_both]">
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent p-1">
            <div className="rounded-xl bg-[#0c0c0c] overflow-hidden">
              {/* Browser chrome mockup */}
              <div className="h-10 bg-[#161616] flex items-center px-4 gap-2 border-b border-white/[0.04]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-6 rounded-md bg-white/[0.04] flex items-center justify-center text-[10px] text-gray-500 font-mono">
                    menuplus.app/menu/my-restaurant
                  </div>
                </div>
              </div>
              {/* Dashboard preview */}
              <div className="p-6 md:p-8 space-y-4 min-h-[280px] md:min-h-[380px]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 w-36 bg-white/10 rounded mb-2" />
                    <div className="h-3 w-52 bg-white/[0.04] rounded" />
                  </div>
                  <div className="h-9 w-28 bg-emerald-500/20 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                  {[
                    { label: "المنتجات", value: "48", color: "from-emerald-500/20 to-emerald-500/5" },
                    { label: "الطلبات", value: "156", color: "from-blue-500/20 to-blue-500/5" },
                    { label: "الإيرادات", value: "2.4M", color: "from-violet-500/20 to-violet-500/5" },
                    { label: "الزوار", value: "890+", color: "from-amber-500/20 to-amber-500/5" },
                  ].map((card, i) => (
                    <div key={i} className={`p-4 rounded-xl bg-gradient-to-br ${card.color} border border-white/[0.04]`}>
                      <p className="text-[10px] text-gray-500 mb-1">{card.label}</p>
                      <p className="text-xl font-bold">{card.value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="aspect-square rounded-xl bg-white/[0.03] border border-white/[0.04] flex items-center justify-center">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.05]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Glow behind mockup */}
          <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 via-transparent to-violet-500/10 rounded-3xl blur-3xl -z-10" />
        </div>
      </section>

      {/* === Trusted By / Logo Cloud === */}
      <section className="py-12 px-6 border-y border-white/[0.03]">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-medium text-gray-600 uppercase tracking-wider mb-8">موثوق من المطاعم الرائدة</p>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 opacity-40">
            {["مطعم الشرق", "بيتزا هاوس", "كافيه لاتيه", "مشويات الخليج", "سوشي تايم", "برجر كينج"].map((name, i) => (
              <span key={i} className="text-sm md:text-base font-bold text-gray-400 tracking-wide hover:text-white/50 transition-colors cursor-default">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* === Features Section === */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] text-xs text-gray-400 mb-6">
              <Zap className="w-3 h-3 text-emerald-400" />
              مزايا متقدمة
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-5">
              كل ما يحتاجه مطعمك<br />
              <span className="text-emerald-400">في منصة واحدة</span>
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto">أدوات قوية صُممت لتبسيط عمليات مطعمك وزيادة مبيعاتك بشكل ملحوظ.</p>
          </div>

          {/* Feature Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: QrCode, title: "قائمة QR رقمية", desc: "قائمة طعام احترافية يصل إليها زبائنك بمسح كود QR واحد. تحديث لحظي بدون طباعة.", gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400", span: "" },
              { icon: ShoppingCart, title: "نظام طلبات متكامل", desc: "استقبل طلبات الداين-ان، التيك أواي، والتوصيل. إشعارات فورية ومتابعة حالة كل طلب.", gradient: "from-blue-500/15 via-blue-500/5 to-transparent", iconBg: "bg-blue-500/10", iconColor: "text-blue-400", span: "" },
              { icon: BarChart3, title: "تحليلات وتقارير", desc: "لوحة تحكم متقدمة: مبيعات، أفضل المنتجات، تحويلات، أوقات الذروة — كل ذلك بلمحة.", gradient: "from-violet-500/15 via-violet-500/5 to-transparent", iconBg: "bg-violet-500/10", iconColor: "text-violet-400", span: "" },
              { icon: Palette, title: "تخصيص بلا حدود", desc: "ألوان، شعار، بانر، ثيم كامل — اجعل قائمتك تعكس هوية مطعمك الفريدة.", gradient: "from-orange-500/15 via-orange-500/5 to-transparent", iconBg: "bg-orange-500/10", iconColor: "text-orange-400", span: "" },
              { icon: Tags, title: "كوبونات وعروض", desc: "أنشئ أكواد خصم وعروض ترويجية لجذب زبائن جدد وزيادة الطلبات المتكررة.", gradient: "from-pink-500/15 via-pink-500/5 to-transparent", iconBg: "bg-pink-500/10", iconColor: "text-pink-400", span: "" },
              { icon: Truck, title: "إدارة التوصيل", desc: "مناطق وأسعار توصيل مخصصة، ساعات عمل مرنة، وتوصيل مجاني اختياري.", gradient: "from-cyan-500/15 via-cyan-500/5 to-transparent", iconBg: "bg-cyan-500/10", iconColor: "text-cyan-400", span: "" },
            ].map((feature, i) => (
              <div
                key={i}
                className={`group relative p-6 rounded-2xl border border-white/[0.04] bg-gradient-to-br ${feature.gradient} hover:border-white/[0.08] transition-all duration-500 hover:-translate-y-1 ${feature.span}`}
              >
                <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-5 ${feature.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-white/90">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === How It Works === */}
      <section id="how-it-works" className="py-28 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] text-xs text-gray-400 mb-6">
              <Clock className="w-3 h-3 text-emerald-400" />
              3 خطوات فقط
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-5">
              ابدأ في <span className="text-emerald-400">أقل من 3 دقائق</span>
            </h2>
            <p className="text-gray-400">لا حاجة لأي خبرة تقنية. سجّل، أضف منتجاتك، وشارك رابطك.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "أنشئ حسابك", desc: "سجّل بإيميلك وأضف اسم مطعمك. يتم إنشاء رابط فريد لقائمتك تلقائياً.", icon: Users, color: "emerald" },
              { step: "02", title: "أضف قائمتك", desc: "أضف التصنيفات والمنتجات مع الصور والأسعار. التحديث لحظي بدون إعادة طباعة.", icon: UtensilsCrossed, color: "blue" },
              { step: "03", title: "شارك مع العالم", desc: "اطبع كود QR أو شارك الرابط. زبائنك يتصفحون ويطلبون من هواتفهم مباشرة.", icon: QrCode, color: "violet" },
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="p-8 rounded-2xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-${item.color === 'emerald' ? 'emerald' : item.color === 'blue' ? 'blue' : 'violet'}-500/10 flex items-center justify-center mx-auto mb-6`}>
                    <item.icon className={`w-7 h-7 text-${item.color === 'emerald' ? 'emerald' : item.color === 'blue' ? 'blue' : 'violet'}-400`} />
                  </div>
                  <div className="text-xs font-bold text-emerald-400 mb-3">الخطوة {item.step}</div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
                {/* Connecting line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-white/10 to-transparent rtl:-left-3 rtl:right-auto rtl:bg-gradient-to-l" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === Why MenuPlus === */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] text-xs text-gray-400 mb-6">
                <Heart className="w-3 h-3 text-pink-400" />
                لماذا نحن؟
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">
                ليست مجرد قائمة طعام.<br />
                <span className="text-emerald-400">إنها منصة إدارة كاملة.</span>
              </h2>
              <p className="text-gray-400 mb-10 leading-relaxed">
                بينما الحلول الأخرى تقدم قائمة PDF رقمية فقط، MenuPlus يوفر لك نظام متكامل لإدارة مطعمك من الألف إلى الياء.
              </p>

              <div className="space-y-5">
                {[
                  { icon: Smartphone, title: "موبايل أولاً", desc: "واجهة مُحسّنة بالكامل لشاشات الهواتف — حيث يتصفح 92% من زبائنك." },
                  { icon: Globe, title: "عربي، كردي، إنجليزي", desc: "دعم كامل لـ 3 لغات مع اتجاه نص تلقائي (RTL/LTR) بضغطة زر." },
                  { icon: Shield, title: "آمن 100%", desc: "تشفير SSL، سياسات أمان RLS، وعزل كامل بين بيانات المطاعم." },
                  { icon: TrendingUp, title: "نمو مستمر", desc: "تحديثات ومزايا جديدة كل أسبوع بدون أي تكلفة إضافية." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0 group-hover:bg-emerald-500/10 transition-colors">
                      <item.icon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature showcase card */}
            <div className="relative">
              <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-8 space-y-6">
                {/* Mini phone mockup */}
                <div className="mx-auto w-52 rounded-3xl border-2 border-white/[0.08] bg-[#0c0c0c] p-2 shadow-2xl shadow-black/50">
                  <div className="rounded-2xl bg-[#111] overflow-hidden">
                    <div className="h-6 bg-emerald-500/20 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-emerald-400">🍽️ مطعم الشرق</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {['برجر كلاسيك', 'بيتزا مارغريتا', 'سلطة سيزر'].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                          <div>
                            <p className="text-[8px] font-medium">{item}</p>
                            <p className="text-[7px] text-gray-500">{[5000, 8000, 3500][i]} د.ع</p>
                          </div>
                          <div className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center">
                            <span className="text-[7px] text-emerald-400">+</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Floating badges */}
                <div className="flex flex-wrap justify-center gap-3">
                  {[
                    { text: "QR فوري", icon: QrCode },
                    { text: "طلبات مباشرة", icon: ShoppingCart },
                    { text: "تحليلات ذكية", icon: BarChart3 },
                  ].map((badge, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] text-gray-400">
                      <badge.icon className="w-3 h-3 text-emerald-400" />
                      {badge.text}
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -inset-4 bg-emerald-500/5 rounded-3xl blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* === Testimonials === */}
      <section id="testimonials" className="py-28 px-6 border-y border-white/[0.03]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] text-xs text-gray-400 mb-6">
              <MessageCircle className="w-3 h-3 text-emerald-400" />
              آراء العملاء
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-5">
              ماذا يقول <span className="text-emerald-400">عملاؤنا</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: "أحمد محمد", role: "صاحب مطعم الشرق", text: "MenuPlus غيّر طريقة عملنا تماماً. زادت طلباتنا 40% بعد شهر واحد فقط. واجهة سهلة جداً والزبائن يحبونها.", stars: 5 },
              { name: "سارة علي", role: "مديرة كافيه لاتيه", text: "أفضل استثمار لمطعمنا. الآن كل شيء رقمي: القائمة، الطلبات، التحليلات. توفرنا وقت كثير ونقدم خدمة أفضل.", stars: 5 },
              { name: "كريم حسن", role: "صاحب سلسلة برجر", text: "كنا نستخدم قوائم ورقية وكان التحديث كابوس. الآن أحدّث السعر والمنتج بثانية واحدة. شيء رهيب!", stars: 5 },
            ].map((testimonial, i) => (
              <div key={i} className="p-6 rounded-2xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.stars }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-5">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-white/[0.06] flex items-center justify-center text-xs font-bold text-emerald-400">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{testimonial.name}</p>
                    <p className="text-[11px] text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === Pricing Section === */}
      <section id="pricing" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] text-xs text-gray-400 mb-6">
              <CreditCard className="w-3 h-3 text-emerald-400" />
              أسعار شفافة
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-5">
              خطط تناسب <span className="text-emerald-400">كل مطعم</span>
            </h2>
            <p className="text-gray-400">ابدأ مجاناً وترقّى حسب نمو عملك. بدون عقود أو مفاجآت.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                name: "Free",
                nameAr: "مجانية",
                price: "0",
                desc: "مثالية للبدء واختبار المنصة",
                features: ["15 منتج", "50 طلب/شهر", "قائمة QR", "استقبال طلبات", "3 كوبونات"],
                cta: "ابدأ مجاناً",
                icon: Zap,
                popular: false,
                gradient: "from-gray-500/10 to-transparent",
                border: "border-white/[0.04]",
                ctaStyle: "bg-white/[0.06] hover:bg-white/10 text-white border border-white/[0.06]",
              },
              {
                name: "Pro",
                nameAr: "احترافية",
                price: "25",
                desc: "للمطاعم النامية والطموحة",
                features: ["100 منتج", "500 طلب/شهر", "ثيم مخصص بالكامل", "طلبات واتساب", "20 كوبون", "تحليلات متقدمة"],
                cta: "تجربة مجانية 14 يوم",
                icon: Crown,
                popular: true,
                gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
                border: "border-emerald-500/30",
                ctaStyle: "bg-gradient-to-r from-emerald-400 to-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5",
              },
              {
                name: "Business",
                nameAr: "أعمال",
                price: "50",
                desc: "لسلاسل المطاعم والعمليات الكبيرة",
                features: ["منتجات ∞", "طلبات ∞", "كوبونات ∞", "دومين مخصص", "دعم أولوية", "تقارير مخصصة"],
                cta: "تواصل معنا",
                icon: Rocket,
                popular: false,
                gradient: "from-violet-500/10 to-transparent",
                border: "border-white/[0.04]",
                ctaStyle: "bg-white/[0.06] hover:bg-white/10 text-white border border-white/[0.06]",
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative p-7 rounded-2xl border ${plan.border} bg-gradient-to-b ${plan.gradient} flex flex-col transition-all duration-300 hover:-translate-y-1`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-gradient-to-r from-emerald-400 to-emerald-500 text-black px-4 py-1 rounded-full whitespace-nowrap shadow-lg shadow-emerald-500/25">
                    ⭐ الأكثر شيوعاً
                  </div>
                )}
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-10 h-10 rounded-xl ${plan.popular ? 'bg-emerald-500/15' : 'bg-white/[0.04]'} flex items-center justify-center`}>
                    <plan.icon className={`w-5 h-5 ${plan.popular ? 'text-emerald-400' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{plan.name}</p>
                    <h3 className="font-bold">{plan.nameAr}</h3>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black">${plan.price}</span>
                  <span className="text-sm text-gray-500">/شهرياً</span>
                </div>
                <p className="text-xs text-gray-500 mb-6">{plan.desc}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.popular ? 'text-emerald-400' : 'text-gray-600'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block text-center py-3.5 rounded-xl text-sm font-semibold transition-all ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === Final CTA === */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative p-12 md:p-16 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-violet-500/5 border border-emerald-500/10 overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-[60px]" />

            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-black mb-5 leading-tight">
                جاهز لتحويل<br />مطعمك <span className="text-emerald-400">رقمياً</span>؟
              </h2>
              <p className="text-gray-400 mb-10 max-w-md mx-auto">
                انضم لأكثر من 100 مطعم يستخدمون MenuPlus. أنشئ حسابك في 30 ثانية — مجاناً بالكامل.
              </p>
              <Link
                href="/signup"
                className="group inline-flex items-center gap-3 bg-white text-black font-bold px-10 py-5 rounded-2xl text-base transition-all shadow-2xl shadow-white/10 hover:shadow-white/20 hover:-translate-y-1"
              >
                <Sparkles className="w-5 h-5" />
                أنشئ حسابك الآن
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </Link>
              <p className="text-xs text-gray-600 mt-5">بدون بطاقة ائتمان • إعداد في 3 دقائق • إلغاء في أي وقت</p>
            </div>
          </div>
        </div>
      </section>

      {/* === Footer === */}
      <footer className="border-t border-white/[0.04] py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600">
                  <UtensilsCrossed className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold">Menu<span className="text-emerald-400">Plus</span></span>
              </div>
              <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
                المنصة الرقمية الأولى لإدارة المطاعم في العراق. نساعدك على تحويل مطعمك إلى تجربة رقمية متكاملة.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-4 text-gray-300">المنصة</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><a href="#features" className="hover:text-white transition-colors">المزايا</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">الأسعار</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">آراء العملاء</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-4 text-gray-300">الدعم</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li><Link href="/login" className="hover:text-white transition-colors">تسجيل الدخول</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">إنشاء حساب</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} MenuPlus. جميع الحقوق محفوظة.
            </p>
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <span>صُنع بـ ❤️ في العراق</span>
            </div>
          </div>
        </div>
      </footer>

      {/* === CSS Animations === */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
