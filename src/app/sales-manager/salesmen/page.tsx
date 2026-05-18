"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { format, addDays, isSameDay, parseISO } from "date-fns";
import { ArrowLeft, ClipboardList, FileText, MapPin, Calendar, CheckCircle, Mail, Phone, Eye } from "lucide-react";
import { toast } from "sonner";
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
import { getUsers, type UserRecord } from "@/lib/users";
import { getJobs, updateJob, type Job, getJobErrorMessage } from "@/lib/jobs";
import type { Fitter, FitterJob } from "@/lib/live-store";

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
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [usersResult, jobsResult] = await Promise.all([
                getUsers(),
                getJobs({ limit: 100 }),
            ]);
            setSalesmen(usersResult.filter(isSalesman));
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
        return jobs.map(j => ({ ...j.quotation, jobId: j._id })).filter((quote) => quote && quote.id && quote.status !== "Draft");
    }, [jobs]);

    const mappedSalesmen = useMemo<Fitter[]>(() => {
        const today = new Date();
        const tomorrow = addDays(today, 1);

        return salesmen.map((salesman) => {
            const assignedJobs = jobs.filter((job) => ["scheduled", "in_progress", "completed"].includes(job.status) && isAssignedToSalesman(job, salesman));
            const todayJobs = assignedJobs.filter((job) => isJobForDate(job, today)).map(toFitterJob);
            const tomorrowJobs = assignedJobs.filter((job) => isJobForDate(job, tomorrow)).map(toFitterJob);
            const upcomingJobs = assignedJobs.filter((job) => job.scheduledAt && !isJobForDate(job, today) && !isJobForDate(job, tomorrow)).map(toFitterJob);
            
            // Set max to 999 to hide the denominator as requested
            const maxCapacity = 999;
            const currentCapacity = todayJobs.length;
            const remainingCapacity = Math.max(0, maxCapacity - currentCapacity);
            const busySlots = todayJobs.map((job) => job.time).filter(Boolean);
            const nextAvailableSlot = TIME_SLOTS.find((slot) => !busySlots.includes(slot)) ?? "None";
            
            const activeJob = todayJobs.find((job) => job.status === "In Progress") ?? todayJobs.find((job) => job.status === "Pending");
            
            let status: Fitter["status"] = "Available";
            if (salesman.liveStatus === "Offline") status = "Offline";
            else if (salesman.liveStatus === "Completed") status = "Completed";
            else if (todayJobs.some(j => j.status === "In Progress")) status = "In progress";
            else if (todayJobs.some(j => j.status === "Pending")) status = "On the way";
            
            return {
                id: salesman._id,
                name: salesman.name,
                role: "Salesman",
                jobRef: activeJob?.id ?? "--",
                status,
                location: salesman.location ? [salesman.location.lat, salesman.location.lng] : undefined,
                locationLabel: salesman.location?.address,
                lastUpdated: salesman.location?.updatedAt ? format(parseISO(salesman.location.updatedAt), "MMM d, HH:mm") : "Not updated",
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
                assignedBy: user?._id ?? user?.name,
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
            <div className="flex flex-col md:flex-row border-b border-slate-200 bg-white shadow-sm flex-shrink-0 h-[600px]">
                {/* Sidebar */}
                <div className="w-full md:w-[400px] flex-shrink-0 border-r border-slate-200 z-10 bg-white flex flex-col h-full overflow-y-auto scrollbar-thin">
                    <FitterList
                        fitters={mappedSalesmen}
                        selectedFitterId={selectedSalesmanId}
                        onSelectFitter={setSelectedSalesmanId}
                    />
                </div>

                {/* Map View */}
                <div className="flex-1 h-full relative bg-slate-100">
                    <FitterMap
                        fitters={mappedSalesmen}
                        selectedFitterId={selectedSalesmanId}
                        onSelectFitter={setSelectedSalesmanId}
                    />

                    {/* Live Indicator Overlay */}
                    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-4 py-2 flex items-center gap-2 border border-white/50 shadow-lg rounded-full z-30 ring-1 ring-black/5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">Live Updates Active</span>
                    </div>
                </div>
            </div>

            {/* Management Section */}
            <div className="p-8 space-y-6 max-w-[1600px]">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <Card className="border-slate-200 shadow-sm rounded-xl">
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
                    </Card>

                    <Card className="border-slate-200 shadow-sm rounded-xl">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                Submitted Quotations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 px-0">
                            {isLoading ? (
                                <p className="text-sm text-slate-500 p-6">Loading quotations...</p>
                            ) : submittedQuotes.length === 0 ? (
                                <p className="text-sm text-slate-500 p-6">No submitted quotations yet.</p>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="hover:bg-transparent border-slate-100">
                                            <TableHead className="font-semibold text-slate-600 pl-6">Quote</TableHead>
                                            <TableHead className="font-semibold text-slate-600">Client</TableHead>
                                            <TableHead className="font-semibold text-slate-600">Total</TableHead>
                                            <TableHead className="font-semibold text-slate-600">Status</TableHead>
                                            <TableHead className="text-right font-semibold text-slate-600 pr-6">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {submittedQuotes.map((quote) => (
                                            <TableRow key={quote.id} className="border-slate-100">
                                                <TableCell className="pl-6">
                                                    <div className="font-semibold text-slate-900">{quote.id}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">{getQuoteJobId(quote)}</div>
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-700">{quote.client}</TableCell>
                                                <TableCell className="font-medium text-slate-900">AED {quote.total?.toLocaleString()}</TableCell>
                                                <TableCell><Badge variant={getStatusVariant(quote.status)} className="font-bold tracking-wide">{quote.status}</Badge></TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Button variant="outline" size="sm" onClick={() => setSelectedQuote(quote)} className="border-slate-200 hover:border-slate-300 hover:bg-slate-50">
                                                        <Eye className="w-4 h-4 mr-2 text-slate-400" /> View
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

            <Dialog open={Boolean(selectedQuote)} onOpenChange={(open) => !open && setSelectedQuote(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Quotation Details</DialogTitle>
                        <DialogDescription>
                            {selectedQuote?.id} • {selectedQuote?.client} • AED {selectedQuote?.total?.toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedQuote && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
                                    <p className="font-semibold text-slate-900 mt-1">{selectedQuote.status}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Job / Measurement</p>
                                    <p className="font-semibold text-slate-900 mt-1">{getQuoteJobId(selectedQuote)}</p>
                                </div>
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
                        <Button variant="outline" onClick={() => setSelectedQuote(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
