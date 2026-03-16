"use client";

import { useState, useEffect, useRef } from "react";
import {
    getMasterGovernoratesWithCount, getLocationsByGovernorate,
    addGovernorate, addLocation, deleteGovernorate, deleteLocation,
} from "@/lib/actions/admin";
import {
    MapPin, Plus, Trash2, ChevronDown, ChevronRight,
    Search, RefreshCw, Loader2, X,
} from "lucide-react";
import { toast } from "sonner";

type Governorate = { id: string; name_ar: string; locationCount: number };
type Location = { id: string; governorate_id: string; name_ar: string; city_name_ar?: string };

export default function LocationsPage() {
    const [governorates, setGovernorates] = useState<Governorate[]>([]);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [locationsByGov, setLocationsByGov] = useState<Record<string, Location[]>>({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Add Governorate
    const [showAddGov, setShowAddGov] = useState(false);
    const [newGovName, setNewGovName] = useState("");
    const [addingGov, setAddingGov] = useState(false);

    // Add Location
    const [addingLocFor, setAddingLocFor] = useState<string | null>(null);
    const [newLocName, setNewLocName] = useState("");
    const [newLocCity, setNewLocCity] = useState("");
    const [addingLoc, setAddingLoc] = useState(false);

    const load = async () => {
        setLoading(true);
        const data = await getMasterGovernoratesWithCount();
        setGovernorates(data);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const toggleExpand = async (govId: string) => {
        if (expanded === govId) { setExpanded(null); return; }
        setExpanded(govId);
        if (!locationsByGov[govId]) {
            const locs = await getLocationsByGovernorate(govId);
            setLocationsByGov(prev => ({ ...prev, [govId]: locs as Location[] }));
        }
    };

    const handleAddGovernorate = async () => {
        if (!newGovName.trim()) { toast.error("أدخل اسم المحافظة"); return; }
        setAddingGov(true);
        const result = await addGovernorate(newGovName.trim());
        if (result.error) { toast.error(result.error); }
        else { toast.success("تم إضافة المحافظة"); setNewGovName(""); setShowAddGov(false); await load(); }
        setAddingGov(false);
    };

    const handleDeleteGovernorate = async (id: string, name: string) => {
        if (!confirm(`هل أنت متأكد من حذف محافظة "${name}" وجميع مناطقها؟`)) return;
        const result = await deleteGovernorate(id);
        if (result.error) { toast.error(result.error); }
        else { toast.success("تم الحذف"); await load(); setExpanded(null); }
    };

    const handleAddLocation = async (govId: string) => {
        if (!newLocName.trim()) { toast.error("أدخل اسم المنطقة"); return; }
        setAddingLoc(true);
        const result = await addLocation({ governorate_id: govId, name_ar: newLocName.trim(), city_name_ar: newLocCity.trim() || undefined });
        if (result.error) { toast.error(result.error); }
        else {
            toast.success("تم إضافة المنطقة");
            setNewLocName(""); setNewLocCity(""); setAddingLocFor(null);
            const updated = await getLocationsByGovernorate(govId);
            setLocationsByGov(prev => ({ ...prev, [govId]: updated as Location[] }));
            setGovernorates(prev => prev.map(g => g.id === govId ? { ...g, locationCount: g.locationCount + 1 } : g));
        }
        setAddingLoc(false);
    };

    const handleDeleteLocation = async (govId: string, locId: string) => {
        const result = await deleteLocation(locId);
        if (result.error) { toast.error(result.error); return; }
        toast.success("تم الحذف");
        setLocationsByGov(prev => ({ ...prev, [govId]: prev[govId]?.filter(l => l.id !== locId) || [] }));
        setGovernorates(prev => prev.map(g => g.id === govId ? { ...g, locationCount: Math.max(0, g.locationCount - 1) } : g));
    };

    const filtered = governorates.filter(g =>
        !search || g.name_ar.includes(search)
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <MapPin className="w-7 h-7" />
                        إدارة المواقع
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {governorates.length} محافظة — {governorates.reduce((s, g) => s + g.locationCount, 0)} منطقة
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={load} className="h-10 px-4 rounded-xl bg-secondary/50 hover:bg-secondary/80 border border-border/40 text-sm font-medium flex items-center gap-2 transition-colors">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setShowAddGov(!showAddGov)}
                        className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        إضافة محافظة
                    </button>
                </div>
            </div>

            {/* Add Governorate Form */}
            {showAddGov && (
                <div className="glass-card rounded-2xl p-5 border border-border/40 flex items-center gap-3">
                    <input
                        autoFocus
                        value={newGovName}
                        onChange={e => setNewGovName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleAddGovernorate(); if (e.key === "Escape") setShowAddGov(false); }}
                        placeholder="اسم المحافظة بالعربي (مثل: بغداد)"
                        className="flex-1 h-11 px-4 rounded-xl bg-secondary/30 border border-border/40 text-sm focus:outline-none focus:border-primary/50"
                    />
                    <button onClick={handleAddGovernorate} disabled={addingGov} className="h-11 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm disabled:opacity-50 flex items-center gap-2">
                        {addingGov ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        إضافة
                    </button>
                    <button onClick={() => setShowAddGov(false)} className="h-11 w-11 rounded-xl border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="ابحث عن محافظة..."
                    className="w-full h-11 pr-10 pl-4 rounded-xl bg-secondary/30 border border-border/40 text-sm focus:outline-none focus:border-primary/50"
                />
            </div>

            {/* Governorates List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-secondary/30 rounded-2xl animate-pulse" />)}
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(gov => (
                        <div key={gov.id} className="glass-card rounded-2xl border border-border/40 overflow-hidden">
                            {/* Governorate Row */}
                            <div className="flex items-center justify-between px-5 py-4 hover:bg-secondary/20 transition-colors">
                                <button
                                    onClick={() => toggleExpand(gov.id)}
                                    className="flex items-center gap-3 flex-1 text-right"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <MapPin className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{gov.name_ar}</p>
                                        <p className="text-xs text-muted-foreground">{gov.locationCount} منطقة</p>
                                    </div>
                                    <div className="mr-auto">
                                        {expanded === gov.id
                                            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                            : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                    </div>
                                </button>
                                <div className="flex items-center gap-2 mr-3">
                                    <button
                                        onClick={() => { setAddingLocFor(gov.id); setExpanded(gov.id); }}
                                        className="h-8 px-3 rounded-lg bg-secondary/40 hover:bg-secondary/70 text-xs flex items-center gap-1 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                        منطقة
                                    </button>
                                    <button
                                        onClick={() => handleDeleteGovernorate(gov.id, gov.name_ar)}
                                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Locations */}
                            {expanded === gov.id && (
                                <div className="border-t border-border/20 px-5 py-4 space-y-2 bg-secondary/5">
                                    {/* Add Location Form */}
                                    {addingLocFor === gov.id && (
                                        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-secondary/30 border border-border/30">
                                            <input
                                                autoFocus
                                                value={newLocName}
                                                onChange={e => setNewLocName(e.target.value)}
                                                placeholder="اسم المنطقة *"
                                                className="flex-1 h-9 px-3 rounded-lg bg-secondary/40 border border-border/30 text-sm focus:outline-none focus:border-primary/50"
                                            />
                                            <input
                                                value={newLocCity}
                                                onChange={e => setNewLocCity(e.target.value)}
                                                placeholder="المدينة (اختياري)"
                                                className="flex-1 h-9 px-3 rounded-lg bg-secondary/40 border border-border/30 text-sm focus:outline-none focus:border-primary/50"
                                            />
                                            <button
                                                onClick={() => handleAddLocation(gov.id)}
                                                disabled={addingLoc}
                                                className="h-9 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
                                            >
                                                {addingLoc ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                                حفظ
                                            </button>
                                            <button onClick={() => setAddingLocFor(null)} className="h-9 w-9 rounded-lg border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Locations Grid */}
                                    {locationsByGov[gov.id] ? (
                                        locationsByGov[gov.id].length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                {locationsByGov[gov.id].map(loc => (
                                                    <div key={loc.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/30 border border-border/10 group">
                                                        <div>
                                                            <p className="text-xs font-medium">{loc.name_ar}</p>
                                                            {loc.city_name_ar && <p className="text-[10px] text-muted-foreground">{loc.city_name_ar}</p>}
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteLocation(gov.id, loc.id)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-red-400 hover:bg-red-500/10 transition-all"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground text-center py-4 italic">لا توجد مناطق — أضف منطقة أعلاه</p>
                                        )
                                    ) : (
                                        <div className="flex justify-center py-4">
                                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">{search ? "لا توجد نتائج." : "لا توجد محافظات — أضف محافظة أعلاه."}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
