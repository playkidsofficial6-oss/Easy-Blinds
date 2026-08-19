"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
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
import L from "leaflet";
import { format, parseISO, isToday } from "date-fns";
import {
  MapPin,
  Phone,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Compass,
  Navigation,
  RefreshCw,
  Search,
  Filter,
  X,
  Building,
  ShieldAlert,
  Maximize2,
  Minimize2,
  Briefcase,
  Calendar,
  Layers,
  Truck,
  DollarSign,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useLiveLocation } from "@/hooks";
import { getUsers, UserRecord, extractLatLng } from "@/lib/users";
import { getJobs, Job, JobStatus, JobPriority } from "@/lib/jobs";
import { isSalesmanRole, isFieldRole, isFitterRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

const EASYBLINDS_HQ: [number, number] = [11.2766, 76.2258];
const AUTO_REFRESH_INTERVAL_MS = 5000; // 5 seconds

interface CombinedStaffMember {
  id: string;
  name: string;
  role: "Salesman" | "Fitter";
  phoneNumber?: string;
  email?: string;
  checkedIn: boolean;
  lat: number;
  lng: number;
  lastUpdated?: string;
  isLiveLocation: boolean;
}

interface MapJobRecord {
  id: string;
  jobId: string;
  customerName: string;
  address: string;
  status: JobStatus | string;
  priority?: JobPriority | string;
  scheduledAt?: string;
  productType?: string;
  propertyType?: string;
  projectValue?: number;
  quantity?: number;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  assignedSalesmanName?: string;
  assignedSalesmanId?: string;
  assignedFitterName?: string;
  assignedFitterId?: string;
  lat: number;
  lng: number;
  rawJob: Job;
}

interface ActiveJobRoute {
  jobId: string;
  displayId: string;
  customerName: string;
  staffName: string;
  staffRole: "Salesman" | "Fitter";
  start: [number, number]; // [lat, lng] of staff
  end: [number, number];   // [lat, lng] of job
}

// ── DISTANCE CALCULATION HELPER (KM) ──
function distanceKm(start: [number, number], end: [number, number]): number {
  const earthRadiusKm = 6371;
  const dLat = ((end[0] - start[0]) * Math.PI) / 180;
  const dLng = ((end[1] - start[1]) * Math.PI) / 180;
  const lat1 = (start[0] * Math.PI) / 180;
  const lat2 = (end[0] * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateEtaMinutes(distance: number): number {
  return Math.max(1, Math.round((distance / 32) * 60));
}

// Helper to check if a job is in "On The Way" phase
function isJobOnTheWay(status?: string | JobStatus): boolean {
  if (!status) return false;
  return (
    status === JobStatus.SalesmanOnTheWay ||
    status === JobStatus.FitterOnTheWay ||
    /on\s*the\s*way|travelling|en\s*route/i.test(String(status))
  );
}

// Helper to check if a completed job was completed today
function isCompletedJobCompletedToday(job: Job): boolean {
  const dateCandidates = [
    job.fittingCompletedAt,
    (job as any).fitterJobCompletedAt,
    (job as any).salemanJobCompletedAt,
    job.measurementCompletedAt,
    job.updatedAt,
    job.scheduledAt,
  ].filter(Boolean);

  for (const dateVal of dateCandidates) {
    if (!dateVal) continue;
    try {
      const parsed = typeof dateVal === "string" ? parseISO(dateVal) : new Date(dateVal);
      if (!isNaN(parsed.getTime())) {
        return isToday(parsed);
      }
    } catch {
      // Continue to next candidate date
    }
  }

  return false;
}

// 2-letter Initial Generator for Jobs (Square Marker)
function getJobInitials(job: MapJobRecord): string {
  const name = job.customerName?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length === 1) {
      return (parts[0][0] + "J").toUpperCase();
    }
  }

  // Fallback to Job ID suffix or "JB"
  if (job.jobId) {
    const clean = job.jobId.replace(/[^A-Z0-9]/gi, "");
    if (clean.length >= 2) return clean.slice(-2).toUpperCase();
  }
  return "JB";
}

// ── CUSTOM STAFF CIRCULAR MARKER ICON (GREEN FOR ONLINE, RED FOR OFFLINE) ──
function createCombinedMarkerIcon(member: CombinedStaffMember, isSelected = false) {
  const isSalesman = member.role === "Salesman";
  const isOnline = member.checkedIn;

  const ringColor = isOnline ? "#16a34a" : "#ef4444";
  const ringBgColor = isOnline ? "rgba(22, 163, 74, 0.22)" : "rgba(239, 68, 68, 0.25)";

  const nameParts = member.name.trim().split(/\s+/);
  let initials = isSalesman ? "SM" : "FT";
  if (nameParts.length >= 2) {
    initials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
  } else if (nameParts.length === 1 && nameParts[0].length > 0) {
    initials = nameParts[0].slice(0, 2).toUpperCase();
  }

  const html = renderToStaticMarkup(
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "52px",
        height: "52px",
        transform: isSelected ? "scale(1.18)" : "scale(1)",
        transition: "transform 0.2s ease-in-out",
      }}
    >
      {/* Translucent Halo Ring (Green when online, Red pulse when offline) */}
      <div
        style={{
          position: "absolute",
          inset: "2px",
          borderRadius: "50%",
          backgroundColor: ringBgColor,
          animation: !isOnline ? "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite" : "none",
        }}
      />

      {/* Main Inner Circle with Solid Border Ring */}
      <div
        style={{
          position: "relative",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          backgroundColor: "#ffffff",
          boxShadow: "0 4px 14px rgba(15, 23, 42, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `3.5px solid ${ringColor}`,
        }}
      >
        <span
          style={{
            color: "#0f172a",
            fontSize: "14px",
            fontWeight: 800,
            letterSpacing: "0.01em",
          }}
        >
          {initials}
        </span>
      </div>
    </div>
  );

  return L.divIcon({
    html,
    className: "custom-fleet-marker",
    iconSize: [52, 52],
    iconAnchor: [26, 26],
    popupAnchor: [0, -26],
  });
}

