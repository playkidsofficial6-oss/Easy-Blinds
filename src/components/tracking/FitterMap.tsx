
import { useEffect, useMemo, useRef, useState } from "react";
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
import { format, isPast, parse, parseISO } from "date-fns";
import { useLiveLocation } from "@/hooks";
import type { LiveLocationRecord } from "@/types/live-location";
import {
  createCompanyMarkerIcon,
  createLiveMarkerIcon,
  EASYBLINDS_HQ,
  MARKER_STATUS_CONFIG,
  type LiveMarkerRole,
  type LiveMarkerStatus,
} from "./map-icons";

const OFFLINE_LOCATION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
const KERALA_CENTER: [number, number] = [10.8505, 76.2711];
const MARKER_ANIMATION_MS = 1200;

type TooltipDirection = "top" | "bottom" | "left" | "right";
type LabelPlacementName = "top" | "top-left" | "top-right" | "left" | "right" | "bottom";

interface LabelPlacement {
  name: LabelPlacementName;
  direction: TooltipDirection;
  offset: [number, number];
  connectorOffset: [number, number];
}

interface ScreenRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface LiveMapMarker {
  id: string;
  name: string;
  role: LiveMarkerRole;
  status: LiveMarkerStatus;
  position: [number, number];
  avatar?: string;
  phone?: string;
  lastUpdated: string;
  lastUpdatedAt?: string;
  isLate: boolean;
  isLiveLocation: boolean;
  clusterIndex?: number;
  clusterTotal?: number;
  labelPlacement?: LabelPlacement;
  speed?: number;
  heading?: number;
  assignedJobCount: number;
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

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number): number {
  return (value * 180) / Math.PI;
}

