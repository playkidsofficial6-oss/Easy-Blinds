"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { format, parse, isPast, isToday, isTomorrow } from "date-fns";
import {
  MapPin, Navigation, CheckCircle, Clock, Calendar, MousePointer2,
  ArrowLeft, ClipboardList, AlertCircle,
  Timer,
  Phone, MessageSquare,
  Ruler, FileText, ChevronRight, Grid, X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useBrand } from "@/components/providers/brand-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { getJobs, getJob, startSalesmanTravel, startSalesmanMeasuring, completeSalesmanWorkflow, type Job } from "@/lib/jobs";
import { api } from "@/lib/api";
import { updateUser } from "@/lib/users";
import { sendLiveLocationUpdate, connectSocket, disconnectSocket, logDiagnostic } from "@/services/socket";
import { useRef } from "react";

const JobDetailMap = dynamic(() => import("@/components/fitter/JobDetailMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-400 font-light italic">Initializing Map...</div>
});

type Tab = "today" | "tomorrow" | "upcoming" | "completed";

type SalesmanScheduleJob = {
  id: string;
  jobId?: string;
  shortRef: string;
  time: string;
  client: string;
  address: string;
  customerPhone?: string;
  status: string;
  fabric: string;
  notes?: string;
  assignedBy?: string;
  salesmanWorkflowStatus?: Job["salesmanWorkflowStatus"];
  activeSalesmanId?: string;
  activeSalesmanName?: string;
  travelStartedAt?: string;
  measurementStartedAt?: string;
  measurementCompletedAt?: string;
  coordinates: [number, number];
  date?: string;
  formattedDate?: string;
};

type SalesmanSchedule = Record<Tab, SalesmanScheduleJob[]>;

const EMPTY_SALESMAN_SCHEDULE: SalesmanSchedule = {
  today: [],
  tomorrow: [],
  upcoming: [],
  completed: [],
};

function toScheduleStatus(job: Job) {
  if (job.salesmanWorkflowStatus === "travelling") return "On the way";
  if (job.salesmanWorkflowStatus === "measuring") return "In Progress";
  if (job.salesmanWorkflowStatus === "completed") return "Done";
  if (job.status === "in_progress") return "In Progress";
  if (job.status === "completed") return "Done";
  if (job.status === "cancelled") return "Completed";
  return "Pending";
}

function toLiveUserStatus(displayStatus: string) {
  if (displayStatus === "On the way") return "On the way";
  if (displayStatus === "In Progress" || displayStatus === "In progress") return "In progress";
  return "Available";
}

function toDisplayTime(value?: string) {
  if (!value) return "09:00 AM";
  try {
    return format(new Date(value), "hh:mm a");
  } catch {
    return "09:00 AM";
  }
}

function toScheduleJob(job: Job): SalesmanScheduleJob {
  let coordinates: [number, number] = [25.20, 55.27];
  if (job.location && Array.isArray(job.location.coordinates) && job.location.coordinates.length === 2) {
    coordinates = [job.location.coordinates[1], job.location.coordinates[0]];
  }

  let dateStr: string | undefined;
  let formattedDate: string | undefined;
  if (job.scheduledAt) {
    try {
      const parsedDate = new Date(job.scheduledAt);
      dateStr = format(parsedDate, "yyyy-MM-dd");
      formattedDate = format(parsedDate, "dd MMM yyyy");
    } catch {}
  }

  return {
    id: job._id,
    jobId: job.jobId,
    shortRef: job.jobId ?? `JOB-${job._id.slice(-6).toUpperCase()}`,
    time: toDisplayTime(job.scheduledAt),
    date: dateStr,
    formattedDate,
    client: job.customerName,
    address: job.address,
    customerPhone: job.customerPhone,
    status: toScheduleStatus(job),
    fabric: job.productType || "Curtains",
    notes: job.notes,
    assignedBy: job.assignedBy,
    salesmanWorkflowStatus: job.salesmanWorkflowStatus,
    activeSalesmanId: job.activeSalesmanId,
    activeSalesmanName: job.activeSalesmanName,
    travelStartedAt: job.travelStartedAt,
    measurementStartedAt: job.measurementStartedAt,
    measurementCompletedAt: job.measurementCompletedAt,
    coordinates,
  };
}

function groupJobsBySchedule(jobs: Job[]): SalesmanSchedule {
  return jobs.reduce<SalesmanSchedule>((schedule, job) => {
    const scheduleJob = toScheduleJob(job);
    if (job.status === "completed" || job.status === "cancelled") {
      schedule.completed.push(scheduleJob);
      return schedule;
    }

    if (job.scheduledAt) {
      const date = new Date(job.scheduledAt);
      if (isToday(date)) {
        schedule.today.push(scheduleJob);
        return schedule;
      }
      if (isTomorrow(date)) {
        schedule.tomorrow.push(scheduleJob);
        return schedule;
      }
    }

    schedule.upcoming.push(scheduleJob);
    return schedule;
  }, { today: [], tomorrow: [], upcoming: [], completed: [] });
}


