"use client";

import { useState, useRef, useEffect } from "react";
import { format, parse, isPast } from "date-fns";
import { MapPin, Navigation, CheckCircle, Clock, ArrowLeft, Camera, Ruler, ClipboardList, Info, AlertCircle, X, Check, Timer, Wallet, AlertTriangle } from "lucide-react";
import { useLiveFitters, FitterJob, FitterStatus } from "@/lib/live-store";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { updateLiveLocation } from "@/services/api/live-location";

const JobDetailMap = dynamic(() => import("@/components/fitter/JobDetailMap"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-light">Loading Map...</div>
});

type Tab = "today" | "tomorrow" | "upcoming" | "completed";

export default function FitterPage() {
    const { user } = useAuth();
    const { fitters, updateFitterStatus } = useLiveFitters();
    const [activeTab, setActiveTab] = useState<Tab>("today");
    const [selectedJob, setSelectedJob] = useState<FitterJob | null>(null);

    const currentFitter = user?.role === "fitter" ? fitters.find(f => f.id === user._id) : null;

    if (!currentFitter) return <div className="p-8 text-center text-slate-500 font-light">Loading Fitter Data...</div>;

    const getJobsForTab = (tab: Tab): FitterJob[] => {
        switch (tab) {
            case "today": return currentFitter.schedule.today;
            case "tomorrow": return currentFitter.schedule.tomorrow;
            case "upcoming": return currentFitter.schedule.upcoming;
            case "completed": return currentFitter.schedule.yesterday;
            default: return [];
        }
    };

    const jobs = getJobsForTab(activeTab);

    const handleUpdateStatus = (status: "On the way" | "In progress" | "Completed") => {
        if (!selectedJob) return;
        updateFitterStatus(currentFitter.id, status as FitterStatus);
        setSelectedJob(prev => prev ? { ...prev, status: status === "Completed" ? "Done" : status === "In progress" ? "In Progress" : "Pending" } : null);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col h-screen overflow-hidden">

            {/* Global Header */}
            <header className="bg-slate-900 border-b border-slate-800 px-8 py-5 flex items-center justify-between shadow-md flex-shrink-0 z-50 h-[80px]">
                <div className="flex items-center gap-5">
                    <div className="h-10 w-10 bg-blue-600 flex items-center justify-center text-white font-light text-xl tracking-tight shadow-lg shadow-blue-900/20">EB</div>
                    <div>
                        <h1 className="text-xl font-light text-white leading-none">Fitter Portal</h1>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-[0.2em] mt-1">Field Operations</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                    <FitterGpsControl />
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium text-white">{currentFitter.name}</div>
                        <div className="text-xs text-slate-400 font-light">{format(new Date(), "EEEE, d MMM")}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-medium text-lg border border-slate-700">
                        {currentFitter.name.charAt(0)}
                    </div>
                </div>
            </header>

            {/* Main Split Layout */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* Sidebar / List View */}
                <aside className={cn(
                    "w-full md:w-96 bg-white border-r border-slate-200 flex flex-col z-40 transition-transform duration-300 absolute md:relative h-full",
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
                    "flex-1 bg-slate-100 relative overflow-hidden flex flex-col transition-opacity duration-300 w-full md:w-auto absolute md:relative h-full",
                    selectedJob ? "opacity-100 z-50" : "opacity-0 md:opacity-100 -z-10 md:z-0 pointer-events-none md:pointer-events-auto"
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

function FitterGpsControl() {
    const [status, setStatus] = useState<GpsTrackingStatus>("idle");
    const [lastFix, setLastFix] = useState<GpsSnapshot | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const lastFixRef = useRef<GpsSnapshot | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        return () => {
            mountedRef.current = false;

            if (watchIdRef.current !== null && "geolocation" in navigator) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, []);

    const stopTracking = async () => {
        if (watchIdRef.current !== null && "geolocation" in navigator) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        setStatus("idle");

        const lastKnownFix = lastFixRef.current;
        if (!lastKnownFix) return;

        try {
            await updateLiveLocation({
                lat: lastKnownFix.lat,
                lng: lastKnownFix.lng,
                accuracy: lastKnownFix.accuracy,
                isOnline: false,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to mark GPS as offline.";
            setErrorMessage(message);
        }
    };

    const startTracking = () => {
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

        watchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
                const nextFix: GpsSnapshot = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : undefined,
                    syncedAt: new Date().toISOString(),
                };

                lastFixRef.current = nextFix;
                setLastFix(nextFix);

                try {
                    await updateLiveLocation({
                        lat: nextFix.lat,
                        lng: nextFix.lng,
                        accuracy: nextFix.accuracy,
                        speed: typeof position.coords.speed === "number" ? position.coords.speed : undefined,
                        heading: typeof position.coords.heading === "number" ? position.coords.heading : undefined,
                        isOnline: true,
                    });

                    if (!mountedRef.current) return;
                    setStatus("tracking");
                    setErrorMessage(null);
                } catch (error) {
                    if (!mountedRef.current) return;
                    if (watchIdRef.current !== null) {
                        navigator.geolocation.clearWatch(watchIdRef.current);
                        watchIdRef.current = null;
                    }

                    const message = error instanceof Error ? error.message : "Unable to save your GPS location.";
                    setStatus("error");
                    setErrorMessage(message);
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

                setStatus("error");
                setErrorMessage(message);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 20000,
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
        <div className="flex flex-col items-end gap-1">
            <button
                type="button"
                onClick={isTracking ? stopTracking : startTracking}
                className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors",
                    status === "tracking" ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20" :
                        status === "error" ? "border-red-400/40 bg-red-500/10 text-red-200 hover:bg-red-500/20" :
                            "border-blue-400/40 bg-blue-500/10 text-blue-100 hover:bg-blue-500/20",
                )}
            >
                {status === "tracking" ? <CheckCircle className="h-4 w-4" /> : status === "error" ? <AlertCircle className="h-4 w-4" /> : <Navigation className="h-4 w-4" />}
                {statusLabel}
            </button>
            <div className="max-w-[240px] text-right text-[10px] font-light text-slate-400">
                {errorMessage ? errorMessage : lastFix ? `Synced ${lastFix.lat.toFixed(5)}, ${lastFix.lng.toFixed(5)}` : "Share location with sales manager"}
            </div>
        </div>
    );
}

function calculateIsLate(jobTime: string, status: string) {
    if (status === "Done" || status === "In Progress" || status === "Completed") return false;

    // Simple parsing for demo purposes. Assumes "HH:MM AM/PM" format
    try {
        const todayStr = format(new Date(), "yyyy-MM-dd");
        const jobDate = parse(`${todayStr} ${jobTime}`, "yyyy-MM-dd hh:mm aa", new Date());

        // If current time > job time + 15 mins buffer, it's late
        const fifteenMinsAfter = new Date(jobDate.getTime() + 15 * 60000);
        return isPast(fifteenMinsAfter);
    } catch {
        return false;
    }
}

function JobCard({ job, onSelect, isSelected }: { job: FitterJob; onSelect: () => void; isSelected: boolean }) {
    const isLate = calculateIsLate(job.time, job.status);

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
                    job.status === "Done" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                        job.status === "In Progress" ? "bg-blue-100 text-blue-800 border-blue-200" :
                            isLate ? "bg-red-100 text-red-800 border-red-200" : // Late badge style
                                "bg-amber-100 text-amber-800 border-amber-200"
                )}>
                    {isLate && job.status === "Pending" ? (
                        <span className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            LATE
                        </span>
                    ) : job.status}
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
                <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-400" />
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
    const isLate = calculateIsLate(job.time, job.status);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        const timeout = setTimeout(() => {
            if (job.status === "In Progress" && jobStartTime) {
                const updateTimer = () => {
                    const now = Date.now();
                    const diff = Math.max(0, now - jobStartTime);
                    const hrs = Math.floor(diff / 3600000);
                    const mins = Math.floor((diff % 3600000) / 60000);
                    const secs = Math.floor((diff % 60000) / 1000);
                    setElapsedTime(
                        `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
                    );
                };
                updateTimer();
                interval = setInterval(updateTimer, 1000);
            } else {
                setElapsedTime("00:00:00");
            }
        }, 0);

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [job.status, jobStartTime]);

    const coordinates = job.coordinates || [25.1972, 55.2744];

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-100">
            {/* Header / Map Area */}
            <div className="h-72 bg-slate-200 relative flex-shrink-0 group shadow-lg z-10">
                <button
                    onClick={onBack}
                    className="absolute top-4 left-4 z-50 md:hidden bg-white/90 p-3 rounded-none shadow-sm backdrop-blur-sm border border-slate-200"
                >
                    <ArrowLeft className="w-4 h-4 text-slate-900" />
                </button>

                <div className="absolute inset-0 z-0">
                    <JobDetailMap coordinates={coordinates} />
                </div>

                <div className="absolute bottom-0 left-0 right-0 z-10 p-8 pt-24 bg-gradient-to-t from-slate-900/90 to-transparent pointer-events-none">
                    <div className="flex items-center gap-3 text-blue-200/80 text-[10px] uppercase tracking-[0.2em] font-semibold mb-2">
                        <div className="w-8 h-px bg-blue-500"></div>
                        <span>Job Assignment</span>
                    </div>
                    <h2 className="text-4xl font-light text-white shadow-black drop-shadow-sm mb-2">{job.client}</h2>
                    <p className="text-white/90 flex items-center gap-2 text-sm drop-shadow-md font-light tracking-wide">
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
                        <div className="text-xl font-light text-slate-900">2h 30m</div>
                    </div>
                    <div className="bg-white p-6 border-t-4 border-slate-500 shadow-sm">
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Wallet className="w-3 h-3 text-slate-500" /> Reference
                        </div>
                        <div className="text-xl font-light text-slate-900 font-mono text-sm mt-1">{job.id}</div>
                    </div>
                    <div className={cn("bg-white p-6 border-t-4 shadow-sm", job.status === "Done" ? "border-emerald-500" : job.status === "In Progress" ? "border-blue-600" : "border-amber-500")}>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Info className={cn("w-3 h-3", job.status === "Done" ? "text-emerald-500" : job.status === "In Progress" ? "text-blue-600" : "text-amber-500")} /> Status
                        </div>
                        <div className={cn("text-xl font-light", job.status === "Done" ? "text-emerald-600" : job.status === "In Progress" ? "text-blue-600" : "text-amber-600")}>
                            {job.status}
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
                            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0 text-purple-600">
                                <Ruler className="w-5 h-5 stroke-2" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-2">Measurements & Fabric</h4>
                                <p className="text-slate-700 font-light mb-4 text-lg">{job.fabric || "Standard Blackout Series"}</p>
                                <ul className="space-y-2 text-sm text-slate-500 font-light border-l-2 border-purple-200 pl-4">
                                    <li>Width: 240cm x Drop: 220cm</li>
                                    <li>Mount: Ceiling Fix</li>
                                    <li>Control: Motorized Right</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 space-y-8 shadow-sm">
                        <div className="flex gap-6">
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600">
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
                            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0 text-amber-600">
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
            {job.status !== "Done" && (
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-6 md:px-12 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] z-50">
                    <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6">
                        <button
                            onClick={() => onStatusChange("On the way")}
                            disabled={job.status !== "Pending"}
                            className={cn(
                                "flex flex-col items-center justify-center py-4 gap-2 transition-all border rounded-xl shadow-sm hover:shadow-md",
                                job.status === "Pending"
                                    ? "bg-white border-amber-200 hover:border-amber-400 hover:bg-amber-50"
                                    : "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                            )}
                        >
                            <Navigation className={cn("w-5 h-5 stroke-2", job.status === "Pending" ? "text-amber-600" : "text-slate-400")} />
                            <span className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", job.status === "Pending" ? "text-amber-900" : "text-slate-400")}>On my way</span>
                        </button>

                        <button
                            onClick={() => onStatusChange("In progress")}
                            disabled={job.status !== "In Progress" && currentGlobalStatus !== "On the way"}
                            className={cn(
                                "flex flex-col items-center justify-center py-4 gap-2 transition-all border rounded-xl shadow-sm hover:shadow-md",
                                job.status === "In Progress"
                                    ? "bg-blue-50 border-blue-200"
                                    : (currentGlobalStatus === "On the way"
                                        ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
                                        : "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed")
                            )}
                        >
                            {job.status === "In Progress" ? (
                                <>
                                    <div className="text-2xl font-light tracking-widest text-blue-900">{elapsedTime}</div>
                                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-500 animate-pulse">Running</span>
                                </>
                            ) : (
                                <>
                                    <Clock className={cn("w-5 h-5 stroke-2", currentGlobalStatus === "On the way" ? "text-white" : "text-slate-400")} />
                                    <span className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", currentGlobalStatus === "On the way" ? "text-white" : "text-slate-400")}>Start Job</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => setIsCompletionModalOpen(true)}
                            disabled={job.status !== "In Progress"}
                            className={cn(
                                "flex flex-col items-center justify-center py-4 gap-2 transition-all border rounded-xl shadow-sm hover:shadow-md",
                                job.status === "In Progress"
                                    ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200"
                                    : "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                            )}
                        >
                            <CheckCircle className={cn("w-5 h-5 stroke-2", job.status === "In Progress" ? "text-white" : "text-slate-400")} />
                            <span className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", job.status === "In Progress" ? "text-white" : "text-slate-400")}>Complete</span>
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
    const [step, setStep] = useState<"checklist" | "photos">("checklist");
    const [checks, setChecks] = useState({
        fitting: false,
        alignment: false,
        approval: false
    });
    const [hasPhoto, setHasPhoto] = useState(false);

    if (!isOpen) return null;

    const allChecked = Object.values(checks).every(Boolean);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
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
                                onClick={() => setTimeout(() => setHasPhoto(true), 600)}
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
