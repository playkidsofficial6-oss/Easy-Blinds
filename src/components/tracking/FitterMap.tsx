"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Fitter, FitterStatus } from "@/lib/live-store";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { Clock, Circle, CheckCircle2, MapPin, Navigation, AlertCircle } from "lucide-react";
import { format, parse, isPast } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Check for late status helper (same logic as FitterList)
function isLate(fitter: Fitter) {
    if (fitter.status === "Completed" || fitter.status === "Offline") return false;
    // Check if any active job is late
    return fitter.schedule.today.some(job => {
        if (job.status === "Done" || job.status === "In Progress") return false;
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
        // Force invalidate size to fix tile rendering issues usually caused by dynamic resizing
        setTimeout(() => map.invalidateSize(), 500);
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
    "Fully Booked": { color: "#ef4444", ringColor: "rgba(239, 68, 68, 0.4)" }, // Red (Same as Late/Danger)
    "Available": { color: "#059669", ringColor: "rgba(5, 150, 105, 0.4)" }, // Emerald
};

const createCustomIcon = (status: FitterStatus, late: boolean, avatarUrl?: string, name?: string) => {
    const activeStatus = late ? "Late" : status;
    // Default to Offline config if unmatched
    const config = statusConfig[activeStatus] || statusConfig['Offline'];

    const isPulsing = status === 'In progress' || status === 'On the way' || late || status === 'Available';

    const html = renderToStaticMarkup(
        <div className="relative flex items-center justify-center w-[60px] h-[60px]">
            {/* Pulse Ring */}
            {isPulsing && (
                <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: config.ringColor,
                    animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                    opacity: 0.75
                }}></div>
            )}

            {/* White Border / Container */}
            <div style={{
                position: 'relative',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'white',
                padding: '2px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {/* Status Border */}
                <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: `2px solid ${config.color}`,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8fafc' // Slate-50 background backup
                }}>
                    {/* Avatar Image */}
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                            alt={name || "User"}
                        />
                    ) : (
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>SM</span>
                    )}
                </div>
            </div>

            {/* Status Dot Badge (Bottom Right) */}
            <div style={{
                position: 'absolute',
                bottom: '6px',
                right: '6px',
                width: '12px',
                height: '12px',
                backgroundColor: config.color,
                border: '2px solid white',
                borderRadius: '50%',
                zIndex: 20
            }}></div>
        </div>
    );

    return L.divIcon({
        html: html,
        className: 'custom-map-marker',
        iconSize: [60, 60],
        iconAnchor: [30, 30],
    });
};

export default function FitterMap({ fitters, selectedFitterId, onSelectFitter }: FitterMapProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Fix Leaflet's default icon paths (broken in webpack/Next.js builds)
        // This MUST run before any Leaflet map is rendered
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        // Add ping keyframe animation for status indicators
        if (!document.getElementById('map-animations')) {
            const style = document.createElement('style');
            style.id = 'map-animations';
            style.innerHTML = `
                @keyframes ping {
                    75%, 100% {
                        transform: scale(1.5);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Set mounted AFTER all Leaflet patches are applied
        setMounted(true);
    }, []);

    const fittersWithLocation = fitters.filter((fitter): fitter is Fitter & { location: [number, number] } => Boolean(fitter.location));
    const selectedFitter = fittersWithLocation.find(f => f.id === selectedFitterId);
    const center: [number, number] = selectedFitter?.location ?? fittersWithLocation[0]?.location ?? [25.2048, 55.2708];

    if (!mounted) {
        return <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400 font-light tracking-wide">INITIALIZING MAP...</div>;
    }

    return (
        <MapContainer
            center={center}
            zoom={12}
            style={{ height: "100%", width: "100%", background: "#f1f5f9" }}
            zoomControl={false}
            className="h-full w-full relative z-0" // Ensure z-index is correct
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            <MapUpdater center={center} />

            {fittersWithLocation.map((fitter) => {
                const late = isLate(fitter);
                return (
                    <Marker
                        key={fitter.id}
                        position={fitter.location}
                        icon={createCustomIcon(fitter.status, late, fitter.avatar, fitter.name)}
                        eventHandlers={{
                            click: () => onSelectFitter(fitter.id),
                        }}
                    >
                        <Tooltip direction="top" offset={[0, -30]} opacity={1} className="custom-tooltip bg-white border border-slate-200 shadow-md rounded-sm px-2 py-1">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-900">
                                {fitter.name}
                            </div>
                        </Tooltip>
                    </Marker>
                )
            })}
        </MapContainer>
    );
}
