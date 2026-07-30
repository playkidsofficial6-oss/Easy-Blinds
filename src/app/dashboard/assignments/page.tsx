"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, addDays, isSameDay, parseISO } from "date-fns";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { CalendarDays, Pencil, X } from "lucide-react";

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
    phone: job.customerPhone,
    brand: "Easy Blinds",
    productType: job.productType,
    priority: priorityLabel,
    address: job.address,
    area: job.address,
    property: `Qty ${job.quantity ?? 1}`,
    status: statusLabel,
    time: toDisplayTime(job.scheduledAt),
    endTime: undefined,
    team: typeof job.assignedTo === "object" && job.assignedTo !== null ? (job.assignedTo as any).name : job.assignedTo,
    assignedSalesman: job.assignedSalesman,
    assignedTo: job.assignedTo,
    assignedFitter: job.assignedFitter,
    assignedBy: job.assignedBy,
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
    phone: job.customerPhone,
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

export default function SmartAssignmentsPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && isFitterRole(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const { fitters: baseFitters, isLoaded } = useLiveFitters();
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
        if (job.assignedTo) {
          const ref = job.assignedTo;
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
    return [...fitters, ...salesmen];
  }, [fitters, salesmen]);

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
    const assignedSalesmanName = resolveRefName(job.assignedSalesman) || resolveRefName(job.assignedTo);

    let teamName = "Assigned Team";
    if (!assignedFitterName && !assignedSalesmanName) {
      teamName = resolveAssignedFitterName(job, userNameById);
    } else {
      const parts = [];
      if (assignedFitterName) parts.push(assignedFitterName);
      if (assignedSalesmanName) parts.push(assignedSalesmanName);
      teamName = parts.join(" & ");
    }

    const assignedBy = resolveRefName(raw.assignedBy) || raw.assignedBy;

    return {
      ...raw,
      team: teamName,
      assignedFitterName,
      assignedSalesmanName,
      assignedBy,
      assignedSalesman: job.assignedSalesman,
      assignedTo: job.assignedTo,
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
            // Jobs ready for fitting or pending fitter assignment
            if (job.status === JobStatus.ReadyForFitting) return true;
            if (!job.assignedFitter && job.status === JobStatus.Pending) return true;
            return false;
          })
          .map(resolveUnifiedJob),
        sortKey
      ),
    [jobs, sortKey, resolveUnifiedJob]
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
    [jobs, sortKey, resolveUnifiedJob]
  );

  const recommendedFitters = useMemo(() => {
    if (!selectedJobId) return [];

    return fitters
      .filter((fitter) => fitter.capacity.remaining > 0)
      .map((fitter) => ({
        id: fitter.id,
        name: fitter.name,
        workDetails: `${fitter.schedule.today.length} Jobs Today • Next slot: ${fitter.nextAvailableSlot === "None" ? "N/A" : fitter.nextAvailableSlot}`
      }));
  }, [selectedJobId, fitters]);

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
    const assignedFitter = sourceJob?.assignedTo ?? job.team ?? "";
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
        assignedTo: dialogState.fitterId,
        assignedBy: user?._id || user?.name || "Sales Manager",
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
        assignedTo: "",
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
      {inspectJobId && (
        <JobDetailSheet jobId={inspectJobId} onClose={() => setInspectJobId(null)} />
      )}
      <div className="w-full xl:w-[500px] flex flex-col border-r border-slate-200 bg-white z-20 shadow-xl">
        <div className="p-8 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-slate-400 font-bold mb-2">
            <div className="w-8 h-px bg-amber-600"></div>
            <span>Workforce Optimization</span>
          </div>
          <div className="flex justify-between items-end mb-6">
            <h1 className="text-3xl font-light text-slate-900">
              Smart <span className="font-medium">Fitter Dispatch</span>
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
        <AssignmentMap fitters={workforceMembers} selectedFitterId={selectedMapFitter} onSelectFitter={setSelectedMapFitter} />
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
                              <div className={cn("absolute -left-[5px] top-1.5 w-[9px] h-[9px] rounded-full border-2 ring-4 ring-white transition-colors", isBusy ? "bg-white border-slate-400 group-hover:border-slate-600 cursor-pointer" : "bg-emerald-500 border-white")}></div>
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
                  <SelectContent className="z-[1200] max-h-72">
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
