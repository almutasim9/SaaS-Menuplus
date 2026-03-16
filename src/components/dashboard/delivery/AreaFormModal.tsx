"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, MapPin, Check, X, Map } from "lucide-react";
import { useRestaurantId, type ZoneWithAreas } from "@/lib/hooks/useDeliveryZones";
import { getRestaurantAvailableAreas, createMultipleDeliveryAreas } from "@/lib/actions/delivery";
import { useQueryClient } from "@tanstack/react-query";

interface AreaFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    zone: ZoneWithAreas | null;
}

export function AreaFormModal({ open, onOpenChange, zone }: AreaFormModalProps) {
    const { data: restaurantId } = useRestaurantId();
    const queryClient = useQueryClient();
    
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
    const [availableAreas, setAvailableAreas] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open && restaurantId) {
            setSearchQuery("");
            setSelectedAreas(new Set());
            fetchAvailableAreas();
        }
    }, [open, restaurantId]);

    const fetchAvailableAreas = async () => {
        if (!restaurantId) return;
        setLoading(true);
        try {
            const areas = await getRestaurantAvailableAreas(restaurantId);
            setAvailableAreas(areas);
        } catch (error) {
            console.error("Error fetching available areas:", error);
            toast.error("فشل تحميل المناطق المتاحة");
        }
        setLoading(false);
    };

    const filteredAreas = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return availableAreas.slice(0, 5); // Default limit
        
        return availableAreas
            .filter(area => area.toLowerCase().includes(query))
            .slice(0, 5); // Optimization: Limit to top 5
    }, [availableAreas, searchQuery]);

    const toggleArea = (area: string) => {
        setSelectedAreas(prev => {
            const next = new Set(prev);
            if (next.has(area)) next.delete(area);
            else next.add(area);
            return next;
        });
    };

    const handleSaveAreas = async () => {
        if (!zone || selectedAreas.size === 0) return;

        setIsSaving(true);
        try {
            const areaNames = Array.from(selectedAreas);
            await createMultipleDeliveryAreas(zone.id, areaNames);
            
            queryClient.invalidateQueries({ queryKey: ['deliveryZones'] });
            toast.success(`تمت إضافة ${areaNames.length} مناطق بنجاح`);
            onOpenChange(false);
        } catch (error: any) {
            console.error("Add Area Error:", error);
            toast.error(error.message || "حدث خطأ أثناء إضافة المناطق");
        } finally {
            setIsSaving(false);
        }
    };

    const selectedList = Array.from(selectedAreas);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glass-card border-border/50 rounded-3xl max-w-md p-0 overflow-hidden">
                <div className="p-6">
                    <DialogHeader>
                        <DialogTitle className="text-right flex items-center justify-end gap-2 text-xl font-bold">
                            إضافة مناطق لـ {zone?.zone_name}
                            <Map className="w-5 h-5 text-primary" />
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-5 mt-6 text-right" dir="rtl">
                        {/* SEARCH INPUT */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground pr-1">ابحث عن اسم الحي (Search)</Label>
                            <div className="relative group">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input 
                                    placeholder="اكتب اسم المنطقة هنا..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pr-10 rounded-2xl bg-secondary/30 border-none h-12 text-base focus-visible:ring-2 focus-visible:ring-primary/20 shadow-inner"
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        {/* RESULTS LIST */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground pr-1">المقترحات (Top Results)</Label>
                            <div className="relative min-h-[220px]">
                                {loading ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-secondary/5 rounded-2xl">
                                        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredAreas.length === 0 ? (
                                            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground bg-secondary/5 rounded-2xl border border-dashed border-border/30">
                                                <Search className="w-8 h-8 opacity-20 mb-2" />
                                                <span className="text-sm">{searchQuery ? "لا توجد نتائج مطابقة" : "ابدأ البحث للعثور على مناطق"}</span>
                                            </div>
                                        ) : (
                                            filteredAreas.map((area) => (
                                                <button
                                                    key={area}
                                                    onClick={() => toggleArea(area)}
                                                    className={`flex items-center justify-between w-full p-3.5 rounded-2xl text-right transition-all group ${
                                                        selectedAreas.has(area) 
                                                            ? 'bg-primary/10 text-primary border border-primary/20' 
                                                            : 'hover:bg-secondary/40 border border-transparent'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                                                            selectedAreas.has(area) ? 'bg-primary text-white' : 'bg-secondary/50 text-muted-foreground group-hover:text-primary group-hover:bg-primary/5'
                                                        }`}>
                                                            {selectedAreas.has(area) ? <Check className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                                                        </div>
                                                        <span className="text-sm font-bold">{area}</span>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SELECTED PREVIEW */}
                        {selectedList.length > 0 && (
                            <div className="space-y-2 animate-in slide-in-from-bottom-2">
                                <Label className="text-xs font-semibold text-muted-foreground pr-1">المناطق المختارة ({selectedList.length})</Label>
                                <div className="flex flex-wrap gap-2 p-3 bg-primary/5 rounded-2xl border border-primary/10">
                                    {selectedList.map(area => (
                                        <div 
                                            key={area} 
                                            className="flex items-center gap-1.5 bg-background border border-primary/20 px-3 py-1.5 rounded-xl shadow-sm hover:border-destructive/30 transition-colors group cursor-default"
                                        >
                                            <span className="text-xs font-bold text-primary">{area}</span>
                                            <button 
                                                onClick={() => toggleArea(area)}
                                                className="text-muted-foreground hover:text-destructive transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER ACTION */}
                <div className="p-4 bg-secondary/10 border-t border-border/50">
                    <Button 
                        onClick={handleSaveAreas} 
                        disabled={isSaving || selectedAreas.size === 0}
                        className={`w-full h-12 text-white rounded-2xl font-bold text-base transition-all ${
                            selectedAreas.size > 0 ? 'gradient-emerald shadow-[0_4px_12px_rgba(16,185,129,0.25)]' : 'bg-secondary text-muted-foreground opacity-50'
                        }`}
                    >
                        {isSaving ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                جاري الحفظ...
                            </div>
                        ) : (
                            selectedAreas.size > 0 
                                ? `إضافة المناطق المختارة (${selectedAreas.size})`
                                : "اختر منطقة للبدء"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
