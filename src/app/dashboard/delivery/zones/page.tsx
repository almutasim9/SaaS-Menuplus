"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Truck, MapPin, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { 
    useRestaurantId, 
    useFreeDeliveryStatus, 
    useDeliveryZones, 
    useDeleteDeliveryZoneMutation, 
    useUpdateDeliveryZoneMutation,
    useDeleteDeliveryAreaMutation,
    useOutOfZoneStatus,
    type ZoneWithAreas 
} from "@/lib/hooks/useDeliveryZones";
import { ZoneFormModal } from "@/components/dashboard/delivery/ZoneFormModal";
import { AreaFormModal } from "@/components/dashboard/delivery/AreaFormModal";
import { GlobalDeliverySettings } from "@/components/dashboard/delivery/GlobalDeliverySettings";
import { syncRestaurantAreas } from "@/lib/actions/delivery";

export default function DeliveryZonesPage() {
    const { data: restaurantId, isLoading: idLoading } = useRestaurantId();
    const { data: isFreeDelivery = false } = useFreeDeliveryStatus(restaurantId ?? null);
    const { data: outOfZoneData = { accept: false, minOrder: 0 } } = useOutOfZoneStatus(restaurantId ?? null);
    const acceptOutOfZone = outOfZoneData.accept;
    const outOfZoneMinOrderInitial = outOfZoneData.minOrder;
    const { data: zones = [], isLoading: zonesLoading, refetch } = useDeliveryZones(restaurantId ?? null);
    
    
    // We could fetch the restaurant city here or pass it if available
    // For now I'll just rely on the syncRestaurantAreas action finding it


    const deleteZoneMutation = useDeleteDeliveryZoneMutation();
    const updateZoneMutation = useUpdateDeliveryZoneMutation();
    const deleteAreaMutation = useDeleteDeliveryAreaMutation();

    const [zoneModalOpen, setZoneModalOpen] = useState(false);
    const [editingZone, setEditingZone] = useState<ZoneWithAreas | null>(null);
    const [areaModalOpen, setAreaModalOpen] = useState(false);
    const [selectedZone, setSelectedZone] = useState<ZoneWithAreas | null>(null);
    const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>({});
    const loading = idLoading || zonesLoading;

    const handleDeleteZone = async (id: string) => {
        try {
            await deleteZoneMutation.mutateAsync(id);
            toast.success("تم حذف المنطقة");
        } catch {
            toast.error("فشل في حذف المنطقة");
        }
    };

    const handleDeleteArea = async (areaId: string) => {
        try {
            await deleteAreaMutation.mutateAsync(areaId);
            toast.success("تم حذف المنطقة الفرعية");
        } catch {
            toast.error("فشل في الحذف");
        }
    };

    const handleToggleActive = async (zone: ZoneWithAreas) => {
        try {
            await updateZoneMutation.mutateAsync({
                id: zone.id,
                zoneName: zone.zone_name,
                flatRate: zone.flat_rate,
                freeThreshold: zone.free_delivery_threshold || undefined,
                isActive: !zone.is_active
            });
        } catch {
            toast.error("فشل في تحديث الحالة");
        }
    };

    const openEditZone = (zone: ZoneWithAreas) => {
        setEditingZone(zone);
        setZoneModalOpen(true);
    };

    const openCreateZone = () => {
        setEditingZone(null);
        setZoneModalOpen(true);
    };

    const openCreateArea = (zone: ZoneWithAreas) => {
        setSelectedZone(zone);
        setAreaModalOpen(true);
    };

    const toggleExpand = (zoneId: string) => {
        setExpandedZones(prev => ({ ...prev, [zoneId]: !prev[zoneId] }));
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
            {/* DELIVERY SETTINGS */}
            <GlobalDeliverySettings 
                restaurantId={restaurantId ?? null}
                isFreeDelivery={isFreeDelivery}
                acceptOutOfZone={acceptOutOfZone}
                outOfZoneMinOrderInitial={outOfZoneMinOrderInitial}
            />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Delivery Management</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        إعداد مناطق التوصيل والأسعار
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={openCreateZone} className="gradient-emerald text-white rounded-xl gap-2 hover:opacity-90">
                        <Plus className="w-4 h-4" />
                        إضافة منطقة (Add Zone)
                    </Button>
                </div>
            </div>

            <ZoneFormModal 
                open={zoneModalOpen} 
                onOpenChange={setZoneModalOpen} 
                restaurantId={restaurantId ?? null} 
                editingZone={editingZone} 
            />

            <AreaFormModal
                open={areaModalOpen}
                onOpenChange={setAreaModalOpen}
                zone={selectedZone}
            />

            {zones.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                    <Truck className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">لا توجد مناطق توصيل</h3>
                    <p className="text-sm text-muted-foreground">
                        قم بإضافة أول منطقة توصيل للبدء في استقبال الطلبات
                    </p>
                </div>
            ) : (
                <div className="glass-card rounded-2xl overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border/30 hover:bg-transparent text-right">
                                <TableHead className="text-right">المنطقة (Zone)</TableHead>
                                <TableHead className="text-right">السعر (Rate)</TableHead>
                                <TableHead className="text-right">التوصيل المجاني</TableHead>
                                <TableHead className="text-right">الحد الأدنى للطلب</TableHead>
                                <TableHead className="text-right">وقت التوصيل</TableHead>
                                <TableHead className="text-right">الحالة (Status)</TableHead>
                                <TableHead className="text-left">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {zones.map((zone) => (
                                <React.Fragment key={zone.id}>
                                    <TableRow className="border-border/20 hover:bg-secondary/30">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => toggleExpand(zone.id)} className="p-1 hover:bg-secondary rounded-lg">
                                                    {expandedZones[zone.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                </button>
                                                <MapPin className="w-4 h-4 text-primary" />
                                                <span className="font-medium">{zone.zone_name}</span>
                                                <span className="text-xs text-muted-foreground ml-2">({zone.delivery_areas?.length || 0} مناطق فرعية)</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{Number(zone.flat_rate).toFixed(0)} د.ع</TableCell>
                                        <TableCell>
                                            {zone.free_delivery_threshold
                                                ? `${Number(zone.free_delivery_threshold).toFixed(0)} د.ع`
                                                : <span className="text-muted-foreground">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            {zone.min_order_amount && zone.min_order_amount > 0 
                                                ? `${Number(zone.min_order_amount).toFixed(0)} د.ع` 
                                                : <span className="text-muted-foreground">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            {zone.estimated_delivery_time || <span className="text-muted-foreground">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Switch checked={zone.is_active} onCheckedChange={() => handleToggleActive(zone)} />
                                        </TableCell>
                                        <TableCell className="text-left flex items-center justify-end gap-1" dir="ltr">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openCreateArea(zone)}
                                                className="rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500"
                                            >
                                                <Plus className="w-4 h-4 mr-1" /> Add Area
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => openEditZone(zone)} className="rounded-lg hover:bg-primary/10 hover:text-primary">
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteZone(zone.id)} className="rounded-lg hover:bg-destructive/10 hover:text-destructive">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                    {expandedZones[zone.id] && zone.delivery_areas && zone.delivery_areas.length > 0 && (
                                        <TableRow className="bg-secondary/10 hover:bg-secondary/10">
                                            <TableCell colSpan={5} className="p-0 border-b border-border/20">
                                                <div className="p-4 pl-14">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {zone.delivery_areas.map(area => (
                                                            <div key={area.id} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/30">
                                                                <span className="text-sm">{area.area_name}</span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                    onClick={() => handleDeleteArea(area.id)}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