function distanceKm(start: [number, number], end: [number, number]): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(end[0] - start[0]);
  const dLng = toRadians(end[1] - start[1]);
  const lat1 = toRadians(start[0]);
  const lat2 = toRadians(end[0]);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateBearing(start: [number, number], end: [number, number]): number {
  if (start[0] === end[0] && start[1] === end[1]) return 0;

  const startLat = toRadians(start[0]);
  const endLat = toRadians(end[0]);
  const dLng = toRadians(end[1] - start[1]);
  const y = Math.sin(dLng) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

function estimateEtaMinutes(distance: number): number {
  return Math.max(1, Math.round((distance / 32) * 60));
}


function rectanglesOverlap(left: ScreenRect, right: ScreenRect, padding = 6): boolean {
  return !(
    left.right + padding < right.left ||
    left.left - padding > right.right ||
    left.bottom + padding < right.top ||
    left.top - padding > right.bottom
  );
}

function createLabelRect(point: L.Point, offset: [number, number], width: number, height: number): ScreenRect {
  const centerX = point.x + offset[0];
  const centerY = point.y + offset[1];
  return {
    left: centerX - width / 2,
    top: centerY - height / 2,
    right: centerX + width / 2,
    bottom: centerY + height / 2,
  };
}

function getLabelCandidates(marker: LiveMapMarker, denseIndex: number): LabelPlacement[] {
  const isMovingSalesman = marker.role === "Salesman" && marker.status === "On The Way";
  const baseTopOffset = isMovingSalesman ? -42 : -48;
  const lateralStep = Math.min(18, denseIndex * 4);

  return [
    { name: "top", direction: "top", offset: [0, baseTopOffset - lateralStep], connectorOffset: [0, Math.abs(baseTopOffset) - 14 + lateralStep] },
    { name: "top-right", direction: "top", offset: [48 + lateralStep, baseTopOffset + 2], connectorOffset: [-30 - lateralStep, Math.abs(baseTopOffset) - 16] },
    { name: "top-left", direction: "top", offset: [-48 - lateralStep, baseTopOffset + 2], connectorOffset: [30 + lateralStep, Math.abs(baseTopOffset) - 16] },
    { name: "right", direction: "right", offset: [64 + lateralStep, -4], connectorOffset: [-38 - lateralStep, 4] },
    { name: "left", direction: "left", offset: [-64 - lateralStep, -4], connectorOffset: [38 + lateralStep, 4] },
    { name: "bottom", direction: "bottom", offset: [0, 44 + lateralStep], connectorOffset: [0, -30 - lateralStep] },
  ];
}

function estimateLabelSize(marker: LiveMapMarker): { width: number; height: number } {
  const nameLength = marker.name.trim().length || 8;
  return {
    width: Math.min(156, Math.max(72, Math.round(nameLength * 7.2 + 28))),
    height: 30,
  };
}

function scoreLabelCandidate(rect: ScreenRect, placedRects: ScreenRect[], mapSize: L.Point, candidateIndex: number): number {
  const overlapPenalty = placedRects.reduce((score, placed) => score + (rectanglesOverlap(rect, placed) ? 1000 : 0), 0);
  const overflowPenalty =
    Math.max(0, -rect.left) +
    Math.max(0, -rect.top) +
    Math.max(0, rect.right - mapSize.x) +
    Math.max(0, rect.bottom - mapSize.y);

  return overlapPenalty + overflowPenalty * 12 + candidateIndex * 4;
}

function assignLabelPlacements(markers: LiveMapMarker[], map: L.Map): LiveMapMarker[] {
  if (markers.length <= 1) {
    return markers.map((marker) => ({
      ...marker,
      labelPlacement: getLabelCandidates(marker, 0)[0],
    }));
  }

  const mapSize = map.getSize();
  const placedRects: ScreenRect[] = [];
  const orderedMarkers = [...markers].sort((left, right) => {
    if (left.clusterTotal !== right.clusterTotal) return (right.clusterTotal ?? 1) - (left.clusterTotal ?? 1);
    if (left.status === "On The Way" && right.status !== "On The Way") return -1;
    if (right.status === "On The Way" && left.status !== "On The Way") return 1;
    return left.name.localeCompare(right.name);
  });
  const placementById = new Map<string, LabelPlacement>();

  orderedMarkers.forEach((marker) => {
    const point = map.latLngToContainerPoint(L.latLng(marker.position[0], marker.position[1]));
    const nearbyCount = markers.filter((candidate) => {
      if (candidate.id === marker.id) return false;
      const candidatePoint = map.latLngToContainerPoint(L.latLng(candidate.position[0], candidate.position[1]));
      return point.distanceTo(candidatePoint) < 96;
    }).length;
    const labelSize = estimateLabelSize(marker);
    const candidates = getLabelCandidates(marker, nearbyCount);

    let bestCandidate = candidates[0];
    let bestRect = createLabelRect(point, bestCandidate.offset, labelSize.width, labelSize.height);
    let bestScore = Number.POSITIVE_INFINITY;

    candidates.forEach((candidate, index) => {
      const rect = createLabelRect(point, candidate.offset, labelSize.width, labelSize.height);
      const score = scoreLabelCandidate(rect, placedRects, mapSize, index);
      if (score < bestScore) {
        bestScore = score;
        bestCandidate = candidate;
        bestRect = rect;
      }
    });

    placedRects.push(bestRect);
    placementById.set(marker.id, bestCandidate);
  });

  return markers.map((marker) => ({
    ...marker,
    labelPlacement: placementById.get(marker.id) ?? getLabelCandidates(marker, 0)[0],
  }));
}

function formatEta(minutes?: number | null): string {
  if (!minutes) return "Calculating";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

function formatDistance(distance?: number | null): string {
  if (!distance) return "Calculating";
  return `${distance.toFixed(distance >= 10 ? 0 : 1)} km`;
}

function formatSpeed(speed?: number): string {
  if (typeof speed !== "number" || Number.isNaN(speed)) return "Not available";
  const kmh = speed > 45 ? speed : speed * 3.6;
  return `${Math.max(0, kmh).toFixed(0)} km/h`;
}

function getRoutePreview(marker: LiveMapMarker, selectedJob?: FitterMapProps["selectedJob"] | null) {
  if (!selectedJob) return { distance: null, eta: null, status: "No active route" };
  const end: [number, number] = [selectedJob.location.lat, selectedJob.location.lng];
  const distance = distanceKm(marker.position, end);
  const eta = estimateEtaMinutes(distance);
  const status = marker.status === "On The Way" ? "On the way" : marker.status === "Working" ? "In progress" : "Ready to dispatch";
  return { distance, eta, status };
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

function normalizeStatus(status?: string, isOnline = true): LiveMarkerStatus {
  if (!isOnline) return "Offline";

  const normalizedStatus = status?.toLowerCase() ?? "";

  if (normalizedStatus.includes("offline") || normalizedStatus.includes("busy")) return "Offline";
  if (
    normalizedStatus.includes("way") ||
    normalizedStatus.includes("travel") ||
    normalizedStatus.includes("ongoing") ||
    normalizedStatus.includes("moving")
  ) return "On The Way";
  if (normalizedStatus.includes("progress") || normalizedStatus.includes("working")) return "Working";
  if (normalizedStatus.includes("booked")) return "Working";

  return "Available";
}

function normalizeRole(role?: string): LiveMarkerRole {
  const normalizedRole = role?.toLowerCase() ?? "";

  if (normalizedRole.includes("sales")) return "Salesman";
  return "Fitter";
}

function assignedJobCount(fitter: Fitter): number {
  return fitter.schedule.today.length + fitter.schedule.tomorrow.length + fitter.schedule.upcoming.length;
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
    phone: fitter.phone,
    lastUpdated: lastUpdatedAt ? toReadableLastUpdated(lastUpdatedAt) : fitter.lastUpdated,
    lastUpdatedAt,
    isLate: isLate(fitter),
    isLiveLocation: Boolean(liveLocation),
    speed: liveLocation?.speed,
    heading: liveLocation?.heading,
    assignedJobCount: assignedJobCount(fitter),
  };
}

function buildLiveLocationMarker(location: LiveLocationRecord): LiveMapMarker {
  const lastUpdatedAt = location.lastUpdatedAt ?? location.updatedAt;
  const userName = location.user?.name ?? `User ${location.userId.slice(-6)}`;
  const userPhone = (location.user as { phone?: string } | undefined)?.phone;

  return {
    id: location.userId,
    name: userName,
    role: normalizeRole(location.role),
    status: normalizeStatus(location.role, location.isOnline),
    position: [location.lat, location.lng],
    phone: userPhone,
    lastUpdated: toReadableLastUpdated(lastUpdatedAt),
    lastUpdatedAt,
    isLate: false,
    isLiveLocation: true,
    speed: location.speed,
    heading: location.heading,
    assignedJobCount: 0,
  };
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
    allMarkers = allMarkers.filter((marker) => marker.role === filterRole);
  }

  return allMarkers;
}

function MapCameraController({
  selectedJob,
  selectedMarker,
}: {
  selectedJob?: FitterMapProps["selectedJob"] | null;
  selectedMarker?: LiveMapMarker;
}) {
  const map = useMap();
  const prevJobIdRef = useRef<string | undefined | null>(undefined);
  const prevMarkerIdRef = useRef<string | undefined | null>(undefined);
  const hasCenteredOnHqRef = useRef<boolean>(false);

  useEffect(() => {
    // 1. First focus on Headquarters on mount
    if (!hasCenteredOnHqRef.current) {
      hasCenteredOnHqRef.current = true;
      map.setView(EASYBLINDS_HQ.position, 11);
      prevJobIdRef.current = selectedJob?.id;
      prevMarkerIdRef.current = selectedMarker?.id;
      return;
    }

    const jobIdChanged = prevJobIdRef.current !== selectedJob?.id;
    const markerIdChanged = prevMarkerIdRef.current !== selectedMarker?.id;

    // Update references
    prevJobIdRef.current = selectedJob?.id;
    prevMarkerIdRef.current = selectedMarker?.id;

    // 2. Only adjust camera if selection actually changed
    if (jobIdChanged || markerIdChanged) {
      if (selectedJob) {
        const boundsPoints: [number, number][] = [[selectedJob.location.lat, selectedJob.location.lng]];
        if (selectedMarker) {
          boundsPoints.push(selectedMarker.position);
        }

        if (boundsPoints.length > 1) {
          map.flyToBounds(L.latLngBounds(boundsPoints), {
            padding: [70, 70],
            maxZoom: 14,
            duration: 1.1,
          });
        } else {
          map.flyTo([selectedJob.location.lat, selectedJob.location.lng], 13, { duration: 1.1 });
        }
      } else if (selectedMarker) {
        map.flyTo(selectedMarker.position, 13, { duration: 1.1 });
      }
    }
  }, [map, selectedJob, selectedMarker]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => map.invalidateSize(), 500);
    return () => window.clearTimeout(timeoutId);
  }, [map]);

  return null;
}

