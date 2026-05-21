"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, addDays, isSameDay, parseISO } from "date-fns";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { CalendarDays, Pencil, X, MapPin, Clock } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobCard, type UnifiedJob } from "@/components/common/JobCard";
import { useAuth } from "@/components/providers/auth-provider";
import { FilterSortBar } from "@/components/common/FilterSortBar";
import { cn } from "@/lib/utils";
import { getJobErrorMessage, getJobs, updateJob, type Job } from "@/lib/jobs";
import { useLiveFitters, type Fitter, type FitterJob } from "@/lib/live-store";
import { getUserErrorMessage, getUsers, type UserRecord, extractLatLng } from "@/lib/users";
import { useLiveLocation } from "@/hooks";

const AssignmentMap = dynamic(() => import("@/components/tracking/FitterMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400 font-light tracking-[0.2em]">LOADING DATA...</div>,
});

const DAILY_SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00"];
type DispatchSortKey = "Default Sorting" | "nearest" | "highest_value" | "newest" | "urgent_first" | "oldest_pending";

function selectedDateFromSlot(date: Date, slot: string) {
  const [hours, minutes] = slot.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next.toISOString();
}

function isJobForDate(job: Job, date: Date) {
  if (!job.scheduledAt) {
    return false;
  }

  try {
    return isSameDay(parseISO(job.scheduledAt), date);
  } catch {
    return false;
  }
}

function toDisplayTime(value?: string) {
  if (!value) {
    return undefined;
  }

  try {
    return format(parseISO(value), "HH:mm");
  } catch {
    return undefined;
  }
}

// Returns the display name of the assigned fitter.
// Prefers looking up fitterId in the lookup map; falls back to legacy note-parsing.
function resolveAssignedFitterName(job: Job, fitterNameById: Map<string, string>): string {
  if (job.assignedTo) {
    // New format: assignedTo is a userId
    const name = fitterNameById.get(job.assignedTo);
    if (name) return name;
    // Legacy fallback: assignedTo might still be a name string
    return job.assignedTo;
  }
  // Oldest legacy: name embedded in notes
  const match = job.notes?.match(/Assigned to ([^@.]+)(?: @|\.|$)/i);
  return match?.[1]?.trim() || "Assigned Team";
}

