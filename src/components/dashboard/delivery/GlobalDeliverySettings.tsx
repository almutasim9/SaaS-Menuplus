import React, { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Gift, MapPin } from "lucide-react";
import { toast } from "sonner";
import { 
    useToggleFreeDeliveryMutation, 
    useToggleOutOfZoneOrdersMutation 
} from "@/lib/hooks/useDeliveryZones";

interface GlobalDeliverySettingsProps {
    restaurantId: string | null;
    isFreeDelivery: boolean;
    acceptOutOfZone: boolean;
    outOfZoneMinOrderInitial: number;
}

export const GlobalDeliverySettings: React.FC<GlobalDeliverySettingsProps> = ({
    restaurantId,
    isFreeDelivery,
    acceptOutOfZone,
    outOfZoneMinOrderInitial,
}) => {
    const toggleFreeMutation = useToggleFreeDeliveryMutation();
    const toggleOutOfZoneMutation = useToggleOutOfZoneOrdersMutation();

    const [outOfZoneMinOrder, setOutOfZoneMinOrder] = useState<string>(outOfZoneMinOrderInitial.toString());

    useEffect(() => {
        setOutOfZoneMinOrder(outOfZoneMinOrderInitial.toString());
    }, [outOfZoneMinOrderInitial]);

    const handleToggleFreeDelivery = async () => {
        if (!restaurantId) return;
        const newValue = !isFreeDelivery;
        try {
            await toggleFreeMutation.mutateAsync({ restaurantId, isFree: newValue });
            toast.success(newValue ? 'تم تفعيل التوصيل المجاني للمناطق المفعّلة' : 'تم إلغاء التوصيل المجاني');
        } catch {
            toast.error('فشل في تحديث إعداد التوصيل');
        }
    };

    const handleToggleOutOfZone = async () => {
        if (!restaurantId) return;
        const newValue = !acceptOutOfZone;
        try {
            await toggleOutOfZoneMutation.mutateAsync({ 
                restaurantId, 
                accept: newValue,
                minOrder: parseFloat(outOfZoneMinOrder) || 0
            });
            toast.success(newValue ? 'تم تفعيل استقبال الطلبات من خارج الزونات' : 'تم إلغاء تفعيل استقبال الطلبات من خارج الزونات');
        } catch {
            toast.error('فشل في تحديث الإعداد');
        }
    };

    const handleSaveOutOfZoneMinOrder = async () => {
        if (!restaurantId) return;
        try {
            await toggleOutOfZoneMutation.mutateAsync({ 
                restaurantId, 
                accept: acceptOutOfZone,
                minOrder: parseFloat(outOfZoneMinOrder) || 0
            });
            toast.success('تم تحديث الحد الأدنى للطلب خارج الزون');
        } catch {
            toast.error('فشل في الحفظ');
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* FREE DELIVERY BANNER */}
            <div className={`glass-card rounded-2xl p-5 border-2 transition-colors ${isFreeDelivery ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border/50'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isFreeDelivery ? 'bg-emerald-500/20 text-emerald-500' : 'bg-secondary/50 text-muted-foreground'}`}>
                            <Gift className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold">توصيل مجاني لداخل الزونات</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {isFreeDelivery
                                    ? 'مفعّل — التوصيل مجاني حصراً للمناطق المضافة للزونات'
                                    : 'عند التفعيل سيصبح التوصيل مجانياً للمناطق المشمولة فقط'}
                            </p>
                        </div>
                    </div>
                    <Switch checked={isFreeDelivery} onCheckedChange={handleToggleFreeDelivery} />
                </div>
            </div>

            {/* OUT OF ZONE BANNER */}
            <div className={`glass-card rounded-2xl p-5 border-2 transition-colors ${acceptOutOfZone ? 'border-amber-500/50 bg-amber-500/5' : 'border-border/50'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${acceptOutOfZone ? 'bg-amber-500/20 text-amber-500' : 'bg-secondary/50 text-muted-foreground'}`}>
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold">استقبال طلبات من خارج الزونات</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {acceptOutOfZone
                                    ? 'مفعّل — يمكن للزبائن الطلب من أي منطقة في الدليل'
                                    : 'سيتم حصر الطلب بالمناطق المضافة لزونات التوصيل فقط'}
                            </p>
                        </div>
                    </div>
                    <Switch checked={acceptOutOfZone} onCheckedChange={handleToggleOutOfZone} />
                </div>

                {acceptOutOfZone && (
                    <div className="mt-4 pt-4 border-t border-amber-500/20 space-y-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">الحد الأدنى للطلب (Off-Zone Min Order)</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={outOfZoneMinOrder}
                                    onChange={(e) => setOutOfZoneMinOrder(e.target.value)}
                                    className="flex-1 h-10 px-3 rounded-xl bg-background border border-border/50 focus:outline-none focus:border-amber-500/50"
                                    placeholder="0"
                                />
                                <Button 
                                    onClick={handleSaveOutOfZoneMinOrder}
                                    className="h-10 px-4 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                                    disabled={toggleOutOfZoneMutation.isPending}
                                >
                                    حفظ
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