function SmoothLiveMarker({
  marker,
  selectedJob,
  onSelectFitter,
}: {
  marker: LiveMapMarker;
  selectedJob?: FitterMapProps["selectedJob"] | null;
  onSelectFitter: (id: string) => void;
}) {
  const markerRef = useRef<L.Marker | null>(null);
  const previousPositionRef = useRef<[number, number]>(marker.position);
  const animationFrameRef = useRef<number | null>(null);
  const [displayPosition, setDisplayPosition] = useState<[number, number]>(marker.position);
  const [movementBearing, setMovementBearing] = useState(marker.heading ?? 0);
  const routePreview = getRoutePreview(marker, selectedJob);

  useEffect(() => {
    const start = previousPositionRef.current;
    const end = marker.position;
    if (start[0] === end[0] && start[1] === end[1]) {
      setDisplayPosition(end);
      return undefined;
    }

    const bearing = typeof marker.heading === "number" ? marker.heading : calculateBearing(start, end);
    setMovementBearing(bearing);
    const startedAt = performance.now();
    const leafletMarker = markerRef.current;

    const animate = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - startedAt) / MARKER_ANIMATION_MS);
      const easedProgress = progress < 0.5 ? 2 * progress * progress : 1 - ((-2 * progress + 2) ** 2) / 2;
      const next: [number, number] = [
        start[0] + (end[0] - start[0]) * easedProgress,
        start[1] + (end[1] - start[1]) * easedProgress,
      ];
      leafletMarker?.setLatLng(next);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        previousPositionRef.current = end;
        setDisplayPosition(end);
      }
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [marker.heading, marker.position]);

  const icon = useMemo(
    () => createLiveMarkerIcon({
      status: marker.status,
      late: marker.isLate,
      avatarUrl: marker.avatar,
      name: marker.name,
      role: marker.role,
      clusterIndex: marker.clusterIndex,
      clusterTotal: marker.clusterTotal,
      bearing: movementBearing,
    }),
    [marker.avatar, marker.clusterIndex, marker.clusterTotal, marker.isLate, marker.name, marker.role, marker.status, movementBearing],
  );

  const statusLabel = marker.isLate ? "Late" : MARKER_STATUS_CONFIG[marker.status].label;

  return (
    <Marker
      ref={markerRef}
      key={marker.id}
      position={displayPosition}
      icon={icon}
      eventHandlers={{
        click: () => onSelectFitter(marker.id),
      }}
    >
      <Popup closeButton={false} className="live-location-popup">
        <div className="min-w-56 space-y-2 text-xs text-slate-600">
          <div>
            <div className="text-sm font-semibold text-slate-900">{marker.name}</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{marker.role}</div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="font-medium text-slate-500">Phone</span>
            <span className="text-right">{marker.phone || "Not available"}</span>
            <span className="font-medium text-slate-500">Current status</span>
            <span className="text-right">{statusLabel}</span>
            <span className="font-medium text-slate-500">Distance</span>
            <span className="text-right">{formatDistance(routePreview.distance)}</span>
            <span className="font-medium text-slate-500">ETA</span>
            <span className="text-right">{formatEta(routePreview.eta)}</span>
            <span className="font-medium text-slate-500">Travel status</span>
            <span className="text-right">{routePreview.status}</span>
            <span className="font-medium text-slate-500">Speed</span>
            <span className="text-right">{formatSpeed(marker.speed)}</span>
            <span className="font-medium text-slate-500">Last updated</span>
            <span className="text-right">{marker.lastUpdated}</span>
            <span className="font-medium text-slate-500">Assigned jobs</span>
            <span className="text-right">{marker.assignedJobCount}</span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

interface LiveMarkersListProps {
  markers: LiveMapMarker[];
  selectedJob?: FitterMapProps["selectedJob"] | null;
  selectedFitterId: string | null;
  onSelectFitter: (id: string) => void;
}

function LiveMarkersList({
  markers,
  selectedJob,
  selectedFitterId,
  onSelectFitter,
}: LiveMarkersListProps) {
  const map = useMap();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onMoveOrZoom = () => {
      setVersion((value) => value + 1);
    };
    map.on("zoomend", onMoveOrZoom);
    map.on("moveend", onMoveOrZoom);
    return () => {
      map.off("zoomend", onMoveOrZoom);
      map.off("moveend", onMoveOrZoom);
    };
  }, [map]);

  const groupedMarkers = useMemo(() => {
    const groups: LiveMapMarker[][] = [];
    const orderedMarkers = [...markers].sort((left, right) => {
      if (left.id === selectedFitterId) return 1;
      if (right.id === selectedFitterId) return -1;
      return 0;
    });
    void version;

    for (const marker of orderedMarkers) {
      let added = false;
      const markerPoint = map.latLngToContainerPoint(L.latLng(marker.position[0], marker.position[1]));

      for (const group of groups) {
        const firstInGroup = group[0];
        const groupPoint = map.latLngToContainerPoint(L.latLng(firstInGroup.position[0], firstInGroup.position[1]));

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

    return assignLabelPlacements(result, map);
  }, [markers, selectedFitterId, version, map]);

  return (
    <>
      {groupedMarkers.map((marker) => (
        <SmoothLiveMarker
          key={marker.id}
          marker={marker}
          selectedJob={selectedJob}
          onSelectFitter={onSelectFitter}
        />
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
  const [distanceLabel, setDistanceLabel] = useState<string | null>(null);
  const [etaLabel, setEtaLabel] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) {
          if (active) {
            const fallbackDistance = distanceKm(start, end);
            setRouteCoords(null);
            setDistanceLabel(`~${formatDistance(fallbackDistance)}`);
            setEtaLabel(formatEta(estimateEtaMinutes(fallbackDistance)));
          }
          return;
        }
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map((coordinate: [number, number]) => [coordinate[1], coordinate[0]] as [number, number]);
          if (active) {
            setRouteCoords(coords);
            setDistanceLabel(formatDistance(route.distance / 1000));
            setEtaLabel(formatEta(Math.max(1, Math.round(route.duration / 60))));
          }
        }
      } catch {
        if (active) {
          const fallbackDistance = distanceKm(start, end);
          setRouteCoords(null);
          setDistanceLabel(`~${formatDistance(fallbackDistance)}`);
          setEtaLabel(formatEta(estimateEtaMinutes(fallbackDistance)));
        }
      }
    };
    fetchRoute();
    return () => { active = false; };
  }, [start, end]);

  if (!routeCoords) {
    return (
      <Polyline
        key={`line-loading-${markerId}`}
        positions={[start, end]}
        color="#64748b"
        weight={3}
        dashArray="6, 12"
        opacity={0.65}
      >
        <Tooltip permanent direction="center" className="bg-white/90 border border-slate-200 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-600 shadow-sm">
          {distanceLabel ? `${distanceLabel} · ${etaLabel}` : "Calculating route"}
        </Tooltip>
      </Polyline>
    );
  }

  return (
    <>
      <Polyline
        key={`route-shadow-${markerId}`}
        positions={routeCoords}
        color="#1e293b"
        weight={8}
        opacity={0.16}
      />
      <Polyline
        key={`route-${markerId}`}
        positions={routeCoords}
        color="#2563eb"
        weight={5}
        opacity={0.92}
        lineCap="round"
        lineJoin="round"
      >
        <Tooltip permanent direction="center" className="bg-white/95 border border-blue-200 px-2 py-1 rounded-md text-[10px] font-bold text-blue-700 shadow-sm">
          {distanceLabel} · {etaLabel} · Live route
        </Tooltip>
      </Polyline>
      <Polyline
        key={`route-motion-${markerId}`}
        positions={routeCoords}
        color="#93c5fd"
        weight={3}
        opacity={0.85}
        dashArray="2, 14"
        lineCap="round"
        className="animated-route-line"
      />
    </>
  );
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

