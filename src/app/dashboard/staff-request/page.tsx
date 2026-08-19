"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock,
  RefreshCw,
  Search,
  AlertTriangle,
  UserCheck,
  Briefcase,
  FileCheck2,
  MapPin,
  CalendarClock,
  ArrowRight,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { getJobs, updateJob, Job, JobStatus } from "@/lib/jobs";
import { getUsers, UserRecord } from "@/lib/users";
import { isFitterRole, isSalesmanRole } from "@/lib/auth";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { markStaffRequestsSeen } from "@/lib/jobs";
import { triggerStaffRequestsSync } from "@/hooks/use-staff-requests-notification";

function getInitials(name?: string): string {
  if (!name) return "SR";
  const clean = name.trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function StaffRequestsPage() {
  const [requests, setRequests] = useState<Job[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "salesman" | "fitter">("all");

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [staffRole, setStaffRole] = useState<"salesman" | "fitter">("salesman");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [jobsRes, usersRes] = await Promise.all([
        getJobs({ limit: 1000 }),
        getUsers(),
      ]);
      const pendingRequests = jobsRes.items.filter(
        (job) => job.rescheduleRequest?.status === "pending"
      );
      setRequests(pendingRequests);
      setUsers(usersRes);
      // Mark as seen when actively viewing/fetching requests
      markStaffRequestsSeen().catch(() => {});
    } catch (error) {
      if (!silent) {
        toast.error("Failed to fetch staff requests.");
      }
      console.error(error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests(false);
    const interval = setInterval(() => {
      fetchRequests(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleOpenDialog = (job: Job) => {
    setSelectedJob(job);
    if (job.scheduledAt) {
      const dateObj = new Date(job.scheduledAt);
      setNewDate(format(dateObj, "yyyy-MM-dd"));
      setNewTime(format(dateObj, "HH:mm"));
    } else {
      setNewDate("");
      setNewTime("");
    }

    const isFitterContext =
      job.status === JobStatus.FitterCancelled ||
      job.status === JobStatus.ReadyForFitting ||
      job.status === JobStatus.FitterAssigned ||
      job.status === JobStatus.FitterOnTheWay ||
      job.status === JobStatus.Fitting ||
      Boolean(job.assignedFitter);

    const roleMode = isFitterContext ? "fitter" : "salesman";
    setStaffRole(roleMode);

    let initialStaffId = "";
    if (roleMode === "fitter") {
      initialStaffId =
        (typeof job.assignedFitter === "object" ? job.assignedFitter?._id : job.assignedFitter) ||
        "";
    } else {
      initialStaffId =
        (typeof job.assignedSalesman === "object" ? job.assignedSalesman?._id : job.assignedSalesman) ||
        "";
    }
    setSelectedStaffId(initialStaffId);

    let initialStatus = job.status;
    if (job.status === JobStatus.SalesmanCancelled) {
      initialStatus = JobStatus.SalesmanScheduled;
    } else if (job.status === JobStatus.FitterCancelled) {
      initialStatus = JobStatus.FitterAssigned;
    }
    setSelectedStatus(initialStatus);

    setIsDialogOpen(true);
  };

  const handleRoleChange = (role: "salesman" | "fitter") => {
    setStaffRole(role);
    setSelectedStaffId("");
    if (role === "salesman") {
      setSelectedStatus(JobStatus.SalesmanScheduled);
    } else {
      setSelectedStatus(JobStatus.FitterAssigned);
    }
  };

  const salesmenList = users.filter((u) => isSalesmanRole(u.role));
  const fittersList = users.filter((u) => isFitterRole(u.role));

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    if (!newDate || !newTime) {
      toast.error("Please provide both a valid date and time.");
      return;
    }

    const scheduledAt = new Date(`${newDate}T${newTime}:00`);

    setIsSubmitting(true);
    try {
      const selectedUser = users.find((u) => u._id === selectedStaffId);

      const updatePayload: Record<string, any> = {
        scheduledAt: scheduledAt.toISOString(),
        status: selectedStatus || (staffRole === "fitter" ? JobStatus.FitterAssigned : JobStatus.SalesmanScheduled),
        rescheduleRequest: {
          status: "resolved",
          requestedAt: selectedJob.rescheduleRequest?.requestedAt || new Date().toISOString(),
        },
      };

      if (staffRole === "salesman") {
        if (selectedUser) {
          updatePayload.assignedSalesman = selectedUser._id;
        }
      } else {
        if (selectedUser) {
          updatePayload.assignedFitter = selectedUser._id;
        }
      }

      await updateJob(selectedJob._id, updatePayload);

      toast.success("Job rescheduled & updated successfully.");
      setRequests((prev) => prev.filter((j) => j._id !== selectedJob._id));
      triggerStaffRequestsSync("refresh");
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Failed to reschedule job.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((job) => {
    const isFitter =
      job.status === JobStatus.FitterCancelled ||
      job.status === JobStatus.ReadyForFitting ||
      job.status === JobStatus.FitterAssigned ||
      Boolean(job.assignedFitter);

    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "salesman" && !isFitter) ||
      (selectedCategory === "fitter" && isFitter);

    const staffName =
      (typeof job.assignedSalesman === "object" ? job.assignedSalesman?.name : job.assignedSalesman) ||
      (typeof job.assignedFitter === "object" ? job.assignedFitter?.name : job.assignedFitter) ||
      "";

    const jobIdDisplay = job.jobId || `JOB-${job._id.slice(-6).toUpperCase()}`;

    const matchesSearch =
      jobIdDisplay.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.cancelReason && job.cancelReason.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const salesmanRequestsCount = requests.filter(
    (j) => !Boolean(j.assignedFitter) && j.status !== JobStatus.FitterCancelled
  ).length;

  const fitterRequestsCount = requests.length - salesmanRequestsCount;

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">
            <CalendarClock className="w-4 h-4 text-amber-500" />
            <span>Field Reschedule Queue</span>
          </div>
          <h1 className="text-3xl font-light tracking-tight text-slate-900">
            Staff <span className="font-medium">Reschedule Requests</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review, reassign, and approve job appointment reschedule requests submitted by field technicians.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchRequests()}
          disabled={isLoading}
          className="h-10 text-xs font-semibold text-slate-700 bg-white border-slate-200 hover:bg-slate-50 shadow-sm self-start md:self-auto"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 mr-2", isLoading && "animate-spin")} />
          Refresh Requests
        </Button>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{requests.length}</div>
            <div className="text-xs font-medium text-slate-500">Pending Reschedule Requests</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <UserRound className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-900">{salesmanRequestsCount}</div>
            <div className="text-xs font-medium text-slate-500">Salesman Requests</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-900">{fitterRequestsCount}</div>
            <div className="text-xs font-medium text-slate-500">Fitter Requests</div>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        {/* Toolbar & Filter Options */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/70 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <Tabs value={selectedCategory} onValueChange={(val) => setSelectedCategory(val as any)} className="w-full sm:w-auto">
            <TabsList className="bg-slate-200/60 h-10 w-full sm:w-auto p-1">
              <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 text-xs font-semibold">
                All Requests ({requests.length})
              </TabsTrigger>
              <TabsTrigger value="salesman" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 text-xs font-semibold">
                Salesmen
              </TabsTrigger>
              <TabsTrigger value="fitter" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 text-xs font-semibold">
                Fitters
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by Job ID, client, staff or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-white border-slate-200 shadow-sm"
            />
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100/60 hover:bg-slate-100/60 border-b border-slate-200/80">
                <TableHead className="text-xs font-bold text-slate-700 py-3.5">Job ID & Client</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 py-3.5">Assigned Staff</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 py-3.5">Reschedule Reason</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 py-3.5">Current Schedule</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 py-3.5">Requested At</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 py-3.5 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-slate-400 text-xs uppercase tracking-widest font-semibold">
                    Loading staff requests...
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-slate-500 text-sm">
                    No pending reschedule requests match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((job) => {
                  const staffName =
                    (typeof job.assignedSalesman === "object" ? job.assignedSalesman?.name : job.assignedSalesman) ||
                    (typeof job.assignedFitter === "object" ? job.assignedFitter?.name : job.assignedFitter) ||
                    "Unassigned";

                  const isFitter = Boolean(job.assignedFitter) || job.status === JobStatus.FitterCancelled;
                  const displayJobId = job.jobId || `JOB-${job._id.slice(-6).toUpperCase()}`;

                  return (
                    <TableRow key={job._id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                      {/* Job ID & Client */}
                      <TableCell className="py-3.5">
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-slate-100 text-slate-800 border border-slate-200">
                            {displayJobId}
                          </span>
                          <div className="font-semibold text-slate-900 text-sm">{job.customerName}</div>
                          {job.address && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate max-w-60">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{job.address}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Staff Member */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 border border-slate-200 shrink-0">
                            <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-bold">
                              {getInitials(staffName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-slate-800 text-xs sm:text-sm">{staffName}</div>
                            <span className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border mt-0.5",
                              isFitter ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"
                            )}>
                              {isFitter ? "Fitter" : "Salesman"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Reason */}
                      <TableCell className="py-3.5">
                        {job.cancelReason ? (
                          <div className="inline-flex items-start gap-1.5 p-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 max-w-65">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span className="text-xs font-medium leading-tight line-clamp-2" title={job.cancelReason}>
                              {job.cancelReason}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No reason specified</span>
                        )}
                      </TableCell>

                      {/* Current Schedule */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{job.scheduledAt ? format(new Date(job.scheduledAt), "MMM d, yyyy HH:mm") : "Unscheduled"}</span>
                        </div>
                      </TableCell>

                      {/* Requested At */}
                      <TableCell className="py-3.5 text-xs text-slate-500 font-medium">
                        {job.rescheduleRequest?.requestedAt
                          ? format(new Date(job.rescheduleRequest.requestedAt), "MMM d, HH:mm")
                          : "N/A"}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="py-3.5 text-right">
                        <Button
                          size="sm"
                          className="h-8 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                          onClick={() => handleOpenDialog(job)}
                        >
                          <CalendarClock className="w-3.5 h-3.5 mr-1.5" />
                          Reschedule
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Reschedule Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-120">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Reschedule & Reassign Job</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Assign a staff member, update job status, and schedule a new appointment date/time for <strong className="text-slate-800">{selectedJob?.customerName}</strong>.
            </DialogDescription>
          </DialogHeader>

          {selectedJob?.cancelReason && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Submitted Reschedule Reason:</span>
              </div>
              <p className="text-amber-800 font-medium pl-5">{selectedJob.cancelReason}</p>
            </div>
          )}

          <form onSubmit={handleReschedule} className="space-y-4 mt-2">
            {/* Category Toggle */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Staff Category</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleChange("salesman")}
                  className={cn(
                    "py-2 px-3 text-xs font-bold rounded-lg border transition-all text-center",
                    staffRole === "salesman"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  Salesman
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange("fitter")}
                  className={cn(
                    "py-2 px-3 text-xs font-bold rounded-lg border transition-all text-center",
                    staffRole === "fitter"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  Fitter
                </button>
              </div>
            </div>

            {/* Select Staff */}
            <div className="space-y-2">
              <Label htmlFor="staff" className="text-xs font-semibold text-slate-700">
                Select {staffRole === "salesman" ? "Salesman" : "Fitter"}
              </Label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger id="staff" className="w-full text-xs h-9 bg-white border-slate-200">
                  <SelectValue placeholder={`-- Choose ${staffRole === "salesman" ? "Salesman" : "Fitter"} --`} />
                </SelectTrigger>
                <SelectContent>
                  {(staffRole === "salesman" ? salesmenList : fittersList).map((u) => (
                    <SelectItem key={u._id} value={u._id} className="text-xs">
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs font-semibold text-slate-700">Updated Job Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status" className="w-full text-xs h-9 bg-white border-slate-200">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  {staffRole === "salesman" ? (
                    <>
                      <SelectItem value={JobStatus.SalesmanScheduled} className="text-xs">Salesman Scheduled</SelectItem>
                      <SelectItem value={JobStatus.SalesmanOnTheWay} className="text-xs">Salesman On The Way</SelectItem>
                      <SelectItem value={JobStatus.SalesmanReached} className="text-xs">Salesman Reached</SelectItem>
                      <SelectItem value={JobStatus.Measuring} className="text-xs">Measuring</SelectItem>
                      <SelectItem value={JobStatus.Quoting} className="text-xs">Quoting</SelectItem>
                      <SelectItem value={JobStatus.Pending} className="text-xs">Pending</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value={JobStatus.FitterAssigned} className="text-xs">Fitter Assigned</SelectItem>
                      <SelectItem value={JobStatus.FitterOnTheWay} className="text-xs">Fitter On The Way</SelectItem>
                      <SelectItem value={JobStatus.FitterReached} className="text-xs">Fitter Reached</SelectItem>
                      <SelectItem value={JobStatus.Fitting} className="text-xs">Fitting</SelectItem>
                      <SelectItem value={JobStatus.FitterCancelled} className="text-xs">Fitter Cancelled</SelectItem>
                      <SelectItem value={JobStatus.ReadyForFitting} className="text-xs">Ready for Fitting</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Date & Time Input Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-xs font-semibold text-slate-700">New Date</Label>
                <div className="relative">
                  <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="date"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="pl-9 text-xs h-9 bg-white border-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="text-xs font-semibold text-slate-700">New Time</Label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="time"
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="pl-9 text-xs h-9 bg-white border-slate-200"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Approve & Reschedule"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