// ── CUSTOM SQUARE JOB MARKER ICON (EXACTLY 2 LETTERS, SQUARE SHAPE) ──
function createSquareJobMarkerIcon(job: MapJobRecord, isSelected = false) {
  const isOnTheWay = isJobOnTheWay(job.status);
  const isFittingOrMeasuring =
    job.status === JobStatus.Fitting ||
    job.status === JobStatus.Measuring ||
    job.status === "Fitting" ||
    job.status === "Measuring";

  // Distinct border & halo styling based on job status
  let borderColor = "#f59e0b"; // Default Amber (Scheduled / Pending)
  let haloBgColor = "rgba(245, 158, 11, 0.25)";

  if (isOnTheWay) {
    borderColor = "#16a34a"; // Green (On The Way)
    haloBgColor = "rgba(22, 163, 74, 0.32)";
  } else if (isFittingOrMeasuring) {
    borderColor = "#3b82f6"; // Blue (In Progress)
    haloBgColor = "rgba(59, 130, 246, 0.25)";
  } else if (job.status === JobStatus.Completed || job.status === "Completed") {
    borderColor = "#10b981"; // Emerald (Completed)
    haloBgColor = "rgba(16, 185, 129, 0.2)";
  }

  const initials = getJobInitials(job);

  const html = renderToStaticMarkup(
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "52px",
        height: "52px",
        transform: isSelected ? "scale(1.18)" : "scale(1)",
        transition: "transform 0.2s ease-in-out",
      }}
    >
      {/* Translucent Square Halo (Pulsing green if On The Way) */}
      <div
        style={{
          position: "absolute",
          inset: "2px",
          borderRadius: "10px",
          backgroundColor: haloBgColor,
          animation: isOnTheWay ? "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite" : "none",
        }}
      />

      {/* Main Square Container */}
      <div
        style={{
          position: "relative",
          width: "40px",
          height: "40px",
          borderRadius: "8px",
          backgroundColor: "#ffffff",
          boxShadow: "0 4px 14px rgba(15, 23, 42, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `3.5px solid ${borderColor}`,
        }}
      >
        <span
          style={{
            color: "#0f172a",
            fontSize: "14px",
            fontWeight: 900,
            letterSpacing: "0.02em",
          }}
        >
          {initials}
        </span>
      </div>
    </div>
  );

  return L.divIcon({
    html,
    className: "custom-job-marker",
    iconSize: [52, 52],
    iconAnchor: [26, 26],
    popupAnchor: [0, -26],
  });
}

// HQ Company Icon
function createCompanyHqIcon() {
  const html = renderToStaticMarkup(
    <div
      style={{
        position: "relative",
        width: "56px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "44px",
          height: "44px",
          borderRadius: "14px",
          background: "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)",
          border: "3px solid #f97316",
          boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontWeight: 900,
          fontSize: "13px",
        }}
      >
        EB
      </div>
    </div>
  );

  return L.divIcon({
    html,
    className: "company-hq-icon",
    iconSize: [56, 56],
    iconAnchor: [28, 28],
    popupAnchor: [0, -28],
  });
}

// ── LIVE GREEN ROUTE COMPONENT (OSRM DRIVING ROUTE + POLYLINE) ──
function LiveJobRoute({ route }: { route: ActiveJobRoute }) {
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [distanceKmVal, setDistanceKmVal] = useState<number | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);

  const startLat = route.start[0];
  const startLng = route.start[1];
  const endLat = route.end[0];
  const endLng = route.end[1];

  useEffect(() => {
    let isMounted = true;

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("OSRM routing request failed");
        const data = await res.json();
        if (data.routes && data.routes.length > 0 && isMounted) {
          const r = data.routes[0];
          const coords = r.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as [number, number]
          );
          setRouteCoords(coords);
          setDistanceKmVal(r.distance / 1000);
          setEtaMinutes(Math.max(1, Math.round(r.duration / 60)));
        }
      } catch {
        if (isMounted) {
          // Geodesic straight-line fallback
          setRouteCoords([route.start, route.end]);
          const d = distanceKm(route.start, route.end);
          setDistanceKmVal(d);
          setEtaMinutes(estimateEtaMinutes(d));
        }
      }
    };

    fetchRoute();
    return () => {
      isMounted = false;
    };
  }, [startLat, startLng, endLat, endLng, route.start, route.end]);

  const positions = routeCoords || [route.start, route.end];

  return (
    <>
      {/* Translucent Green Glow / Casing Underlay */}
      <Polyline
        key={`route-glow-${route.jobId}`}
        positions={positions}
        pathOptions={{
          color: "#16a34a",
          weight: 8,
          opacity: 0.3,
          lineCap: "round",
          lineJoin: "round",
        }}
      />

      {/* Main Solid Green Driving Route Line */}
      <Polyline
        key={`route-main-${route.jobId}`}
        positions={positions}
        pathOptions={{
          color: "#16a34a",
          weight: 4.5,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
        }}
      >
        <Tooltip sticky direction="top" opacity={0.98}>
          <div className="text-xs p-1 text-slate-900 font-sans">
            <div className="flex items-center gap-1.5 font-bold text-emerald-700">
              <Truck className="w-3.5 h-3.5 shrink-0" />
              <span>{route.staffName} ({route.staffRole}) → {route.customerName}</span>
            </div>
            <p className="font-mono text-[10px] text-slate-500 mt-0.5">{route.displayId}</p>
            {distanceKmVal !== null && etaMinutes !== null && (
              <div className="mt-1 flex items-center gap-2 font-semibold text-slate-700 text-[11px]">
                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                  {distanceKmVal.toFixed(1)} km
                </span>
                <span>~{etaMinutes} min away</span>
              </div>
            )}
          </div>
        </Tooltip>
      </Polyline>
    </>
  );
}

