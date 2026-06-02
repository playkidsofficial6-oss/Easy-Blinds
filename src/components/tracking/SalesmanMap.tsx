
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown, ChevronUp, MapPin, Compass, Navigation } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Fitter } from "@/lib/live-store";
import L from "leaflet";
import { format, isPast, parse, parseISO } from "date-fns";
import { useLiveLocation } from "@/hooks";
import { cn } from "@/lib/utils";
import DiagnosticsPanel from "./DiagnosticsPanel";
import type { LiveLocationRecord } from "@/types/live-location";
import { snapToRoad } from "@/utils/road-snapping";
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
  activeJobId?: string;
  activeJobStatus?: string;
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  destinationCoordinates?: [number, number];
  locationLabel?: string;
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

function isOnTheWayStatus(status?: string): boolean {
  return /on\s*the\s*way|on\s*way|way|travel|ongoing|moving/i.test(status ?? "");
}

function getMarkerRouteColor(marker: LiveMapMarker): string {
  return isOnTheWayStatus(marker.activeJobStatus) || isOnTheWayStatus(marker.status)
    ? "#10b981"
    : MARKER_STATUS_CONFIG[marker.status].color;
}

function getMarkerMotionColor(marker: LiveMapMarker): string {
  return isOnTheWayStatus(marker.activeJobStatus) || isOnTheWayStatus(marker.status)
    ? "#86efac"
    : "#93c5fd";
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
  if (typeof speed !== "number" || Number.isNaN(speed) || speed <= 0) {
    return "0 km/h";
  }
  const kmh = speed > 45 ? speed : speed * 3.6;
  return `${Math.max(0, kmh).toFixed(0)} km/h`;
}

interface RouteMetrics {
  distanceKm: number;
  etaMinutes: number;
  distanceText: string;
  etaText: string;
  exact: boolean;
}

async function fetchRouteMetrics(start: [number, number], end: [number, number]): Promise<RouteMetrics> {
  const [startLat, startLng] = start;
  const [endLat, endLng] = end;
  const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=false&alternatives=false&steps=false`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Route metrics request failed with ${response.status}`);
  }

  const data = await response.json() as {
    routes?: Array<{ distance?: number; duration?: number }>;
  };
  const route = data.routes?.[0];

  if (typeof route?.distance !== "number" || typeof route?.duration !== "number") {
    throw new Error("Route metrics response did not include distance and duration");
  }

  const routeDistanceKm = route.distance / 1000;
  const etaMinutes = Math.max(1, Math.round(route.duration / 60));

  return {
    distanceKm: routeDistanceKm,
    etaMinutes,
    distanceText: formatDistance(routeDistanceKm),
    etaText: formatEta(etaMinutes),
    exact: true,
  };
}

function getFallbackRouteMetrics(start: [number, number], end: [number, number]): RouteMetrics {
  const fallbackDistanceKm = distanceKm(start, end);
  const fallbackEtaMinutes = estimateEtaMinutes(fallbackDistanceKm);

  return {
    distanceKm: fallbackDistanceKm,
    etaMinutes: fallbackEtaMinutes,
    distanceText: `~${formatDistance(fallbackDistanceKm)}`,
    etaText: formatEta(fallbackEtaMinutes),
    exact: false,
  };
}

function getRoutePreview(marker: LiveMapMarker, selectedJob?: SalesmanMapProps["selectedJob"] | null) {
  const destCoords = marker.destinationCoordinates ?? 
                     (selectedJob ? [selectedJob.location.lat, selectedJob.location.lng] as [number, number] : null);
  if (!destCoords) return { distance: null, eta: null, status: "No active route" };
  const distance = distanceKm(marker.position, destCoords);
  const eta = estimateEtaMinutes(distance);
  const status = marker.status === "On The Way" ? "On the way" : 
                 marker.status === "Working" || marker.status === "Measuring" ? "In progress" : 
                 "Ready to dispatch";
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

  const s = status?.toLowerCase() ?? "";

  if (s.includes("offline") || s.includes("busy")) return "Offline";
  if (isOnTheWayStatus(status)) return "On The Way";
  if (s.includes("measuring") || s.includes("measure")) return "Measuring";
  if (s.includes("progress") || s.includes("working")) return "Working";
  if (s.includes("booked")) return "Working";
  if (s.includes("complet") || s.includes("done")) return "Available";

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
  console.log(
    `🏗️ Marker: ${fitter.name}`,
    `fitter.status: ${fitter.status}`,
    `liveStatus: ${liveLocation?.liveStatus}`,
    `→ normalized: ${status}`,
  );
  const position = liveLocation
    ? ([liveLocation.lat, liveLocation.lng] as [number, number])
    : fitter.location;

  if (!position) {
    return null;
  }

  const activeJob = fitter.schedule.today.find(j => j.id === fitter.jobRef) ??
                    fitter.schedule.tomorrow.find(j => j.id === fitter.jobRef) ??
                    fitter.schedule.upcoming.find(j => j.id === fitter.jobRef) ??
                    fitter.schedule.today.find(j => j.status === "On the way" || j.status === "In Progress");

  const destinationCoordinates: [number, number] | undefined =
    (activeJob?.coordinates &&
     typeof activeJob.coordinates[0] === "number" &&
     typeof activeJob.coordinates[1] === "number" &&
     (activeJob.coordinates[0] !== 0 || activeJob.coordinates[1] !== 0))
      ? [activeJob.coordinates[0], activeJob.coordinates[1]]
      : undefined;

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
    activeJobId: activeJob?.id || activeJob?.jobId,
    activeJobStatus: activeJob?.status,
    customerName: activeJob?.client,
    customerAddress: activeJob?.address,
    customerPhone: activeJob?.phone,
    destinationCoordinates,
    locationLabel: fitter.locationLabel,
  };
}

