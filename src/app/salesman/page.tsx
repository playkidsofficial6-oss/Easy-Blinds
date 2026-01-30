"use client";

import { useState, useRef, useEffect } from "react";
import { format, parse, isPast, isToday } from "date-fns";
import {
  MapPin, Navigation, ChevronRight, CheckCircle, Clock, Calendar,
  ArrowLeft, Camera, ShieldCheck, Ruler, ClipboardList, Info,
  AlertCircle, X, Check, Menu, Timer, Wallet, AlertTriangle,
  Phone, MessageSquare, ExternalLink, Zap, MousePointer2
} from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useBrand } from "@/components/providers/brand-provider";

const JobDetailMap = dynamic(() => import("@/components/fitter/JobDetailMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-400 font-light italic">Initializing Map...</div>
});

type Tab = "today" | "tomorrow" | "upcoming" | "completed";

// Mock Data
const MOCK_SALESMAN_SCHEDULE = {
  today: [
    { id: "M001", time: "10:00 AM", client: "Ahmed Al Mansoori", address: "Villa 42, Jumeirah Park", status: "Pending", fabric: "Velvet & Sheer", notes: "Gate code #1234", coordinates: [25.07, 55.14] },
    { id: "M002", time: "12:30 PM", client: "Sarah Smith", address: "Marina Heights, Apt 1204", status: "Pending", fabric: "Linen Blinds", notes: "Check for high ceiling", coordinates: [25.08, 55.15] },
    { id: "M003", time: "03:00 PM", client: "Emaar Properties", address: "Business Bay Tower", status: "Pending", fabric: "Motorized Rollers", notes: "Office measurement", coordinates: [25.18, 55.27] },
  ],
  tomorrow: [
    { id: "M004", time: "09:00 AM", client: "Villa 101", address: "Palm Jumeirah", status: "Pending", fabric: "Outdoor Blinds", notes: "Pool area", coordinates: [25.11, 55.13] },
    { id: "M005", time: "11:30 AM", client: "Luxury Hotel", address: "Downtown Dubai", status: "Pending", fabric: "Blackout Curtains", notes: "50 rooms", coordinates: [25.20, 55.27] },
  ],
  upcoming: [
    { id: "M006", time: "10:00 AM", client: "Future Project", address: "Dubai Creek", status: "Pending", fabric: "TBD", notes: "Initial consult", coordinates: [25.23, 55.33] }
  ],
  completed: [
    { id: "M000", time: "04:00 PM", client: "Old Client", address: "Springs 12", status: "Done", fabric: "Completed", notes: "Done yesterday", coordinates: [25.06, 55.18] }
  ]
} as const;


