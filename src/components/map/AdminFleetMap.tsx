"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import { format, parseISO, isToday } from "date-fns";
import {
  MapPin,
  Phone,
  RefreshCw,
  Search,
  X,
  Building,
  Maximize2,
  Minimize2,
  Briefcase,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLiveLocation } from "@/hooks";
import { getUsers, UserRecord, extractLatLng } from "@/lib/users";
import { getJobs, Job, JobStatus, JobPriority } from "@/lib/jobs";
import { isSalesmanRole, isFieldRole, isFitterRole } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { GoogleMapsProvider } from "./GoogleMapsProvider";
import { GoogleMapController, GoogleMapPolyline, LatLng } from "./GoogleMapHelpers";
import { CompanyHqMarker, EASYBLINDS_HQ } from "../tracking/map-icons";

const EASYBLINDS_HQ_COORDS: [number, number] = [11.2766, 76.2258];
const EASYBLINDS_HQ_LATLNG: LatLng = { lat: 11.2766, lng: 76.2258 };
const AUTO_REFRESH_INTERVAL_MS = 5000;

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
  start: [number, number];
  end: [number, number];
}

function isJobOnTheWay(status?: string | JobStatus): boolean {
  if (!status) return false;
  return (
    status === JobStatus.SalesmanOnTheWay ||
    status === JobStatus.FitterOnTheWay ||
    /on\s*the\s*way|travelling|en\s*route/i.test(String(status))
  );
}

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

  if (job.jobId) {
    const clean = job.jobId.replace(/[^A-Z0-9]/gi, "");
    if (clean.length >= 2) return clean.slice(-2).toUpperCase();
  }
  return "JB";
}

function StaffMarkerElement({
  member,
  isSelected = false,
}: {
  member: CombinedStaffMember;
  isSelected?: boolean;
}) {
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

  return (
    <div
      className={cn(
        "relative flex items-center justify-center cursor-pointer transition-transform duration-200",
        isSelected ? "scale-120 z-50" : "hover:scale-110"
      )}
      style={{ width: "52px", height: "52px" }}
    >
      <div
        className={cn(
          "absolute inset-0.5 rounded-full pointer-events-none",
          !isOnline ? "animate-ping opacity-75" : ""
        )}
        style={{ backgroundColor: ringBgColor }}
      />
      <div
        className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg transition-all"
        style={{
          border: `3.5px solid ${ringColor}`,
          boxShadow: isSelected
            ? `0 0 0 4px ${ringBgColor}, 0 8px 16px rgba(15, 23, 42, 0.25)`
            : "0 4px 12px rgba(15, 23, 42, 0.15)",
        }}
      >
        <span className="text-slate-900 text-sm font-extrabold tracking-tight">
          {initials}
        </span>
      </div>
      <div
        className={cn(
          "absolute -bottom-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold text-white uppercase tracking-wider shadow-sm",
          isSalesman ? "bg-blue-600" : "bg-purple-600"
        )}
      >
        {isSalesman ? "SALES" : "FIT"}
      </div>
    </div>
  );
}

function JobMarkerElement({
  job,
  isSelected = false,
}: {
  job: MapJobRecord;
  isSelected?: boolean;
}) {
  const isOnTheWay = isJobOnTheWay(job.status);
  const isFittingOrMeasuring =
    job.status === JobStatus.Fitting ||
    job.status === JobStatus.Measuring ||
    job.status === "Fitting" ||
    job.status === "Measuring";

  let borderColor = "#f59e0b";
  let haloBgColor = "rgba(245, 158, 11, 0.25)";

  if (isOnTheWay) {
    borderColor = "#16a34a";
    haloBgColor = "rgba(22, 163, 74, 0.32)";
  } else if (isFittingOrMeasuring) {
    borderColor = "#3b82f6";
    haloBgColor = "rgba(59, 130, 246, 0.25)";
  } else if (job.status === JobStatus.Completed) {
    borderColor = "#10b981";
    haloBgColor = "rgba(16, 185, 129, 0.2)";
  }

  const initials = getJobInitials(job);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center cursor-pointer transition-transform duration-200",
        isSelected ? "scale-120 z-50" : "hover:scale-110"
      )}
      style={{ width: "52px", height: "52px" }}
    >
      <div
        className={cn(
          "absolute inset-0.5 rounded-xl pointer-events-none",
          isOnTheWay ? "animate-ping opacity-75" : ""
        )}
        style={{ backgroundColor: haloBgColor }}
      />
      <div
        className="relative w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg transition-all"
        style={{
          border: `3.5px solid ${borderColor}`,
          boxShadow: isSelected
            ? `0 0 0 4px ${haloBgColor}, 0 8px 16px rgba(15, 23, 42, 0.25)`
            : "0 4px 12px rgba(15, 23, 42, 0.18)",
        }}
      >
        <span className="text-slate-900 text-sm font-black tracking-tight">
          {initials}
        </span>
      </div>
    </div>
  );
}