function buildLiveLocationMarker(location: LiveLocationRecord, fitter?: Fitter): LiveMapMarker {
  const lastUpdatedAt = location.lastUpdatedAt ?? location.updatedAt;
  const userName = location.user?.name ?? `User ${location.userId.slice(-6)}`;
  const userPhone = (location.user as { phone?: string } | undefined)?.phone;

  const activeJob = fitter
    ? (fitter.schedule.today.find(j => j.id === fitter.jobRef) ??
       fitter.schedule.tomorrow.find(j => j.id === fitter.jobRef) ??
       fitter.schedule.upcoming.find(j => j.id === fitter.jobRef) ??
       fitter.schedule.today.find(j => j.status === "On the way" || j.status === "In Progress"))
    : undefined;

  const destinationCoordinates: [number, number] | undefined =
    (activeJob?.coordinates &&
     typeof activeJob.coordinates[0] === "number" &&
     typeof activeJob.coordinates[1] === "number" &&
     (activeJob.coordinates[0] !== 0 || activeJob.coordinates[1] !== 0))
      ? [activeJob.coordinates[0], activeJob.coordinates[1]]
      : undefined;

  return {
    id: location.userId,
    name: userName,
    role: normalizeRole(location.role),
    status: normalizeStatus(
      location.liveStatus ?? location.status ?? location.role,
      location.isOnline
    ),
    position: [location.lat, location.lng],
    phone: userPhone,
    lastUpdated: toReadableLastUpdated(lastUpdatedAt),
    lastUpdatedAt,
    isLate: false,
    isLiveLocation: true,
    speed: location.speed,
    heading: location.heading,
    assignedJobCount: fitter ? assignedJobCount(fitter) : 0,
    activeJobId: activeJob?.id || activeJob?.jobId,
    activeJobStatus: activeJob?.status,
    customerName: activeJob?.client,
    customerAddress: activeJob?.address,
    customerPhone: activeJob?.phone,
    destinationCoordinates,
    locationLabel: fitter?.locationLabel,
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
    .map((location) => {
      const fitter = fitters.find((f) => f.id === location.userId);
      return buildLiveLocationMarker(location, fitter);
    });

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
  selectedJob?: SalesmanMapProps["selectedJob"] | null;
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
        if (selectedMarker.destinationCoordinates) {
          map.flyToBounds(
            L.latLngBounds([selectedMarker.position, selectedMarker.destinationCoordinates]),
            {
              padding: [75, 75],
              maxZoom: 14,
              duration: 1.2,
            }
          );
        } else {
          map.flyTo(selectedMarker.position, 13, { duration: 1.1 });
        }
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
  zoomLevel,
}: {
  marker: LiveMapMarker;
  selectedJob?: SalesmanMapProps["selectedJob"] | null;
  onSelectFitter: (id: string) => void;
  zoomLevel: number;
}) {
  const markerRef = useRef<L.Marker | null>(null);
  const currentPositionRef = useRef<[number, number]>(marker.position);
  const animationFrameRef = useRef<number | null>(null);
  const [displayPosition, setDisplayPosition] = useState<[number, number]>(marker.position);
  const [movementBearing, setMovementBearing] = useState(marker.heading ?? 0);
  const [routeMetrics, setRouteMetrics] = useState<RouteMetrics | null>(null);
  const routePreview = getRoutePreview(marker, selectedJob);

  const destinationCoordinates = marker.destinationCoordinates;
  const startLat = marker.position[0];
  const startLng = marker.position[1];
  const endLat = destinationCoordinates?.[0];
  const endLng = destinationCoordinates?.[1];

  useEffect(() => {
    let active = true;

    if (marker.role !== "Salesman" || marker.status !== "On The Way" || !destinationCoordinates) {
      setRouteMetrics(null);
      return () => { active = false; };
    }

    const start: [number, number] = [startLat, startLng];
    const end: [number, number] = [destinationCoordinates[0], destinationCoordinates[1]];
    setRouteMetrics(getFallbackRouteMetrics(start, end));

    fetchRouteMetrics(start, end)
      .then((metrics) => {
        if (active) setRouteMetrics(metrics);
      })
      .catch(() => {
        if (active) setRouteMetrics(getFallbackRouteMetrics(start, end));
      });

    return () => { active = false; };
  }, [destinationCoordinates, endLat, endLng, marker.role, marker.status, startLat, startLng]);

  useEffect(() => {
    let active = true;

    async function runSnappingAndAnimate() {
      let targetPosition = marker.position;
      if (marker.role === "Salesman" && marker.status === "On The Way") {
        targetPosition = await snapToRoad(marker.position[0], marker.position[1]);
      }

      if (!active) return;

      const start = currentPositionRef.current;
      const end = targetPosition;
      if (start[0] === end[0] && start[1] === end[1]) {
        setDisplayPosition(end);
        return;
      }

      const dist = distanceKm(start, end) * 1000; // meters
      const bearing = dist > 1.5
        ? (typeof marker.heading === "number" ? marker.heading : calculateBearing(start, end))
        : movementBearing;

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
        currentPositionRef.current = next;

        if (leafletMarker) {
          leafletMarker.setLatLng(next);
        } else {
          setDisplayPosition(next);
        }

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayPosition(end);
        }
      };

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    runSnappingAndAnimate();

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [marker.heading, marker.position, marker.status, marker.role]);

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
      zoomLevel,
      customerName: marker.customerName,
      routeDistanceText: routeMetrics?.distanceText,
      routeEtaText: routeMetrics?.etaText,
    }),
    [marker.avatar, marker.clusterIndex, marker.clusterTotal, marker.isLate, marker.name, marker.role, marker.status, movementBearing, zoomLevel, marker.customerName, routeMetrics?.distanceText, routeMetrics?.etaText],
  );

  const statusLabel = marker.isLate ? "Late" : MARKER_STATUS_CONFIG[marker.status].label;

  const zIndexOffset =
    marker.status === "On The Way" ? 300 :
    marker.status === "Measuring" || marker.status === "Working" ? 200 :
    marker.status === "Available" ? 100 : 0;

  return (
    <Marker
      ref={markerRef}
      key={marker.id}
      position={displayPosition}
      icon={icon}
      zIndexOffset={zIndexOffset}
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
            <span className="text-right">{routeMetrics?.distanceText ?? formatDistance(routePreview.distance)}</span>
            <span className="font-medium text-slate-500">ETA</span>
            <span className="text-right">{routeMetrics?.etaText ?? formatEta(routePreview.eta)}</span>
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
  selectedJob?: SalesmanMapProps["selectedJob"] | null;
  selectedFitterId: string | null;
  onSelectFitter: (id: string) => void;
  zoomLevel: number;
}

