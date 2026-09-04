"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Map,
  AdvancedMarker,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import { GoogleMapsProvider } from "../map/GoogleMapsProvider";
import { GoogleMapController, GoogleMapPolyline, LatLng } from "../map/GoogleMapHelpers";
import { CompanyHqMarker, EASYBLINDS_HQ } from "@/components/tracking/map-icons";

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

const defaultCenter: LatLng = { lat: 25.2, lng: 55.27 };

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("progress")) return { color: "#2563eb", label: "Measuring" };
  if (normalized.includes("way")) return { color: "#f59e0b", label: "On route" };
  if (normalized.includes("done") || normalized.includes("complete")) return { color: "#10b981", label: "Done" };
  return { color: "#0f172a", label: "Pending" };
}

function SalesmanJobCardMarker({
  job,
  index,
  selected,
  onClick,
}: {
  job: SalesmanRouteMapJob;
  index: number;
  selected: boolean;
  onClick?: () => void;
}) {
  const tone = statusTone(job.status);

  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer font-sans transition-transform duration-200 ${
        selected ? "scale-105 z-50" : "hover:scale-102"
      }`}
      style={{ width: selected ? 178 : 168 }}
    >
      <div
        className="rounded-2xl p-2.5 text-white transition-all shadow-xl"
        style={{
          backgroundColor: "#0f172a",
          border: selected ? "1.5px solid #f59e0b" : "1px solid rgba(148,163,184,0.25)",
          boxShadow: selected
            ? "0 16px 32px rgba(15,23,42,0.40)"
            : "0 10px 20px rgba(15,23,42,0.25)",
        }}
      >
        <div className="flex items-start gap-1.5">
          <div
            className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 border border-white/80"
            style={{ backgroundColor: tone.color }}
          >
            {index + 1}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-extrabold truncate text-slate-100">
              {job.client || "Customer"}
            </div>
            <div className="text-[8px] font-bold tracking-wider uppercase text-slate-400 truncate">
              {tone.label} • {job.time || "Route"}
            </div>
          </div>
        </div>

        <div className="text-[9px] text-slate-300 truncate my-1.5 leading-snug">
          {job.address || "Customer location"}
        </div>

        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800">
          <span className="font-mono text-[8.5px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5 truncate max-w-[90px]">
            {job.jobId || job.shortRef}
          </span>
          <span
            className="text-[8px] font-black uppercase tracking-wider"
            style={{ color: selected ? "#fbbf24" : "#94a3b8" }}
          >
            {selected ? "Selected" : "Route"}
          </span>
        </div>
      </div>

      <div
        className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-md mx-auto -mt-1.5"
        style={{ backgroundColor: tone.color }}
      />
    </div>
  );
}

function SalesmanJobsRouteMapInner({
  jobs,
  selectedJobId,
  currentPosition,
  routeEnabled = true,
  interactive = true,
  onSelectJob,
}: SalesmanJobsRouteMapProps) {
  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? jobs[0],
    [jobs, selectedJobId]
  );

  const [selectedPopupJobId, setSelectedPopupJobId] = useState<string | null>(null);

  const center: LatLng = useMemo(() => {
    if (selectedJob?.coordinates) {
      return { lat: selectedJob.coordinates[0], lng: selectedJob.coordinates[1] };
    }
    if (currentPosition) {
      return { lat: currentPosition[0], lng: currentPosition[1] };
    }
    return defaultCenter;
  }, [selectedJob, currentPosition]);

  const allPoints: LatLng[] = useMemo(() => {
    const points: LatLng[] = jobs
      .filter((j) => j.coordinates && Number.isFinite(j.coordinates[0]))
      .map((j) => ({ lat: j.coordinates[0], lng: j.coordinates[1] }));

    if (currentPosition) {
      points.unshift({ lat: currentPosition[0], lng: currentPosition[1] });
    }
    points.unshift(EASYBLINDS_HQ.latLng);
    return points.length ? points : [defaultCenter];
  }, [jobs, currentPosition]);

  const sequencePath: LatLng[] = useMemo(
    () =>
      jobs
        .filter((j) => j.coordinates && Number.isFinite(j.coordinates[0]))
        .map((j) => ({ lat: j.coordinates[0], lng: j.coordinates[1] })),
    [jobs]
  );

  const selectedPath: LatLng[] = useMemo(() => {
    if (!routeEnabled || !selectedJob?.coordinates) return [];
    if (currentPosition) {
      return [
        { lat: currentPosition[0], lng: currentPosition[1] },
        { lat: selectedJob.coordinates[0], lng: selectedJob.coordinates[1] },
      ];
    }
    return [];
  }, [currentPosition, routeEnabled, selectedJob]);

  return (
    <div className="h-full w-full relative z-0">
      <Map
        defaultCenter={center}
        defaultZoom={13}
        mapId="salesman_route_map_v1"
        disableDefaultUI={!interactive}
        gestureHandling={interactive ? "greedy" : "none"}
        className="h-full w-full"
      >
        <GoogleMapController bounds={allPoints} center={center} />

        {/* Sequence Route Polyline */}
        {sequencePath.length >= 2 && (
          <GoogleMapPolyline
            path={sequencePath}
            strokeColor="#10b981"
            strokeOpacity={0.4}
            strokeWeight={3}
            dashed
          />
        )}

        {/* Selected Active Target Road Route */}
        {selectedPath.length >= 2 && (
          <GoogleMapPolyline
            path={selectedPath}
            strokeColor="#10b981"
            strokeOpacity={0.95}
            strokeWeight={5}
          />
        )}

        {/* Job Pins */}
        {jobs.map((job, index) => {
          const isSelected = job.id === selectedJob?.id;
          const pos: LatLng = { lat: job.coordinates[0], lng: job.coordinates[1] };

          return (
            <AdvancedMarker
              key={job.id}
              position={pos}
              onClick={() => {
                onSelectJob?.(job.id);
                setSelectedPopupJobId(job.id);
              }}
              title={job.client}
            >
              <SalesmanJobCardMarker
                job={job}
                index={index}
                selected={isSelected}
              />
            </AdvancedMarker>
          );
        })}

        {/* HQ Marker */}
        <AdvancedMarker position={EASYBLINDS_HQ.latLng}>
          <CompanyHqMarker />
        </AdvancedMarker>

        {/* Salesman Live Marker */}
        {currentPosition && (
          <AdvancedMarker
            position={{ lat: currentPosition[0], lng: currentPosition[1] }}
          >
            <div className="relative flex h-7 w-7 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-600 border-2 border-white shadow-md" />
            </div>
          </AdvancedMarker>
        )}

        {/* InfoWindow */}
        {selectedPopupJobId && (
          (() => {
            const popupJob = jobs.find((j) => j.id === selectedPopupJobId);
            if (!popupJob) return null;
            return (
              <InfoWindow
                position={{ lat: popupJob.coordinates[0], lng: popupJob.coordinates[1] }}
                onCloseClick={() => setSelectedPopupJobId(null)}
              >
                <div className="p-2 text-xs font-sans min-w-[200px] space-y-1 text-slate-800">
                  <div className="font-bold text-sm text-slate-900">{popupJob.client}</div>
                  <div className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 inline-block">
                    {popupJob.jobId || popupJob.shortRef}
                  </div>
                  <div className="text-slate-500">{popupJob.address}</div>
                  <div className="flex items-center justify-between text-[10px] font-bold pt-1 border-t border-slate-100">
                    <span>{popupJob.time}</span>
                    <span className="text-emerald-600 uppercase">{popupJob.status}</span>
                  </div>
                </div>
              </InfoWindow>
            );
          })()
        )}
      </Map>
    </div>
  );
}

export default function SalesmanJobsRouteMap(props: SalesmanJobsRouteMapProps) {
  return (
    <GoogleMapsProvider fallbackHeight="100%">
      <SalesmanJobsRouteMapInner {...props} />
    </GoogleMapsProvider>
  );
}
