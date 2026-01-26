"use client";

import { useState, useMemo, useEffect } from "react";
import { MOCK_JOBS, InstallationJob } from "@/lib/data/jobs";
import { brands } from "@/lib/brands";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar as CalendarIcon, MapPin, ArrowRight, Filter, Clock, Phone, User, X, Navigation, CheckCircle2, AlertCircle, Briefcase, ChevronRight, MoreHorizontal, CalendarDays, Pencil, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { useLiveFitters, Fitter } from "@/lib/live-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JobCard } from "@/components/common/JobCard";
import { FilterSortBar } from "@/components/common/FilterSortBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { format, addDays, isSameDay, parseISO } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const AssignmentMap = dynamic(() => import("@/components/tracking/FitterMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400 font-light tracking-[0.2em]">LOADING DATA...</div>
});

// --- Distance & Logic Helpers ---
function getDistKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Time slots
const DAILY_SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00"];

// Custom Scrollbar Style
const customScrollbarStyle = {
    // We can't easily do pseudo-elements in inline styles, so we'll rely on a global class or a simple component wrapper.
    // Ideally, we'd use `className="scrollbar-thin scrollbar-thumb-slate-300 ..."` if utilizing a plugin.
    // For now, we'll try standard utility classes for modern browsers if supported, or leave as is if Tailwind config is unknown.
    // Instead, let's assume we want to force scrollIntoView.
};

