"use client";

import dynamic from "next/dynamic";
import { MapPin, RefreshCw } from "lucide-react";

// Dynamically import Leaflet Fleet Map (CSR only, no SSR)
const AdminFleetMap = dynamic(
  () => import("@/components/map/AdminFleetMap").then((m) => m.AdminFleetMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-semibold tracking-wider uppercase text-slate-300">
          Loading Fleet Map...
        </p>
      </div>
    ),
  }
);

export default function AdminMapPage() {
  return (
    <div className="w-full h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] flex flex-col space-y-1.5 sm:space-y-3 overflow-hidden p-2 sm:p-5">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5 sm:pb-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Live Fleet Map
            </h1>
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
              Real-time map showing Salesmen & Fitters together. Offline staff have a red border ring.
            </p>
          </div>
        </div>
      </div>

      {/* ── MAP CONTAINER (FITS EXCLUSIVELY IN VIEWPORT) ── */}
      <div className="flex-1 w-full relative min-h-0">
        <AdminFleetMap />
      </div>
    </div>
  );
}
