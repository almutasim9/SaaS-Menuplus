"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { getProducts, createProduct, updateProduct, deleteProduct, toggleProductAvailability, toggleProductVisibility, updateProductOrder, updateProductDiscount, duplicateProduct } from "@/lib/actions/products";
import { getCategories, createCategory, updateCategory, deleteCategory, updateCategoryOrder, toggleCategoryVisibility } from "@/lib/actions/categories";
import { Plus, GripVertical, Pencil, Trash2, EyeOff, Eye, PackageX, PackageCheck, ImageIcon, Search, ChevronDown, Check, Tag, UtensilsCrossed, Percent, Copy, Layers, PlusCircle, Settings2, Package, Info, Zap } from "lucide-react";
import { format24to12, format12to24 } from "@/lib/time-utils";
import { toast } from "sonner";
import { isProductCurrentlyAvailable, type AvailabilityRule } from "@/lib/utils/availability";
import { useTranslation } from "@/lib/i18n/context";
import type { Product, Category, ProductVariant, ProductAddon } from "@/lib/types/database.types";
import { useProductAvailability, useFeatureAccess } from "@/lib/hooks/useProductScheduling";
import { arabicToEnglishNumbers } from "@/lib/utils";
import { Clock, Lock, ShieldCheck, Globe, Type, AlignLeft, DollarSign, Image as ImageIcon2 } from "lucide-react";
import NextImage from "next/image";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type ProductWithCategory = Product & {
    categories: { name: string } | null;
    product_variants?: ProductVariant[];
    product_addons?: ProductAddon[];
    product_availability?: AvailabilityRule[];
};

