"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  Polyline,
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
  filterRole?: "Salesman" | "Fitter";
  selectedJob?: {
    id: string;
    location: { lat: number; lng: number };
    address: string;
    client: string;
  } | null;
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
  const statusConf = statusConfig[activeStatus];
  const isPulsing = status !== "Offline" || late;
  const isOnTheWay = status === "On The Way";
  const roleColor = role === "Salesman" ? "#16a34a" : "#2563eb";
  const roleRingColor = role === "Salesman" ? "rgba(22, 163, 74, 0.4)" : "rgba(37, 99, 235, 0.4)";

  const initials = name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || (role === "Salesman" ? "SM" : "FT");

  // Car SVG — uses same role color so it matches the existing theme
  const carSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${roleColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2z"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/><path d="M5 9l2-4h10l2 4"/></svg>`;

  const html = renderToStaticMarkup(
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "60px",
        height: "60px",
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
            backgroundColor: roleRingColor,
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
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
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
            border: `2px solid ${roleColor}`,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f8fafc",
            position: "relative",
          }}
        >
          {isOnTheWay ? (
            // Show car icon + first letter stacked when salesman is on the way
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "1px",
                width: "100%",
                height: "100%",
              }}
            >
              <div
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: carSvg }}
                style={{ lineHeight: 0, display: "flex" }}
              />
              <span style={{ fontSize: "8px", fontWeight: "bold", color: roleColor, lineHeight: 1 }}>
                {name ? name.charAt(0).toUpperCase() : initials.charAt(0)}
              </span>
            </div>
          ) : avatarUrl ? (
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
          backgroundColor: statusConf.color,
          border: "2px solid white",
          borderRadius: "50%",
          zIndex: 20,
        }}
      />
    </div>,
  );

  let offsetX = 0;
  let offsetY = 0;
  if (clusterTotal > 1) {
    const angle = (clusterIndex / clusterTotal) * Math.PI * 2;
    offsetX = Math.round(Math.cos(angle) * 36);
    offsetY = Math.round(Math.sin(angle) * 36);
  }

  return L.divIcon({
    html,
    className: "custom-map-marker",
    iconSize: [60, 60],
    iconAnchor: [30 - offsetX, 30 - offsetY],
    popupAnchor: [offsetX, -28 + offsetY],
  });
}

interface LiveMarkersListProps {
  fitters: Fitter[];
  liveLocations: LiveLocationRecord[];
  filterRole?: "Salesman" | "Fitter";
  selectedFitterId: string | null;
  onSelectFitter: (id: string) => void;
}

