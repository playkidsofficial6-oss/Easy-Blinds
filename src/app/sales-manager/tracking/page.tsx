"use client";

import { useState } from "react";
import { FitterList } from "@/components/tracking/FitterList";
import dynamic from "next/dynamic";
import { useLiveFitters } from "@/lib/live-store";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Dynamically import map with no SSR
const FitterMap = dynamic(() => import("@/components/tracking/FitterMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400 font-light tracking-[0.2em]">LOADING LIVE MAP...</div>
});

export default function TrackingPage() {
    const { fitters, reload } = useLiveFitters();
    const [selectedFitterId, setSelectedFitterId] = useState<string | null>(null);

    const handleSelectFitter = (id: string | null) => {
        setSelectedFitterId(id);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-end justify-between px-8 py-6 flex-shrink-0">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-slate-400 font-bold">
                        <Link href="/sales-manager" className="hover:text-amber-600 transition-colors flex items-center gap-2">
                            <ArrowLeft className="w-3 h-3" />
                            Operations
                        </Link>
                        <div className="w-8 h-px bg-amber-600"></div>
                        <span>Live Fleet</span>
                    </div>
                    <h1 className="text-5xl font-light tracking-tight text-slate-900">
                        Live
                        <span className="block font-medium mt-1">Fitters</span>
                    </h1>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row border-t border-slate-200 bg-white shadow-sm overflow-hidden min-h-0">
                {/* Sidebar — fixed width, full remaining height, scrolls internally via FitterList */}
                <div className="w-full md:w-96 flex-shrink-0 border-r border-slate-200 z-10 bg-white flex flex-col h-full overflow-y-auto scrollbar-thin">
                    <FitterList
                        fitters={fitters}
                        selectedFitterId={selectedFitterId}
                        onSelectFitter={handleSelectFitter}
                        onJobsChanged={reload}
                    />
                </div>

                {/* Map View */}
                <div className="flex-1 h-full relative bg-slate-100">
                    <FitterMap
                        fitters={fitters}
                        selectedFitterId={selectedFitterId}
                        onSelectFitter={handleSelectFitter}
                    />

                    {/* Live Indicator Overlay - Glassmorphism */}
                    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-4 py-2 flex items-center gap-2 border border-white/50 shadow-lg rounded-full z-[1000] ring-1 ring-black/5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">Live Updates Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
