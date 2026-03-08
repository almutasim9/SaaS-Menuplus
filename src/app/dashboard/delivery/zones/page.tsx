"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import { getDeliveryZones, createDeliveryZone, updateDeliveryZone, deleteDeliveryZone, createDeliveryArea, deleteDeliveryArea, toggleFreeDelivery } from "@/lib/actions/delivery";
import { Plus, Pencil, Trash2, Truck, MapPin, ChevronDown, ChevronRight, Gift } from "lucide-react";
import { toast } from "sonner";
import type { DeliveryZone, DeliveryArea } from "@/lib/types/database.types";

interface ZoneWithAreas extends DeliveryZone {
    delivery_areas: DeliveryArea[];
}

export default function DeliveryZonesPage() {
    const [zones, setZones] = useState<ZoneWithAreas[]>([]);
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [areaDialogOpen, setAreaDialogOpen] = useState(false);
    const [editingZone, setEditingZone] = useState<ZoneWithAreas | null>(null);
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
    const [zoneName, setZoneName] = useState("");
    const [flatRate, setFlatRate] = useState("");
    const [freeThreshold, setFreeThreshold] = useState("");
    const [areaName, setAreaName] = useState("");
    const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>({});
    const [isFreeDelivery, setIsFreeDelivery] = useState(false);

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
                const zonesData = await getDeliveryZones(profile.restaurant_id);
                setZones(zonesData as ZoneWithAreas[]);
                // Load free delivery setting
                const { data: rest } = await supabase
                    .from('restaurants')
                    .select('is_free_delivery')
                    .eq('id', profile.restaurant_id)
                    .single();
                if (rest) setIsFreeDelivery(rest.is_free_delivery ?? false);
            }
            setLoading(false);
        }
        load();
    }, []);

    const handleSave = async () => {
        if (!restaurantId || !zoneName.trim()) return;

        try {
            if (editingZone) {
                const updated = await updateDeliveryZone(
                    editingZone.id,
                    zoneName,
                    parseFloat(flatRate) || 0,
                    freeThreshold ? parseFloat(freeThreshold) : undefined,
                    editingZone.is_active
                );
                setZones(zones.map((z) => (z.id === updated.id ? updated : z)));
                toast.success("Zone updated");
            } else {
                const created = await createDeliveryZone(
                    restaurantId,
                    zoneName,
                    parseFloat(flatRate) || 0,
                    freeThreshold ? parseFloat(freeThreshold) : undefined
                );
                setZones([...zones, created]);
                toast.success("Zone created");
            }
            setDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error("Delivery Zone Error:", error);
            toast.error("Something went wrong, please check console");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteDeliveryZone(id);
            setZones(zones.filter((z) => z.id !== id));
            toast.success("Zone deleted");
        } catch {
            toast.error("Failed to delete");
        }
    };

    const handleSaveArea = async () => {
        if (!selectedZoneId || !areaName.trim()) return;
        // Check for duplicates
        const zone = zones.find(z => z.id === selectedZoneId);
        if (zone?.delivery_areas?.some(a => a.area_name.trim().toLowerCase() === areaName.trim().toLowerCase())) {
            toast.error("هذه المنطقة مضافة مسبقاً");
            return;
        }
        try {
            const newArea = await createDeliveryArea(selectedZoneId, areaName);
            setZones(zones.map(z =>
                z.id === selectedZoneId
                    ? { ...z, delivery_areas: [...(z.delivery_areas || []), newArea] }
                    : z
            ));
            toast.success("Area added");
            setAreaDialogOpen(false);
            setAreaName("");
        } catch (error) {
            console.error("Add Area Error:", error);
            toast.error("Failed to add area, check console");
        }
    };

    const handleDeleteArea = async (zoneId: string, areaId: string) => {
        try {
            await deleteDeliveryArea(areaId);
            setZones(zones.map(z =>
                z.id === zoneId
                    ? { ...z, delivery_areas: z.delivery_areas.filter(a => a.id !== areaId) }
                    : z
            ));
            toast.success("Area deleted");
        } catch (error) {
            console.error("Delete Area Error:", error);
            toast.error("Failed to delete area");
        }
    };

    const handleToggleActive = async (zone: ZoneWithAreas) => {
        try {
            const updated = await updateDeliveryZone(
                zone.id,
                zone.zone_name,
                zone.flat_rate,
                zone.free_delivery_threshold || undefined,
                !zone.is_active
            );
            setZones(zones.map((z) => (z.id === updated.id ? updated : z)));
        } catch {
            toast.error("Failed to update");
        }
    };

    const handleToggleFreeDelivery = async () => {
        if (!restaurantId) return;
        const newValue = !isFreeDelivery;
        try {
            await toggleFreeDelivery(restaurantId, newValue);
            setIsFreeDelivery(newValue);
            toast.success(newValue ? 'تم تفعيل التوصيل المجاني لجميع الطلبات' : 'تم إلغاء التوصيل المجاني');
        } catch {
            toast.error('فشل في تحديث إعداد التوصيل');
        }
    };

    const openEdit = (zone: ZoneWithAreas) => {
        setEditingZone(zone);
        setZoneName(zone.zone_name);
        setFlatRate(zone.flat_rate.toString());
        setFreeThreshold(zone.free_delivery_threshold?.toString() || "");
        setDialogOpen(true);
    };

    const resetForm = () => {
        setEditingZone(null);
        setZoneName("");
        setFlatRate("");
        setFreeThreshold("");
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
            {/* FREE DELIVERY BANNER */}
            <div className={`glass-card rounded-2xl p-5 border-2 transition-colors ${isFreeDelivery ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border/50'
                }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isFreeDelivery ? 'bg-emerald-500/20 text-emerald-500' : 'bg-secondary/50 text-muted-foreground'
                            }`}>
                            <Gift className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold">توصيل مجاني لجميع الطلبات</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {isFreeDelivery
                                    ? 'مفعّل — سيتم تجاهل أسعار التوصيل لجميع المناطق'
                                    : 'عند التفعيل سيتم التوصيل مجاناً بغض النظر عن المنطقة'}
                            </p>
                        </div>
                    </div>
                    <Switch checked={isFreeDelivery} onCheckedChange={handleToggleFreeDelivery} />
                </div>
                {isFreeDelivery && (
                    <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 text-xs text-emerald-600 font-medium">
                        🚚 التوصيل المجاني مفعّل حالياً — يظهر للزبائن في الواجهة
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Delivery Management</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Set up delivery zones and rates
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="gradient-emerald text-white rounded-xl gap-2 hover:opacity-90">
                            <Plus className="w-4 h-4" />
                            Add Zone
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-border/50 rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingZone ? "Edit Zone" : "New Delivery Zone"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Zone Name</Label>
                                <Input value={zoneName} onChange={(e) => setZoneName(e.target.value)} placeholder="e.g., Downtown" className="rounded-xl bg-secondary/50" />
                            </div>
                            <div className="space-y-2">
                                <Label>Flat Rate (د.ع)</Label>
                                <Input type="number" step="0.01" value={flatRate} onChange={(e) => setFlatRate(e.target.value)} placeholder="5.00" className="rounded-xl bg-secondary/50" />
                            </div>
                            <div className="space-y-2">
                                <Label>Free Delivery Threshold (د.ع)</Label>
                                <Input type="number" step="0.01" value={freeThreshold} onChange={(e) => setFreeThreshold(e.target.value)} placeholder="Optional" className="rounded-xl bg-secondary/50" />
                                <p className="text-xs text-muted-foreground">Leave empty for no free delivery option</p>
                            </div>
                            <Button onClick={handleSave} className="w-full gradient-emerald text-white rounded-xl">
                                {editingZone ? "Update" : "Create"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Area Add Dialog */}
                <Dialog open={areaDialogOpen} onOpenChange={(open) => { setAreaDialogOpen(open); if (!open) setAreaName(""); }}>
                    <DialogContent className="glass-card border-border/50 rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>Add Delivery Area</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Area Name</Label>
                                <Input value={areaName} onChange={(e) => setAreaName(e.target.value)} placeholder="e.g., Block 5" className="rounded-xl bg-secondary/50" />
                            </div>
                            <Button onClick={handleSaveArea} className="w-full gradient-emerald text-white rounded-xl">
                                Add Area
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {zones.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                    <Truck className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No delivery zones</h3>
                    <p className="text-sm text-muted-foreground">
                        Set up your first delivery zone to start accepting orders
                    </p>
                </div>
            ) : (
                <div className="glass-card rounded-2xl overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border/30 hover:bg-transparent">
                                <TableHead>Zone</TableHead>
                                <TableHead>Flat Rate</TableHead>
                                <TableHead>Free Threshold</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
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
                                                <span className="text-xs text-muted-foreground ml-2">({zone.delivery_areas?.length || 0} areas)</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{Number(zone.flat_rate).toFixed(0)} د.ع</TableCell>
                                        <TableCell>
                                            {zone.free_delivery_threshold
                                                ? `${Number(zone.free_delivery_threshold).toFixed(0)} د.ع`
                                                : <span className="text-muted-foreground">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Switch checked={zone.is_active} onCheckedChange={() => handleToggleActive(zone)} />
                                        </TableCell>
                                        <TableCell className="text-right flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => { setSelectedZoneId(zone.id); setAreaDialogOpen(true); }}
                                                className="rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500"
                                            >
                                                <Plus className="w-4 h-4 mr-1" /> Add Area
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(zone)} className="rounded-lg hover:bg-primary/10 hover:text-primary">
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(zone.id)} className="rounded-lg hover:bg-destructive/10 hover:text-destructive">
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
                                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2"
                                                                    onClick={() => handleDeleteArea(zone.id, area.id)}
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
