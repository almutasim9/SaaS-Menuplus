"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCreateDeliveryZoneMutation, useUpdateDeliveryZoneMutation, type ZoneWithAreas } from "@/lib/hooks/useDeliveryZones";

interface ZoneFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    restaurantId: string | null;
    editingZone: ZoneWithAreas | null;
}

export function ZoneFormModal({ open, onOpenChange, restaurantId, editingZone }: ZoneFormModalProps) {
    const [zoneName, setZoneName] = useState("");
    const [flatRate, setFlatRate] = useState("");
    const [freeThreshold, setFreeThreshold] = useState("");

    const createMutation = useCreateDeliveryZoneMutation();
    const updateMutation = useUpdateDeliveryZoneMutation();

    useEffect(() => {
        if (open) {
            if (editingZone) {
                setZoneName(editingZone.zone_name);
                setFlatRate(editingZone.flat_rate.toString());
                setFreeThreshold(editingZone.free_delivery_threshold?.toString() || "");
            } else {
                setZoneName("");
                setFlatRate("");
                setFreeThreshold("");
            }
        }
    }, [open, editingZone]);

    const handleSave = async () => {
        if (!restaurantId || !zoneName.trim()) return;

        try {
            if (editingZone) {
                await updateMutation.mutateAsync({
                    id: editingZone.id,
                    zoneName,
                    flatRate: parseFloat(flatRate) || 0,
                    freeThreshold: freeThreshold ? parseFloat(freeThreshold) : undefined,
                    isActive: editingZone.is_active
                });
                toast.success("تم تحديث المنطقة بنجاح");
            } else {
                await createMutation.mutateAsync({
                    restaurantId,
                    zoneName,
                    flatRate: parseFloat(flatRate) || 0,
                    freeThreshold: freeThreshold ? parseFloat(freeThreshold) : undefined
                });
                toast.success("تمت إضافة المنطقة بنجاح");
            }
            onOpenChange(false);
        } catch (error) {
            console.error("Delivery Zone Error:", error);
            toast.error("حدث خطأ أثناء حفظ المنطقة");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glass-card border-border/50 rounded-2xl">
                <DialogHeader>
                    <DialogTitle>{editingZone ? "تعديل المنطقة" : "إضافة منطقة توصيل جديدة"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4 text-right" dir="auto">
                    <div className="space-y-2">
                        <Label>اسم المنطقة (Zone Name)</Label>
                        <Input value={zoneName} onChange={(e) => setZoneName(e.target.value)} placeholder="مثال: المنصور" className="rounded-xl bg-secondary/50" />
                    </div>
                    <div className="space-y-2">
                        <Label>سعر التوصيل (Flat Rate د.ع)</Label>
                        <Input type="number" step="0.01" value={flatRate} onChange={(e) => setFlatRate(e.target.value)} placeholder="5000" className="rounded-xl bg-secondary/50" />
                    </div>
                    <div className="space-y-2">
                        <Label>الحد الأدنى للتوصيل المجاني (Free Threshold د.ع)</Label>
                        <Input type="number" step="0.01" value={freeThreshold} onChange={(e) => setFreeThreshold(e.target.value)} placeholder="اختياري (Optional)" className="rounded-xl bg-secondary/50" />
                        <p className="text-xs text-muted-foreground">اتركه فارغاً إذا لم يكن هناك خيار توصيل مجاني</p>
                    </div>
                    <Button 
                        onClick={handleSave} 
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="w-full gradient-emerald text-white rounded-xl"
                    >
                        {editingZone ? "تحديث (Update)" : "إضافة (Create)"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
