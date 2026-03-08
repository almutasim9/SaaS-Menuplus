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
import { Plus, GripVertical, Pencil, Trash2, EyeOff, Eye, PackageX, PackageCheck, ImageIcon, Search, ChevronDown, Check, Tag, UtensilsCrossed, Percent, Copy } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/context";
import type { Product, Category, ProductVariant, ProductAddon } from "@/lib/types/database.types";
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
            className={`glass-card rounded-xl p-3 flex items-center gap-4 transition-colors ${isDragging ? "bg-white/10 shadow-lg ring-1 ring-primary" : "hover:bg-white/[0.04] bg-secondary/10"
                }`}
        >
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-white/5 rounded">
                <GripVertical className="w-4 h-4 text-muted-foreground/40 transition-colors hover:text-foreground" />
            </div>

            <div className={`w-12 h-12 rounded-lg bg-secondary/30 relative overflow-hidden flex-shrink-0 ${product.is_hidden ? 'opacity-50 grayscale' : ''}`}>
                {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <ImageIcon className="w-5 h-5 text-muted-foreground/30" />
                    </div>
                )}
            </div>

            <div className={`flex-1 min-w-0 ${product.is_hidden ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{product.name}</h4>
                    {product.is_hidden && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 py-0">Hidden</Badge>
                    )}
                    {!product.is_available && (
                        <Badge variant="destructive" className="text-[10px] h-4 px-1 py-0 bg-red-500/20 text-red-500">Out of Stock</Badge>
                    )}
                    {(product.stock_count !== null && product.stock_count > 0 && product.stock_count <= 5) && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 border-amber-500 text-amber-500 bg-amber-500/10">Low Stock: {product.stock_count}</Badge>
                    )}
                    {(product.stock_count === 0) && (
                        <Badge variant="destructive" className="text-[10px] h-4 px-1 py-0 bg-red-500/20 text-red-500">Zero Stock</Badge>
                    )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{product.description || "No description"}</p>
            </div>

            <div className="flex items-center gap-3">
                <span className="font-semibold text-sm mr-2">{Number(product.price).toFixed(0)} د.ع</span>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" title={product.is_available ? "Mark Out of Stock" : "Mark In Stock"} className={`h-7 w-7 rounded-lg z-10 relative ${!product.is_available ? 'text-red-500 hover:text-red-600 hover:bg-red-500/10' : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10'}`} onClick={(e) => { e.stopPropagation(); onToggleAvailability(product.id, product.is_available); }}>
                        {product.is_available ? <PackageCheck className="w-3.5 h-3.5" /> : <PackageX className="w-3.5 h-3.5" />}
                    </Button>
                    {onItemDiscount && (
                        <Button variant="ghost" size="icon" title="Item Discount" className={`h-7 w-7 rounded-lg z-10 relative ${product.is_discount_active ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'hover:bg-amber-500/10 hover:text-amber-500 text-muted-foreground'}`} onClick={(e) => { e.stopPropagation(); onItemDiscount(product); }}>
                            <div className="relative">
                                <Percent className="w-3.5 h-3.5" />
                                {product.is_discount_active && <div className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />}
                            </div>
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" title={product.is_hidden ? "Show in menu" : "Hide from menu"} className={`h-7 w-7 rounded-lg z-10 relative ${product.is_hidden ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-500/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'}`} onClick={(e) => { e.stopPropagation(); onToggleVisibility(product.id, product.is_hidden); }}>
                        {product.is_hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary z-10 relative" onClick={(e) => { e.stopPropagation(); onEdit(product); }}>
                        <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Duplicate item" className="h-7 w-7 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500 z-10 relative" onClick={(e) => { e.stopPropagation(); onDuplicate(product.id); }}>
                        <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive z-10 relative" onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
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

    const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
    const [discountProduct, setDiscountProduct] = useState<ProductWithCategory | null>(null);

    const [itemDiscountDialogOpen, setItemDiscountDialogOpen] = useState(false);
    const [itemDiscountProduct, setItemDiscountProduct] = useState<ProductWithCategory | null>(null);
    const [discountInputMode, setDiscountInputMode] = useState<'price' | 'percent'>('price');
    const [discountNewPrice, setDiscountNewPrice] = useState('');
    const [discountPercent, setDiscountPercent] = useState('');

    const [activeId, setActiveId] = useState<string | null>(null);

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
                toast.success("Category updated");
            } else {
                await createCategory(restaurantId, name, name_en, name_ku, sort_order);
                toast.success("Category created");
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
            toast.success("Category deleted");
        } catch (e: any) {
            toast.error(e.message || "Failed to delete");
        }
    };

    const handleToggleCategoryVisibility = async (id: string, currentHidden: boolean) => {
        try {
            await toggleCategoryVisibility(id, !currentHidden);
            setCategories(categories.map((c) => (c.id === id ? { ...c, is_hidden: !currentHidden } : c)));
            toast.success(currentHidden ? "Category is now visible" : "Category hidden from menu");
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
                toast.success("Product updated");
            } else {
                await createProduct(formData);
                toast.success("Product created");
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
            toast.success("Product deleted");
        } catch {
            toast.error("Failed to delete");
        }
    };

    const handleToggleProduct = async (id: string, current: boolean) => {
        try {
            await toggleProductAvailability(id, !current);
            setProducts(products.map((p) => (p.id === id ? { ...p, is_available: !current } : p)));
            toast.success(current ? "Marked as out of stock" : "Marked as available");
        } catch {
            toast.error("Failed to update availability");
        }
    };

    const handleToggleProductVisibility = async (id: string, currentHidden: boolean) => {
        try {
            await toggleProductVisibility(id, !currentHidden);
            setProducts(products.map((p) => (p.id === id ? { ...p, is_hidden: !currentHidden } : p)));
            toast.success(currentHidden ? "Product is now visible in menu" : "Product hidden from menu");
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
                    <Button className="gradient-emerald text-white rounded-xl shadow-md" onClick={() => { setEditingProduct(null); setVariants([]); setAddons([]); setProductDialogOpen(true); }}>
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
                        <h3 className="text-lg font-medium mb-2">Your menu is empty</h3>
                        <p className="text-sm text-muted-foreground mb-6">Create your first category to start adding items.</p>
                        <Button onClick={() => setCategoryDialogOpen(true)} className="gradient-emerald text-white rounded-xl">Add Category</Button>
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
                        <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCategorySubmit} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>Name (Arabic) *</Label>
                            <Input name="name" defaultValue={editingCategory?.name} required placeholder="e.g. الحلويات" className="rounded-xl bg-secondary/50" />
                        </div>
                        <div className="space-y-2">
                            <Label>Name (English) <span className="text-muted-foreground text-xs">(optional)</span></Label>
                            <Input name="name_en" defaultValue={editingCategory?.name_en || ""} placeholder="e.g. Desserts" className="rounded-xl bg-secondary/50" />
                        </div>
                        <div className="space-y-2">
                            <Label>Name (Kurdish) <span className="text-muted-foreground text-xs">(optional)</span></Label>
                            <Input name="name_ku" defaultValue={editingCategory?.name_ku || ""} placeholder="e.g. شیرینی" className="rounded-xl bg-secondary/50" />
                        </div>
                        <Button type="submit" className="w-full gradient-emerald text-white rounded-xl">
                            {editingCategory ? "Update Category" : "Save Category"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                <DialogContent className="glass-card border-border/50 rounded-2xl max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? "Edit Item" : "New Menu Item"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleProductSubmit} className="space-y-4 mt-4">
                        <Tabs defaultValue="base" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 bg-secondary/50 rounded-xl mb-4">
                                <TabsTrigger value="base" className="rounded-lg">Base Info</TabsTrigger>
                                <TabsTrigger value="variants" className="rounded-lg">Variants & Add-ons</TabsTrigger>
                                <TabsTrigger value="advanced" className="rounded-lg">Advanced & Stock</TabsTrigger>
                            </TabsList>

                            {/* TAB 1: BASE INFO */}
                            <TabsContent value="base" className="space-y-4 mt-0">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Name (Arabic) *</Label>
                                        <Input name="name" defaultValue={editingProduct?.name} required className="rounded-xl bg-secondary/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Category *</Label>
                                        <Select name="category_id" defaultValue={editingProduct?.category_id || categories[0]?.id}>
                                            <SelectTrigger className="rounded-xl bg-secondary/50">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Name (English) <span className="text-muted-foreground text-xs">(optional)</span></Label>
                                        <Input name="name_en" defaultValue={editingProduct?.name_en || ""} className="rounded-xl bg-secondary/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Name (Kurdish) <span className="text-muted-foreground text-xs">(optional)</span></Label>
                                        <Input name="name_ku" defaultValue={editingProduct?.name_ku || ""} className="rounded-xl bg-secondary/50" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Description (Arabic)</Label>
                                    <Textarea name="description" defaultValue={editingProduct?.description || ""} className="rounded-xl bg-secondary/50" rows={2} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Description (English) <span className="text-muted-foreground text-xs">(optional)</span></Label>
                                        <Textarea name="description_en" defaultValue={editingProduct?.description_en || ""} className="rounded-xl bg-secondary/50" rows={2} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description (Kurdish) <span className="text-muted-foreground text-xs">(optional)</span></Label>
                                        <Textarea name="description_ku" defaultValue={editingProduct?.description_ku || ""} className="rounded-xl bg-secondary/50" rows={2} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Price (د.ع) *</Label>
                                        <Input name="price" type="number" step="1" min="0" defaultValue={editingProduct?.price} required className="rounded-xl bg-secondary/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Image</Label>
                                        <Input name="image" type="file" accept="image/*" className="rounded-xl bg-secondary/50 file:mr-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-foreground file:text-sm" />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB 2: VARIANTS AND ADDONS */}
                            <TabsContent value="variants" className="space-y-4 mt-0">
                                {/* Variants Section */}
                                <div className="space-y-3 border border-border/50 p-4 rounded-xl bg-secondary/20">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Variants</Label>
                                            <p className="text-xs text-muted-foreground">Different options like Size</p>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setVariants([...variants, { name: '', name_en: '', name_ku: '', price: '0' }])} className="h-8 text-xs rounded-lg">
                                            <Plus className="w-3 h-3 mr-1" /> Add Variant
                                        </Button>
                                    </div>
                                    {variants.map((v, i) => (
                                        <div key={i} className="flex gap-2 items-center">
                                            <Input placeholder="Name (Ar) *" value={v.name} onChange={e => { const newV = [...variants]; newV[i].name = e.target.value; setVariants(newV); }} className="rounded-lg bg-background w-32" required />
                                            <Input placeholder="En (Optional)" value={v.name_en || ''} onChange={e => { const newV = [...variants]; newV[i].name_en = e.target.value; setVariants(newV); }} className="rounded-lg bg-background w-28" />
                                            <Input placeholder="Ku (Optional)" value={v.name_ku || ''} onChange={e => { const newV = [...variants]; newV[i].name_ku = e.target.value; setVariants(newV); }} className="rounded-lg bg-background w-28" />
                                            <div className="relative w-28">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                                <Input type="number" step="0.01" min="0" value={v.price} onChange={e => { const newV = [...variants]; newV[i].price = e.target.value; setVariants(newV); }} className="pl-7 rounded-lg bg-background" required />
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}>
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                    <input type="hidden" name="variants" value={JSON.stringify(variants)} />
                                </div>

                                {/* Addons Section */}
                                <div className="space-y-3 border border-border/50 p-4 rounded-xl bg-secondary/20">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Add-ons</Label>
                                            <p className="text-xs text-muted-foreground">Optional extras</p>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setAddons([...addons, { name: '', name_en: '', name_ku: '', price: '0' }])} className="h-8 text-xs rounded-lg">
                                            <Plus className="w-3 h-3 mr-1" /> Add Extra
                                        </Button>
                                    </div>
                                    {addons.map((a, i) => (
                                        <div key={i} className="flex gap-2 items-center">
                                            <Input placeholder="Name (Ar) *" value={a.name} onChange={e => { const newA = [...addons]; newA[i].name = e.target.value; setAddons(newA); }} className="rounded-lg bg-background w-32" required />
                                            <Input placeholder="En (Optional)" value={a.name_en || ''} onChange={e => { const newA = [...addons]; newA[i].name_en = e.target.value; setAddons(newA); }} className="rounded-lg bg-background w-28" />
                                            <Input placeholder="Ku (Optional)" value={a.name_ku || ''} onChange={e => { const newA = [...addons]; newA[i].name_ku = e.target.value; setAddons(newA); }} className="rounded-lg bg-background w-28" />
                                            <div className="relative w-28">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">+$</span>
                                                <Input type="number" step="0.01" min="0" value={a.price} onChange={e => { const newA = [...addons]; newA[i].price = e.target.value; setAddons(newA); }} className="pl-7 rounded-lg bg-background" required />
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => setAddons(addons.filter((_, idx) => idx !== i))}>
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                    <input type="hidden" name="addons" value={JSON.stringify(addons)} />
                                </div>
                            </TabsContent>

                            {/* TAB 3: ADVANCED & STOCK */}
                            <TabsContent value="advanced" className="space-y-4 mt-0">
                                <div className="space-y-4 p-4 rounded-xl bg-secondary/20 border border-border/50">
                                    <h4 className="font-medium text-sm border-b border-border/50 pb-2">Additional Specifications</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Collection</Label>
                                            <Input name="collection" defaultValue={editingProduct?.collection || ""} placeholder="e.g. Specials" className="rounded-xl bg-background" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Calories</Label>
                                            <Input name="calories" type="number" min="0" defaultValue={editingProduct?.calories || ""} placeholder="kcal" className="rounded-xl bg-background" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Stock</Label>
                                            <Input name="stock_count" type="number" min="0" defaultValue={editingProduct?.stock_count ?? ""} placeholder="∞" className="rounded-xl bg-background" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 p-4 rounded-xl bg-secondary/30 border border-border/50 mt-4">
                                    <div className="flex items-center gap-3">
                                        <Switch name="is_available" id="available" defaultChecked={editingProduct?.is_available ?? true} />
                                        <Label htmlFor="available">In Stock</Label>
                                        <input type="hidden" name="is_available" value={(editingProduct?.is_available ?? true).toString()} />
                                    </div>
                                    <div className="w-px h-8 bg-border/50" />
                                    <div className="flex items-center gap-3">
                                        <Switch name="is_hidden" id="hidden" defaultChecked={editingProduct?.is_hidden ?? false} />
                                        <Label htmlFor="hidden">Hidden from menu</Label>
                                        <input type="hidden" name="is_hidden" value={(editingProduct?.is_hidden ?? false).toString()} />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="pt-4 mt-4 border-t border-border/50">
                            <Button type="submit" className="w-full gradient-emerald text-white rounded-xl h-11">
                                {editingProduct ? "Update Item" : "Create Item"}
                            </Button>
                        </div>
                    </form>
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
                                <Input name="discount_value" type="number" step="0.01" min="0" required placeholder="e.g. 10" className="rounded-xl bg-secondary/50" />
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
                                        type="number" step="1" min="1"
                                        max={(Number(itemDiscountProduct?.price) || 0) - 1 || undefined}
                                        value={discountNewPrice}
                                        onChange={e => setDiscountNewPrice(e.target.value)}
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
                                        type="number" step="1" min="1" max="99"
                                        value={discountPercent}
                                        onChange={e => setDiscountPercent(e.target.value)}
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
