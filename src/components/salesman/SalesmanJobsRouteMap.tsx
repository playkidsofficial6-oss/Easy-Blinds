"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { createCompanyMarkerIcon, EASYBLINDS_HQ } from "@/components/tracking/map-icons";

export interface SalesmanRouteMapJob {
  id: string;
  jobId?: string;
  shortRef: string;
  time: string;
  client: string;
  address: string;
  customerPhone?: string;
  status: string;
  coordinates: [number, number];
}

interface SalesmanJobsRouteMapProps {
  jobs: SalesmanRouteMapJob[];
  selectedJobId: string | null;
  currentPosition?: [number, number] | null;
  routeEnabled?: boolean;
  interactive?: boolean;
  scrollWheelZoom?: boolean;
  onSelectJob?: (jobId: string) => void;
}

const defaultCenter: [number, number] = [25.20, 55.27];

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("progress")) return { color: "#2563eb", label: "Measuring" };
  if (normalized.includes("way")) return { color: "#f59e0b", label: "On route" };
  if (normalized.includes("done") || normalized.includes("complete")) return { color: "#10b981", label: "Done" };
  return { color: "#0f172a", label: "Pending" };
}

function createSalesmanJobIcon(job: SalesmanRouteMapJob, index: number, selected: boolean) {
  const tone = statusTone(job.status);
  const width = selected ? 178 : 168;
  const cardWidth = width - 10;
  const height = 92;
  const pinLeft = Math.round(cardWidth / 2) - 6;
  const shadow = selected ? "0 16px 32px rgba(15,23,42,0.30)" : "0 12px 24px rgba(15,23,42,0.22)";
  const border = selected ? "1.5px solid #f59e0b" : "1px solid rgba(148,163,184,0.20)";
  const actionLabel = selected ? "Selected" : "Route";
  const html = `
    <div style="position:relative;width:${width}px;height:${height}px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">
      <div style="width:${cardWidth}px;border-radius:16px;background:#0f172a;color:white;box-shadow:${shadow};padding:9px 10px 8px;border:${border};">
        <div style="display:flex;align-items:flex-start;gap:7px;">
          <div style="height:22px;width:22px;min-width:22px;border-radius:999px;background:${tone.color};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:white;border:2px solid rgba(255,255,255,0.9);line-height:1;">${index + 1}</div>
          <div style="min-width:0;flex:1;">
            <div style="font-size:11px;line-height:1.1;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#f8fafc;">${escapeHtml(job.client || "Customer")}</div>
            <div style="font-size:8px;line-height:1.2;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:#94a3b8;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(tone.label)} • ${escapeHtml(job.time || "Route")}</div>
          </div>
        </div>
        <div style="font-size:8.5px;line-height:1.25;color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:6px 0 7px;">${escapeHtml(job.address || "Customer location")}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
          <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,monospace;font-size:8px;font-weight:850;color:#fde68a;background:rgba(245,158,11,.10);border:1px solid rgba(245,158,11,.20);border-radius:7px;padding:3px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:92px;">${escapeHtml(job.jobId || job.shortRef)}</span>
          <span style="font-size:8px;font-weight:850;color:${selected ? "#fbbf24" : "#94a3b8"};letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;">${actionLabel}</span>
        </div>
      </div>
      <div style="position:absolute;left:${pinLeft}px;bottom:0;width:14px;height:14px;border-radius:999px;background:${tone.color};border:3px solid white;box-shadow:0 8px 18px rgba(15,23,42,.24);"></div>
    </div>`;
  return L.divIcon({
    html,
    className: "salesman-route-job-marker",
    iconSize: [width, height],
    iconAnchor: [Math.round(cardWidth / 2), height - 2],
    popupAnchor: [0, -height + 6],
    tooltipAnchor: [0, -height + 6],
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const salesmanIcon = typeof window !== "undefined" ? L.divIcon({
  html: `<div style="position:relative;height:26px;width:26px;"><span style="position:absolute;inset:0;border-radius:999px;background:rgba(37,99,235,.28);animation:ping 1.8s cubic-bezier(0,0,.2,1) infinite;"></span><span style="position:absolute;inset:4px;border-radius:999px;background:#2563eb;border:3px solid white;box-shadow:0 10px 24px rgba(37,99,235,.35);"></span></div>`,
  className: "salesman-live-marker",
  iconSize: [26, 26],
  iconAnchor: [13, 13],
}) : null;

function MapBounds({ points, selected }: { points: [number, number][]; selected?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    const valid = points.filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]));
    if (valid.length > 1) {
      map.fitBounds(L.latLngBounds(valid), { padding: [64, 64], maxZoom: 14 });
      return;
    }
    if (selected) {
      map.setView(selected, 14);
    }
  }, [map, points, selected]);
  return null;
}

