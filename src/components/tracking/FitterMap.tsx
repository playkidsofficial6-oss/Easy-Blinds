"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Fitter, FitterStatus } from "@/lib/live-store";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { Clock, Circle, CheckCircle2, MapPin, Navigation, AlertCircle } from "lucide-react";
import { format, parse, isPast } from "date-fns";

// Check for late status helper (same logic as FitterList)
function isLate(fitter: Fitter) {
    if (fitter.status === "Done" || fitter.status === "Offline") return false;
    // Check if any active job is late
    return fitter.schedule.today.some(job => {
        if (job.status === "Done" || job.status === "In Progress" || job.status === "Completed") return false;
        try {
            const todayStr = format(new Date(), "yyyy-MM-dd");
            const jobDate = parse(`${todayStr} ${job.time}`, "yyyy-MM-dd hh:mm aa", new Date());
            const fifteenMinsAfter = new Date(jobDate.getTime() + 15 * 60000);
            return isPast(fifteenMinsAfter);
        } catch { return false; }
    });
}

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 13, { duration: 1.5 });
    }, [center, map]);
    return null;
}

interface FitterMapProps {
    fitters: Fitter[];
    selectedFitterId: string | null;
    onSelectFitter: (id: string) => void;
}

const statusConfig: Record<string, { color: string; ringColor: string }> = {
    "Late": { color: "#ef4444", ringColor: "rgba(239, 68, 68, 0.4)" }, // Red
    "On the way": { color: "#d97706", ringColor: "rgba(217, 119, 6, 0.4)" }, // Amber
    "In progress": { color: "#2563eb", ringColor: "rgba(37, 99, 235, 0.4)" }, // Blue
    "Completed": { color: "#059669", ringColor: "rgba(5, 150, 105, 0.4)" }, // Emerald
    "Offline": { color: "#94a3b8", ringColor: "rgba(148, 163, 184, 0.4)" }, // Slate
};

const createCustomIcon = (status: FitterStatus, late: boolean) => {
    const activeStatus = late ? "Late" : status;
    const config = statusConfig[activeStatus] || statusConfig['Offline'];
    const isPulsing = status === 'In progress' || status === 'On the way' || late;

    const html = renderToStaticMarkup(
        <div className="relative flex items-center justify-center w-[40px] h-[40px]">
            {isPulsing && (
                <>
                    <div style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        backgroundColor: config.ringColor,
                        animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                        opacity: 0.75
                    }}></div>
                    <div style={{
                        position: 'absolute',
                        width: '70%',
                        height: '70%',
                        borderRadius: '50%',
                        backgroundColor: config.ringColor,
                        opacity: 0.3
                    }}></div>
                </>
            )}
            <div style={{
                backgroundColor: config.color,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: `2px solid white`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                zIndex: 10
            }}></div>
        </div>
    );

    return L.divIcon({
        html: html,
        className: 'custom-map-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });
};

export default function FitterMap({ fitters, selectedFitterId, onSelectFitter }: FitterMapProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Add ping keyframe if not exists
        if (typeof window !== "undefined") {
            const style = document.createElement('style');
            style.innerHTML = `
                @keyframes ping {
                    75%, 100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }, []);

    const selectedFitter = fitters.find(f => f.id === selectedFitterId);
    const center: [number, number] = selectedFitter
        ? selectedFitter.location
        : [25.2048, 55.2708];

    if (!mounted) {
        return <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400 font-light tracking-wide">INITIALIZING MAP...</div>;
    }

    return (
        <MapContainer
            center={center}
            zoom={11}
            style={{ height: "100%", width: "100%", background: "#f1f5f9" }}
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            <MapUpdater center={center} />

            {fitters.map((fitter) => {
                const late = isLate(fitter);
                return (
                    <Marker
                        key={fitter.id}
                        position={fitter.location}
                        icon={createCustomIcon(fitter.status, late)}
                        eventHandlers={{
                            click: () => onSelectFitter(fitter.id),
                        }}
                    >
                        <Tooltip direction="top" offset={[0, -20]} opacity={1} className="custom-tooltip">
                            <div className="text-[10px] font-bold uppercase tracking-widest p-1">
                                <p className="text-slate-900 mb-1">{fitter.name}</p>
                                <div className="flex items-center gap-1.5">
                                    {late ? (
                                        <span className="text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> LATE</span>
                                    ) : (
                                        <span className="text-slate-500">{fitter.status}</span>
                                    )}
                                </div>
                            </div>
                        </Tooltip>
                    </Marker>
                )
            })}
        </MapContainer>
    );
}
