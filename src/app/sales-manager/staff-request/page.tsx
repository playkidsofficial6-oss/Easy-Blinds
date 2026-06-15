"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { getJobs, updateJob, Job } from "@/lib/jobs";

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
  const [isLoading, setIsLoading] = useState(true);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchRequests() {
    setIsLoading(true);
    try {
      // Fetch jobs and filter for pending reschedule requests
      const response = await getJobs({ limit: 100 });
      const pendingRequests = response.items.filter(
        (job) => job.rescheduleRequest?.status === "pending"
      );
      setRequests(pendingRequests);
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
    setIsDialogOpen(true);
  };

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
      await updateJob(selectedJob._id, {
        scheduledAt: scheduledAt.toISOString(),
        rescheduleRequest: {
          status: "resolved",
          requestedAt: selectedJob.rescheduleRequest?.requestedAt || new Date().toISOString(),
        },
      });

      toast.success("Job rescheduled successfully.");
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
                <TableHead>Salesman</TableHead>
                <TableHead>Current Date</TableHead>
                <TableHead>Requested At</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-neutral-500">
                    Loading requests...
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-neutral-500">
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
                    <TableCell>{job.activeSalesmanName || job.assignedSalesman || "Unknown"}</TableCell>
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reschedule Job</DialogTitle>
            <DialogDescription>
              Assign a new date and time for {selectedJob?.customerName}&apos;s job.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReschedule} className="space-y-4 mt-4">
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
