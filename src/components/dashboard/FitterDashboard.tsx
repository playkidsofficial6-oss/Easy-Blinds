"use client";

import { useState, useRef, useEffect } from "react";
import { format, parse, isPast } from "date-fns";
import { MapPin, Navigation, CheckCircle, Clock, ArrowLeft, Camera, Ruler, ClipboardList, Info, AlertCircle, X, Check, Timer, Wallet, AlertTriangle, LogOut } from "lucide-react";
import { useLiveFitters, FitterJob, FitterStatus, isJobOnTheWay, isJobInFitting, isJobCompleted, isJobPendingOrAssigned, getFitterJobStatusLabel } from "@/lib/live-store";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { isFieldRole, isFitterRole } from "@/lib/auth";
import { toast } from "sonner";
import { startFitterTravel, startFitterFitting, completeFitterWorkflow, getJobErrorMessage, JobStatus } from "@/lib/jobs";

type Tab = "today" | "tomorrow" | "upcoming" | "completed";

export default function FitterPage() {
    const { user, logout } = useAuth();
    const { fitters, updateFitterStatus } = useLiveFitters();
    const [activeTab, setActiveTab] = useState<Tab>("today");
    const [selectedJob, setSelectedJob] = useState<FitterJob | null>(null);

    const isFitterRoleUser = Boolean(user && (isFitterRole(user.role) || isFieldRole(user.role)));
    const currentFitter = isFitterRoleUser
        ? fitters.find(f => f.id === user?._id)
        : null;

    if (!currentFitter) {
        return (
            <div className="p-8 text-center text-slate-500 font-light">
                {!user
                    ? "Not signed in."
                    : !isFitterRole
                        ? "Access denied. Fitter role required."
                        : fitters.length === 0
                            ? "Loading fitter data..."
                            : "Fitter profile not found."}
            </div>
        );
    }

    const getJobsForTab = (tab: Tab): FitterJob[] => {
        switch (tab) {
            case "today": return currentFitter.schedule.today ?? [];
            case "tomorrow": return currentFitter.schedule.tomorrow ?? [];
            case "upcoming": return currentFitter.schedule.upcoming ?? [];
            case "completed": return currentFitter.schedule.completed ?? [];
            default: return [];
        }
    };

    const jobs = getJobsForTab(activeTab);

    const handleUpdateStatus = async (status: "On the way" | "In progress" | "Completed") => {
        if (!selectedJob) return;
        updateFitterStatus(currentFitter.id, status as FitterStatus);
        const updatedStatus =
            status === "Completed" ? JobStatus.Completed :
                status === "In progress" ? JobStatus.Fitting :
                    JobStatus.FitterOnTheWay;
        setSelectedJob(prev => prev ? { ...prev, status: updatedStatus } : null);

        try {
            if (status === "On the way") {
                await startFitterTravel(selectedJob.id, { fitterId: currentFitter.id });
            } else if (status === "In progress") {
                await startFitterFitting(selectedJob.id, { fitterId: currentFitter.id });
            } else if (status === "Completed") {
                await completeFitterWorkflow(selectedJob.id, { fitterId: currentFitter.id });
            }
            toast.success(`Job status updated to ${status}`);
        } catch (err) {
            console.error("Failed to update fitter job status on backend", err);
            toast.error(getJobErrorMessage(err, "Failed to update status on server"));
        }
    };

    return (
        <div className="flex h-dvh min-w-0 flex-col overflow-hidden bg-slate-50 font-sans text-slate-900">

            {/* Global Header */}
            <header className="z-50 flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 shadow-md sm:h-20 sm:px-8 sm:py-5">
                <div className="flex min-w-0 items-center gap-3 sm:gap-5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-blue-600 text-lg font-light tracking-tight text-white shadow-lg shadow-blue-900/20 sm:h-10 sm:w-10 sm:text-xl">EB</div>
                    <div className="min-w-0">
                        <h1 className="truncate text-base font-light leading-none text-white sm:text-xl">Fitter Portal</h1>
                        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-slate-400 sm:mt-1 sm:text-xs sm:tracking-[0.2em]">Field Operations</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium text-white">{currentFitter.name}</div>
                        <div className="text-xs text-slate-400 font-light">{format(new Date(), "EEEE, d MMM")}</div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-medium text-base border border-slate-700 shrink-0">
                        {currentFitter.name.charAt(0)}
                    </div>
                    {/* Sign Out */}
                    <button
                        onClick={() => logout("/")}
                        title="Sign Out"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-red-400 hover:text-white hover:bg-red-600 transition-all duration-200 border border-red-400/20 hover:border-red-600"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Sign Out</span>
                    </button>
                </div>
            </header>

            {/* Main Split Layout */}
            <div className="relative flex min-w-0 flex-1 overflow-hidden">

                {/* Sidebar / List View */}
                <aside className={cn(
                    "absolute z-40 flex h-full w-full min-w-0 flex-col border-r border-slate-200 bg-white transition-transform duration-300 md:relative md:w-96 md:translate-x-0",
                    selectedJob ? "-translate-x-full md:translate-x-0" : "translate-x-0"
                )}>
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 bg-white">
                        {(["today", "tomorrow", "upcoming", "completed"] as Tab[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "flex-1 py-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-center transition-colors relative hover:bg-slate-50",
                                    activeTab === tab ? "text-blue-700 border-b-2 border-blue-600 bg-blue-50/10" : "text-slate-400"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Job List */}
                    <div className="flex-1 overflow-y-auto p-0 bg-slate-50/50">
                        {jobs.length === 0 ? (
                            <div className="text-center py-20 text-slate-400">
                                <ClipboardList className="w-10 h-10 mx-auto mb-4 opacity-20 stroke-1" />
                                <p className="font-light text-sm">No jobs scheduled</p>
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

                {/* Main Content Area / Detail View */}
                <main className={cn(
                    "absolute flex h-full min-w-0 w-full flex-1 flex-col overflow-hidden bg-slate-100 transition-opacity duration-300 md:relative md:w-auto",
                    selectedJob ? "z-50 opacity-100" : "-z-10 pointer-events-none opacity-0 md:pointer-events-auto md:z-0 md:opacity-100"
                )}>
                    {selectedJob ? (
                        <div className="h-full overflow-y-auto flex flex-col">
                            <JobDetailView
                                job={selectedJob}
                                onStatusChange={handleUpdateStatus}
                                currentGlobalStatus={currentFitter.status}
                                jobStartTime={currentFitter.currentJobStartTime}
                                onBack={() => setSelectedJob(null)}
                            />
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 select-none bg-slate-50">
                            <div className="w-24 h-24 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-6 shadow-sm">
                                <MapPin className="w-10 h-10 text-blue-200 stroke-1 fill-blue-50" />
                            </div>
                            <h2 className="text-3xl font-light text-slate-800">Select a Job</h2>
                            <p className="text-sm max-w-xs text-center mt-3 font-light text-slate-500">Select an assignment from the list to view details and manage installation status.</p>
                        </div>
                    )}
                </main>
            </div>

        </div>
    );
}

type GpsTrackingStatus = "idle" | "requesting" | "tracking" | "error";

interface GpsSnapshot {
    lat: number;
    lng: number;
    accuracy?: number;
    syncedAt?: string;
}



function calculateIsLate(jobTime: string, status: string, jobDate?: string): boolean {
    if (["Done", "In Progress", "Completed", "On the way"].includes(status)) return false;

    try {
        const datePart = jobDate ?? format(new Date(), "yyyy-MM-dd");
        const parsed = parse(
            `${datePart} ${jobTime}`,
            "yyyy-MM-dd hh:mm aa",
            new Date()
        );
        return isPast(new Date(parsed.getTime() + 15 * 60000));
    } catch {
        return false;
    }
}

function JobCard({ job, onSelect, isSelected }: { job: FitterJob; onSelect: () => void; isSelected: boolean }) {
    const isLate = calculateIsLate(job.time, job.status, job.date);

    return (
        <div
            onClick={onSelect}
            className={cn(
                "p-6 cursor-pointer transition-all group border-b border-slate-200 hover:bg-white relative",
                isSelected
                    ? "bg-blue-50/50 border-l-4 border-l-blue-600"
                    : "bg-white border-l-4 border-l-transparent hover:border-l-slate-300"
            )}
        >
            <div className="flex justify-between items-start mb-3">
                <span className={cn(
                    "px-2 py-1 text-[10px] uppercase tracking-[0.15em] font-bold rounded-sm border",
                    isJobCompleted(job.status) ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                        isJobInFitting(job.status) ? "bg-blue-100 text-blue-800 border-blue-200" :
                            isJobOnTheWay(job.status) ? "bg-amber-100 text-amber-900 border-amber-300" :
                                isLate ? "bg-red-100 text-red-800 border-red-200" :
                                    "bg-amber-100 text-amber-800 border-amber-200"
                )}>
                    {isLate && isJobPendingOrAssigned(job.status) ? (
                        <span className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            LATE
                        </span>
                    ) : getFitterJobStatusLabel(job.status)}
                </span>

                <div className={cn(
                    "font-bold text-sm tracking-wide flex items-center gap-1.5",
                    isLate ? "text-red-600 animate-pulse" : "text-slate-500"
                )}>
                    <Clock className={cn("w-3.5 h-3.5", isLate ? "text-red-500" : "text-slate-400")} />
                    {job.time}
                </div>
            </div>

            <h3 className={cn("text-lg font-normal mb-1 transition-colors", isSelected ? "text-blue-900" : "text-slate-700 group-hover:text-slate-900")}>
                {job.client}
            </h3>

            <div className="flex items-start gap-2 text-slate-500 text-xs mb-4 font-light">
                <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-slate-400" />
                <span className="line-clamp-1">{job.address}</span>
            </div>
        </div>
    );
}

interface JobDetailViewProps {
    job: FitterJob;
    onStatusChange: (status: "On the way" | "In progress" | "Completed") => void;
    currentGlobalStatus: FitterStatus;
    onBack: () => void;
    jobStartTime?: number | null;
}

function JobDetailView({ job, onStatusChange, currentGlobalStatus, onBack, jobStartTime }: JobDetailViewProps) {
    const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
    const [elapsedTime, setElapsedTime] = useState("00:00:00");
    const isLate = calculateIsLate(job.time, job.status, job.date);

    useEffect(() => {
        if (!isJobInFitting(job.status) || !jobStartTime) {
            setElapsedTime("00:00:00");
            return;
        }

        const updateTimer = () => {
            const now = Date.now();
            const diff = Math.max(0, now - jobStartTime);
            const hrs = Math.floor(diff / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            setElapsedTime(
                `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
            );
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [job.status, jobStartTime]);

    const coordinates = job.coordinates || [25.1972, 55.2744];

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-100">
            {/* Header Area */}
            <div className="bg-slate-900 shrink-0 p-8 shadow-lg z-10 relative">
                <button
                    onClick={onBack}
                    className="absolute top-4 left-4 z-50 md:hidden bg-white/10 text-white p-3 rounded-none backdrop-blur-sm border border-white/20"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-3 text-blue-400 text-[10px] uppercase tracking-[0.2em] font-semibold mb-2">
                        <div className="w-8 h-px bg-blue-500"></div>
                        <span>Job Assignment</span>
                    </div>
                    <h2 className="text-4xl font-light text-white mb-2">{job.client}</h2>
                    <p className="text-slate-300 flex items-center gap-2 text-sm font-light tracking-wide">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        {job.address}
                    </p>
                </div>
            </div>

            {/* Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full pb-48">

                {/* Alert Badge if Late */}
                {isLate && (
                    <div className="bg-red-50 border border-red-100 p-4 mb-6 rounded-lg flex items-center gap-3 text-red-900 animate-in slide-in-from-top-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <div className="text-sm font-medium">
                            <span className="font-bold">ATTENTION:</span> You are late for this appointment. Please contact the client immediately.
                        </div>
                    </div>
                )}

                {/* Stats / Timing */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <div className={cn("bg-white p-6 border-t-4 shadow-sm", isLate ? "border-red-500" : "border-blue-500")}>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Clock className={cn("w-3 h-3", isLate ? "text-red-500" : "text-blue-500")} /> Scheduled
                        </div>
                        <div className={cn("text-xl font-light", isLate ? "text-red-600 font-medium" : "text-slate-900")}>{job.time}</div>
                        {isLate && <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">Late Arrival</div>}
                    </div>
                    <div className="bg-white p-6 border-t-4 border-purple-500 shadow-sm">
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Timer className="w-3 h-3 text-purple-500" /> Est. Duration
                        </div>
                        <div className="text-xl font-light text-slate-900">{job.estimatedDuration ?? "2h 30m"}</div>
                    </div>
                    <div className="bg-white p-6 border-t-4 border-slate-500 shadow-sm">
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Wallet className="w-3 h-3 text-slate-500" /> Reference
                        </div>
                        <div className="font-light text-slate-900 font-mono text-sm mt-1">{job.id}</div>
                    </div>
                    <div className={cn("bg-white p-6 border-t-4 shadow-sm", isJobCompleted(job.status) ? "border-emerald-500" : isJobInFitting(job.status) ? "border-blue-600" : isJobOnTheWay(job.status) ? "border-amber-500" : "border-amber-500")}>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Info className={cn("w-3 h-3", isJobCompleted(job.status) ? "text-emerald-500" : isJobInFitting(job.status) ? "text-blue-600" : "text-amber-500")} /> Status
                        </div>
                        <div className={cn("text-xl font-light", isJobCompleted(job.status) ? "text-emerald-600" : isJobInFitting(job.status) ? "text-blue-600" : "text-amber-600")}>
                            {getFitterJobStatusLabel(job.status)}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 mb-8">
                    <h3 className="text-2xl font-light text-slate-800">Installation Specs</h3>
                    <div className="h-px flex-1 bg-slate-300"></div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-10">
                    <div className="bg-white p-8 space-y-8 shadow-sm">
                        <div className="flex gap-6">
                            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center shrink-0 text-purple-600">
                                <Ruler className="w-5 h-5 stroke-2" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Measurements & Fabric</h4>
                                <p className="text-slate-700 font-light mb-4 text-lg">{job.fabric || "Standard Blackout Series"}</p>
                                <ul className="space-y-2 text-sm text-slate-500 font-light border-l-2 border-purple-200 pl-4">
                                    {job.width && job.drop && (
                                        <li>Width: {job.width}cm × Drop: {job.drop}cm</li>
                                    )}
                                    {job.mountType && <li>Mount: {job.mountType}</li>}
                                    {job.controlType && <li>Control: {job.controlType}</li>}
                                    {!job.width && !job.mountType && !job.controlType && (
                                        <li className="italic text-slate-400">
                                            No specifications provided
                                        </li>
                                    )}
                                </ul>
                                <div className="mt-4 pt-3 border-t border-slate-100">
                                    <Link
                                        href={`/dashboard/measurements/new?jobId=${job.id}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg transition-colors border border-purple-200"
                                    >
                                        <Ruler className="w-3.5 h-3.5" />
                                        Full Specifications Sheet &rarr;
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 space-y-8 shadow-sm">
                        <div className="flex gap-6">
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0 text-blue-600">
                                <MapPin className="w-5 h-5 stroke-2" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Room Allocation</h4>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {(job.rooms || ["Living Area", "Master Bed"]).map(r => (
                                        <span key={r} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide rounded-md border border-blue-100">
                                            {r}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-6 pt-6 border-t border-slate-100">
                            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center shrink-0 text-amber-600">
                                <Info className="w-5 h-5 stroke-2" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Fitter Notes</h4>
                                <div className="p-4 bg-amber-50 text-amber-900 text-sm font-medium leading-relaxed border border-amber-100 rounded-lg">
                                    {job.notes || "Please call client 30 mins before arrival. Gate code is #4040."}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Action Dock */}
            {!isJobCompleted(job.status) && (
                <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 sm:p-6 md:px-12 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] z-40">
                    <div className="max-w-4xl mx-auto grid grid-cols-3 gap-2 sm:gap-6">
                        <button
                            onClick={() => onStatusChange("On the way")}
                            disabled={!isJobPendingOrAssigned(job.status)}
                            className={cn(
                                "flex flex-col items-center justify-center py-2.5 sm:py-4 px-1 gap-1 sm:gap-2 transition-all border rounded-xl shadow-sm hover:shadow-md min-w-0",
                                isJobPendingOrAssigned(job.status)
                                    ? "bg-white border-amber-200 hover:border-amber-400 hover:bg-amber-50"
                                    : "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                            )}
                        >
                            <Navigation className={cn("w-4 h-4 sm:w-5 sm:h-5 stroke-2 shrink-0", isJobPendingOrAssigned(job.status) ? "text-amber-600" : "text-slate-400")} />
                            <span className={cn("text-[9px] sm:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap truncate max-w-full px-0.5", isJobPendingOrAssigned(job.status) ? "text-amber-900" : "text-slate-400")}>On my way</span>
                        </button>

                        <button
                            onClick={() => onStatusChange("In progress")}
                            disabled={!isJobInFitting(job.status) && !isJobOnTheWay(job.status) && currentGlobalStatus !== "On the way"}
                            className={cn(
                                "flex flex-col items-center justify-center py-2.5 sm:py-4 px-1 gap-1 sm:gap-2 transition-all border rounded-xl shadow-sm hover:shadow-md min-w-0",
                                isJobInFitting(job.status)
                                    ? "bg-blue-50 border-blue-200"
                                    : (isJobOnTheWay(job.status) || currentGlobalStatus === "On the way"
                                        ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
                                        : "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed")
                            )}
                        >
                            {isJobInFitting(job.status) ? (
                                <>
                                    <div className="text-lg sm:text-2xl font-light tracking-widest text-blue-900">{elapsedTime}</div>
                                    <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-blue-500 animate-pulse">Running</span>
                                </>
                            ) : (
                                <>
                                    <Clock className={cn("w-4 h-4 sm:w-5 sm:h-5 stroke-2 shrink-0", (isJobOnTheWay(job.status) || currentGlobalStatus === "On the way") ? "text-white" : "text-slate-400")} />
                                    <span className={cn("text-[9px] sm:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap truncate max-w-full px-0.5", (isJobOnTheWay(job.status) || currentGlobalStatus === "On the way") ? "text-white" : "text-slate-400")}>Start Job</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => setIsCompletionModalOpen(true)}
                            disabled={!isJobInFitting(job.status)}
                            className={cn(
                                "flex flex-col items-center justify-center py-2.5 sm:py-4 px-1 gap-1 sm:gap-2 transition-all border rounded-xl shadow-sm hover:shadow-md min-w-0",
                                isJobInFitting(job.status)
                                    ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200"
                                    : "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                            )}
                        >
                            <CheckCircle className={cn("w-4 h-4 sm:w-5 sm:h-5 stroke-2 shrink-0", isJobInFitting(job.status) ? "text-white" : "text-slate-400")} />
                            <span className={cn("text-[9px] sm:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap truncate max-w-full px-0.5", isJobInFitting(job.status) ? "text-white" : "text-slate-400")}>Complete</span>
                        </button>
                    </div>
                </div>
            )}

            <CompletionModal
                isOpen={isCompletionModalOpen}
                onClose={() => setIsCompletionModalOpen(false)}
                onConfirm={() => {
                    setIsCompletionModalOpen(false);
                    onStatusChange("Completed");
                    onBack();
                }}
            />
        </div>
    )
}

function CompletionModal({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: () => void }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<"checklist" | "photos">("checklist");
    const [checks, setChecks] = useState({
        fitting: false,
        alignment: false,
        approval: false
    });
    const [hasPhoto, setHasPhoto] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStep("checklist");
            setChecks({ fitting: false, alignment: false, approval: false });
            setHasPhoto(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const allChecked = Object.values(checks).every(Boolean);

    return (
        <div className="fixed inset-0 z-100 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg shadow-2xl rounded-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800 uppercase tracking-widest">Complete Installation</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500 stroke-2" />
                    </button>
                </div>

                <div className="p-8">
                    {step === "checklist" ? (
                        <div className="space-y-8">
                            <p className="text-slate-500 font-medium text-sm">Please verify the following standards before proceeding.</p>
                            <div className="space-y-4">
                                {[
                                    { key: "fitting", label: "Brackets & Rails securely fitted" },
                                    { key: "alignment", label: "Fabric hangs level & aligned" },
                                    { key: "approval", label: "Client has inspected work" }
                                ].map((item) => (
                                    <label key={item.key} className="flex items-center gap-6 p-5 border border-slate-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/20 transition-all group">
                                        <div className={cn(
                                            "w-6 h-6 border-2 rounded flex items-center justify-center transition-all",
                                            checks[item.key as keyof typeof checks] ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 group-hover:border-blue-400"
                                        )}>
                                            {checks[item.key as keyof typeof checks] && <Check className="w-4 h-4 stroke-4" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={checks[item.key as keyof typeof checks]}
                                            onChange={() => setChecks(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof checks] }))}
                                        />
                                        <span className={cn("font-medium text-sm transition-colors", checks[item.key as keyof typeof checks] ? "text-slate-900" : "text-slate-500")}>
                                            {item.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <button
                                disabled={!allChecked}
                                onClick={() => setStep("photos")}
                                className="w-full bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold uppercase tracking-[0.2em] py-5 rounded-lg transition-all mt-4 hover:bg-blue-700 shadow-md shadow-blue-200 disabled:shadow-none"
                            >
                                Continue to Photo
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "border-2 border-dashed h-64 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative overflow-hidden group rounded-xl",
                                    hasPhoto ? "border-emerald-500 bg-emerald-50/30" : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/30"
                                )}
                            >
                                {hasPhoto ? (
                                    <div className="animate-in fade-in zoom-in duration-300">
                                        <CheckCircle className="w-14 h-14 text-emerald-500 mb-4 mx-auto stroke-1" />
                                        <p className="font-bold text-emerald-700 text-lg">Photo Uploaded</p>
                                        <p className="text-sm text-emerald-600 font-medium">Tap to retake</p>
                                    </div>
                                ) : (
                                    <>
                                        <Camera className="w-12 h-12 text-slate-300 mb-4 group-hover:text-blue-500 transition-colors stroke-1" />
                                        <p className="font-bold text-slate-600 group-hover:text-blue-700 uppercase tracking-widest text-sm">Tap to Take Photo</p>
                                        <p className="text-xs text-slate-400 font-medium mt-2">Required for job completion</p>
                                    </>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        setHasPhoto(true);
                                    }
                                }}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setStep("checklist")}
                                    className="w-full text-slate-600 font-bold uppercase tracking-widest text-xs py-4 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors rounded-lg"
                                >
                                    Back
                                </button>
                                <button
                                    disabled={!hasPhoto}
                                    onClick={onConfirm}
                                    className="w-full bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold uppercase tracking-widest text-xs py-4 transition-all hover:bg-emerald-700 rounded-lg shadow-md shadow-emerald-200 disabled:shadow-none"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
