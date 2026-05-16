"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Fitter } from "@/lib/live-store";
import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import { format, isPast, parse, parseISO } from "date-fns";
import { useLiveLocation } from "@/hooks";
import type { LiveLocationRecord } from "@/types/live-location";

const OFFLINE_LOCATION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

type LiveMarkerStatus = "Available" | "Working" | "On The Way" | "Offline";
type LiveMarkerRole = "Salesman" | "Fitter";

interface LiveMapMarker {
  id: string;
  name: string;
  role: LiveMarkerRole;
  status: LiveMarkerStatus;
  position: [number, number];
  avatar?: string;
  lastUpdated: string;
  lastUpdatedAt?: string;
  isLate: boolean;
  isLiveLocation: boolean;
  clusterIndex?: number;
  clusterTotal?: number;
}

// Check for late status helper (same logic as FitterList)
function isLate(fitter: Fitter) {
  if (fitter.status === "Completed" || fitter.status === "Offline") return false;

  return fitter.schedule.today.some((job) => {
    if (job.status === "Done" || job.status === "In Progress") return false;
    try {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const jobDate = parse(`${todayStr} ${job.time}`, "yyyy-MM-dd hh:mm aa", new Date());
      const fifteenMinsAfter = new Date(jobDate.getTime() + 15 * 60000);
      return isPast(fifteenMinsAfter);
    } catch {
      return false;
    }
  });
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, 13, { duration: 1.5 });
    setTimeout(() => map.invalidateSize(), 500);
  }, [center, map]);

  return null;
}

interface FitterMapProps {
  fitters: Fitter[];
  selectedFitterId: string | null;
  onSelectFitter: (id: string) => void;
}

const statusConfig: Record<LiveMarkerStatus | "Late", { color: string; ringColor: string }> = {
  Late: { color: "#ef4444", ringColor: "rgba(239, 68, 68, 0.4)" },
  Available: { color: "#16a34a", ringColor: "rgba(22, 163, 74, 0.4)" },
  Working: { color: "#2563eb", ringColor: "rgba(37, 99, 235, 0.4)" },
  "On The Way": { color: "#f97316", ringColor: "rgba(249, 115, 22, 0.4)" },
  Offline: { color: "#ef4444", ringColor: "rgba(239, 68, 68, 0.3)" },
};

function normalizeStatus(status?: string, isOnline = true): LiveMarkerStatus {
  if (!isOnline) return "Offline";

  const normalizedStatus = status?.toLowerCase() ?? "";

  if (normalizedStatus.includes("offline")) return "Offline";
  if (normalizedStatus.includes("progress") || normalizedStatus.includes("working")) return "Working";
  if (normalizedStatus.includes("way")) return "On The Way";
  if (normalizedStatus.includes("booked")) return "Working";

  return "Available";
}

function normalizeRole(role?: string): LiveMarkerRole {
  const normalizedRole = role?.toLowerCase() ?? "";

  if (normalizedRole.includes("sales")) return "Salesman";
  return "Fitter";
}

function toReadableLastUpdated(source?: string) {
  if (!source) return "Not updated";

  try {
    return format(parseISO(source), "MMM d, HH:mm:ss");
  } catch {
    return source;
  }
}

function isTimedOutOffline(location: LiveLocationRecord, now: number) {
  if (location.isOnline) return false;

  const source = location.lastUpdatedAt ?? location.updatedAt;
  if (!source) return false;

  const lastUpdatedTime = Date.parse(source);
  if (Number.isNaN(lastUpdatedTime)) return false;

  return now - lastUpdatedTime > OFFLINE_LOCATION_TIMEOUT_MS;
}