// Helper to center map view
function MapRecenterController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

// Helper to invalidate and recalculate Leaflet map size on Fullscreen toggle or Window resize
function LeafletMapResizer({ isFullscreen }: { isFullscreen: boolean }) {
  const map = useMap();

  useEffect(() => {
    const triggerInvalidate = () => {
      map.invalidateSize();
    };

    triggerInvalidate();
    const t1 = setTimeout(triggerInvalidate, 50);
    const t2 = setTimeout(triggerInvalidate, 150);
    const t3 = setTimeout(triggerInvalidate, 350);

    window.addEventListener("resize", triggerInvalidate);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("resize", triggerInvalidate);
    };
  }, [isFullscreen, map]);

  return null;
}

export function AdminFleetMap() {
  const { locations, reload: reloadSocketLocations, isConnected, onlinePresence } = useLiveLocation();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [rawJobs, setRawJobs] = useState<Job[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filters
  const [roleFilter, setRoleFilter] = useState<"ALL" | "Salesman" | "Fitter">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ONLINE" | "OFFLINE" | "ON_THE_WAY">("ALL");
  const [showJobsToggle, setShowJobsToggle] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Handle Esc key for Fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Load Users data
  const loadUsers = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e) {
      console.error("Failed to load staff users for fleet map", e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  // Load Jobs data (Refreshed automatically every 10 seconds)
  const loadJobs = useCallback(async (silent = false) => {
    try {
      const res = await getJobs({ limit: 1000 });
      setRawJobs(res.items || []);
    } catch (e) {
      console.error("Failed to load jobs for fleet map", e);
    }
  }, []);

  // Initial Data Load & 10-Second Auto-Refresh Timer
  useEffect(() => {
    loadUsers(false);
    loadJobs(false);

    const intervalId = setInterval(() => {
      loadJobs(true); // Silent background 10s poll
      loadUsers(true);
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [loadUsers, loadJobs]);

  // Combine REST Users data + Live Socket Location & Presence data
  const combinedMembers: CombinedStaffMember[] = useMemo(() => {
    const liveMapByUserId = new Map(locations.map((loc) => [loc.userId, loc]));

    return users
      .filter((u) => isSalesmanRole(u.role) || isFieldRole(u.role) || isFitterRole(u.role))
      .map((u) => {
        const liveLoc = liveMapByUserId.get(u._id);
        const isSalesman = isSalesmanRole(u.role) || isFieldRole(u.role);
        const role: "Salesman" | "Fitter" = isSalesman ? "Salesman" : "Fitter";

        let lat = EASYBLINDS_HQ[0];
        let lng = EASYBLINDS_HQ[1];
        let isLiveLocation = false;
        let lastUpdated: string | undefined = u.updatedAt;

        if (liveLoc) {
          lat = liveLoc.lat;
          lng = liveLoc.lng;
          isLiveLocation = true;
          lastUpdated = liveLoc.updatedAt;
        } else if (u.location) {
          const coords = extractLatLng(u.location);
          if (coords) {
            lat = coords.lat;
            lng = coords.lng;
            lastUpdated = u.location.updatedAt ? String(u.location.updatedAt) : u.updatedAt;
          }
        }

        // Add small offset if coordinates overlap HQ exactly
        const isHqDefault = Math.abs(lat - EASYBLINDS_HQ[0]) < 0.0001 && Math.abs(lng - EASYBLINDS_HQ[1]) < 0.0001;
        if (isHqDefault) {
          const hash = u._id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
          lat += ((hash % 10) - 5) * 0.0015;
          lng += (((hash * 3) % 10) - 5) * 0.0015;
        }

        const isOnline =
          onlinePresence[u._id] !== undefined
            ? onlinePresence[u._id]
            : Boolean(u.checkedIn);

        return {
          id: u._id,
          name: u.name,
          role,
          phoneNumber: u.phoneNumber,
          email: u.email,
          checkedIn: isOnline,
          lat,
          lng,
          lastUpdated,
          isLiveLocation,
        };
      });
  }, [users, locations, onlinePresence]);

  // Process & Extract Map Job Records
  const mapJobs: MapJobRecord[] = useMemo(() => {
    return rawJobs
      .filter((job) => {
        if (!job.location) return false;
        const coords = extractLatLng(job.location as any);
        if (!coords) return false;

        // Do not show past completed jobs; only show jobs completed today
        const isCompleted =
          job.status === JobStatus.Completed ||
          (job.status as any) === "Completed" ||
          String(job.status).toLowerCase() === "completed";

        if (isCompleted && !isCompletedJobCompletedToday(job)) {
          return false;
        }

        return true;
      })
      .map((job) => {
        const coords = extractLatLng(job.location as any)!;

        const salesmanObj = typeof job.assignedSalesman === "object" ? job.assignedSalesman : null;
        const salesmanId = salesmanObj?._id || (typeof job.assignedSalesman === "string" ? job.assignedSalesman : undefined);
        const salesmanName = salesmanObj?.name || (salesmanId ? users.find((u) => u._id === salesmanId)?.name : undefined);

        const fitterObj = typeof job.assignedFitter === "object" ? job.assignedFitter : null;
        const fitterId = fitterObj?._id || (typeof job.assignedFitter === "string" ? job.assignedFitter : undefined);
        const fitterName = fitterObj?.name || (fitterId ? users.find((u) => u._id === fitterId)?.name : undefined);

        const displayId = job.jobId || `JOB-${job._id.slice(-6).toUpperCase()}`;
        const customerName =
          job.customerName ||
          `${job.firstName || ""} ${job.lastName || ""}`.trim() ||
          "Customer";

        return {
          id: job._id,
          jobId: displayId,
          customerName,
          address: job.address,
          status: job.status,
          priority: job.priority,
          scheduledAt: job.scheduledAt,
          productType: job.productType,
          propertyType: job.propertyType,
          projectValue: job.projectValue,
          quantity: job.quantity,
          customerPhone: job.customerPhone,
          customerEmail: job.customerEmail,
          notes: job.notes,
          assignedSalesmanName: salesmanName,
          assignedSalesmanId: salesmanId,
          assignedFitterName: fitterName,
          assignedFitterId: fitterId,
          lat: coords.lat,
          lng: coords.lng,
          rawJob: job,
        };
      });
  }, [rawJobs, users]);

  // ── DETECT ACTIVE ROUTES FOR "SALESMAN ON THE WAY" & "FITTER ON THE WAY" ──
  const activeRoutes: ActiveJobRoute[] = useMemo(() => {
    const routes: ActiveJobRoute[] = [];
    const staffMapById = new Map(combinedMembers.map((m) => [m.id, m]));

    for (const job of mapJobs) {
      if (
        job.status === JobStatus.SalesmanOnTheWay ||
        job.status === "Salesman On The Way"
      ) {
        const staff = job.assignedSalesmanId ? staffMapById.get(job.assignedSalesmanId) : null;
        if (staff) {
          routes.push({
            jobId: job.id,
            displayId: job.jobId,
            customerName: job.customerName,
            staffName: staff.name,
            staffRole: "Salesman",
            start: [staff.lat, staff.lng],
            end: [job.lat, job.lng],
          });
        }
      } else if (
        job.status === JobStatus.FitterOnTheWay ||
        job.status === "Fitter On The Way"
      ) {
        const staff = job.assignedFitterId ? staffMapById.get(job.assignedFitterId) : null;
        if (staff) {
          routes.push({
            jobId: job.id,
            displayId: job.jobId,
            customerName: job.customerName,
            staffName: staff.name,
            staffRole: "Fitter",
            start: [staff.lat, staff.lng],
            end: [job.lat, job.lng],
          });
        }
      }
    }

    return routes;
  }, [mapJobs, combinedMembers]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return combinedMembers.filter((m) => {
      if (roleFilter !== "ALL" && m.role !== roleFilter) return false;
      if (statusFilter === "ONLINE" && !m.checkedIn) return false;
      if (statusFilter === "OFFLINE" && m.checkedIn) return false;
      if (statusFilter === "ON_THE_WAY") {
        const hasActiveRoute = activeRoutes.some(
          (r) => (r.staffRole === m.role && r.staffName === m.name)
        );
        if (!hasActiveRoute) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          m.name.toLowerCase().includes(q) ||
          (m.phoneNumber && m.phoneNumber.toLowerCase().includes(q)) ||
          m.role.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [combinedMembers, roleFilter, statusFilter, searchQuery, activeRoutes]);

  // Filtered jobs list
  const filteredJobs = useMemo(() => {
    if (!showJobsToggle) return [];
    return mapJobs.filter((job) => {
      if (statusFilter === "ON_THE_WAY" && !isJobOnTheWay(job.status)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          job.customerName.toLowerCase().includes(q) ||
          job.jobId.toLowerCase().includes(q) ||
          job.address.toLowerCase().includes(q) ||
          (job.customerPhone && job.customerPhone.toLowerCase().includes(q)) ||
          (job.productType && job.productType.toLowerCase().includes(q)) ||
          (job.assignedSalesmanName && job.assignedSalesmanName.toLowerCase().includes(q)) ||
          (job.assignedFitterName && job.assignedFitterName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [mapJobs, showJobsToggle, statusFilter, searchQuery]);

  // Counts summary
  const counts = useMemo(() => {
    const totalStaff = combinedMembers.length;
    const salesmen = combinedMembers.filter((m) => m.role === "Salesman").length;
    const fitters = combinedMembers.filter((m) => m.role === "Fitter").length;
    const online = combinedMembers.filter((m) => m.checkedIn).length;
    const offline = combinedMembers.filter((m) => !m.checkedIn).length;
    const totalJobs = mapJobs.length;
    const onTheWayJobs = mapJobs.filter((j) => isJobOnTheWay(j.status)).length;
    return {
      totalStaff,
      salesmen,
      fitters,
      online,
      offline,
      totalJobs,
      onTheWayJobs,
    };
  }, [combinedMembers, mapJobs]);

  // Selected Member & Job resolution
  const selectedMember = useMemo(() => {
    if (!selectedMemberId) return null;
    return combinedMembers.find((m) => m.id === selectedMemberId) ?? null;
  }, [combinedMembers, selectedMemberId]);

  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;
    return mapJobs.find((j) => j.id === selectedJobId) ?? null;
  }, [mapJobs, selectedJobId]);

  const handleSelectMember = (member: CombinedStaffMember) => {
    setSelectedJobId(null);
    setSelectedMemberId(member.id);
    setMapCenter([member.lat, member.lng]);
  };

  const handleSelectJob = (job: MapJobRecord) => {
    setSelectedMemberId(null);
    setSelectedJobId(job.id);
    setMapCenter([job.lat, job.lng]);
  };

  return (
    <div
      className={cn(
        "relative flex flex-col bg-slate-950 overflow-hidden shadow-2xl transition-all duration-200",
        isFullscreen
          ? "fixed inset-0 z-99999 w-screen h-screen rounded-none border-none"
          : "w-full h-full rounded-2xl border border-slate-800"
      )}
    >
      {/* ── TOP CONTROL BAR ── */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-400 flex flex-col gap-2 sm:gap-3 pointer-events-none">
        {/* Filter Pills — horizontal scroll on mobile, wraps on desktop */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar bg-slate-900/90 backdrop-blur-md p-1.5 sm:p-2 rounded-xl border border-slate-800 shadow-xl pointer-events-auto">
          <Button
            size="sm"
            variant={roleFilter === "ALL" && statusFilter === "ALL" ? "default" : "ghost"}
            onClick={() => {
              setRoleFilter("ALL");
              setStatusFilter("ALL");
            }}
            className="h-7 sm:h-8 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 whitespace-nowrap shrink-0 text-white"
          >
            All Staff ({counts.totalStaff})
          </Button>

          <Button
            size="sm"
            variant={roleFilter === "Salesman" ? "default" : "ghost"}
            onClick={() => setRoleFilter(roleFilter === "Salesman" ? "ALL" : "Salesman")}
            className={cn(
              "h-7 sm:h-8 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 transition-colors whitespace-nowrap shrink-0",
              roleFilter === "Salesman" ? "bg-blue-600 hover:bg-blue-700 text-white" : "text-blue-400 hover:bg-blue-950/40"
            )}
          >
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-blue-500 mr-1" />
            Sales ({counts.salesmen})
          </Button>

          <Button
            size="sm"
            variant={roleFilter === "Fitter" ? "default" : "ghost"}
            onClick={() => setRoleFilter(roleFilter === "Fitter" ? "ALL" : "Fitter")}
            className={cn(
              "h-7 sm:h-8 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 transition-colors whitespace-nowrap shrink-0",
              roleFilter === "Fitter" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-emerald-400 hover:bg-emerald-950/40"
            )}
          >
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-500 mr-1" />
            Fitters ({counts.fitters})
          </Button>

          <div className="h-4 w-px bg-slate-700 mx-0.5 sm:mx-1 shrink-0" />

          {/* Jobs Toggle Pill */}
          <Button
            size="sm"
            variant={showJobsToggle ? "default" : "outline"}
            onClick={() => setShowJobsToggle(!showJobsToggle)}
            className={cn(
              "h-7 sm:h-8 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 transition-colors whitespace-nowrap shrink-0",
              showJobsToggle
                ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-500"
                : "bg-slate-950 border-slate-800 text-amber-400 hover:bg-amber-950/40"
            )}
            title="Toggle job square markers on map"
          >
            <Briefcase className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1" />
            Jobs ({counts.totalJobs})
          </Button>

          {/* On The Way Active Filter */}
          {counts.onTheWayJobs > 0 && (
            <Button
              size="sm"
              variant={statusFilter === "ON_THE_WAY" ? "default" : "ghost"}
              onClick={() => setStatusFilter(statusFilter === "ON_THE_WAY" ? "ALL" : "ON_THE_WAY")}
              className={cn(
                "h-7 sm:h-8 text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 whitespace-nowrap shrink-0 animate-pulse",
                statusFilter === "ON_THE_WAY"
                  ? "bg-emerald-600 text-white"
                  : "text-emerald-400 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/40"
              )}
            >
              <Truck className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1 text-emerald-300" />
              On The Way ({counts.onTheWayJobs})
            </Button>
          )}

          {/* Online Filter Pill */}
          <Button
            size="sm"
            variant={statusFilter === "ONLINE" ? "default" : "ghost"}
            onClick={() => setStatusFilter(statusFilter === "ONLINE" ? "ALL" : "ONLINE")}
            className={cn(
              "h-7 sm:h-8 text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 whitespace-nowrap shrink-0",
              statusFilter === "ONLINE" ? "bg-emerald-600 text-white" : "text-emerald-400 hover:bg-emerald-950/40"
            )}
          >
            <CheckCircle2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1" />
            Online ({counts.online})
          </Button>

          <div className="h-4 w-px bg-slate-700 mx-0.5 sm:mx-1 shrink-0" />

          {/* WebSocket Connection Status Badge */}
          <div
            className={cn(
              "flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-semibold whitespace-nowrap shrink-0 border transition-all",
              isConnected
                ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
                : "bg-amber-950/80 border-amber-500/40 text-amber-300"
            )}
            title={isConnected ? "WebSocket connected: Receiving real-time location updates" : "Connecting to live WebSocket..."}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  isConnected ? "bg-emerald-400" : "bg-amber-400"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  isConnected ? "bg-emerald-500" : "bg-amber-500"
                )}
              />
            </span>
            <span className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
              {isConnected ? "Live GPS" : "Connecting..."}
            </span>
          </div>
        </div>

        {/* Search & Actions — compact on mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 sm:p-2 rounded-xl border border-slate-800 shadow-xl pointer-events-auto">
          <div className="relative flex-1 sm:flex-none sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-2.5 sm:left-3 top-2 sm:top-2.5 text-slate-400" />
            <Input
              placeholder="Search staff, customer, job ID, area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 sm:h-8 pl-7 sm:pl-8 pr-7 text-[11px] sm:text-xs bg-slate-950 border-slate-800 text-white placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1.5 sm:top-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              loadUsers(false);
              loadJobs(false);
              reloadSocketLocations();
            }}
            className="h-7 sm:h-8 w-7 sm:w-auto p-0 sm:px-3 bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
            title="Refresh positions and jobs (Auto 10s)"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            <span className="hidden sm:inline ml-1 text-xs">Sync</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setMapCenter(EASYBLINDS_HQ)}
            className="h-7 sm:h-8 w-7 sm:w-auto p-0 sm:px-3 bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
            title="Center HQ"
          >
            <Building className="w-3.5 h-3.5 text-orange-500" />
            <span className="hidden sm:inline ml-1">HQ</span>
          </Button>

          {/* ── FULL SCREEN TOGGLE BUTTON ── */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-7 sm:h-8 w-7 sm:w-auto p-0 sm:px-3 bg-slate-950 border-slate-800 text-slate-300 hover:text-white font-semibold text-xs"
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 sm:mr-1.5 text-amber-400" />
                <span className="hidden sm:inline">Exit</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 sm:mr-1.5 text-blue-400" />
                <span className="hidden sm:inline">Full Screen</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── MAP CONTAINER ── */}
      <MapContainer
        center={EASYBLINDS_HQ}
        zoom={11}
        scrollWheelZoom={true}
        className="w-full h-full z-0 bg-slate-950"
      >
        <MapRecenterController center={mapCenter} />
        <LeafletMapResizer isFullscreen={isFullscreen} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Company HQ Marker */}
        <Marker position={EASYBLINDS_HQ} icon={createCompanyHqIcon()}>
          <Popup className="custom-popup">
            <div className="p-2 text-slate-900 font-sans">
              <h4 className="font-bold text-sm text-slate-900">EasyBlinds HQ</h4>
              <p className="text-xs text-slate-500">Nilambur, Kerala</p>
            </div>
          </Popup>
        </Marker>

        {/* ── GREEN DRIVING ROUTES (FOR "ON THE WAY" STATUS JOBS) ── */}
        {activeRoutes.map((route) => (
          <LiveJobRoute key={`route-poly-${route.jobId}`} route={route} />
        ))}

        {/* ── SQUARE JOB MARKERS (2 LETTERS INSIDE) ── */}
        {filteredJobs.map((job) => {
          const isSelected = selectedJob?.id === job.id;
          const icon = createSquareJobMarkerIcon(job, isSelected);
          const isOnTheWay = isJobOnTheWay(job.status);
          const assignedStaff = job.assignedSalesmanName || job.assignedFitterName;

          return (
            <Marker
              key={`job-${job.id}`}
              position={[job.lat, job.lng]}
              icon={icon}
              eventHandlers={{
                click: () => handleSelectJob(job),
              }}
            >
              {/* Full Job Details Tooltip on Hover */}
              <Tooltip direction="top" offset={[0, -28]} opacity={0.98}>
                <div className="p-1 min-w-52.5 max-w-72.5 text-slate-900 font-sans space-y-1.5">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1">
                    <span className="font-mono font-bold text-[11px] text-slate-800">
                      {job.jobId}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider text-white",
                        isOnTheWay
                          ? "bg-emerald-600"
                          : job.status === "Fitting" || job.status === "Measuring"
                            ? "bg-blue-600"
                            : job.status === JobStatus.Completed || job.status === "Completed"
                              ? "bg-emerald-600"
                              : "bg-amber-600"
                      )}
                    >
                      {job.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-900 leading-snug">
                      {job.customerName}
                    </h4>
                    {job.address && (
                      <p className="text-[10px] text-slate-500 flex items-start gap-1 mt-0.5 leading-tight line-clamp-2">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <span>{job.address}</span>
                      </p>
                    )}
                  </div>

                  {assignedStaff && (
                    <div className="text-[10px] text-slate-700 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>
                        Staff: <strong>{assignedStaff}</strong>
                      </span>
                    </div>
                  )}

                  {job.scheduledAt && (
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>
                        {(() => {
                          try {
                            return format(new Date(job.scheduledAt), "MMM d, HH:mm");
                          } catch {
                            return job.scheduledAt;
                          }
                        })()}
                      </span>
                    </div>
                  )}

                  {isOnTheWay && (
                    <div className="mt-1 pt-1 border-t border-slate-100 flex items-center gap-1.5 text-[10px] font-bold text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>Staff currently travelling to job location</span>
                    </div>
                  )}
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* ── CIRCULAR STAFF FLEET MARKERS ── */}
        {filteredMembers.map((member) => {
          const isSelected = selectedMember?.id === member.id;
          const icon = createCombinedMarkerIcon(member, isSelected);

          return (
            <Marker
              key={`staff-${member.id}`}
              position={[member.lat, member.lng]}
              icon={icon}
              eventHandlers={{
                click: () => handleSelectMember(member),
              }}
            >
              <Tooltip direction="top" offset={[0, -28]} opacity={0.95}>
                <div className="font-semibold text-xs py-0.5">
                  {member.name}
                  <span className="ml-2 font-bold">({member.role})</span>
                  <span
                    className={cn(
                      "ml-1.5 text-[10px] px-1 py-0.2 rounded font-bold uppercase",
                      member.checkedIn
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    )}
                  >
                    {member.checkedIn ? "Online" : "Offline"}
                  </span>
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      {/* ── SELECTED MEMBER DETAILS DRAWER CARD ── */}
      {selectedMember && (
        <div className="absolute bottom-3 sm:bottom-6 left-2 right-2 sm:left-auto sm:right-6 sm:w-95 z-450 animate-in slide-in-from-bottom-6 duration-300 pointer-events-auto">
          <Card className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 text-white shadow-2xl overflow-hidden">
            <CardContent className="p-3 sm:p-5 relative">
              <button
                onClick={() => setSelectedMemberId(null)}
                className="absolute top-2.5 sm:top-4 right-2.5 sm:right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-2.5 sm:gap-3.5 mb-3 sm:mb-4">
                {/* Avatar with Ring */}
                <div
                  className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-base sm:text-lg text-slate-900 bg-white shadow-md border-[3px] sm:border-4",
                    selectedMember.checkedIn
                      ? "border-emerald-600 ring-[3px] sm:ring-4 ring-emerald-500/20"
                      : "border-red-500 ring-[3px] sm:ring-4 ring-red-500/30"
                  )}
                >
                  {selectedMember.name.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-0.5 flex-wrap">
                    <h3 className="font-bold text-base sm:text-lg text-white truncate">
                      {selectedMember.name}
                    </h3>
                    <Badge
                      className={cn(
                        "text-[9px] sm:text-[10px] uppercase font-extrabold px-1.5 sm:px-2 py-0.5 shrink-0",
                        selectedMember.role === "Salesman"
                          ? "bg-blue-600 text-white border-blue-500"
                          : "bg-emerald-600 text-white border-emerald-500"
                      )}
                    >
                      {selectedMember.role}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Coordinates & Phone */}
              <div className="space-y-1.5 sm:space-y-2 bg-slate-950/60 p-2 sm:p-3 rounded-xl border border-slate-800 text-[10px] sm:text-xs mb-3 sm:mb-4">
                <div className="flex items-center justify-between text-slate-300 gap-2">
                  <span className="text-slate-500 uppercase tracking-wider font-bold text-[9px] sm:text-[10px] shrink-0">
                    Coordinates:
                  </span>
                  <span className="font-mono text-white font-semibold text-[10px] sm:text-xs truncate">
                    {selectedMember.lat.toFixed(6)}, {selectedMember.lng.toFixed(6)}
                  </span>
                </div>

                {selectedMember.phoneNumber && (
                  <div className="flex items-center justify-between text-slate-300 gap-2">
                    <span className="text-slate-500 uppercase tracking-wider font-bold text-[9px] sm:text-[10px] shrink-0">
                      Phone:
                    </span>
                    <a
                      href={`tel:${selectedMember.phoneNumber}`}
                      className="text-blue-400 font-medium hover:underline flex items-center gap-1 truncate"
                    >
                      <Phone className="w-3 h-3 shrink-0" /> {selectedMember.phoneNumber}
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-300 gap-2">
                  <span className="text-slate-500 uppercase tracking-wider font-bold text-[9px] sm:text-[10px] shrink-0">
                    Updated:
                  </span>
                  <span className="text-slate-400 flex items-center gap-1 truncate">
                    <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                    {selectedMember.lastUpdated
                      ? (() => {
                        try {
                          return format(parseISO(selectedMember.lastUpdated), "MMM d, HH:mm:ss");
                        } catch {
                          return selectedMember.lastUpdated;
                        }
                      })()
                      : "Recently"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] sm:text-xs h-8 sm:h-9"
                  onClick={() => setMapCenter([selectedMember.lat, selectedMember.lng])}
                >
                  <Navigation className="w-3.5 h-3.5 mr-1" /> Recenter
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="bg-slate-800 border-slate-700 text-slate-200 hover:text-white text-[11px] sm:text-xs h-8 sm:h-9"
                  onClick={() => setSelectedMemberId(null)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── SELECTED JOB DETAILS DRAWER CARD ── */}
      {selectedJob && (
        <div className="absolute bottom-3 sm:bottom-6 left-2 right-2 sm:left-auto sm:right-6 sm:w-95 z-450 animate-in slide-in-from-bottom-6 duration-300 pointer-events-auto">
          <Card className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 text-white shadow-2xl overflow-hidden">
            <CardContent className="p-3 sm:p-5 relative">
              <button
                onClick={() => setSelectedJobId(null)}
                className="absolute top-2.5 sm:top-4 right-2.5 sm:right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-2.5 sm:gap-3.5 mb-3 sm:mb-4">
                {/* Square Job Avatar */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center font-black text-base sm:text-lg text-slate-900 bg-white shadow-md border-[3px] border-amber-500">
                  {getJobInitials(selectedJob)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs text-amber-400 font-bold">
                      {selectedJob.jobId}
                    </span>
                    <h3 className="font-bold text-base sm:text-lg text-white truncate">
                      {selectedJob.customerName}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      <Badge
                        className={cn(
                          "text-[9px] sm:text-[10px] uppercase font-extrabold px-1.5 sm:px-2 py-0.5 shrink-0",
                          isJobOnTheWay(selectedJob.status)
                            ? "bg-emerald-600 text-white border-emerald-500"
                            : selectedJob.status === JobStatus.Completed || selectedJob.status === "Completed"
                              ? "bg-emerald-600 text-white border-emerald-500"
                              : "bg-amber-600 text-white border-amber-500"
                        )}
                      >
                        {selectedJob.status}
                      </Badge>
                      {selectedJob.priority && (
                        <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-300">
                          {selectedJob.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Details Box */}
              <div className="space-y-1.5 sm:space-y-2 bg-slate-950/60 p-2.5 sm:p-3 rounded-xl border border-slate-800 text-[10px] sm:text-xs mb-3 sm:mb-4">
                {selectedJob.address && (
                  <div className="text-slate-300">
                    <span className="text-slate-500 uppercase tracking-wider font-bold text-[9px] block mb-0.5">
                      Address:
                    </span>
                    <p className="text-slate-200 flex items-start gap-1 leading-snug">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      {selectedJob.address}
                    </p>
                  </div>
                )}

                {selectedJob.customerPhone && (
                  <div className="flex items-center justify-between text-slate-300 gap-2 pt-1 border-t border-slate-800/60">
                    <span className="text-slate-500 uppercase tracking-wider font-bold text-[9px] shrink-0">
                      Customer Phone:
                    </span>
                    <a
                      href={`tel:${selectedJob.customerPhone}`}
                      className="text-blue-400 font-medium hover:underline flex items-center gap-1 truncate"
                    >
                      <Phone className="w-3 h-3 shrink-0" /> {selectedJob.customerPhone}
                    </a>
                  </div>
                )}

                {selectedJob.scheduledAt && (
                  <div className="flex items-center justify-between text-slate-300 gap-2">
                    <span className="text-slate-500 uppercase tracking-wider font-bold text-[9px] shrink-0">
                      Scheduled:
                    </span>
                    <span className="text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      {(() => {
                        try {
                          return format(new Date(selectedJob.scheduledAt), "PPp");
                        } catch {
                          return selectedJob.scheduledAt;
                        }
                      })()}
                    </span>
                  </div>
                )}

                {(selectedJob.assignedSalesmanName || selectedJob.assignedFitterName) && (
                  <div className="flex items-center justify-between text-slate-300 gap-2 pt-1 border-t border-slate-800/60">
                    <span className="text-slate-500 uppercase tracking-wider font-bold text-[9px] shrink-0">
                      Assigned Staff:
                    </span>
                    <span className="text-slate-200 font-medium">
                      {selectedJob.assignedSalesmanName && `Sales: ${selectedJob.assignedSalesmanName}`}
                      {selectedJob.assignedSalesmanName && selectedJob.assignedFitterName && " | "}
                      {selectedJob.assignedFitterName && `Fitter: ${selectedJob.assignedFitterName}`}
                    </span>
                  </div>
                )}

                {selectedJob.productType && (
                  <div className="flex items-center justify-between text-slate-300 gap-2">
                    <span className="text-slate-500 uppercase tracking-wider font-bold text-[9px] shrink-0">
                      Product:
                    </span>
                    <span className="text-slate-300">
                      {selectedJob.productType}
                      {selectedJob.quantity ? ` (${selectedJob.quantity} units)` : ""}
                    </span>
                  </div>
                )}

                {selectedJob.projectValue !== undefined && (
                  <div className="flex items-center justify-between text-slate-300 gap-2">
                    <span className="text-slate-500 uppercase tracking-wider font-bold text-[9px] shrink-0">
                      Value:
                    </span>
                    <span className="font-semibold text-emerald-400">
                      AED {selectedJob.projectValue.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] sm:text-xs h-8 sm:h-9"
                  onClick={() => setMapCenter([selectedJob.lat, selectedJob.lng])}
                >
                  <Navigation className="w-3.5 h-3.5 mr-1" /> Recenter Job
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="bg-slate-800 border-slate-700 text-slate-200 hover:text-white text-[11px] sm:text-xs h-8 sm:h-9"
                  onClick={() => setSelectedJobId(null)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
