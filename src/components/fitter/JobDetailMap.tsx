"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import "leaflet-routing-machine";

// Premium Custom Customer Icon using Tailwind + Inline SVG
const customerIcon = typeof window !== 'undefined' ? L.divIcon({
    html: `<div class="relative flex items-center justify-center animate-bounce" style="animation-duration: 2.5s;">
             <div class="absolute -bottom-1 h-2 w-2 rounded-full bg-black/20 blur-sm"></div>
             <div class="h-8 w-8 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center text-white">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
             </div>
           </div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
}) : null;

// Premium Pulse Salesman Icon using Tailwind CSS animation
const salesmanIcon = typeof window !== 'undefined' ? L.divIcon({
    html: `<div class="relative flex h-5 w-5">
             <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
             <span class="relative inline-flex rounded-full h-5 w-5 bg-blue-600 border-2 border-white shadow-md"></span>
           </div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
}) : null;

interface JobDetailMapProps {
    coordinates: [number, number];
}

// Adjust map bounds dynamically to fit both the salesman and customer location
function MapBoundsAdjuster({ points }: { points: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (points.length >= 2) {
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, { padding: [40, 40] });
        } else if (points.length === 1) {
            map.setView(points[0], 14);
        }
    }, [points, map]);
    return null;
}

// Leaflet Routing Machine Component for professional road-based navigation
interface RoutingMachineProps {
    start: [number, number];
    end: [number, number];
}

function RoutingMachine({ start, end }: RoutingMachineProps) {
    const map = useMap();

    useEffect(() => {
        if (!map || !start || !end) return;

        const L_any = L as any;
        if (!L_any.Routing || !L_any.Routing.control) {
            console.warn("Leaflet Routing Machine is not loaded.");
            return;
        }

        // Initialize Routing control with OSRM
        const control = L_any.Routing.control({
            waypoints: [
                L.latLng(start[0], start[1]),
                L.latLng(end[0], end[1])
            ],
            router: L_any.Routing.osrmv1({
                serviceUrl: "https://router.project-osrm.org/route/v1",
                profile: "driving"
            }),
            lineOptions: {
                styles: [{ color: "#3b82f6", weight: 6, opacity: 0.85 }], // Professional Google Maps Blue
                extendToWaypoints: true,
                missingRouteTolerance: 100
            },
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            show: false, // Hide instruction panel
            createMarker: () => null // Suppress routing-generated markers to preserve custom ones
        }).addTo(map);

        // Completely hide default instruction wrapper container
        const container = control.getContainer();
        if (container) {
            container.style.display = 'none';
        }

        return () => {
            try {
                map.removeControl(control);
            } catch (err) {
                console.warn("Leaflet Routing Machine cleanup warning:", err);
            }
        };
    }, [map, start, end]);

    return null;
}

export default function JobDetailMap({ coordinates }: JobDetailMapProps) {
    const [salesmanCoords, setSalesmanCoords] = useState<[number, number] | null>(null);

    // Fetch the current salesman location on mount
    useEffect(() => {
        if (typeof window !== "undefined" && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setSalesmanCoords([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.warn("Unable to fetch salesman location for routing bounds:", error);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }
    }, []);

    // Construct array of points that need to be within bounds
    const boundsPoints: [number, number][] = [coordinates];
    if (salesmanCoords) {
        boundsPoints.push(salesmanCoords);
    }

    return (
        <div className="h-full w-full relative z-0">
            <MapContainer
                center={coordinates}
                zoom={14}
                scrollWheelZoom={false}
                zoomControl={false}
                className="h-full w-full"
                style={{ background: "#f5f5f5" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {/* Custom Customer Marker */}
                {customerIcon && <Marker position={coordinates} icon={customerIcon}>
                    <Popup>
                        <div className="text-xs font-semibold p-1">Customer Location</div>
                    </Popup>
                </Marker>}

                {/* Custom Salesman Marker */}
                {salesmanCoords && salesmanIcon && (
                    <Marker position={salesmanCoords} icon={salesmanIcon}>
                        <Popup>
                            <div className="text-xs font-semibold p-1">Your Location</div>
                        </Popup>
                    </Marker>
                )}

                {/* Professional Road-Based Routing Line */}
                {salesmanCoords && (
                    <RoutingMachine start={salesmanCoords} end={coordinates} />
                )}

                {/* Auto Bounds Fitting */}
                <MapBoundsAdjuster points={boundsPoints} />
            </MapContainer>
        </div>
    );
}
