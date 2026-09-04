"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  MapPin,
  Phone,
} from "lucide-react";
import {
  Map,
  AdvancedMarker,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import { format, isPast, parse, parseISO } from "date-fns";
import { useLiveLocation } from "@/hooks";
import { cn } from "@/lib/utils";
import type { LiveLocationRecord } from "@/types/live-location";
import { Fitter } from "@/lib/live-store";
import { GoogleMapsProvider } from "../map/GoogleMapsProvider";
import { GoogleMapController, GoogleMapPolyline, LatLng } from "../map/GoogleMapHelpers";
import {
  CompanyHqMarker,
  EASYBLINDS_HQ,
  MARKER_STATUS_CONFIG,
  type LiveMarkerRole,
  type LiveMarkerStatus,
} from "./map-icons";

const OFFLINE_LOCATION_TIMEOUT_MS = 24 * 60 * 60 * 1000;

export interface LiveMapMarker {
  id: string;
  name: string;
  role: LiveMarkerRole;
  status: LiveMarkerStatus;
  position: [number, number];
  avatar?: string;
  phoneNumber?: string;
  lastUpdated: string;
  lastUpdatedAt?: string;
  isLate: boolean;
  isLiveLocation: boolean;
  clusterIndex?: number;
  clusterTotal?: number;
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

function distanceKm(start: [number, number], end: [number, number]): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(end[0] - start[0]);
  const dLng = toRadians(end[1] - start[1]);
  const lat1 = toRadians(start[0]);
  const lat2 = toRadians(end[0]);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateEtaMinutes(distance: number): number {
  return Math.max(1, Math.round((distance / 32) * 60));
}

function isOnTheWayStatus(status?: string): boolean {
  return /on\s*the\s*way|on\s*way|way|travel|ongoing|moving/i.test(status ?? "");
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
  const source = location.updatedAt;
  if (!source) return false;
  const lastUpdatedTime = Date.parse(source);
  if (Number.isNaN(lastUpdatedTime)) return false;
  return now - lastUpdatedTime > OFFLINE_LOCATION_TIMEOUT_MS;
}

function normalizeStatus(status?: string): LiveMarkerStatus {
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
  const lastUpdatedAt = liveLocation?.updatedAt;
  const status = normalizeStatus(fitter.status);
  const position = liveLocation
    ? ([liveLocation.lat, liveLocation.lng] as [number, number])
    : fitter.location;

  if (!position) return null;

  const activeJob =
    fitter.schedule.today.find((j) => j.id === fitter.jobRef) ??
    fitter.schedule.tomorrow.find((j) => j.id === fitter.jobRef) ??
    fitter.schedule.upcoming.find((j) => j.id === fitter.jobRef) ??
    fitter.schedule.today.find((j) => j.status === "On the way" || j.status === "In Progress");

  const destinationCoordinates: [number, number] | undefined =
    activeJob?.coordinates &&
    typeof activeJob.coordinates[0] === "number" &&
    typeof activeJob.coordinates[1] === "number" &&
    (activeJob.coordinates[0] !== 0 || activeJob.coordinates[1] !== 0)
      ? [activeJob.coordinates[0], activeJob.coordinates[1]]
      : undefined;

  return {
    id: fitter.id,
    name: fitter.name,
    role: fitter.role ?? "Fitter",
    status,
    position,
    avatar: fitter.avatar,
    phoneNumber: fitter.phoneNumber,
    lastUpdated: lastUpdatedAt ? toReadableLastUpdated(lastUpdatedAt) : fitter.lastUpdated,
    lastUpdatedAt,
    isLate: isLate(fitter),
    isLiveLocation: Boolean(liveLocation),
    assignedJobCount: assignedJobCount(fitter),
    activeJobId: activeJob?.id || activeJob?.jobId,
    activeJobStatus: activeJob?.status,
    customerName: activeJob?.client,
    customerAddress: activeJob?.address,
    customerPhone: activeJob?.phoneNumber,
    destinationCoordinates,
    locationLabel: fitter.locationLabel,
  };
}

function buildLiveLocationMarker(location: LiveLocationRecord, fitter?: Fitter): LiveMapMarker {
  const lastUpdatedAt = location.updatedAt;
  const userName = location.user?.name ?? `User ${location.userId.slice(-6)}`;
  const userPhone = (location.user as { phoneNumber?: string } | undefined)?.phoneNumber;

  const activeJob = fitter
    ? fitter.schedule.today.find((j) => j.id === fitter.jobRef) ??
      fitter.schedule.tomorrow.find((j) => j.id === fitter.jobRef) ??
      fitter.schedule.upcoming.find((j) => j.id === fitter.jobRef) ??
      fitter.schedule.today.find((j) => j.status === "On the way" || j.status === "In Progress")
    : undefined;

  const destinationCoordinates: [number, number] | undefined =
    activeJob?.coordinates &&
    typeof activeJob.coordinates[0] === "number" &&
    typeof activeJob.coordinates[1] === "number" &&
    (activeJob.coordinates[0] !== 0 || activeJob.coordinates[1] !== 0)
      ? [activeJob.coordinates[0], activeJob.coordinates[1]]
      : undefined;

  return {
    id: location.userId,
    name: userName,
    role: normalizeRole(location.role),
    status: normalizeStatus(location.role),
    position: [location.lat, location.lng],
    phoneNumber: userPhone,
    lastUpdated: toReadableLastUpdated(lastUpdatedAt),
    lastUpdatedAt,
    isLate: false,
    isLiveLocation: true,
    assignedJobCount: fitter ? assignedJobCount(fitter) : 0,
    activeJobId: activeJob?.id || activeJob?.jobId,
    activeJobStatus: activeJob?.status,
    customerName: activeJob?.client,
    customerAddress: activeJob?.address,
    customerPhone: activeJob?.phoneNumber,
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
  const activeLiveLocations = liveLocations.filter((l) => !isTimedOutOffline(l, now));
  const liveMapByUserId = activeLiveLocations.reduce<Record<string, LiveLocationRecord>>(
    (acc, loc) => {
      acc[loc.userId] = loc;
      return acc;
    },
    {}
  );

  const fitterMarkers = fitters
    .map((f) => buildFitterMarker(f, liveMapByUserId[f.id]))
    .filter((m): m is LiveMapMarker => Boolean(m));

  const knownIds = new Set(fitterMarkers.map((m) => m.id));
  const liveOnly = activeLiveLocations
    .filter((l) => !knownIds.has(l.userId))
    .map((l) => {
      const fitter = fitters.find((f) => f.id === l.userId);
      return buildLiveLocationMarker(l, fitter);
    });

  let all = [...fitterMarkers, ...liveOnly];
  if (filterRole) {
    all = all.filter((m) => m.role === filterRole);
  }
  return all;
}

export interface FitterMapProps {
  fitters: Fitter[];
  selectedFitterId: string | null;
  onSelectFitter: (id: string | null) => void;
  filterRole?: "Salesman" | "Fitter";
  selectedJob?: {
    id: string;
    jobId?: string;
    location: { lat: number; lng: number };
    address: string;
    client: string;
  } | null;
  showOnlyMeasuring?: boolean;
  unassignedJobs?: {
    id: string;
    jobId?: string;
    location: { lat: number; lng: number };
    address: string;
    client: string;
  }[];
  scheduledJobs?: {
    id: string;
    jobId?: string;
    location: { lat: number; lng: number };
    address: string;
    client: string;
    status: string;
    assignedSalesmanId?: string;
  }[];
  hideStatusPanel?: boolean;
}

function FitterMapInner({
  fitters,
  selectedFitterId,
  onSelectFitter,
  selectedJob,
  showOnlyMeasuring = false,
  unassignedJobs = [],
  scheduledJobs = [],
  hideStatusPanel = false,
}: FitterMapProps) {
  const { locations: liveLocations } = useLiveLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [selectedInfoWindow, setSelectedInfoWindow] = useState<{
    type: "staff" | "job" | "hq";
    id: string;
    pos: LatLng;
    data?: any;
  } | null>(null);

  const filterRole = "Fitter";

  const markers = useMemo(() => {
    let all = buildMapMarkers(fitters, liveLocations, filterRole);
    if (showOnlyMeasuring) {
      all = all.filter((m) => m.status === "Measuring" || m.status === "Working");
    }
    return all;
  }, [fitters, liveLocations, filterRole, showOnlyMeasuring]);

  const selectedMarker = useMemo(
    () => markers.find((m) => m.id === selectedFitterId) || null,
    [markers, selectedFitterId]
  );

  const filteredStaffList = useMemo(() => {
    if (!searchQuery) return markers;
    const q = searchQuery.toLowerCase();
    return markers.filter((m) => m.name.toLowerCase().includes(q));
  }, [markers, searchQuery]);

  const mapBounds = useMemo<LatLng[]>(() => {
    const points: LatLng[] = [EASYBLINDS_HQ.latLng];
    markers.forEach((m) => points.push({ lat: m.position[0], lng: m.position[1] }));
    if (selectedJob) {
      points.push({ lat: selectedJob.location.lat, lng: selectedJob.location.lng });
    }
    return points;
  }, [markers, selectedJob]);

  const activeRoutePolyline = useMemo<LatLng[] | null>(() => {
    if (selectedMarker?.destinationCoordinates) {
      return [
        { lat: selectedMarker.position[0], lng: selectedMarker.position[1] },
        {
          lat: selectedMarker.destinationCoordinates[0],
          lng: selectedMarker.destinationCoordinates[1],
        },
      ];
    }
    if (selectedJob && selectedMarker) {
      return [
        { lat: selectedMarker.position[0], lng: selectedMarker.position[1] },
        { lat: selectedJob.location.lat, lng: selectedJob.location.lng },
      ];
    }
    return null;
  }, [selectedMarker, selectedJob]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950 rounded-2xl border border-slate-800 shadow-xl flex">
      {/* ── GOOGLE MAP VIEWPORT ── */}
      <div className="flex-1 h-full w-full relative z-0">
        <Map
          defaultCenter={EASYBLINDS_HQ.latLng}
          defaultZoom={11}
          mapId="fitter_assignments_map_v1"
          disableDefaultUI={false}
          gestureHandling="greedy"
          className="w-full h-full"
        >
          <GoogleMapController bounds={mapBounds} />

          {/* EasyBlinds HQ Marker */}
          <AdvancedMarker
            position={EASYBLINDS_HQ.latLng}
            onClick={() =>
              setSelectedInfoWindow({
                type: "hq",
                id: "hq",
                pos: EASYBLINDS_HQ.latLng,
              })
            }
          >
            <CompanyHqMarker />
          </AdvancedMarker>

          {/* Active Route Line */}
          {activeRoutePolyline && (
            <>
              <GoogleMapPolyline
                path={activeRoutePolyline}
                strokeColor="#9333ea"
                strokeOpacity={0.3}
                strokeWeight={7}
              />
              <GoogleMapPolyline
                path={activeRoutePolyline}
                strokeColor="#a855f7"
                strokeOpacity={0.9}
                strokeWeight={4}
                dashed
              />
            </>
          )}

          {/* Fitters Markers */}
          {markers.map((marker) => {
            const isSelected = selectedFitterId === marker.id;
            const statusConf = MARKER_STATUS_CONFIG[marker.status] || MARKER_STATUS_CONFIG.Offline;

            return (
              <AdvancedMarker
                key={`fitter-${marker.id}`}
                position={{ lat: marker.position[0], lng: marker.position[1] }}
                onClick={() => {
                  onSelectFitter(marker.id);
                  setSelectedInfoWindow({
                    type: "staff",
                    id: marker.id,
                    pos: { lat: marker.position[0], lng: marker.position[1] },
                    data: marker,
                  });
                }}
                title={marker.name}
              >
                <div
                  className={cn(
                    "relative flex items-center justify-center cursor-pointer transition-transform duration-200",
                    isSelected ? "scale-120 z-50" : "hover:scale-110"
                  )}
                  style={{ width: "48px", height: "48px" }}
                >
                  {marker.status !== "Offline" && (
                    <div
                      className="absolute inset-1 rounded-full animate-ping opacity-70 pointer-events-none"
                      style={{ backgroundColor: statusConf.ringColor }}
                    />
                  )}
                  <div
                    className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg transition-all"
                    style={{
                      border: `3px solid ${statusConf.color}`,
                      boxShadow: isSelected
                        ? `0 0 0 4px ${statusConf.ringColor}, 0 8px 16px rgba(15, 23, 42, 0.3)`
                        : "0 4px 10px rgba(15, 23, 42, 0.18)",
                    }}
                  >
                    <span className="text-slate-900 text-xs font-black">
                      {marker.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() || "FT"}
                    </span>
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Scheduled / Unassigned Job Markers */}
          {[...scheduledJobs, ...unassignedJobs].map((job) => {
            const isSelected = selectedJob?.id === job.id;
            return (
              <AdvancedMarker
                key={`job-${job.id}`}
                position={{ lat: job.location.lat, lng: job.location.lng }}
                onClick={() =>
                  setSelectedInfoWindow({
                    type: "job",
                    id: job.id,
                    pos: { lat: job.location.lat, lng: job.location.lng },
                    data: job,
                  })
                }
              >
                <div
                  className={cn(
                    "relative flex items-center justify-center cursor-pointer transition-transform",
                    isSelected ? "scale-125 z-50" : "hover:scale-110"
                  )}
                  style={{ width: "40px", height: "40px" }}
                >
                  <div className="relative w-8 h-8 rounded-lg bg-purple-600 border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-[11px]">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* InfoWindow */}
          {selectedInfoWindow && (
            <InfoWindow
              position={selectedInfoWindow.pos}
              onCloseClick={() => setSelectedInfoWindow(null)}
            >
              <div className="p-2 text-slate-900 font-sans min-w-[200px] max-w-[280px] space-y-1.5">
                {selectedInfoWindow.type === "hq" && (
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">EasyBlinds HQ</h4>
                    <p className="text-xs text-slate-500">Nilambur, Kerala</p>
                  </div>
                )}

                {selectedInfoWindow.type === "staff" && selectedInfoWindow.data && (
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
                      <span className="font-bold text-xs text-slate-900">
                        {selectedInfoWindow.data.name}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                        {selectedInfoWindow.data.status}
                      </span>
                    </div>
                    {selectedInfoWindow.data.phoneNumber && (
                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <a href={`tel:${selectedInfoWindow.data.phoneNumber}`} className="text-purple-600 hover:underline">
                          {selectedInfoWindow.data.phoneNumber}
                        </a>
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500 mt-1">
                      Assigned: {selectedInfoWindow.data.assignedJobCount} jobs
                    </p>
                  </div>
                )}

                {selectedInfoWindow.type === "job" && selectedInfoWindow.data && (
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
                      <span className="font-bold text-xs text-slate-900">
                        {selectedInfoWindow.data.client || "Job"}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-purple-700 bg-purple-50 px-1 py-0.2 rounded">
                        {selectedInfoWindow.data.jobId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-snug">
                      {selectedInfoWindow.data.address}
                    </p>
                  </div>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>
      </div>

      {/* ── COLLAPSIBLE FITTER STATUS PANEL ── */}
      {!hideStatusPanel && (
        <div
          className={cn(
            "h-full bg-slate-900 border-l border-slate-800 z-10 transition-all duration-300 flex flex-col shrink-0 shadow-2xl",
            isPanelCollapsed ? "w-12" : "w-80"
          )}
        >
          {/* Header */}
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            {!isPanelCollapsed && (
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Fitters Fleet ({markers.length})
                </h3>
                <p className="text-[10px] text-slate-400">Live positions & status</p>
              </div>
            )}
            <button
              onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white mx-auto"
              title={isPanelCollapsed ? "Expand Panel" : "Collapse Panel"}
            >
              {isPanelCollapsed ? <ChevronDown className="w-4 h-4 -rotate-90" /> : <ChevronDown className="w-4 h-4 rotate-90" />}
            </button>
          </div>

          {!isPanelCollapsed && (
            <>
              {/* Search */}
              <div className="p-2 border-b border-slate-800">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search fitter..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-8 pl-8 pr-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Staff List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {filteredStaffList.map((staff) => {
                  const isSelected = selectedFitterId === staff.id;
                  const statusConf = MARKER_STATUS_CONFIG[staff.status] || MARKER_STATUS_CONFIG.Offline;

                  return (
                    <div
                      key={staff.id}
                      onClick={() => onSelectFitter(staff.id)}
                      className={cn(
                        "p-2.5 rounded-xl border cursor-pointer transition-all",
                        isSelected
                          ? "bg-purple-950/40 border-purple-500/50 shadow-md"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: statusConf.color }}
                          />
                          <span className="font-bold text-xs text-white truncate max-w-[130px]">
                            {staff.name}
                          </span>
                        </div>
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.2 rounded"
                          style={{
                            backgroundColor: `${statusConf.color}20`,
                            color: statusConf.color,
                          }}
                        >
                          {staff.status}
                        </span>
                      </div>

                      {staff.customerName && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400">
                          <span className="text-slate-500">Destination: </span>
                          <span className="text-slate-300 font-semibold">{staff.customerName}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function FitterMap(props: FitterMapProps) {
  return (
    <GoogleMapsProvider fallbackHeight="100%">
      <FitterMapInner {...props} />
    </GoogleMapsProvider>
  );
}
