"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, addDays, subDays, isSameDay, isSameWeek, isSameMonth, parseISO } from "date-fns";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { CalendarDays, MapPin, Pencil, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobCard, type UnifiedJob } from "@/components/common/JobCard";
import { useAuth } from "@/components/providers/auth-provider";
import { FilterSortBar } from "@/components/common/FilterSortBar";
import { useRouter } from "next/navigation";
import { isFitterRole, isSalesmanRole, UserRole } from "@/lib/auth";
import { getJobErrorMessage, getJobs, JobPriority, JobStatus, updateJob, type Job } from "@/lib/jobs";
import { useLiveFitters, toFitterJobStatus, type Fitter, type FitterJob } from "@/lib/live-store";
import { getUserErrorMessage, getUsers, type UserRecord, extractLatLng } from "@/lib/users";
import { JobDetailSheet } from "@/components/tracking/JobDetailSheet";
import { cn } from "@/lib/utils";
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
  if (job.assignedFitter) {
    const name = fitterNameById.get(job.assignedFitter);
    if (name) return name;
    return job.assignedFitter;
  }
  const match = job.notes?.match(/Assigned to ([^@.]+)(?: @|\.|$)/i);
  return match?.[1]?.trim() || "Assigned Team";
}

function toUnifiedJob(job: Job): UnifiedJob {
  const statusLabel = job.status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const priorityLabel = job.priority.charAt(0).toUpperCase() + job.priority.slice(1);

  return {
    id: job._id,
    jobId: job.jobId,
    client: job.customerName,
    email: job.customerEmail,
    phoneNumber: job.customerPhone,
    brand: "Easy Blinds",
    productType: job.productType,
    priority: priorityLabel,
    address: job.address,
    area: job.address,
    property: `Qty ${job.quantity ?? 1}`,
    status: statusLabel,
    time: toDisplayTime(job.scheduledAt),
    endTime: undefined,
    team: typeof job.assignedFitter === "object" && job.assignedFitter !== null ? (job.assignedFitter as any).name : (typeof job.assignedSalesman === "object" && job.assignedSalesman !== null ? (job.assignedSalesman as any).name : undefined),
    assignedSalesManager: job.assignedSalesManager,
    assignedSalesman: job.assignedSalesman,
    assignedFitter: job.assignedFitter,
    value: job.projectValue ?? ((job.quantity ?? 1) * 1000),
    createdAt: job.createdAt,
  };
}

