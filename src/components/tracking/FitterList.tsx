"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, CheckCircle2, Circle, Clock, MoreVertical, Calendar, History, AlertTriangle, AlertCircle } from "lucide-react";
import { Fitter, FitterStatus } from "@/lib/live-store";
import { Badge } from "@/components/ui/badge";
import { format, parse, isPast } from "date-fns";

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
    const [activeTab, setActiveTab] = useState<'today' | 'yesterday' | 'upcoming'>('today');

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
                                            "flex items-center gap-4 p-6 text-left transition-all hover:bg-slate-50 group",
                                            hasLateJob ? "bg-red-50/30 hover:bg-red-50/50" : ""
                                        )}
                                    >
                                        <Avatar className="h-12 w-12 border border-slate-200 rounded-none bg-slate-100">
                                            <AvatarImage src={fitter.avatar} />
                                            <AvatarFallback className="rounded-none text-slate-400 font-light">{fitter.name.substring(0, 2)}</AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="font-light text-sm truncate text-slate-900 group-hover:text-black transition-colors">{fitter.name}</p>
                                                {hasLateJob ? (
                                                    <span className="text-[9px] uppercase tracking-[0.1em] px-2 py-1 border font-bold flex items-center gap-1.5 text-red-700 bg-red-50 border-red-100 animate-pulse">
                                                        <AlertCircle className="w-3 h-3" />
                                                        LATE
                                                    </span>
                                                ) : (
                                                    <span className={cn("text-[9px] uppercase tracking-[0.1em] px-2 py-1 border font-medium flex items-center gap-1.5", config.color)}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {fitter.status}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-400 font-light flex items-center gap-2">
                                                <MapPin className="w-3 h-3 text-slate-300" />
                                                <span>{fitter.jobRef}</span>
                                            </div>
                                        </div>
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
                        <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10">
                            {(['today', 'yesterday', 'upcoming'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "flex-1 py-4 text-[10px] uppercase tracking-[0.2em] font-bold transition-colors border-b-2",
                                        activeTab === tab
                                            ? "border-amber-600 text-amber-900 bg-amber-50/10"
                                            : "border-transparent text-slate-300 hover:text-slate-500"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <ScrollArea className="flex-1 bg-slate-50">
                            <div className="p-8">
                                {activeTab === 'today' && (
                                    <div className="space-y-12">

                                        {/* Activity Log */}
                                        <div>
                                            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-6 flex items-center gap-2">
                                                <History className="w-3 h-3" />
                                                Live Activity
                                            </h4>
                                            <div className="space-y-0 pl-2 border-l border-slate-200 ml-1">
                                                {selectedFitter.history.map((event, i) => (
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

                                        {/* Scheduled Jobs */}
                                        <div>
                                            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-6">Schedule</h4>
                                            <div className="space-y-4">
                                                {selectedFitter.schedule.today.map(job => {
                                                    const isLate = calculateIsLate(job.time, job.status);
                                                    return (
                                                        <div key={job.id} className="space-y-3 group">
                                                            {isLate && (
                                                                <div className="bg-red-50 border border-red-100 p-4 flex items-start gap-4 text-red-900 animate-in slide-in-from-top-1 shadow-sm">
                                                                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                                                    <div className="text-sm font-light leading-relaxed">
                                                                        <span className="font-bold block text-xs uppercase tracking-wider mb-1 text-red-700">Attention Required</span>
                                                                        Fitter is marked as <span className="font-medium">LATE</span> for this appointment. Client notification recommended.
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className={cn(
                                                                "p-6 border transition-all bg-white hover:shadow-md",
                                                                isLate
                                                                    ? "border-red-200 shadow-sm"
                                                                    : "border-slate-100 hover:border-slate-200"
                                                            )}>
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <p className="font-medium text-base text-slate-900">{job.client}</p>
                                                                    <Badge variant="outline" className={cn(
                                                                        "text-[10px] uppercase tracking-wider rounded-none font-bold",
                                                                        isLate ? "border-red-200 bg-red-50 text-red-700" : "bg-slate-50 border-slate-100 text-slate-500"
                                                                    )}>
                                                                        {isLate && job.status === "Pending" ? "LATE" : job.status}
                                                                    </Badge>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-xs text-slate-500 font-light mb-2">
                                                                    <MapPin className="w-3 h-3 text-slate-300" />
                                                                    {job.address}
                                                                </div>
                                                                <p className={cn(
                                                                    "text-sm font-mono mt-4 flex items-center gap-2 pt-4 border-t border-slate-50",
                                                                    isLate ? "text-red-600 font-bold" : "text-slate-400"
                                                                )}>
                                                                    <Clock className={cn("w-3 h-3", isLate ? "text-red-500" : "text-slate-300")} />
                                                                    {job.time}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
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
