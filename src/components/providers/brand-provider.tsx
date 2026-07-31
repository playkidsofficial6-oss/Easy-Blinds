"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Brand, brands } from "@/lib/brands";

interface BrandContextType {
    selectedBrand: Brand;
    setSelectedBrand: (brandId: string) => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: React.ReactNode }) {
    const [selectedBrandId, setSelectedBrandId] = useState<string>("easy-blinds");

    useEffect(() => {
        const savedBrand = localStorage.getItem("selectedBrand");
        if (savedBrand) {
            setSelectedBrandId(savedBrand);
        }

    }, []);

    const setSelectedBrand = (brandId: string) => {
        setSelectedBrandId(brandId);
        localStorage.setItem("selectedBrand", brandId);
    };

    const selectedBrand = brands.find(b => b.id === selectedBrandId) || brands[0];

    // Prevent hydration mismatch by rendering children only after mount, 
    // or you could render with default and update, but for theme providers usually we wait or use next-themes approach.
    // Here we'll just return the provider with current state.

    return (
        <BrandContext.Provider value={{ selectedBrand, setSelectedBrand }}>
            {children}
        </BrandContext.Provider>
    );
}

export function useBrand() {
    const context = useContext(BrandContext);
    if (context === undefined) {
        throw new Error("useBrand must be used within a BrandProvider");
    }
    return context;
}
