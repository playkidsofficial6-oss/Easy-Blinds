"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { toast } from "sonner";

import { getJobs, updateJob, Job, JobStatus } from "@/lib/jobs";
import { getUsers, UserRecord } from "@/lib/users";
import { isFitterRole, isSalesmanRole } from "@/lib/auth";

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

export default function StaffRequestsPage() {
  const [requests, setRequests] = useState<Job[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [staffRole, setStaffRole] = useState<"salesman" | "fitter">("salesman");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchRequests() {
    setIsLoading(true);
    try {
      const [jobsRes, usersRes] = await Promise.all([
        getJobs({ limit: 100 }),
        getUsers(),
      ]);
      const pendingRequests = jobsRes.items.filter(
        (job) => job.rescheduleRequest?.status === "pending"
      );
      setRequests(pendingRequests);
      setUsers(usersRes);
    } catch (error) {
      toast.error("Failed to fetch staff requests.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

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
        (typeof job.assignedTo === "object" ? job.assignedTo?._id : job.assignedTo) ||
        "";
    } else {
      initialStaffId =
        job.activeSalesmanId ||
        (typeof job.assignedSalesman === "object" ? job.assignedSalesman?._id : job.assignedSalesman) ||
        (typeof job.assignedTo === "object" ? job.assignedTo?._id : job.assignedTo) ||
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
          updatePayload.assignedTo = selectedUser._id;
          updatePayload.activeSalesmanId = selectedUser._id;
          updatePayload.activeSalesmanName = selectedUser.name;
          updatePayload.assignedFitter = null;
        }
      } else {
        if (selectedUser) {
          updatePayload.assignedFitter = selectedUser._id;
          updatePayload.assignedTo = selectedUser._id;
          updatePayload.assignedSalesman = null;
          updatePayload.activeSalesmanId = null;
          updatePayload.activeSalesmanName = null;
        }
      }

      await updateJob(selectedJob._id, updatePayload);

      toast.success("Job rescheduled & updated successfully.");
      setRequests((prev) => prev.filter((j) => j._id !== selectedJob._id));
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Failed to reschedule job.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-light tracking-tight text-neutral-900 dark:text-white">
          Staff Requests
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Review and approve reschedule requests submitted by the field team.
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Job ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Salesman / Fitter</TableHead>
                <TableHead>Cancel / Request Reason</TableHead>
                <TableHead>Current Date</TableHead>
                <TableHead>Requested At</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-neutral-500">
                    Loading requests...
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-neutral-500">
                    No pending reschedule requests.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((job) => (
                  <TableRow key={job._id}>
                    <TableCell className="font-medium text-xs">
                      {job.jobId || `JOB-${job._id.slice(-6).toUpperCase()}`}
                    </TableCell>
                    <TableCell>{job.customerName}</TableCell>
                    <TableCell>
                      {job.activeSalesmanName ||
                        (typeof job.assignedSalesman === "object" ? job.assignedSalesman?.name : job.assignedSalesman) ||
                        (typeof job.assignedFitter === "object" ? job.assignedFitter?.name : job.assignedFitter) ||
                        "Unknown"}
                    </TableCell>
                    <TableCell>
                      {job.cancelReason ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50 max-w-[200px] truncate" title={job.cancelReason}>
                          {job.cancelReason}
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-xs italic">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {job.scheduledAt ? format(new Date(job.scheduledAt), "MMM d, yyyy HH:mm") : "N/A"}
                    </TableCell>
                    <TableCell className="text-neutral-500 text-xs">
                      {job.rescheduleRequest?.requestedAt
                        ? format(new Date(job.rescheduleRequest.requestedAt), "MMM d, HH:mm")
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-800"
                        onClick={() => handleOpenDialog(job)}
                      >
                        Reschedule
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Reschedule & Reassign Job</DialogTitle>
            <DialogDescription>
              Assign staff, set status, and select a new appointment date/time for {selectedJob?.customerName}&apos;s job.
            </DialogDescription>
          </DialogHeader>

          {selectedJob?.cancelReason && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs space-y-1">
              <span className="font-semibold text-amber-900 dark:text-amber-200">Cancellation / Reschedule Reason:</span>
              <p className="text-amber-800 dark:text-amber-300 font-medium">{selectedJob.cancelReason}</p>
            </div>
          )}

          <form onSubmit={handleReschedule} className="space-y-4 mt-2">
            {/* Staff Role Selector */}
            <div className="space-y-2">
              <Label>Staff Category</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleChange("salesman")}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                    staffRole === "salesman"
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  Salesman
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange("fitter")}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                    staffRole === "fitter"
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  Fitter
                </button>
              </div>
            </div>

            {/* Choose Staff Member */}
            <div className="space-y-2">
              <Label htmlFor="staff">Select {staffRole === "salesman" ? "Salesman" : "Fitter"}</Label>
              <select
                id="staff"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:bg-neutral-900 dark:border-neutral-800 dark:text-white"
                required
              >
                <option value="">-- Choose {staffRole === "salesman" ? "Salesman" : "Fitter"} --</option>
                {(staffRole === "salesman" ? salesmenList : fittersList).map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Choose Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Updated Job Status</Label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:bg-neutral-900 dark:border-neutral-800 dark:text-white"
                required
              >
                {staffRole === "salesman" ? (
                  <>
                    <option value={JobStatus.SalesmanScheduled}>Salesman Scheduled</option>
                    <option value={JobStatus.SalesmanOnTheWay}>Salesman On The Way</option>
                    <option value={JobStatus.SalesmanReached}>Salesman Reached</option>
                    <option value={JobStatus.Measuring}>Measuring</option>
                    <option value={JobStatus.Quoting}>Quoting</option>
                    <option value={JobStatus.Pending}>Pending</option>
                  </>
                ) : (
                  <>
                    <option value={JobStatus.FitterAssigned}>Fitter Assigned</option>
                    <option value={JobStatus.FitterOnTheWay}>Fitter On The Way</option>
                    <option value={JobStatus.FitterReached}>Fitter Reached</option>
                    <option value={JobStatus.Fitting}>Fitting</option>
                    <option value={JobStatus.FitterCancelled}>Fitter Cancelled</option>
                    <option value={JobStatus.ReadyForFitting}>Ready for Fitting</option>
                  </>
                )}
              </select>
            </div>

            {/* New Date */}
            <div className="space-y-2">
              <Label htmlFor="date">New Date</Label>
              <div className="relative">
                <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  id="date"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* New Time */}
            <div className="space-y-2">
              <Label htmlFor="time">New Time</Label>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  id="time"
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-neutral-900 text-white hover:bg-neutral-800" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Approve & Reschedule"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
