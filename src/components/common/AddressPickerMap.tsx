"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";

const markerIcon = typeof window !== "undefined" ? L.divIcon({
    html: `<div class="relative flex h-6 w-6">
             <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
             <span class="relative inline-flex rounded-full h-6 w-6 bg-amber-500 border-2 border-white shadow-md"></span>
           </div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
}) : null;

interface AddressPickerMapProps {
    onAddressSelect: (address: string, coords?: [number, number]) => void;
    externalCoords?: [number, number] | null;
}

function LocationMarker({ onAddressSelect, externalCoords }: AddressPickerMapProps) {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const map = useMap();

    useEffect(() => {
        if (externalCoords && externalCoords[0] && externalCoords[1]) {
            setPosition(externalCoords);
            map.flyTo(externalCoords, 14);
        }
    }, [externalCoords, map]);

    useMapEvents({
        click: async (e) => {
            const { lat, lng } = e.latlng;
            setPosition([lat, lng]);
            
            try {
                // Using OpenStreetMap Nominatim for free reverse geocoding
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                const data = await response.json();
                if (data && data.display_name) {
                    onAddressSelect(data.display_name, [lat, lng]);
                } else {
                    toast.error("Could not determine address for this location.");
                }
            } catch (error) {
                console.error("Error fetching address:", error);
                toast.error("Failed to fetch address details.");
            }
        },
    });

    return position === null || !markerIcon ? null : (
        <Marker position={position} icon={markerIcon}></Marker>
    );
}

export default function AddressPickerMap({ onAddressSelect, externalCoords }: AddressPickerMapProps) {
    // Default to Kerala center
    const defaultCenter: [number, number] = [10.8505, 76.2711];

    return (
        <div className="h-64 w-full rounded-xl border-2 border-slate-200 overflow-hidden relative z-0 mt-2 shadow-sm">
            <div className="absolute top-2 right-2 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-sm border border-slate-100 pointer-events-none">
                Click Map to Pick Address
            </div>
            <MapContainer
                center={defaultCenter}
                zoom={11}
                scrollWheelZoom={true}
                className="h-full w-full"
                style={{ background: "#f5f5f5" }}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <LocationMarker onAddressSelect={onAddressSelect} externalCoords={externalCoords} />
            </MapContainer>
        </div>
    );
}
