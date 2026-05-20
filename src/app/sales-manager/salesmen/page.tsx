"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { format, addDays, isSameDay, parseISO } from "date-fns";
import { ArrowLeft, ClipboardList, FileText, MapPin, Calendar, CheckCircle, Mail, Phone, Eye, Pencil, Plus, Trash2, Save, UserCheck, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/components/providers/auth-provider";
import { FitterList } from "@/components/tracking/FitterList";
import { getUsers, type UserRecord, extractLatLng } from "@/lib/users";
import { getJobs, updateJob, type Job, getJobErrorMessage } from "@/lib/jobs";
import type { Fitter, FitterJob } from "@/lib/live-store";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Dynamically import map with no SSR
const FitterMap = dynamic(() => import("@/components/tracking/FitterMap"), {
    ssr: false,
    loading: () => <div className="h-[500px] w-full bg-slate-100 flex items-center justify-center text-slate-400 font-light tracking-[0.2em]">LOADING LIVE MAP...</div>
});

function isSalesman(user: UserRecord) {
    const role = user.role?.toLowerCase() ?? "";
    return role === "salesman" || role === "sales_man" || role === "field";
}

function toDisplayTime(value?: string) {
    if (!value) return "";
    try {
        return format(parseISO(value), "HH:mm");
    } catch {
        return "";
    }
}

function toDisplayEndTime(value?: string) {
    if (!value) return "";
    try {
        const start = parseISO(value);
        return format(new Date(start.getTime() + 2 * 60 * 60 * 1000), "HH:mm");
    } catch {
        return "";
    }
}

function toFitterJob(job: Job): FitterJob {
    return {
        id: job._id,
        client: job.customerName,
        address: job.address,
        time: toDisplayTime(job.scheduledAt),
        endTime: toDisplayEndTime(job.scheduledAt),
        status: job.status === "completed" ? "Done" : job.status === "in_progress" ? "In Progress" : "Pending",
        value: job.projectValue ?? ((job.quantity ?? 1) * 1000),
        email: job.customerEmail,
        phone: job.customerPhone,
        notes: job.notes,
        brand: "Easy Blinds",
        property: `Qty ${job.quantity ?? 1}`,
        productType: (job.productType as any) ?? "Blinds",
        priority: job.priority === "high" ? "High" : job.priority === "medium" ? "Medium" : "Low",
    };
}

function isJobForDate(job: Job, date: Date) {
    if (!job.scheduledAt) return false;
    try {
        return isSameDay(parseISO(job.scheduledAt), date);
    } catch {
        return false;
    }
}

function isAssignedToSalesman(job: Job, salesman: UserRecord) {
    // Check assignedSalesman field (set by the Reassign dialog)
    if (job.assignedSalesman) {
        if (job.assignedSalesman === salesman._id) return true;
        if (job.assignedSalesman.toLowerCase() === salesman.name.toLowerCase()) return true;
    }
    if (job.assignedTo) {
        if (job.assignedTo === salesman._id) return true;
        if (job.assignedTo.toLowerCase() === salesman.name.toLowerCase()) return true;
        return false;
    }
    const match = job.notes?.match(/Assigned to ([^@.]+)(?: @|\.|$)/i);
    const assignedName = match?.[1]?.trim();
    if (!assignedName) return false;
    return assignedName.toLowerCase() === salesman.name.toLowerCase();
}

function getUnassignedJobs(jobs: Job[]) {
    return jobs.filter((job) => !job.assignedTo && (job.status === "pending" || job.status === "scheduled"));
}

function getStatusVariant(status: string) {
    if (status === "completed" || status === "Approved") return "default";
    if (status === "cancelled" || status === "Rejected") return "destructive";
    if (status === "Assigned") return "default";
    return "secondary";
}

function formatDate(value?: string) {
    if (!value) return "Not scheduled";
    try {
        return format(new Date(value), "dd MMM yyyy, hh:mm a");
    } catch {
        return value;
    }
}

function getQuoteJobId(quote: any) {
    return quote.jobId ?? quote.measurementId ?? "Unknown Job";
}

const TIME_SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];

