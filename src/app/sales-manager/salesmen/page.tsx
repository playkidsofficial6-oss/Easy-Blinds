"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
    Briefcase,
    Calendar,
    CheckCircle,
    ClipboardList,
    Eye,
    FileText,
    Mail,
    MapPin,
    Phone,
    RefreshCw,
    UserCheck,
} from "lucide-react";
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
import { getJobErrorMessage, getJobs, updateJob, type Job } from "@/lib/jobs";
import { getUserErrorMessage, getUsers, type UserRecord } from "@/lib/users";
import { useQuotes, type Quote } from "@/lib/quote-store";

function isSalesman(user: UserRecord) {
    return user.role === "salesman" || user.role === "sales_man" || user.role === "field";
}

function isAssignedToSalesman(job: Job, salesman: UserRecord) {
    return job.assignedTo === salesman._id || job.assignedTo === salesman.name || job.assignedTo === salesman.email;
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

function getQuoteJobId(quote: Quote) {
    return quote.jobId ?? quote.measurementId;
}

export default function SalesmenPage() {
    const { user } = useAuth();
    const { quotes, isLoaded: quotesLoaded } = useQuotes();
    const [salesmen, setSalesmen] = useState<UserRecord[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedSalesmanId, setSelectedSalesmanId] = useState<string>("");
    const [selectedJobId, setSelectedJobId] = useState<string>("");
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [usersResult, jobsResult] = await Promise.all([
                getUsers(),
                getJobs({ limit: 100 }),
            ]);
            setSalesmen(usersResult.filter(isSalesman));
            setJobs(jobsResult.items);
        } catch (loadError) {
            const message = loadError instanceof Error
                ? loadError.message
                : getUserErrorMessage(loadError, "Unable to load salesman workflow data.");
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadData();
        }, 0);
        return () => window.clearTimeout(timer);
    }, []);

    const unassignedJobs = useMemo(() => getUnassignedJobs(jobs), [jobs]);

    const selectedSalesman = useMemo(
        () => salesmen.find((salesman) => salesman._id === selectedSalesmanId),
        [salesmen, selectedSalesmanId]
    );

    const assignedJobsBySalesman = useMemo(() => {
        return salesmen.reduce<Record<string, Job[]>>((acc, salesman) => {
            acc[salesman._id] = jobs.filter((job) => isAssignedToSalesman(job, salesman));
            return acc;
        }, {});
    }, [jobs, salesmen]);

    const submittedQuotes = useMemo(() => {
        return quotes.filter((quote) => quote.status !== "Draft");
    }, [quotes]);

    const handleAssignJob = async () => {
        if (!selectedSalesman || !selectedJobId) {
            toast.error("Select a salesman and job before assigning.");
            return;
        }

        setIsAssigning(true);
        try {
            const selectedJob = jobs.find((job) => job._id === selectedJobId);
            const updatedJob = await updateJob(selectedJobId, {
                assignedTo: selectedSalesman._id,
                assignedBy: user?._id ?? user?.name,
                status: "scheduled",
                notes: [
                    selectedJob?.notes,
                    `Assigned to salesman ${selectedSalesman.name}`,
                ].filter(Boolean).join("\n"),
            });

            setJobs((currentJobs) => currentJobs.map((job) => job._id === updatedJob._id ? updatedJob : job));
            setSelectedJobId("");
            toast.success(`Job assigned to ${selectedSalesman.name}`);
        } catch (assignError) {
            toast.error(getJobErrorMessage(assignError, "Unable to assign job to salesman."));
        } finally {
            setIsAssigning(false);
        }
    };

    const totalAssignedJobs = jobs.filter((job) => job.assignedTo).length;
    const completedJobs = jobs.filter((job) => job.status === "completed").length;

    return (
        <div className="p-6 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-light text-neutral-900">Salesmen</h1>
                    <p className="text-neutral-500 mt-1">Assign measurement jobs and review quotations submitted by salesmen.</p>
                </div>
                <Button onClick={loadData} variant="outline" disabled={isLoading}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-neutral-900 text-white flex items-center justify-center rounded-lg">
                            <UserCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Salesmen</p>
                            <p className="text-2xl font-semibold text-neutral-900">{salesmen.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 text-white flex items-center justify-center rounded-lg">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Assigned Jobs</p>
                            <p className="text-2xl font-semibold text-neutral-900">{totalAssignedJobs}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-600 text-white flex items-center justify-center rounded-lg">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Completed</p>
                            <p className="text-2xl font-semibold text-neutral-900">{completedJobs}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-600 text-white flex items-center justify-center rounded-lg">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500">Submitted Quotes</p>
                            <p className="text-2xl font-semibold text-neutral-900">{submittedQuotes.length}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <ClipboardList className="w-5 h-5" />
                        Assign Job to Salesman
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                        <Select value={selectedSalesmanId} onValueChange={setSelectedSalesmanId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select salesman" />
                            </SelectTrigger>
                            <SelectContent>
                                {salesmen.map((salesman) => (
                                    <SelectItem key={salesman._id} value={salesman._id}>{salesman.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select pending job" />
                            </SelectTrigger>
                            <SelectContent>
                                {unassignedJobs.map((job) => (
                                    <SelectItem key={job._id} value={job._id}>{job.customerName} • {job.address}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAssignJob} disabled={isAssigning || !selectedSalesmanId || !selectedJobId} className="bg-neutral-900 hover:bg-neutral-800 text-white">
                            Assign Job
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-medium">Salesman Assignments</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading ? (
                            <p className="text-sm text-neutral-500">Loading salesmen and jobs...</p>
                        ) : salesmen.length === 0 ? (
                            <p className="text-sm text-neutral-500">No salesman users found.</p>
                        ) : (
                            salesmen.map((salesman) => {
                                const assignedJobs = assignedJobsBySalesman[salesman._id] ?? [];
                                return (
                                    <div key={salesman._id} className="border border-neutral-200 rounded-lg p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-semibold text-neutral-900">{salesman.name}</h3>
                                                <div className="text-sm text-neutral-500 space-y-1 mt-1">
                                                    <div className="flex items-center gap-2"><Mail className="w-4 h-4" />{salesman.email}</div>
                                                    {salesman.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" />{salesman.phone}</div>}
                                                </div>
                                            </div>
                                            <Badge variant="secondary">{assignedJobs.length} job{assignedJobs.length === 1 ? "" : "s"}</Badge>
                                        </div>
                                        <div className="space-y-2">
                                            {assignedJobs.length === 0 ? (
                                                <p className="text-sm text-neutral-500 bg-neutral-50 rounded-md p-3">No jobs assigned.</p>
                                            ) : assignedJobs.map((job) => (
                                                <div key={job._id} className="bg-neutral-50 rounded-md p-3 border border-neutral-100">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="font-medium text-neutral-900">{job.customerName}</p>
                                                            <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" />{job.address}</p>
                                                            <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1"><Calendar className="w-3.5 h-3.5" />{formatDate(job.scheduledAt)}</p>
                                                        </div>
                                                        <Badge variant={getStatusVariant(job.status)}>{job.status.replaceAll("_", " ")}</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-medium">Submitted Quotations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!quotesLoaded ? (
                            <p className="text-sm text-neutral-500">Loading quotations...</p>
                        ) : submittedQuotes.length === 0 ? (
                            <p className="text-sm text-neutral-500">No submitted quotations yet.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Quote</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {submittedQuotes.map((quote) => (
                                        <TableRow key={quote.id}>
                                            <TableCell className="font-medium">
                                                <div>{quote.id}</div>
                                                <div className="text-xs text-neutral-500">{getQuoteJobId(quote) ?? "No job linked"}</div>
                                            </TableCell>
                                            <TableCell>{quote.client}</TableCell>
                                            <TableCell>AED {quote.total.toLocaleString()}</TableCell>
                                            <TableCell><Badge variant={getStatusVariant(quote.status)}>{quote.status}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedQuote(quote)}>
                                                    <Eye className="w-4 h-4 mr-2" /> View
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

            <Dialog open={Boolean(selectedQuote)} onOpenChange={(open) => !open && setSelectedQuote(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Quotation Details</DialogTitle>
                        <DialogDescription>
                            {selectedQuote?.id} • {selectedQuote?.client} • AED {selectedQuote?.total.toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedQuote && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="bg-neutral-50 p-3 rounded-lg">
                                    <p className="text-neutral-500">Status</p>
                                    <p className="font-medium text-neutral-900">{selectedQuote.status}</p>
                                </div>
                                <div className="bg-neutral-50 p-3 rounded-lg">
                                    <p className="text-neutral-500">Job / Measurement</p>
                                    <p className="font-medium text-neutral-900">{getQuoteJobId(selectedQuote) ?? "Not linked"}</p>
                                </div>
                                <div className="bg-neutral-50 p-3 rounded-lg">
                                    <p className="text-neutral-500">Created</p>
                                    <p className="font-medium text-neutral-900">{formatDate(selectedQuote.date)}</p>
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
                                    {(selectedQuote.items ?? []).map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            <TableCell>AED {item.unitPrice.toLocaleString()}</TableCell>
                                            <TableCell>AED {item.total.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                    {(selectedQuote.items ?? []).length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-neutral-500">No line items stored for this quote.</TableCell>
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