export default function SmartAssignmentsPage() {
    const { fitters } = useLiveFitters();
    const [jobs, setJobs] = useState<InstallationJob[]>(MOCK_JOBS);
    const [selectedMapFitter, setSelectedMapFitter] = useState<string | null>(null);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

    // --- NEW: View State ---
    const [viewDate, setViewDate] = useState<Date>(new Date());

    const isToday = isSameDay(viewDate, new Date());
    const isTomorrow = isSameDay(viewDate, addDays(new Date(), 1));

    // Assignment/Edit Flow State
    const [dialogState, setDialogState] = useState<{
        type: 'assign' | 'edit';
        jobId: string;
        jobClient: string;
        fitterId: string;
        fitterName: string;
        currentSlot?: string;
        currentDate?: Date; // Added for context
        availableSlots: string[];
    } | null>(null);

    // --- Reschedule Specific State ---
    const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined);
    // When rescheduling, we need to know the slots avail on THAT date.
    // For prototype, if date == Today/Tomorrow, we calc real. Else we assume all free.
    const rescheduleSlots = useMemo(() => {
        if (!dialogState || !rescheduleDate) return [];

        const f = fitters.find(x => x.id === dialogState.fitterId);
        if (!f) return DAILY_SLOTS;

        // Determine busy slots for the selected date
        let busySlots: string[] = [];
        if (isSameDay(rescheduleDate, new Date())) {
            busySlots = f.schedule.today.map(j => j.time);
        } else if (isSameDay(rescheduleDate, addDays(new Date(), 1))) {
            busySlots = f.schedule.tomorrow.map(j => j.time);
        } else {
            // Mocking: future dates are mostly free for now
            busySlots = [];
        }

        // Return all slots that aren't busy. 
        // Note: If edit mode, we technically allow moving back to same slot if we want, 
        // but typically rescheduling implies *change*.
        // If date changed, all free slots are valid.
        // If same date, filter current slot? User might want to just click confirmation, so maybe keep it but mark as current.

        return DAILY_SLOTS.filter(s => {
            // If same day as current appointment, allow the current slot (it's occupied by THIS job)
            if (dialogState.type === 'edit' && isSameDay(rescheduleDate, dialogState.currentDate!) && s === dialogState.currentSlot) {
                return true;
            }
            return !busySlots.includes(s);
        });

    }, [rescheduleDate, dialogState, fitters]);


    // Filter Jobs
    const pendingJobs = jobs.filter(j => j.status === "Ready for Installation" || j.status === "Pending Team");
    const activeJobs = jobs.filter(j => (j.status === "Scheduled" || j.status === "Installation In Progress") && (!j.scheduled || j.scheduled === format(viewDate, "yyyy-MM-dd")));

    // Recommendations logic (unchanged)
    const recommendedFitters = useMemo(() => {
        if (!selectedJobId) return [];
        const job = jobs.find(j => j.id === selectedJobId);
        if (!job || !job.coordinates) return [];
        return fitters.map(f => ({ ...f, dist: f.location ? getDistKm(f.location[0], f.location[1], job.coordinates![0], job.coordinates![1]) : 999 }))
            .filter(f => f.capacity.current < f.capacity.max)
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 3);
    }, [selectedJobId, fitters, jobs]);


    // Step 1: Initiate Assignment
    const initiateAssignment = (jobId: string, fitterId: string) => {
        const fitter = fitters.find(f => f.id === fitterId);
        const job = jobs.find(j => j.id === jobId);
        if (!fitter || !job) return;

        if (fitter.capacity.remaining <= 0) {
            toast.error("Compliance Error: Maximum daily capacity (5) reached.");
            return;
        }

        // Default to View Date for assignment
        setRescheduleDate(viewDate);

        setDialogState({
            type: 'assign',
            jobId,
            jobClient: job.client,
            fitterId,
            fitterName: fitter.name,
            currentDate: viewDate,
            availableSlots: [] // Calculated in useMemo now
        });
    };

    // Step 1b: Initiate Edit
    const initiateEdit = (fitterId: string, jobTime: string, jobClient: string) => {
        const fitter = fitters.find(f => (f.id === fitterId) || (f.name === fitterId));
        if (!fitter) return;

        // Default to Current View Date (assuming we clicked from that view)
        setRescheduleDate(viewDate);

        setDialogState({
            type: 'edit',
            jobId: 'mock-id',
            jobClient: jobClient,
            fitterId,
            fitterName: fitter.name,
            currentSlot: jobTime,
            currentDate: viewDate,
            availableSlots: [] // Calculated in useMemo
        });
    };

    // Step 2: Confirm Action
    const confirmAction = (timeSlot: string) => {
        if (!dialogState || !rescheduleDate) return;

        const newDateStr = format(rescheduleDate, "yyyy-MM-dd");

        if (dialogState.type === 'assign') {
            toast.success(`Assigned to ${dialogState.fitterName} on ${newDateStr} @ ${timeSlot}`);
            setJobs(prev => prev.map(j => j.id === dialogState.jobId ? {
                ...j,
                status: "Scheduled",
                team: dialogState.fitterName,
                time: timeSlot,
                scheduled: newDateStr,
                fitterStatus: "Free"
            } : j));
        } else {
            toast.success(`Rescheduled to ${newDateStr} @ ${timeSlot}`);
            // Update jobs in real app
        }

        setDialogState(null);
        setSelectedJobId(null);
        setSelectedMapFitter(null);
    };

    // Step 3: Unassign
    const handleUnassign = () => {
        if (!dialogState) return;
        toast.info("Unassigned. Job returned to pending.");
        setDialogState(null);
    };

    // Helper
    const getFitterByName = (name: string) => fitters.find(f => f.name === name);

    return (
        <div className="flex h-[calc(100vh-6rem)] overflow-hidden bg-white">

            {/* LEFT PANEL */}
            <div className="w-full xl:w-[500px] flex flex-col border-r border-slate-200 bg-white z-20 shadow-xl">
                <div className="p-8 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-slate-400 font-bold mb-2">
                        <div className="w-8 h-px bg-amber-600"></div>
                        <span>Workforce Optimization</span>
                    </div>
                    <div className="flex justify-between items-end mb-6">
                        <h1 className="text-3xl font-light text-slate-900">
                            Smart <span className="font-medium">Dispatch</span>
                        </h1>
                    </div>

                    {/* Date Filters: Toolbar Style */}
                    <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className={cn("text-xs font-medium h-7 px-3 rounded-md transition-all", isToday ? "bg-white shadow-sm text-slate-900 border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50")} onClick={() => setViewDate(new Date())}>Today</Button>
                            <Button variant="ghost" size="sm" className={cn("text-xs font-medium h-7 px-3 rounded-md transition-all", isTomorrow ? "bg-white shadow-sm text-slate-900 border border-slate-200/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50")} onClick={() => setViewDate(addDays(new Date(), 1))}>Tomorrow</Button>
                        </div>
                        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 mx-2">
                            <span className="text-xs text-slate-600 font-semibold">{format(viewDate, "MMM do")}</span>
                            <Popover>
                                <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50"><CalendarDays className="w-3.5 h-3.5" /></Button></PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end"><Calendar mode="single" selected={viewDate} onSelect={(d) => d && setViewDate(d)} initialFocus /></PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50">
                    {/* Filter & Sort Bar */}
                    <FilterSortBar
                        onFilterClick={() => { }}
                        onSortChange={(sort) => { }}
                        currentSort="Default Sorting"
                        className="border-t border-b-0"
                    />

                    <Tabs defaultValue="pending" className="flex-1 flex flex-col">
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

                        <TabsContent value="pending" className="flex-1 overflow-y-auto outline-none p-4 pr-3 scrollbar-container">
                            <style jsx>{`
                                .scrollbar-container::-webkit-scrollbar {
                                    width: 6px;
                                }
                                .scrollbar-container::-webkit-scrollbar-track {
                                    background: transparent; 
                                }
                                .scrollbar-container::-webkit-scrollbar-thumb {
                                    background-color: #cbd5e1; 
                                    border-radius: 20px;
                                }
                                .scrollbar-container::-webkit-scrollbar-thumb:hover {
                                    background-color: #94a3b8; 
                                }
                            `}</style>
                            <div className="space-y-3">
                                {pendingJobs.map(job => {
                                    const isSelected = selectedJobId === job.id;
                                    return (
                                        <JobCard
                                            key={job.id}
                                            job={{
                                                ...job,
                                                recommendedFitters: recommendedFitters
                                            }}
                                            isSelected={isSelected}
                                            onSelect={() => setSelectedJobId(isSelected ? null : job.id)}
                                            onAction={(action, payload) => {
                                                if (action === 'assign') {
                                                    initiateAssignment(job.id, payload);
                                                }
                                            }}
                                            variant="assignment"
                                        />
                                    );
                                })}
                                {pendingJobs.length === 0 && <div className="text-center py-10 text-slate-300 text-sm font-light">No pending jobs.</div>}
                            </div>
                        </TabsContent>

                        <TabsContent value="active" className="flex-1 overflow-y-auto outline-none p-4">
                            <div className="space-y-3">
                                {activeJobs.map(job => {
                                    return (
                                        <JobCard
                                            key={job.id}
                                            job={job}
                                            isSelected={false} // Active jobs generally not selectable for assignment in this view logic
                                            onSelect={() => { }} // No-op or open manage modal
                                            onAction={(action) => {
                                                if (action === 'manage') {
                                                    const fitter = getFitterByName(job.team);
                                                    initiateEdit(fitter ? fitter.id : job.team, job.time!, job.client);
                                                }
                                            }}
                                            variant="schedule"
                                        />
                                    );
                                })}
                                {activeJobs.length === 0 && <div className="text-center py-10 text-slate-300 text-sm font-light">No scheduled jobs for this date.</div>}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* RIGHT PANEL MAP (Unchanged visual, logic same) */}
            <div className="flex-1 bg-slate-100 relative">
                <AssignmentMap fitters={fitters} selectedFitterId={selectedMapFitter} onSelectFitter={setSelectedMapFitter} />
                {/* Legend Overlay - Glassmorphism */}
                <div className="absolute bottom-6 left-6 z-[1000] bg-white/80 backdrop-blur-md border border-white/50 p-4 shadow-2xl rounded-2xl max-w-sm ring-1 ring-black/5">
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-3">Live Fleet Status</h4>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-medium text-slate-700">
                        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 shadow-sm relative"><span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-emerald-500"></span></span> Available</div>
                        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-100 shadow-sm"></span> In Progress</div>
                        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-100 shadow-sm"></span> On the Way</div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-100 shadow-sm"></div> Fully Booked</div>
                    </div>
                </div>
                {selectedMapFitter && (
                    <div className="absolute top-6 right-6 z-[1000] w-96 bg-white/80 backdrop-blur-md shadow-2xl border border-white/50 animate-in slide-in-from-right-4 flex flex-col max-h-[calc(100vh-3rem)] rounded-3xl overflow-hidden ring-1 ring-black/5">
                        {(() => {
                            const f = fitters.find(x => x.id === selectedMapFitter);
                            if (!f) return null;
                            const capacityPercent = (f.capacity.current / f.capacity.max) * 100;
                            const activeSchedule = isToday ? f.schedule.today : (isTomorrow ? f.schedule.tomorrow : []);
                            return (
                                <>
                                    <div className="p-6 border-b border-slate-100/50 flex justify-between items-start bg-slate-50/50">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-16 w-16 rounded-2xl border-2 border-white shadow-md bg-white"><AvatarImage src={f.avatar} /><AvatarFallback>SM</AvatarFallback></Avatar>
                                            <div>
                                                <h3 className="text-lg font-light text-slate-900">{f.name}</h3>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1"><span className={cn("w-2 h-2 rounded-full", f.status === "Fully Booked" ? "bg-red-500" : "bg-emerald-500")}></span>{f.status}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedMapFitter(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                                    </div>
                                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                        <div>
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2"><span>Workload ({format(viewDate, "MMM do")})</span><span className={cn(f.capacity.remaining === 0 ? "text-red-600" : "text-emerald-600")}>{activeSchedule.length} / {f.capacity.max} Assignments</span></div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className={cn("h-full transition-all", capacityPercent >= 100 ? "bg-red-500" : "bg-emerald-500")} style={{ width: `${(activeSchedule.length / f.capacity.max) * 100}%` }}></div></div>
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Timeline: {format(viewDate, "EEE, d MMM")}</h4>
                                            <div className="space-y-0 relative border-l border-slate-200 ml-2">
                                                {DAILY_SLOTS.map((time) => {
                                                    const job = activeSchedule.find(j => j.time === time);
                                                    const isBusy = !!job;
                                                    return (
                                                        <div key={time} className="pl-6 pb-6 relative last:pb-0 group">
                                                            <div className={cn("absolute -left-[5px] top-1.5 w-[9px] h-[9px] rounded-full border-2 ring-4 ring-white transition-colors", isBusy ? "bg-white border-slate-400 group-hover:border-slate-600 cursor-pointer" : "bg-emerald-500 border-white")}></div>
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="text-xs font-mono font-medium text-slate-400 mb-0.5">{time}</div>
                                                                    {isBusy ? (
                                                                        <div className="cursor-pointer" onClick={() => initiateEdit(f.id, time, job.client)}>
                                                                            <div className="text-sm font-medium text-slate-800 hover:text-amber-600 transition-colors flex items-center justify-between pr-2">
                                                                                <div className="flex flex-col"><span>{job.client || "Assigned Job"}</span><span className="text-xs text-slate-500 font-normal">{job.address || "On-site"}</span></div>
                                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-slate-600"><Pencil className="w-3 h-3" /></Button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (<div className="text-sm font-light text-slate-500 italic">Available Slot</div>)}
                                                                </div>
                                                                {!isBusy && <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] uppercase font-bold tracking-wider rounded-sm border border-emerald-100">Free</div>}
                                                            </div>
                                                        </div>
                                                    )
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

            {/* --- IMPROVED ASSIGNMENT / EDIT DIALOG --- */}
            <Dialog open={!!dialogState} onOpenChange={(open) => !open && setDialogState(null)}>
                <DialogContent className="sm:max-w-2xl bg-white p-0 overflow-hidden flex flex-col md:flex-row gap-0">

                    {/* LEFT: INFO & DATE PICKER */}
                    <div className="bg-slate-50 p-6 border-r border-slate-100 w-full md:w-1/2 flex flex-col">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-xl font-light text-slate-900 mb-1">
                                {dialogState?.type === 'edit' ? 'Reschedule' : 'Confirm Dispatch'}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {dialogState?.type === 'edit'
                                    ? `Moving ${dialogState.jobClient} (Currently ${dialogState.currentSlot})`
                                    : `Assigning ${dialogState?.jobClient} to ${dialogState?.fitterName}`
                                }
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
                        </div>
                    </div>

                    {/* RIGHT: TIME SLOTS */}
                    <div className="bg-white p-6 w-full md:w-1/2 flex flex-col">
                        <div className="mb-6 flex items-center justify-between">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block">2. Select Time Slot</label>
                            {rescheduleDate && <span className="text-xs font-medium text-slate-900">{format(rescheduleDate, "EEE, MMM do")}</span>}
                        </div>

                        <div className="grid grid-cols-2 gap-3 flex-1 content-start">
                            {rescheduleSlots.map((slot) => {
                                const isCurrent = dialogState?.type === 'edit' && slot === dialogState.currentSlot && isSameDay(rescheduleDate!, dialogState.currentDate!);
                                return (
                                    <Button
                                        key={slot}
                                        variant={isCurrent ? "secondary" : "outline"}
                                        className={cn(
                                            "h-14 flex flex-col gap-0 items-center justify-center border-slate-100 transition-all",
                                            isCurrent ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700"
                                        )}
                                        disabled={isCurrent}
                                        onClick={() => confirmAction(slot)}
                                    >
                                        <span className="font-bold text-lg">{slot}</span>
                                        <span className="text-[9px] uppercase tracking-wider font-normal opacity-70">
                                            {isCurrent ? "Current Time" : "Available"}
                                        </span>
                                    </Button>
                                )
                            })}

                            {rescheduleSlots.length === 0 && (
                                <div className="col-span-2 py-8 text-center border border-dashed border-red-200 bg-red-50/50 rounded-lg">
                                    <p className="text-red-500 font-medium text-sm">No slots available.</p>
                                    <p className="text-xs text-red-400 mt-1">Please select another date.</p>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="mt-auto sm:justify-between pt-6 border-t border-slate-50">
                            {dialogState?.type === 'edit' ? (
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