function buildFitterMarker(
  fitter: Fitter,
  liveLocation?: LiveLocationRecord,
): LiveMapMarker | null {
  const lastUpdatedAt = liveLocation?.lastUpdatedAt ?? liveLocation?.updatedAt;
  const status = normalizeStatus(fitter.status, liveLocation?.isOnline ?? fitter.status !== "Offline");
  const position = liveLocation
    ? ([liveLocation.lat, liveLocation.lng] as [number, number])
    : fitter.location;

  if (!position) {
    return null;
  }

  return {
    id: fitter.id,
    name: fitter.name,
    role: fitter.role ?? "Fitter",
    status,
    position,
    avatar: fitter.avatar,
    lastUpdated: lastUpdatedAt ? toReadableLastUpdated(lastUpdatedAt) : fitter.lastUpdated,
    lastUpdatedAt,
    isLate: isLate(fitter),
    isLiveLocation: Boolean(liveLocation),
  };
}

function buildLiveLocationMarker(location: LiveLocationRecord): LiveMapMarker {
  const lastUpdatedAt = location.lastUpdatedAt ?? location.updatedAt;
  const userName = location.user?.name ?? `User ${location.userId.slice(-6)}`;

  return {
    id: location.userId,
    name: userName,
    role: normalizeRole(location.role),
    status: normalizeStatus(location.role, location.isOnline),
    position: [location.lat, location.lng],
    lastUpdated: toReadableLastUpdated(lastUpdatedAt),
    lastUpdatedAt,
    isLate: false,
    isLiveLocation: true,
  };
}

function createCustomIcon(
  status: LiveMarkerStatus,
  late: boolean,
  avatarUrl?: string,
  name?: string,
  role?: LiveMarkerRole,
  clusterIndex = 0,
  clusterTotal = 1,
) {
  const activeStatus = late ? "Late" : status;
  const config = statusConfig[activeStatus];
  const isPulsing = status !== "Offline" || late;
  const initials = name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || (role === "Salesman" ? "SM" : "FT");

  let offsetX = 0;
  let offsetY = 0;
  if (clusterTotal > 1) {
    const angle = (clusterIndex / clusterTotal) * Math.PI * 2;
    // Push them out radially by 32px so they don't perfectly overlap
    offsetX = Math.cos(angle) * 32;
    offsetY = Math.sin(angle) * 32;
  }

  const html = renderToStaticMarkup(
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "60px",
        height: "60px",
        transform: `translate(${offsetX}px, ${offsetY}px)`,
        transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        zIndex: clusterIndex,
      }}
    >
      {isPulsing && (
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            backgroundColor: config.ringColor,
            animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
            opacity: 0.75,
          }}
        />
      )}

      <div
        style={{
          position: "relative",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "white",
          padding: "2px",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: `2px solid ${config.color}`,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f8fafc",
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              alt={name || "User"}
            />
          ) : (
            <span style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b" }}>
              {initials}
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "6px",
          right: "6px",
          width: "12px",
          height: "12px",
          backgroundColor: config.color,
          border: "2px solid white",
          borderRadius: "50%",
          zIndex: 20,
        }}
      />
    </div>,
  );

  return L.divIcon({
    html,
    className: "custom-map-marker",
    iconSize: [60, 60],
    iconAnchor: [30, 30],
    popupAnchor: [0, -28],
  });
}

function groupIdenticalMarkers(markers: LiveMapMarker[]): LiveMapMarker[] {
  const coordGroups: Record<string, LiveMapMarker[]> = {};

  for (const marker of markers) {
    // 4 decimal places is roughly 11 meters accuracy
    const key = `${marker.position[0].toFixed(4)},${marker.position[1].toFixed(4)}`;
    if (!coordGroups[key]) coordGroups[key] = [];
    coordGroups[key].push(marker);
  }

  const result: LiveMapMarker[] = [];
  for (const group of Object.values(coordGroups)) {
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      group.forEach((marker, index) => {
        result.push({
          ...marker,
          clusterIndex: index,
          clusterTotal: group.length,
        });
      });
    }
  }

  return result;
}

