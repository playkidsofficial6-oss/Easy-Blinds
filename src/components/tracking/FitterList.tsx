"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Calendar as CalendarIcon, History, User, Phone, Briefcase, ChevronRight } from "lucide-react";
import { Fitter, FitterJob } from "@/lib/live-store";
import { Badge } from "@/components/ui/badge";
import { format, parse, isPast, addDays, isSameDay } from "date-fns";
import { JobCard } from "@/components/common/JobCard";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterSortBar } from "@/components/common/FilterSortBar";
import { useAuth } from "@/components/providers/auth-provider";
import { getJobErrorMessage, updateJob } from "@/lib/jobs";
import { JobDetailSheet } from "@/components/tracking/JobDetailSheet";

interface FitterListProps {
    fitters: Fitter[];
    selectedFitterId: string | null;
    onSelectFitter: (id: string) => void;
    onJobsChanged?: () => void | Promise<void>;
    variant?: "fitter" | "salesman";
}

const DAILY_SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00"];

function selectedDateFromSlot(date: Date, slot: string) {
    const [hours, minutes] = slot.split(":").map(Number);
    const next = new Date(date);
    next.setHours(hours, minutes, 0, 0);
    return next.toISOString();
}


function calculateIsLate(jobTime: string, status: string) {
    if (status === "Done" || status === "In Progress" || status === "Completed") return false;
    try {
        const todayStr = format(new Date(), "yyyy-MM-dd");
        const jobDate = parse(`${todayStr} ${jobTime}`, "yyyy-MM-dd hh:mm aa", new Date());
        const fifteenMinsAfter = new Date(jobDate.getTime() + 15 * 60000);
        return isPast(fifteenMinsAfter);
    } catch {
        return false;
    }
}