interface FitterMapProps {
  fitters: Fitter[];
  selectedFitterId: string | null;
  onSelectFitter: (id: string) => void;
  filterRole?: "Salesman" | "Fitter";
  selectedJob?: {
    id: string;
    jobId?: string;
    location: { lat: number; lng: number };
    address: string;
    client: string;
  } | null;
}

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

  // Poll every 30 s so the map refreshes without a page reload; Socket.IO updates continue between polls.
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

        @keyframes routeDash {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }

        .custom-map-marker,
        .company-hq-marker {
          background: transparent !important;
          border: 0 !important;
          overflow: visible !important;
        }

        .animated-route-line {
          animation: routeDash 1.2s linear infinite;
        }

        .salesman-map-label {
          color: #0f172a !important;
          line-height: 1.1 !important;
          transition: transform 220ms ease-out, opacity 160ms ease-out, left 220ms ease-out, top 220ms ease-out !important;
          will-change: transform;
          white-space: nowrap;
          overflow: visible !important;
        }

        .salesman-map-label::before {
          border-top-color: rgba(255, 255, 255, 0.92) !important;
          border-bottom-color: rgba(255, 255, 255, 0.92) !important;
          border-left-color: rgba(255, 255, 255, 0.92) !important;
          border-right-color: rgba(255, 255, 255, 0.92) !important;
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
  const companyMarkerIcon = useMemo(() => createCompanyMarkerIcon(), []);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={EASYBLINDS_HQ.position}
        zoom={11}
        style={{ height: "100%", width: "100%", background: "#f1f5f9" }}
        zoomControl={false}
        className="h-full w-full relative z-0"
        zoomAnimation
        fadeAnimation
        markerZoomAnimation
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapCameraController selectedJob={selectedJob} selectedMarker={selectedMarker} />

        <Marker position={EASYBLINDS_HQ.position} icon={companyMarkerIcon} zIndexOffset={500}>
          <Tooltip permanent direction="top" offset={[0, -34]} opacity={1} className="bg-white/95 border border-orange-200 shadow-md rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-900">
            EasyBlinds HQ
          </Tooltip>
          <Popup closeButton={false}>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="text-sm font-bold text-slate-900">EasyBlinds HQ</div>
              <div>Nilambur, Kerala</div>
            </div>
          </Popup>
        </Marker>

        <LiveMarkersList
          markers={markers}
          selectedJob={selectedJob}
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
                <div className="space-y-1 text-xs">
                  <div className="font-bold">{selectedJob.client}</div>
                  {selectedJob.jobId && (
                    <div className="font-mono text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 inline-block">
                      {selectedJob.jobId}
                    </div>
                  )}
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