export default function SalesmanPage() {
  const { selectedBrand } = useBrand();
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [schedule, setSchedule] = useState(MOCK_SALESMAN_SCHEDULE);

  const getJobsForTab = (tab: Tab) => {
    switch (tab) {
      case "today": return schedule.today;
      case "tomorrow": return schedule.tomorrow;
      case "upcoming": return schedule.upcoming;
      case "completed": return schedule.completed;
      default: return [];
    }
  };

  const jobs = getJobsForTab(activeTab);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    setSchedule(prev => {
      const updated = { ...prev };
      if (activeTab === 'today') {
        updated.today = (updated.today as any).map((j: any) => j.id === id ? { ...j, status: newStatus === "Completed" ? "Done" : newStatus === "In progress" ? "In Progress" : newStatus } : j);
      }
      return updated;
    });

    if (selectedJob && selectedJob.id === id) {
      setSelectedJob((prev: any) => ({ ...prev, status: newStatus === "Completed" ? "Done" : newStatus === "In progress" ? "In Progress" : newStatus }));
    }
  };


  return (
    <div className="flex flex-col h-full overflow-hidden select-none bg-stone-50/50">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Filtered List */}
        <aside className={cn(
          "w-full md:w-80 bg-white/80 backdrop-blur-xl border-r border-stone-200 flex flex-col z-40 transition-transform duration-500 absolute md:relative h-full",
          selectedJob ? "-translate-x-full md:translate-x-0" : "translate-x-0"
        )}>
          {/* Tabs */}
          <div className="flex border-b border-stone-200 bg-white p-2 gap-1">
            {(["today", "tomorrow", "upcoming", "completed"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
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

          {/* Job List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
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
            <div className="h-full overflow-y-auto flex flex-col animate-fadeIn bg-stone-50/30">
              <JobDetailView
                job={selectedJob}
                onStatusChange={(newStatus) => handleUpdateStatus(selectedJob.id, newStatus)}
                onBack={() => setSelectedJob(null)}
              />
            </div>
          ) : (
            <WorkspaceOverview onSelectFirst={() => schedule.today.length > 0 && setSelectedJob(schedule.today[0])} />
          )}
        </main>
      </div>
    </div>
  );
}

function WorkspaceOverview({ onSelectFirst }: { onSelectFirst: () => void }) {
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
            { val: "3", label: "Today's Work" },
            { val: "2", label: "Upcoming" },
            { val: "94%", label: "Efficiency" }
          ].map((stat, i) => (
            <div key={i} className="p-8 bg-white rounded-xl border border-stone-100 shadow-md transition-all cursor-default">
              <div className="text-4xl font-light text-neutral-900 tracking-tight mb-1">{stat.val}</div>
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">{stat.label}</div>
            </div>
          ))}
        </div>

        <Button
          onClick={onSelectFirst}
          className="mt-16 bg-neutral-900 hover:bg-neutral-800 text-white font-bold h-12 px-10 rounded-lg shadow-lg"
        >
          Begin Session
        </Button>
      </div>
    </div>
  );
}

function JobCard({ job, onSelect, isSelected }: { job: any; onSelect: () => void; isSelected: boolean }) {
  const isLate = calculateIsLate(job.time, job.status);

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
          "font-bold text-[10px] flex items-center gap-1.5 uppercase tracking-wider",
          isSelected ? "text-white/40" : isLate ? "text-rose-600" : "text-neutral-400"
        )}>
          <Clock className="w-3.5 h-3.5" />
          {job.time}
        </div>
      </div>

      <h3 className={cn("text-lg font-medium transition-colors leading-tight mb-3", isSelected ? "text-white" : "text-neutral-700 group-hover:text-neutral-900")}>
        {job.client}
      </h3>

      <div className={cn("flex items-start gap-1.5 text-[11px] font-medium transition-colors", isSelected ? "text-white/60" : "text-neutral-500 opacity-70")}>
        <MapPin className={cn("w-3.5 h-3.5 flex-shrink-0", isSelected ? "text-white/40" : "text-neutral-400")} />
        <span className="line-clamp-1">{job.address}</span>
      </div>
    </div>
  );
}

function JobDetailView({ job, onStatusChange, onBack }: { job: any; onStatusChange: (status: string) => void; onBack: () => void }) {
  const isLate = calculateIsLate(job.time, job.status);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (job.status === "In Progress" || job.status === "In progress") {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [job.status]);

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${h > 0 ? h + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {/* Visual Context Header */}
      <div className="h-40 bg-neutral-900 relative flex-shrink-0 border-b border-white/5 group overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-30">
          <JobDetailMap coordinates={job.coordinates || [25.20, 55.27]} />
        </div>
        <div className="absolute inset-0 bg-neutral-900/60 z-10"></div>

        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-[60] bg-white/10 backdrop-blur-md text-white p-2.5 rounded-lg border border-white/20 hover:bg-white/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="absolute right-4 bottom-4 z-20 flex gap-2">
          <Button variant="outline" className="bg-white/5 border-white/10 text-white rounded-lg px-4 h-9 text-xs">
            <Phone className="w-4 h-4 mr-2" /> Call
          </Button>
          <Button variant="outline" className="bg-emerald-500/20 border-emerald-500/20 text-emerald-400 rounded-lg px-4 h-9 text-xs">
            <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full pb-48 custom-scrollbar">

        {/* Header */}
        <div className="px-8 py-10 bg-[#0F172A] text-white flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative overflow-hidden">
          <div className="space-y-3 relative z-10">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-white/5 text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] rounded border border-white/5">Task Reference {job.id}</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{job.time}</span>
            </div>
            <h2 className="text-5xl font-light text-white">{job.client}</h2>
            <div className="flex items-center gap-3 text-white/60 text-base font-light">
              <MapPin className="w-4 h-4 text-white/30" />
              {job.address}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Assignment", val: job.id, color: "bg-blue-500" },
              { label: "Session Time", val: job.status === "In Progress" || job.status === "In progress" ? formatTimer(seconds) : "Paused", color: "bg-purple-500", mono: true },
              { label: "Estimated", val: "1h 15m", color: "bg-amber-500" },
              { label: "Status", val: job.status, color: "bg-emerald-500" }
            ].map((node, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden">
                <div className={cn("absolute top-0 left-0 w-1 h-full", node.color)}></div>
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-2">{node.label}</div>
                <div className={cn("text-2xl font-light text-neutral-900", node.mono && "font-mono")}>{node.val}</div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-neutral-900 text-white rounded flex items-center justify-center">
                <ClipboardList className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-light text-neutral-900">Task Notes</h3>
            </div>
            <div className="p-6 bg-stone-50 rounded border border-stone-100 italic text-neutral-700 text-lg">
              "{job.notes || "No special instructions provided."}"
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      {job.status !== "Done" && job.status !== "Completed" && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-5xl">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 backdrop-blur-xl flex items-stretch gap-2 h-20 md:h-24">
            <ActionButton
              icon={Navigation} label="Travel" activeLabel="On Road"
              isActive={job.status === "On the way"}
              disabled={job.status !== "Pending"}
              variant="amber"
              onClick={() => onStatusChange("On the way")}
            />
            <ActionButton
              icon={Timer} label="Measure" activeLabel="Measuring"
              isActive={job.status === "In Progress" || job.status === "In progress"}
              disabled={job.status !== "On the way" && job.status !== "In Progress" && job.status !== "Pending"}
              variant="blue"
              onClick={() => onStatusChange("In progress")}
            />
            <Link href="/field/quotes/new" className="flex-[1.5] group">
              <button
                disabled={!(job.status === "In Progress" || job.status === "In progress")}
                className={cn(
                  "w-full h-full rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative overflow-hidden",
                  (job.status === "In Progress" || job.status === "In progress")
                    ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20 active:scale-[0.98] cursor-pointer"
                    : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5 grayscale"
                )}
              >
                {(job.status === "In Progress" || job.status === "In progress") && (
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-white/30 animate-pulse"></div>
                )}
                <ClipboardList className={cn("w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:scale-110", (job.status === "In Progress" || job.status === "In progress") ? "text-white" : "text-white/20")} />
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">New Quote</span>
              </button>
            </Link>
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

function ActionButton({ icon: Icon, label, activeLabel, isActive, disabled, variant, onClick }: any) {
  const variants: any = {
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

function calculateIsLate(jobTime: string, status: string) {
  if (status === "Done" || status === "In Progress" || status === "Completed" || status === "In progress") return false;
  try {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const jobDate = parse(`${todayStr} ${jobTime}`, "yyyy-MM-dd hh:mm aa", new Date());
    const fifteenMinsAfter = new Date(jobDate.getTime() + 15 * 60000);
    return isPast(fifteenMinsAfter);
  } catch (e) {
    return false;
  }
}