function LiveMarkersList({
  markers,
  selectedJob,
  selectedFitterId,
  onSelectFitter,
  zoomLevel,
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
          zoomLevel={zoomLevel}
        />
      ))}
    </>
  );
}

function RoutingPolyline({
  start,
  end,
  markerId,
  zoomLevel,
  routeColor = "#2563eb",
  motionColor = "#93c5fd",
  onTelemetryUpdate,
}: {
  start: [number, number];
  end: [number, number];
  markerId: string;
  zoomLevel: number;
  routeColor?: string;
  motionColor?: string;
  onTelemetryUpdate?: (markerId: string, distanceLabel: string, etaLabel: string) => void;
}) {
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [distanceLabel, setDistanceLabel] = useState<string | null>(null);
  const [etaLabel, setEtaLabel] = useState<string | null>(null);

  useEffect(() => {
    if (distanceLabel && etaLabel) {
      onTelemetryUpdate?.(markerId, distanceLabel, etaLabel);
    }
  }, [distanceLabel, etaLabel, markerId, onTelemetryUpdate]);

  const startLat = start[0];
  const startLng = start[1];
  const endLat = end[0];
  const endLng = end[1];

  useEffect(() => {
    let active = true;
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) {
          if (active) {
            const fallbackDistance = distanceKm([startLat, startLng], [endLat, endLng]);
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
          const fallbackDistance = distanceKm([startLat, startLng], [endLat, endLng]);
          setRouteCoords(null);
          setDistanceLabel(`~${formatDistance(fallbackDistance)}`);
          setEtaLabel(formatEta(estimateEtaMinutes(fallbackDistance)));
        }
      }
    };
    fetchRoute();
    return () => { active = false; };
  }, [startLat, startLng, endLat, endLng]);

  const midPoint = routeCoords && routeCoords.length > 0
    ? routeCoords[Math.floor(routeCoords.length / 2)]
    : [ (start[0] + end[0]) / 2, (start[1] + end[1]) / 2 ] as [number, number];

  const transparentIcon = useMemo(() => L.divIcon({
    html: '',
    className: 'pointer-events-none bg-transparent border-0',
    iconSize: [0, 0]
  }), []);

  if (!routeCoords) {
    return (
      <>
        <Polyline
          key={`line-loading-${markerId}`}
          positions={[start, end]}
          color={routeColor}
          weight={3}
          dashArray="6, 12"
          opacity={0.65}
        />
        {zoomLevel >= 11 && distanceLabel && etaLabel && (
          <Marker position={midPoint} icon={transparentIcon} zIndexOffset={100}>
            <Tooltip permanent direction="center" className="route-eta-badge-tooltip">
              {distanceLabel} • {etaLabel}
            </Tooltip>
          </Marker>
        )}
      </>
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
        color={routeColor}
        weight={5}
        opacity={0.92}
        lineCap="round"
        lineJoin="round"
      />
      <Polyline
        key={`route-motion-${markerId}`}
        positions={routeCoords}
        color={motionColor}
        weight={3}
        opacity={0.85}
        dashArray="2, 14"
        lineCap="round"
        className="animated-route-line"
      />
      {zoomLevel >= 20 && distanceLabel && etaLabel && (
        <Marker position={midPoint} icon={transparentIcon} zIndexOffset={100}>
          <Tooltip permanent direction="center" className="route-eta-badge-tooltip">
            {distanceLabel} • {etaLabel}
          </Tooltip>
        </Marker>
      )}
    </>
  );
}