function toFitterJob(job: Job): FitterJob {
  return {
    id: job._id,
    jobId: job.jobId,
    client: job.customerName,
    address: job.address,
    time: toDisplayTime(job.scheduledAt) ?? "08:00",
    endTime: "",
    status: toFitterJobStatus(job.status),
    value: job.projectValue ?? ((job.quantity ?? 1) * 1000),
    email: job.customerEmail,
    phoneNumber: job.customerPhone,
    notes: job.notes,
    brand: "Easy Blinds",
    property: `Qty ${job.quantity ?? 1}`,
    productType: "Blinds",
    priority: job.priority === JobPriority.High ? "High" : job.priority === JobPriority.Medium ? "Medium" : "Low",
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
  return isSalesmanRole(user.role);
}

function toSalesmanWorkforceMember(user: UserRecord): Fitter {
  return {
    id: user._id,
    name: user.name,
    role: UserRole.Salesman,
    jobRef: "--",
    status: user.checkedIn === false ? "Offline" : "Available",
    location: (() => { const ll = extractLatLng(user.location); return ll ? [ll.lat, ll.lng] as [number, number] : undefined; })(),
    lastUpdated: (() => { const u = user.location?.updatedAt; if (!u) return "Not updated"; try { return typeof u === "string" ? toReadableLastUpdated(u) : toReadableLastUpdated(new Date(u).toISOString()); } catch { return "Not updated"; } })(),
    avatar: user.avatar,
    email: user.email,
    phoneNumber: user.phoneNumber,
    history: [],
    schedule: {
      yesterday: [],
      today: [],
      tomorrow: [],
      upcoming: [],
    },
    capacity: {
      max: 5,
      current: 0,
      remaining: 5,
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

export default function SmartAssignmentsPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && isFitterRole(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, router]);

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
  const [dateFilterType, setDateFilterType] = useState<"all" | "today" | "tomorrow" | "yesterday" | "week" | "month" | "custom">("today");
  const [statusFilter, setStatusFilter] = useState<string>(JobStatus.ReadyForFitting);

  const isToday = isSameDay(viewDate, new Date());
  const isTomorrow = isSameDay(viewDate, addDays(new Date(), 1));

  const matchesDateFilter = useCallback((scheduledAtStr: string | undefined) => {
    if (dateFilterType === "all") {
      return true;
    }
    if (!scheduledAtStr) {
      return false;
    }
    try {
      const jobDate = parseISO(scheduledAtStr);
      const today = new Date();
      const tomorrow = addDays(today, 1);
      const yesterday = subDays(today, 1);

      if (dateFilterType === "today") {
        return isSameDay(jobDate, today);
      }
      if (dateFilterType === "tomorrow") {
        return isSameDay(jobDate, tomorrow);
      }
      if (dateFilterType === "yesterday") {
        return isSameDay(jobDate, yesterday);
      }
      if (dateFilterType === "week") {
        return isSameWeek(jobDate, today, { weekStartsOn: 1 });
      }
      if (dateFilterType === "month") {
        return isSameMonth(jobDate, today);
      }
      if (dateFilterType === "custom") {
        return isSameDay(jobDate, viewDate);
      }
    } catch {
      return false;
    }
    return false;
  }, [dateFilterType, viewDate]);

  const matchesStatusFilter = useCallback((status: JobStatus) => {
    if (statusFilter === "all") return true;
    return status === statusFilter;
  }, [statusFilter]);

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
    fitterId: string;
    fitterName: string;
    originalFitterId?: string;
    currentSlot?: string;
    currentDate?: Date;
  } | null>(null);

  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined);

  const userNameById = useMemo(() => {
    const map = new Map<string, string>();
    allUsers.forEach((u) => map.set(u._id, u.name));
    baseFitters.forEach((f) => map.set(f.id, f.name));
    return map;
  }, [baseFitters, allUsers]);

  const fitters = useMemo<Fitter[]>(() => {
    return baseFitters.map((fitter) => {
      const assignedJobs = jobs.filter((job) => {
        if ([JobStatus.Cancelled, JobStatus.Dropped].includes(job.status)) {
          return false;
        }
        // Match by userId (new) or name (legacy)
        if (job.assignedFitter) {
          const ref = job.assignedFitter;
          if (typeof ref === "object" && ref !== null) {
            return (ref as any)._id === fitter.id || (ref as any).name?.toLowerCase() === fitter.name.toLowerCase();
          }
          if (ref === fitter.id) return true;
          if (typeof ref === "string" && ref.toLowerCase() === fitter.name.toLowerCase()) return true;
          return false;
        }
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

  const salesmen = useMemo<Fitter[]>(() => {
    return salesmanUsers.map(toSalesmanWorkforceMember);
  }, [salesmanUsers]);

  const workforceMembers = useMemo<Fitter[]>(() => {
    const base = [...fitters, ...salesmen];
    // Enrich with live location data
    return base.map((member) => {
      const liveLoc = liveLocations?.find(loc => loc.userId === member.id);
      if (liveLoc) {
        const liveCoords = [liveLoc.lat, liveLoc.lng] as [number, number];
        const liveLabel = `${liveLoc.lat.toFixed(6)}, ${liveLoc.lng.toFixed(6)}`;
        let liveLastUpdated = member.lastUpdated;
        if (liveLoc.updatedAt) {
          try { liveLastUpdated = toReadableLastUpdated(liveLoc.updatedAt); } catch { /* keep original */ }
        }
        return { ...member, location: liveCoords, locationLabel: liveLabel, lastUpdated: liveLastUpdated };
      }
      // If no live data, show coordinates from static location
      if (member.location) {
        return { ...member, locationLabel: `${member.location[0].toFixed(6)}, ${member.location[1].toFixed(6)}` };
      }
      return member;
    });
  }, [fitters, salesmen, liveLocations]);

  const rescheduleSlots = useMemo(() => {
    if (!dialogState || !rescheduleDate) return [];

    const fitter = fitters.find((item) => item.id === dialogState.fitterId);
    if (!fitter) return DAILY_SLOTS;

    let busySlots: string[] = [];
    if (isSameDay(rescheduleDate, new Date())) {
      busySlots = fitter.schedule.today.map((job) => job.time);
    } else if (isSameDay(rescheduleDate, addDays(new Date(), 1))) {
      busySlots = fitter.schedule.tomorrow.map((job) => job.time);
    }

    return DAILY_SLOTS.filter((slot) => {
      const isCurrentAssignmentSlot =
        dialogState.type === "edit" &&
        dialogState.originalFitterId === dialogState.fitterId &&
        dialogState.currentDate &&
        isSameDay(rescheduleDate, dialogState.currentDate) &&
        slot === dialogState.currentSlot;

      if (isCurrentAssignmentSlot) {
        return true;
      }

      return !busySlots.includes(slot);
    });
  }, [rescheduleDate, dialogState, fitters]);

  const resolveUnifiedJob = useCallback((job: Job): UnifiedJob => {
    const raw = toUnifiedJob(job);

    const resolveRefName = (ref: any): string | undefined => {
      if (!ref) return undefined;
      if (typeof ref === "object" && ref !== null && typeof ref.name === "string") {
        return ref.name;
      }
      if (typeof ref === "string") {
        const fromMap = userNameById.get(ref);
        if (fromMap) return fromMap;
        if (!ref.match(/^[a-f0-9]{24}$/i)) return ref;
      }
      return undefined;
    };

    const assignedFitterName = resolveRefName(job.assignedFitter);
    const assignedSalesmanName = resolveRefName(job.assignedSalesman);

    let teamName = "Assigned Team";
    if (!assignedFitterName && !assignedSalesmanName) {
      teamName = resolveAssignedFitterName(job, userNameById);
    } else {
      const parts = [];
      if (assignedFitterName) parts.push(assignedFitterName);
      if (assignedSalesmanName) parts.push(assignedSalesmanName);
      teamName = parts.join(" & ");
    }

    const assignedSalesManager = resolveRefName(raw.assignedSalesManager) || raw.assignedSalesManager;

    return {
      ...raw,
      team: teamName,
      assignedFitterName,
      assignedSalesmanName,
      assignedSalesManager,
      assignedSalesman: job.assignedSalesman,
      assignedFitter: job.assignedFitter,
    };
  }, [userNameById]);

  const pendingJobs = useMemo(
    () =>
      sortUnifiedJobs(
        jobs
          .filter((job) => {
            if (
              job.status === JobStatus.Completed ||
              job.status === JobStatus.Cancelled ||
              job.status === JobStatus.Dropped
            ) {
              return false;
            }
            if (!matchesDateFilter(job.scheduledAt)) return false;
            if (!matchesStatusFilter(job.status)) return false;
            // Jobs ready for fitting or pending fitter assignment
            if (job.status === JobStatus.ReadyForFitting) return true;
            if (!job.assignedFitter && job.status === JobStatus.Pending) return true;
            return false;
          })
          .map(resolveUnifiedJob),
        sortKey
      ),
    [jobs, sortKey, resolveUnifiedJob, matchesDateFilter, matchesStatusFilter]
  );

  const activeJobs = useMemo(
    () =>
      sortUnifiedJobs(
        jobs
          .filter((job) => {
            if (
              job.status === JobStatus.Completed ||
              job.status === JobStatus.Cancelled ||
              job.status === JobStatus.Dropped
            ) {
              return false;
            }
            if (!matchesDateFilter(job.scheduledAt)) return false;
            if (!matchesStatusFilter(job.status)) return false;
            if (
              [
                JobStatus.FitterAssigned,
                JobStatus.FitterOnTheWay,
                JobStatus.FitterReached,
                JobStatus.Fitting,
                JobStatus.TakingPhotos,
              ].includes(job.status)
            ) {
              return true;
            }
            return Boolean(job.assignedFitter);
          })
          .map(resolveUnifiedJob),
        sortKey
      ),
    [jobs, sortKey, resolveUnifiedJob, matchesDateFilter, matchesStatusFilter]
  );

  const selectedPendingJobForMap = useMemo(() => {
    if (!selectedJobId) return undefined;
    const job = jobs.find((j) => j._id === selectedJobId);
    if (!job) return undefined;

    let lat = 10.8505;
    let lng = 76.2711;
    if (job.location?.coordinates && job.location.coordinates.length >= 2) {
      lng = job.location.coordinates[0];
      lat = job.location.coordinates[1];
    }

    const assignedSalesmanId = typeof job.assignedSalesman === "object" ? job.assignedSalesman?._id : job.assignedSalesman;
    const assignedFitterId = typeof job.assignedFitter === "object" ? job.assignedFitter?._id : job.assignedFitter;

    return {
      id: job._id,
      jobId: job.jobId,
      location: { lat, lng },
      address: job.address || "Job Location",
      client: job.customerName || "Client",
      status: job.status,
      assignedSalesmanId,
      assignedFitterId,
    };
  }, [selectedJobId, jobs]);

  const unassignedJobsForMap = useMemo(() => jobs
    .filter((job) => (job.status === JobStatus.ReadyForFitting || (!job.assignedFitter && job.status === JobStatus.Pending)) && matchesDateFilter(job.scheduledAt) && matchesStatusFilter(job.status))
    .map((job) => {
      const coordinates = job.location?.coordinates;
      const lng = coordinates?.[0] ?? 76.2711;
      const lat = coordinates?.[1] ?? 10.8505;
      return {
        id: job._id,
        jobId: job.jobId,
        location: { lat, lng },
        address: job.address || "Fitting Location",
        client: job.customerName || "Client",
        value: job.projectValue ?? ((job.quantity ?? 1) * 1000),
        time: toDisplayTime(job.scheduledAt) ?? "10:00",
        property: job.propertyType,
        productType: job.productType,
      };
    }), [jobs, matchesDateFilter, matchesStatusFilter]);

  const scheduledJobsForMap = useMemo(() => jobs
    .filter((job) => [JobStatus.FitterAssigned, JobStatus.FitterOnTheWay, JobStatus.FitterReached, JobStatus.Fitting, JobStatus.TakingPhotos].includes(job.status) && matchesDateFilter(job.scheduledAt) && matchesStatusFilter(job.status))
    .map((job) => {
      const coordinates = job.location?.coordinates;
      const lng = coordinates?.[0] ?? 76.2711;
      const lat = coordinates?.[1] ?? 10.8505;
      return {
        id: job._id,
        jobId: job.jobId,
        location: { lat, lng },
        address: job.address || "Scheduled Fitting Location",
        client: job.customerName || "Client",
        status: job.status,
        assignedSalesmanId: typeof job.assignedFitter === "object" ? job.assignedFitter?._id : job.assignedFitter,
        value: job.projectValue ?? ((job.quantity ?? 1) * 1000),
        time: toDisplayTime(job.scheduledAt) ?? "10:00",
        property: job.propertyType,
        productType: job.productType,
      };
    }), [jobs, matchesDateFilter, matchesStatusFilter]);

  const recommendedFitters = useMemo(() => {
    if (!selectedJobId) return [];

    const rawJob = jobs.find((j) => j._id === selectedJobId);
    const jobLl = extractLatLng(rawJob?.location as any);

    const pool = fitters.length > 0 ? fitters : workforceMembers;

    return pool
      .filter((fitter) => fitter.capacity.remaining > 0)
      .map((fitter) => {
        let dist: number | undefined;
        let duration: number | undefined;

        if (jobLl && fitter.location) {
          const R = 6371;
          const dLat = ((jobLl.lat - fitter.location[0]) * Math.PI) / 180;
          const dLon = ((jobLl.lng - fitter.location[1]) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((fitter.location[0] * Math.PI) / 180) *
            Math.cos((jobLl.lat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          dist = R * c;
          duration = (dist / 30) * 3600;
        }

        return {
          id: fitter.id,
          name: fitter.name,
          role: fitter.role,
          dist,
          duration,
          isFree: fitter.status === "Available" || (fitter.status !== "Offline" && fitter.capacity.remaining > 0),
          workDetails: `${fitter.schedule.today.length} Jobs Today • Next slot: ${fitter.nextAvailableSlot === "None" ? "N/A" : fitter.nextAvailableSlot}`
        };
      });
  }, [selectedJobId, fitters, workforceMembers, jobs]);

  const initiateAssignment = (jobId: string, fitterId: string) => {
    const fitter = fitters.find((item) => item.id === fitterId);
    const job = [...pendingJobs, ...activeJobs].find((item) => item.id === jobId);
    if (!fitter || !job) return;

    if (fitter.capacity.remaining <= 0) {
      toast.error("Compliance Error: Maximum daily capacity (5) reached.");
      return;
    }

    setRescheduleDate(viewDate);
    setDialogState({
      type: "assign",
      jobId,
      jobClient: job.client,
      fitterId,
      fitterName: fitter.name,
      currentDate: viewDate,
    });
  };

  const initiateEdit = (fitterId: string, jobTime: string, jobClient: string, jobId: string) => {
    const fitter = fitters.find((item) => item.id === fitterId || item.name === fitterId);
    if (!fitter) {
      toast.error("Unable to find the assigned fitter for this job.");
      return;
    }

    setRescheduleDate(viewDate);
    setDialogState({
      type: "edit",
      jobId,
      jobClient,
      fitterId: fitter.id,
      fitterName: fitter.name,
      originalFitterId: fitter.id,
      currentSlot: jobTime,
      currentDate: viewDate,
    });
  };

  const openRescheduleForJob = (job: UnifiedJob) => {
    const sourceJob = jobs.find((item) => item._id === job.id);
    const assignedFitter = (typeof sourceJob?.assignedFitter === "object" ? sourceJob?.assignedFitter?._id : sourceJob?.assignedFitter) ?? job.team ?? "";
    const scheduledTime = job.time ?? toDisplayTime(sourceJob?.scheduledAt) ?? "08:00";

    setSelectedJobId(job.id);
    initiateEdit(assignedFitter, scheduledTime, job.client, job.id);
  };

  const handleDialogFitterChange = (fitterId: string) => {
    const fitter = fitters.find((item) => item.id === fitterId);
    if (!fitter) return;

    setDialogState((current) => current ? {
      ...current,
      fitterId: fitter.id,
      fitterName: fitter.name,
    } : current);
  };

  const confirmAction = async (timeSlot: string) => {
    if (!dialogState || !rescheduleDate) return;

    const newDateStr = format(rescheduleDate, "yyyy-MM-dd");
    const scheduledAt = selectedDateFromSlot(rescheduleDate, timeSlot);

    try {
      const updated = await updateJob(dialogState.jobId, {
        status: JobStatus.FitterAssigned,
        scheduledAt,
        assignedFitter: dialogState.fitterId,
        assignedSalesManager: user?._id || user?.name || "Sales Manager",
        notes: `Assigned to ${dialogState.fitterName} @ ${timeSlot}. Scheduled by ${user?.name || "Sales Manager"} from Smart Dispatch.`,
      });
      setJobs((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      toast.success(dialogState.type === "assign" ? `Assigned to ${dialogState.fitterName} on ${newDateStr} @ ${timeSlot}` : `Rescheduled to ${newDateStr} @ ${timeSlot}`);
      setDialogState(null);
      setSelectedJobId(null);
      setSelectedMapFitter(null);
    } catch (error) {
      toast.error(getJobErrorMessage(error, "Dispatch operation failed."));
    }
  };

  const [inspectJobId, setInspectJobId] = useState<string | null>(null);

  const handleUnassign = async () => {
    if (!dialogState) return;

    try {
      const updated = await updateJob(dialogState.jobId, {
        status: JobStatus.Pending,
        assignedFitter: undefined,
        assignedSalesManager: undefined,
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
    <div className="flex max-h-screen h-full overflow-hidden bg-white">
      {inspectJobId && (
        <JobDetailSheet jobId={inspectJobId} onClose={() => setInspectJobId(null)} />
      )}
      <div className="w-full xl:w-125 flex flex-col border-r border-slate-200 bg-white z-20 shadow-xl">
        <div className="p-5 sm:p-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-slate-400 font-bold mb-2">
            <div className="w-8 h-px bg-amber-600"></div>
            <span>Workforce Optimization</span>
          </div>
          <div className="flex justify-between items-end mb-4">
            <h1 className="text-2xl sm:text-3xl font-light text-slate-900">
              Smart <span className="font-medium">Fitter Dispatch</span>
            </h1>
          </div>

          {/* Date Filter Panel */}
          <div className="space-y-2">
            <div className="grid grid-cols-6 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
              <button
                onClick={() => setDateFilterType("all")}
                className={cn(
                  "py-1.5 px-0.5 text-[11px] font-bold rounded-lg transition-all text-center truncate",
                  dateFilterType === "all"
                    ? "bg-white shadow-sm text-blue-600 border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                )}
              >
                All
              </button>
              <button
                onClick={() => {
                  setDateFilterType("today");
                  setViewDate(new Date());
                }}
                className={cn(
                  "py-1.5 px-0.5 text-[11px] font-bold rounded-lg transition-all text-center truncate",
                  dateFilterType === "today"
                    ? "bg-white shadow-sm text-blue-600 border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                )}
              >
                Today
              </button>
              <button
                onClick={() => {
                  setDateFilterType("tomorrow");
                  setViewDate(addDays(new Date(), 1));
                }}
                className={cn(
                  "py-1.5 px-0.5 text-[11px] font-bold rounded-lg transition-all text-center truncate",
                  dateFilterType === "tomorrow"
                    ? "bg-white shadow-sm text-blue-600 border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                )}
              >
                Tomorrow
              </button>
              <button
                onClick={() => {
                  setDateFilterType("yesterday");
                  setViewDate(subDays(new Date(), 1));
                }}
                className={cn(
                  "py-1.5 px-0.5 text-[11px] font-bold rounded-lg transition-all text-center truncate",
                  dateFilterType === "yesterday"
                    ? "bg-white shadow-sm text-blue-600 border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                )}
              >
                Yesterday
              </button>
              <button
                onClick={() => setDateFilterType("week")}
                className={cn(
                  "py-1.5 px-0.5 text-[11px] font-bold rounded-lg transition-all text-center truncate",
                  dateFilterType === "week"
                    ? "bg-white shadow-sm text-blue-600 border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                )}
              >
                Week
              </button>
              <button
                onClick={() => setDateFilterType("month")}
                className={cn(
                  "py-1.5 px-0.5 text-[11px] font-bold rounded-lg transition-all text-center truncate",
                  dateFilterType === "month"
                    ? "bg-white shadow-sm text-blue-600 border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                )}
              >
                Month
              </button>
            </div>

            <div className="flex items-center justify-between pt-0.5 gap-2">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 shrink-0">
                Filter: <strong className="text-slate-700 font-semibold capitalize">{dateFilterType === "custom" ? format(viewDate, "PPP") : dateFilterType}</strong>
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
                  <SelectTrigger className="h-7 px-2.5 text-xs font-semibold bg-white border-slate-200 shadow-sm rounded-lg hover:bg-slate-50 transition-all text-slate-700">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent align="end" className="text-xs">
                    <SelectItem value="all" className="font-semibold text-slate-900">All Statuses</SelectItem>
                    <SelectItem value={JobStatus.ReadyForFitting}>Ready for Fitting</SelectItem>
                    <SelectItem value={JobStatus.FitterAssigned}>Fitter Assigned</SelectItem>
                    <SelectItem value={JobStatus.FitterOnTheWay}>Fitter On The Way</SelectItem>
                    <SelectItem value={JobStatus.FitterReached}>Fitter Reached</SelectItem>
                    <SelectItem value={JobStatus.FitterCancelled}>Fitter Cancelled</SelectItem>
                    <SelectItem value={JobStatus.Fitting}>Fitting</SelectItem>
                    <SelectItem value={JobStatus.TakingPhotos}>Taking Photos</SelectItem>
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 border shadow-sm",
                        dateFilterType === "custom"
                          ? "bg-blue-50 text-blue-700 border-blue-200 font-bold"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <CalendarDays className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                      <span>
                        {dateFilterType === "custom" ? format(viewDate, "MMM do, yyyy") : "Custom Date"}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={viewDate}
                      onSelect={(date) => {
                        if (date) {
                          setDateFilterType("custom");
                          setViewDate(date);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50">
          {(isLoading || loadError) && (
            <div className={cn("px-6 py-2 text-[10px] uppercase tracking-widest font-bold border-b", loadError ? "bg-red-50 text-red-600 border-red-100" : "bg-amber-50 text-amber-700 border-amber-100")}>
              {loadError ?? "Syncing Smart Dispatch jobs..."}
            </div>
          )}

          <div className="flex-1 overflow-y-auto outline-none p-4 pr-3 scrollbar-container min-h-0">
            <style jsx>{`
              .scrollbar-container::-webkit-scrollbar { width: 6px; }
              .scrollbar-container::-webkit-scrollbar-track { background: transparent; }
              .scrollbar-container::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
              .scrollbar-container::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
            `}</style>
            <div className="space-y-3">
              {/* Pending Jobs */}
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

              {/* Scheduled / Active Jobs */}
              {activeJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSelected={selectedJobId === job.id}
                  onSelect={() => {
                    if (selectedJobId === job.id) {
                      setSelectedJobId(null);
                      setSelectedMapFitter(null);
                    } else {
                      setSelectedJobId(job.id);
                      const sourceJob = jobs.find((j) => j._id === job.id);
                      if (sourceJob) {
                        const assignedId =
                          (typeof sourceJob.assignedFitter === "object" ? sourceJob.assignedFitter?._id : sourceJob.assignedFitter) ||
                          (typeof sourceJob.assignedSalesman === "object" ? sourceJob.assignedSalesman?._id : sourceJob.assignedSalesman);
                        if (assignedId && typeof assignedId === "string") {
                          setSelectedMapFitter(assignedId);
                        }
                      }
                    }
                  }}
                  onAction={(action) => {
                    if (action === "manage" || action === "reschedule") {
                      openRescheduleForJob(job);
                    }
                  }}
                  variant="schedule"
                />
              ))}

              {!isLoading && pendingJobs.length === 0 && activeJobs.length === 0 && (
                <div className="text-center py-10 text-slate-300 text-sm font-light">
                  No jobs found for this date.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-slate-100 relative">
        <AssignmentMap
          fitters={workforceMembers}
          selectedFitterId={selectedMapFitter}
          onSelectFitter={setSelectedMapFitter}
          selectedJob={selectedPendingJobForMap}
          unassignedJobs={unassignedJobsForMap}
          scheduledJobs={scheduledJobsForMap}
        />
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
              return (
                <>
                  <div className="p-6 border-b border-slate-100/50 flex justify-between items-start bg-slate-50/50">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 rounded-2xl border-2 border-white shadow-md bg-white"><AvatarImage src={fitter.avatar} /><AvatarFallback>{fitter.role === "Salesman" ? "SM" : "FT"}</AvatarFallback></Avatar>
                      <div>
                        <h3 className="text-lg font-light text-slate-900">{fitter.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1"><span className={cn("w-2 h-2 rounded-full", fitter.status === "Fully Booked" || fitter.status === "Offline" ? "bg-red-500" : "bg-emerald-500")}></span>{fitter.role ?? "Fitter"} · {fitter.status}</div>
                      </div>
                    </div>
                    <button onClick={() => setSelectedMapFitter(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    {/* Live Coordinates */}
                    {fitter.location && (
                      <div className="flex items-start gap-2.5 text-xs text-slate-600 bg-slate-50 border border-slate-200/50 rounded-xl p-3">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Live Coordinates</span>
                          <span className="leading-snug text-slate-700 font-mono text-[11px]">{(fitter as any).locationLabel || `${fitter.location[0].toFixed(6)}, ${fitter.location[1].toFixed(6)}`}</span>
                          <span className="text-[9px] text-slate-400 mt-1 font-semibold">Updated {fitter.lastUpdated}</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2"><span>Workload ({format(viewDate, "MMM do")})</span><span className={cn(fitter.capacity.remaining === 0 ? "text-red-600" : "text-emerald-600")}>{activeSchedule.length} Assignments</span></div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className={cn("h-full transition-all", capacityPercent >= 100 ? "bg-red-500" : "bg-emerald-500")} style={{ width: `${capacityPercent}%` }}></div></div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Timeline: {format(viewDate, "EEE, d MMM")}</h4>
                      <div className="space-y-0 relative border-l border-slate-200 ml-2">
                        {DAILY_SLOTS.map((time) => {
                          const job = activeSchedule.find((item) => item.time === time);
                          const isBusy = !!job;
                          return (
                            <div key={time} className="pl-6 pb-6 relative last:pb-0 group">
                              <div className={cn("absolute -left-1.25 top-1.5 w-2.25 h-2.25 rounded-full border-2 ring-4 ring-white transition-colors", isBusy ? "bg-white border-slate-400 group-hover:border-slate-600 cursor-pointer" : "bg-emerald-500 border-white")}></div>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="text-xs font-mono font-medium text-slate-400 mb-0.5">{time}</div>
                                  {isBusy ? (
                                    <div className="cursor-pointer" onClick={() => initiateEdit(fitter.id, time, job.client, job.id)}>
                                      <div className="text-sm font-medium text-slate-800 hover:text-amber-600 transition-colors flex items-center justify-between pr-2">
                                        <div className="flex flex-col"><span>{job.client || "Assigned Job"}</span>{job.jobId && <span className="font-mono text-[10px] text-amber-700 font-semibold">{job.jobId}</span>}<span className="text-xs text-slate-500 font-normal">{job.address || "On-site"}</span></div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-slate-600"><Pencil className="w-3 h-3" /></Button>
                                      </div>
                                    </div>
                                  ) : (<div className="text-sm font-light text-slate-500 italic">Available Slot</div>)}
                                </div>
                                {!isBusy && <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] uppercase font-bold tracking-wider rounded-sm border border-emerald-100">Free</div>}
                              </div>
                            </div>
                          );
                        })}
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
        <DialogContent className="sm:max-w-2xl bg-white p-0 overflow-hidden flex flex-col md:flex-row gap-0">
          <div className="bg-slate-50 p-6 border-r border-slate-100 w-full md:w-1/2 flex flex-col">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-light text-slate-900 mb-1">
                {dialogState?.type === "edit" ? "Reschedule" : "Confirm Dispatch"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {dialogState?.type === "edit" ? `Moving ${dialogState.jobClient} (Currently ${dialogState.currentSlot} with ${dialogState.fitterName})` : `Assigning ${dialogState?.jobClient} to ${dialogState?.fitterName}`}
              </DialogDescription>
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
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2 block">2. Select Fitter</label>
                <Select value={dialogState?.fitterId ?? ""} onValueChange={handleDialogFitterChange}>
                  <SelectTrigger className="h-11 w-full border-slate-200 bg-white text-sm font-medium text-slate-800">
                    <SelectValue placeholder="Choose fitter" />
                  </SelectTrigger>
                  <SelectContent className="z-1200 max-h-72">
                    {fitters.map((fitter) => {
                      const activeSchedule = rescheduleDate && isSameDay(rescheduleDate, new Date())
                        ? fitter.schedule.today
                        : rescheduleDate && isSameDay(rescheduleDate, addDays(new Date(), 1))
                          ? fitter.schedule.tomorrow
                          : [];
                      const freeSlots = DAILY_SLOTS.length - activeSchedule.length;

                      return (
                        <SelectItem key={fitter.id} value={fitter.id}>
                          <span className="flex w-full items-center justify-between gap-3">
                            <span>{fitter.name}</span>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400">
                              {Math.max(0, freeSlots)} slots
                            </span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  Changing this value will move the job to the selected fitter before you choose the new time.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 w-full md:w-1/2 flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">3. Select Time Slot</label>
              {rescheduleDate && <span className="text-xs font-medium text-slate-900">{format(rescheduleDate, "EEE, MMM do")}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3 flex-1 content-start">
              {rescheduleSlots.map((slot) => {
                const isCurrent =
                  dialogState?.type === "edit" &&
                  dialogState.originalFitterId === dialogState.fitterId &&
                  slot === dialogState.currentSlot &&
                  !!rescheduleDate &&
                  !!dialogState.currentDate &&
                  isSameDay(rescheduleDate, dialogState.currentDate);
                return (
                  <Button
                    key={slot}
                    variant={isCurrent ? "secondary" : "outline"}
                    className={cn(
                      "h-14 flex flex-col gap-0 items-center justify-center border-slate-100 transition-all",
                      isCurrent ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700",
                    )}
                    disabled={isCurrent}
                    onClick={() => confirmAction(slot)}
                  >
                    <span className="font-bold text-lg">{slot}</span>
                    <span className="text-[9px] uppercase tracking-wider font-normal opacity-70">
                      {isCurrent ? "Current Time" : "Available"}
                    </span>
                  </Button>
                );
              })}

              {rescheduleSlots.length === 0 && (
                <div className="col-span-2 py-8 text-center border border-dashed border-red-200 bg-red-50/50 rounded-lg">
                  <p className="text-red-500 font-medium text-sm">No slots available.</p>
                  <p className="text-xs text-red-400 mt-1">Please select another date or fitter.</p>
                </div>
              )}
            </div>

            <DialogFooter className="mt-auto sm:justify-between pt-6 border-t border-slate-50">
              {dialogState?.type === "edit" ? (
                <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs px-2 h-8" onClick={handleUnassign}>Unassign Job</Button>
              ) : <div></div>}
              <Button type="button" variant="ghost" onClick={() => setDialogState(null)}>Cancel</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