// SORTABLE PRODUCT COMPONENT
function SortableProductRow({
    product,
    onEdit,
    onDelete,
    onToggleAvailability,
    onToggleVisibility,
    onAddDiscount,
    onItemDiscount,
    onDuplicate
}: {
    product: ProductWithCategory;
    onEdit: (p: ProductWithCategory) => void;
    onDelete: (id: string) => void;
    onToggleAvailability: (id: string, current: boolean) => void;
    onToggleVisibility: (id: string, current: boolean) => void;
    onAddDiscount?: (p: ProductWithCategory) => void;
    onItemDiscount?: (p: ProductWithCategory) => void;
    onDuplicate: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `prod-${product.id}`, data: { type: 'Product', product } });
    const { t } = useTranslation();
    
    // Calculate current availability based on schedule
    const schedulingStatus = isProductCurrentlyAvailable(product.product_availability);
    const isScheduledOff = !schedulingStatus.isAvailable;

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        position: 'relative' as const,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`glass-card rounded-2xl p-5 flex items-center gap-6 mb-3 transition-all duration-300 border border-white/5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 group ${isDragging ? 'opacity-50 ring-2 ring-primary bg-primary/5' : 'bg-secondary/10 hover:bg-white/[0.04]'}`}
        >

            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 -ml-2 hover:bg-white/5 rounded-xl transition-colors group-hover:text-primary/60 text-muted-foreground/30">
                <GripVertical className="w-5 h-5" />
            </div>


            <div className={`w-16 h-16 rounded-2xl bg-secondary/30 relative overflow-hidden flex-shrink-0 border border-border/10 transition-transform group-hover:scale-105 duration-300 ${(product.is_hidden || isScheduledOff) ? 'opacity-50 grayscale' : ''}`}>
                {product.image_url ? (
                    <NextImage src={product.image_url} alt={product.name} className="w-full h-full object-cover" width={64} height={64} unoptimized />
                ) : (
                    <div className="flex items-center justify-center h-full bg-secondary/20">
                        <ImageIcon className="w-7 h-7 text-muted-foreground/20" />
                    </div>
                )}
            </div>


            <div className={`flex-1 min-w-0 ${(product.is_hidden || isScheduledOff) ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-base group-hover:text-primary transition-colors">{product.name}</h4>
                    {product.is_hidden && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 border-amber-500/30 text-amber-500">Hidden</Badge>
                    )}
                    {!product.is_available && (
                        <Badge variant="destructive" className="text-[10px] h-4 px-1.5 py-0 bg-red-500/20 text-red-500 border-none">Out of Stock</Badge>
                    )}
                    {isScheduledOff && product.is_available && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 border-blue-500/30 text-blue-500 bg-blue-500/5 uppercase tracking-tighter">مغلق حسب الجدول</Badge>
                    )}
                    {(product.stock_count !== null && product.stock_count > 0 && product.stock_count <= 5) && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 border-amber-500 text-amber-500 bg-amber-500/10 uppercase tracking-tighter font-bold">Low Stock: {product.stock_count}</Badge>
                    )}
                    {(product.stock_count === 0) && (
                        <Badge variant="destructive" className="text-[10px] h-4 px-1.5 py-0 bg-red-500/20 text-red-500 border-none uppercase tracking-tighter font-bold">Zero Stock</Badge>
                    )}
                </div>
                <p className="text-sm text-muted-foreground/70 truncate max-w-md">{product.description || "لا يوجد وصف للمنتج"}</p>
            </div>


            <div className="flex items-center gap-4">
                <span className="font-bold text-lg text-primary/90 mr-4 tabular-nums">{Number(product.price).toLocaleString()} <span className="text-[10px] font-medium opacity-60">د.ع</span></span>


                <div className="flex items-center gap-1.5 p-1.5 bg-black/5 dark:bg-white/5 rounded-2xl border border-white/5">
                    <Button variant="ghost" size="icon" title={product.is_available ? "Mark Out of Stock" : "Mark In Stock"} className={`h-9 w-9 rounded-xl z-10 relative transition-all ${!product.is_available ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10'}`} onClick={(e) => { e.stopPropagation(); onToggleAvailability(product.id, product.is_available); }}>
                        {product.is_available ? <PackageCheck className="w-4 h-4" /> : <PackageX className="w-4 h-4" />}
                    </Button>
                    {onItemDiscount && (
                        <Button variant="ghost" size="icon" title="Item Discount" className={`h-9 w-9 rounded-xl z-10 relative transition-all ${product.is_discount_active ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'hover:bg-amber-500/10 hover:text-amber-500 text-muted-foreground'}`} onClick={(e) => { e.stopPropagation(); onItemDiscount(product); }}>
                            <div className="relative">
                                <Percent className="w-4 h-4" />
                                {product.is_discount_active && <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
                            </div>
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" title={product.is_hidden ? "Show in menu" : "Hide from menu"} className={`h-9 w-9 rounded-xl z-10 relative transition-all ${product.is_hidden ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'}`} onClick={(e) => { e.stopPropagation(); onToggleVisibility(product.id, product.is_hidden); }}>
                        {product.is_hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary z-10 relative transition-all" onClick={(e) => { e.stopPropagation(); onEdit(product); }}>
                        <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Duplicate item" className="h-9 w-9 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-500 z-10 relative transition-all" onClick={(e) => { e.stopPropagation(); onDuplicate(product.id); }}>
                        <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive z-10 relative transition-all" onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>

            </div>
        </div>
    );
}

// SORTABLE CATEGORY COMPONENT
function SortableCategoryBlock({
    cat,
    products,
    onEditCategory,
    onDeleteCategory,
    onToggleCategoryVisibility,
    onEditProduct,
    onDeleteProduct,
    onToggleProductAvailability,
    onToggleProductVisibility,
    onAddDiscount,
    onItemDiscount,
    onDuplicateProduct
}: {
    cat: Category;
    products: ProductWithCategory[];
    onEditCategory: (c: Category) => void;
    onDeleteCategory: (id: string, prodCount: number) => void;
    onToggleCategoryVisibility: (id: string, current: boolean) => void;
    onEditProduct: (p: ProductWithCategory) => void;
    onDeleteProduct: (id: string) => void;
    onToggleProductAvailability: (id: string, current: boolean) => void;
    onToggleProductVisibility: (id: string, current: boolean) => void;
    onAddDiscount?: (p: ProductWithCategory) => void;
    onItemDiscount?: (p: ProductWithCategory) => void;
    onDuplicateProduct: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `cat-${cat.id}`, data: { type: 'Category', cat } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 40 : "auto",
        position: 'relative' as const,
    };

    return (
        <div ref={setNodeRef} style={style} className={`glass-card rounded-2xl overflow-hidden transition-colors ${isDragging ? "ring-2 ring-primary shadow-2xl opacity-80" : "border border-border/50"}`}>
            {/* Category Header */}
            <div className="bg-secondary/40 p-4 border-b border-border/50 flex items-center gap-3">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1.5 -ml-1.5 hover:bg-white/10 rounded-md">
                    <GripVertical className="w-4 h-4 text-muted-foreground/60 transition-colors hover:text-foreground" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold">{cat.name}</h3>
                    <p className="text-xs text-muted-foreground">{products.length} {products.length === 1 ? 'item' : 'items'}</p>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" title={cat.is_hidden ? "Show category" : "Hide category"} className={`h-8 w-8 rounded-lg z-10 relative ${cat.is_hidden ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-500/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'}`} onClick={(e) => { e.stopPropagation(); onToggleCategoryVisibility(cat.id, cat.is_hidden); }}>
                        {cat.is_hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary z-10 relative" onClick={(e) => { e.stopPropagation(); onEditCategory(cat); }}>
                        <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive z-10 relative" onClick={(e) => { e.stopPropagation(); onDeleteCategory(cat.id, products.length); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* Products List (Nested Sortable) */}
            <div className="p-3 space-y-2 min-h-[50px] bg-background/30">
                <SortableContext items={products.map(p => `prod-${p.id}`)} strategy={verticalListSortingStrategy}>
                    {products.length === 0 ? (
                        <div className="text-center py-6 text-sm text-muted-foreground/50 border-2 border-dashed border-border/50 rounded-xl">
                            No items in this category
                        </div>
                    ) : (
                        products.map(product => (
                            <SortableProductRow
                                key={product.id}
                                product={product}
                                onEdit={onEditProduct}
                                onDelete={onDeleteProduct}
                                onToggleAvailability={onToggleProductAvailability}
                                onToggleVisibility={onToggleProductVisibility}
                                onAddDiscount={onAddDiscount}
                                onItemDiscount={onItemDiscount}
                                onDuplicate={onDuplicateProduct}
                            />
                        ))
                    )}
                </SortableContext>
            </div>
        </div>
    );
}

export default function MenuItemsPage() {
    const { t } = useTranslation();
    const [products, setProducts] = useState<ProductWithCategory[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    // Dialog States
    const [productDialogOpen, setProductDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
    const [variants, setVariants] = useState<{ name: string; name_en?: string; name_ku?: string; price: string }[]>([]);
    const [addons, setAddons] = useState<{ name: string; name_en?: string; name_ku?: string; price: string }[]>([]);

    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const [showTranslations, setShowTranslations] = useState(false);

    const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
    const [discountProduct, setDiscountProduct] = useState<ProductWithCategory | null>(null);

    const [itemDiscountDialogOpen, setItemDiscountDialogOpen] = useState(false);
    const [itemDiscountProduct, setItemDiscountProduct] = useState<ProductWithCategory | null>(null);
    const [discountInputMode, setDiscountInputMode] = useState<'price' | 'percent'>('price');
    const [discountNewPrice, setDiscountNewPrice] = useState('');
    const [discountPercent, setDiscountPercent] = useState('');

    const [activeId, setActiveId] = useState<string | null>(null);

    // Live preview state
    const [previewName, setPreviewName] = useState("");
    const [previewPrice, setPreviewPrice] = useState("");
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Availability Data
    const { availability: schedule, updateAvailability, isLoading: isSchedLoading } = useProductAvailability(editingProduct?.id || null);
    const { data: hasAccess } = useFeatureAccess(restaurantId, "product_scheduling");

    const [localSchedule, setLocalSchedule] = useState<any[]>([]);

    useEffect(() => {
        if (schedule && schedule.length > 0) {
            setLocalSchedule(schedule);
        } else if (!isSchedLoading) {
            // Default schedule: all days enabled, all day available
            setLocalSchedule([...Array(7)].map((_, i) => ({
                day_of_week: i,
                open_time: "08:00:00",
                close_time: "23:00:00",
                is_available_all_day: true,
                is_enabled: true
            })));
        }
    }, [schedule, editingProduct, isSchedLoading]);


    const handleToggleDay = (dayIndex: number) => {
        setLocalSchedule(prev => prev.map(s => 
            s.day_of_week === dayIndex ? { ...s, is_enabled: !s.is_enabled } : s
        ));
    };

    const handleUpdateDay = (dayIndex: number, field: string, value: any) => {
        setLocalSchedule(prev => prev.map(s => 
            s.day_of_week === dayIndex ? { ...s, [field]: value } : s
        ));
    };


    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        async function load() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("restaurant_id")
                .eq("id", user.id)
                .single();

            if (profile?.restaurant_id) {
                setRestaurantId(profile.restaurant_id);
                // Load products preserving sort_order, same for categories
                const [cats, prods] = await Promise.all([
                    getCategories(profile.restaurant_id),
                    getProducts(profile.restaurant_id),
                ]);

                // Sort products generally before they get bucketed
                const sortedProds = (prods as ProductWithCategory[]).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                setProducts(sortedProds);
                setCategories(cats);
            }
            setLoading(false);
        }
        load();
    }, []);

    // --- CATEGORY ACTIONS ---
    const handleCategorySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!restaurantId) return;

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const name_en = formData.get("name_en") as string || null;
        const name_ku = formData.get("name_ku") as string || null;
        const sort_order = editingCategory ? editingCategory.sort_order : (categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) + 1 : 1);

        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, name, name_en, name_ku, sort_order);
                toast.success(t("menu.categoryUpdated") || "تم تحديث القسم بنجاح");
            } else {
                await createCategory(restaurantId, name, name_en, name_ku, sort_order);
                toast.success(t("menu.categoryCreated") || "تم إنشاء القسم بنجاح");
            }
            setCategoryDialogOpen(false);
            setEditingCategory(null);
            setCategories(await getCategories(restaurantId));
        } catch (e: any) {
            toast.error(e.message || "Failed to save category");
        }
    };

    const handleDeleteCategory = async (id: string, prodCount: number) => {
        if (prodCount > 0) {
            toast.error("Cannot delete category with items. Move or delete them first.");
            return;
        }
        try {
            await deleteCategory(id);
            setCategories(categories.filter((c) => c.id !== id));
            toast.success(t("menu.categoryDeleted") || "تم حذف القسم بنجاح");
        } catch (e: any) {
            toast.error(e.message || "Failed to delete");
        }
    };

    const handleToggleCategoryVisibility = async (id: string, currentHidden: boolean) => {
        try {
            await toggleCategoryVisibility(id, !currentHidden);
            setCategories(categories.map((c) => (c.id === id ? { ...c, is_hidden: !currentHidden } : c)));
            toast.success(currentHidden ? (t("menu.categoryVisible") || "القسم الآن مرئي") : (t("menu.categoryHidden") || "تم إخفاء القسم من القائمة"));
        } catch {
            toast.error("Failed to update category visibility");
        }
    };

    // --- PRODUCT ACTIONS ---
    const handleProductSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!restaurantId) return;

        const formData = new FormData(e.currentTarget);
        formData.set("restaurant_id", restaurantId);

        // If it's a new product, assign a sort_order at the end of its category
        if (!editingProduct) {
            const catId = formData.get("category_id") as string;
            const prodsInCat = products.filter(p => p.category_id === catId);
            const sort_order = prodsInCat.length > 0 ? Math.max(...prodsInCat.map(p => p.sort_order || 0)) + 1 : 1;
            formData.set("sort_order", sort_order.toString());
        } else {
            // Keep existing sort order
            formData.set("sort_order", (editingProduct.sort_order || 0).toString());
        }

        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, formData);
                // Also update availability if it's a pro user
                if (hasAccess) {
                    await updateAvailability({ productId: editingProduct.id, data: localSchedule });
                }
                toast.success(t("menu.productUpdated") || "تم تحديث المنتج بنجاح");
            } else {
                const newP = await createProduct(formData);
                // Also update availability if it's a pro user
                if (hasAccess && newP) {
                    await updateAvailability({ productId: newP.id, data: localSchedule });
                }
                toast.success(t("menu.productCreated") || "تم إضافة المنتج بنجاح");
            }

            setProductDialogOpen(false);
            setEditingProduct(null);
            setVariants([]);
            setAddons([]);
            const prods = await getProducts(restaurantId);
            setProducts((prods as ProductWithCategory[]).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
        } catch (e: any) {
            toast.error(e.message || "Something went wrong saving the product");
        }
    };

    const handleDeleteProduct = async (id: string) => {
        try {
            await deleteProduct(id);
            setProducts(products.filter((p) => p.id !== id));
            toast.success(t("menu.productDeleted") || "تم حذف المنتج بنجاح");
        } catch {
            toast.error("Failed to delete");
        }
    };

    const handleToggleProduct = async (id: string, current: boolean) => {
        try {
            await toggleProductAvailability(id, !current);
            setProducts(products.map((p) => (p.id === id ? { ...p, is_available: !current } : p)));
            toast.success(current ? (t("menu.markedAvailable") || "تم التحديد كمتح") : (t("menu.markedOutOfStock") || "تم التحديد كنفاذ للمخزون"));
        } catch {
            toast.error("Failed to update availability");
        }
    };

    const handleToggleProductVisibility = async (id: string, currentHidden: boolean) => {
        try {
            await toggleProductVisibility(id, !currentHidden);
            setProducts(products.map((p) => (p.id === id ? { ...p, is_hidden: !currentHidden } : p)));
            toast.success(currentHidden ? (t("menu.productVisible") || "المنتج الآن مرئي في القائمة") : (t("menu.productHidden") || "تم إخفاء المنتج من القائمة"));
        } catch {
            toast.error("Failed to update visibility");
        }
    };

    const handleDuplicateProduct = async (id: string) => {
        try {
            const toastId = toast.loading("Duplicating product...");
            const newProduct = await duplicateProduct(id);
            // Refresh product list to get full relations (variants, etc) if needed, 
            // or simply append the new basic product to state. Best is to refetch all.
            if (restaurantId) {
                const prods = await getProducts(restaurantId);
                setProducts((prods as ProductWithCategory[]).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
            }
            toast.success("Product duplicated successfully", { id: toastId });
        } catch (err: any) {
            toast.error(err.message || "Failed to duplicate product");
        }
    };

    // --- DISCOUNT ACTIONS ---
    const handleAddDiscount = (product: ProductWithCategory) => {
        setDiscountProduct(product);
        setDiscountDialogOpen(true);
    };

    const handleDiscountSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!restaurantId || !discountProduct) return;

        const formData = new FormData(e.currentTarget);
        const code = formData.get("code") as string;
        const discountType = formData.get("discount_type") as string;
        const discountValue = parseFloat(formData.get("discount_value") as string);

        try {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            const { error } = await supabase.from('coupons').insert({
                restaurant_id: restaurantId,
                code: code.toUpperCase(),
                discount_type: discountType,
                discount_value: discountValue,
                applies_to: 'product',
                product_id: discountProduct.id,
                is_active: true,
                is_global: false
            });

            if (error) throw error;
            toast.success("Discount created successfully!");
            setDiscountDialogOpen(false);
            setDiscountProduct(null);
        } catch (err: any) {
            toast.error(err.message || "Failed to create discount");
        }
    };

    const handleItemDiscount = (product: ProductWithCategory) => {
        setItemDiscountProduct(product);
        // Pre-fill if discount already exists
        if (product.is_discount_active && product.compare_at_price) {
            setDiscountInputMode('price');
            setDiscountNewPrice(String(Number(product.price)));
            setDiscountPercent('');
        } else {
            setDiscountNewPrice('');
            setDiscountPercent('');
            setDiscountInputMode('price');
        }
        setItemDiscountDialogOpen(true);
    };

    const handleItemDiscountSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!itemDiscountProduct) return;

        const originalPrice = Number(itemDiscountProduct.price);
        let newPrice: number;

        if (discountInputMode === 'price') {
            newPrice = parseFloat(discountNewPrice);
        } else {
            const pct = parseFloat(discountPercent);
            newPrice = Math.round(originalPrice * (1 - pct / 100));
        }

        if (isNaN(newPrice) || newPrice <= 0) {
            toast.error('يرجى إدخال سعر صحيح');
            return;
        }
        if (newPrice >= originalPrice) {
            toast.error('يجب أن يكون السعر الجديد أقل من السعر الأصلي');
            return;
        }

        // compare_at_price holds the ORIGINAL price, price becomes the discounted one
        try {
            await updateProductDiscount(itemDiscountProduct.id, originalPrice, true);
            // Also update the actual price field to the new discounted price
            const { createClient: cc } = await import('@/lib/supabase/client');
            const supabase = cc();
            await supabase.from('products').update({ price: newPrice }).eq('id', itemDiscountProduct.id);

            setProducts(products.map(p =>
                p.id === itemDiscountProduct.id
                    ? { ...p, price: newPrice, compare_at_price: originalPrice, is_discount_active: true }
                    : p
            ));
            toast.success('تم تفعيل الخصم بنجاح');
            setItemDiscountDialogOpen(false);
            setItemDiscountProduct(null);
        } catch {
            toast.error('فشل في تحديث الخصم');
        }
    };

    const handleRemoveDiscount = async () => {
        if (!itemDiscountProduct) return;

        const originalPrice = itemDiscountProduct.is_discount_active && itemDiscountProduct.compare_at_price
            ? Number(itemDiscountProduct.compare_at_price)
            : Number(itemDiscountProduct.price);

        try {
            await updateProductDiscount(itemDiscountProduct.id, null, false);
            const { createClient: cc } = await import('@/lib/supabase/client');
            const supabase = cc();
            await supabase.from('products').update({ price: originalPrice }).eq('id', itemDiscountProduct.id);

            setProducts(products.map(p =>
                p.id === itemDiscountProduct.id
                    ? { ...p, price: originalPrice, compare_at_price: null, is_discount_active: false }
                    : p
            ));
            toast.success('تم إزالة الخصم وعودة السعر الأصلي');
            setItemDiscountDialogOpen(false);
            setItemDiscountProduct(null);
        } catch {
            toast.error('فشل في إزالة الخصم');
        }
    };

    // --- DRAG AND DROP HANDLERS ---
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        if (!over || !restaurantId) return;

        const activeIdStr = active.id as string;
        const overIdStr = over.id as string;

        if (activeIdStr === overIdStr) return;

        // Determine what we're dragging based on prefix
        const isActiveCat = activeIdStr.startsWith('cat-');
        const isOverCat = overIdStr.startsWith('cat-');

        const isActiveStr = activeIdStr.startsWith('prod-');
        const isOverStr = overIdStr.startsWith('prod-');

        // CATEGORY DRAG
        if (isActiveCat && isOverCat) {
            const activeIdVal = activeIdStr.replace('cat-', '');
            const overIdVal = overIdStr.replace('cat-', '');

            const oldIndex = categories.findIndex(c => c.id === activeIdVal);
            const newIndex = categories.findIndex(c => c.id === overIdVal);

            const newCategories = arrayMove(categories, oldIndex, newIndex);
            const updatedOrderList = newCategories.map((cat, index) => ({ ...cat, sort_order: index + 1 }));

            setCategories(updatedOrderList);
            try {
                await updateCategoryOrder(updatedOrderList.map(c => ({ id: c.id, sort_order: c.sort_order })));
            } catch {
                toast.error("Failed to save category order.");
                setCategories(await getCategories(restaurantId));
            }
            return;
        }

        // PRODUCT DRAG
        if (isActiveStr && isOverStr) {
            const activeIdVal = activeIdStr.replace('prod-', '');
            const overIdVal = overIdStr.replace('prod-', '');

            // Ensure they belong to the same category before allowing a sort.
            // If dragging between categories, dnd-kit normally handles this with over.data, but this setup isolates arrays.
            const activeProduct = products.find(p => p.id === activeIdVal);
            const overProduct = products.find(p => p.id === overIdVal);

            if (activeProduct && overProduct && activeProduct.category_id === overProduct.category_id) {
                const catId = activeProduct.category_id;

                // Get products ONLY in this category, preserving their current displayed order
                const catProducts = products.filter(p => p.category_id === catId);
                const oldIndex = catProducts.findIndex(p => p.id === activeIdVal);
                const newIndex = catProducts.findIndex(p => p.id === overIdVal);

                const relocatedCatProducts = arrayMove(catProducts, oldIndex, newIndex);

                // Reconstruct exact sort order numerically
                const updatedCatProducts = relocatedCatProducts.map((prod, index) => ({
                    ...prod,
                    sort_order: index + 1
                }));

                // Re-merge with the global products list
                const finalProducts = products.map(p => {
                    if (p.category_id === catId) {
                        return updatedCatProducts.find(up => up.id === p.id) || p;
                    }
                    return p;
                });

                setProducts(finalProducts);

                try {
                    await updateProductOrder(updatedCatProducts.map(p => ({ id: p.id, sort_order: p.sort_order })));
                } catch {
                    toast.error("Failed to save product order.");
                    const prods = await getProducts(restaurantId);
                    setProducts((prods as ProductWithCategory[]).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
                }
            } else {
                // Dragging across categories not fully supported yet in this strict view, snap back.
                toast("Products must be sorted within their own categories for now.");
            }
            return;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{t("menu.title")}</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {t("menu.subtitle")}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" className="rounded-xl border border-border/50 shadow-sm" onClick={() => { setEditingCategory(null); setCategoryDialogOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t("menu.addCategory")}
                    </Button>
                    <Button className="gradient-emerald text-white rounded-xl shadow-md" onClick={() => { setEditingProduct(null); setVariants([]); setAddons([]); setShowTranslations(false); setPreviewName(""); setPreviewPrice(""); setPreviewImage(null); setProductDialogOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t("menu.addItem")}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t("menu.searchPlaceholder")}
                        className="pl-10 rounded-xl bg-secondary/30"
                    />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-[180px] rounded-xl bg-secondary/30">
                        <SelectValue placeholder={t("menu.filterItems")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="all">{t("menu.allItems")}</SelectItem>
                        <SelectItem value="out_of_stock">{t("menu.outOfStock")}</SelectItem>
                        <SelectItem value="hidden">{t("menu.hiddenItems")}</SelectItem>
                        <SelectItem value="discounted">{t("menu.discountedItems")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Main Unified Board */}
            <div className="space-y-4 pb-20">
                {categories.length === 0 ? (
                    <div className="glass-card rounded-2xl p-12 text-center">
                        <UtensilsCrossed className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">{t("menu.menuEmpty")}</h3>
                        <p className="text-sm text-muted-foreground mb-6">{t("menu.createCategoryToStart")}</p>
                        <Button onClick={() => setCategoryDialogOpen(true)} className="gradient-emerald text-white rounded-xl">{t("menu.addCategory")}</Button>
                    </div>
                ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <SortableContext items={categories.map(c => `cat-${c.id}`)} strategy={verticalListSortingStrategy}>
                            {categories.map((cat) => {
                                // Filter by status first
                                const catProds = products.filter(p => p.category_id === cat.id);
                                let filteredProds = catProds;
                                if (filterStatus === "out_of_stock") {
                                    filteredProds = filteredProds.filter(p => p.stock_count === 0 || !p.is_available);
                                } else if (filterStatus === "hidden") {
                                    filteredProds = filteredProds.filter(p => p.is_hidden);
                                } else if (filterStatus === "discounted") {
                                    filteredProds = filteredProds.filter(p => p.is_discount_active);
                                }

                                const displayedProds = search.trim() === ""
                                    ? filteredProds
                                    : filteredProds.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

                                // If searching, and this category has no matches, and the category name itself doesn't match, maybe hide it? 
                                // We'll keep it simple: just show it if there are matches, or if we aren't searching.
                                if (search.trim() !== "" && displayedProds.length === 0 && !cat.name.toLowerCase().includes(search.toLowerCase())) {
                                    return null;
                                }

                                return (
                                    <SortableCategoryBlock
                                        key={cat.id}
                                        cat={cat}
                                        products={displayedProds}
                                        onEditCategory={(c) => { setEditingCategory(c); setCategoryDialogOpen(true); }}
                                        onDeleteCategory={handleDeleteCategory}
                                        onToggleCategoryVisibility={handleToggleCategoryVisibility}
                                        onEditProduct={(p) => {
                                            setEditingProduct(p);
                                            setVariants(p.product_variants?.map(v => ({ name: v.name, name_en: v.name_en || '', name_ku: v.name_ku || '', price: v.price.toString() })) || []);
                                            setAddons(p.product_addons?.map(a => ({ name: a.name, name_en: a.name_en || '', name_ku: a.name_ku || '', price: a.price.toString() })) || []);

                                            // Check if any translations exist to auto-show them
                                            const hasTranslations = !!(p.name_en || p.name_ku || p.description_en || p.description_ku);
                                            setShowTranslations(hasTranslations);

                                            // Initialize live preview
                                            setPreviewName(p.name || "");
                                            setPreviewPrice(p.price?.toString() || "");
                                            setPreviewImage(p.image_url || null);

                                            setProductDialogOpen(true);
                                        }}
                                        onDeleteProduct={handleDeleteProduct}
                                        onToggleProductAvailability={handleToggleProduct}
                                        onToggleProductVisibility={handleToggleProductVisibility}
                                        onAddDiscount={handleAddDiscount}
                                        onItemDiscount={handleItemDiscount}
                                        onDuplicateProduct={handleDuplicateProduct}
                                    />
                                );
                            })}
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Modals */}
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogContent className="glass-card border-border/50 rounded-2xl max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? t("menu.editCategory") : t("menu.addCategory")}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCategorySubmit} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>{t("menu.nameAr")} *</Label>
                            <Input name="name" defaultValue={editingCategory?.name} required placeholder="e.g. الحلويات" className="rounded-xl bg-secondary/50" />
                        </div>
                        <div className="space-y-2">
                            <Label>{t("menu.nameEn")} <span className="text-muted-foreground text-xs">({t("common.optional")})</span></Label>
                            <Input name="name_en" defaultValue={editingCategory?.name_en || ""} placeholder="e.g. Desserts" className="rounded-xl bg-secondary/50" />
                        </div>
                        <div className="space-y-2">
                            <Label>{t("menu.nameKu")} <span className="text-muted-foreground text-xs">({t("common.optional")})</span></Label>
                            <Input name="name_ku" defaultValue={editingCategory?.name_ku || ""} placeholder="e.g. شیرینی" className="rounded-xl bg-secondary/50" />
                        </div>
                        <Button type="submit" className="w-full gradient-emerald text-white rounded-xl">
                            {editingCategory ? t("menu.editCategory") : t("menu.addCategory")}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                <DialogContent className="glass-card border-border/50 rounded-2xl sm:max-w-4xl max-h-[90vh] overflow-hidden p-0">
                    <div className="flex h-full max-h-[90vh]">
                        {/* ── Form Side ── */}
                        <div className="flex-1 overflow-y-auto p-6">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? t("menu.editProduct") : t("menu.addProduct")}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleProductSubmit} className="space-y-4 mt-4">
                        <Tabs defaultValue="base" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 bg-secondary/50 rounded-xl mb-4 h-12">
                                <TabsTrigger value="base" className="rounded-lg">{t("menu.baseInfo")}</TabsTrigger>
                                <TabsTrigger value="variants" className="rounded-lg">{t("menu.variantsAddons")}</TabsTrigger>
                                <TabsTrigger value="availability" className="rounded-lg flex items-center gap-1.5 whitespace-nowrap">
                                    {t("menu.availability")}
                                    {!hasAccess && <Lock className="w-3 h-3 text-amber-500" />}
                                </TabsTrigger>
                            </TabsList>



                            {/* TAB 1: BASE INFO */}
                            <TabsContent value="base" className="space-y-6 mt-0 data-[state=inactive]:hidden" forceMount>
                                {/* Section: Basic Info */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                            <UtensilsCrossed className="w-4 h-4" />
                                        </div>
                                        <h4 className="font-bold text-sm uppercase tracking-wider">{t("menu.baseInfo")}</h4>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold flex items-center gap-2">
                                                <Type className="w-3.5 h-3.5 text-muted-foreground" />
                                                {t("menu.nameAr")} *
                                            </Label>
                                            <Input name="name" defaultValue={editingProduct?.name} required className="rounded-xl h-11 bg-secondary/30 border-white/5 focus:ring-primary/20" onChange={e => setPreviewName(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold flex items-center gap-2">
                                                <UtensilsCrossed className="w-3.5 h-3.5 text-muted-foreground" />
                                                {t("common.category")} *
                                            </Label>
                                            <Select name="category_id" defaultValue={editingProduct?.category_id || categories[0]?.id}>
                                                <SelectTrigger className="rounded-xl h-11 bg-secondary/30 border-white/5">
                                                    <SelectValue placeholder={t("menu.selectCategory")} />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-white/5">
                                                    {categories.map((cat) => (
                                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Translation Toggle Button */}
                                    {!showTranslations && (
                                        <div className="flex justify-center pt-2">
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => setShowTranslations(true)}
                                                className="text-xs text-primary hover:bg-primary/5 rounded-xl border border-primary/20 border-dashed py-5 px-6"
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-2" />
                                                {t("menu.showTranslations")}
                                            </Button>
                                        </div>
                                    )}

                                    {/* Sub-tabs for Translations */}
                                    {showTranslations && (
                                        <div className="bg-secondary/10 p-4 rounded-2xl border border-border/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-xs font-bold uppercase tracking-tight text-muted-foreground">{t("menu.translations")}</span>
                                                </div>
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => setShowTranslations(false)}
                                                    className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium text-muted-foreground">{t("menu.nameEn")} ({t("common.optional")})</Label>
                                                    <Input name="name_en" defaultValue={editingProduct?.name_en || ""} className="rounded-xl h-10 bg-background/50 border-white/5 text-sm" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium text-muted-foreground">{t("menu.nameKu")} ({t("common.optional")})</Label>
                                                    <Input name="name_ku" defaultValue={editingProduct?.name_ku || ""} className="rounded-xl h-10 bg-background/50 border-white/5 text-sm" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Section: Description */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                                            <AlignLeft className="w-4 h-4" />
                                        </div>
                                        <h4 className="font-bold text-sm uppercase tracking-wider">{t("common.description")}</h4>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">{t("menu.descAr")}</Label>
                                        <Textarea name="description" defaultValue={editingProduct?.description || ""} className="rounded-xl bg-secondary/30 border-white/5 resize-none min-h-[80px]" rows={2} />
                                    </div>

                                    {showTranslations && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-medium text-muted-foreground">{t("menu.descEn")} ({t("common.optional")})</Label>
                                                <Textarea name="description_en" defaultValue={editingProduct?.description_en || ""} className="rounded-xl bg-secondary/20 border-white/5 text-sm" rows={2} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-medium text-muted-foreground">{t("menu.descKu")} ({t("common.optional")})</Label>
                                                <Textarea name="description_ku" defaultValue={editingProduct?.description_ku || ""} className="rounded-xl bg-secondary/20 border-white/5 text-sm" rows={2} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Section: Price & Image */}
                                <div className="space-y-4 pt-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold flex items-center gap-2">
                                                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                                                {t("common.price")} ({t("storefront.currency")}) *
                                            </Label>
                                            <div className="relative">
                                                <Input name="price" type="text" defaultValue={editingProduct?.price} onChange={(e) => { e.target.value = arabicToEnglishNumbers(e.target.value); setPreviewPrice(e.target.value); }} required className="rounded-xl h-11 bg-secondary/30 border-white/5 pr-12 font-bold text-lg" />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground bg-white/5 px-2 py-1 rounded-md">
                                                    {t("storefront.currency")}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold flex items-center gap-2">
                                                <ImageIcon2 className="w-3.5 h-3.5 text-blue-500" />
                                                {t("common.image")}
                                            </Label>
                                            <div className="relative group">
                                                <div className="absolute inset-0 bg-primary/5 rounded-xl border-2 border-dashed border-primary/20 group-hover:bg-primary/10 group-hover:border-primary/40 transition-all pointer-events-none flex flex-col items-center justify-center">
                                                    <Plus className="w-5 h-5 text-primary/40 mb-1" />
                                                    <span className="text-[10px] uppercase font-bold text-primary/60 tracking-widest">{t("common.upload") || "رفع صورة"}</span>
                                                </div>
                                                <Input name="image" type="file" accept="image/*" className="rounded-xl h-14 bg-transparent border-none opacity-0 cursor-pointer relative z-10" onChange={e => { const f = e.target.files?.[0]; if (f) setPreviewImage(URL.createObjectURL(f)); }} />
                                            </div>
                                            {editingProduct?.image_url && (
                                                <div className="flex items-center gap-2 mt-2 p-2 bg-secondary/20 rounded-xl border border-white/5">
                                                    <NextImage src={editingProduct.image_url} alt={editingProduct.name} className="w-10 h-10 rounded-lg object-cover" width={40} height={40} unoptimized />
                                                    <span className="text-[10px] text-muted-foreground truncate flex-1">الصورة الحالية</span>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>

                            {/* Status Section (Added since Advanced was removed) */}
                                <div className="p-4 rounded-xl bg-secondary/10 border border-border/5 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-500">
                                            <Eye className="w-4 h-4" />
                                        </div>
                                        <Label className="text-sm font-bold">{t("common.status")}</Label>
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
                                        <div className="flex items-center gap-3 bg-background/40 p-2 pr-4 rounded-xl border border-white/5 min-w-[140px]">
                                            <Switch 
                                                id="available" 
                                                defaultChecked={editingProduct?.is_available ?? true} 
                                                onCheckedChange={(checked) => {
                                                    const el = document.getElementById('is_available_input') as HTMLInputElement;
                                                    if (el) el.value = checked.toString();
                                                }}
                                            />
                                            <Label htmlFor="available" className="font-bold text-xs cursor-pointer">{t("menu.available")}</Label>
                                            <input type="hidden" name="is_available" id="is_available_input" value={(editingProduct?.is_available ?? true).toString()} />
                                        </div>

                                        <div className="flex items-center gap-3 bg-background/40 p-2 pr-4 rounded-xl border border-white/5 min-w-[140px] border-dashed">
                                            <Switch 
                                                id="hidden" 
                                                defaultChecked={editingProduct?.is_hidden ?? false} 
                                                onCheckedChange={(checked) => {
                                                    const el = document.getElementById('is_hidden_input') as HTMLInputElement;
                                                    if (el) el.value = checked.toString();
                                                }}
                                            />
                                            <Label htmlFor="hidden" className="font-bold text-xs cursor-pointer">{t("menu.hiddenFromMenu")}</Label>
                                            <input type="hidden" name="is_hidden" id="is_hidden_input" value={(editingProduct?.is_hidden ?? false).toString()} />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB 2: VARIANTS AND ADDONS */}
                            <TabsContent value="variants" className="space-y-6 mt-0 data-[state=inactive]:hidden" forceMount>
                                {/* Variants Section */}
                                <div className="space-y-4 border border-border/40 p-6 rounded-2xl bg-secondary/5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-500">
                                                    <Layers className="w-4 h-4" />
                                                </div>
                                                <Label className="text-base font-bold text-primary">{t("menu.variants")}</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{t("menu.mustSelectOne")}</span>
                                                <p className="text-[11px] text-muted-foreground/70">{t("menu.variantsDesc")}</p>
                                            </div>
                                        </div>

                                        <Button type="button" variant="outline" size="sm" onClick={() => setVariants([...variants, { name: '', name_en: '', name_ku: '', price: '0' }])} className="h-8 text-xs rounded-lg border-indigo-500/20 hover:bg-indigo-500/5 hover:text-indigo-500 transition-colors">
                                            <Plus className="w-3 h-3 mr-1" /> {t("common.add")}
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {variants.map((v, i) => (
                                            <div key={i} className="group relative bg-background/40 hover:bg-background/60 p-3 rounded-xl border border-white/5 transition-all">
                                                <div className="flex gap-3 items-center">
                                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase">{t("menu.nameAr")}</Label>
                                                            <Input placeholder={t("menu.nameAr") + " *"} value={v.name} onChange={e => { const newV = [...variants]; newV[i].name = e.target.value; setVariants(newV); }} className="rounded-lg h-9 bg-background/50 border-white/5" required />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase">{t("common.price")} ({t("storefront.currency")})</Label>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">{t("storefront.currency")}</span>
                                                                <Input type="text" value={v.price} onChange={e => { const newV = [...variants]; newV[i].price = arabicToEnglishNumbers(e.target.value); setVariants(newV); }} className="pl-10 rounded-lg h-9 bg-background/50 border-white/5 font-bold" required />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="h-8 w-8 rounded-full hover:bg-destructive/10 text-destructive/40 hover:text-destructive self-end mb-0.5">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                {showTranslations && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/5 animate-in fade-in slide-in-from-top-1">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] font-medium text-muted-foreground/50">{t("menu.nameEn")}</Label>
                                                            <Input value={v.name_en || ''} onChange={e => { const newV = [...variants]; newV[i].name_en = e.target.value; setVariants(newV); }} className="rounded-md h-8 text-xs bg-background/30 border-white/5" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] font-medium text-muted-foreground/50">{t("menu.nameKu")}</Label>
                                                            <Input value={v.name_ku || ''} onChange={e => { const newV = [...variants]; newV[i].name_ku = e.target.value; setVariants(newV); }} className="rounded-md h-8 text-xs bg-background/30 border-white/5" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <input type="hidden" name="variants" value={JSON.stringify(variants)} />
                                </div>

                                {/* Addons Section */}
                                <div className="space-y-4 border border-border/40 p-6 rounded-2xl bg-secondary/5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-500">
                                                    <PlusCircle className="w-4 h-4" />
                                                </div>
                                                <Label className="text-base font-bold text-primary">{t("menu.addons")}</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{t("menu.optionalAddons")}</span>
                                                <p className="text-[11px] text-muted-foreground/70">{t("menu.addonsDesc")}</p>
                                            </div>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setAddons([...addons, { name: '', name_en: '', name_ku: '', price: '0' }])} className="h-8 text-xs rounded-lg border-emerald-500/20 hover:bg-emerald-500/5 hover:text-emerald-500 transition-colors">
                                            <Plus className="w-3 h-3 mr-1" /> {t("common.add")}
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {addons.map((a, i) => (
                                            <div key={i} className="group relative bg-background/40 hover:bg-background/60 p-3 rounded-xl border border-white/5 transition-all">
                                                <div className="flex gap-3 items-center">
                                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase">{t("menu.nameAr")}</Label>
                                                            <Input placeholder={t("menu.nameAr") + " *"} value={a.name} onChange={e => { const newA = [...addons]; newA[i].name = e.target.value; setAddons(newA); }} className="rounded-lg h-9 bg-background/50 border-white/5" required />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase">{t("common.price")} (+)</Label>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">+{t("storefront.currency")}</span>
                                                                <Input type="text" value={a.price} onChange={e => { const newA = [...addons]; newA[i].price = arabicToEnglishNumbers(e.target.value); setAddons(newA); }} className="pl-10 rounded-lg h-9 bg-background/50 border-white/5 font-bold" required />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => setAddons(addons.filter((_, idx) => idx !== i))} className="h-8 w-8 rounded-full hover:bg-destructive/10 text-destructive/40 hover:text-destructive self-end mb-0.5">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                {showTranslations && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/5 animate-in fade-in slide-in-from-top-1">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] font-medium text-muted-foreground/50">{t("menu.nameEn")}</Label>
                                                            <Input value={a.name_en || ''} onChange={e => { const newA = [...addons]; newA[i].name_en = e.target.value; setAddons(newA); }} className="rounded-md h-8 text-xs bg-background/30 border-white/5" />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] font-medium text-muted-foreground/50">{t("menu.nameKu")}</Label>
                                                            <Input value={a.name_ku || ''} onChange={e => { const newA = [...addons]; newA[i].name_ku = e.target.value; setAddons(newA); }} className="rounded-md h-8 text-xs bg-background/30 border-white/5" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <input type="hidden" name="addons" value={JSON.stringify(addons)} />
                                </div>
                            </TabsContent>


                            {/* TAB 4: AVAILABILITY (SCHEDULING) */}
                            <TabsContent value="availability" className="space-y-4 mt-0 data-[state=inactive]:hidden" forceMount>
                                {!hasAccess ? (
                                    <div className="p-8 text-center glass-card rounded-2xl border-amber-500/20 bg-amber-500/5">
                                        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                                            <Lock className="w-6 h-6 text-amber-500" />
                                        </div>
                                        <h3 className="text-lg font-bold text-amber-600 mb-2">{t("billing.pro")}</h3>
                                        <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                                            {t("menu.availabilityDesc")}
                                        </p>
                                        <Button type="button" variant="outline" className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white rounded-xl">
                                            {t("billing.upgrade")}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3 mb-2">
                                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                            <p className="text-xs text-emerald-600 font-medium">
                                                {t("menu.availability")}
                                            </p>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {localSchedule.sort((a,b) => a.day_of_week - b.day_of_week).map((day, idx) => {
                                                const dayNames = [
                                                    t("common.sun"), t("common.mon"), t("common.tue"), 
                                                    t("common.wed"), t("common.thu"), t("common.fri"), t("common.sat")
                                                ];
                                                return (
                                                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${day.is_enabled ? 'bg-secondary/20 border-border/50' : 'bg-transparent border-dashed border-border/30 opacity-50'}`}>
                                                        <Switch 
                                                            checked={day.is_enabled} 
                                                            onCheckedChange={() => handleToggleDay(day.day_of_week)}
                                                            className="scale-90"
                                                        />
                                                        <span className="text-sm font-medium w-16">{dayNames[day.day_of_week]}</span>
                                                        
                                                        {day.is_enabled && (
                                                            <div className="flex-1 flex items-center gap-4">
                                                                <div className="flex items-center gap-2 bg-background rounded-lg p-2 border border-border/50">
                                                                    <div className="flex items-center gap-1">
                                                                        <input 
                                                                            type="number" 
                                                                            min="1" 
                                                                            max="12"
                                                                            value={format24to12(day.open_time).hour}
                                                                            onChange={(e) => {
                                                                                const { minute, period } = format24to12(day.open_time);
                                                                                handleUpdateDay(day.day_of_week, 'open_time', format12to24(e.target.value, minute, period));
                                                                            }}
                                                                            disabled={day.is_available_all_day}
                                                                            className="bg-secondary/20 rounded-md w-10 text-center text-xs h-7 outline-none border border-border/30"
                                                                        />
                                                                        <span className="text-muted-foreground">:</span>
                                                                        <input 
                                                                            type="number" 
                                                                            min="0" 
                                                                            max="59"
                                                                            value={format24to12(day.open_time).minute}
                                                                            onChange={(e) => {
                                                                                const { hour, period } = format24to12(day.open_time);
                                                                                handleUpdateDay(day.day_of_week, 'open_time', format12to24(hour, e.target.value, period));
                                                                            }}
                                                                            disabled={day.is_available_all_day}
                                                                            className="bg-secondary/20 rounded-md w-10 text-center text-xs h-7 outline-none border border-border/30"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            disabled={day.is_available_all_day}
                                                                            onClick={() => {
                                                                                const { hour, minute, period } = format24to12(day.open_time);
                                                                                handleUpdateDay(day.day_of_week, 'open_time', format12to24(hour, minute, period === 'AM' ? 'PM' : 'AM'));
                                                                            }}
                                                                            className="ml-1 px-1.5 h-7 rounded-md bg-secondary/30 text-[10px] uppercase font-bold text-primary hover:bg-secondary/50 transition-colors border border-border/30"
                                                                        >
                                                                            {format24to12(day.open_time).period}
                                                                        </button>
                                                                    </div>
                                                                    
                                                                    <span className="text-muted-foreground">-</span>
                                                                    
                                                                    <div className="flex items-center gap-1">
                                                                        <input 
                                                                            type="number" 
                                                                            min="1" 
                                                                            max="12"
                                                                            value={format24to12(day.close_time).hour}
                                                                            onChange={(e) => {
                                                                                const { minute, period } = format24to12(day.close_time);
                                                                                handleUpdateDay(day.day_of_week, 'close_time', format12to24(e.target.value, minute, period));
                                                                            }}
                                                                            disabled={day.is_available_all_day}
                                                                            className="bg-secondary/20 rounded-md w-10 text-center text-xs h-7 outline-none border border-border/30"
                                                                        />
                                                                        <span className="text-muted-foreground">:</span>
                                                                        <input 
                                                                            type="number" 
                                                                            min="0" 
                                                                            max="59"
                                                                            value={format24to12(day.close_time).minute}
                                                                            onChange={(e) => {
                                                                                const { hour, period } = format24to12(day.close_time);
                                                                                handleUpdateDay(day.day_of_week, 'close_time', format12to24(hour, e.target.value, period));
                                                                            }}
                                                                            disabled={day.is_available_all_day}
                                                                            className="bg-secondary/20 rounded-md w-10 text-center text-xs h-7 outline-none border border-border/30"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            disabled={day.is_available_all_day}
                                                                            onClick={() => {
                                                                                const { hour, minute, period } = format24to12(day.close_time);
                                                                                handleUpdateDay(day.day_of_week, 'close_time', format12to24(hour, minute, period === 'AM' ? 'PM' : 'AM'));
                                                                            }}
                                                                            className="ml-1 px-1.5 h-7 rounded-md bg-secondary/30 text-[10px] uppercase font-bold text-primary hover:bg-secondary/50 transition-colors border border-border/30"
                                                                        >
                                                                            {format24to12(day.close_time).period}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="flex items-center gap-1.5 ml-auto">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        id={`all-day-${idx}`}
                                                                        checked={day.is_available_all_day}
                                                                        onChange={(e) => handleUpdateDay(day.day_of_week, 'is_available_all_day', e.target.checked)}
                                                                        className="rounded border-border/50 bg-secondary/50 text-primary"
                                                                    />
                                                                    <Label htmlFor={`all-day-${idx}`} className="text-[10px] text-muted-foreground cursor-pointer">{t("common.allDay")}</Label>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {!day.is_enabled && (
                                                            <span className="text-xs text-muted-foreground">{t("menu.unavailable")}</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>


                        <div className="pt-6 mt-6 border-t border-border/10">
                            <Button type="submit" className="w-full gradient-emerald text-white rounded-2xl h-12 text-base font-bold shadow-lg shadow-emerald-500/20">
                                {editingProduct ? t("common.save") : t("common.add")}
                            </Button>
                        </div>

                    </form>
                        </div>

                        {/* ── Live Preview Side ── */}
                        <div className="hidden sm:flex w-64 flex-col border-l border-border/30 bg-secondary/5 p-5 gap-4 shrink-0">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">معاينة مباشرة</p>

                            {/* Phone frame */}
                            <div className="flex-1 flex items-start justify-center pt-2">
                                <div className="w-full max-w-[200px] rounded-2xl border border-border/40 bg-background shadow-sm overflow-hidden">
                                    {/* Product image */}
                                    <div className="w-full aspect-square bg-secondary/30 flex items-center justify-center overflow-hidden">
                                        {previewImage ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={previewImage} alt="preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon2 className="w-10 h-10 text-muted-foreground/30" />
                                        )}
                                    </div>
                                    {/* Product info */}
                                    <div className="p-3 space-y-1">
                                        <p className="text-sm font-bold leading-tight line-clamp-2">
                                            {previewName || <span className="text-muted-foreground/40 italic text-xs">اسم المنتج</span>}
                                        </p>
                                        <p className="text-sm font-bold text-primary">
                                            {previewPrice ? `${Number(previewPrice).toLocaleString()} د.ع` : <span className="text-muted-foreground/40 italic text-xs">السعر</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-[10px] text-muted-foreground/50 text-center">كما سيظهر للعميل</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
                <DialogContent className="glass-card border-border/50 rounded-2xl max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Add Discount to {discountProduct?.name}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleDiscountSubmit} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>Discount Code</Label>
                            <Input name="code" required placeholder="e.g. SUMMER20" className="rounded-xl bg-secondary/50 uppercase" />
                            <p className="text-[10px] text-muted-foreground">Customers will enter this code at checkout.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select name="discount_type" defaultValue="percentage">
                                    <SelectTrigger className="rounded-xl bg-secondary/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Value</Label>
                                <Input name="discount_value" type="text" onChange={(e) => e.target.value = arabicToEnglishNumbers(e.target.value)} required placeholder="e.g. 10" className="rounded-xl bg-secondary/50" />
                            </div>
                        </div>
                        <Button type="submit" className="w-full gradient-emerald text-white rounded-xl">
                            Create Promo Code
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={itemDiscountDialogOpen} onOpenChange={(open) => {
                setItemDiscountDialogOpen(open);
                if (!open) { setDiscountNewPrice(''); setDiscountPercent(''); }
            }}>
                <DialogContent className="glass-card border-border/50 rounded-2xl max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            خصم مباشر على: {itemDiscountProduct?.name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5 mt-2">
                        {/* Original price reminder */}
                        <div className="bg-secondary/30 rounded-xl p-3 flex items-center justify-between border border-border/50">
                            <span className="text-sm text-muted-foreground">السعر الأصلي</span>
                            <span className="font-bold text-base">{Number(itemDiscountProduct?.price).toFixed(0)} د.ع</span>
                        </div>

                        {/* Active discount notice */}
                        {itemDiscountProduct?.is_discount_active && itemDiscountProduct?.compare_at_price && (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-sm text-amber-500 text-center">
                                الخصم نشط حالياً — السعر قبل الخصم: {Number(itemDiscountProduct.compare_at_price).toFixed(0)} د.ع
                            </div>
                        )}

                        <form onSubmit={handleItemDiscountSubmit} className="space-y-4">
                            {/* Input mode tabs */}
                            <div className="flex rounded-xl overflow-hidden border border-border/50">
                                <button type="button" onClick={() => { setDiscountInputMode('price'); setDiscountPercent(''); }}
                                    className={`flex-1 py-2 text-sm font-medium transition-colors ${discountInputMode === 'price' ? 'bg-primary text-white' : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/60'
                                        }`}>
                                    السعر الجديد
                                </button>
                                <button type="button" onClick={() => { setDiscountInputMode('percent'); setDiscountNewPrice(''); }}
                                    className={`flex-1 py-2 text-sm font-medium transition-colors ${discountInputMode === 'percent' ? 'bg-primary text-white' : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/60'
                                        }`}>
                                    نسبة الخصم %
                                </button>
                            </div>

                            {discountInputMode === 'price' ? (
                                <div className="space-y-2">
                                    <Label>السعر بعد الخصم (د.ع)</Label>
                                    <Input
                                        type="text"
                                        value={discountNewPrice}
                                        onChange={e => setDiscountNewPrice(arabicToEnglishNumbers(e.target.value))}
                                        placeholder={`أقل من ${Number(itemDiscountProduct?.price || 0).toFixed(0)}`}
                                        className="rounded-xl bg-secondary/50"
                                        required
                                    />
                                    {discountNewPrice && Number(discountNewPrice) < Number(itemDiscountProduct?.price) && (
                                        <p className="text-xs text-emerald-500 font-medium">
                                            خصم {Math.round(((Number(itemDiscountProduct?.price) - Number(discountNewPrice)) / Number(itemDiscountProduct?.price)) * 100)}% — توفير {(Number(itemDiscountProduct?.price) - Number(discountNewPrice)).toFixed(0)} د.ع
                                        </p>
                                    )}
                                    {discountNewPrice && Number(discountNewPrice) >= Number(itemDiscountProduct?.price) && (
                                        <p className="text-xs text-red-500">السعر الجديد يجب أن يكون أقل من السعر الأصلي</p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label>نسبة الخصم (%)</Label>
                                    <Input
                                        type="text"
                                        value={discountPercent}
                                        onChange={e => setDiscountPercent(arabicToEnglishNumbers(e.target.value))}
                                        placeholder="مثال: 20"
                                        className="rounded-xl bg-secondary/50"
                                        required
                                    />
                                    {discountPercent && Number(discountPercent) > 0 && Number(discountPercent) < 100 && (
                                        <p className="text-xs text-emerald-500 font-medium">
                                            السعر الجديد: {Math.round(Number(itemDiscountProduct?.price) * (1 - Number(discountPercent) / 100)).toFixed(0)} د.ع
                                        </p>
                                    )}
                                </div>
                            )}

                            <Button type="submit" className="w-full gradient-emerald text-white rounded-xl">
                                تفعيل الخصم
                            </Button>
                        </form>

                        {itemDiscountProduct?.is_discount_active && (
                            <Button
                                type="button"
                                variant="destructive"
                                className="w-full rounded-xl"
                                onClick={handleRemoveDiscount}
                            >
                                إزالة الخصم وإعادة السعر الأصلي
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