import { renderToStaticMarkup } from "react-dom/server";

interface MapJobMarkerCardData {
  id?: string;
  jobId?: string;
  client: string;
  address: string;
  status?: string;
  value?: number;
  time?: string;
  property?: string;
  productType?: string;
}

function formatMarkerValue(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "AED 0";
  return `AED ${Math.round(value).toLocaleString()}`;
}

function shortMarkerTitle(job: MapJobMarkerCardData) {
  return job.client || job.jobId || "Work Location";
}

function createJobLocationIcon(job: MapJobMarkerCardData, tone: "pending" | "scheduled" | "selected" = "pending") {
  const pinColor = tone === "scheduled" ? "#2563eb" : "#f59e0b";
  const titleColor = tone === "scheduled" ? "#60a5fa" : "#facc15";
  const html = renderToStaticMarkup(
    <div style={{ position: "relative", width: "236px", height: "138px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" }}>
      <div style={{ width: "224px", borderRadius: "22px", background: "#0f172a", color: "white", boxShadow: "0 18px 38px rgba(15,23,42,0.28)", padding: "14px 16px 13px", border: "1px solid rgba(148,163,184,0.16)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: titleColor, fontSize: "14px", lineHeight: 1, fontWeight: 950, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round"><path d="m3 10.5 9-7 9 7"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-7h6v7"/></svg>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",fontSize:"12px" }}>{shortMarkerTitle(job)}</span>
        </div>
        <div style={{ height: "1px", background: "rgba(148,163,184,0.20)", margin: "12px 0 11px" }} />
        <div style={{ color: "#cbd5e1", fontSize: "10px", fontWeight: 600, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {job.address || job.client || "Work location"}
        </div>
        <div style={{ marginTop: "13px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <span style={{ borderRadius: "9px", background: "rgba(30,41,59,0.92)", color: "#14b8a6", padding: "6px 10px", fontSize: "11px", fontWeight: 950, letterSpacing: "0.10em", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace" }}>{formatMarkerValue(job.value)}</span>
          <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 800 }}>{job.time || "10:00"}</span>
        </div>
      </div>
      <div style={{ position: "relative", marginTop: "-3px" }}>
        {tone !== "scheduled" && <div style={{ position: "absolute", inset: "-10px", borderRadius: "999px", background: "rgba(245,158,11,0.28)", animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite" }} />}
        <div style={{ width: "20px", height: "20px", borderRadius: "999px", background: pinColor, border: "4px solid white", boxShadow: "0 10px 24px rgba(15,23,42,0.25)" }} />
      </div>
    </div>
  );
  return L.divIcon({
    html,
    className: "job-location-card-marker",
    iconSize: [236, 138],
    iconAnchor: [118, 132],
    popupAnchor: [0, -126],
    tooltipAnchor: [0, -126],
  });
}

function MapZoomTracker({ onChange }: { onChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend() {
      onChange(map.getZoom());
    },
  });
  useEffect(() => {
    onChange(map.getZoom());
  }, [map, onChange]);
  return null;
}

type MapLayerKey = "salesmen" | "scheduled" | "leads" | "routes";

type MapToolbarActions = {
  fitToView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
};

function MapToolbarController({
  boundsPoints,
  onReady,
}: {
  boundsPoints: [number, number][];
  onReady: (actions: MapToolbarActions) => void;
}) {
  const map = useMap();

  useEffect(() => {
    onReady({
      fitToView: () => {
        const validPoints = boundsPoints.filter(
          (point) => Number.isFinite(point[0]) && Number.isFinite(point[1])
        );
        if (validPoints.length > 1) {
          map.flyToBounds(L.latLngBounds(validPoints), {
            padding: [90, 90],
            maxZoom: 14,
            duration: 0.9,
          });
          return;
        }
        map.flyTo(validPoints[0] ?? EASYBLINDS_HQ.position, 11, { duration: 0.9 });
      },
      zoomIn: () => map.zoomIn(),
      zoomOut: () => map.zoomOut(),
    });
  }, [boundsPoints, map, onReady]);

  return null;
}

interface SalesmanMapProps {
  fitters: Fitter[];
  selectedFitterId: string | null;
  onSelectFitter: (id: string | null) => void;
  filterRole?: "Salesman" | "Fitter";
  selectedJob?: (MapJobMarkerCardData & {
    location: { lat: number; lng: number };
  }) | null;
  showOnlyMeasuring?: boolean;
  unassignedJobs?: (MapJobMarkerCardData & {
    location: { lat: number; lng: number };
  })[];
  scheduledJobs?: (MapJobMarkerCardData & {
    location: { lat: number; lng: number };
    assignedSalesmanId?: string;
  })[];
  hideStatusPanel?: boolean;
}

export default function SalesmanMap({
  fitters,
  selectedFitterId,
  onSelectFitter,
  filterRole: _unusedFilterRole,
  selectedJob,
  showOnlyMeasuring = false,
  unassignedJobs = [],
  scheduledJobs = [],
  hideStatusPanel = false,
}: SalesmanMapProps) {
  const filterRole = "Salesman";
  const {
    locations: liveLocations,
    isLoaded: liveLocationsLoaded,
    isConnected: socketConnected,
    error: liveLocationError,
    reload: reloadLiveLocations,
  } = useLiveLocation();

  // Socket.IO pushes are the real-time source of truth.
  // The 30s poll has been removed — it was resetting isLoaded on every
  // interval, causing full marker re-renders that interrupted animations.
  // Reconnect-triggered reloads in useLiveLocation handle missed updates.


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

        .route-eta-badge-tooltip {
          background: rgba(15, 23, 42, 0.9) !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          padding: 3px 6px !important;
          border-radius: 6px !important;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2) !important;
          pointer-events: none !important;
          white-space: nowrap !important;
        }

        .customer-dest-tooltip {
          font-weight: 700 !important;
          color: #1e293b !important;
          background: rgba(255, 255, 255, 0.95) !important;
          border: 1px solid rgba(15, 23, 42, 0.08) !important;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12) !important;
          padding: 3px 6px !important;
          border-radius: 6px !important;
          white-space: nowrap !important;
        }

        .status-panel-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .status-panel-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .status-panel-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .status-panel-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const [zoomLevel, setZoomLevel] = useState(11);
  const [telemetryMap, setTelemetryMap] = useState<Record<string, { distance: string; eta: string }>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [mapToolbarActions, setMapToolbarActions] = useState<MapToolbarActions | null>(null);
  const [visibleMapLayers, setVisibleMapLayers] = useState<Record<MapLayerKey, boolean>>({
    salesmen: true,
    scheduled: true,
    leads: true,
    routes: true,
  });

  const toggleMapLayer = useCallback((layer: MapLayerKey) => {
    setVisibleMapLayers((current) => ({
      ...current,
      [layer]: !current[layer],
    }));
  }, []);

  const handleMapToolbarReady = useCallback((actions: MapToolbarActions) => {
    setMapToolbarActions(actions);
  }, []);

  const handleTelemetryUpdate = useCallback((markerId: string, distance: string, eta: string) => {
    setTelemetryMap((prev) => {
      const existing = prev[markerId];
      if (existing && existing.distance === distance && existing.eta === eta) {
        return prev;
      }
      return {
        ...prev,
        [markerId]: { distance, eta },
      };
    });
  }, []);

  const markers = useMemo(() => {
    let allMarkers = buildMapMarkers(fitters, liveLocations, filterRole);
    if (showOnlyMeasuring) {
      allMarkers = allMarkers.filter(
        (marker) => marker.status === "Measuring" || marker.status === "Working"
      );
    }
    return allMarkers;
  }, [fitters, liveLocations, filterRole, showOnlyMeasuring]);
  const selectedMarker = markers.find((marker) => marker.id === selectedFitterId);
  const companyMarkerIcon = useMemo(() => createCompanyMarkerIcon(), []);

  const salesmenMarkers = useMemo(() => {
    const allSalesmen = buildMapMarkers(fitters, liveLocations, "Salesman");
    const statusPriority: Record<string, number> = {
      "On The Way": 1,
      "Measuring": 2,
      "Working": 2,
      "Available": 3,
      "Offline": 4,
    };
    return allSalesmen.sort((a, b) => {
      const pA = statusPriority[a.status] ?? 99;
      const pB = statusPriority[b.status] ?? 99;
      if (pA !== pB) return pA - pB;
      return a.name.localeCompare(b.name);
    });
  }, [fitters, liveLocations]);

  const filteredSalesmen = useMemo(() => {
    if (!searchQuery) return salesmenMarkers;
    const lower = searchQuery.toLowerCase();
    return salesmenMarkers.filter((s) => s.name.toLowerCase().includes(lower));
  }, [salesmenMarkers, searchQuery]);

  const mapBoundsPoints = useMemo<[number, number][]>(() => {
    const points: [number, number][] = [EASYBLINDS_HQ.position];
    markers.forEach((marker) => {
      points.push(marker.position);
      if (marker.destinationCoordinates) {
        points.push(marker.destinationCoordinates);
      }
    });
    scheduledJobs.forEach((job) => points.push([job.location.lat, job.location.lng]));
    unassignedJobs.forEach((job) => points.push([job.location.lat, job.location.lng]));
    if (selectedJob) {
      points.push([selectedJob.location.lat, selectedJob.location.lng]);
    }
    return points;
  }, [markers, scheduledJobs, selectedJob, unassignedJobs]);

  const liveSalesmanCount = markers.filter((marker) => marker.role === "Salesman").length;

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
        <MapZoomTracker onChange={setZoomLevel} />
        <MapToolbarController boundsPoints={mapBoundsPoints} onReady={handleMapToolbarReady} />

        <Marker position={EASYBLINDS_HQ.position} icon={companyMarkerIcon} zIndexOffset={500}>
          <Tooltip permanent={zoomLevel >= 10} direction="top" offset={[0, -34]} opacity={1} className="bg-white/95 border border-orange-200 shadow-md rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-900">
            EasyBlinds HQ
          </Tooltip>
          <Popup closeButton={false}>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="text-sm font-bold text-slate-900">EasyBlinds HQ</div>
              <div>Nilambur, Kerala</div>
            </div>
          </Popup>
        </Marker>

        {visibleMapLayers.salesmen && (
          <LiveMarkersList
            markers={markers}
            selectedJob={selectedJob}
            selectedFitterId={selectedFitterId}
            onSelectFitter={onSelectFitter}
            zoomLevel={zoomLevel}
          />
        )}

        {/* Render Scheduled Jobs (Appointments Tab) */}
        {visibleMapLayers.scheduled && scheduledJobs && scheduledJobs.map((job) => {
          const salesmanMarker = job.assignedSalesmanId
            ? markers.find(m => m.id === job.assignedSalesmanId)
            : null;

          return (
            <React.Fragment key={`sched-job-group-${job.id}`}>
              <Marker
                position={[job.location.lat, job.location.lng]}
                icon={createJobLocationIcon(job, "scheduled")}
              >
                <Popup>
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-slate-900">{job.client}</div>
                    {job.jobId && (
                      <div className="font-mono text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 inline-block">
                        {job.jobId}
                      </div>
                    )}
                    <div className="text-slate-500">{job.address}</div>
                  </div>
                </Popup>
              </Marker>

              {visibleMapLayers.routes && salesmanMarker && (
                <RoutingPolyline
                  key={`sched-route-${job.id}-${salesmanMarker.id}`}
                  markerId={salesmanMarker.id}
                  start={salesmanMarker.position}
                  end={[job.location.lat, job.location.lng]}
                  zoomLevel={zoomLevel}
                  onTelemetryUpdate={handleTelemetryUpdate}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Render Unassigned Leads (Leads Tab) */}
        {visibleMapLayers.leads && unassignedJobs && unassignedJobs.map((job) => (
          <Marker
            key={`unassigned-job-${job.id}`}
            position={[job.location.lat, job.location.lng]}
            icon={createJobLocationIcon(job, "pending")}
          >
            <Popup>
              <div className="space-y-1 text-xs">
                <div className="font-bold text-slate-900">{job.client}</div>
                {job.jobId && (
                  <div className="font-mono text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 inline-block">
                    {job.jobId}
                  </div>
                )}
                <div className="text-slate-500">{job.address}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Selected Job Marker (Pending Dispatch Selection) */}
        {selectedJob && (
          <>
            <Marker position={[selectedJob.location.lat, selectedJob.location.lng]} icon={createJobLocationIcon(selectedJob, "selected")}>

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
            {visibleMapLayers.routes && markers.map((marker) => (
              <RoutingPolyline
                key={`selected-route-${marker.id}`}
                markerId={marker.id}
                start={marker.position}
                end={[selectedJob.location.lat, selectedJob.location.lng]}
                zoomLevel={zoomLevel}
                routeColor={getMarkerRouteColor(marker)}
                motionColor={getMarkerMotionColor(marker)}
              />
            ))}
          </>
        )}

        {/* Automatic Active Salesman Destinations and Routes */}
        {visibleMapLayers.routes && markers
          .filter(marker => marker.role === "Salesman" &&
                             marker.destinationCoordinates &&
                             (isOnTheWayStatus(marker.activeJobStatus) ||
                              (marker.status as string) === "On The Way" ||
                              (marker.status as string) === "On Road" ||
                              (marker.status as string) === "In Progress" ||
                              (marker.status as string) === "In progress" ||
                              (marker.status as string) === "Measuring" ||
                              (marker.status as string) === "Working")
          )
          .map((marker) => {
            const dest = marker.destinationCoordinates!;
            return (
              <React.Fragment key={`dest-route-group-${marker.id}`}>
                <RoutingPolyline
                  markerId={marker.id}
                  start={marker.position}
                  end={dest}
                  zoomLevel={zoomLevel}
                  routeColor={getMarkerRouteColor(marker)}
                  motionColor={getMarkerMotionColor(marker)}
                  onTelemetryUpdate={handleTelemetryUpdate}
                />

                {zoomLevel >= 11 && (
                  <Marker position={dest} icon={createJobLocationIcon({ id: marker.activeJobId, jobId: marker.activeJobId, client: marker.customerName || "Customer", address: marker.customerAddress || "Work location", time: "10:00" }, "scheduled")} zIndexOffset={400}>
                    <Popup>
                      <div className="space-y-1 text-xs">
                        <div className="font-bold">{marker.customerName || "Customer"}</div>
                        {marker.activeJobId && (
                          <div className="font-mono text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 inline-block">
                            {marker.activeJobId}
                          </div>
                        )}
                        <div className="text-slate-500">{marker.customerAddress}</div>
                        {marker.customerPhone && (
                          <div className="text-slate-500">Phone: {marker.customerPhone}</div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )}
              </React.Fragment>
            );
          })}
      </MapContainer>

      <div className="absolute left-1/2 top-5 z-[1000] flex -translate-x-1/2 items-center gap-1 rounded-full border border-slate-200/70 bg-white/90 p-1 shadow-2xl shadow-slate-900/10 ring-1 ring-black/5 backdrop-blur-md w-max">
        <button
          type="button"
          onClick={() => toggleMapLayer("salesmen")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-bold transition-all",
            visibleMapLayers.salesmen ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          )}
          title="Toggle live salesman markers"
        >
          <Navigation className="h-3.5 w-3.5" />
          Live Fleet
          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px]", visibleMapLayers.salesmen ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500")}>{liveSalesmanCount}</span>
        </button>
        <button
          type="button"
          onClick={() => toggleMapLayer("scheduled")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-bold transition-all",
            visibleMapLayers.scheduled ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          )}
          title="Toggle scheduled appointment markers"
        >
          <Compass className="h-3.5 w-3.5" />
          Appointments
          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px]", visibleMapLayers.scheduled ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500")}>{scheduledJobs.length}</span>
        </button>
        <button
          type="button"
          onClick={() => toggleMapLayer("leads")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-bold transition-all",
            visibleMapLayers.leads ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          )}
          title="Toggle unassigned lead markers"
        >
          <MapPin className="h-3.5 w-3.5" />
          Unassigned
          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px]", visibleMapLayers.leads ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500")}>{unassignedJobs.length}</span>
        </button>
        <div className="mx-1 h-6 w-px bg-slate-200" />
        <button
          type="button"
          onClick={() => toggleMapLayer("routes")}
          className={cn(
            "rounded-full px-3 py-2 text-[11px] font-bold transition-all",
            visibleMapLayers.routes ? "bg-amber-50 text-amber-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          )}
          title="Toggle route lines"
        >
          Routes
        </button>
        <button
          type="button"
          onClick={() => mapToolbarActions?.fitToView()}
          className="rounded-full bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-700 transition-all hover:bg-slate-200"
          title="Fit all active map points into view"
        >
          Fit View
        </button>
        <div className="flex items-center overflow-hidden rounded-full border border-slate-200 bg-white">
          <button type="button" onClick={() => mapToolbarActions?.zoomOut()} className="px-2.5 py-1.5 text-sm font-bold text-slate-500 hover:bg-slate-50" title="Zoom out">−</button>
          <button type="button" onClick={() => mapToolbarActions?.zoomIn()} className="border-l border-slate-200 px-2.5 py-1.5 text-sm font-bold text-slate-500 hover:bg-slate-50" title="Zoom in">+</button>
        </div>
      </div>

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

      {/* Live Field Status Panel */}
      <div className={cn(
        "absolute bottom-16 right-4 z-[1000] flex w-80 md:w-96 flex-col rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-2xl backdrop-blur-md text-slate-800 transition-all duration-200 ring-1 ring-black/5",
        hideStatusPanel && "hidden"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase">Live Field Status</h3>
            </div>
            <p className="text-[9px] text-slate-400 mt-0.5 tracking-wide font-semibold">
              {salesmenMarkers.filter(s => s.status === "Available").length} Avail •{' '}
              {salesmenMarkers.filter(s => s.status === "On The Way").length} Way •{' '}
              {salesmenMarkers.filter(s => s.status === "Measuring" || s.status === "Working").length} Meas •{' '}
              {salesmenMarkers.filter(s => s.status === "Offline").length} Off
            </p>
          </div>
          <button
            onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title={isPanelCollapsed ? "Expand Panel" : "Collapse Panel"}
          >
            {isPanelCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {!isPanelCollapsed && (
          <div className="mt-2.5 flex flex-col flex-1 min-h-0 space-y-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search salesmen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Salesmen List */}
            <div className="overflow-y-auto pr-1 space-y-2 max-h-[250px] status-panel-scrollbar">
              {filteredSalesmen.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  {searchQuery ? "No matching salesmen found." : "No salesmen currently active."}
                </div>
              ) : (
                filteredSalesmen.map((salesman) => {
                  const isSelected = selectedFitterId === salesman.id;
                  
                  // Status Icon Mapping
                  let statusIcon = "🔴";
                  let statusText = "Offline";
                  if (salesman.status === "Available") {
                    statusIcon = "🟢";
                    statusText = "Available";
                  } else if (salesman.status === "On The Way") {
                    statusIcon = "🚗";
                    statusText = "On The Way";
                  } else if (salesman.status === "Measuring" || salesman.status === "Working") {
                    statusIcon = "📏";
                    statusText = "Measuring";
                  }

                  // Fallbacks for telemetry
                  const isTravelling = salesman.status === "On The Way";
                  const dest = salesman.destinationCoordinates;
                  let distStr = "";
                  let etaStr = "";
                  
                  if (isTravelling && dest) {
                    const fallbackDistance = distanceKm(salesman.position, dest);
                    const fallbackEta = estimateEtaMinutes(fallbackDistance);
                    distStr = telemetryMap[salesman.id]?.distance || `~${formatDistance(fallbackDistance)}`;
                    etaStr = telemetryMap[salesman.id]?.eta || formatEta(fallbackEta);
                  }

                  return (
                    <div
                      key={salesman.id}
                      onClick={() => {
                        onSelectFitter(salesman.id);
                      }}
                      className={cn(
                        "group flex flex-col rounded-xl p-2.5 cursor-pointer border transition-all duration-150",
                        isSelected
                          ? "bg-blue-50/40 border-blue-200/80 shadow-[0_2px_8px_rgba(59,130,246,0.05)]"
                          : "bg-white/60 border-slate-100 hover:bg-slate-50/50 hover:border-slate-200/80"
                      )}
                    >
                      {/* First line: status indicator, name */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                          <span>{statusIcon}</span>
                          <span className="group-hover:text-blue-600 transition-colors uppercase tracking-wide">{salesman.name}</span>
                        </span>
                        
                        {/* Speed indication for moving salesmen */}
                        {isTravelling && salesman.speed !== undefined && salesman.speed > 0 && (
                          <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 flex items-center gap-1">
                            <Navigation className="h-2.5 w-2.5 text-blue-500 rotate-[45deg]" />
                            {formatSpeed(salesman.speed)}
                          </span>
                        )}
                      </div>

                      {/* Second line and third line depending on status */}
                      <div className="mt-1.5 text-[10px] text-slate-500">
                        {salesman.status === "Available" && (
                          <div className="pl-5 space-y-0.5">
                            <div className="font-semibold text-emerald-600">{statusText}</div>
                            <div className="text-slate-400 truncate max-w-[280px] flex items-center gap-1">
                              <MapPin className="h-2.5 w-2.5 text-slate-300 shrink-0" />
                              <span className="truncate">{salesman.locationLabel || `Coordinates: ${salesman.position[0].toFixed(4)}, ${salesman.position[1].toFixed(4)}`}</span>
                            </div>
                          </div>
                        )}
                        
                        {isTravelling && (
                          <>
                            <div className="text-xs md:text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-wide truncate block mt-1 pl-5">
                              → {(salesman.customerName || "Customer").toUpperCase()}
                            </div>
                            <div className="text-[10px] font-medium text-slate-500 space-y-0.5 mt-1 pl-5">
                              <div>Distance: <span className="font-bold font-mono text-slate-700">{distStr}</span></div>
                              <div>ETA: <span className="font-bold font-mono text-slate-700">{etaStr}</span></div>
                            </div>
                          </>
                        )}

                        {(salesman.status === "Measuring" || salesman.status === "Working") && (
                          <>
                            <div className="text-xs md:text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-wide truncate block mt-1 pl-5">
                              → {(salesman.customerName || "Customer").toUpperCase()}
                            </div>
                            <div className="font-semibold text-blue-600 pl-5 text-[10px] mt-0.5">
                              Measuring
                            </div>
                          </>
                        )}

                        {salesman.status === "Offline" && (
                          <div className="font-semibold text-slate-400 pl-5">{statusText}</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* <DiagnosticsPanel
        socketConnected={socketConnected}
        activeMarkersCount={markers.length}
        markers={markers}
      /> */}
    </div>
  );
}
