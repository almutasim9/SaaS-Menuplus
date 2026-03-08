"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { getRestaurantAppearance, updateAppearance } from "@/lib/actions/appearance";
import { Palette, Upload, Check, UtensilsCrossed, ImageIcon, Facebook, Instagram, Twitter, Music2, Type, LayoutTemplate, Plus } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";
import type { Json } from "@/lib/types/database.types";

const presetColors = [
    "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#f59e0b",
    "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

export default function AppearancePage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [restaurantName, setRestaurantName] = useState("");

    // Images
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [bannerUrl, setBannerUrl] = useState<string | null>(null);
    const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
    const [defaultProductImageUrl, setDefaultProductImageUrl] = useState<string | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
    const [defaultProductImagePreview, setDefaultProductImagePreview] = useState<string | null>(null);

    // Theme Settings
    const [primaryColor, setPrimaryColor] = useState("#10b981");
    const [secondaryColor, setSecondaryColor] = useState("#ffffff");
    const [themeMode, setThemeMode] = useState("system");
    const [layoutProducts, setLayoutProducts] = useState("grid");
    const [layoutCategories, setLayoutCategories] = useState("pills");
    const [fontFamily, setFontFamily] = useState("cairo");
    const [showSearch, setShowSearch] = useState(true);
    const [welcomeMessage, setWelcomeMessage] = useState("");
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [isWhatsappEnabled, setIsWhatsappEnabled] = useState(false);

    // Socials
    const [socialLinks, setSocialLinks] = useState({
        facebook: "",
        instagram: "",
        twitter: "",
        tiktok: ""
    });

    // Store the original theme settings string to pass back unchanged properties
    const [existingThemeSettingsStr, setExistingThemeSettingsStr] = useState("{}");

    useEffect(() => {
        async function load() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("restaurant_id")
                .eq("id", user.id)
                .single() as { data: { restaurant_id: string | null } | null };

            if (profile?.restaurant_id) {
                setRestaurantId(profile.restaurant_id);
                try {
                    const appearance = await getRestaurantAppearance(profile.restaurant_id);
                    if (appearance) {
                        setPrimaryColor(appearance.primary_color);
                        setLogoUrl(appearance.logo_url);
                        setBannerUrl(appearance.banner_url);
                        setRestaurantName(appearance.name);
                        if (appearance.whatsapp_number) setWhatsappNumber(appearance.whatsapp_number);
                        if (typeof appearance.is_whatsapp_ordering_enabled === "boolean") setIsWhatsappEnabled(appearance.is_whatsapp_ordering_enabled);

                        if (appearance.social_links) {
                            const links = appearance.social_links as Record<string, string>;
                            setSocialLinks({
                                facebook: links.facebook || "",
                                instagram: links.instagram || "",
                                twitter: links.twitter || "",
                                tiktok: links.tiktok || "",
                            });
                        }

                        if (appearance.theme_settings) {
                            setExistingThemeSettingsStr(JSON.stringify(appearance.theme_settings));
                            const settings = appearance.theme_settings as Record<string, any>;
                            if (settings.secondary_color) setSecondaryColor(settings.secondary_color);
                            if (settings.theme_mode) setThemeMode(settings.theme_mode);
                            if (settings.layout_products) setLayoutProducts(settings.layout_products);
                            if (settings.layout_categories) setLayoutCategories(settings.layout_categories);
                            if (settings.font_family) setFontFamily(settings.font_family);
                            if (typeof settings.show_search === "boolean") setShowSearch(settings.show_search);
                            if (settings.welcome_message) setWelcomeMessage(settings.welcome_message);
                            if (settings.favicon_url) setFaviconUrl(settings.favicon_url);
                            if (settings.default_product_image) setDefaultProductImageUrl(settings.default_product_image);
                        }
                    }
                } catch (err) {
                    console.error("Failed to load appearance", err);
                }
            }
            setLoading(false);
        }
        load();
    }, []);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!restaurantId) return;

        setSaving(true);
        const formData = new FormData(e.currentTarget);

        // Ensure state-controlled variables are included if not present in regular inputs
        formData.set("primary_color", primaryColor);
        formData.set("secondary_color", secondaryColor);
        formData.set("theme_mode", themeMode);
        formData.set("layout_products", layoutProducts);
        formData.set("layout_categories", layoutCategories);
        formData.set("font_family", fontFamily);
        formData.set("show_search", showSearch ? "true" : "false");
        formData.set("welcome_message", welcomeMessage);
        formData.set("whatsapp_number", whatsappNumber);
        formData.set("is_whatsapp_ordering_enabled", isWhatsappEnabled ? "true" : "false");
        formData.set("existing_theme_settings", existingThemeSettingsStr);

        try {
            const updated = await updateAppearance(restaurantId, formData);
            setLogoUrl(updated.logo_url);
            setBannerUrl(updated.banner_url);
            if (updated.theme_settings) {
                const updatedSettings = updated.theme_settings as Record<string, any>;
                if (updatedSettings.favicon_url) setFaviconUrl(updatedSettings.favicon_url);
                if (updatedSettings.default_product_image) setDefaultProductImageUrl(updatedSettings.default_product_image);
                setExistingThemeSettingsStr(JSON.stringify(updated.theme_settings));
            }

            // Clear previews as they are now the actual URLs
            setLogoPreview(null);
            setBannerPreview(null);
            setFaviconPreview(null);
            setDefaultProductImagePreview(null);

            toast.success("Appearance updated perfectly!");
        } catch (error) {
            console.error("Save Appearance Error:", error);
            toast.error("Failed to save changes.");
        }
        setSaving(false);
    };

    const handleFilePreview = (file: File, setter: (url: string) => void) => {
        const reader = new FileReader();
        reader.onload = (e) => setter(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t("sidebar.appearance") || "Appearance Settings"}</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    {t("appearance.subtitle") || "Customize how your menu looks to your customers"}
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Settings Panel */}
                <form onSubmit={handleSave} className="space-y-6">
                    <Tabs defaultValue="branding" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6 bg-secondary/50 rounded-xl p-1">
                            <TabsTrigger value="branding" className="rounded-lg data-[state=active]:bg-background">Branding</TabsTrigger>
                            <TabsTrigger value="layout" className="rounded-lg data-[state=active]:bg-background">Layout</TabsTrigger>
                            <TabsTrigger value="content" className="rounded-lg data-[state=active]:bg-background">Content</TabsTrigger>
                        </TabsList>

                        {/* Branding Tab */}
                        <TabsContent value="branding" className="space-y-6">
                            {/* Brand Colors */}
                            <div className="glass-card rounded-2xl p-6 space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Palette className="w-5 h-5 text-primary" />
                                    <h2 className="text-lg font-semibold">Brand Colors</h2>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <Label className="mb-2 block text-muted-foreground">Primary Color</Label>
                                        <div className="flex flex-wrap gap-3 mb-3">
                                            {presetColors.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setPrimaryColor(color)}
                                                    className="w-8 h-8 rounded-lg transition-transform hover:scale-110 relative"
                                                    style={{ backgroundColor: color }}
                                                >
                                                    {primaryColor === color && (
                                                        <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                type="color"
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="w-12 h-10 p-1 rounded-lg cursor-pointer bg-background"
                                            />
                                            <span className="font-mono text-sm px-3 py-1 bg-secondary rounded-lg">{primaryColor}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="mb-2 block text-muted-foreground">Secondary / Background Color</Label>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                type="color"
                                                value={secondaryColor}
                                                onChange={(e) => setSecondaryColor(e.target.value)}
                                                className="w-12 h-10 p-1 rounded-lg cursor-pointer bg-background"
                                            />
                                            <span className="font-mono text-sm px-3 py-1 bg-secondary rounded-lg">{secondaryColor}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Images and Assets */}
                            <div className="glass-card rounded-2xl p-6 space-y-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <ImageIcon className="w-5 h-5 text-primary" />
                                    <h2 className="text-lg font-semibold">{t("appearance.imagery") || "Logos & Imagery"}</h2>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <Label>{t("appearance.logo") || "Main Logo"}</Label>
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-xl bg-secondary/50 flex items-center justify-center overflow-hidden border">
                                                {logoPreview || logoUrl ? (
                                                    <img src={logoPreview || logoUrl!} alt="Logo" className="w-full h-full object-cover" />
                                                ) : <ImageIcon className="w-6 h-6 text-muted-foreground/30" />}
                                            </div>
                                            <Input name="logo" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFilePreview(e.target.files[0], setLogoPreview)} className="flex-1 rounded-xl bg-secondary/50 file:mr-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-foreground file:text-sm" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Favicon (Browser Tab Icon)</Label>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-secondary/50 flex items-center justify-center overflow-hidden border">
                                                {faviconPreview || faviconUrl ? (
                                                    <img src={faviconPreview || faviconUrl!} alt="Favicon" className="w-full h-full object-cover" />
                                                ) : <ImageIcon className="w-5 h-5 text-muted-foreground/30" />}
                                            </div>
                                            <Input name="favicon" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFilePreview(e.target.files[0], setFaviconPreview)} className="flex-1 rounded-xl bg-secondary/50 file:mr-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-foreground file:text-sm" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{t("appearance.banner") || "Cover Banner Image"}</Label>
                                        <div className="aspect-[3/1] rounded-xl bg-secondary/50 border-2 border-dashed border-border/50 flex items-center justify-center overflow-hidden">
                                            {bannerPreview || bannerUrl ? (
                                                <img src={bannerPreview || bannerUrl!} alt="Banner" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center text-muted-foreground/50">
                                                    <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                                                    <span className="text-xs">1200x400 recom.</span>
                                                </div>
                                            )}
                                        </div>
                                        <Input name="banner" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFilePreview(e.target.files[0], setBannerPreview)} className="rounded-xl bg-secondary/50 file:mr-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-foreground file:text-sm" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Default Product Image (Fallback)</Label>
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-xl bg-secondary/50 flex items-center justify-center overflow-hidden border">
                                                {defaultProductImagePreview || defaultProductImageUrl ? (
                                                    <img src={defaultProductImagePreview || defaultProductImageUrl!} alt="Default Product" className="w-full h-full object-cover" />
                                                ) : <ImageIcon className="w-6 h-6 text-muted-foreground/30" />}
                                            </div>
                                            <Input name="default_product_image_file" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFilePreview(e.target.files[0], setDefaultProductImagePreview)} className="flex-1 rounded-xl bg-secondary/50 file:mr-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-foreground file:text-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Layout Tab */}
                        <TabsContent value="layout" className="space-y-6">
                            <div className="glass-card rounded-2xl p-6 space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <LayoutTemplate className="w-5 h-5 text-primary" />
                                    <h2 className="text-lg font-semibold">Layout & Style Settings</h2>
                                </div>

                                <div className="space-y-2">
                                    <Label>Theme Mode</Label>
                                    <Select value={themeMode} onValueChange={setThemeMode}>
                                        <SelectTrigger className="bg-secondary/50 rounded-xl">
                                            <SelectValue placeholder="Select theme mode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="system">System Default</SelectItem>
                                            <SelectItem value="light">Light Mode</SelectItem>
                                            <SelectItem value="dark">Dark Mode</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Product Listing Layout</Label>
                                    <Select value={layoutProducts} onValueChange={setLayoutProducts}>
                                        <SelectTrigger className="bg-secondary/50 rounded-xl">
                                            <SelectValue placeholder="Select layout" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="grid">Grid View (Default)</SelectItem>
                                            <SelectItem value="list">List View</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Categories Layout</Label>
                                    <Select value={layoutCategories} onValueChange={setLayoutCategories}>
                                        <SelectTrigger className="bg-secondary/50 rounded-xl">
                                            <SelectValue placeholder="Select categories layout" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pills">Top Scrolling Pills (Default)</SelectItem>
                                            <SelectItem value="sidebar">Sidebar List</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Typography (Font Family)</Label>
                                    <Select value={fontFamily} onValueChange={setFontFamily}>
                                        <SelectTrigger className="bg-secondary/50 rounded-xl">
                                            <SelectValue placeholder="Select font family" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cairo">Cairo (Default Arabic)</SelectItem>
                                            <SelectItem value="tajawal">Tajawal</SelectItem>
                                            <SelectItem value="ibm">IBM Plex Sans Arabic</SelectItem>
                                            <SelectItem value="inter">Inter (English)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Content Tab */}
                        <TabsContent value="content" className="space-y-6">
                            <div className="glass-card rounded-2xl p-6 space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Type className="w-5 h-5 text-primary" />
                                    <h2 className="text-lg font-semibold">Menu Content</h2>
                                </div>

                                <div className="space-y-2 border-b border-border/50 pb-6">
                                    <div className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4 bg-secondary/30">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Show Search Bar</Label>
                                            <p className="text-xs text-muted-foreground">Allow customers to search products by name.</p>
                                        </div>
                                        <Switch checked={showSearch} onCheckedChange={setShowSearch} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Welcome Message / Bio</Label>
                                    <Textarea
                                        value={welcomeMessage}
                                        onChange={(e) => setWelcomeMessage(e.target.value)}
                                        placeholder="e.g., Welcome to our family restaurant! Enjoy our fresh meals."
                                        className="bg-secondary/50 rounded-xl border-border/50 min-h-[100px]"
                                    />
                                </div>

                                {/* WhatsApp Integrations */}
                                <div className="space-y-4 pt-6 border-t border-border/50">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-md font-semibold text-primary">WhatsApp Ordering</h3>
                                    </div>

                                    <div className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4 bg-secondary/30 mb-4">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Enable WhatsApp Checkout</Label>
                                            <p className="text-xs text-muted-foreground">Allow customers to send their cart directly to your WhatsApp.</p>
                                        </div>
                                        <Switch checked={isWhatsappEnabled} onCheckedChange={setIsWhatsappEnabled} />
                                    </div>

                                    {isWhatsappEnabled && (
                                        <div className="space-y-2">
                                            <Label>WhatsApp Business Number</Label>
                                            <Input
                                                value={whatsappNumber}
                                                onChange={(e) => setWhatsappNumber(e.target.value)}
                                                placeholder="With country code (e.g., +964...)"
                                                className="bg-secondary/50 rounded-xl border-border/50"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Social Links */}
                            <div className="glass-card rounded-2xl p-6 space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <Facebook className="w-5 h-5 text-primary" />
                                    <h2 className="text-lg font-semibold">Social Media</h2>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-muted-foreground"><Facebook className="w-4 h-4" /> Facebook</Label>
                                        <Input name="social_facebook" value={socialLinks.facebook} onChange={(e) => setSocialLinks(s => ({ ...s, facebook: e.target.value }))} placeholder="https://..." className="rounded-xl border-border/50 bg-secondary/30" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-muted-foreground"><Instagram className="w-4 h-4" /> Instagram</Label>
                                        <Input name="social_instagram" value={socialLinks.instagram} onChange={(e) => setSocialLinks(s => ({ ...s, instagram: e.target.value }))} placeholder="https://..." className="rounded-xl border-border/50 bg-secondary/30" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-muted-foreground"><Twitter className="w-4 h-4" /> Twitter</Label>
                                        <Input name="social_twitter" value={socialLinks.twitter} onChange={(e) => setSocialLinks(s => ({ ...s, twitter: e.target.value }))} placeholder="https://..." className="rounded-xl border-border/50 bg-secondary/30" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 text-muted-foreground"><Music2 className="w-4 h-4" /> TikTok</Label>
                                        <Input name="social_tiktok" value={socialLinks.tiktok} onChange={(e) => setSocialLinks(s => ({ ...s, tiktok: e.target.value }))} placeholder="https://..." className="rounded-xl border-border/50 bg-secondary/30" />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <div className="pt-4">
                            <Button type="submit" disabled={saving} className="w-full gradient-emerald text-white rounded-xl h-14 text-lg font-medium shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    "Save Appearance Settings"
                                )}
                            </Button>
                        </div>
                    </Tabs>
                </form>

                {/* Live Preview Console */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold opacity-0 lg:opacity-100">Live Preview</h2>
                    <div className="glass-card rounded-[2.5rem] overflow-hidden border-8 border-foreground/5 shadow-2xl mx-auto" style={{ maxWidth: "375px", height: "auto", minHeight: "700px" }}>
                        {/* Fake Browser/Phone Top Bar */}
                        <div className="h-6 w-full flex justify-center pt-2 pb-1" style={{ backgroundColor: themeMode === 'dark' ? '#000' : '#fff' }}>
                            <div className="w-20 h-4 bg-muted-foreground/20 rounded-full" />
                        </div>

                        <div className="w-full h-full pb-10" style={{ backgroundColor: themeMode === 'dark' ? '#0a0a0a' : secondaryColor, color: themeMode === 'dark' ? '#fff' : '#000' }}>

                            {/* Header */}
                            <div className="flex items-center justify-between px-4 pt-6 pb-2">
                                <div className="flex-1 max-w-[140px]">
                                    {showSearch && (
                                        <div className="h-8 rounded-full bg-foreground/5 border border-foreground/5 flex items-center px-3">
                                            <span className="text-[10px] opacity-40">ابحث عن طبقك...</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-sm">{restaurantName || "قائمة الطعام"}</h3>
                                    <UtensilsCrossed className="w-4 h-4" style={{ color: primaryColor }} />
                                </div>
                            </div>

                            {/* Banner */}
                            <div className="px-4 mt-2">
                                <div className="w-full rounded-2xl relative overflow-hidden shadow-sm aspect-[2.5/1] flex flex-col items-center justify-center p-4 text-center" style={{ backgroundColor: primaryColor }}>
                                    {bannerPreview || bannerUrl ? (
                                        <img src={bannerPreview || bannerUrl!} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                                    ) : null}
                                    <div className="relative z-10 w-full">
                                        <h2 className="text-white text-sm font-bold drop-shadow-sm">
                                            {welcomeMessage || (restaurantName ? `مرحباً بك في ${restaurantName}` : "مرحباً بك في مطعمنا")}
                                        </h2>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="mt-6 bg-transparent h-full">
                                {/* Categories array */}
                                {layoutCategories === "pills" && (
                                    <div className="flex gap-2 mb-6 overflow-hidden px-4 justify-end flex-row-reverse">
                                        {["الكل", "الأطباق", "المقبلات"].map((cat, i) => (
                                            <div
                                                key={cat}
                                                className="px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap"
                                                style={{
                                                    backgroundColor: i === 0 ? primaryColor : "rgba(0,0,0,0.05)",
                                                    color: i === 0 ? "white" : undefined,
                                                }}
                                            >
                                                {cat}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="text-right px-4">
                                    {/* Items List/Grid matching mockup */}
                                    <div className={layoutProducts === "grid" ? "grid grid-cols-2 gap-3" : "space-y-3"}>
                                        {[1, 2].map((i) => (
                                            <div key={i} className={`flex ${layoutProducts === "grid" ? "flex-col p-2 h-auto" : "items-center p-2 gap-2 h-20"} rounded-2xl border shadow-sm ${themeMode === 'dark' ? 'bg-[#141414] border-gray-800' : 'bg-white border-gray-100'}`}>
                                                <div className={`${layoutProducts === "grid" ? "w-full aspect-square mb-2" : "w-14 h-14"} rounded-xl ${themeMode === 'dark' ? 'bg-[#2a2a2a]' : 'bg-gray-100/70'} flex items-center justify-center shrink-0 overflow-hidden`}>
                                                    {defaultProductImagePreview || defaultProductImageUrl ? (
                                                        <img src={defaultProductImagePreview || defaultProductImageUrl!} className="w-[85%] h-[85%] object-cover scale-95" alt="" />
                                                    ) : <ImageIcon className="w-5 h-5 opacity-20" />}
                                                </div>
                                                <div className={`flex flex-col justify-between flex-1 w-full relative ${layoutProducts === "grid" ? "pt-2 px-1 pb-1" : ""}`}>
                                                    <div className="flex flex-col gap-1 items-end">
                                                        <div className="h-2.5 bg-foreground/20 rounded-full w-16" />
                                                        <div className="h-1.5 bg-foreground/10 rounded-full w-20" />
                                                    </div>
                                                    <div className={`flex items-end justify-between w-full ${layoutProducts === "grid" ? "mt-3" : "mt-1"}`}>
                                                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                                                            <Plus className="w-3 h-3 text-white" />
                                                        </div>
                                                        <span className="text-[11px] font-bold" style={{ color: primaryColor }}>12 د.ع</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Fake Socials */}
                                <div className="mt-8 pb-4 flex justify-center gap-3 opacity-80">
                                    {socialLinks.facebook && <div className="w-10 h-10 rounded-full bg-gray-100 flex flex-col items-center justify-center"><Facebook className="w-4 h-4" /></div>}
                                    {socialLinks.instagram && <div className="w-10 h-10 rounded-full bg-gray-100 flex flex-col items-center justify-center"><Instagram className="w-4 h-4" /></div>}
                                    {socialLinks.twitter && <div className="w-10 h-10 rounded-full bg-gray-100 flex flex-col items-center justify-center"><Twitter className="w-4 h-4" /></div>}
                                    {socialLinks.tiktok && <div className="w-10 h-10 rounded-full bg-gray-100 flex flex-col items-center justify-center"><Music2 className="w-4 h-4" /></div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
