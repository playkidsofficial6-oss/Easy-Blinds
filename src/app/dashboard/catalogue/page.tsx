"use client";

import { useState, useMemo } from "react";
import {
    Plus,
    Search,
    Trash2,
    Edit2,
    PlusCircle,
    Package,
    BookOpen,
    Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useCatalogue, SupplierGroup, CatalogueGroup, FabricEntry } from "@/lib/catalogue-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CataloguePage() {
    const { suppliers, addSupplier, addCatalogue, toggleCatalogueStatus, addFabric, updateFabric, toggleFabricStatus, removeFabric, isLoaded } = useCatalogue();
    const [search, setSearch] = useState("");
    const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
    const [isAddCatalogueOpen, setIsAddCatalogueOpen] = useState(false);
    const [isAddFabricOpen, setIsAddFabricOpen] = useState(false);
    const [isEditFabricOpen, setIsEditFabricOpen] = useState(false);

    const [selectedSupplierId, setSelectedSupplierId] = useState("");
    const [selectedCatalogueId, setSelectedCatalogueId] = useState("");
    const [editingFabric, setEditingFabric] = useState<{ sid: string, cid: string, fabric: FabricEntry } | null>(null);

    // Form States
    const [newSupplierName, setNewSupplierName] = useState("");
    const [newCatalogueNumber, setNewCatalogueNumber] = useState("");
    const [newFabric, setNewFabric] = useState<Omit<FabricEntry, "id" | "createdAt">>({
        fabricCode: "",
        material: "",
        width: 0,
        price: 0,
    });

    const filteredSuppliers = useMemo(() => {
        if (!search) return suppliers;
        const lowSearch = search.toLowerCase();
        return suppliers.map(s => {
            const supplierMatches = s.supplierName.toLowerCase().includes(lowSearch);
            const filteredCatalogues = s.catalogues.map(c => {
                const catalogueMatches = c.catalogueNumber.toLowerCase().includes(lowSearch);
                const filteredFabrics = c.fabrics.filter(f =>
                    f.fabricCode.toLowerCase().includes(lowSearch) ||
                    (f.material && f.material.toLowerCase().includes(lowSearch))
                );
                if (catalogueMatches || filteredFabrics.length > 0) {
                    return { ...c, fabrics: catalogueMatches ? c.fabrics : filteredFabrics };
                }
                return null;
            }).filter(Boolean) as CatalogueGroup[];

            if (supplierMatches || filteredCatalogues.length > 0) {
                return { ...s, catalogues: supplierMatches ? s.catalogues : filteredCatalogues };
            }
            return null;
        }).filter(Boolean) as SupplierGroup[];
    }, [suppliers, search]);

    const handleAddSupplier = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSupplierName) return toast.error("Supplier name is required");
        addSupplier(newSupplierName);
        setNewSupplierName("");
        setIsAddSupplierOpen(false);
        toast.success("Supplier registered");
    };

    const handleAddCatalogue = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatalogueNumber) return toast.error("Catalogue number is required");
        addCatalogue(selectedSupplierId, newCatalogueNumber);
        setNewCatalogueNumber("");
        setIsAddCatalogueOpen(false);
        toast.success("Catalogue added");
    };

    const handleAddFabric = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFabric.fabricCode) return toast.error("Fabric code is required");
        addFabric(selectedSupplierId, selectedCatalogueId, newFabric);
        setNewFabric({ fabricCode: "", material: "", width: 0, price: 0 });
        setIsAddFabricOpen(false);
        toast.success("Fabric added to catalogue");
    };

    const handleEditFabric = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingFabric) return;
        updateFabric(editingFabric.sid, editingFabric.cid, editingFabric.fabric.id, editingFabric.fabric);
        setIsEditFabricOpen(false);
        setEditingFabric(null);
        toast.success("Fabric updated");
    };

    const getPriceRange = (fabrics: FabricEntry[]) => {
        if (fabrics.length === 0) return null;
        const prices = fabrics.map(f => f.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        if (min === max) return `AED ${min.toFixed(2)}`;
        return `AED ${min.toFixed(2)} — ${max.toFixed(2)}`;
    };

    if (!isLoaded) return <div className="p-12 text-center text-neutral-500">Loading catalogues...</div>;

    const supplierColors: Record<string, string> = {
        'Al-Futtaim Fabrics': 'text-amber-600',
        'Seddar Home': 'text-blue-600',
        'Elite Drapery': 'text-purple-600',
        'Global Textiles': 'text-emerald-600',
        'Dubai Curtains': 'text-rose-600',
    };

    const getSupplierStyle = (name: string) => {
        return supplierColors[name] || 'text-neutral-600';
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-black">
                        <span>Operations</span>
                        <div className="w-10 h-[1px] bg-amber-600"></div>
                        <span className="text-amber-600/80">Hierarchical Database</span>
                    </div>
                    <h1 className="text-6xl font-light tracking-tighter text-neutral-900 leading-[0.9]">
                        Fabric
                        <span className="block font-medium text-amber-600">Catalogues</span>
                    </h1>
                </div>

                <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-neutral-900 text-white hover:bg-neutral-800 h-16 px-10 rounded-xl flex items-center gap-4 shadow-2xl shadow-neutral-900/10 active:scale-[0.98] transition-all">
                            <PlusCircle className="w-6 h-6 text-amber-500" />
                            <span className="font-bold uppercase tracking-widest text-xs">Register Supplier</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-106.25">
                        <DialogHeader>
                            <DialogTitle>Register New Supplier</DialogTitle>
                            <DialogDescription>Add a new primary supplier to the database.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddSupplier} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Supplier Name</label>
                                <Input
                                    value={newSupplierName}
                                    onChange={(e) => setNewSupplierName(e.target.value)}
                                    placeholder="e.g. Al-Futtaim"
                                />
                            </div>
                            <Button type="submit" className="w-full bg-neutral-900">Save Supplier</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <Input
                    placeholder="Search by supplier, catalogue number or fabric code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-12 h-14 rounded-2xl border-neutral-200 bg-white shadow-sm text-lg font-light"
                />
            </div>

            <div className="space-y-12">
                {filteredSuppliers.map((supplier: SupplierGroup) => (
                    <div key={supplier.id} className="space-y-6">
                        <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-2 h-2 rounded-full", getSupplierStyle(supplier.supplierName).replace('text-', 'bg-'))}></div>
                                <h2 className="text-2xl font-light tracking-tight text-neutral-900 uppercase tracking-[0.1em]">
                                    {supplier.supplierName}
                                </h2>
                                <span className="text-xs font-bold text-neutral-400 ml-2">
                                    {supplier.catalogues.length} Collections
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-lg border-neutral-200 hover:bg-neutral-50"
                                onClick={() => {
                                    setSelectedSupplierId(supplier.id);
                                    setIsAddCatalogueOpen(true);
                                }}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Add Collection
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {supplier.catalogues.map((catalogue: CatalogueGroup) => (
                                <Card key={catalogue.id} className="border-neutral-200 shadow-none overflow-hidden bg-neutral-50/30">
                                    <div className="p-4 bg-white border-b border-neutral-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-400 border border-neutral-100">
                                                <BookOpen className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Collection No.</div>
                                                <div className="text-lg font-semibold text-neutral-800">{catalogue.catalogueNumber}</div>
                                            </div>
                                            <div
                                                className={cn(
                                                    "ml-4 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95",
                                                    catalogue.isActive !== false ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                                                )}
                                                onClick={() => toggleCatalogueStatus(supplier.id, catalogue.id)}
                                            >
                                                {catalogue.isActive !== false ? "Active" : "Inactive"}
                                            </div>
                                            {catalogue.fabrics.length > 0 && (
                                                <div className="ml-4 pl-4 border-l border-neutral-100 hidden sm:block">
                                                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Price Range</div>
                                                    <div className="text-sm font-medium text-amber-600 tracking-tight">{getPriceRange(catalogue.fabrics)}</div>
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="hover:bg-amber-50 text-amber-600 font-bold text-[11px] uppercase tracking-wider"
                                            onClick={() => {
                                                setSelectedSupplierId(supplier.id);
                                                setSelectedCatalogueId(catalogue.id);
                                                setIsAddFabricOpen(true);
                                            }}
                                        >
                                            <Plus className="w-4 h-4 mr-1" /> Add Fabric
                                        </Button>
                                    </div>
                                    <CardContent className="p-0">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-neutral-50/50 border-b border-neutral-100">
                                                    <th className="p-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">Fabric Selection</th>
                                                    <th className="p-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400 text-center">Status</th>
                                                    <th className="p-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400 text-right">Width (cm)</th>
                                                    <th className="p-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400 text-right">Price / Meter</th>
                                                    <th className="p-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 bg-white">
                                                {catalogue.fabrics.length > 0 ? (
                                                    catalogue.fabrics.map((fabric: FabricEntry) => (
                                                        <tr key={fabric.id} className={cn(
                                                            "hover:bg-neutral-50/30 transition-all even:bg-neutral-50/10 group/row",
                                                            fabric.isActive === false && "opacity-60 bg-neutral-50/50"
                                                        )}>
                                                            <td className="p-4">
                                                                <div className="space-y-1">
                                                                    <div className="text-sm font-semibold text-neutral-800 tracking-tight">{fabric.fabricCode}</div>
                                                                    {fabric.material && (
                                                                        <div className="text-[10px] text-neutral-400 uppercase tracking-widest font-medium italic">{fabric.material}</div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <button
                                                                    onClick={() => toggleFabricStatus(supplier.id, catalogue.id, fabric.id)}
                                                                    className={cn(
                                                                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all active:scale-95",
                                                                        fabric.isActive !== false ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                                                                    )}
                                                                >
                                                                    {fabric.isActive !== false ? "Active" : "Inactive"}
                                                                </button>
                                                            </td>
                                                            <td className="p-4 text-sm font-light text-neutral-600 text-right tabular-nums">{fabric.width} cm</td>
                                                            <td className="p-4 text-right">
                                                                <div className="text-base font-semibold text-neutral-900 tabular-nums tracking-tight group-hover/row:text-amber-600 transition-colors">AED {fabric.price.toFixed(2)}</div>
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Button
                                                                        variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-amber-600 hover:bg-amber-50"
                                                                        title="Clone Fabric"
                                                                        onClick={() => {
                                                                            setSelectedSupplierId(supplier.id);
                                                                            setSelectedCatalogueId(catalogue.id);
                                                                            setNewFabric({
                                                                                fabricCode: `${fabric.fabricCode} (Copy)`,
                                                                                material: fabric.material,
                                                                                width: fabric.width,
                                                                                price: fabric.price
                                                                            });
                                                                            setIsAddFabricOpen(true);
                                                                        }}
                                                                    >
                                                                        <Copy className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-neutral-900"
                                                                        onClick={() => {
                                                                            setEditingFabric({ sid: supplier.id, cid: catalogue.id, fabric });
                                                                            setIsEditFabricOpen(true);
                                                                        }}
                                                                    >
                                                                        <Edit2 className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-rose-600"
                                                                        onClick={() => removeFabric(supplier.id, catalogue.id, fabric.id)}
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="p-8 text-center text-xs text-neutral-400 italic font-light">
                                                            No fabrics added to this collection.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredSuppliers.length === 0 && (
                    <div className="p-24 text-center space-y-4">
                        <Package className="w-16 h-16 text-neutral-100 mx-auto" />
                        <h3 className="text-xl font-light text-neutral-400">No matches found for "{search}"</h3>
                        <Button variant="outline" onClick={() => setSearch("")}>Clear Search</Button>
                    </div>
                )}
            </div>

            {/* Management Dialogs */}

            <Dialog open={isAddCatalogueOpen} onOpenChange={setIsAddCatalogueOpen}>
                <DialogContent className="sm:max-w-106.25">
                    <DialogHeader>
                        <DialogTitle>Add Collection</DialogTitle>
                        <DialogDescription>Create a new collection for this supplier.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddCatalogue} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Catalogue / Collection Number</label>
                            <Input
                                value={newCatalogueNumber}
                                onChange={(e) => setNewCatalogueNumber(e.target.value)}
                                placeholder="e.g. CAT-2024-X"
                            />
                        </div>
                        <Button type="submit" className="w-full bg-neutral-900">Add Collection</Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddFabricOpen} onOpenChange={setIsAddFabricOpen}>
                <DialogContent className="sm:max-w-106.25">
                    <DialogHeader>
                        <DialogTitle>Add Fabric Variant</DialogTitle>
                        <DialogDescription>Add a new fabric/color code to this collection.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddFabric} className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Fabric/Color Code</label>
                                <Input value={newFabric.fabricCode} onChange={(e) => setNewFabric({ ...newFabric, fabricCode: e.target.value })} placeholder="e.g. SLV-001" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Material/Type</label>
                                <Input value={newFabric.material} onChange={(e) => setNewFabric({ ...newFabric, material: e.target.value })} placeholder="e.g. Velvet" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">Width (cm)</label>
                                <Input type="number" value={newFabric.width} onChange={(e) => setNewFabric({ ...newFabric, width: parseInt(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">Price (AED)</label>
                                <Input type="number" value={newFabric.price} onChange={(e) => setNewFabric({ ...newFabric, price: parseFloat(e.target.value) })} />
                            </div>
                        </div>
                        <Button type="submit" className="w-full bg-neutral-900">Add Fabric</Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditFabricOpen} onOpenChange={setIsEditFabricOpen}>
                <DialogContent className="sm:max-w-106.25">
                    <DialogHeader>
                        <DialogTitle>Edit Fabric Variant</DialogTitle>
                        <DialogDescription>Update fabric details for this collection.</DialogDescription>
                    </DialogHeader>
                    {editingFabric && (
                        <form onSubmit={handleEditFabric} className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Fabric/Color Code</label>
                                    <Input
                                        value={editingFabric.fabric.fabricCode}
                                        onChange={(e) => setEditingFabric({
                                            ...editingFabric,
                                            fabric: { ...editingFabric.fabric, fabricCode: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">Material/Type</label>
                                    <Input
                                        value={editingFabric.fabric.material || ""}
                                        onChange={(e) => setEditingFabric({
                                            ...editingFabric,
                                            fabric: { ...editingFabric.fabric, material: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">Width (cm)</label>
                                    <Input
                                        type="number"
                                        value={editingFabric.fabric.width}
                                        onChange={(e) => setEditingFabric({
                                            ...editingFabric,
                                            fabric: { ...editingFabric.fabric, width: parseInt(e.target.value) }
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">Price (AED)</label>
                                    <Input
                                        type="number"
                                        value={editingFabric.fabric.price}
                                        onChange={(e) => setEditingFabric({
                                            ...editingFabric,
                                            fabric: { ...editingFabric.fabric, price: parseFloat(e.target.value) }
                                        })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">Status</label>
                                <div className="flex items-center h-10 gap-2">
                                    <Button
                                        type="button"
                                        variant={editingFabric.fabric.isActive !== false ? "default" : "outline"}
                                        size="sm"
                                        className={cn("flex-1", editingFabric.fabric.isActive !== false ? "bg-emerald-600 hover:bg-emerald-700" : "")}
                                        onClick={() => setEditingFabric({
                                            ...editingFabric,
                                            fabric: { ...editingFabric.fabric, isActive: true }
                                        })}
                                    >
                                        Active
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={editingFabric.fabric.isActive === false ? "default" : "outline"}
                                        size="sm"
                                        className={cn("flex-1", editingFabric.fabric.isActive === false ? "bg-rose-600 hover:bg-rose-700" : "")}
                                        onClick={() => setEditingFabric({
                                            ...editingFabric,
                                            fabric: { ...editingFabric.fabric, isActive: false }
                                        })}
                                    >
                                        Inactive
                                    </Button>
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-neutral-900">Update Fabric</Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