function SalesmanPageContent() {
  useBrand();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const activeJobId = searchParams.get("jobId");
  const [activeTab, setActiveTab] = useState<Tab | "custom">("today");
  const [filterDate, setFilterDate] = useState("");
  const [selectedJob, setSelectedJob] = useState<SalesmanScheduleJob | null>(null);
  const [schedule, setSchedule] = useState<SalesmanSchedule>(EMPTY_SALESMAN_SCHEDULE);

  const didAutoSelectJobRef = useRef(false);
  const lastKnownPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    return () => {
      // Full page unmount — safe to disconnect
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (!activeJobId) return;
    if (didAutoSelectJobRef.current) return; // only run once

    const allJobs = [
      ...(schedule.today || []),
      ...(schedule.tomorrow || []),
      ...(schedule.upcoming || []),
      ...(schedule.completed || [])
    ];
    const foundJob = allJobs.find((j) => j.id === activeJobId);
    if (!foundJob) return; // not loaded yet, wait

    didAutoSelectJobRef.current = true; // mark done

    if ((schedule.completed || []).some((j) => j.id === activeJobId)) {
      setActiveTab("completed");
    } else if ((schedule.today || []).some((j) => j.id === activeJobId)) {
      setActiveTab("today");
    } else if ((schedule.tomorrow || []).some((j) => j.id === activeJobId)) {
      setActiveTab("tomorrow");
    } else {
      setActiveTab("upcoming");
    }
    setSelectedJob(foundJob);
  }, [activeJobId, schedule]);

  const getJobsForTab = (tab: Tab | "custom") => {
    if (tab === "custom" && filterDate) {
       return [
         ...schedule.today,
         ...schedule.tomorrow,
         ...schedule.upcoming,
         ...schedule.completed
       ].filter(j => j.date === filterDate);
    }
    switch (tab) {
      case "today": return schedule.today;
      case "tomorrow": return schedule.tomorrow;
      case "upcoming": return schedule.upcoming;
      case "completed": return schedule.completed;
      default: return [];
    }
  };

  const jobs = getJobsForTab(activeTab);

  const hasActiveJob = useMemo(() => {
    const allJobs = [
      ...schedule.today,
      ...schedule.tomorrow,
      ...schedule.upcoming,
      ...schedule.completed
    ];
    return allJobs.some(j => j.status === "On the way" || j.status === "In Progress" || j.status === "In progress");
  }, [schedule]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setFilterDate("");
  };

  const handleDateChange = (date: string) => {
    setFilterDate(date);
    if (date) {
      setActiveTab("custom");
    } else {
      setActiveTab("today");
    }
  };

  useEffect(() => {
    if (!user?._id) return;

    const loadAssignedJobs = async () => {
      try {
        const response = await getJobs({ limit: 100 });
        const assignedJobs = response.items.filter((job) =>
          job.assignedTo === user._id ||
          job.assignedTo === user.name ||
          job.assignedTo === user.email
        );
        setSchedule(groupJobsBySchedule(assignedJobs));
      } catch (err) {
        console.error("Failed to load assigned jobs initially:", err);
      }
    };

    void loadAssignedJobs();
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) return;

    const socket = connectSocket();
    if (!socket) return;

    const handleJobAssigned = (job: any) => {
      console.info("[Socket] job:assigned event received:", job);
      const isStillAssigned = job.assignedTo === user._id || job.assignedTo === user.name || job.assignedTo === user.email;

      if (!isStillAssigned) {
        setSchedule((prev) => {
          const updated = { ...prev };
          const tabs: Tab[] = ["today", "tomorrow", "upcoming", "completed"];
          for (const tab of tabs) {
            updated[tab] = updated[tab].filter((j) => j.id !== job._id);
          }
          return updated;
        });
        setSelectedJob((prev) => prev?.id === job._id ? null : prev);
        return;
      }

      const scheduleJob = toScheduleJob(job);
      setSchedule((prev) => {
        const updated = { ...prev };
        let found = false;
        const tabs: Tab[] = ["today", "tomorrow", "upcoming", "completed"];

        for (const tab of tabs) {
          if (updated[tab].some((j) => j.id === scheduleJob.id)) {
            updated[tab] = updated[tab].map((j) => j.id === scheduleJob.id ? scheduleJob : j);
            found = true;
          } else {
            updated[tab] = updated[tab].filter((j) => j.id !== scheduleJob.id);
          }
        }

        if (!found) {
          if (job.status === "completed" || job.status === "cancelled") {
            updated.completed = [scheduleJob, ...updated.completed];
          } else if (job.scheduledAt) {
            const date = new Date(job.scheduledAt);
            if (isToday(date)) {
              updated.today = [scheduleJob, ...updated.today];
            } else if (isTomorrow(date)) {
              updated.tomorrow = [scheduleJob, ...updated.tomorrow];
            } else {
              updated.upcoming = [scheduleJob, ...updated.upcoming];
            }
          } else {
            updated.upcoming = [scheduleJob, ...updated.upcoming];
          }
        }
        return updated;
      });

      setSelectedJob((prev) => prev?.id === job._id ? scheduleJob : prev);
    };

    socket.on("job:assigned", handleJobAssigned);

    return () => {
      socket.off("job:assigned", handleJobAssigned);
    };
  }, [user?._id]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const displayStatus = newStatus === "Completed" ? "Done" : newStatus === "In progress" ? "In Progress" : newStatus;
    let appendedNotes = "";

    if (typeof window !== "undefined") {
      const storageKeyMeasStart = `eb_measurement_start_${id}`;
      const storageKeyTravelStart = `eb_travel_start_${id}`;
      const storageKeyTravelSecs = `eb_travel_secs_${id}`;

      if (displayStatus === "On the way") {
        if (!localStorage.getItem(storageKeyTravelStart)) {
          localStorage.setItem(storageKeyTravelStart, Date.now().toString());
        }
      } else if (displayStatus === "In Progress") {
        if (!localStorage.getItem(storageKeyMeasStart)) {
          localStorage.setItem(storageKeyMeasStart, Date.now().toString());
        }
        
        // Finalize travel time
        const travelStart = localStorage.getItem(storageKeyTravelStart);
        if (travelStart) {
          const travelSecs = Math.floor((Date.now() - Number(travelStart)) / 1000);
          localStorage.setItem(storageKeyTravelSecs, Math.max(0, travelSecs).toString());
        }
      } else if (displayStatus === "Done") {
        const measStart = localStorage.getItem(storageKeyMeasStart);
        let measSecs = 0;
        if (measStart) {
          measSecs = Math.floor((Date.now() - Number(measStart)) / 1000);
        }
        const travelSecs = localStorage.getItem(storageKeyTravelSecs);
        
        const formatSecs = (s: number) => {
          const h = Math.floor(s / 3600);
          const m = Math.floor((s % 3600) / 60);
          const sec = s % 60;
          return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${sec}s`.trim();
        };

        const tTrack = `[TIME_LOG] Travel: ${travelSecs ? formatSecs(Number(travelSecs)) : 'N/A'} | Measuring: ${measSecs ? formatSecs(measSecs) : 'N/A'}`;
        
        const currentJob = [...schedule.today, ...schedule.tomorrow, ...schedule.upcoming, ...schedule.completed].find(j => j.id === id);
        const currentNotes = currentJob?.notes || "";
        
        // Clean out any old TIME_LOG before appending new one
        const cleanedNotes = currentNotes.replace(/\[TIME_LOG\][\s\S]*$/, "").trim();
        appendedNotes = cleanedNotes ? `${cleanedNotes}\n\n${tTrack}` : tTrack;

        // Cleanup local storage
        localStorage.removeItem(storageKeyMeasStart);
        localStorage.removeItem(storageKeyTravelStart);
        localStorage.removeItem(storageKeyTravelSecs);
      }
    }

    setSchedule(prev => {
      const updated = { ...prev };
      const tabs: Tab[] = ["today", "tomorrow", "upcoming", "completed"];
      for (const tab of tabs) {
        updated[tab] = updated[tab].map((j) => {
          if (j.id === id) {
            return { ...j, status: displayStatus, notes: appendedNotes || j.notes };
          }
          return j;
        });
      }
      return updated;
    });

    if (selectedJob && selectedJob.id === id) {
      setSelectedJob((prev) => prev ? { ...prev, status: displayStatus, notes: appendedNotes || prev.notes } : prev);
    }

    try {
      const workflowPayload = {
        salesmanId: user?._id,
        salesmanName: user?.name,
        ...(appendedNotes ? { notes: appendedNotes } : {}),
      };

      const savedJobPromise = (() => {
        if (displayStatus === "On the way") {
          return startSalesmanTravel(id, workflowPayload);
        }
        if (displayStatus === "In Progress" || displayStatus === "In progress") {
          return startSalesmanMeasuring(id, workflowPayload);
        }
        if (displayStatus === "Done" || displayStatus === "Completed") {
          return completeSalesmanWorkflow(id, workflowPayload);
        }
        console.warn("handleUpdateStatus: unknown status", displayStatus);
        return Promise.reject(new Error(`Unknown status: ${displayStatus}`));
      })();

      const savedJob = await savedJobPromise;

      const savedDisplayStatus = toScheduleStatus(savedJob);
      const savedLiveStatus = toLiveUserStatus(savedDisplayStatus);
      setSchedule(prev => {
        const updated = { ...prev };
        const tabs: Tab[] = ["today", "tomorrow", "upcoming", "completed"];
        for (const tab of tabs) {
          updated[tab] = updated[tab].map((j) => (
            j.id === id
              ? {
                ...j,
                status: savedDisplayStatus,
                notes: savedJob.notes || j.notes,
                salesmanWorkflowStatus: savedJob.salesmanWorkflowStatus,
                activeSalesmanId: savedJob.activeSalesmanId,
                activeSalesmanName: savedJob.activeSalesmanName,
                travelStartedAt: savedJob.travelStartedAt,
                measurementStartedAt: savedJob.measurementStartedAt,
                measurementCompletedAt: savedJob.measurementCompletedAt,
              }
              : j
          ));
        }
        return updated;
      });
      if (selectedJob && selectedJob.id === id) {
        setSelectedJob((prev) => prev ? {
          ...prev,
          status: savedDisplayStatus,
          notes: savedJob.notes || prev.notes,
          salesmanWorkflowStatus: savedJob.salesmanWorkflowStatus,
          activeSalesmanId: savedJob.activeSalesmanId,
          activeSalesmanName: savedJob.activeSalesmanName,
          travelStartedAt: savedJob.travelStartedAt,
          measurementStartedAt: savedJob.measurementStartedAt,
          measurementCompletedAt: savedJob.measurementCompletedAt,
        } : prev);
      }
      console.info(`Salesman workflow updated to ${savedLiveStatus}`);

      // After successful workflow API call, sync liveStatus
      // This ensures the LiveLocation document is updated even
      // if GPS tracking hasn't started yet
      try {
        const currentLat = lastKnownPositionRef.current?.lat;
        const currentLng = lastKnownPositionRef.current?.lng;

        if (currentLat && currentLng) {
          await sendLiveLocationUpdate({
            lat: currentLat,
            lng: currentLng,
            isOnline: true,
            liveStatus: savedLiveStatus, // "On the way" / "In progress" / "Available"
          });
        }
      } catch {
        // Non-critical — GPS tracking handles this continuously anyway
      }
    } catch (error) {
      console.error("Unable to update salesman job status", error);
    }
  };


  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen overflow-hidden select-none bg-stone-50/50">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Filtered List */}
        <aside className={cn(
          "w-full md:w-80 bg-white/80 backdrop-blur-xl border-r border-stone-200 flex flex-col z-40 transition-transform duration-500 absolute md:relative h-full",
          selectedJob ? "-translate-x-full md:translate-x-0" : "translate-x-0"
        )}>
          <SalesmanGpsControl onPosition={(lat, lng) => {
            lastKnownPositionRef.current = { lat, lng };
          }} />
          {/* Tabs */}
          <div className="flex border-b border-stone-200 bg-white p-2 gap-1">
            {(["today", "tomorrow", "upcoming", "completed"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={cn(
                  "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-center transition-all rounded-lg",
                  activeTab === tab
                    ? `text-neutral-900 bg-neutral-100 shadow-sm`
                    : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="px-3 py-2 bg-stone-50/50 border-b border-stone-200 flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-2 flex-1 px-3 py-1.5 rounded-lg border transition-all",
              activeTab === "custom" 
                ? "border-neutral-900 ring-1 ring-neutral-900/10 shadow-sm bg-white" 
                : "border-stone-200 bg-white/60 hover:bg-white hover:border-stone-300"
            )}>
              <Calendar className={cn("w-3.5 h-3.5", activeTab === "custom" ? "text-neutral-900" : "text-stone-400")} />
              <input 
                type="date"
                value={filterDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className={cn(
                  "w-full text-xs font-semibold bg-transparent focus:outline-none cursor-pointer",
                  activeTab === "custom" ? "text-neutral-900" : "text-stone-500"
                )}
                title="Filter by specific date"
              />
            </div>
            {filterDate && (
              <button 
                onClick={() => handleDateChange("")}
                className="flex-shrink-0 p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                title="Clear date filter"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Job List */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {jobs.length === 0 ? (
              <div className="text-center py-20 text-neutral-400 px-6">
                <Calendar className="w-10 h-10 mx-auto mb-4 opacity-10" />
                <p className="font-medium text-[10px] uppercase tracking-widest">No entries found</p>
              </div>
            ) : (
              jobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSelected={selectedJob?.id === job.id}
                  onSelect={() => setSelectedJob(job)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={cn(
          "flex-1 bg-white relative overflow-hidden flex flex-col transition-all duration-500 w-full md:w-auto absolute md:relative h-full",
          selectedJob ? "opacity-100 z-50 pointer-events-auto" : "opacity-100 z-10 md:z-0"
        )}>
          {selectedJob ? (
            <div className="h-full overflow-hidden flex flex-col animate-fadeIn bg-stone-50/30">
              <JobDetailView
                job={selectedJob}
                hasActiveJob={hasActiveJob}
                onStatusChange={(newStatus) => handleUpdateStatus(selectedJob.id, newStatus)}
                onBack={() => setSelectedJob(null)}
              />
            </div>
          ) : (
            <WorkspaceOverview 
              onSelectFirst={() => schedule.today.length > 0 && setSelectedJob(schedule.today[0])} 
              schedule={schedule}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function WorkspaceOverview({ 
  onSelectFirst, 
  schedule 
}: { 
  onSelectFirst: () => void;
  schedule: SalesmanSchedule;
}) {
  return (
    <div className="h-full relative flex flex-col bg-stone-50">
      <div className="absolute inset-0 z-0 opacity-10">
        <JobDetailMap coordinates={[25.07, 55.14]} />
      </div>
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-20 h-20 bg-white border border-stone-200 rounded-xl flex items-center justify-center mb-8 shadow-xl">
          <MousePointer2 className="w-8 h-8 text-neutral-900" />
        </div>
        <h2 className="text-5xl font-light text-neutral-900 tracking-tight mb-4">Select Workspace</h2>
        <p className="text-neutral-500 max-w-sm mt-0 text-lg font-light leading-snug">Pick an assignment from the sidebar to begin.</p>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {[
            { val: String(schedule.today.length), label: "Today's Work" },
            { val: String(schedule.tomorrow.length + schedule.upcoming.length), label: "Upcoming" },
            { val: String(schedule.completed.length), label: "Completed" }
          ].map((stat, i) => (
            <div key={i} className="p-8 bg-white rounded-xl border border-stone-100 shadow-md transition-all cursor-default">
              <div className="text-4xl font-light text-neutral-900 tracking-tight mb-1">{stat.val}</div>
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* <Button
          onClick={onSelectFirst}
          className="mt-16 bg-neutral-900 hover:bg-neutral-800 text-white font-bold h-12 px-10 rounded-lg shadow-lg"
        >
          Begin Session
        </Button> */}
      </div>
    </div>
  );
}

function JobCard({ job, onSelect, isSelected }: { job: SalesmanScheduleJob; onSelect: () => void; isSelected: boolean }) {
  const isLate = calculateIsLate(job.date, job.time, job.status);

  return (
    <div
      onClick={onSelect}
      className={cn(
        "p-5 cursor-pointer transition-all border rounded-xl relative group",
        isSelected
          ? `bg-[#0F172A] border-neutral-900 shadow-xl scale-[1.01] z-10`
          : "bg-white border-stone-200 hover:border-stone-300"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <span className={cn(
          "px-2 py-1 text-[8px] font-bold tracking-widest rounded uppercase border",
          isSelected ? "bg-white/10 text-white border-white/20" :
            job.status === "Done" || job.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
              job.status === "In Progress" || job.status === "In progress" ? "bg-blue-50 text-blue-700 border-blue-100" :
                job.status === "On the way" ? "bg-amber-50 text-amber-800 border-amber-100" :
                  isLate ? "bg-rose-50 text-rose-700 border-rose-100" :
                    "bg-neutral-50 text-neutral-600 border-neutral-100"
        )}>
          {isLate && job.status === "Pending" ? "DELAYED" : job.status}
        </span>

        <div className={cn(
          "font-bold text-[9px] flex flex-wrap items-center gap-1.5 uppercase tracking-wider justify-end max-w-[70%]",
          isSelected ? "text-white/40" : isLate ? "text-rose-600" : "text-neutral-400"
        )}>
          {job.formattedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{job.formattedDate}</span>
            </div>
          )}
          {job.formattedDate && <span className="opacity-40">•</span>}
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{job.time}</span>
          </div>
        </div>
      </div>

      <div className="mb-3 space-y-1">
        <h3 className={cn("text-lg font-medium transition-colors leading-tight", isSelected ? "text-white" : "text-neutral-700 group-hover:text-neutral-900")}>
          {job.client}
        </h3>
        {job.jobId && (
          <span className={cn("inline-flex font-mono text-[10px] font-bold tracking-wide rounded border px-1.5 py-0.5", isSelected ? "bg-white/10 text-white/70 border-white/15" : "bg-stone-50 text-stone-500 border-stone-200")}>
            {job.jobId}
          </span>
        )}
      </div>

      <div className={cn("flex items-start gap-1.5 text-[11px] font-medium transition-colors", isSelected ? "text-white/60" : "text-neutral-500 opacity-70")}>
        <MapPin className={cn("w-3.5 h-3.5 flex-shrink-0", isSelected ? "text-white/40" : "text-neutral-400")} />
        <span className="line-clamp-1">{job.address}</span>
      </div>
    </div>
  );
}

interface CompletedOpening {
  id?: string;
  name?: string;
  productType?: string;
  mountType?: string;
  customMaterial?: string;
  width?: number;
  height?: number;
  metadata?: {
    fabricSelection?: string;
    customFabricName?: string;
  };
}

interface CompletedRoom {
  id?: string;
  name?: string;
  category?: string;
  openings?: CompletedOpening[];
}

interface CompletedQuotationItem {
  id?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
}

function JobDetailView({ job, hasActiveJob, onStatusChange, onBack }: { job: SalesmanScheduleJob; hasActiveJob: boolean; onStatusChange: (status: string) => Promise<void> | void; onBack: () => void }) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(0);
  const [measurementData, setMeasurementData] = useState<{ rooms?: CompletedRoom[] } | null>(null);
  const [fullJob, setFullJob] = useState<Job | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    async function loadCompletedDetails() {
      if (job.status !== "Done") return;
      setLoadingDetails(true);
      try {
        const [jobRes, measRes] = await Promise.allSettled([
          getJob(job.id),
          api.get(`/measurements/job/${job.id}`)
        ]);

        if (jobRes.status === "fulfilled") {
          setFullJob(jobRes.value);
        }
        if (measRes.status === "fulfilled") {
          setMeasurementData(measRes.value.data);
        }
      } catch (err) {
        console.error("Error loading completed job/measurement details:", err);
      } finally {
        setLoadingDetails(false);
      }
    }
    void loadCompletedDetails();
  }, [job.id, job.status]);

  const managerNote = (() => {
    try {
      if (job.notes && (job.notes.trim().startsWith("{") || job.notes.trim().startsWith("["))) {
        return "";
      }
      return job.notes || "";
    } catch {
      return job.notes || "";
    }
  })();

  const [travelSeconds, setTravelSeconds] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storageKeyMeasStart = `eb_measurement_start_${job.id}`;
    const storageKeyTravelStart = `eb_travel_start_${job.id}`;
    const storageKeyTravelSecs = `eb_travel_secs_${job.id}`;

    const updateTimers = () => {
      // Travel Timer
      const travelStart = localStorage.getItem(storageKeyTravelStart);
      const fixedTravel = localStorage.getItem(storageKeyTravelSecs);
      
      if (fixedTravel) {
         setTravelSeconds(Number(fixedTravel));
      } else if (travelStart && job.status === "On the way") {
         const elapsed = Math.floor((Date.now() - Number(travelStart)) / 1000);
         setTravelSeconds(elapsed >= 0 ? elapsed : 0);
      }

      // Measurement Timer
      const measStart = localStorage.getItem(storageKeyMeasStart);
      if (measStart && (job.status === "In Progress" || job.status === "In progress")) {
        const elapsed = Math.floor((Date.now() - Number(measStart)) / 1000);
        setSeconds(elapsed >= 0 ? elapsed : 0);
      }
    };

    updateTimers();

    let interval: NodeJS.Timeout;
    if (job.status === "On the way" || job.status === "In Progress" || job.status === "In progress") {
      interval = setInterval(updateTimers, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [job.status, job.id]);

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${h > 0 ? h + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const parsedTimeLog = useMemo(() => {
    const match = job.notes?.match(/\[TIME_LOG\] Travel: (.*?) \| Measuring: (.*)/);
    if (match) {
      return { 
        travel: match[1] === "N/A" ? "Not Tracked" : match[1], 
        measuring: match[2] === "N/A" ? "Not Tracked" : match[2] 
      };
    }
    return null;
  }, [job.notes]);

  const travelVal = useMemo(() => {
    if (parsedTimeLog?.travel) return parsedTimeLog.travel;
    if (job.status === "On the way") return formatTimer(travelSeconds);
    if (travelSeconds > 0) return formatTimer(travelSeconds);
    if (job.status === "Pending") return "Not Started";
    return "Not Tracked";
  }, [parsedTimeLog, job.status, travelSeconds]);

  const measVal = useMemo(() => {
    if (parsedTimeLog?.measuring) return parsedTimeLog.measuring;
    if (job.status === "In Progress" || job.status === "In progress") return formatTimer(seconds);
    if (seconds > 0) return formatTimer(seconds);
    if (job.status === "Pending" || job.status === "On the way") return "Not Started";
    return "Not Tracked";
  }, [parsedTimeLog, job.status, seconds]);

  const isTravelMono = !!parsedTimeLog?.travel || job.status === "On the way" || travelSeconds > 0;
  const isMeasMono = !!parsedTimeLog?.measuring || job.status === "In Progress" || job.status === "In progress" || seconds > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white h-full relative">
      {/* Visual Context Header - Full Screen Map with Glassmorphism Overlay */}
      <div className="h-[40vh] min-h-[250px] max-h-[460px] bg-stone-100 relative flex-shrink-0 border-b border-stone-200 group overflow-hidden">
        <div className="absolute inset-0 z-0">
          <JobDetailMap coordinates={job.coordinates || [25.20, 55.27]} />
        </div>

        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-[60] bg-white/90 backdrop-blur-md text-stone-800 p-2.5 rounded-lg border border-stone-200 shadow-md hover:bg-stone-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Floating Customer Details & Actions Glass Card */}
        <div className="absolute bottom-4 left-4 z-20 max-w-sm w-[calc(100%-2rem)] bg-white/95 backdrop-blur-md border border-stone-200/80 p-5 rounded-2xl shadow-xl animate-fadeIn flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold uppercase tracking-[0.15em] rounded border border-indigo-100">
                Task {job.jobId ?? job.shortRef}
              </span>
              <div className="text-[9px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                {job.formattedDate && (
                  <>
                    <Calendar className="w-3 h-3 text-stone-400" />
                    <span>{job.formattedDate}</span>
                    <span className="opacity-50">•</span>
                  </>
                )}
                <Clock className="w-3 h-3 text-stone-400" />
                <span>{job.time}</span>
              </div>
            </div>
            <h2 className="text-2xl font-light text-stone-800 tracking-tight mb-2.5 capitalize">
              {job.client}
            </h2>
            <div className="space-y-2 text-xs text-stone-600 font-medium">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{job.address}</span>
              </div>
              {job.customerPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  <span>{job.customerPhone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 w-full pt-2.5 border-t border-stone-100">
            <Button variant="outline" className="flex-1 bg-white hover:bg-stone-50 border-stone-200 text-stone-700 shadow-sm rounded-lg h-9 text-xs font-semibold transition-colors">
              <Phone className="w-4 h-4 mr-2 text-stone-500" /> Call
            </Button>
            <Button variant="outline" className="flex-1 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white shadow-sm rounded-lg h-9 text-xs font-semibold transition-colors">
              <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full pb-48 custom-scrollbar">

        <div className="p-8 space-y-8">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Travel Time", val: travelVal, color: "bg-amber-500", mono: isTravelMono && travelVal !== "Not Tracked" },
              { label: "Measuring Time", val: measVal, color: "bg-purple-500", mono: isMeasMono && measVal !== "Not Tracked" },
              // { label: "Estimated", val: "1h 15m", color: "bg-neutral-300" },
              { label: "Status", val: job.status, color: "bg-emerald-500" }
            ].map((node, i) => {
              const isMuted = node.val === "Not Started" || node.val === "Not Tracked";
              return (
                <div key={i} className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden">
                  <div className={cn("absolute top-0 left-0 w-1 h-full", node.color)}></div>
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-2">{node.label}</div>
                  <div className={cn(
                    "text-2xl font-light",
                    node.mono ? "font-mono" : "",
                    isMuted ? "text-neutral-400 text-lg font-normal" : "text-neutral-900"
                  )}>
                    {node.val}
                  </div>
                </div>
              );
            })}
          </div>

          {job.status === "Done" && (
            <div className="space-y-6 text-left">
              {/* Measurements Detail Block */}
              <div className="bg-white border border-stone-200 rounded-xl p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-neutral-900 text-white rounded flex items-center justify-center flex-shrink-0">
                      <Ruler className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-light text-neutral-900">Measurements</h3>
                      <p className="text-xs text-stone-400">Captured rooms and opening dimensions</p>
                    </div>
                  </div>
                  <Link href={`/salesman/measurements/new?jobId=${job.id}`}>
                    <Button variant="outline" size="sm" className="text-xs text-neutral-900 border-neutral-300">
                      Edit Measurements
                    </Button>
                  </Link>
                </div>

                {loadingDetails ? (
                  <div className="text-center py-6 text-stone-400 italic text-xs animate-pulse">Loading measurement data...</div>
                ) : measurementData && measurementData.rooms && measurementData.rooms.length > 0 ? (
                  <div className="space-y-4">
                    {measurementData.rooms.map((room: CompletedRoom, rIdx: number) => (
                      <div key={room.id || rIdx} className="border border-stone-200/80 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-stone-50 px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">{room.name} ({room.category || "General"})</span>
                          {/* <span className="text-[10px] bg-neutral-905 bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded-full font-bold">{(room.openings || []).length} Openings</span> */}
                        </div>
                        <div className="divide-y divide-stone-100 bg-white">
                          {(room.openings || []).map((open: CompletedOpening, oIdx: number) => (
                            <div key={open.id || oIdx} className="p-4 text-left flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                              <div>
                                <p className="font-bold text-neutral-800 text-sm mb-1">{open.name}</p>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-stone-500 font-medium">
                                  <span>Type: <strong className="text-neutral-700">{open.productType || "Standard"}</strong></span>
                                  <span>•</span>
                                  <span>Mount: <strong className="text-neutral-700">{open.mountType || "Wall"}</strong></span>
                                  <span>•</span>
                                  <span>Fabric: <strong className="text-neutral-700">{open.customMaterial || open.metadata?.fabricSelection || "None"}</strong></span>
                                  {open.metadata?.customFabricName && (
                                    <>
                                      <span>•</span>
                                      <span>Custom Fabric: <strong className="text-indigo-600">{open.metadata.customFabricName}</strong></span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="text-left md:text-right flex-shrink-0">
                                <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Width × Height</span>
                                <span className="font-mono text-sm font-semibold text-neutral-800">{open.width || 0} cm × {open.height || 0} cm</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-stone-50 rounded-xl text-center text-xs text-stone-400 italic border border-stone-100">No measurement details saved yet for this customer.</div>
                )}
              </div>

              {/* Quotation Detail Block */}
              <div className="bg-white border border-stone-200 rounded-xl p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-neutral-900 text-white rounded flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-light text-neutral-900">Quotation</h3>
                      <p className="text-xs text-stone-400">Total pricing breakdown and line items</p>
                    </div>
                  </div>
                  <Link href={`/salesman/quotes/new?jobId=${job.id}`}>
                    <Button variant="outline" size="sm" className="text-xs text-neutral-900 border-neutral-300">
                      Edit Quotation
                    </Button>
                  </Link>
                </div>

                {loadingDetails ? (
                  <div className="text-center py-6 text-stone-400 italic text-xs animate-pulse">Loading quotation data...</div>
                ) : fullJob?.quotation ? (
                  <div className="space-y-6">
                    {/* Quotation Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-100 text-xs text-stone-500 font-medium">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">Quote ID</span>
                        <strong className="text-neutral-800 text-sm font-light mt-0.5 block">{fullJob.quotation.id}</strong>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">Status</span>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-bold uppercase tracking-wider">
                          {fullJob.quotation.status || "Sent"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">Salesman</span>
                        <strong className="text-neutral-800 text-sm font-light mt-0.5 block">{fullJob.quotation.salesmanName || "Salesman"}</strong>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">Date</span>
                        <strong className="text-neutral-800 text-sm font-light mt-0.5 block">
                          {fullJob.quotation.date ? new Date(fullJob.quotation.date).toLocaleDateString() : "N/A"}
                        </strong>
                      </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-neutral-100 border-b border-stone-200 font-bold text-neutral-700">
                            <th className="p-3 w-12 text-center">#</th>
                            <th className="p-3">Description</th>
                            <th className="p-3 w-20 text-center">Qty</th>
                            <th className="p-3 w-28 text-right">Unit (AED)</th>
                            <th className="p-3 w-28 text-right">Total (AED)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-xs bg-white">
                          {((fullJob.quotation.items as CompletedQuotationItem[]) || []).map((item: CompletedQuotationItem, idx: number) => (
                            <tr key={item.id || idx} className="hover:bg-stone-50/50 transition-colors">
                              <td className="p-3 text-center text-neutral-400 font-medium">{idx + 1}</td>
                              <td className="p-3 text-neutral-800 font-semibold">{item.description}</td>
                              <td className="p-3 text-center text-neutral-800">{item.quantity || 1}</td>
                              <td className="p-3 text-right text-neutral-800">{Number(item.unitPrice || 0).toLocaleString()}</td>
                              <td className="p-3 text-right text-neutral-800 font-bold">{(Number(item.quantity || 1) * Number(item.unitPrice || 0)).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Total Box */}
                    <div className="flex justify-end">
                      <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 w-full max-w-xs space-y-2 text-xs text-left">
                        <div className="flex justify-between text-neutral-500 font-medium">
                          <span>Subtotal</span>
                          <span>AED {Number((fullJob.quotation.total || 0) / 1.05).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-neutral-500 font-medium">
                          <span>VAT (5%)</span>
                          <span>AED {Number((fullJob.quotation.total || 0) - ((fullJob.quotation.total || 0) / 1.05)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline font-bold text-neutral-800 text-sm">
                          <span>Total</span>
                          <span className="text-xl font-light text-neutral-900">AED {Number(fullJob.quotation.total || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 bg-stone-50 rounded-xl text-center text-xs text-stone-400 italic border border-stone-100">No quotation details saved yet for this customer.</div>
                )}
              </div>
            </div>
          )}

          {/* <div className="bg-white border border-stone-200 rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-neutral-900 text-white rounded flex items-center justify-center">
                <ClipboardList className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-light text-neutral-900">Task Notes</h3>
            </div>
            <div className="p-6 bg-stone-50 rounded border border-stone-100 italic text-neutral-700 text-lg">
              {managerNote ? `"${managerNote}"` : ""}
            </div>
          </div> */}
        </div>
      </div>

      {/* Action Bar */}
      {job.status !== "Done" && job.status !== "Completed" && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-5xl">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 backdrop-blur-xl flex items-stretch gap-2 h-20 md:h-24">
            <ActionButton
              icon={Navigation} label="Travel" activeLabel="On Road"
              isActive={job.status === "On the way"}
              disabled={job.status !== "Pending" || (hasActiveJob && job.status === "Pending")}
              variant="amber"
              onClick={() => onStatusChange("On the way")}
            />
            <ActionButton
              icon={Timer} label="Measure" activeLabel="Measuring"
              isActive={job.status === "In Progress" || job.status === "In progress"}
              disabled={(job.status !== "On the way" && job.status !== "In Progress" && job.status !== "Pending") || (hasActiveJob && job.status === "Pending")}
              variant="blue"
              onClick={() => {
                onStatusChange("In progress");
                router.push(`/salesman/measurements/new?jobId=${job.id}`);
              }}
            />
            <div className="flex-[1.5] group">
              <button
                disabled={!(job.status === "In Progress" || job.status === "In progress")}
                className={cn(
                  "w-full h-full rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm border",
                  (job.status === "In Progress" || job.status === "In progress") 
                    ? "bg-white text-neutral-900 border-white/20 hover:bg-neutral-100 hover:scale-[1.02]" 
                    : "bg-white/5 text-white/40 border-transparent cursor-not-allowed"
                )}
                onClick={async (e) => {
                  e.preventDefault();
                  await onStatusChange("Completed");
                  router.push(`/salesman/quotes/new?jobId=${job.id}`);
                }}
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm font-bold tracking-wide">New Quote</span>
              </button>
            </div>
            <ActionButton
              icon={CheckCircle} label="Finalize" activeLabel="Done"
              isActive={false}
              disabled={job.status !== "In Progress" && job.status !== "In progress"}
              variant="emerald"
              onClick={() => onStatusChange("Completed")}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  activeLabel: string;
  isActive: boolean;
  disabled: boolean;
  variant: "amber" | "blue" | "emerald";
  onClick: () => void;
}

function ActionButton({ icon: Icon, label, activeLabel, isActive, disabled, variant, onClick }: ActionButtonProps) {
  const variants: Record<ActionButtonProps["variant"], string> = {
    amber: isActive
      ? "bg-amber-500 text-neutral-900 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
      : "bg-white/5 text-amber-500/70 border-white/5 hover:bg-white/10 hover:text-amber-400",
    blue: isActive
      ? "bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]"
      : "bg-white/5 text-blue-500/70 border-white/5 hover:bg-white/10 hover:text-blue-400",
    emerald: isActive
      ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
      : "bg-white/5 text-emerald-500/70 border-white/5 hover:bg-white/10 hover:text-emerald-400"
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 border border-transparent",
        variants[variant],
        disabled ? "opacity-10 cursor-not-allowed scale-[0.98]" : "hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
      )}
    >
      <Icon className={cn("w-5 h-5 md:w-6 md:h-6 transition-transform", isActive ? "scale-110" : "")} />
      <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">{isActive ? activeLabel : label}</span>
    </button>
  );
}

function calculateIsLate(jobDateStr: string | undefined, jobTime: string, status: string) {
  if (status === "Done" || status === "In Progress" || status === "Completed" || status === "In progress") return false;
  try {
    const datePart = jobDateStr || format(new Date(), "yyyy-MM-dd");
    const jobDate = parse(`${datePart} ${jobTime}`, "yyyy-MM-dd hh:mm aa", new Date());
    const fifteenMinsAfter = new Date(jobDate.getTime() + 15 * 60000);
    return isPast(fifteenMinsAfter);
  } catch {
    return false;
  }
}

type GpsTrackingStatus = "idle" | "requesting" | "tracking" | "error";

interface GpsSnapshot {
    lat: number;
    lng: number;
    accuracy?: number;
    syncedAt?: string;
}

function isSalesmanRole(role?: string) {
    if (!role) return false;
    const r = role.toLowerCase();
    return r === "salesman" || r === "sales_man" || r === "field";
}

function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

interface SalesmanGpsControlProps {
  onPosition?: (lat: number, lng: number) => void;
}

function SalesmanGpsControl({ onPosition }: SalesmanGpsControlProps) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [status, setStatus] = useState<GpsTrackingStatus>("idle");
    const [lastFix, setLastFix] = useState<GpsSnapshot | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const lastFixRef = useRef<GpsSnapshot | null>(null);
    const mountedRef = useRef(true);
    const consecutiveErrorsRef = useRef(0);

    const userRef = useRef(user);
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    useEffect(() => {
        if (!user || !isSalesmanRole(user.role)) {
            if (watchIdRef.current !== null && "geolocation" in navigator) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            disconnectSocket();
            if (status === "tracking" || status === "requesting") {
                setStatus("idle");
                router.replace("/login");
            }
        }
    }, [user, status, router]);

    useEffect(() => {
        return () => {
            mountedRef.current = false;
            if (watchIdRef.current !== null && "geolocation" in navigator) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            // Do NOT call disconnectSocket() here
        };
    }, []);

    useEffect(() => {
        if (
            user &&
            isSalesmanRole(user.role) &&
            status === "idle" &&
            "geolocation" in navigator
        ) {
            startTracking();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.role]);

    const stopTracking = async () => {
        if (watchIdRef.current !== null && "geolocation" in navigator) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        setStatus("idle");
        disconnectSocket();

        const lastKnownFix = lastFixRef.current;
        if (!lastKnownFix) return;

        const currentUser = userRef.current;
        if (!currentUser || !isSalesmanRole(currentUser.role)) {
            setErrorMessage("Session expired. Please sign in again.");
            logout("/login");
            return;
        }

        try {
            await sendLiveLocationUpdate({
                lat: lastKnownFix.lat,
                lng: lastKnownFix.lng,
                accuracy: lastKnownFix.accuracy,
                isOnline: false,
            });
            if (currentUser?._id) {
                await updateUser(currentUser._id, { liveStatus: "Offline" });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to mark GPS as offline.";
            setErrorMessage(message);
        }
    };

    const startTracking = () => {
        const currentUser = userRef.current;
        if (!currentUser || !isSalesmanRole(currentUser.role)) {
            setStatus("error");
            setErrorMessage("You must be signed in as a salesman to share your location.");
            logout("/login");
            return;
        }

        if (!("geolocation" in navigator)) {
            setStatus("error");
            setErrorMessage("This browser does not support GPS location access.");
            return;
        }

        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        setStatus("requesting");
        setErrorMessage(null);
        connectSocket();

        watchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
                const innerUser = userRef.current;
                if (!innerUser || !isSalesmanRole(innerUser.role)) {
                    if (watchIdRef.current !== null) {
                        navigator.geolocation.clearWatch(watchIdRef.current);
                        watchIdRef.current = null;
                    }
                    disconnectSocket();
                    setStatus("error");
                    setErrorMessage("Session changed. GPS tracking stopped.");
                    logout("/login");
                    return;
                }

                const nextFix: GpsSnapshot = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : undefined,
                    syncedAt: new Date().toISOString(),
                };

                // Noise filtering — relaxed thresholds for urban GPS:
                // 120m accuracy limit (urban GPS is typically 10-40m, but can spike on tunnel exits)
                // 0.5m minimum movement (avoids pure stationary jitter but allows slow walking)
                if (nextFix.accuracy !== undefined && nextFix.accuracy > 120) {
                    logDiagnostic("GPS", `⚠️ Discarded GPS fix: poor accuracy (${nextFix.accuracy.toFixed(1)}m > 120m limit)`, nextFix);
                    return;
                }

                const lastFixVal = lastFixRef.current;
                if (lastFixVal) {
                    const distanceMoved = getDistanceMeters(lastFixVal.lat, lastFixVal.lng, nextFix.lat, nextFix.lng);
                    if (distanceMoved < 0.5) {
                        logDiagnostic("GPS", `⚠️ Discarded GPS update: pure jitter (${distanceMoved.toFixed(2)}m < 0.5m)`, nextFix);
                        return;
                    }
                    logDiagnostic("GPS", `✅ GPS update accepted: moved ${distanceMoved.toFixed(1)}m, accuracy ±${nextFix.accuracy?.toFixed(0) ?? "??"}m`, nextFix);
                } else {
                    logDiagnostic("GPS", `✅ Initial GPS fix: accuracy ±${nextFix.accuracy?.toFixed(0) ?? "??"}m`, nextFix);
                }

                lastFixRef.current = nextFix;
                setLastFix(nextFix);
                onPosition?.(nextFix.lat, nextFix.lng);

                try {
                    await sendLiveLocationUpdate({
                        lat: nextFix.lat,
                        lng: nextFix.lng,
                        accuracy: nextFix.accuracy,
                        speed: typeof position.coords.speed === "number" ? position.coords.speed : undefined,
                        heading: typeof position.coords.heading === "number" ? position.coords.heading : undefined,
                        isOnline: true,
                    });
                    const currentLiveStatus = innerUser && "liveStatus" in innerUser ? String(innerUser.liveStatus ?? "") : "";
                    if (innerUser?._id && (currentLiveStatus === "Offline" || !currentLiveStatus)) {
                        await updateUser(innerUser._id, { liveStatus: "Available" });
                    }

                    if (!mountedRef.current) return;
                    consecutiveErrorsRef.current = 0;
                    setStatus("tracking");
                    setErrorMessage(null);
                } catch (error) {
                    if (!mountedRef.current) return;
                    consecutiveErrorsRef.current += 1;
                    const message = error instanceof Error ? error.message : "Unable to save your GPS location.";
                    logDiagnostic("ERROR", `GPS send failed (${consecutiveErrorsRef.current}/3): ${message}`, error);

                    if (consecutiveErrorsRef.current >= 3) {
                        if (watchIdRef.current !== null) {
                            navigator.geolocation.clearWatch(watchIdRef.current);
                            watchIdRef.current = null;
                        }
                        disconnectSocket();
                        setStatus("error");
                        setErrorMessage(`GPS stopped after repeated failures: ${message}`);
                    } else {
                        setErrorMessage(`Send failed, retrying... (${message})`);
                    }
                }
            },
            (error) => {
                const message = error.code === error.PERMISSION_DENIED
                    ? "GPS permission was denied. Please allow location access for this site."
                    : error.message || "Unable to read GPS location.";

                if (watchIdRef.current !== null) {
                    navigator.geolocation.clearWatch(watchIdRef.current);
                    watchIdRef.current = null;
                }
                disconnectSocket();

                setStatus("error");
                setErrorMessage(message);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000,
            },
        );
    };

    const isTracking = status === "tracking" || status === "requesting";
    const statusLabel = status === "requesting"
        ? "Starting GPS"
        : status === "tracking"
            ? "GPS On"
            : status === "error"
                ? "GPS Error"
                : "Enable GPS";

    return (
        <div className="flex flex-col items-stretch gap-1 p-4 border-b border-stone-200 bg-white">
            <button
                type="button"
                onClick={isTracking ? stopTracking : startTracking}
                className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors w-full",
                    status === "tracking" ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" :
                        status === "error" ? "border-red-400/40 bg-red-500/10 text-red-600 hover:bg-red-500/20" :
                            "border-blue-400/40 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
                )}
            >
                {status === "tracking" ? <CheckCircle className="h-4 w-4" /> : status === "error" ? <AlertCircle className="h-4 w-4" /> : <Navigation className="h-4 w-4" />}
                {statusLabel}
            </button>
            <div className="text-center text-[9px] font-medium text-stone-400 uppercase tracking-widest mt-1">
                {errorMessage ? errorMessage : lastFix ? `Synced ${lastFix.lat.toFixed(5)}, ${lastFix.lng.toFixed(5)}` : "Share location with manager"}
            </div>
        </div>
    );
}

export default function SalesmanPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-neutral-400 font-light">Loading salesman portal...</div>}>
            <SalesmanPageContent />
        </Suspense>
    );
}