function validRoutePoints(points: [number, number][]) {
  return points.filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]));
}

function pointsKey(points: [number, number][]) {
  return points.map(([lat, lng]) => `${lat.toFixed(6)},${lng.toFixed(6)}`).join("|");
}

async function fetchShortestRoadPath(points: [number, number][]): Promise<[number, number][]> {
  const valid = validRoutePoints(points);
  if (valid.length < 2) return valid;

  const coordinates = valid.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&alternatives=false&steps=false`,
    { cache: "no-store" }
  );

  if (!response.ok) throw new Error(`Road route request failed with ${response.status}`);

  const data = await response.json() as {
    routes?: Array<{ geometry?: { coordinates?: Array<[number, number]> } }>;
  };
  const routeCoordinates = data.routes?.[0]?.geometry?.coordinates;
  if (!routeCoordinates?.length) throw new Error("Road route response did not include geometry");

  return routeCoordinates.map(([lng, lat]) => [lat, lng]);
}

export default function SalesmanJobsRouteMap({
  jobs,
  selectedJobId,
  currentPosition,
  routeEnabled = true,
  interactive = true,
  scrollWheelZoom = false,
  onSelectJob,
}: SalesmanJobsRouteMapProps) {
  useEffect(() => {
    if (typeof document === "undefined" || document.getElementById("salesman-route-map-styles")) return;
    const style = document.createElement("style");
    style.id = "salesman-route-map-styles";
    style.innerHTML = `
      @keyframes ping { 75%, 100% { transform: scale(1.8); opacity: 0; } }
      .salesman-route-job-marker, .salesman-live-marker, .company-hq-marker { background: transparent !important; border: 0 !important; overflow: visible !important; }
      .salesman-route-tooltip { background: rgba(15,23,42,.92) !important; color: #fff !important; border: 0 !important; border-radius: 999px !important; font-size: 10px !important; font-weight: 900 !important; letter-spacing: .08em !important; text-transform: uppercase !important; box-shadow: 0 10px 24px rgba(15,23,42,.22) !important; }
      .salesman-route-tooltip::before { display: none !important; }
    `;
    document.head.appendChild(style);
  }, []);

  const selectedJob = useMemo(() => jobs.find((job) => job.id === selectedJobId) ?? jobs[0], [jobs, selectedJobId]);
  const hqIcon = useMemo(() => createCompanyMarkerIcon(), []);
  const center = selectedJob?.coordinates ?? currentPosition ?? defaultCenter;
  const allPoints = useMemo<[number, number][]>(() => {
    const points = jobs.map((job) => job.coordinates).filter(Boolean);
    if (currentPosition) points.unshift(currentPosition);
    points.unshift(EASYBLINDS_HQ.position);
    return points.length ? points : [defaultCenter];
  }, [jobs, currentPosition]);
  const routePath = useMemo<[number, number][]>(() => {
    if (!routeEnabled || !selectedJob) return [];
    if (currentPosition) return [currentPosition, selectedJob.coordinates];
    return [selectedJob.coordinates];
  }, [currentPosition, routeEnabled, selectedJob]);
  const routeSequencePath = useMemo<[number, number][]>(() => jobs.map((job) => job.coordinates), [jobs]);
  const [selectedRoadPath, setSelectedRoadPath] = useState<[number, number][]>([]);
  const [sequenceRoadPath, setSequenceRoadPath] = useState<[number, number][]>([]);
  const selectedRouteKey = useMemo(() => pointsKey(routePath), [routePath]);
  const sequenceRouteKey = useMemo(() => pointsKey(routeSequencePath), [routeSequencePath]);

  useEffect(() => {
    let cancelled = false;
    setSelectedRoadPath([]);
    const valid = validRoutePoints(routePath);
    if (valid.length < 2) return;

    fetchShortestRoadPath(valid)
      .then((roadPath) => {
        if (!cancelled) setSelectedRoadPath(roadPath);
      })
      .catch(() => {
        if (!cancelled) setSelectedRoadPath(valid);
      });

    return () => { cancelled = true; };
  }, [selectedRouteKey, routePath]);

  useEffect(() => {
    let cancelled = false;
    setSequenceRoadPath([]);
    const valid = validRoutePoints(routeSequencePath);
    if (valid.length < 2) return;

    fetchShortestRoadPath(valid)
      .then((roadPath) => {
        if (!cancelled) setSequenceRoadPath(roadPath);
      })
      .catch(() => {
        if (!cancelled) setSequenceRoadPath(valid);
      });

    return () => { cancelled = true; };
  }, [routeSequencePath, sequenceRouteKey]);

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={scrollWheelZoom}
        zoomControl={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
        className="h-full w-full"
        style={{ background: "#eef2f7" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MapBounds points={allPoints} selected={selectedJob?.coordinates} />

        {jobs.map((job, index) => {
          const isSelected = job.id === selectedJob?.id;
          return (
            <Marker
              key={job.id}
              position={job.coordinates}
              icon={createSalesmanJobIcon(job, index, isSelected)}
              zIndexOffset={isSelected ? 900 : 300 + index}
              eventHandlers={{ click: () => onSelectJob?.(job.id) }}
            >
              <Tooltip permanent={isSelected} direction="top" offset={[0, -92]} className="salesman-route-tooltip">
                {isSelected ? "Current route target" : `Point ${index + 1}`}
              </Tooltip>
              <Popup>
                <div className="space-y-2 text-xs min-w-[210px]">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{job.client}</div>
                    <div className="font-mono text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 inline-block mt-1">{job.jobId || job.shortRef}</div>
                  </div>
                  <div className="text-slate-500 leading-snug">{job.address}</div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-100 pt-2">
                    <span>{job.time}</span>
                    <span>{job.status}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <Marker position={EASYBLINDS_HQ.position} icon={hqIcon} zIndexOffset={250}>
          <Popup>
            <div className="space-y-1 text-xs min-w-[150px]">
              <div className="font-bold text-slate-900">{EASYBLINDS_HQ.name}</div>
              <div className="text-slate-500">{EASYBLINDS_HQ.address}</div>
            </div>
          </Popup>
        </Marker>

        {currentPosition && salesmanIcon && (
          <Marker position={currentPosition} icon={salesmanIcon} zIndexOffset={1200}>
            <Popup><div className="text-xs font-semibold p-1">Your live location</div></Popup>
          </Marker>
        )}

        {sequenceRoadPath.length >= 2 && (
          <Polyline
            positions={sequenceRoadPath}
            pathOptions={{ color: "#10b981", weight: 3, opacity: 0.22, dashArray: "4 10", lineCap: "round" }}
          />
        )}

        {selectedRoadPath.length >= 2 && (
          <Polyline
            positions={selectedRoadPath}
            pathOptions={{ color: "#10b981", weight: 6, opacity: 0.92, lineCap: "round", lineJoin: "round" }}
          />
        )}
      </MapContainer>
    </div>
  );
}
