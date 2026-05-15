"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, isSameDay, parseISO } from "date-fns";
import { AlertCircle, CalendarDays, CheckCircle2, Clock, PlusCircle, RefreshCcw, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getJobErrorMessage, getJobs, updateJob, type Job, type JobStatus } from "@/lib/jobs";

const STATUS_LABELS: Record<JobStatus, string> = {
  pending: "Pending",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

function formatDate(value?: string) {
  if (!value) {
    return "Not scheduled";
  }

  return format(parseISO(value), "dd MMM yyyy, h:mm a");
}

function isForSelectedDate(job: Job, selectedDate: Date) {
  if (!job.scheduledAt) {
    return false;
  }

  return isSameDay(parseISO(job.scheduledAt), selectedDate);
}

function JobRow({ job, onStatusChange }: { job: Job; onStatusChange: (job: Job, status: JobStatus) => Promise<void> }) {
  const isHighPriority = job.priority === "high";

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-900">{job.customerName}</h3>
              <Badge className={cn("capitalize", isHighPriority ? "bg-red-600 hover:bg-red-600" : "bg-amber-600 hover:bg-amber-600")}>{PRIORITY_LABELS[job.priority]} Priority</Badge>
              <Badge variant="outline">{STATUS_LABELS[job.status]}</Badge>
            </div>
            <p className="text-sm text-slate-600">{job.productType} · Quantity {job.quantity}</p>
            <p className="text-sm text-slate-500">{job.address}</p>
          </div>

          <div className="text-sm text-slate-500 lg:text-right space-y-1">
            <p>{job.customerPhone}</p>
            <p>{job.customerEmail}</p>
            <p className="font-medium text-slate-700">{formatDate(job.scheduledAt)}</p>
          </div>
        </div>

        {job.notes && <p className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">{job.notes}</p>}

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {job.status !== "scheduled" && job.status !== "completed" && job.status !== "cancelled" && (
            <Button size="sm" variant="outline" onClick={() => onStatusChange(job, "scheduled")}>
              Mark Scheduled
            </Button>
          )}
          {job.status !== "in_progress" && job.status !== "completed" && job.status !== "cancelled" && (
            <Button size="sm" variant="outline" onClick={() => onStatusChange(job, "in_progress")}>
              Start Job
            </Button>
          )}
          {job.status !== "completed" && job.status !== "cancelled" && (
            <Button size="sm" onClick={() => onStatusChange(job, "completed")}>
              Complete
            </Button>
          )}
          {job.status !== "cancelled" && job.status !== "completed" && (
            <Button size="sm" variant="destructive" onClick={() => onStatusChange(job, "cancelled")}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SmartAssignmentsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getJobs({ limit: 100, search: search.trim() || undefined });
      setJobs(response.items);
    } catch (error) {
      toast.error(getJobErrorMessage(error, "Unable to load jobs from MongoDB."));
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const selectedDateObject = useMemo(() => parseISO(`${selectedDate}T00:00:00`), [selectedDate]);

  const pendingJobs = useMemo(() => jobs.filter((job) => job.status === "pending"), [jobs]);
  const scheduledJobs = useMemo(
    () => jobs.filter((job) => ["scheduled", "in_progress"].includes(job.status) && isForSelectedDate(job, selectedDateObject)),
    [jobs, selectedDateObject],
  );
  const completedJobs = useMemo(() => jobs.filter((job) => job.status === "completed"), [jobs]);

  const handleStatusChange = async (job: Job, status: JobStatus) => {
    try {
      const updated = await updateJob(job._id, { status });
      setJobs((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      toast.success(`Job marked as ${STATUS_LABELS[status]}.`);
    } catch (error) {
      toast.error(getJobErrorMessage(error, "Unable to update job status."));
    }
  };

  return (
    <div className="space-y-8 p-8 bg-slate-50 min-h-[calc(100vh-6rem)]">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-slate-400 font-bold">
            <div className="w-8 h-px bg-amber-600" />
            <span>MongoDB Job Operations</span>
          </div>
          <h1 className="text-4xl font-light text-slate-900">
            Sales <span className="font-medium">Assignments</span>
          </h1>
          <p className="max-w-2xl text-sm text-slate-500">
            This page now reads jobs directly from the backend jobs API. New jobs created by the sales manager are stored in MongoDB and appear here after creation.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={loadJobs} disabled={isLoading}>
            <RefreshCcw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Link href="/sales-manager/jobs/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Job
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Pending</p>
              <p className="text-3xl font-light text-slate-900">{pendingJobs.length}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Scheduled Today</p>
              <p className="text-3xl font-light text-slate-900">{scheduledJobs.length}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Completed</p>
              <p className="text-3xl font-light text-slate-900">{completedJobs.length}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer, email, address, or product" className="pl-9" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <CalendarDays className="h-4 w-4" />
          <Input value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} type="date" className="w-auto" />
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingJobs.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Date ({scheduledJobs.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedJobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3">
          {isLoading && <p className="py-10 text-center text-sm text-slate-400">Loading jobs from MongoDB...</p>}
          {!isLoading && pendingJobs.map((job) => <JobRow key={job._id} job={job} onStatusChange={handleStatusChange} />)}
          {!isLoading && pendingJobs.length === 0 && <p className="py-10 text-center text-sm text-slate-400">No pending MongoDB jobs found.</p>}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-3">
          {isLoading && <p className="py-10 text-center text-sm text-slate-400">Loading jobs from MongoDB...</p>}
          {!isLoading && scheduledJobs.map((job) => <JobRow key={job._id} job={job} onStatusChange={handleStatusChange} />)}
          {!isLoading && scheduledJobs.length === 0 && <p className="py-10 text-center text-sm text-slate-400">No scheduled MongoDB jobs for the selected date.</p>}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3">
          {isLoading && <p className="py-10 text-center text-sm text-slate-400">Loading jobs from MongoDB...</p>}
          {!isLoading && completedJobs.map((job) => <JobRow key={job._id} job={job} onStatusChange={handleStatusChange} />)}
          {!isLoading && completedJobs.length === 0 && <p className="py-10 text-center text-sm text-slate-400">No completed MongoDB jobs found.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
