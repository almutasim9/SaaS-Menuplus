"use client";

import { useState, useEffect, useCallback } from "react";
import { 
    MapPin, 
    Search, 
    RefreshCw, 
    CheckCircle2, 
    Circle,
    Info,
    Plus,
    Filter,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRestaurantId, useDeliveryZones } from "@/lib/hooks/useDeliveryZones";
import { createClient } from "@/lib/supabase/client";
import { syncRestaurantAreas, addCustomMasterLocation, deleteCustomMasterLocation, removeAreaFromCoverage } from "@/lib/actions/delivery";

interface MasterLocation {
    id: string;
    name_ar: string;
    restaurant_id?: string | null;
}

const PAGE_SIZE = 120;

export default function LocationsPage() {
    const { data: restaurantId } = useRestaurantId();
    const { data: zones, refetch: refetchZones } = useDeliveryZones(restaurantId || "");
    
    const [city, setCity] = useState<string | null>(null);
    const [locations, setLocations] = useState<MasterLocation[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<"all" | "covered" | "uncovered">("all");
    const [selectedZoneId, setSelectedZoneId] = useState<string>("all");
    const [totalLocations, setTotalLocations] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newLocationName, setNewLocationName] = useState("");
    const [adding, setAdding] = useState(false);

    // Get all assigned area names across all zones
    const assignedAreaNames = zones?.flatMap(zone => zone.delivery_areas.map(a => a.area_name)) || [];
    const assignedSet = new Set(assignedAreaNames);

    const fetchData = useCallback(async (pageNum: number, isInitial: boolean = false, currentSearch: string = "", currentFilter: string = "all", zoneId: string = "all") => {
        if (!restaurantId) return;
        if (isInitial) setLoading(true);
        else setLoadingMore(true);

        try {
            const supabase = createClient();
            
                // 1. Get restaurant city and total count
                let currentCity = city;
                if (!currentCity) {
                    const { data: restaurant } = await supabase
                        .from("restaurants")
                        .select("city")
                        .eq("id", restaurantId)
                        .single();
                    if (restaurant?.city) {
                        setCity(restaurant.city);
                        currentCity = restaurant.city;
                    }
                }

                if (currentCity) {
                    // Fetch hidden locations for this restaurant
                    const { data: hiddenData } = await supabase
                        .from("restaurant_hidden_locations")
                        .select("master_location_id")
                        .eq("restaurant_id", restaurantId);
                    
                    const hiddenIds = hiddenData?.map(h => h.master_location_id) || [];

                    // Fetch total count for the city excluding hidden areas
                    let countQuery = supabase
                        .from("master_locations")
                        .select("*", { count: 'exact', head: true })
                        .eq("city_name_ar", currentCity)
                        .or(`restaurant_id.is.null,restaurant_id.eq.${restaurantId}`);
                    
                    if (hiddenIds.length > 0) {
                        countQuery = countQuery.not("id", "in", `(${hiddenIds.join(",")})`);
                    }

                    const { count } = await countQuery;
                    setTotalLocations(count || 0);

                    const start = pageNum * PAGE_SIZE;
                    const end = start + PAGE_SIZE - 1;

                    let query = supabase
                        .from("master_locations")
                        .select("id, name_ar, restaurant_id")
                        .eq("city_name_ar", currentCity)
                        .or(`restaurant_id.is.null,restaurant_id.eq.${restaurantId}`);

                    if (hiddenIds.length > 0) {
                        query = query.not("id", "in", `(${hiddenIds.join(",")})`);
                    }

                    const { data: locs, error: locsError } = await query
                        .order('name_ar')
                        .range(start, end);
                
                if (currentSearch.trim()) {
                    query = query.ilike('name_ar', `%${currentSearch.trim()}%`);
                }

                // NEW: Filter by specific zone if selected
                let areasToFilter: string[] = assignedAreaNames;
                if (zoneId !== "all") {
                    const zone = zones?.find(z => z.id === zoneId);
                    areasToFilter = zone?.delivery_areas.map(a => a.area_name) || [];
                    
                    // If a specific zone is selected, we are implicitly interested in its areas
                    query = query.in('name_ar', areasToFilter);
                } else {
                    // Coverage Filter (only if no specific zone is selected)
                    if (currentFilter === "covered" && assignedAreaNames.length > 0) {
                        query = query.in('name_ar', assignedAreaNames);
                    } else if (currentFilter === "uncovered" && assignedAreaNames.length > 0) {
                        query = query.not('name_ar', 'in', `(${assignedAreaNames.map(n => `"${n}"`).join(',')})`);
                    } else if (currentFilter !== "all" && assignedAreaNames.length === 0) {
                        if (currentFilter === "covered") {
                            setLocations([]);
                            setHasMore(false);
                            setLoading(false);
                            setLoadingMore(false);
                            return;
                        }
                    }
                }

                const { data: areas, error } = await query;
                if (error) throw error;

                if (areas) {
                    if (isInitial) setLocations(areas);
                    else setLocations(prev => [...prev, ...areas]);
                    setHasMore(areas.length === PAGE_SIZE);
                } else {
                    setHasMore(false);
                }
            }
        } catch (error) {
            console.error("Error fetching locations:", error);
            toast.error("حدث خطأ أثناء تحميل المناطق");
        }
        setLoading(false);
        setLoadingMore(false);
    }, [restaurantId, city, assignedAreaNames.length]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (restaurantId) {
                setPage(0);
                fetchData(0, true, searchQuery, filterType, selectedZoneId);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [restaurantId, searchQuery, filterType, selectedZoneId, fetchData]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchData(nextPage, false, searchQuery, filterType, selectedZoneId);
    };

    const handleSync = async () => {
        if (!restaurantId || !confirm("هل أنت متأكد من مزامنة كافة مناطق المدينة؟ سيتم ربطها بمناطق التوصيل لديك.")) return;
        setSyncing(true);
        try {
            const res = await syncRestaurantAreas(restaurantId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(`تمت مزامنة ${res.count} منطقة بنجاح`);
                setPage(0);
                fetchData(0, true, searchQuery, filterType, selectedZoneId);
                refetchZones();
            }
        } catch (error) {
            toast.error("فشل المزامنة");
        }
        setSyncing(false);
    };

    const handleAddCustomLocation = async () => {
        if (!restaurantId || !newLocationName.trim()) return;
        setAdding(true);
        try {
            const res = await addCustomMasterLocation(restaurantId, newLocationName);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("تمت إضافة المنطقة وربطها بمطعمك بنجاح");
                setIsAddModalOpen(false);
                setNewLocationName("");
                // Refresh list
                setPage(0);
                fetchData(0, true, searchQuery, filterType, selectedZoneId);
                refetchZones();
            }
        } catch (error) {
            toast.error("فشل إضافة المنطقة");
        }
        setAdding(false);
    };

    const handleDeleteLocation = async (loc: MasterLocation) => {
        const isPrivate = loc.restaurant_id === restaurantId;
        const msg = isPrivate 
            ? "هل أنت متأكد من مسح هذه المنطقة؟ سيتم حذفها نهائياً من القاموس ومن مناطق التوصيل."
            : "هل أنت متأكد من إخفاء هذه المنطقة؟ ستختفي من دليلك الحالي وسيتم حذفها من زونات التوصيل الخاصة بك.";
        
        if (!restaurantId || !confirm(msg)) return;
        
        setDeletingId(loc.id);
        try {
            const res = await deleteCustomMasterLocation(restaurantId, loc.id);

            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(isPrivate ? "تم مسح المنطقة بنجاح" : "تم إخفاء المنطقة من دليلك");
                // Always remove from local UI list
                setLocations(prev => prev.filter(l => l.id !== loc.id));
                setTotalLocations(prev => Math.max(0, prev - 1));
                refetchZones();
            }
        } catch (error) {
            toast.error("فشل تنفيذ العملية");
        }
        setDeletingId(null);
    };

    const filteredLocations = locations;

    if (loading && page === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <MapPin className="text-emerald-500" />
                        مناطق وأحياء مدينة ({city})
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        هذه هي المناطق الرسمية المتوفرة لمحل إقامتك. يمكنك مزامنتها مع مناطق التوصيل.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="rounded-xl border-dashed">
                                <Plus className="w-4 h-4 me-2" />
                                إضافة منطقة جديدة
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card">
                            <DialogHeader>
                                <DialogTitle>إضافة منطقة جديدة للمطعم</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>اسم المنطقة/الحي</Label>
                                    <Input 
                                        value={newLocationName} 
                                        onChange={(e) => setNewLocationName(e.target.value)} 
                                        placeholder="مثال: حي الزهور، محلة ١٠١..."
                                        className="rounded-xl"
                                    />
                                </div>
                                <Button 
                                    onClick={handleAddCustomLocation} 
                                    disabled={adding || !newLocationName.trim()}
                                    className="w-full gradient-emerald text-white"
                                >
                                    {adding ? "جاري الإضافة..." : "حفظ المنطقة"}
                                </Button>
                                <p className="text-[11px] text-muted-foreground text-center">
                                    سيتم إضافة المنطقة للقائمة العامة ولتوصيلات مطعمك مباشرة.
                                </p>
                            </div>
                        </DialogContent>
                    </Dialog>
                    
                    <Button 
                        onClick={handleSync} 
                        disabled={syncing}
                        className="gradient-emerald text-white rounded-xl shadow-lg shadow-emerald/20 px-6"
                    >
                        <RefreshCw className={`w-4 h-4 me-2 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? "جاري المزامنة..." : "مزامنة الكل (Sync City)"}
                    </Button>
                </div>
            </div>

            {/* Info Card */}
            <div className="glass-card p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex flex-col md:flex-row items-start md:items-center gap-4 text-sm text-blue-600 dark:text-blue-400">
                <div className="flex gap-3 shrink-0">
                    <Info className="w-5 h-5 shrink-0" />
                    <p className="flex-1">
                        المناطق التي تظهر بجانبها علامة خضراء هي المناطق المضافة حالياً في "مناطق التوصيل" الخاصة بك. 
                    </p>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="ms-auto rounded-lg border-blue-200 hover:bg-blue-100 dark:border-blue-800 dark:hover:bg-blue-900/40 shrink-0"
                    onClick={() => window.location.href = '/dashboard/delivery/zones'}
                >
                    إدارة مناطق التوصيل (Manage Zones)
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        placeholder="ابحث عن اسم الحي أو المنطقة..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="ps-10 rounded-xl bg-secondary/50 border-none h-11"
                    />
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap md:flex-nowrap">
                    <Select value={filterType} onValueChange={(val: any) => {
                        setFilterType(val);
                        if (val !== "all") setSelectedZoneId("all");
                    }}>
                        <SelectTrigger className="w-full md:w-[150px] rounded-xl bg-secondary/50 border-none h-11">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                <SelectValue placeholder="تصفية التغطية" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="glass-card">
                            <SelectItem value="all">كل المناطق</SelectItem>
                            <SelectItem value="covered">المناطق المغطاة</SelectItem>
                            <SelectItem value="uncovered">المناطق غير المغطاة</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={selectedZoneId} onValueChange={(val: string) => {
                        setSelectedZoneId(val);
                        if (val !== "all") setFilterType("all");
                    }}>
                        <SelectTrigger className="w-full md:w-[180px] rounded-xl bg-secondary/50 border-none h-11">
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-emerald-500" />
                                <SelectValue placeholder="حسب الزون" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="glass-card">
                            <SelectItem value="all">كل الزونات</SelectItem>
                            {zones?.map(zone => (
                                <SelectItem key={zone.id} value={zone.id}>
                                    {zone.zone_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 font-medium text-xs whitespace-nowrap">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>مغطاة: {assignedSet.size} / {totalLocations}</span>
                    </div>
                </div>
            </div>

            {/* Locations Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredLocations.map((loc) => {
                    const isAssigned = assignedSet.has(loc.name_ar);
                    const isPrivate = loc.restaurant_id === restaurantId;
                    const isDeleting = deletingId === loc.id;

                    return (
                        <div 
                            key={loc.id} 
                            className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between group ${
                                isAssigned 
                                ? "bg-emerald-500/5 border-emerald-500/20 shadow-sm" 
                                : "bg-secondary/30 border-border/50 hover:border-emerald-500/30"
                            }`}
                        >
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="font-medium text-sm truncate">{loc.name_ar}</span>
                                {isPrivate && (
                                    <span className="text-[10px] text-muted-foreground">منطقة مضافة يدوياً</span>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteLocation(loc)}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </Button>
                                
                                {isAssigned ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                ) : (
                                    <Circle className="w-5 h-5 text-slate-300 opacity-50" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Load More */}
            {hasMore && searchQuery === "" && (
                <div className="flex justify-center pt-8">
                    <Button 
                        variant="secondary" 
                        onClick={handleLoadMore} 
                        disabled={loadingMore}
                        className="rounded-xl px-10 h-11"
                    >
                        {loadingMore ? (
                            <RefreshCw className="w-4 h-4 animate-spin me-2" />
                        ) : (
                            <Plus className="w-4 h-4 me-2" />
                        )}
                        تحميل المزيد
                    </Button>
                </div>
            )}

            {filteredLocations.length === 0 && !loading && (
                <div className="text-center py-20 bg-secondary/20 rounded-3xl border border-dashed border-border">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground font-medium">
                        {filterType === "covered" ? "لا توجد مناطق مغطاة بعد" : 
                         filterType === "uncovered" ? "تم تغطية كافة المناطق! 🎉" : 
                         "لم يتم العثور على مناطق تطابق بحثك"}
                    </p>
                </div>
            )}
        </div>
    );
}