export default function SalesmenPage() {
    const { user } = useAuth();
    const [salesmen, setSalesmen] = useState<UserRecord[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [selectedSalesmanId, setSelectedSalesmanId] = useState<string | null>(null);
    const [selectedJobId, setSelectedJobId] = useState<string>("");
    const [isAssigning, setIsAssigning] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState<any | null>(null);
    const [isEditingQuote, setIsEditingQuote] = useState(false);
    const [editQuoteData, setEditQuoteData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fitters, setFitters] = useState<UserRecord[]>([]);
    const [assignFitterQuote, setAssignFitterQuote] = useState<any | null>(null);
    const [selectedFitterId, setSelectedFitterId] = useState<string>("");
    const [scheduledDate, setScheduledDate] = useState<string>("");
    const [scheduledTime, setScheduledTime] = useState<string>("09:00");
    const [isAssigningFitter, setIsAssigningFitter] = useState(false);
    const [filterSalesman, setFilterSalesman] = useState<string>("all");
    const [filterDate, setFilterDate] = useState<string>("");

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [usersResult, jobsResult] = await Promise.all([
                getUsers(),
                getJobs({ limit: 100 }),
            ]);
            const allUsers = usersResult;
            setSalesmen(allUsers.filter(isSalesman));
            setFitters(allUsers.filter(u => {
                const role = u.role?.toLowerCase() ?? "";
                return role === "fitter";
            }));
            setJobs(jobsResult.items);
        } catch (error) {
            toast.error("Failed to load salesmen data");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const unassignedJobs = useMemo(() => getUnassignedJobs(jobs), [jobs]);

    const submittedQuotes = useMemo(() => {
        return jobs.map(j => {
            const assignedSalesman = salesmen.find(s => isAssignedToSalesman(j, s));
            const displayStatus = j.assignedFitter ? "Assigned" : (j.quotation?.status ?? "");
            return { 
                ...j.quotation, 
                jobId: j._id, 
                jobCustomerName: j.customerName,
                salesmanName: assignedSalesman?.name || "Unknown Salesman",
                status: displayStatus,
                date: j.quotation?.date || j.createdAt,
            };
        }).filter((quote) => quote && quote.id && quote.status !== "Draft");
    }, [jobs, salesmen]);

    const filteredQuotes = useMemo(() => {
        return submittedQuotes.filter(quote => {
            if (filterSalesman !== "all" && quote.salesmanName !== filterSalesman) {
                return false;
            }
            if (filterDate) {
                const quoteDateStr = quote.date ? new Date(quote.date).toISOString().split('T')[0] : "";
                if (quoteDateStr !== filterDate) {
                    return false;
                }
            }
            return true;
        });
    }, [submittedQuotes, filterSalesman, filterDate]);

    const mappedSalesmen = useMemo<Fitter[]>(() => {
        const today = new Date();
        const tomorrow = addDays(today, 1);

        return salesmen.map((salesman) => {
            const assignedJobs = jobs.filter((job) => ["pending", "scheduled", "in_progress", "completed"].includes(job.status) && isAssignedToSalesman(job, salesman));
            const todayJobs = assignedJobs.filter((job) => isJobForDate(job, today)).map(toFitterJob);
            const tomorrowJobs = assignedJobs.filter((job) => isJobForDate(job, tomorrow)).map(toFitterJob);
            const upcomingJobs = assignedJobs.filter((job) => job.scheduledAt && !isJobForDate(job, today) && !isJobForDate(job, tomorrow)).map(toFitterJob);
            
            const activeAssignedJobs = assignedJobs.filter(j => j.status !== "completed");
            // Set max to 999 to hide the denominator as requested
            const maxCapacity = 999;
            const currentCapacity = activeAssignedJobs.length;
            const remainingCapacity = Math.max(0, maxCapacity - currentCapacity);
            const busySlots = todayJobs.map((job) => job.time).filter(Boolean);
            const nextAvailableSlot = TIME_SLOTS.find((slot) => !busySlots.includes(slot)) ?? "None";
            
            const activeJob = todayJobs.find((job) => job.status === "In Progress") ?? todayJobs.find((job) => job.status === "Pending") ?? tomorrowJobs.find((job) => job.status === "In Progress") ?? tomorrowJobs.find((job) => job.status === "Pending");
            
            let status: Fitter["status"] = "Available";
            if (salesman.liveStatus === "Offline") status = "Offline";
            else if (salesman.liveStatus === "Completed") status = "Completed";
            else if (salesman.liveStatus === "On the way") status = "On the way";
            else if (salesman.liveStatus === "In progress") status = "In progress";
            else if (todayJobs.some(j => j.status === "In Progress")) status = "In progress";
            else if (todayJobs.some(j => j.status === "Pending")) status = "On the way";
            
            return {
                id: salesman._id,
                name: salesman.name,
                role: "Salesman",
                jobRef: activeJob?.id ?? "--",
                status,
                location: (() => { const ll = extractLatLng(salesman.location); return ll ? [ll.lat, ll.lng] as [number, number] : undefined; })(),
                locationLabel: salesman.location?.address,
                lastUpdated: (() => { const u = salesman.location?.updatedAt; if (!u) return "Not updated"; try { return format(typeof u === "string" ? parseISO(u) : new Date(u), "MMM d, HH:mm"); } catch { return "Not updated"; } })(),
                avatar: salesman.avatar,
                email: salesman.email,
                phone: salesman.phone,
                history: [], 
                schedule: {
                    today: todayJobs,
                    yesterday: [],
                    tomorrow: tomorrowJobs,
                    upcoming: upcomingJobs,
                },
                capacity: {
                    max: maxCapacity,
                    current: currentCapacity,
                    remaining: remainingCapacity,
                },
                nextAvailableSlot,
            };
        });
    }, [salesmen, jobs]);

    const handleAssignJob = async () => {
        if (!selectedSalesmanId || !selectedJobId) {
            toast.error("Select a salesman and job before assigning.");
            return;
        }

        const salesman = salesmen.find(s => s._id === selectedSalesmanId);
        if (!salesman) return;

        setIsAssigning(true);
        try {
            const selectedJob = jobs.find((job) => job._id === selectedJobId);
            const updatedJob = await updateJob(selectedJobId, {
                assignedTo: salesman._id,
                assignedBy: user?.name ?? user?._id,
                status: "scheduled",
                notes: [
                    selectedJob?.notes,
                    `Assigned to salesman ${salesman.name}`,
                ].filter(Boolean).join("\n"),
            });

            setJobs((currentJobs) => currentJobs.map((job) => job._id === updatedJob._id ? updatedJob : job));
            setSelectedJobId("");
            toast.success(`Job assigned to ${salesman.name}`);
        } catch (assignError) {
            toast.error(getJobErrorMessage(assignError, "Unable to assign job to salesman."));
        } finally {
            setIsAssigning(false);
        }
    };

    const handleSaveQuote = async () => {
        if (!editQuoteData) return;
        try {
            const subtotal = (editQuoteData.items || []).reduce((sum: number, item: any) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
            const vat = subtotal * 0.05;
            const newTotal = subtotal + vat;
            
            const updatedQuotation = {
                ...editQuoteData,
                items: (editQuoteData.items || []).map((item: any) => ({
                    ...item,
                    total: (item.quantity || 0) * (item.unitPrice || 0)
                })),
                total: newTotal
            };

            await updateJob(editQuoteData.jobId, {
                quotation: updatedQuotation
            });

            setJobs((currentJobs) => currentJobs.map(j => j._id === editQuoteData.jobId ? { ...j, quotation: updatedQuotation } : j));
            setIsEditingQuote(false);
            setSelectedQuote(updatedQuotation);
            toast.success("Quotation updated successfully");
        } catch (error) {
            toast.error("Failed to update quotation");
        }
    };

    const handleAssignToFitter = async () => {
        if (!assignFitterQuote || !selectedFitterId) {
            toast.error("Please select a fitter.");
            return;
        }
        const fitter = fitters.find(f => f._id === selectedFitterId);
        if (!fitter) return;

        setIsAssigningFitter(true);
        try {
            let scheduledAt: string | undefined = undefined;
            if (scheduledDate) {
                const timeStr = scheduledTime || "09:00";
                scheduledAt = new Date(`${scheduledDate}T${timeStr}:00`).toISOString();
            }
            const updatedJob = await updateJob(assignFitterQuote.jobId, {
                assignedFitter: fitter._id,
                assignedTo: fitter._id,
                assignedSalesman: assignFitterQuote.salesmanName ?? "",
                assignedBy: user?.name ?? user?._id ?? "Sales Manager",
                status: "scheduled",
                scheduledAt,
                notes: `Assigned to fitter ${fitter.name} by Sales Manager${scheduledDate ? ` for ${scheduledDate} at ${scheduledTime || "09:00"}` : ""}.`,
            });
            setJobs(curr => curr.map(j => j._id === updatedJob._id ? updatedJob : j));
            toast.success(`Job assigned to fitter ${fitter.name}${scheduledDate ? ` on ${scheduledDate}` : ""}`);
            setAssignFitterQuote(null);
            setSelectedFitterId("");
            setScheduledDate("");
            setScheduledTime("09:00");
        } catch (error) {
            toast.error(getJobErrorMessage(error, "Failed to assign fitter."));
        } finally {
            setIsAssigningFitter(false);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto bg-slate-50">
            <div className="flex items-end justify-between px-8 py-6 flex-shrink-0 bg-white border-b border-slate-200">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-slate-400 font-bold">
                        <Link href="/sales-manager" className="hover:text-amber-600 transition-colors flex items-center gap-2">
                            <ArrowLeft className="w-3 h-3" />
                            Operations
                        </Link>
                        <div className="w-8 h-px bg-amber-600"></div>
                        <span>Sales Workflow</span>
                    </div>
                    <h1 className="text-5xl font-light tracking-tight text-slate-900">
                        Live
                        <span className="block font-medium mt-1">Salesmen</span>
                    </h1>
                </div>
            </div>

            {/* Tracking Section */}
            <div className="flex border-b border-slate-200 bg-white shadow-sm flex-shrink-0 overflow-hidden" style={{ height: "600px" }}>
                {/* Sidebar — fixed width, clips horizontal overflow, allows vertical scroll inside ScrollArea */}
                <div className="w-[400px] flex-shrink-0 border-r border-slate-200 bg-white flex flex-col h-full overflow-x-hidden">
                    <FitterList
                        fitters={mappedSalesmen}
                        selectedFitterId={selectedSalesmanId}
                        onSelectFitter={setSelectedSalesmanId}
                        onJobsChanged={loadData}
                        variant="salesman"
                    />
                </div>

                {/* Map View */}
                <div className="flex-1 min-w-0 h-full relative bg-slate-100 overflow-hidden">
                    <FitterMap
                        fitters={mappedSalesmen}
                        selectedFitterId={selectedSalesmanId}
                        onSelectFitter={setSelectedSalesmanId}
                        filterRole="Salesman"
                    />

                    {/* Live Indicator Overlay */}
                    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-4 py-2 flex items-center gap-2 border border-white/50 shadow-lg rounded-full z-30 ring-1 ring-black/5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">Live Updates Active</span>
                    </div>

                    {selectedSalesmanId && (
                        <div className="absolute top-16 right-4 z-30 w-96 bg-white/80 backdrop-blur-md shadow-2xl border border-white/50 animate-in slide-in-from-right-4 flex flex-col max-h-[calc(100%-5rem)] rounded-3xl overflow-hidden ring-1 ring-black/5">
                            {(() => {
                                const fitter = mappedSalesmen.find((item) => item.id === selectedSalesmanId);
                                if (!fitter) return null;
                                const activeSchedule = fitter.schedule.today;
                                const capacityPercent = fitter.capacity.max > 0 ? (activeSchedule.length / fitter.capacity.max) * 100 : 0;
                                const activeJobObj = fitter.schedule.today.find(j => j.id === fitter.jobRef) ?? 
                                                     fitter.schedule.tomorrow.find(j => j.id === fitter.jobRef) ?? 
                                                     fitter.schedule.upcoming.find(j => j.id === fitter.jobRef);
                                return (
                                    <>
                                        <div className="p-6 border-b border-slate-100/50 flex justify-between items-start bg-slate-50/50">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-16 w-16 rounded-2xl border-2 border-white shadow-md bg-white">
                                                    <AvatarImage src={fitter.avatar} />
                                                    <AvatarFallback>{fitter.role === "Salesman" ? "SM" : "FT"}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h3 className="text-lg font-light text-slate-900">{fitter.name}</h3>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                        <span className={cn(
                                                            "w-2.5 h-2.5 rounded-full relative inline-block",
                                                            (fitter.status as string) === "Available" ? "bg-emerald-500 ring-2 ring-emerald-100" :
                                                            (fitter.status as string) === "On the way" || (fitter.status as string) === "On Road" ? "bg-amber-500 ring-2 ring-amber-100" :
                                                            (fitter.status as string) === "In progress" || (fitter.status as string) === "Measuring" || (fitter.status as string) === "In Progress" ? "bg-blue-500 ring-2 ring-blue-100" :
                                                            (fitter.status as string) === "Fully Booked" ? "bg-red-500 ring-2 ring-red-100" :
                                                            "bg-slate-400 ring-2 ring-slate-100"
                                                        )}>
                                                            {((fitter.status as string) === "On the way" || (fitter.status as string) === "In progress" || (fitter.status as string) === "In Progress") && (
                                                                 <span className="absolute inset-0 rounded-full animate-ping opacity-25 bg-current"></span>
                                                             )}
                                                        </span>
                                                        {fitter.role ?? "Salesman"} · {fitter.status}
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => setSelectedSalesmanId(null)} className="text-slate-400 hover:text-slate-600">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                            {fitter.locationLabel && (
                                                <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Location</span>
                                                        <span className="leading-snug">{fitter.locationLabel}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {activeJobObj && ((fitter.status as string) === "On the way" || (fitter.status as string) === "In progress" || (fitter.status as string) === "In Progress" || (fitter.status as string) === "Measuring") && (
                                                <div className={cn(
                                                    "flex items-start gap-2.5 text-xs p-3 rounded-xl border",
                                                    (fitter.status as string) === "On the way"
                                                        ? "bg-amber-50/60 border-amber-100/80 text-amber-900"
                                                        : "bg-blue-50/60 border-blue-100/80 text-blue-900"
                                                )}>
                                                    <Clock className={cn("w-4.5 h-4.5 mt-0.5 flex-shrink-0", (fitter.status as string) === "On the way" ? "text-amber-500" : "text-blue-500")} />
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                            {(fitter.status as string) === "On the way" ? "Traveling To" : "Active Measure Job"}
                                                        </span>
                                                        <span className="font-semibold text-slate-900 mt-0.5 truncate">{activeJobObj.client}</span>
                                                        <span className="text-slate-500 text-[11px] leading-tight mt-0.5 truncate">{activeJobObj.address}</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                                                    <span>Workload (Today)</span>
                                                    <span className="text-emerald-600 font-semibold">
                                                        {activeSchedule.length} Assignment{activeSchedule.length !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, capacityPercent)}%` }}></div>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Timeline: {format(new Date(), "EEE, d MMM")}</h4>
                                                <div className="space-y-0 relative border-l border-slate-200 ml-2">
                                                    {activeSchedule.length === 0 ? (
                                                        <div className="pl-6 pb-2 text-sm italic text-slate-400">No jobs assigned for this day.</div>
                                                    ) : (
                                                        [...activeSchedule].sort((a, b) => (a.time || "").localeCompare(b.time || "")).map((job) => (
                                                            <div key={job.id} className="pl-6 pb-6 relative last:pb-0 group">
                                                                <div className="absolute -left-[5px] top-1.5 w-[9px] h-[9px] rounded-full border-2 ring-4 ring-white transition-colors bg-white border-slate-400 group-hover:border-slate-600 cursor-pointer"></div>
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1">
                                                                        <div className="text-xs font-mono font-medium text-slate-400 mb-0.5">{job.time || "Unscheduled"}</div>
                                                                        <div className="text-sm font-medium text-slate-800">
                                                                            <div className="flex flex-col">
                                                                                <span>{job.client || "Assigned Job"}</span>
                                                                                <span className="text-xs text-slate-500 font-normal">{job.address || "On-site"}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>

            {/* Management Section */}
            <div className="p-8 space-y-6 max-w-[1600px]">
                <div className="grid grid-cols-1 gap-6">
                    {/* <Card className="border-slate-200 shadow-sm rounded-xl">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-emerald-600" />
                                Assign Job to Salesman
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Select Salesman</label>
                                    <Select value={selectedSalesmanId ?? ""} onValueChange={setSelectedSalesmanId}>
                                        <SelectTrigger className="h-11 border-slate-200">
                                            <SelectValue placeholder="Choose salesman" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {salesmen.map((salesman) => (
                                                <SelectItem key={salesman._id} value={salesman._id}>{salesman.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Select Pending Job</label>
                                    <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                                        <SelectTrigger className="h-11 border-slate-200">
                                            <SelectValue placeholder="Choose job" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {unassignedJobs.map((job) => (
                                                <SelectItem key={job._id} value={job._id}>{job.customerName} • {job.address}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleAssignJob} disabled={isAssigning || !selectedSalesmanId || !selectedJobId} className="h-11 px-8 bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm">
                                    Assign
                                </Button>
                            </div>
                        </CardContent>
                    </Card> */}

                    <Card className="border-slate-200 shadow-sm rounded-xl">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    Submitted Quotations
                                </CardTitle>
                                <div className="flex items-center gap-4 flex-wrap">
                                    {/* Salesman Filter */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Salesman:</span>
                                        <Select value={filterSalesman} onValueChange={setFilterSalesman}>
                                            <SelectTrigger className="h-9 w-40 bg-white border-slate-200 text-xs">
                                                <SelectValue placeholder="All Salesmen" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Salesmen</SelectItem>
                                                {Array.from(new Set(submittedQuotes.map(q => q.salesmanName).filter(Boolean))).map((name) => (
                                                    <SelectItem key={name} value={name}>{name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {/* Date Filter */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date:</span>
                                        <div className="relative">
                                            <Input
                                                type="date"
                                                value={filterDate}
                                                onChange={(e) => setFilterDate(e.target.value)}
                                                className="h-9 bg-white border-slate-200 text-xs pl-3 pr-8 w-40"
                                            />
                                            {filterDate && (
                                                <button
                                                    onClick={() => setFilterDate("")}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 px-0">
                            {isLoading ? (
                                <p className="text-sm text-slate-500 p-6">Loading quotations...</p>
                            ) : filteredQuotes.length === 0 ? (
                                <p className="text-sm text-slate-500 p-6 text-center italic">No matching quotations found.</p>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="hover:bg-transparent border-slate-100">
                                            <TableHead className="font-semibold text-slate-600 pl-6">Quote</TableHead>
                                            <TableHead className="font-semibold text-slate-600">Client</TableHead>
                                            <TableHead className="font-semibold text-slate-600">Salesman</TableHead>
                                            <TableHead className="font-semibold text-slate-600">Total</TableHead>
                                            <TableHead className="font-semibold text-slate-600">Status</TableHead>
                                            <TableHead className="text-right font-semibold text-slate-600 pr-6">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredQuotes.map((quote) => (
                                            <TableRow key={quote.id} className="border-slate-100">
                                                <TableCell className="pl-6">
                                                    <div className="font-semibold text-slate-900">{quote.id}</div>
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-700">{quote.client || quote.jobCustomerName}</TableCell>
                                                <TableCell className="font-medium text-slate-700">
                                                    <Badge variant="outline" className="text-xs text-slate-600 bg-slate-50">{quote.salesmanName}</Badge>
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-900">AED {quote.total?.toLocaleString()}</TableCell>
                                                <TableCell><Badge variant={getStatusVariant(quote.status)} className="font-bold tracking-wide">{quote.status}</Badge></TableCell>
                                                <TableCell className="text-right pr-6 space-x-2">
                                                    <Button variant="outline" size="sm" onClick={() => { setSelectedQuote(quote); setIsEditingQuote(false); }} className="border-slate-200 hover:border-slate-300 hover:bg-slate-50">
                                                        <Eye className="w-4 h-4 mr-1 text-slate-400" /> View
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => { setSelectedQuote(quote); setEditQuoteData(quote); setIsEditingQuote(true); }} className="border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-700">
                                                        <Pencil className="w-4 h-4 mr-1" /> Edit
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => { setAssignFitterQuote(quote); setSelectedFitterId(""); }} className="border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700">
                                                        <UserCheck className="w-4 h-4 mr-1" /> Assign Fitter
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={Boolean(selectedQuote) || isEditingQuote} onOpenChange={(open) => { if (!open) { setSelectedQuote(null); setIsEditingQuote(false); } }}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{isEditingQuote ? "Edit Quotation" : "Quotation Details"}</DialogTitle>
                        <DialogDescription>
                            {(isEditingQuote ? editQuoteData : selectedQuote)?.id} • {(isEditingQuote ? editQuoteData : selectedQuote)?.client || (isEditingQuote ? editQuoteData : selectedQuote)?.jobCustomerName} • AED {(isEditingQuote ? editQuoteData : selectedQuote)?.total?.toLocaleString()}
                            <span className="block mt-1">Submitted by: <span className="font-medium text-slate-900">{(isEditingQuote ? editQuoteData : selectedQuote)?.salesmanName}</span></span>
                        </DialogDescription>
                    </DialogHeader>
                    
                    {isEditingQuote && editQuoteData ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</label>
                                    <Select value={editQuoteData.status} onValueChange={(val) => setEditQuoteData({...editQuoteData, status: val})}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Draft">Draft</SelectItem>
                                            <SelectItem value="Sent">Sent</SelectItem>
                                            <SelectItem value="Negotiation">Negotiation</SelectItem>
                                            <SelectItem value="Approved">Approved</SelectItem>
                                            <SelectItem value="Rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="border rounded-lg border-slate-200 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="w-24">Qty</TableHead>
                                            <TableHead className="w-32">Unit Price</TableHead>
                                            <TableHead className="w-32">Total</TableHead>
                                            <TableHead className="w-16"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(editQuoteData.items || []).map((item: any, idx: number) => (
                                            <TableRow key={idx}>
                                                <TableCell>
                                                    <Input value={item.description} onChange={(e) => {
                                                        const newItems = [...editQuoteData.items];
                                                        newItems[idx].description = e.target.value;
                                                        setEditQuoteData({...editQuoteData, items: newItems});
                                                    }} />
                                                </TableCell>
                                                <TableCell>
                                                    <Input type="number" min="1" value={item.quantity === 0 ? "" : item.quantity} onChange={(e) => {
                                                        const newItems = [...editQuoteData.items];
                                                        newItems[idx].quantity = parseInt(e.target.value) || 0;
                                                        setEditQuoteData({...editQuoteData, items: newItems});
                                                    }} />
                                                </TableCell>
                                                <TableCell>
                                                    <Input type="number" min="0" value={item.unitPrice === 0 ? "" : item.unitPrice} onChange={(e) => {
                                                        const newItems = [...editQuoteData.items];
                                                        newItems[idx].unitPrice = parseFloat(e.target.value) || 0;
                                                        setEditQuoteData({...editQuoteData, items: newItems});
                                                    }} />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    AED {((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => {
                                                        const newItems = editQuoteData.items.filter((_: any, i: number) => i !== idx);
                                                        setEditQuoteData({...editQuoteData, items: newItems});
                                                    }}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="p-3 bg-slate-50 border-t border-slate-200">
                                    <Button variant="outline" size="sm" onClick={() => {
                                        setEditQuoteData({...editQuoteData, items: [...(editQuoteData.items || []), { id: Math.random().toString(), description: "", quantity: 1, unitPrice: 0 }]});
                                    }}>
                                        <Plus className="w-4 h-4 mr-2" /> Add Item
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : selectedQuote && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
                                    <p className="font-semibold text-slate-900 mt-1">{selectedQuote.status}</p>
                                </div>
                                {/* <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Job / Measurement</p>
                                    <p className="font-semibold text-slate-900 mt-1">{getQuoteJobId(selectedQuote)}</p>
                                </div> */}
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Created</p>
                                    <p className="font-semibold text-slate-900 mt-1">{formatDate(selectedQuote.date)}</p>
                                </div>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Unit Price</TableHead>
                                        <TableHead>Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(selectedQuote.items ?? []).map((item: any) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell>AED {item.unitPrice?.toLocaleString()}</TableCell>
                                            <TableCell>AED {item.total?.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                    {(selectedQuote.items ?? []).length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-slate-500 py-6">No line items stored for this quote.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    <DialogFooter>
                        {isEditingQuote ? (
                            <>
                                <Button variant="outline" onClick={() => setIsEditingQuote(false)}>Cancel</Button>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSaveQuote}>
                                    <Save className="w-4 h-4 mr-2" /> Save Changes
                                </Button>
                            </>
                        ) : (
                            <Button variant="outline" onClick={() => setSelectedQuote(null)}>Close</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign to Fitter Dialog */}
            <Dialog open={Boolean(assignFitterQuote)} onOpenChange={(open) => { if (!open) { setAssignFitterQuote(null); setSelectedFitterId(""); } }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <UserCheck className="w-5 h-5 text-blue-600" />
                            Assign Job to Fitter
                        </DialogTitle>
                        <DialogDescription>
                            Selecting a fitter will mark this job as <span className="font-semibold text-slate-700">Scheduled</span> and send it to the Fitter Assignments queue.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="bg-slate-50 rounded-lg border border-slate-100 p-4 space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quotation</p>
                            <p className="font-semibold text-slate-900">{assignFitterQuote?.id}</p>
                            <p className="text-sm text-slate-600">{assignFitterQuote?.client || assignFitterQuote?.jobCustomerName} • AED {assignFitterQuote?.total?.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">Submitted by: {assignFitterQuote?.salesmanName}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Select Fitter</label>
                            {fitters.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">No fitters found in the system.</p>
                            ) : (
                                <Select value={selectedFitterId} onValueChange={setSelectedFitterId}>
                                    <SelectTrigger className="h-11 border-slate-200">
                                        <SelectValue placeholder="Choose a fitter..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fitters.map((fitter) => (
                                            <SelectItem key={fitter._id} value={fitter._id}>
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                                                    {fitter.name}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Schedule Date</label>
                                <Input
                                    type="date"
                                    value={scheduledDate}
                                    min={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    className="h-11 border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Time Slot</label>
                                <Select value={scheduledTime} onValueChange={setScheduledTime}>
                                    <SelectTrigger className="h-11 border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"].map(slot => (
                                            <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {!scheduledDate && (
                            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded px-3 py-2">⚠ Without a date, the job won't appear in the date-filtered timeline. It will still be visible in the Scheduled tab.</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setAssignFitterQuote(null); setSelectedFitterId(""); }}>Cancel</Button>
                        <Button
                            disabled={!selectedFitterId || isAssigningFitter}
                            onClick={handleAssignToFitter}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <UserCheck className="w-4 h-4 mr-2" />
                            {isAssigningFitter ? "Assigning..." : "Confirm Assignment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
