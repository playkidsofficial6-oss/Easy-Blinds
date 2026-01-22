"use client";

import { MapContainer, TileLayer, Marker, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// Fix Leaflet generic marker icon
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface JobDetailMapProps {
    coordinates: [number, number];
}

export default function JobDetailMap({ coordinates }: JobDetailMapProps) {
    return (
        <div className="h-full w-full relative z-0">
            <MapContainer
                center={coordinates}
                zoom={15}
                scrollWheelZoom={false}
                zoomControl={false}
                className="h-full w-full"
                style={{ background: "#f5f5f5" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <Marker position={coordinates} icon={icon} />
            </MapContainer>

            {/* Overlay Gradient for Text Readability */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/10 to-transparent pointer-events-none z-[400]"></div>
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none z-[400]"></div>
        </div>
    );
}
