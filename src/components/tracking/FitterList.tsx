"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, CheckCircle2, Circle, Clock, MoreVertical, Calendar as CalendarIcon, History, AlertTriangle, AlertCircle, User, Phone, Briefcase, ArrowRight, ChevronRight, ChevronLeft } from "lucide-react";
import { Fitter, FitterStatus, FitterJob } from "@/lib/live-store";
import { Badge } from "@/components/ui/badge";
import { format, parse, isPast, addDays, isSameDay } from "date-fns";
import { JobCard, UnifiedJob } from "@/components/common/JobCard";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { FilterSortBar } from "@/components/common/FilterSortBar";

interface FitterListProps {
    fitters: Fitter[];
    selectedFitterId: string | null;
    onSelectFitter: (id: string) => void;
}

const statusConfig: Record<FitterStatus, { color: string; icon: React.ComponentType<any> }> = {
    "On the way": { color: "text-amber-600 bg-amber-50 border-amber-200", icon: Clock },
    "In progress": { color: "text-blue-600 bg-blue-50 border-blue-200", icon: Circle },
    "Completed": { color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
    "Offline": { color: "text-slate-400 bg-slate-50 border-slate-200", icon: Circle },
    "Fully Booked": { color: "text-red-600 bg-red-50 border-red-200", icon: AlertCircle },
    "Available": { color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
};

function calculateIsLate(jobTime: string, status: string) {
    if (status === "Done" || status === "In Progress" || status === "Completed") return false;
    try {
        const todayStr = format(new Date(), "yyyy-MM-dd");
        const jobDate = parse(`${todayStr} ${jobTime}`, "yyyy-MM-dd hh:mm aa", new Date());
        const fifteenMinsAfter = new Date(jobDate.getTime() + 15 * 60000);
        return isPast(fifteenMinsAfter);
    } catch (e) {
        return false;
    }
}

export function FitterList({ fitters, selectedFitterId, onSelectFitter }: FitterListProps) {
    const [viewDate, setViewDate] = useState<Date>(new Date());

    const selectedFitter = fitters.find(f => f.id === selectedFitterId);

    const sortedFitters = useMemo(() => {
        return [...fitters].sort((a, b) => {
            const aHasLate = a.schedule.today.some(j => calculateIsLate(j.time, j.status));
            const bHasLate = b.schedule.today.some(j => calculateIsLate(j.time, j.status));
            if (aHasLate && !bHasLate) return -1;
            if (!aHasLate && bHasLate) return 1;
            if (a.status === "Offline" && b.status !== "Offline") return 1;
            if (a.status !== "Offline" && b.status === "Offline") return -1;
            return 0;
        });
    }, [fitters]);

    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-200">

            {/* List Header */}
            <div className="p-8 border-b border-slate-100">
                <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-2">Field Team</h2>
                <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-light text-slate-900">{fitters.length} <span className="text-sm font-light text-slate-400">Total</span></p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0">
                {!selectedFitter ? (
                    <ScrollArea className="flex-1">
                        <div className="flex flex-col divide-y divide-slate-50">
                            {sortedFitters.map((fitter) => {
                                const config = statusConfig[fitter.status] || statusConfig['Offline'];
                                const StatusIcon = config.icon;
                                const hasLateJob = fitter.schedule.today.some(j => calculateIsLate(j.time, j.status));

                                return (
                                    <button
                                        key={fitter.id}
                                        onClick={() => onSelectFitter(fitter.id)}
                                        className={cn(
                                            "flex items-center gap-4 p-5 text-left transition-all relative group rounded-xl border mb-3 mx-4 hover:shadow-md",
                                            hasLateJob ? "bg-red-50/50 border-red-200" : "bg-white border-slate-200 hover:border-amber-300"
                                        )}
                                    >
                                        <div className="flex-shrink-0 relative">
                                            <Avatar className="h-14 w-14 border-2 border-white shadow-sm rounded-full bg-slate-100">
                                                <AvatarImage src={fitter.avatar} />
                                                <AvatarFallback className="rounded-full text-slate-400 font-light">{fitter.name.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <div className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                                                fitter.status === "Available" ? "bg-emerald-500" :
                                                    fitter.status === "In progress" ? "bg-blue-500" :
                                                        fitter.status === "On the way" ? "bg-amber-500" : "bg-slate-400"
                                            )}></div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="font-semibold text-base truncate text-slate-900 group-hover:text-amber-700 transition-colors">{fitter.name}</p>
                                                {hasLateJob ? (
                                                    <Badge variant="destructive" className="text-[9px] h-5 px-1.5 rounded-md animate-pulse">LATE</Badge>
                                                ) : (
                                                    <span className={cn("text-[9px] uppercase tracking-wider font-bold",
                                                        fitter.status === "Available" ? "text-emerald-600" : "text-slate-400"
                                                    )}>
                                                        {fitter.status}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                                <MapPin className="w-3 h-3 text-slate-300" />
                                                <span className="truncate">{fitter.jobRef || "No active job"}</span>
                                            </div>
                                        </div>

                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-500 transition-colors" />
                                    </button>
                                );
                            })}
                        </div>
                    </ScrollArea>
                ) : (
                    // Enhanced Viewing Mode for Selected Fitter
                    <div className="flex flex-col h-full bg-slate-50">
                        {/* Selected Header */}
                        <div className="p-8 bg-white border-b border-slate-100">
                            <button onClick={() => onSelectFitter("")} className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-400 hover:text-amber-600 mb-6 flex items-center gap-2 transition-colors">
                                <ArrowLeft className="w-3 h-3" /> Back to Fleet
                            </button>
                            <div className="flex items-center gap-6">
                                <Avatar className="h-20 w-20 border border-slate-200 rounded-none bg-slate-50">
                                    <AvatarImage src={selectedFitter.avatar} />
                                    <AvatarFallback className="rounded-none text-xl font-light text-slate-400">{selectedFitter.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-2xl font-light text-slate-900 mb-1">{selectedFitter.name}</h3>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-normal text-slate-500 bg-slate-50 rounded-none border-slate-200">{selectedFitter.status}</Badge>
                                        <span className="text-xs text-slate-400 font-light">Updated {selectedFitter.lastUpdated}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        {/* Filter & Sort Bar (New) */}
                        <FilterSortBar
                            onFilterClick={() => { }}
                            onSortChange={(sort) => { }}
                            currentSort="Default Sorting"
                            className="border-t-0"
                        />

                        {/* Date Toolbar (Standardized) */}
                        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-20">
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button onClick={() => setViewDate(new Date())} className={cn("px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all", isSameDay(viewDate, new Date()) ? "bg-white text-emerald-700 shadow-sm" : "text-slate-400 hover:text-slate-600")}>Today</button>
                                <button onClick={() => setViewDate(addDays(new Date(), 1))} className={cn("px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all", isSameDay(viewDate, addDays(new Date(), 1)) ? "bg-white text-emerald-700 shadow-sm" : "text-slate-400 hover:text-slate-600")}>Tomorrow</button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-500 hidden sm:inline-block">{format(viewDate, "MMMM do, yyyy")}</span>
                                <div className="h-4 w-px bg-slate-200 mx-2 hidden sm:block"></div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" className="h-8 w-8 text-slate-500 border-slate-200 hover:text-emerald-700 hover:border-emerald-300">
                                            <CalendarIcon className="w-4 h-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="end">
                                        <Calendar mode="single" selected={viewDate} onSelect={(date) => date && setViewDate(date)} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 bg-slate-50">
                            <div className="p-8">
                                {(() => {
                                    // Determine jobs based on viewDate
                                    let jobsToShow: FitterJob[] = [];
                                    if (isSameDay(viewDate, new Date())) {
                                        jobsToShow = selectedFitter.schedule.today;
                                    } else if (isSameDay(viewDate, addDays(new Date(), 1))) {
                                        jobsToShow = selectedFitter.schedule.tomorrow || [];
                                    } else {
                                        // Fallback or empty for other dates in this prototype
                                        jobsToShow = [];
                                    }

                                    return (
                                        <div className="space-y-12">
                                            {/* Activity Log (Only for Today) */}
                                            {isSameDay(viewDate, new Date()) && (
                                                <div>
                                                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-6 flex items-center gap-2">
                                                        <History className="w-3 h-3" />
                                                        Live Activity
                                                    </h4>
                                                    <div className="space-y-0 pl-2 border-l border-slate-200 ml-1">
                                                        {selectedFitter.history.map((event) => (
                                                            <div key={event.id} className="relative pl-8 pb-8 last:pb-0">
                                                                <div className="absolute -left-[5px] top-1.5 w-[9px] h-[9px] rounded-full bg-white ring-1 ring-slate-300"></div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-mono text-slate-400 mb-1 tracking-wide">{event.time}</span>
                                                                    <span className="text-sm font-medium text-slate-700">{event.action}</span>
                                                                    <span className="text-xs text-slate-400 font-light mt-0.5">{event.location}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {selectedFitter.history.length === 0 && (
                                                            <p className="text-xs text-slate-400 italic pl-6">No activity recorded yet today.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Scheduled Jobs */}
                                            <div>
                                                <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-6">Schedule</h4>
                                                <div className="space-y-4">
                                                    {jobsToShow.length > 0 ? jobsToShow.map(job => (
                                                        <JobCard
                                                            key={job.id}
                                                            job={job}
                                                            isSelected={false}
                                                            onSelect={() => { }}
                                                            variant="schedule"
                                                        />
                                                    )) : (
                                                        <p className="text-sm text-slate-400 italic">No jobs scheduled for this date.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper component for back arrow (needed since lucide might not be imported in every scope if I messed up imports above, checking... imports look good)
function ArrowLeft({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
        </svg>
    )
}