function buildMapMarkers(
  fitters: Fitter[],
  liveLocations: LiveLocationRecord[],
): LiveMapMarker[] {
  const now = Date.now();
  const activeLiveLocations = liveLocations.filter(
    (location) => !isTimedOutOffline(location, now),
  );
  const liveLocationByUserId = activeLiveLocations.reduce<Record<string, LiveLocationRecord>>(
    (accumulator, location) => {
      accumulator[location.userId] = location;
      return accumulator;
    },
    {},
  );

  const fitterMarkers = fitters
    .map((fitter) => buildFitterMarker(fitter, liveLocationByUserId[fitter.id]))
    .filter((marker): marker is LiveMapMarker => Boolean(marker));

  const knownFitterIds = new Set(fitterMarkers.map((marker) => marker.id));
  const liveOnlyMarkers = activeLiveLocations
    .filter((location) => !knownFitterIds.has(location.userId))
    .map(buildLiveLocationMarker);

  return groupIdenticalMarkers([...fitterMarkers, ...liveOnlyMarkers]);
}

export default function FitterMap({
  fitters,
  selectedFitterId,
  onSelectFitter,
}: FitterMapProps) {
  const {
    locations: liveLocations,
    isLoaded: liveLocationsLoaded,
    error: liveLocationError,
    reload: reloadLiveLocations,
  } = useLiveLocation();

  // Poll every 30 s so the map refreshes without a page reload
  useEffect(() => {
    const intervalId = setInterval(() => {
      void reloadLiveLocations().catch(() => undefined);
    }, 30_000);
    return () => clearInterval(intervalId);
  }, [reloadLiveLocations]);

  useEffect(() => {
    delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    if (!document.getElementById("map-animations")) {
      const style = document.createElement("style");
      style.id = "map-animations";
      style.innerHTML = `
        @keyframes ping {
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        .custom-map-marker {
          background: transparent !important;
          border: 0 !important;
          overflow: visible !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const markers = useMemo(
    () => buildMapMarkers(fitters, liveLocations),
    [fitters, liveLocations],
  );
  const selectedMarker = markers.find((marker) => marker.id === selectedFitterId);
  const center: [number, number] =
    selectedMarker?.position ?? markers[0]?.position ?? [25.2048, 55.2708];

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%", background: "#f1f5f9" }}
        zoomControl={false}
        className="h-full w-full relative z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapUpdater center={center} />

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={createCustomIcon(
              marker.status,
              marker.isLate,
              marker.avatar,
              marker.name,
              marker.role,
              marker.clusterIndex,
              marker.clusterTotal,
            )}
            eventHandlers={{
              click: () => onSelectFitter(marker.id),
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -30]}
              opacity={1}
              className="custom-tooltip bg-white border border-slate-200 shadow-md rounded-sm px-2 py-1"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-900">
                {marker.name}
              </div>
            </Tooltip>
            <Popup closeButton={false} className="live-location-popup">
              <div className="min-w-40 space-y-1 text-xs text-slate-600">
                <div className="text-sm font-semibold text-slate-900">{marker.name}</div>
                <div className="flex justify-between gap-4">
                  <span className="font-medium text-slate-500">Role</span>
                  <span>{marker.role}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="font-medium text-slate-500">Status</span>
                  <span>{marker.isLate ? "Late" : marker.status}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="font-medium text-slate-500">Last updated</span>
                  <span>{marker.lastUpdated}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {!liveLocationsLoaded && (
        <div className="absolute bottom-4 left-4 z-[1000] rounded-full border border-white/60 bg-white/80 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 shadow-lg backdrop-blur-md">
          Loading live locations...
        </div>
      )}

      {liveLocationError && (
        <div className="absolute bottom-4 left-4 z-[1000] max-w-xs rounded-md border border-red-100 bg-white/90 px-4 py-3 text-xs text-red-600 shadow-lg backdrop-blur-md">
          {liveLocationError}
        </div>
      )}
    </div>
  );
}
