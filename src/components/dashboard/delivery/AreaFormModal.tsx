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
import { useCreateDeliveryAreaMutation, type ZoneWithAreas } from "@/lib/hooks/useDeliveryZones";

interface AreaFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    zone: ZoneWithAreas | null;
}

export function AreaFormModal({ open, onOpenChange, zone }: AreaFormModalProps) {
    const [areaName, setAreaName] = useState("");
    const createAreaMutation = useCreateDeliveryAreaMutation();

    useEffect(() => {
        if (open) {
            setAreaName("");
        }
    }, [open]);

    const handleSaveArea = async () => {
        if (!zone || !areaName.trim()) return;

        if (zone.delivery_areas?.some(a => a.area_name.trim().toLowerCase() === areaName.trim().toLowerCase())) {
            toast.error("هذه المنطقة الفرعية مضافة مسبقاً");
            return;
        }

        try {
            await createAreaMutation.mutateAsync({
                zoneId: zone.id,
                areaName
            });
            toast.success("تمت إضافة المنطقة الفرعية بنجاح");
            onOpenChange(false);
        } catch (error) {
            console.error("Add Area Error:", error);
            toast.error("حدث خطأ أثناء إضافة المنطقة الفرعية");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glass-card border-border/50 rounded-2xl">
                <DialogHeader>
                    <DialogTitle>إضافة منطقة فرعية إلى (Add Area for) {zone?.zone_name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4 text-right" dir="auto">
                    <div className="space-y-2">
                        <Label>اسم المنطقة الفرعية (Area Name)</Label>
                        <Input value={areaName} onChange={(e) => setAreaName(e.target.value)} placeholder="مثال: محلة ١٠٢" className="rounded-xl bg-secondary/50" />
                    </div>
                    <Button 
                        onClick={handleSaveArea} 
                        disabled={createAreaMutation.isPending}
                        className="w-full gradient-emerald text-white rounded-xl"
                    >
                        إضافة منطقة فرعية (Add Area)
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