function getRequestedDateDisplay(job: Job): string | undefined {
  if (job.notes?.includes("REQ_TIME_ONLY:")) {
    const match = job.notes.match(/REQ_TIME_ONLY:(\d{2}:\d{2})/);
    return match ? `Time: ${match[1]}` : undefined;
  }
  if (job.notes?.includes("REQ_DATE_ONLY") && job.scheduledAt) {
    try {
      return format(parseISO(job.scheduledAt), "MMM do");
    } catch {
      return undefined;
    }
  }
  if (job.scheduledAt) {
    try {
      return format(parseISO(job.scheduledAt), "MMM do, HH:mm");
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function toUnifiedJob(job: Job): UnifiedJob {
  const statusLabel = job.status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const priorityLabel = job.priority.charAt(0).toUpperCase() + job.priority.slice(1);

  return {
    id: job._id,
    client: job.customerName,
    email: job.customerEmail,
    phone: job.customerPhone,
    brand: "Easy Blinds",
    productType: job.productType,
    priority: priorityLabel,
    address: job.address,
    area: job.address,
    property: `Qty ${job.quantity ?? 1}`,
    status: statusLabel,
    time: toDisplayTime(job.scheduledAt),
    requestedDate: getRequestedDateDisplay(job),
    endTime: undefined,
    // team is resolved at call site where fitterNameById is available
    team: job.assignedTo,
    assignedBy: job.assignedBy,
    value: job.projectValue ?? ((job.quantity ?? 1) * 1000),
    createdAt: job.createdAt,
  };
}

function toFitterJob(job: Job): FitterJob {
  return {
    id: job._id,
    client: job.customerName,
    address: job.address,
    time: toDisplayTime(job.scheduledAt) ?? "08:00",
    endTime: "",
    timerStartedAt: job.timerStartedAt,
    status: job.status === "in_progress" ? "In Progress" : job.status === "completed" ? "Done" : "Pending",
    value: job.projectValue ?? ((job.quantity ?? 1) * 1000),
    email: job.customerEmail,
    phone: job.customerPhone,
    notes: job.notes,
    brand: "Easy Blinds",
    property: `Qty ${job.quantity ?? 1}`,
    productType: "Blinds",
    priority: job.priority === "high" ? "High" : job.priority === "medium" ? "Medium" : "Low",
  };
}

function sortUnifiedJobs(jobs: UnifiedJob[], sortKey: DispatchSortKey) {
  const next = [...jobs];

  switch (sortKey) {
    case "highest_value":
      return next.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    case "urgent_first":
      return next.sort((a, b) => Number(b.priority === "High") - Number(a.priority === "High"));
    case "newest":
      return next.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    case "oldest_pending":
      return next.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    case "nearest":
    case "Default Sorting":
    default:
      return next;
  }
}

function isSalesmanUser(user: UserRecord) {
  const role = user.role?.toLowerCase() ?? "";
  return role === "salesman" || role === "sales_man" || role === "field";
}

function toSalesmanWorkforceMember(user: UserRecord): Fitter {
  return {
    id: user._id,
    name: user.name,
    role: "Salesman",
    jobRef: "--",
    status: user.liveStatus ?? "Available",
    location: (() => { const ll = extractLatLng(user.location); return ll ? [ll.lat, ll.lng] as [number, number] : undefined; })(),
    locationLabel: user.location?.address,
    lastUpdated: (() => { const u = user.location?.updatedAt; if (!u) return "Not updated"; try { return typeof u === "string" ? toReadableLastUpdated(u) : toReadableLastUpdated(new Date(u).toISOString()); } catch { return "Not updated"; } })(),
    avatar: user.avatar,
    email: user.email,
    phone: user.phone,
    history: [],
    schedule: {
      yesterday: [],
      today: [],
      tomorrow: [],
      upcoming: [],
    },
    capacity: {
      max: user.maxDailyJobs || 5,
      current: 0,
      remaining: user.maxDailyJobs || 5,
    },
    nextAvailableSlot: "Available",
  };
}

function toReadableLastUpdated(source?: string) {
  if (!source) return "Not updated";

  try {
    return format(parseISO(source), "MMM d, HH:mm");
  } catch {
    return "Not updated";
  }
}

export default function SmartSalesmanAssignmentsPage() {
  const { user } = useAuth();
  const { fitters: baseFitters, isLoaded } = useLiveFitters();
  const { locations: liveLocations } = useLiveLocation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [salesmanUsers, setSalesmanUsers] = useState<UserRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<DispatchSortKey>("Default Sorting");
  const [selectedMapFitter, setSelectedMapFitter] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState<Date>(new Date());

  const isToday = isSameDay(viewDate, new Date());
  const isTomorrow = isSameDay(viewDate, addDays(new Date(), 1));

  const loadJobs = useCallback(async () => {
    setIsLoadingJobs(true);
    setLoadError(null);

    try {
      const response = await getJobs({ limit: 100 });
      setJobs(response.items);
    } catch (error) {
      const message = getJobErrorMessage(error, "Unable to load jobs.");
      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const loadSalesmen = useCallback(async () => {
    setIsLoadingUsers(true);

    try {
      const users = await getUsers();
      setAllUsers(users);
      setSalesmanUsers(users.filter(isSalesmanUser));
    } catch (error) {
      const message = getUserErrorMessage(error, "Unable to load salesmen for live assignment map.");
      toast.error(message);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadSalesmen();
  }, [loadSalesmen]);

  const sortOptions = ["Default Sorting", "Nearest Agent", "Highest Value", "Date: Newest", "Urgent First", "Oldest Pending"];
  const handleSortChange = (sort: string) => {
    const map: Record<string, DispatchSortKey> = {
      "Default Sorting": "Default Sorting",
      "Nearest Agent": "nearest",
      "Highest Value": "highest_value",
      "Date: Newest": "newest",
      "Urgent First": "urgent_first",
      "Oldest Pending": "oldest_pending",
    };
    setSortKey(map[sort] ?? "Default Sorting");
  };
  const currentSortLabel = sortOptions.find((option) => ({
    "Default Sorting": "Default Sorting",
    "Nearest Agent": "nearest",
    "Highest Value": "highest_value",
    "Date: Newest": "newest",
    "Urgent First": "urgent_first",
    "Oldest Pending": "oldest_pending",
  })[option] === sortKey) ?? "Default Sorting";

  const [dialogState, setDialogState] = useState<{
    type: "assign" | "edit";
    jobId: string;
    jobClient: string;
    fitterId?: string;
    salesmanId?: string;
    originalFitterId?: string;
    originalSalesmanId?: string;
    currentSlot?: string;
    currentDate?: Date;
    requestedDate?: string;
  } | null>(null);

  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined);
  const [customTime, setCustomTime] = useState<string>("09:00");

  const userNameById = useMemo(() => {
    const map = new Map<string, string>();
    allUsers.forEach((u) => map.set(u._id, u.name));
    baseFitters.forEach((f) => map.set(f.id, f.name));
    return map;
  }, [baseFitters, allUsers]);

  const fitters = useMemo<Fitter[]>(() => {
    return baseFitters.map((fitter) => {
      const assignedJobs = jobs.filter((job) => {
        if (!["scheduled", "in_progress", "completed"].includes(job.status)) {
          return false;
        }
        if (job.assignedFitter === fitter.id || job.assignedTo === fitter.id) return true;
        if (job.assignedTo && job.assignedTo.toLowerCase() === fitter.name.toLowerCase()) return true;

        const match = job.notes?.match(/Assigned to ([^@.]+)(?: @|\.|$)/i);
        return match?.[1]?.trim().toLowerCase() === fitter.name.toLowerCase();
      });

      const today = assignedJobs.filter((job) => isJobForDate(job, new Date())).map(toFitterJob);
      const tomorrow = assignedJobs.filter((job) => isJobForDate(job, addDays(new Date(), 1))).map(toFitterJob);
      const current = isToday ? today.length : isTomorrow ? tomorrow.length : 0;
      const remaining = Math.max(0, (fitter.capacity?.max || 5) - current);
      const busySlots = isToday ? today.map((job) => job.time) : isTomorrow ? tomorrow.map((job) => job.time) : [];
      const nextAvailableSlot = DAILY_SLOTS.find((slot) => !busySlots.includes(slot)) ?? "None";

      return {
        ...fitter,
        status: remaining === 0 ? "Fully Booked" : fitter.status === "Fully Booked" ? "Available" : fitter.status,
        schedule: {
          yesterday: [],
          today,
          tomorrow,
          upcoming: assignedJobs.filter((job) => job.scheduledAt && !isJobForDate(job, new Date()) && !isJobForDate(job, addDays(new Date(), 1))).map(toFitterJob),
        },
        capacity: {
          max: fitter.capacity?.max || 5,
          current,
          remaining,
        },
        nextAvailableSlot,
      };
    });
  }, [baseFitters, jobs, isToday, isTomorrow]);

  const selectedPendingJobForMap = useMemo(() => {
    if (!selectedJobId) return undefined;
    const job = jobs.find((j) => j._id === selectedJobId && j.status === "pending");
    if (!job) return undefined;
    
    let lat = 25.2048;
    let lng = 55.2708;
    if (job.location?.coordinates && job.location.coordinates.length >= 2) {
      lng = job.location.coordinates[0];
      lat = job.location.coordinates[1];
    }
    
    return {
      id: job._id,
      location: { lat, lng },
      address: job.address || "Pending Job Location",
      client: job.customerName || "Client"
    };
  }, [selectedJobId, jobs]);

  const salesmen = useMemo<Fitter[]>(() => {
    return salesmanUsers.map((user) => {
      const salesmanName = user.name;
      const assignedJobs = jobs.filter((job) => {
        if (!["scheduled", "in_progress", "completed", "pending"].includes(job.status)) {
          return false;
        }
        if (job.assignedSalesman === user._id || job.assignedTo === user._id) return true;
        if (job.assignedTo && job.assignedTo.toLowerCase() === salesmanName.toLowerCase()) return true;

        const match = job.notes?.match(/Assigned to ([^@.]+)(?: @|\.|$)/i);
        return match?.[1]?.trim().toLowerCase() === salesmanName.toLowerCase();
      });

      const today = assignedJobs.filter((job) => isJobForDate(job, new Date())).map(toFitterJob);
      const tomorrow = assignedJobs.filter((job) => isJobForDate(job, addDays(new Date(), 1))).map(toFitterJob);
      const activeJob = today.find((j) => j.status === "In Progress") ?? today.find((j) => j.status === "Pending") ?? tomorrow.find((j) => j.status === "In Progress") ?? tomorrow.find((j) => j.status === "Pending");
      const current = isToday ? today.length : isTomorrow ? tomorrow.length : 0;
      const maxCapacity = 999;
      const remaining = Math.max(0, maxCapacity - current);
      const busySlots = isToday ? today.map((job) => job.time) : isTomorrow ? tomorrow.map((job) => job.time) : [];
      const nextAvailableSlot = DAILY_SLOTS.find((slot) => !busySlots.includes(slot)) ?? "None";

      return {
        id: user._id,
        name: user.name,
        role: "Salesman",
        jobRef: activeJob?.id ?? "--",
        status: remaining === 0 && maxCapacity !== 999 ? "Fully Booked" : user.liveStatus ?? "Available",
        location: (() => { 
            const liveLoc = liveLocations?.find(loc => loc.userId === user._id);
            if (liveLoc) {
                return [liveLoc.lat, liveLoc.lng] as [number, number];
            }
            const ll = extractLatLng(user.location); 
            if (ll) return [ll.lat, ll.lng] as [number, number];
            if (selectedPendingJobForMap?.location) {
                return [
                    selectedPendingJobForMap.location.lat + (Math.random() - 0.5) * 0.05, 
                    selectedPendingJobForMap.location.lng + (Math.random() - 0.5) * 0.05
                ] as [number, number];
            }
            return [25.2048, 55.2708] as [number, number]; 
        })(),
        locationLabel: (() => {
            const liveLoc = liveLocations?.find(loc => loc.userId === user._id);
            if (liveLoc) return "Live GPS Tracking";
            return user.location?.address || "Simulated Location";
        })(),
        lastUpdated: (() => { const u = user.location?.updatedAt; if (!u) return "Not updated"; try { return typeof u === "string" ? toReadableLastUpdated(u) : toReadableLastUpdated(new Date(u).toISOString()); } catch { return "Not updated"; } })(),
        avatar: user.avatar,
        email: user.email,
        phone: user.phone,
        history: [],
        schedule: {
          yesterday: [],
          today,
          tomorrow,
          upcoming: assignedJobs.filter((job) => job.scheduledAt && !isJobForDate(job, new Date()) && !isJobForDate(job, addDays(new Date(), 1))).map(toFitterJob),
        },
        capacity: {
          max: maxCapacity,
          current,
          remaining,
        },
        nextAvailableSlot,
      };
    });
  }, [salesmanUsers, jobs, isToday, isTomorrow, liveLocations, selectedPendingJobForMap]);

  const workforceMembers = useMemo<Fitter[]>(() => {
    return salesmen;
  }, [salesmen]);

  const resolveUnifiedJob = useCallback((job: Job): UnifiedJob => {
    const raw = toUnifiedJob(job);

    // Attempt to resolve team name nicely
    let assignedFitterName: string | undefined;
    let assignedSalesmanName: string | undefined;

    if (job.assignedFitter && userNameById.has(job.assignedFitter)) {
      assignedFitterName = userNameById.get(job.assignedFitter);
    }
    if (job.assignedSalesman && userNameById.has(job.assignedSalesman)) {
      assignedSalesmanName = userNameById.get(job.assignedSalesman);
    }

    let teamName = "Assigned Team";
    if (!assignedFitterName && !assignedSalesmanName) {
      teamName = resolveAssignedFitterName(job, userNameById);
    } else {
      const parts = [];
      if (assignedFitterName) parts.push(assignedFitterName);
      if (assignedSalesmanName) parts.push(assignedSalesmanName);
      teamName = parts.join(" & ");
    }

    let assignedBy = raw.assignedBy;
    if (assignedBy && userNameById.has(assignedBy)) {
      assignedBy = userNameById.get(assignedBy);
    }

    return { ...raw, team: teamName, assignedFitterName, assignedSalesmanName, assignedBy };
  }, [userNameById]);

  const pendingJobs = useMemo(() => sortUnifiedJobs(jobs.filter((job) => job.status === "pending" && !job.quotation).map(resolveUnifiedJob), sortKey), [jobs, sortKey, resolveUnifiedJob]);
  const activeJobs = useMemo(
    () => sortUnifiedJobs(jobs.filter((job) => ["scheduled", "in_progress"].includes(job.status) && isJobForDate(job, viewDate)).map(resolveUnifiedJob), sortKey),
    [jobs, sortKey, viewDate, resolveUnifiedJob],
  );



  const [roadData, setRoadData] = useState<Record<string, {
    distToNewJob: number;
    durationToNewJob: number;
    distToActiveJob?: number;
    durationToActiveJob?: number;
  }>>({});

  useEffect(() => {
    if (!selectedJobId || !selectedPendingJobForMap) {
      setRoadData({});
      return;
    }

    let active = true;

    const getRouteData = async (start: [number, number], end: { lat: number; lng: number }) => {
      const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end.lng},${end.lat}?overview=false`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("OSRM error");
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const dist = data.routes[0].distance / 1000; // in km
        const rawDuration = data.routes[0].duration; // in seconds
        
        let trafficMultiplier = 1.25;
        if (dist < 10) {
          trafficMultiplier = 1.40;
        } else if (dist < 30) {
          trafficMultiplier = 1.30;
        } else {
          trafficMultiplier = 1.20;
        }
        const intersectionBuffer = dist * 15;
        const duration = Math.round(rawDuration * trafficMultiplier + intersectionBuffer);
        return { dist, duration };
      }
      throw new Error("No route found");
    };

    const getFallbackRouteData = (start: [number, number], end: [number, number]) => {
      const R = 6371; 
      const dLat = (end[0] - start[0]) * Math.PI / 180;
      const dLon = (end[1] - start[1]) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(start[0] * Math.PI / 180) * Math.cos(end[0] * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;
      const duration = (dist / 32) * 3600;
      return { dist, duration };
    };

    const fetchRoadDistances = async () => {
      const newData: Record<string, {
        distToNewJob: number;
        durationToNewJob: number;
        distToActiveJob?: number;
        durationToActiveJob?: number;
      }> = {};
      
      const membersToFetch = workforceMembers.filter(m => m.location && m.capacity.remaining > 0);
      
      await Promise.all(
        membersToFetch.map(async (member) => {
          if (!member.location) return;
          try {
            const rawActiveJob = jobs.find(j => j._id === member.jobRef);
            let activeJobLocation: { lat: number; lng: number } | null = null;
            if (rawActiveJob?.location?.coordinates && rawActiveJob.location.coordinates.length >= 2) {
              activeJobLocation = {
                lng: rawActiveJob.location.coordinates[0],
                lat: rawActiveJob.location.coordinates[1],
              };
            }

            const statusLower = member.status?.toLowerCase() ?? "";
            const isMeasuring = statusLower.includes("progress") || statusLower.includes("working");
            const isOnTheWay = statusLower.includes("way");

            // 1. Fetch direct route (from current location to new job) for visual distance
            let distToNewJob = 0;
            let directDuration = 0;
            try {
              const route = await getRouteData(member.location, selectedPendingJobForMap.location);
              distToNewJob = route.dist;
              directDuration = route.duration;
            } catch (err) {
              console.warn(`Fallback for member ${member.id} direct route`, err);
              const fallback = getFallbackRouteData(member.location, [selectedPendingJobForMap.location.lat, selectedPendingJobForMap.location.lng]);
              distToNewJob = fallback.dist;
              directDuration = fallback.duration;
            }

            // 2. Fetch active job leg if they are on the way
            let distToActiveJob: number | undefined;
            let durationToActiveJob: number | undefined;

            if (isOnTheWay && activeJobLocation) {
              try {
                const route = await getRouteData(member.location, activeJobLocation);
                distToActiveJob = route.dist;
                durationToActiveJob = route.duration;
              } catch (err) {
                console.warn(`Fallback for member ${member.id} to active job`, err);
              }
            }

            // 3. Fetch second leg duration (from active job to new job) if they are busy
            let durationToNewJob = directDuration; // Default to direct duration if they are available
            if (activeJobLocation && (isMeasuring || isOnTheWay)) {
              try {
                const route = await getRouteData([activeJobLocation.lat, activeJobLocation.lng], selectedPendingJobForMap.location);
                durationToNewJob = route.duration;
              } catch (err) {
                console.warn(`Fallback for member ${member.id} active job to new job`, err);
                const fallback = getFallbackRouteData([activeJobLocation.lat, activeJobLocation.lng], [selectedPendingJobForMap.location.lat, selectedPendingJobForMap.location.lng]);
                durationToNewJob = fallback.duration;
              }
            }

            newData[member.id] = {
              distToNewJob,
              durationToNewJob,
              distToActiveJob,
              durationToActiveJob,
            };
          } catch (err) {
            console.error(`Failed to fetch road distance for member ${member.id}`, err);
          }
        })
      );

      if (active) {
        setRoadData(newData);
      }
    };

    fetchRoadDistances();

    return () => {
      active = false;
    };
  }, [selectedJobId, selectedPendingJobForMap, workforceMembers, jobs]);

  const recommendedFitters = useMemo(() => {
    if (!selectedJobId || !selectedPendingJobForMap) return [];

    const result = workforceMembers
      .filter((member) => member.capacity.remaining > 0)
      .map((member) => {
        const rawActiveJob = jobs.find(j => j._id === member.jobRef);
        let activeJobLocation: { lat: number; lng: number } | null = null;
        if (rawActiveJob?.location?.coordinates && rawActiveJob.location.coordinates.length >= 2) {
          activeJobLocation = {
            lng: rawActiveJob.location.coordinates[0],
            lat: rawActiveJob.location.coordinates[1],
          };
        }

        const statusLower = member.status?.toLowerCase() ?? "";
        const isMeasuring = statusLower.includes("progress") || statusLower.includes("working");
        const isOnTheWay = statusLower.includes("way");

        const getFallback = (start: [number, number], end: [number, number]) => {
          const R = 6371; 
          const dLat = (end[0] - start[0]) * Math.PI / 180;
          const dLon = (end[1] - start[1]) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(start[0] * Math.PI / 180) * Math.cos(end[0] * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const dist = R * c;
          const duration = (dist / 32) * 3600;
          return { dist, duration };
        };

        let durationToActiveJob = 0;
        if (isOnTheWay && activeJobLocation && member.location) {
          const data = roadData[member.id];
          if (data?.durationToActiveJob !== undefined) {
            durationToActiveJob = data.durationToActiveJob;
          } else {
            durationToActiveJob = getFallback(member.location, [activeJobLocation.lat, activeJobLocation.lng]).duration;
          }
        }

        let distToNewJob = 0;
        let durationToNewJob = 0;

        if (member.location && selectedPendingJobForMap.location) {
          const data = roadData[member.id];
          if (data?.distToNewJob !== undefined) {
            distToNewJob = data.distToNewJob;
            durationToNewJob = data.durationToNewJob;
          } else {
            const fbDirect = getFallback(member.location, [selectedPendingJobForMap.location.lat, selectedPendingJobForMap.location.lng]);
            distToNewJob = fbDirect.dist;

            if (activeJobLocation && (isMeasuring || isOnTheWay)) {
              const fbActiveToNew = getFallback([activeJobLocation.lat, activeJobLocation.lng], [selectedPendingJobForMap.location.lat, selectedPendingJobForMap.location.lng]);
              durationToNewJob = fbActiveToNew.duration;
            } else {
              durationToNewJob = fbDirect.duration;
            }
          }
        }

        let measureTimeSecs = 0;
        const activeJob = member.schedule.today.find(j => j.id === member.jobRef);
        let countdownSecs = -1;

        if (isMeasuring) {
          if (activeJob && activeJob.status === "In Progress" && activeJob.timerStartedAt) {
            const elapsed = Math.floor((Date.now() - new Date(activeJob.timerStartedAt).getTime()) / 1000);
            const remaining = (45 * 60) - elapsed;
            countdownSecs = remaining > 0 ? remaining : 0;
          }
          measureTimeSecs = countdownSecs >= 0 ? countdownSecs : (45 * 60);
        } else if (isOnTheWay) {
          measureTimeSecs = 45 * 60;
        }

        const duration = durationToActiveJob + measureTimeSecs + durationToNewJob;

        return {
          id: member.id,
          name: member.name,
          role: member.role,
          dist: distToNewJob,
          duration,
          countdownSecs,
          timerStartedAt: activeJob?.timerStartedAt,
          isFree: member.status === "Available"
        };
      });

    return result.sort((a, b) => {
       if (a.isFree && !b.isFree) return -1;
       if (!a.isFree && b.isFree) return 1;

       if (a.duration !== undefined && b.duration !== undefined) {
          return a.duration - b.duration;
       }
       if (a.dist !== undefined && b.dist !== undefined) return a.dist - b.dist;
       return 0;
    });
  }, [selectedJobId, workforceMembers, selectedPendingJobForMap, roadData, jobs]);

  const initiateAssignment = (jobId: string, memberId: string) => {
    const member = workforceMembers.find((item) => item.id === memberId);
    const job = [...pendingJobs, ...activeJobs].find((item) => item.id === jobId);
    if (!member || !job) return;

    if (member.capacity.remaining <= 0) {
      toast.error("Compliance Error: Maximum daily capacity reached.");
      return;
    }

    const sourceJob = jobs.find((item) => item._id === jobId);

    let targetDate = viewDate;
    let targetTime = "09:00";

    if (sourceJob?.scheduledAt) {
      try {
        const parsed = parseISO(sourceJob.scheduledAt);
        if (!isNaN(parsed.getTime())) {
          targetDate = parsed;
          targetTime = format(parsed, "HH:mm");
        }
      } catch (e) {
        // fallback
      }
    }

    setRescheduleDate(targetDate);
    setCustomTime(targetTime);
    setDialogState({
      type: "assign",
      jobId,
      jobClient: job.client,
      fitterId: member.role === "Fitter" ? member.id : sourceJob?.assignedFitter,
      salesmanId: member.role === "Salesman" ? member.id : sourceJob?.assignedSalesman,
      currentDate: viewDate,
      requestedDate: getRequestedDateDisplay(sourceJob as Job),
    });
  };

  const initiateEdit = (jobId: string, jobTime: string, jobClient: string) => {
    const sourceJob = jobs.find((item) => item._id === jobId);

    let targetDate = viewDate;
    if (sourceJob?.scheduledAt) {
      try {
        const parsed = parseISO(sourceJob.scheduledAt);
        if (!isNaN(parsed.getTime())) {
          targetDate = parsed;
        }
      } catch (e) {
        // fallback
      }
    }

    setRescheduleDate(targetDate);
    setCustomTime(jobTime || "09:00");
    setDialogState({
      type: "edit",
      jobId,
      jobClient,
      fitterId: sourceJob?.assignedFitter || sourceJob?.assignedTo,
      salesmanId: sourceJob?.assignedSalesman,
      originalFitterId: sourceJob?.assignedFitter || sourceJob?.assignedTo,
      originalSalesmanId: sourceJob?.assignedSalesman,
      currentSlot: jobTime,
      currentDate: viewDate,
      requestedDate: getRequestedDateDisplay(sourceJob as Job),
    });
  };

  const openRescheduleForJob = (job: UnifiedJob) => {
    const sourceJob = jobs.find((item) => item._id === job.id);
    const scheduledTime = job.time ?? toDisplayTime(sourceJob?.scheduledAt) ?? "08:00";

    setSelectedJobId(job.id);
    initiateEdit(job.id, scheduledTime, job.client);
  };

  const handleDialogFitterChange = (fitterId: string) => {
    setDialogState((current) => current ? {
      ...current,
      fitterId,
    } : current);
  };

  const handleDialogSalesmanChange = (salesmanId: string) => {
    setDialogState((current) => current ? {
      ...current,
      salesmanId,
    } : current);
  };

  const confirmAction = async (timeSlot: string) => {
    if (!dialogState || !rescheduleDate) return;
    if (!dialogState.salesmanId) {
      toast.error("Please select a Salesman");
      return;
    }

    const newDateStr = format(rescheduleDate, "yyyy-MM-dd");
    const scheduledAt = selectedDateFromSlot(rescheduleDate, timeSlot);

    try {
      const assignedName = [
        dialogState.fitterId ? userNameById.get(dialogState.fitterId) : null,
        dialogState.salesmanId ? userNameById.get(dialogState.salesmanId) : null
      ].filter(Boolean).join(" & ");

      const assignedToId = dialogState.salesmanId || dialogState.fitterId;
      const sourceJob = jobs.find((item) => item._id === dialogState.jobId);

      const updated = await updateJob(dialogState.jobId, {
        status: "scheduled",
        scheduledAt,
        assignedTo: assignedToId,
        assignedFitter: dialogState.fitterId,
        assignedSalesman: dialogState.salesmanId,
        assignedBy: user?.name || user?._id || "Sales Manager",
        notes: `${sourceJob?.notes ? sourceJob.notes + '\n\n' : ''}Assigned to ${assignedName} @ ${timeSlot}. Scheduled by ${user?.name || "Sales Manager"} from Smart Dispatch.`,
      });
      setJobs((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      toast.success(dialogState.type === "assign" ? `Assigned to ${assignedName} on ${newDateStr} @ ${timeSlot}` : `Rescheduled to ${newDateStr} @ ${timeSlot}`);
      setDialogState(null);
      setSelectedJobId(null);
      setSelectedMapFitter(null);
    } catch (error) {
      toast.error(getJobErrorMessage(error, "Dispatch operation failed."));
    }
  };

  const handleUnassign = async () => {
    if (!dialogState) return;

    try {
      const updated = await updateJob(dialogState.jobId, {
        status: "pending",
        assignedTo: "",
        assignedFitter: "",
        assignedSalesman: "",
        assignedBy: "",
        notes: "Returned to pending queue from Smart Dispatch.",
      });
      setJobs((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      toast.info("Unassigned. Job returned to pending.");
      setDialogState(null);
    } catch (error) {
      toast.error(getJobErrorMessage(error, "Unable to unassign job."));
    }
  };

  const isLoading = !isLoaded || isLoadingJobs || isLoadingUsers;

  return (
    <div className="flex h-[calc(100vh-6rem)] overflow-hidden bg-white">
      <div className="w-full xl:w-[500px] flex flex-col border-r border-slate-200 bg-white z-20 shadow-xl">
        <div className="p-8 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-slate-400 font-bold mb-2">
            <div className="w-8 h-px bg-amber-600"></div>
            <span>Workforce Optimization</span>
          </div>
          <div className="flex justify-between items-end mb-6">
            <h1 className="text-3xl font-light text-slate-900">
              Smart <span className="font-medium">Salesman Dispatch</span>
            </h1>
          </div>

          <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-100">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className={cn("text-xs font-medium h-7 px-3 rounded-md transition-all", isToday ? "bg-white shadow-sm text-slate-900 border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50")} onClick={() => setViewDate(new Date())}>Today</Button>
              <Button variant="ghost" size="sm" className={cn("text-xs font-medium h-7 px-3 rounded-md transition-all", isTomorrow ? "bg-white shadow-sm text-slate-900 border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50")} onClick={() => setViewDate(addDays(new Date(), 1))}>Tomorrow</Button>
            </div>
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 mx-2">
              <span className="text-xs text-slate-600 font-semibold">{format(viewDate, "MMM do")}</span>
              <Popover>
                <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50"><CalendarDays className="w-3.5 h-3.5" /></Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end"><Calendar mode="single" selected={viewDate} onSelect={(date) => date && setViewDate(date)} initialFocus /></PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50">
          <FilterSortBar
            onFilterClick={() => {
              toast.info("This view is connected to jobs. Use the date picker and status tabs to narrow dispatch work.");
              loadJobs();
            }}
            onSortChange={handleSortChange}
            currentSort={currentSortLabel}
            sortOptions={sortOptions}
            className="border-t border-b-0"
          />

          {(isLoading || loadError) && (
            <div className={cn("px-6 py-2 text-[10px] uppercase tracking-widest font-bold border-b", loadError ? "bg-red-50 text-red-600 border-red-100" : "bg-amber-50 text-amber-700 border-amber-100")}>
              {loadError ?? "Syncing Smart Dispatch jobs..."}
            </div>
          )}

          <Tabs defaultValue="pending" className="flex-1 flex flex-col min-h-0">
            <div className="px-6 pt-4 bg-white border-b border-slate-100 pb-0">
              <TabsList className="bg-slate-100 p-1 rounded-xl w-full flex h-auto gap-1">
                <TabsTrigger value="pending" className="flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm transition-all border border-transparent data-[state=active]:border-slate-200/50">
                  <span className="mr-2">Pending</span>
                  {pendingJobs.length > 0 && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md text-[10px]">{pendingJobs.length}</span>}
                </TabsTrigger>
                <TabsTrigger value="active" className="flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all border border-transparent data-[state=active]:border-slate-200/50">
                  <span className="mr-2">Scheduled</span>
                  {activeJobs.length > 0 && <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md text-[10px]">{activeJobs.length}</span>}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="pending" className="flex-1 overflow-y-auto outline-none p-4 pr-3 scrollbar-container min-h-0">
              <style jsx>{`
                .scrollbar-container::-webkit-scrollbar { width: 6px; }
                .scrollbar-container::-webkit-scrollbar-track { background: transparent; }
                .scrollbar-container::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
                .scrollbar-container::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
              `}</style>
              <div className="space-y-3">
                {pendingJobs.map((job) => {
                  const isSelected = selectedJobId === job.id;
                  return (
                    <JobCard
                      key={job.id}
                      job={{ ...job, recommendedFitters }}
                      isSelected={isSelected}
                      onSelect={() => setSelectedJobId(isSelected ? null : job.id)}
                      onAction={(action, payload) => {
                        if (action === "assign") {
                          initiateAssignment(job.id, payload);
                        }
                      }}
                      variant="assignment"
                    />
                  );
                })}
                {!isLoading && pendingJobs.length === 0 && <div className="text-center py-10 text-slate-300 text-sm font-light">No pending jobs.</div>}
              </div>
            </TabsContent>

            <TabsContent value="active" className="flex-1 overflow-y-auto outline-none p-4 min-h-0">
              <div className="space-y-3">
                {activeJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSelected={selectedJobId === job.id}
                    onSelect={() => openRescheduleForJob(job)}
                    onAction={(action) => {
                      if (action === "manage") {
                        openRescheduleForJob(job);
                      }
                    }}
                    variant="schedule"
                  />
                ))}
                {!isLoading && activeJobs.length === 0 && <div className="text-center py-10 text-slate-300 text-sm font-light">No scheduled jobs for this date.</div>}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 bg-slate-100 relative">
        <AssignmentMap fitters={workforceMembers} selectedFitterId={selectedMapFitter} onSelectFitter={setSelectedMapFitter} filterRole="Salesman" selectedJob={selectedPendingJobForMap} />
        <div className="absolute bottom-6 left-6 z-30 bg-white/80 backdrop-blur-md border border-white/50 p-4 shadow-2xl rounded-2xl max-w-sm ring-1 ring-black/5">
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-3">Live Fleet Status</h4>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-medium text-slate-700">
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 shadow-sm relative"><span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-emerald-500"></span></span> Available</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-100 shadow-sm"></span> In Progress</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-100 shadow-sm"></span> On the Way</div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-100 shadow-sm"></div> Fully Booked</div>
          </div>
        </div>
        {selectedMapFitter && (
          <div className="absolute top-6 right-6 z-30 w-96 bg-white/80 backdrop-blur-md shadow-2xl border border-white/50 animate-in slide-in-from-right-4 flex flex-col max-h-[calc(100vh-3rem)] rounded-3xl overflow-hidden ring-1 ring-black/5">
            {(() => {
              const fitter = workforceMembers.find((item) => item.id === selectedMapFitter);
              if (!fitter) return null;
              const activeSchedule = isToday ? fitter.schedule.today : isTomorrow ? fitter.schedule.tomorrow : [];
              const capacityPercent = (activeSchedule.length / fitter.capacity.max) * 100;
              const activeJobObj = fitter.schedule.today.find(j => j.id === fitter.jobRef) ?? 
                                   fitter.schedule.tomorrow.find(j => j.id === fitter.jobRef) ?? 
                                   fitter.schedule.upcoming.find(j => j.id === fitter.jobRef);
              return (
                <>
                  <div className="p-6 border-b border-slate-100/50 flex justify-between items-start bg-slate-50/50">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 rounded-2xl border-2 border-white shadow-md bg-white"><AvatarImage src={fitter.avatar} /><AvatarFallback>{fitter.role === "Salesman" ? "SM" : "FT"}</AvatarFallback></Avatar>
                      <div>
                        <h3 className="text-lg font-light text-slate-900">{fitter.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className={cn(
                            "w-2.5 h-2.5 rounded-full relative inline-block",
                            (fitter.status as string) === "Available" ? "bg-emerald-500 ring-2 ring-emerald-100" :
                            (fitter.status as string) === "On the way" || (fitter.status as string) === "On Road" ? "bg-amber-500 ring-2 ring-amber-100" :
                            (fitter.status as string) === "In progress" || (fitter.status as string) === "Measuring" || (fitter.status as string) === "In Progress" ? "bg-blue-500 ring-2 ring-blue-100" :
                            (fitter.status as string) === "Fully Booked" ? "bg-red-500 ring-2 ring-red-100" :
                            "bg-slate-400 ring-2 ring-slate-100"
                          )}>
                            {((fitter.status as string) === "On the way" || (fitter.status as string) === "In progress" || (fitter.status as string) === "In Progress") && (
                              <span className="absolute inset-0 rounded-full animate-ping opacity-25 bg-current"></span>
                            )}
                          </span>
                          {fitter.role ?? "Fitter"} · {fitter.status}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setSelectedMapFitter(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    {fitter.locationLabel && (
                      <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Location</span>
                          <span className="leading-snug">{fitter.locationLabel}</span>
                        </div>
                      </div>
                    )}

                    {activeJobObj && ((fitter.status as string) === "On the way" || (fitter.status as string) === "In progress" || (fitter.status as string) === "In Progress" || (fitter.status as string) === "Measuring") && (
                      <div className={cn(
                        "flex items-start gap-2.5 text-xs p-3 rounded-xl border",
                        (fitter.status as string) === "On the way"
                          ? "bg-amber-50/60 border-amber-100/80 text-amber-900"
                          : "bg-blue-50/60 border-blue-100/80 text-blue-900"
                      )}>
                        <Clock className={cn("w-4.5 h-4.5 mt-0.5 flex-shrink-0", (fitter.status as string) === "On the way" ? "text-amber-500" : "text-blue-500")} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {(fitter.status as string) === "On the way" ? "Traveling To" : "Active Measure Job"}
                          </span>
                          <span className="font-semibold text-slate-900 mt-0.5 truncate">{activeJobObj.client}</span>
                          <span className="text-slate-500 text-[11px] leading-tight mt-0.5 truncate">{activeJobObj.address}</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        <span>Workload ({format(viewDate, "MMM do")})</span>
                        <span className={cn(fitter.capacity.remaining === 0 ? "text-red-600" : "text-emerald-600")}>
                          {activeSchedule.length} Assignment{activeSchedule.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className={cn("h-full transition-all", capacityPercent >= 100 ? "bg-red-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, capacityPercent)}%` }}></div></div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Timeline: {format(viewDate, "EEE, d MMM")}</h4>
                      <div className="space-y-0 relative border-l border-slate-200 ml-2">
                        {activeSchedule.length === 0 ? (
                          <div className="pl-6 pb-2 text-sm italic text-slate-400">No jobs assigned for this day.</div>
                        ) : (
                          [...activeSchedule].sort((a, b) => (a.time || "").localeCompare(b.time || "")).map((job) => (
                            <div key={job.id} className="pl-6 pb-6 relative last:pb-0 group">
                              <div className="absolute -left-[5px] top-1.5 w-[9px] h-[9px] rounded-full border-2 ring-4 ring-white transition-colors bg-white border-slate-400 group-hover:border-slate-600 cursor-pointer"></div>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="text-xs font-mono font-medium text-slate-400 mb-0.5">{job.time || "Unscheduled"}</div>
                                  <div className="cursor-pointer" onClick={() => initiateEdit(job.id, job.time, job.client)}>
                                    <div className="text-sm font-medium text-slate-800 hover:text-amber-600 transition-colors flex items-center justify-between pr-2">
                                      <div className="flex flex-col"><span>{job.client || "Assigned Job"}</span><span className="text-xs text-slate-500 font-normal">{job.address || "On-site"}</span></div>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-slate-600"><Pencil className="w-3 h-3" /></Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      <Dialog open={!!dialogState} onOpenChange={(open) => !open && setDialogState(null)}>
        <DialogContent className="sm:max-w-4xl bg-white p-0 overflow-hidden flex flex-col md:flex-row gap-0">
          <div className="bg-slate-50 p-6 border-r border-slate-100 w-full md:w-1/2 flex flex-col">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-light text-slate-900 mb-1">
                {dialogState?.type === "edit" ? "Reschedule" : "Confirm Dispatch"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {dialogState?.type === "edit" ? `Moving ${dialogState.jobClient}` : `Assigning ${dialogState?.jobClient}`}
              </DialogDescription>
              <div className="pt-3">
                {dialogState?.requestedDate ? (
                  <div className="text-[10px] uppercase tracking-wider text-amber-600 font-bold bg-amber-50/80 border border-amber-200/50 inline-flex items-center gap-1.5 px-2 py-1 rounded-sm">
                    <CalendarDays className="w-3.5 h-3.5" />
                    Requested: {dialogState.requestedDate}
                  </div>
                ) : (
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-slate-50 border border-slate-200/50 inline-flex items-center gap-1.5 px-2 py-1 rounded-sm">
                    <CalendarDays className="w-3.5 h-3.5" />
                    No Requested Time
                  </div>
                )}
              </div>
            </DialogHeader>

            <div className="flex-1 flex flex-col gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2 block">1. Select Service Date</label>
                <div className="border border-slate-200 rounded-lg bg-white overflow-hidden p-2 flex justify-center">
                  <Calendar
                    mode="single"
                    selected={rescheduleDate}
                    onSelect={setRescheduleDate}
                    initialFocus
                    className="rounded-md border-0"
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2 block">2. Select Salesman</label>
                <Select value={dialogState?.salesmanId ?? "none"} onValueChange={(val) => handleDialogSalesmanChange(val === "none" ? "" : val)}>
                  <SelectTrigger className="h-11 w-full border-slate-200 bg-white text-sm font-medium text-slate-800">
                    <SelectValue placeholder="Choose Salesman" />
                  </SelectTrigger>
                  <SelectContent className="z-[1200] max-h-72">
                    <SelectItem value="none">
                      <span className="text-slate-400">-- None --</span>
                    </SelectItem>
                    {salesmen.map((salesman) => {
                      const activeSchedule = rescheduleDate && isSameDay(rescheduleDate, new Date())
                        ? salesman.schedule.today
                        : rescheduleDate && isSameDay(rescheduleDate, addDays(new Date(), 1))
                          ? salesman.schedule.tomorrow
                          : [];
                      const count = activeSchedule.length;

                      return (
                        <SelectItem key={salesman.id} value={salesman.id}>
                          <span className="flex w-full items-center justify-between gap-3">
                            <span>{salesman.name}</span>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400">
                              {count} assigned
                            </span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  Select a salesman to assign to this job.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 w-full md:w-1/2 flex flex-col">
            <div className="mb-6 flex items-center justify-between pr-6">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">3. Custom Time</label>
              {rescheduleDate && <span className="text-xs font-medium text-slate-900">{format(rescheduleDate, "EEE, MMM do")}</span>}
            </div>

            <div className="flex-1 content-start space-y-4">
              <div className="border border-slate-200 rounded-lg overflow-hidden p-4 bg-slate-50">
                <label htmlFor="customTime" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2 text-center">Enter Time</label>
                <Input
                  id="customTime"
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="h-16 text-3xl font-light text-center bg-white border-slate-200 shadow-sm"
                />
              </div>
              <p className="text-[11px] text-slate-500 text-center leading-relaxed px-4">
                You can pick any exact time to schedule this job for the salesman.
              </p>
            </div>

            <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50 gap-2 flex-wrap sm:flex-nowrap">
              {dialogState?.type === "edit" ? (
                <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs px-2 h-8 shrink-0" onClick={handleUnassign}>Unassign Job</Button>
              ) : <div className="shrink-0"></div>}
              <div className="flex items-center gap-2 shrink-0">
                <Button type="button" variant="ghost" onClick={() => setDialogState(null)}>Cancel</Button>
                <Button type="button" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20" onClick={() => confirmAction(customTime)}>Confirm Dispatch</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
