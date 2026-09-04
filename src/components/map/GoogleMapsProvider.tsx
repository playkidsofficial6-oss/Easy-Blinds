"use client";

import React, { ReactNode } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { MapPin, KeyRound, AlertTriangle } from "lucide-react";

export const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry" | "routes" | "marker")[] = [
  "places",
  "geometry",
  "routes",
  "marker",
];

interface GoogleMapsProviderProps {
  children: ReactNode;
  fallbackHeight?: string;
}

export function GoogleMapsApiKeyFallback({ height = "100%" }: { height?: string }) {
  return (
    <div
      style={{ height }}
      className="w-full h-full min-h-[320px] rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-300"
    >
      <div className="max-w-md p-6 bg-slate-900/90 border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col items-center space-y-3.5 backdrop-blur-md">
        <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
          <KeyRound className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white tracking-tight">
            Google Maps API Key Required
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            To view interactive Google Maps, live fleet tracking, and road navigation, add your API key to:
          </p>
        </div>

        <div className="w-full p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-left font-mono text-[11px] text-amber-300 flex items-center justify-between">
          <span>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...</span>
        </div>

        <p className="text-[11px] text-slate-500">
          Set this in your <code className="text-slate-300 font-mono">frontend/.env</code> file and restart or refresh.
        </p>
      </div>
    </div>
  );
}

export function GoogleMapsProvider({ children, fallbackHeight }: GoogleMapsProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  if (!apiKey || apiKey.trim() === "") {
    return <GoogleMapsApiKeyFallback height={fallbackHeight} />;
  }

  return (
    <APIProvider apiKey={apiKey} libraries={GOOGLE_MAPS_LIBRARIES}>
      {children}
    </APIProvider>
  );
}