function LiveMarkersList({
  fitters,
  liveLocations,
  filterRole,
  selectedFitterId,
  onSelectFitter,
}: LiveMarkersListProps) {
  const map = useMap();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onMoveOrZoom = () => {
      setVersion((v) => v + 1);
    };
    map.on("zoomend", onMoveOrZoom);
    map.on("moveend", onMoveOrZoom);
    return () => {
      map.off("zoomend", onMoveOrZoom);
      map.off("moveend", onMoveOrZoom);
    };
  }, [map]);

  const groupedMarkers = useMemo(() => {
    const rawMarkers = buildMapMarkers(fitters, liveLocations, filterRole);
    const groups: LiveMapMarker[][] = [];

    for (const marker of rawMarkers) {
      let added = false;
      const markerPoint = map.latLngToContainerPoint(L.latLng(marker.position[0], marker.position[1]));

      for (const group of groups) {
        const firstInGroup = group[0];
        const groupPoint = map.latLngToContainerPoint(L.latLng(firstInGroup.position[0], firstInGroup.position[1]));

        // Group together if visual distance is less than 55 pixels on screen
        if (markerPoint.distanceTo(groupPoint) < 55) {
          group.push(marker);
          added = true;
          break;
        }
      }

      if (!added) {
        groups.push([marker]);
      }
    }

    const result: LiveMapMarker[] = [];
    for (const group of Object.values(groups)) {
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
  }, [fitters, liveLocations, filterRole, version, map]);

  return (
    <>
      {groupedMarkers.map((marker) => (
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
    </>
  );
}

function RoutingPolyline({
  start,
  end,
  markerId,
}: {
  start: [number, number];
  end: [number, number];
  markerId: string;
}) {
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [distanceKm, setDistanceKm] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) {
          // OSRM could not find a route (e.g. cross-country, no road data).
          // Fall back to straight-line display without crashing.
          if (active) {
            setRouteCoords(null);
            // Compute straight-line distance as fallback label
            const R = 6371;
            const dLat = (end[0] - start[0]) * Math.PI / 180;
            const dLon = (end[1] - start[1]) * Math.PI / 180;
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(start[0] * Math.PI / 180) * Math.cos(end[0] * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
            const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            setDistanceKm(`~${dist.toFixed(1)}`);
          }
          return;
        }
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
          if (active) {
            setRouteCoords(coords);
            setDistanceKm((route.distance / 1000).toFixed(1));
          }
        }
      } catch {
        // Network error — silently fall back, no console spam
        if (active) setRouteCoords(null);
      }
    };
    fetchRoute();
    return () => { active = false; };
  }, [start[0], start[1], end[0], end[1]]);

  if (!routeCoords) {
    return (
      <Polyline
        key={`line-loading-${markerId}`}
        positions={[start, end]}
        color="#94a3b8"
        weight={2}
        dashArray="5, 10"
        opacity={0.6}
      >
        <Tooltip permanent direction="center" className="bg-white/90 border border-slate-200 px-1 py-0.5 rounded text-[9px] font-bold text-slate-600">
          Calculating...
        </Tooltip>
      </Polyline>
    );
  }

  return (
    <Polyline
      key={`line-route-${markerId}`}
      positions={routeCoords}
      color="#3b82f6"
      weight={4}
      opacity={0.8}
    >
      <Tooltip permanent direction="center" className="bg-white/90 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] font-bold text-blue-700 shadow-sm">
        {distanceKm} km
      </Tooltip>
    </Polyline>
  );
}

function buildMapMarkers(
  fitters: Fitter[],
  liveLocations: LiveLocationRecord[],
  filterRole?: "Salesman" | "Fitter"
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

  let allMarkers = [...fitterMarkers, ...liveOnlyMarkers];
  
  if (filterRole) {
    allMarkers = allMarkers.filter((m) => m.role === filterRole);
  }

  return allMarkers;
}

const jobMarkerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  className: "job-marker"
});

export default function FitterMap({
  fitters,
  selectedFitterId,
  onSelectFitter,
  filterRole,
  selectedJob,
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
    () => buildMapMarkers(fitters, liveLocations, filterRole),
    [fitters, liveLocations, filterRole],
  );
  const selectedMarker = markers.find((marker) => marker.id === selectedFitterId);
  const center: [number, number] =
    selectedJob?.location ? [selectedJob.location.lat, selectedJob.location.lng] : (selectedMarker?.position ?? [10.8505, 76.2711]);

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

        <LiveMarkersList
          fitters={fitters}
          liveLocations={liveLocations}
          filterRole={filterRole}
          selectedFitterId={selectedFitterId}
          onSelectFitter={onSelectFitter}
        />

        {/* Selected Job Marker & Polylines */}
        {selectedJob && (
          <>
            <Marker position={[selectedJob.location.lat, selectedJob.location.lng]} icon={jobMarkerIcon}>
              <Tooltip direction="top" offset={[0, -40]} opacity={1} permanent className="font-bold text-blue-600 bg-white border border-blue-200">
                Pending Job: {selectedJob.client}
              </Tooltip>
              <Popup>
                <div className="text-xs">
                  <div className="font-bold">{selectedJob.client}</div>
                  <div className="text-slate-500">{selectedJob.address}</div>
                </div>
              </Popup>
            </Marker>
            {markers.map((marker) => (
              <RoutingPolyline
                key={`route-${marker.id}`}
                markerId={marker.id}
                start={marker.position}
                end={[selectedJob.location.lat, selectedJob.location.lng]}
              />
            ))}
          </>
        )}
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