function LiveRoutePolyline({ route }: { route: ActiveJobRoute }) {
  const [coords, setCoords] = useState<LatLng[]>([]);

  useEffect(() => {
    let active = true;
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${route.start[1]},${route.start[0]};${route.end[1]},${route.end[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Route failed");
        const data = await res.json();
        if (data.routes && data.routes.length > 0 && active) {
          const raw = data.routes[0].geometry.coordinates as [number, number][];
          setCoords(raw.map((c) => ({ lat: c[1], lng: c[0] })));
          return;
        }
      } catch {
        // Fallback straight line
      }
      if (active) {
        setCoords([
          { lat: route.start[0], lng: route.start[1] },
          { lat: route.end[0], lng: route.end[1] },
        ]);
      }
    };

    fetchRoute();
    return () => {
      active = false;
    };
  }, [route.start, route.end]);

  if (coords.length < 2) return null;

  return (
    <>
      <GoogleMapPolyline
        path={coords}
        strokeColor="#16a34a"
        strokeOpacity={0.3}
        strokeWeight={8}
      />
      <GoogleMapPolyline
        path={coords}
        strokeColor="#16a34a"
        strokeOpacity={0.95}
        strokeWeight={4.5}
      />
    </>
  );
}

function FleetMapInner() {
  const { locations, reload: reloadSocketLocations, onlinePresence } = useLiveLocation();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [rawJobs, setRawJobs] = useState<Job[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedHq, setSelectedHq] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<LatLng | null>(EASYBLINDS_HQ_LATLNG);
  const [mapZoom, setMapZoom] = useState<number>(11);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filters
  const [roleFilter, setRoleFilter] = useState<"ALL" | "Salesman" | "Fitter">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ONLINE" | "OFFLINE" | "ON_THE_WAY">("ALL");
  const [showJobsToggle, setShowJobsToggle] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

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

  const loadJobs = useCallback(async (silent = false) => {
    try {
      const res = await getJobs({ limit: 1000 });
      setRawJobs(res.items || []);
    } catch (e) {
      console.error("Failed to load jobs for fleet map", e);
    }
  }, []);

  useEffect(() => {
    loadUsers(false);
    loadJobs(false);

    const intervalId = setInterval(() => {
      loadJobs(true);
      loadUsers(true);
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [loadUsers, loadJobs]);

  const combinedMembers: CombinedStaffMember[] = useMemo(() => {
    const liveMapByUserId = new globalThis.Map(locations.map((loc) => [loc.userId, loc]));

    return users
      .filter((u) => isSalesmanRole(u.role) || isFieldRole(u.role) || isFitterRole(u.role))
      .map((u) => {
        const liveLoc = liveMapByUserId.get(u._id);
        const isSalesman = isSalesmanRole(u.role) || isFieldRole(u.role);
        const role: "Salesman" | "Fitter" = isSalesman ? "Salesman" : "Fitter";

        let lat = EASYBLINDS_HQ_COORDS[0];
        let lng = EASYBLINDS_HQ_COORDS[1];
        let isLiveLocation = false;

        if (liveLoc && typeof liveLoc.lat === "number" && typeof liveLoc.lng === "number") {
          lat = liveLoc.lat;
          lng = liveLoc.lng;
          isLiveLocation = true;
        } else if (u.location) {
          const extracted = extractLatLng(u.location);
          if (extracted) {
            lat = extracted.lat;
            lng = extracted.lng;
          }
        }

        const isOnline =
          Boolean(onlinePresence && (onlinePresence as any).has?.(u._id)) ||
          (liveLoc ? (liveLoc as any).isOnline !== false : false);

        return {
          id: u._id,
          name: u.name || "Staff Member",
          role,
          phoneNumber: u.phoneNumber,
          email: u.email,
          checkedIn: isOnline,
          lat,
          lng,
          lastUpdated: liveLoc?.updatedAt || u.updatedAt,
          isLiveLocation,
        };
      });
  }, [users, locations, onlinePresence]);

  const mappedJobs: MapJobRecord[] = useMemo(() => {
    const activeList: MapJobRecord[] = [];

    rawJobs.forEach((job) => {
      if (job.status === JobStatus.Completed) {
        if (!isCompletedJobCompletedToday(job)) return;
      }

      let lat: number | null = null;
      let lng: number | null = null;

      const rawLoc = (job as any).location;
      if (rawLoc && typeof rawLoc === "object" && Array.isArray(rawLoc.coordinates)) {
        lng = Number(rawLoc.coordinates[0]);
        lat = Number(rawLoc.coordinates[1]);
      } else if (rawLoc && typeof rawLoc.lat === "number" && typeof rawLoc.lng === "number") {
        lat = rawLoc.lat;
        lng = rawLoc.lng;
      }

      if (lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng)) {
        activeList.push({
          id: job._id,
          jobId: job.jobId || "JOB",
          customerName: job.customerName || `${job.firstName || ""} ${job.lastName || ""}`.trim() || "Customer",
          address: typeof job.address === "string" ? job.address : "Customer address",
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
          assignedSalesmanName: (job as any).assignedSalesman?.name || (job as any).assignedSalesmanName,
          assignedSalesmanId: (job as any).assignedSalesman?._id || (job as any).assignedSalesmanId,
          assignedFitterName: (job as any).assignedFitter?.name || (job as any).assignedFitterName,
          assignedFitterId: (job as any).assignedFitter?._id || (job as any).assignedFitterId,
          lat,
          lng,
          rawJob: job,
        });
      }
    });

    return activeList;
  }, [rawJobs]);

  const activeRoutes: ActiveJobRoute[] = useMemo(() => {
    const routes: ActiveJobRoute[] = [];
    const staffMap = new globalThis.Map<string, CombinedStaffMember>();
    combinedMembers.forEach((m) => staffMap.set(m.id, m));

    mappedJobs.forEach((job) => {
      if (isJobOnTheWay(job.status)) {
        let matchedStaff: CombinedStaffMember | undefined;

        if (job.assignedSalesmanId && staffMap.has(job.assignedSalesmanId)) {
          matchedStaff = staffMap.get(job.assignedSalesmanId);
        } else if (job.assignedFitterId && staffMap.has(job.assignedFitterId)) {
          matchedStaff = staffMap.get(job.assignedFitterId);
        }

        if (matchedStaff) {
          routes.push({
            jobId: job.id,
            displayId: job.jobId,
            customerName: job.customerName,
            staffName: matchedStaff.name,
            staffRole: matchedStaff.role,
            start: [matchedStaff.lat, matchedStaff.lng],
            end: [job.lat, job.lng],
          });
        }
      }
    });

    return routes;
  }, [mappedJobs, combinedMembers]);

  const filteredMembers = useMemo(() => {
    let result = combinedMembers;

    if (roleFilter !== "ALL") {
      result = result.filter((m) => m.role === roleFilter);
    }

    if (statusFilter === "ONLINE") {
      result = result.filter((m) => m.checkedIn);
    } else if (statusFilter === "OFFLINE") {
      result = result.filter((m) => !m.checkedIn);
    } else if (statusFilter === "ON_THE_WAY") {
      const onTheWayStaffIds = new Set(
        activeRoutes
          .map((r) => {
            const job = mappedJobs.find((j) => j.id === r.jobId);
            return job?.assignedSalesmanId || job?.assignedFitterId;
          })
          .filter(Boolean)
      );
      result = result.filter((m) => onTheWayStaffIds.has(m.id));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.phoneNumber?.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [combinedMembers, roleFilter, statusFilter, searchQuery, activeRoutes, mappedJobs]);

  const filteredJobs = useMemo(() => {
    if (!showJobsToggle) return [];
    if (!searchQuery.trim()) return mappedJobs;

    const q = searchQuery.toLowerCase();
    return mappedJobs.filter(
      (j) =>
        j.customerName.toLowerCase().includes(q) ||
        j.jobId.toLowerCase().includes(q) ||
        j.address.toLowerCase().includes(q) ||
        j.assignedSalesmanName?.toLowerCase().includes(q) ||
        j.assignedFitterName?.toLowerCase().includes(q)
    );
  }, [mappedJobs, showJobsToggle, searchQuery]);

  const selectedMember = useMemo(
    () => combinedMembers.find((m) => m.id === selectedMemberId) || null,
    [combinedMembers, selectedMemberId]
  );

  const selectedJob = useMemo(
    () => mappedJobs.find((j) => j.id === selectedJobId) || null,
    [mappedJobs, selectedJobId]
  );

  const staffJobs = useMemo(() => {
    if (!selectedMember) return [];
    return mappedJobs.filter(
      (j) => j.assignedSalesmanId === selectedMember.id || j.assignedFitterId === selectedMember.id
    );
  }, [selectedMember, mappedJobs]);

  const handleSelectStaff = (member: CombinedStaffMember) => {
    setSelectedMemberId(member.id);
    setSelectedJobId(null);
    setSelectedHq(false);
    setMapCenter({ lat: member.lat, lng: member.lng });
    setMapZoom(14);
  };

  const handleSelectJob = (job: MapJobRecord) => {
    setSelectedJobId(job.id);
    setSelectedMemberId(null);
    setSelectedHq(false);
    setMapCenter({ lat: job.lat, lng: job.lng });
    setMapZoom(15);
  };

  const handleSelectHq = () => {
    setSelectedHq(true);
    setSelectedJobId(null);
    setSelectedMemberId(null);
    setMapCenter(EASYBLINDS_HQ_LATLNG);
    setMapZoom(13);
  };

  // Stats
  const onlineCount = combinedMembers.filter((m) => m.checkedIn).length;
  const offlineCount = combinedMembers.filter((m) => !m.checkedIn).length;
  const onTheWayCount = activeRoutes.length;

  return (
    <div
      className={cn(
        "relative w-full h-full flex flex-col overflow-hidden bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl transition-all duration-300",
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-none" : ""
      )}
    >
      {/* ── TOP FLOATING CONTROL BAR ── */}
      <div className="absolute top-3 inset-x-3 sm:inset-x-5 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 sm:p-2 rounded-xl border border-slate-800 shadow-xl pointer-events-auto">
          {/* Role Filter */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs font-semibold">
            {(["ALL", "Salesman", "Fitter"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] sm:text-xs transition-all",
                  roleFilter === r
                    ? "bg-blue-600 text-white shadow-sm font-bold"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                {r === "ALL" ? "All Staff" : r === "Salesman" ? "Salesmen" : "Fitters"}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="hidden md:flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={cn(
                "px-2 py-1 rounded-md text-[11px] transition-all",
                statusFilter === "ALL" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              )}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter("ONLINE")}
              className={cn(
                "px-2 py-1 rounded-md text-[11px] flex items-center gap-1 transition-all",
                statusFilter === "ONLINE" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online ({onlineCount})
            </button>
            <button
              onClick={() => setStatusFilter("OFFLINE")}
              className={cn(
                "px-2 py-1 rounded-md text-[11px] flex items-center gap-1 transition-all",
                statusFilter === "OFFLINE" ? "bg-rose-600 text-white font-bold" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Offline ({offlineCount})
            </button>
            {onTheWayCount > 0 && (
              <button
                onClick={() => setStatusFilter("ON_THE_WAY")}
                className={cn(
                  "px-2 py-1 rounded-md text-[11px] flex items-center gap-1 transition-all",
                  statusFilter === "ON_THE_WAY" ? "bg-amber-600 text-white font-bold" : "text-amber-400 hover:text-amber-300"
                )}
              >
                <Truck className="w-3 h-3" />
                En Route ({onTheWayCount})
              </button>
            )}
          </div>

          {/* Toggle Jobs Button */}
          <button
            onClick={() => setShowJobsToggle(!showJobsToggle)}
            className={cn(
              "px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all",
              showJobsToggle
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-300"
            )}
          >
            <Briefcase className="w-3 h-3" />
            <span>Jobs ({mappedJobs.length})</span>
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 sm:p-2 rounded-xl border border-slate-800 shadow-xl pointer-events-auto">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <Input
              placeholder="Search staff, customer, job ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 sm:h-8 pl-8 pr-7 text-xs bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 rounded-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-slate-400 hover:text-white"
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
            className="h-7 sm:h-8 px-2.5 bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
            title="Refresh positions and jobs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            <span className="hidden sm:inline ml-1 text-xs">Sync</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSelectHq}
            className="h-7 sm:h-8 px-2.5 bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
            title="Center HQ"
          >
            <Building className="w-3.5 h-3.5 text-orange-500" />
            <span className="hidden sm:inline ml-1 text-xs">HQ</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-7 sm:h-8 px-2.5 bg-slate-950 border-slate-800 text-slate-300 hover:text-white font-semibold text-xs"
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-400 sm:mr-1" />
                <span className="hidden sm:inline">Exit</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-blue-400 sm:mr-1" />
                <span className="hidden sm:inline">Fullscreen</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── GOOGLE MAP CONTAINER ── */}
      <div className="flex-1 w-full h-full relative z-0">
        <GoogleMap
          defaultCenter={EASYBLINDS_HQ_LATLNG}
          defaultZoom={11}
          mapId="measurepro_fleet_map_v1"
          disableDefaultUI={false}
          gestureHandling="greedy"
          className="w-full h-full"
        >
          <GoogleMapController center={mapCenter} zoom={mapZoom} />

          {/* EasyBlinds HQ Marker */}
          <AdvancedMarker
            position={EASYBLINDS_HQ_LATLNG}
            onClick={handleSelectHq}
            title="EasyBlinds HQ"
          >
            <CompanyHqMarker isSelected={selectedHq} />
          </AdvancedMarker>

          {/* HQ InfoWindow */}
          {selectedHq && (
            <InfoWindow
              position={EASYBLINDS_HQ_LATLNG}
              onCloseClick={() => setSelectedHq(false)}
            >
              <div className="p-2 text-slate-900 font-sans min-w-[180px]">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-orange-500" />
                  EasyBlinds HQ
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Nilambur, Kerala</p>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-semibold">
                  <span>Coordinates:</span>
                  <span className="font-mono text-[10px]">11.2766, 76.2258</span>
                </div>
              </div>
            </InfoWindow>
          )}

          {/* ── LIVE DRIVING ROUTES (FOR "ON THE WAY" JOBS) ── */}
          {activeRoutes.map((route) => (
            <LiveRoutePolyline key={`route-${route.jobId}`} route={route} />
          ))}

          {/* ── JOB MARKERS ── */}
          {filteredJobs.map((job) => {
            const isSelected = selectedJob?.id === job.id;
            return (
              <AdvancedMarker
                key={`job-${job.id}`}
                position={{ lat: job.lat, lng: job.lng }}
                onClick={() => handleSelectJob(job)}
                title={`${job.customerName} (${job.jobId})`}
              >
                <JobMarkerElement job={job} isSelected={isSelected} />
              </AdvancedMarker>
            );
          })}

          {/* Job InfoWindow */}
          {selectedJob && (
            <InfoWindow
              position={{ lat: selectedJob.lat, lng: selectedJob.lng }}
              onCloseClick={() => setSelectedJobId(null)}
            >
              <div className="p-2 text-slate-900 font-sans min-w-[240px] max-w-[320px] space-y-2">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                  <span className="font-mono font-bold text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    {selectedJob.jobId}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {selectedJob.status}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900">{selectedJob.customerName}</h4>
                  <p className="text-xs text-slate-500 flex items-start gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                    <span>{selectedJob.address}</span>
                  </p>
                </div>

                {selectedJob.customerPhone && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Contact:</span>
                    <a
                      href={`tel:${selectedJob.customerPhone}`}
                      className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {selectedJob.customerPhone}
                    </a>
                  </div>
                )}

                {(selectedJob.assignedSalesmanName || selectedJob.assignedFitterName) && (
                  <div className="text-[11px] bg-slate-50 p-1.5 rounded border border-slate-200 space-y-0.5">
                    {selectedJob.assignedSalesmanName && (
                      <p className="text-slate-700">
                        <span className="font-bold text-slate-500">Salesman:</span> {selectedJob.assignedSalesmanName}
                      </p>
                    )}
                    {selectedJob.assignedFitterName && (
                      <p className="text-slate-700">
                        <span className="font-bold text-slate-500">Fitter:</span> {selectedJob.assignedFitterName}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </InfoWindow>
          )}

          {/* ── STAFF MARKERS ── */}
          {filteredMembers.map((member) => {
            const isSelected = selectedMember?.id === member.id;
            return (
              <AdvancedMarker
                key={`staff-${member.id}`}
                position={{ lat: member.lat, lng: member.lng }}
                onClick={() => handleSelectStaff(member)}
                title={`${member.name} (${member.role})`}
              >
                <StaffMarkerElement member={member} isSelected={isSelected} />
              </AdvancedMarker>
            );
          })}

          {/* Staff InfoWindow */}
          {selectedMember && (
            <InfoWindow
              position={{ lat: selectedMember.lat, lng: selectedMember.lng }}
              onCloseClick={() => setSelectedMemberId(null)}
            >
              <div className="p-2 text-slate-900 font-sans min-w-[240px] max-w-[320px] space-y-2">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        selectedMember.checkedIn ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                      )}
                    />
                    <span className="font-bold text-xs text-slate-800">
                      {selectedMember.checkedIn ? "Online & Active" : "Offline"}
                    </span>
                  </div>
                  <Badge
                    className={cn(
                      "text-[10px] font-bold text-white",
                      selectedMember.role === "Salesman" ? "bg-blue-600" : "bg-purple-600"
                    )}
                  >
                    {selectedMember.role}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900">{selectedMember.name}</h4>
                  {selectedMember.email && (
                    <p className="text-[11px] text-slate-500">{selectedMember.email}</p>
                  )}
                </div>

                {selectedMember.phoneNumber && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Phone:</span>
                    <a
                      href={`tel:${selectedMember.phoneNumber}`}
                      className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {selectedMember.phoneNumber}
                    </a>
                  </div>
                )}

                {/* Assigned Jobs Summary */}
                <div className="pt-1.5 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Assigned Jobs:</span>
                    <span className="bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded font-mono text-[10px]">
                      {staffJobs.length}
                    </span>
                  </div>

                  {staffJobs.length > 0 ? (
                    <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                      {staffJobs.map((j) => (
                        <div
                          key={j.id}
                          onClick={() => handleSelectJob(j)}
                          className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer text-[11px] flex items-center justify-between"
                        >
                          <div className="min-w-0 pr-1">
                            <p className="font-bold text-slate-800 truncate">{j.customerName}</p>
                            <p className="font-mono text-[9px] text-slate-500">{j.jobId}</p>
                          </div>
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-100 shrink-0">
                            {j.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No assigned jobs today</p>
                  )}
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* ── BOTTOM STATS STRIP ── */}
      <div className="absolute bottom-3 left-3 right-3 sm:left-5 sm:right-auto z-20 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl text-xs text-slate-300 font-semibold pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{onlineCount} Online</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>{offlineCount} Offline</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-1.5 text-amber-400">
            <Briefcase className="w-3 h-3" />
            <span>{mappedJobs.length} Jobs</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminFleetMap() {
  return (
    <GoogleMapsProvider fallbackHeight="100%">
      <FleetMapInner />
    </GoogleMapsProvider>
  );
}
