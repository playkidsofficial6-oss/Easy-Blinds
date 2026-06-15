"use client";

import { useState, useEffect, useCallback } from "react";

export interface FabricEntry {
    id: string;
    fabricCode: string; // Serial / Color Code
    material?: string; // e.g. Velvet, Linen, Blackout
    width: number; // in cm
    price: number; // per meter
    isActive?: boolean;
    createdAt: string;
}

export interface CatalogueGroup {
    id: string;
    catalogueNumber: string;
    isActive?: boolean;
    fabrics: FabricEntry[];
}

export interface SupplierGroup {
    id: string;
    supplierName: string;
    catalogues: CatalogueGroup[];
}

const STORAGE_KEY = "eb_catalogues_v3";

const INITIAL_DATA: SupplierGroup[] = [
    {
        id: 's1',
        supplierName: 'Al-Futtaim Fabrics',
        catalogues: [
            {
                id: 'c1',
                catalogueNumber: 'CAT-2024-001',
                isActive: true,
                fabrics: [
                    { id: 'f1', fabricCode: 'VEL-001-GOLD', material: 'Velvet', width: 140, price: 85, isActive: true, createdAt: new Date().toISOString() },
                    { id: 'f2', fabricCode: 'VEL-002-NAVY', material: 'Velvet', width: 140, price: 95, isActive: true, createdAt: new Date().toISOString() },
                ]
            }
        ]
    },
    {
        id: 's2',
        supplierName: 'Seddar Home',
        catalogues: [
            {
                id: 'c2',
                catalogueNumber: 'SH-BLK-05',
                isActive: true,
                fabrics: [
                    { id: 'f3', fabricCode: 'BLK-99-GREY', material: 'Blackout', width: 300, price: 120, isActive: true, createdAt: new Date().toISOString() },
                    { id: 'f4', fabricCode: 'B-01-BLACK', material: 'Premium Blackout', width: 300, price: 155, isActive: true, createdAt: new Date().toISOString() },
                ]
            }
        ]
    }
];

export function useCatalogue() {
    const [data, setData] = useState<SupplierGroup[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
             
            setData(JSON.parse(stored));
        } else {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
            setData(INITIAL_DATA);
        }
        setIsLoaded(true);
    }, []);

    const saveData = useCallback((newData: SupplierGroup[]) => {
        setData(newData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    }, []);

    const addFabric = useCallback((supplierId: string, catalogueId: string, fabric: Omit<FabricEntry, 'id' | 'createdAt'>) => {
        const newData = data.map(s => {
            if (s.id !== supplierId) return s;
            return {
                ...s,
                catalogues: s.catalogues.map(c => {
                    if (c.id !== catalogueId) return c;
                    return {
                        ...c,
                        fabrics: [...c.fabrics, {
                            ...fabric,
                            id: Math.random().toString(36).substring(7),
                            isActive: true,
                            createdAt: new Date().toISOString()
                        }]
                    };
                })
            };
        });
        saveData(newData);
    }, [data, saveData]);

    const toggleFabricStatus = useCallback((supplierId: string, catalogueId: string, fabricId: string) => {
        const newData = data.map(s => {
            if (s.id !== supplierId) return s;
            return {
                ...s,
                catalogues: s.catalogues.map(c => {
                    if (c.id !== catalogueId) return c;
                    return {
                        ...c,
                        fabrics: c.fabrics.map(f => f.id === fabricId ? { ...f, isActive: !f.isActive } : f)
                    };
                })
            };
        });
        saveData(newData);
    }, [data, saveData]);

    const updateFabric = useCallback((supplierId: string, catalogueId: string, fabricId: string, updates: Partial<FabricEntry>) => {
        const newData = data.map(s => {
            if (s.id !== supplierId) return s;
            return {
                ...s,
                catalogues: s.catalogues.map(c => {
                    if (c.id !== catalogueId) return c;
                    return {
                        ...c,
                        fabrics: c.fabrics.map(f => f.id === fabricId ? { ...f, ...updates } : f)
                    };
                })
            };
        });
        saveData(newData);
    }, [data, saveData]);

    const removeFabric = useCallback((supplierId: string, catalogueId: string, fabricId: string) => {
        const newData = data.map(s => {
            if (s.id !== supplierId) return s;
            return {
                ...s,
                catalogues: s.catalogues.map(c => {
                    if (c.id !== catalogueId) return c;
                    return {
                        ...c,
                        fabrics: c.fabrics.filter(f => f.id !== fabricId)
                    };
                })
            };
        });
        saveData(newData);
    }, [data, saveData]);

    const addCatalogue = useCallback((supplierId: string, catalogueNumber: string) => {
        const newData = data.map(s => {
            if (s.id !== supplierId) return s;
            return {
                ...s,
                catalogues: [...s.catalogues, {
                    id: Math.random().toString(36).substring(7),
                    catalogueNumber,
                    isActive: true,
                    fabrics: []
                }]
            };
        });
        saveData(newData);
    }, [data, saveData]);

    const toggleCatalogueStatus = useCallback((supplierId: string, catalogueId: string) => {
        const newData = data.map(s => {
            if (s.id !== supplierId) return s;
            return {
                ...s,
                catalogues: s.catalogues.map(c => {
                    if (c.id !== catalogueId) return c;
                    return { ...c, isActive: !c.isActive };
                })
            };
        });
        saveData(newData);
    }, [data, saveData]);

    const addSupplier = useCallback((supplierName: string) => {
        const newData = [...data, {
            id: Math.random().toString(36).substring(7),
            supplierName,
            catalogues: []
        }];
        saveData(newData);
    }, [data, saveData]);

    return {
        suppliers: data,
        addSupplier,
        addCatalogue,
        toggleCatalogueStatus,
        addFabric,
        updateFabric,
        toggleFabricStatus,
        removeFabric,
        isLoaded
    };
}