export function FitterList({ fitters, selectedFitterId, onSelectFitter, onJobsChanged, variant = "fitter" }: FitterListProps) {
    const { user } = useAuth();
    const [viewDate, setViewDate] = useState<Date>(new Date());
    const [dialogState, setDialogState] = useState<{
        job: FitterJob;
        fitterId: string;
        fitterName: string;
        originalFitterId: string;
        currentSlot: string;
        currentDate: Date;
    } | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined);
    const [customTime, setCustomTime] = useState<string>("09:00");
    const [viewFilter, setViewFilter] = useState<"today" | "tomorrow" | "upcoming" | "completed" | "custom">("today");
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

    const selectedFitter = fitters.find(f => f.id === selectedFitterId);

    const rescheduleSlots = useMemo(() => {
        if (!dialogState || !rescheduleDate) return [];

        const targetFitter = fitters.find((item) => item.id === dialogState.fitterId);
        if (!targetFitter) return DAILY_SLOTS;

        let busySlots: string[] = [];
        if (isSameDay(rescheduleDate, new Date())) {
            busySlots = targetFitter.schedule.today.map((job) => job.time);
        } else if (isSameDay(rescheduleDate, addDays(new Date(), 1))) {
            busySlots = targetFitter.schedule.tomorrow.map((job) => job.time);
        }

        return DAILY_SLOTS.filter((slot) => {
            const isCurrentAssignmentSlot =
                dialogState.originalFitterId === dialogState.fitterId &&
                isSameDay(rescheduleDate, dialogState.currentDate) &&
                slot === dialogState.currentSlot;

            return isCurrentAssignmentSlot || !busySlots.includes(slot);
        });
    }, [dialogState, fitters, rescheduleDate]);

    const openRescheduleDialog = (job: FitterJob, fitter: Fitter) => {
        // Use the job's actual scheduled date to pre-fill the dialog.
        const jobDate = job.scheduledAt ? new Date(job.scheduledAt) : viewDate;
        // Pre-fill custom time from the job's scheduled time (HH:MM format)
        const prefillTime = job.time && /^\d{2}:\d{2}$/.test(job.time) ? job.time : format(jobDate, "HH:mm");
        setRescheduleDate(jobDate);
        setCustomTime(prefillTime);
        setDialogState({
            job,
            fitterId: fitter.id,
            fitterName: fitter.name,
            originalFitterId: fitter.id,
            currentSlot: job.time,
            currentDate: jobDate,
        });
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

    const confirmReschedule = async (timeSlot: string) => {
        if (!dialogState || !rescheduleDate) return;

        const serviceDate = format(rescheduleDate, "yyyy-MM-dd");
        const scheduledAt = selectedDateFromSlot(rescheduleDate, timeSlot);

        try {
            const updates: any = {
                status: "scheduled",
                scheduledAt,
                assignedBy: user?.name || user?._id || "Sales Manager",
            };

            if (variant === "salesman") {
                updates.assignedSalesman = dialogState.fitterId;
                updates.assignedTo = dialogState.fitterId; // keep assignedTo in sync for filtering
                updates.notes = `Reassigned to salesman ${dialogState.fitterName} @ ${timeSlot} on ${serviceDate}.`;
            } else {
                updates.assignedTo = dialogState.fitterId;
                updates.assignedFitter = dialogState.fitterId;
                updates.notes = `Rescheduled to fitter ${dialogState.fitterName} @ ${timeSlot} on ${serviceDate}.`;
            }

            await updateJob(dialogState.job.id, updates);

            await onJobsChanged?.();
            toast.success(`${variant === "salesman" ? "Reassigned" : "Rescheduled"} ${dialogState.job.client} to ${serviceDate} @ ${timeSlot}`);
            setDialogState(null);
        } catch (error) {
            toast.error(getJobErrorMessage(error, `Unable to ${variant === "salesman" ? "reassign" : "reschedule"} this job.`));
        }
    };

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
        <>
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
                                                    <div className="flex flex-col">
                                                        <p className="font-semibold text-base truncate text-slate-900 group-hover:text-emerald-700 transition-colors">{fitter.name}</p>
                                                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{fitter.role || "Fitter"}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        {hasLateJob ? (
                                                            <Badge variant="destructive" className="text-[9px] h-5 px-1.5 rounded-md animate-pulse">LATE</Badge>
                                                        ) : (
                                                            <span className={cn("text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full",
                                                                fitter.status === "Available" ? "bg-emerald-100 text-emerald-700" :
                                                                    fitter.status === "Offline" ? "bg-slate-100 text-slate-500" : "bg-amber-100 text-amber-700"
                                                            )}>
                                                                {fitter.status}
                                                            </span>
                                                        )}
                                                        <span className={cn("text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border",
                                                            fitter.checkedIn !== false ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                                                        )}>
                                                            {fitter.checkedIn !== false ? "Checked In" : "Checked Out"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 mt-3 text-xs">
                                                    <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                        <Briefcase className="w-3 h-3 text-slate-400" />
                                                        <span className="font-medium">{fitter.capacity.current} Jobs</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                        <span className="font-medium truncate max-w-[80px]" title={fitter.nextAvailableSlot}>{fitter.nextAvailableSlot}</span>
                                                    </div>
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
                            <div className="p-6 bg-white border-b border-slate-100 relative">
                                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none overflow-hidden">
                                    <User className="w-32 h-32" />
                                </div>
                                <button onClick={() => onSelectFitter("")} className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-400 hover:text-emerald-600 mb-4 flex items-center gap-2 transition-colors relative z-10">
                                    <ArrowLeft className="w-3 h-3" /> Back to Fleet
                                </button>
                                <div className="flex flex-col gap-4 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-16 w-16 border-2 border-white shadow-md rounded-2xl bg-slate-50 flex-shrink-0">
                                            <AvatarImage src={selectedFitter.avatar} className="object-cover" />
                                            <AvatarFallback className="rounded-2xl text-xl font-light text-slate-400">{selectedFitter.name.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-semibold text-slate-900 tracking-tight mb-1 truncate">{selectedFitter.name}</h3>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold border-transparent px-2",
                                                    selectedFitter.status === "Available" ? "bg-emerald-100 text-emerald-700" :
                                                        selectedFitter.status === "Offline" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"
                                                )}>
                                                    {selectedFitter.status}
                                                </Badge>
                                                <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold px-2",
                                                    selectedFitter.checkedIn !== false ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                                                )}>
                                                    {selectedFitter.checkedIn !== false ? "Checked In" : "Checked Out"}
                                                </Badge>
                                                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">• {selectedFitter.role || "Fitter"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-1">
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                                                {selectedFitter.role === "Salesman" ? "Active Workload" : `Workload (${format(viewDate, "MMM do")})`}
                                            </div>
                                            <div className="flex items-end justify-between">
                                                <span className="text-lg font-semibold text-slate-700">
                                                    {selectedFitter.role === "Salesman" ? selectedFitter.capacity.current : selectedFitter.schedule.today.filter(j => j.status === 'Done').length}
                                                    {selectedFitter.role !== "Salesman" && <span className="text-sm font-normal text-slate-400">/ {selectedFitter.schedule.today.length}</span>}
                                                </span>
                                                {/* <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">ASSIGNMENTS</span> */}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Salesman: Tab Toolbar */}
                            {selectedFitter.role === "Salesman" ? (
                                <div className="border-b border-slate-200 bg-white">
                                    <div className="flex bg-slate-50 p-1 mx-6 mt-4 rounded-lg">
                                        <button onClick={() => { setViewFilter("today"); setViewDate(new Date()); }} className={cn("flex-1 px-3 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all text-center", viewFilter === "today" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600")}>Today</button>
                                        <button onClick={() => { setViewFilter("tomorrow"); setViewDate(addDays(new Date(), 1)); }} className={cn("flex-1 px-3 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all text-center", viewFilter === "tomorrow" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600")}>Tomorrow</button>
                                        <button onClick={() => setViewFilter("upcoming")} className={cn("flex-1 px-3 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all text-center", viewFilter === "upcoming" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600")}>Upcoming</button>
                                        <button onClick={() => setViewFilter("completed")} className={cn("flex-1 px-3 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all text-center", viewFilter === "completed" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600")}>Completed</button>
                                    </div>
                                    <div className="px-6 py-3">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={cn("w-full justify-between h-10 text-left font-normal border-slate-200 text-slate-500", viewFilter === "custom" && "border-slate-400 text-slate-900")}>
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                                                        <span className="text-sm">{viewFilter === "custom" && viewDate ? format(viewDate, "MM/dd/yyyy") : "Custom date…"}</span>
                                                    </div>
                                                    <CalendarIcon className="w-4 h-4 text-slate-300" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="center">
                                                <Calendar mode="single" selected={viewDate} onSelect={(date) => { if (date) { setViewFilter("custom"); setViewDate(date); } }} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Fitter: Filter Sort Bar + Date toolbar */}
                                    <FilterSortBar onFilterClick={() => { }} onSortChange={() => { }} currentSort="Default Sorting" className="border-t-0" />
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
                                </>
                            )}

                            <ScrollArea className="flex-1 bg-slate-50">
                                <div className="p-8">
                                    {(() => {
                                        if (selectedFitter.role === "Salesman") {
                                            const allJobs = [
                                                ...selectedFitter.schedule.today,
                                                ...selectedFitter.schedule.tomorrow,
                                                ...selectedFitter.schedule.upcoming,
                                            ];
                                            let salesmanJobs: FitterJob[] = [];
                                            if (viewFilter === "today") salesmanJobs = selectedFitter.schedule.today.filter(j => j.status !== "Done");
                                            else if (viewFilter === "tomorrow") salesmanJobs = selectedFitter.schedule.tomorrow.filter(j => j.status !== "Done");
                                            else if (viewFilter === "upcoming") salesmanJobs = selectedFitter.schedule.upcoming.filter(j => j.status !== "Done");
                                            else if (viewFilter === "completed") salesmanJobs = allJobs.filter(j => j.status === "Done");
                                            else if (viewFilter === "custom") salesmanJobs = allJobs.filter(j => j.scheduledAt && isSameDay(new Date(j.scheduledAt), viewDate));

                                            return (
                                                <div className="space-y-6">
                                                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-4 flex items-center gap-2">
                                                        <Briefcase className="w-3 h-3" />
                                                        {viewFilter === "completed" ? "Completed Jobs" : "Active Assignments"}
                                                    </h4>
                                                    {salesmanJobs.length > 0 ? (
                                                        <div className="space-y-4">
                                                            {salesmanJobs.map(job => (
                                                                <div key={job.id} className="space-y-1">
                                                                    <JobCard
                                                                        job={job}
                                                                        isSelected={false}
                                                                        onSelect={() => {
                                                                            if (job.status === "Done") {
                                                                                setSelectedJobId(job.id);
                                                                            } else {
                                                                                openRescheduleDialog(job, selectedFitter);
                                                                            }
                                                                        }}
                                                                        onAction={(action) => {
                                                                            if (action === "manage") {
                                                                                if (job.status === "Done") setSelectedJobId(job.id);
                                                                                else openRescheduleDialog(job, selectedFitter);
                                                                            }
                                                                        }}
                                                                        variant="schedule"
                                                                    />
                                                                    {job.status === "Done" ? (
                                                                        <div className="flex justify-end">
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:bg-blue-50"
                                                                                onClick={() => setSelectedJobId(job.id)}
                                                                            >
                                                                                View Details
                                                                            </Button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex justify-end">
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-amber-700 hover:bg-amber-50"
                                                                                onClick={() => openRescheduleDialog(job, selectedFitter)}
                                                                            >
                                                                                Reassign
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="py-12 text-center bg-slate-100/50 rounded-xl border border-dashed border-slate-200">
                                                            <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                                            <p className="text-sm font-medium text-slate-500">
                                                                {viewFilter === "completed" ? "No completed jobs." : "No pending jobs."}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }

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
                                            <div className="space-y-8">
                                                {/* Scheduled Jobs / Timeline */}
                                                <div>
                                                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-4 flex items-center gap-2">
                                                        <CalendarIcon className="w-3 h-3" />
                                                        Timeline: {format(viewDate, "EEE, dd MMM")}
                                                    </h4>

                                                    <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pb-4">
                                                        {jobsToShow.length > 0 ? jobsToShow.map((job) => (
                                                            <div key={job.id} className="relative pl-6">
                                                                <div className={cn("absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white",
                                                                    job.status === "Done" ? "border-emerald-500" :
                                                                        job.status === "In Progress" ? "border-blue-500" : "border-slate-300"
                                                                )}></div>
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-xs font-bold text-slate-700">{job.time}</span>
                                                                    <Badge variant="outline" className={cn("text-[9px] uppercase px-1.5 py-0",
                                                                        job.status === "Done" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                                            job.status === "In Progress" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-500 border-slate-200"
                                                                    )}>{job.status}</Badge>
                                                                </div>
                                                                <JobCard
                                                                    job={job}
                                                                    isSelected={false}
                                                                    onSelect={() => openRescheduleDialog(job, selectedFitter)}
                                                                    onAction={(action) => {
                                                                        if (action === "manage") {
                                                                            openRescheduleDialog(job, selectedFitter);
                                                                        }
                                                                    }}
                                                                    variant="schedule"
                                                                />
                                                                <div className="-mt-2 mb-3 flex justify-end">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-amber-700 hover:bg-amber-50"
                                                                        onClick={() => openRescheduleDialog(job, selectedFitter)}
                                                                    >
                                                                        {variant === "salesman" ? "Reassign" : "Reschedule"}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <>
                                                                {/* Show Empty Timeline Slots if no jobs */}
                                                                {DAILY_SLOTS.map((time, idx) => (
                                                                    <div key={idx} className="relative pl-6">
                                                                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-200"></div>
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-xs font-bold text-slate-400">{time}</span>
                                                                            <span className="text-[10px] font-bold text-emerald-500 uppercase">Free</span>
                                                                        </div>
                                                                        <div className="text-xs text-slate-400 italic mt-1 bg-slate-50 p-2 rounded border border-dashed border-slate-200">
                                                                            Available Slot
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Activity Log (Only for Today) */}
                                                {isSameDay(viewDate, new Date()) && (
                                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                                        <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-5 flex items-center gap-2">
                                                            <History className="w-3 h-3" />
                                                            Live GPS Activity
                                                        </h4>
                                                        <div className="space-y-0 pl-2 border-l-2 border-slate-100 ml-1">
                                                            {selectedFitter.history.map((event) => (
                                                                <div key={event.id} className="relative pl-6 pb-6 last:pb-0">
                                                                    <div className="absolute -left-[5px] top-1.5 w-[9px] h-[9px] rounded-full bg-white ring-2 ring-emerald-400"></div>
                                                                    <div className="flex flex-col bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                                        <div className="flex justify-between items-center mb-1">
                                                                            <span className="text-xs font-semibold text-slate-700">{event.action}</span>
                                                                            <span className="text-[10px] font-mono text-slate-400 tracking-wide">{event.time}</span>
                                                                        </div>
                                                                        <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                                                            <MapPin className="w-3 h-3 text-slate-400" /> {event.location}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {selectedFitter.history.length === 0 && (
                                                                <div className="relative pl-6">
                                                                    <div className="absolute -left-[5px] top-1.5 w-[9px] h-[9px] rounded-full bg-slate-200"></div>
                                                                    <p className="text-xs text-slate-400 italic">No activity recorded yet today.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={!!dialogState} onOpenChange={(open) => !open && setDialogState(null)}>
                <DialogContent className="sm:max-w-2xl bg-white p-0 flex flex-col md:flex-row gap-0 overflow-visible">
                    <div className="bg-slate-50 p-6 border-r border-slate-100 w-full md:w-1/2 flex flex-col">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-xl font-light text-slate-900 mb-1">
                                {variant === "salesman" ? "Reassign Job" : "Reschedule Job"}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {dialogState ? `Moving ${dialogState.job.client} from ${dialogState.currentSlot} with ${dialogState.fitterName}` : `Change ${variant === "salesman" ? "salesman" : "fitter"} and time for this job.`}
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
                                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2 block">
                                    2. Select {variant === "salesman" ? "Salesman" : "Fitter"}
                                </label>
                                <Select value={dialogState?.fitterId ?? ""} onValueChange={handleDialogFitterChange}>
                                    <SelectTrigger className="h-11 w-full border-slate-200 bg-white text-sm font-medium text-slate-800">
                                        <SelectValue placeholder={`Choose ${variant === "salesman" ? "salesman" : "fitter"}`} />
                                    </SelectTrigger>
                                    <SelectContent className="z-[1200] max-h-72">
                                        {fitters.map((fitter) => {
                                            const assignedCount = [
                                                ...fitter.schedule.today,
                                                ...fitter.schedule.tomorrow,
                                                ...fitter.schedule.upcoming,
                                            ].filter(j => j.status !== "Done").length;

                                            return (
                                                <SelectItem key={fitter.id} value={fitter.id}>
                                                    <span className="flex w-full items-center justify-between gap-3">
                                                        <span>{fitter.name}</span>
                                                        <span className="text-[10px] uppercase tracking-wider text-slate-400">
                                                            {assignedCount} assigned
                                                        </span>
                                                    </span>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                                    Choose another {variant === "salesman" ? "salesman" : "fitter"} here if this job must be moved away from the current one.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 w-full md:w-1/2 flex flex-col rounded-r-lg">
                        <div className="mb-6 flex items-center justify-between">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">3. Custom Time</label>
                            {rescheduleDate && <span className="text-xs font-medium text-slate-900">{format(rescheduleDate, "EEE, MMM do")}</span>}
                        </div>

                        <div className="flex-1 flex flex-col gap-3">
                            <div className="border border-slate-200 rounded-xl bg-slate-50 p-6 flex flex-col gap-4">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 text-center block">Enter Time</label>
                                <input
                                    type="time"
                                    value={customTime}
                                    onChange={(e) => setCustomTime(e.target.value)}
                                    className="w-full h-14 text-2xl font-mono text-slate-800 border border-slate-200 rounded-lg bg-white px-4 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                />
                            </div>
                            <p className="text-xs text-slate-400 text-center leading-relaxed">
                                You can pick any exact time to schedule this job for the {variant === "salesman" ? "salesman" : "fitter"}.
                            </p>
                        </div>

                        <DialogFooter className="mt-auto sm:justify-end pt-6 border-t border-slate-100 gap-2">
                            <Button type="button" variant="ghost" onClick={() => setDialogState(null)}>Cancel</Button>
                            <Button
                                type="button"
                                disabled={!customTime || !rescheduleDate || !dialogState}
                                onClick={() => confirmReschedule(customTime)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6"
                            >
                                {variant === "salesman" ? "Confirm Dispatch" : "Confirm Reschedule"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Job Detail Sheet — opens when a completed job card is clicked */}
            <JobDetailSheet
                jobId={selectedJobId}
                onClose={() => setSelectedJobId(null)}
            />
        </>
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
