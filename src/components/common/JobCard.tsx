import { cn } from "@/lib/utils";
import { User, Phone, MapPin, ChevronRight, AlertCircle, ArrowRight, CalendarClock, MoreVertical, Edit2, Trash2, Clock3, CarFront } from "lucide-react";
import React from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatDuration(secs: number) {
    const mins = Math.round(secs / 60);
    if (mins < 1) return "1 min";
    if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""}`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (remMins === 0) return `${hrs} hr${hrs > 1 ? "s" : ""}`;
    return `${hrs} hr${hrs > 1 ? "s" : ""} ${remMins} min${remMins > 1 ? "s" : ""}`;
}

function compactJobType(job: UnifiedJob) {
    const value = `${job.property || job.productType || job.brand || "APP"}`.trim();
    if (/apart|apt/i.test(value)) return "APP";
    if (/villa/i.test(value)) return "VIL";
    if (/office|commercial/i.test(value)) return "COM";
    return value.slice(0, 3).toUpperCase() || "APP";
}

function initialsFromName(name: any): string {
    if (!name || typeof name !== "string") return "MU";
    const clean = name.trim();
    if (!clean) return "MU";
    return clean
        .split(/\s+/)
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase() || "MU";
}

function timeSlot(job: UnifiedJob) {
    if (job.time) return job.time;
    if (job.requestedDate) return job.requestedDate;
    return "10:00";
}

// Unified Job Interface compatible with both pages
export interface UnifiedJob {
    id: string;
    jobId?: string;
    client: string;
    value?: number;
    email?: string;
    phone?: string;
    brand?: string;
    property?: string;
    productType?: string;
    priority?: string;
    address?: string;
    area?: string;
    status?: string;
    time?: string;
    endTime?: string;
    requestedDate?: string;
    recommendedFitters?: Array<{ id: string; name: string; role?: string; dist?: number; duration?: number; countdownSecs?: number; isFree?: boolean; timerStartedAt?: string; }>;
    team?: string;
    assignedFitterName?: string;
    assignedSalesmanName?: string;
    assignedSalesman?: any;
    assignedTo?: any;
    assignedFitter?: any;
    assignedBy?: any;
    createdAt?: string;
}

interface JobCardProps {
    job: UnifiedJob;
    isSelected: boolean;
    onSelect: () => void;
    onAction?: (actionType: string, payload?: any) => void;
    variant?: "assignment" | "schedule";
    showEditDelete?: boolean;
}

function LiveCountdown({ startedAt }: { startedAt: string }) {
    const [timeLeft, setTimeLeft] = React.useState<number>(0);

    React.useEffect(() => {
        const calculateTime = () => {
            const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
            const remaining = (45 * 60) - elapsed;
            setTimeLeft(remaining > 0 ? remaining : 0);
        };
        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [startedAt]);

    return (
        <span className="text-amber-600 font-semibold flex items-center gap-1">
            Measuring ({Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")})
        </span>
    );
}

export function JobCard({ job, isSelected, onSelect, onAction, variant = "assignment", showEditDelete = false }: JobCardProps) {
    const rawStatus = (job.status || "PENDING").replace(/_/g, " ");
    const statusLabel = rawStatus.toUpperCase();
    const firstRecommendation = job.recommendedFitters?.[0];
    
    const resolveName = (ref: any): string | undefined => {
        if (!ref) return undefined;
        if (typeof ref === "object" && ref !== null && typeof ref.name === "string") {
            return ref.name;
        }
        if (typeof ref === "string" && !ref.match(/^[a-f0-9]{24}$/i)) {
            return ref;
        }
        return undefined;
    };

    const resolvedAssignedName =
        resolveName(job.assignedSalesman) ||
        resolveName(job.assignedTo) ||
        resolveName(job.assignedFitter) ||
        (typeof job.assignedSalesmanName === "string" ? job.assignedSalesmanName : undefined) ||
        (typeof job.assignedFitterName === "string" ? job.assignedFitterName : undefined);

    const teamStr = typeof job.team === "string" && job.team !== "Assigned Team" ? job.team : undefined;
    const recNameStr = typeof firstRecommendation?.name === "string" ? firstRecommendation.name : undefined;

    const representativeName = resolvedAssignedName || teamStr || recNameStr || "Unassigned";
    const representativeInitials = initialsFromName(representativeName);
    const distanceLabel = typeof firstRecommendation?.dist === "number" ? `${firstRecommendation.dist.toFixed(1)} km` : "Not Started";
    const etaLabel = typeof firstRecommendation?.duration === "number" ? formatDuration(firstRecommendation.duration) : "Not Available";

    const getStatusStyle = (status: string) => {
        const s = status.toUpperCase();
        if (s.includes("COMPLETED")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
        if (s.includes("READY FOR FITTING") || s.includes("FITTING")) return "bg-amber-50 text-amber-700 border-amber-200";
        if (s.includes("MEASURING") || s.includes("QUOTING") || s.includes("WAY")) return "bg-blue-50 text-blue-700 border-blue-200";
        if (s.includes("CANCEL") || s.includes("DROP")) return "bg-red-50 text-red-700 border-red-200";
        return "bg-slate-100 text-slate-700 border-slate-200";
    };

    return (
        <div
            id={`job-card-${job.id}`}
            onClick={() => {
                onSelect();
                if (!isSelected) {
                    setTimeout(() => {
                        document.getElementById(`job-card-${job.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 100);
                }
            }}
            className={cn(
                "group relative cursor-pointer rounded-[24px] border bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.07)] transition-all duration-200 active:scale-[0.99]",
                "hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]",
                isSelected ? "border-amber-300 ring-2 ring-amber-200/70" : "border-slate-100"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <span className="rounded-md border border-sky-100 bg-sky-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-tight text-blue-700 shadow-sm">
                    {compactJobType(job)}
                </span>
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] shadow-sm border",
                        getStatusStyle(statusLabel)
                    )}>
                        {statusLabel}
                    </span>
                    {showEditDelete && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-28" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction?.("edit", job.id); }} className="flex cursor-pointer items-center gap-2 text-xs">
                                    <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction?.("delete", job.id); }} className="flex cursor-pointer items-center gap-2 text-xs text-red-600 focus:text-red-700">
                                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                    <span>Delete</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            <div className="mt-4">
                <div className="flex items-center gap-2">
                    <h4 className="min-w-0 flex-1 truncate text-[18px] font-black leading-tight tracking-[-0.025em] text-slate-900">
                        {job.client || "Unknown Unknown"}
                    </h4>
                    {job.priority === "High" && <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_0_5px_rgba(239,68,68,0.14)]" />}
                </div>
                <div className="mt-3 flex items-start gap-2.5 text-[13px] font-semibold leading-snug text-slate-400">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span className="line-clamp-2">{job.address || job.area || "Deira Street, Naif, Deira, Dubai Emirate, United Arab Emirates"}</span>
                </div>
            </div>

            <div className="my-3 h-px bg-slate-100" />

            <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Representative</span>
                <div className="flex max-w-[58%] items-center gap-1.5 rounded-full border border-slate-100 bg-white px-2 py-1.5 shadow-[0_4px_16px_rgba(15,23,42,0.05)]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-bold text-slate-950">{representativeInitials}</span>
                    <span className="truncate text-[13px] font-black text-slate-800">{representativeName}</span>
                </div>
            </div>

            <div className="my-3 h-px bg-slate-100" />

            <div className="rounded-[18px] border border-slate-100 bg-white px-3.5 py-3.5 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.8)]">
                <div className="flex items-center justify-between gap-3 text-[13px] leading-none">
                    <div className="flex items-center gap-2 font-semibold text-slate-400">
                        <CarFront className="h-3.5 w-3.5 text-red-500" />
                        <span>Distance:</span>
                    </div>
                    <span className="font-semibold italic text-slate-400">{distanceLabel}</span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-[13px] leading-none">
                    <div className="flex items-center gap-2 font-semibold text-slate-400">
                        <Clock3 className="h-3.5 w-3.5 text-slate-300" />
                        <span>ETA:</span>
                    </div>
                    <span className="font-semibold italic text-slate-400">{etaLabel}</span>
                </div>
                <div className="my-3 h-px bg-slate-100" />
                <div className="flex items-center justify-between gap-3 text-[13px] leading-none">
                    <div className="flex items-center gap-2 font-black uppercase tracking-[0.10em] text-slate-400">
                        <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                        <span>Time Slot:</span>
                    </div>
                    <span className="font-black text-slate-800">{timeSlot(job)}</span>
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                    {job.phone && (
                        <a href={`tel:${job.phone}`} className="inline-flex max-w-full items-center gap-2 truncate text-[11px] font-semibold text-slate-400 hover:text-amber-600" onClick={(e) => e.stopPropagation()}>
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{job.phone}</span>
                        </a>
                    )}
                </div>
                {variant === "assignment" && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect();
                        }}
                        className="rounded-full bg-slate-900 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-white shadow-lg transition-colors hover:bg-amber-600"
                    >
                        {isSelected ? "Cancel" : "Assign"}
                    </button>
                )}
                {variant === "schedule" && <ChevronRight className={cn("h-5 w-5 text-slate-300 transition-transform", isSelected && "rotate-90 text-amber-500")} />}
            </div>

            {isSelected && variant === "assignment" && job.recommendedFitters && (
                <div className="mt-4 animate-in slide-in-from-top-2 fade-in duration-300 border-t border-slate-100 pt-4">
                    <div className="space-y-2">
                        {job.recommendedFitters.map((rec, i) => (
                            <div key={rec.id} className="group/fitter flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3 transition-all hover:border-amber-300 hover:bg-white hover:shadow-md" onClick={(e) => { e.stopPropagation(); onAction?.("assign", rec.id); }}>
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-black text-slate-700 transition-colors group-hover/fitter:border-amber-500 group-hover/fitter:bg-amber-500 group-hover/fitter:text-white">{i + 1}</div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-black text-slate-800">{rec.name}</p>
                                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-500">
                                            {rec.isFree ? <span className="text-emerald-600">Available Now</span> : rec.timerStartedAt ? <LiveCountdown startedAt={rec.timerStartedAt} /> : <span>Busy</span>}
                                            {typeof rec.dist === "number" && <span>{rec.dist < 1 ? "< 1" : rec.dist.toFixed(1)} km away</span>}
                                            {typeof rec.duration === "number" && <span>~{formatDuration(rec.duration)}</span>}
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover/fitter:translate-x-0.5 group-hover/fitter:text-amber-500" />
                            </div>
                        ))}
                        {job.recommendedFitters.length === 0 && <p className="flex items-center gap-1 text-xs italic text-red-500"><AlertCircle className="h-3 w-3" /> No representatives in range.</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
