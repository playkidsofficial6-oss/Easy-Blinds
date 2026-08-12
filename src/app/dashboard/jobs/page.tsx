"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  Briefcase,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Mail,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Camera,
  DollarSign,
  UserCheck,
  Building,
  FileText,
  X,
  Check,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  Star,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getJobs,
  updateJob,
  deleteJob,
  Job,
  JobStatus,
  JobPriority,
  JobStats,
  getJobDisplayId,
  getJobErrorMessage,
  UpdateJobInput,
} from "@/lib/jobs";
import { getUsers, UserRecord } from "@/lib/users";
import { isSalesmanRole, isFieldRole, isFitterRole } from "@/lib/auth";
import { JobDetailSheet } from "@/components/tracking/JobDetailSheet";
import { cn } from "@/lib/utils";

export default function AdminJobsPage() {
  const router = useRouter();

  // Main data states
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [totalJobsCount, setTotalJobsCount] = useState<number>(0);
  const [serverStats, setServerStats] = useState<JobStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter & Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [reviewedFilter, setReviewedFilter] = useState<string>("ALL");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Modal states
  const [detailJobId, setDetailJobId] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Photo Lightbox modal state
  const [activeLightboxImages, setActiveLightboxImages] = useState<{ urls: string[]; index: number } | null>(null);

  // Form states for Editing Job
  const [editForm, setEditForm] = useState<{
    firstName: string;
    lastName: string;
    customerEmail: string;
    customerPhone: string;
    address: string;
    status: JobStatus;
    priority: JobPriority;
    isReviewed: boolean;
    reviewRating: number;
    reviewMessage: string;
    assignedSalesman: string;
    assignedFitter: string;
    projectValue: string;
    notes: string;
  }>({
    firstName: "",
    lastName: "",
    customerEmail: "",
    customerPhone: "",
    address: "",
    status: JobStatus.Pending,
    priority: JobPriority.Medium,
    isReviewed: false,
    reviewRating: 5,
    reviewMessage: "",
    assignedSalesman: "",
    assignedFitter: "",
    projectValue: "",
    notes: "",
  });

  // Load data function
  const loadData = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [jobsData, allJobsData, usersData] = await Promise.allSettled([
        getJobs({ page, limit }),
        getJobs({ all: true }),
        getUsers(),
      ]);

      if (jobsData.status === "fulfilled") {
        setJobs(jobsData.value.items || []);
        setTotalJobsCount(jobsData.value.meta?.total || jobsData.value.items?.length || 0);
        if (jobsData.value.stats) {
          setServerStats(jobsData.value.stats);
        }
      } else {
        toast.error("Failed to load jobs list.");
      }

      if (allJobsData.status === "fulfilled") {
        setAllJobs(allJobsData.value.items || []);
        if (allJobsData.value.stats) {
          setServerStats(allJobsData.value.stats);
        }
        if (!jobsData.status || jobsData.status === "rejected") {
          setTotalJobsCount(allJobsData.value.items?.length || 0);
        }
      }

      if (usersData.status === "fulfilled") {
        setAllUsers(usersData.value);
      }
    } catch (err) {
      toast.error(getJobErrorMessage(err, "Error loading admin jobs."));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived lists for dropdowns
  const salesmenList = useMemo(() => {
    return allUsers.filter(
      (u) => isSalesmanRole(u.role) || isFieldRole(u.role) || u.role === "Sales Manager" || u.role === "Owner"
    );
  }, [allUsers]);

  const fittersList = useMemo(() => {
    return allUsers.filter((u) => isFitterRole(u.role));
  }, [allUsers]);

  // Target list for filtering (prefers full database list if loaded)
  const targetJobs = useMemo(() => {
    return allJobs.length > 0 ? allJobs : jobs;
  }, [allJobs, jobs]);

  // Client-side search and filtering across all jobs
  const filteredJobs = useMemo(() => {
    return targetJobs.filter((job) => {
      // Status filter
      if (statusFilter !== "ALL" && job.status !== statusFilter) {
        return false;
      }
      // Priority filter
      if (priorityFilter !== "ALL" && job.priority !== priorityFilter) {
        return false;
      }
      // Reviewed filter
      if (reviewedFilter === "REVIEWED" && !job.isReviewed) {
        return false;
      }
      if (reviewedFilter === "PENDING" && job.isReviewed) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const displayId = getJobDisplayId(job).toLowerCase();
        const fullName = `${job.firstName || ""} ${job.lastName || ""}`.toLowerCase();
        const email = (job.customerEmail || "").toLowerCase();
        const phone = (job.customerPhone || "").toLowerCase();
        const address = (job.address || "").toLowerCase();
        const notes = (job.notes || "").toLowerCase();
        const reviewMsg = (job.reviewMessage || "").toLowerCase();

        return (
          displayId.includes(q) ||
          fullName.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          address.includes(q) ||
          notes.includes(q) ||
          reviewMsg.includes(q)
        );
      }
      return true;
    });
  }, [targetJobs, statusFilter, priorityFilter, reviewedFilter, searchQuery]);

  // Paginated slice for display in table
  const paginatedJobs = useMemo(() => {
    if (allJobs.length > 0) {
      const start = (page - 1) * limit;
      return filteredJobs.slice(start, start + limit);
    }
    return filteredJobs;
  }, [allJobs, filteredJobs, page, limit]);

  // Summary Metrics calculations computed across ALL jobs in system
  const metrics = useMemo(() => {
    if (targetJobs.length > 0) {
      const total = targetJobs.length;
      const completed = targetJobs.filter((j) => j.status === JobStatus.Completed).length;
      const reviewed = targetJobs.filter((j) => Boolean(j.isReviewed)).length;
      const pending = targetJobs.filter((j) => !j.isReviewed).length;
      return { total, reviewed, completed, pending };
    }

    if (serverStats) {
      return {
        total: serverStats.total,
        reviewed: serverStats.reviewed,
        completed: serverStats.completed,
        pending: serverStats.pendingReview,
      };
    }

    return { total: totalJobsCount, reviewed: 0, completed: 0, pending: totalJobsCount };
  }, [targetJobs, serverStats, totalJobsCount]);

  // Open Edit Modal
  const handleOpenEdit = (job: Job) => {
    setEditingJob(job);

    const getRefId = (ref: any): string => {
      if (!ref) return "";
      if (typeof ref === "object" && ref._id) return String(ref._id);
      if (typeof ref === "string") return ref;
      return "";
    };

    setEditForm({
      firstName: job.firstName || "",
      lastName: job.lastName || "",
      customerEmail: job.customerEmail || "",
      customerPhone: job.customerPhone || "",
      address: job.address || "",
      status: job.status || JobStatus.Pending,
      priority: job.priority || JobPriority.Medium,
      isReviewed: Boolean(job.isReviewed),
      reviewRating: job.reviewRating || 5,
      reviewMessage: job.reviewMessage || "",
      assignedSalesman: getRefId(job.assignedSalesman),
      assignedFitter: getRefId(job.assignedFitter),
      projectValue: job.projectValue !== undefined ? String(job.projectValue) : "",
      notes: job.notes || "",
    });
  };

  // Submit Edit Job
  const handleSaveEdit = async () => {
    if (!editingJob) return;

    if (!editForm.firstName.trim()) {
      toast.error("First Name is required.");
      return;
    }
    if (!editForm.address.trim()) {
      toast.error("Address is required.");
      return;
    }

    setIsSavingEdit(true);

    try {
      const payload: UpdateJobInput = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        customerEmail: editForm.customerEmail.trim() || undefined,
        customerPhone: editForm.customerPhone.trim(),
        address: editForm.address.trim(),
        status: editForm.status,
        priority: editForm.priority,
        isReviewed: editForm.isReviewed,
        reviewRating: editForm.isReviewed ? editForm.reviewRating : undefined,
        reviewMessage: editForm.isReviewed && editForm.reviewMessage ? editForm.reviewMessage.trim() : undefined,
        assignedSalesman: editForm.assignedSalesman || undefined,
        assignedFitter: editForm.assignedFitter || undefined,
        projectValue: editForm.projectValue ? Number(editForm.projectValue) : undefined,
        notes: editForm.notes.trim() || undefined,
      };

      await updateJob(editingJob._id, payload);
      toast.success(`Job ${getJobDisplayId(editingJob)} updated successfully.`);
      setEditingJob(null);
      await loadData(true);
    } catch (err) {
      toast.error(getJobErrorMessage(err, "Failed to update job."));
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Job
  const handleConfirmDelete = async () => {
    if (!deletingJob) return;
    setIsDeleting(true);

    try {
      await deleteJob(deletingJob._id);
      toast.success(`Job ${getJobDisplayId(deletingJob)} deleted successfully.`);
      setDeletingJob(null);
      await loadData(true);
    } catch (err) {
      toast.error(getJobErrorMessage(err, "Failed to delete job."));
    } finally {
      setIsDeleting(false);
    }
  };

  // Helpers for Status Badges
  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case JobStatus.Completed:
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
          </Badge>
        );
      case JobStatus.Cancelled:
      case JobStatus.SalesmanCancelled:
      case JobStatus.FitterCancelled:
      case JobStatus.Dropped:
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-medium">
            <XCircle className="w-3 h-3 mr-1" /> {status}
          </Badge>
        );
      case JobStatus.Pending:
        return (
          <Badge className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 font-medium">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
      case JobStatus.Fitting:
      case JobStatus.Measuring:
      case JobStatus.TakingPhotos:
      case JobStatus.Quoting:
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-medium animate-pulse">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> {status}
          </Badge>
        );
      case JobStatus.SalesmanOnTheWay:
      case JobStatus.FitterOnTheWay:
      case JobStatus.SalesmanScheduled:
      case JobStatus.FitterAssigned:
      case JobStatus.ReadyForFitting:
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium">
            <Briefcase className="w-3 h-3 mr-1" /> {status}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-medium">
            {status}
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: JobPriority) => {
    switch (priority) {
      case JobPriority.High:
        return (
          <span className="inline-flex items-center text-xs font-semibold text-rose-600 dark:text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-ping" />
            High
          </span>
        );
      case JobPriority.Medium:
        return (
          <span className="inline-flex items-center text-xs font-medium text-amber-600 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
            Medium
          </span>
        );
      case JobPriority.Low:
        return (
          <span className="inline-flex items-center text-xs font-medium text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
            Low
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{priority}</span>;
    }
  };

  const renderStars = (rating = 5) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "w-3.5 h-3.5",
              star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700"
            )}
          />
        ))}
      </div>
    );
  };

  const getUserNameById = (userRef: any): string => {
    if (!userRef) return "Unassigned";
    if (typeof userRef === "object" && userRef.name) return userRef.name;
    if (typeof userRef === "string") {
      const match = allUsers.find((u) => u._id === userRef);
      if (match) return match.name;
    }
    return "Assigned";
  };

  const totalPages = Math.ceil(filteredJobs.length / limit) || 1;

  return (
    <div className="p-4 md:p-6 w-full space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Admin Jobs Management
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Overview, assignment, tracking, and Google Customer Review management.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={isRefreshing || isLoading}
            className="h-10 bg-white dark:bg-slate-900"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", (isRefreshing || isLoading) && "animate-spin")} />
            Refresh
          </Button>

          <Link href="/dashboard/jobs/new">
            <Button size="sm" className="h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              Create New Job
            </Button>
          </Link>
        </div>
      </div>

      {/* ── METRIC STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Jobs
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {metrics.total}
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Reviewed (Google)
              </p>
              <h3 className="text-2xl font-bold text-amber-500 mt-1">
                {metrics.reviewed}
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pending Review
              </p>
              <h3 className="text-2xl font-bold text-slate-600 dark:text-slate-300 mt-1">
                {metrics.pending}
              </h3>
            </div>
            <div className="p-3 bg-slate-500/10 text-slate-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Completed Jobs
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {metrics.completed}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── SEARCH & FILTER BAR ── */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <Input
              placeholder="Search by Job ID, customer name, phone, review message, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Google Review Filter */}
            <Select value={reviewedFilter} onValueChange={setReviewedFilter}>
              <SelectTrigger className="w-42.5 bg-white dark:bg-slate-900">
                <Star className="w-3.5 h-3.5 mr-2 text-amber-500 fill-amber-500" />
                <SelectValue placeholder="Google Review" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Reviews</SelectItem>
                <SelectItem value="REVIEWED">Reviewed Only</SelectItem>
                <SelectItem value="PENDING">Pending Review</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-42.5 bg-white dark:bg-slate-900">
                <Filter className="w-3.5 h-3.5 mr-2 text-slate-500" />
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value={JobStatus.Pending}>Pending</SelectItem>
                <SelectItem value={JobStatus.SalesmanScheduled}>Salesman Scheduled</SelectItem>
                <SelectItem value={JobStatus.SalesmanOnTheWay}>Salesman On The Way</SelectItem>
                <SelectItem value={JobStatus.Measuring}>Measuring</SelectItem>
                <SelectItem value={JobStatus.ReadyForFitting}>Ready for Fitting</SelectItem>
                <SelectItem value={JobStatus.FitterAssigned}>Fitter Assigned</SelectItem>
                <SelectItem value={JobStatus.Fitting}>Fitting</SelectItem>
                <SelectItem value={JobStatus.Completed}>Completed</SelectItem>
                <SelectItem value={JobStatus.Cancelled}>Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-37.5 bg-white dark:bg-slate-900">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priorities</SelectItem>
                <SelectItem value={JobPriority.High}>High</SelectItem>
                <SelectItem value={JobPriority.Medium}>Medium</SelectItem>
                <SelectItem value={JobPriority.Low}>Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset button */}
            {(statusFilter !== "ALL" || priorityFilter !== "ALL" || reviewedFilter !== "ALL" || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter("ALL");
                  setPriorityFilter("ALL");
                  setReviewedFilter("ALL");
                  setSearchQuery("");
                }}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── JOBS DATA TABLE ── */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-xs">
                <th className="py-3.5 px-4">Job ID & Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Address</th>
                <th className="py-3.5 px-4">Assignments</th>
                <th className="py-3.5 px-4">Status & Priority</th>
                <th className="py-3.5 px-4">Google Review</th>
                <th className="py-3.5 px-4">Photos</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading jobs...
                  </td>
                </tr>
              ) : paginatedJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No jobs found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedJobs.map((job) => {
                  const displayId = getJobDisplayId(job);
                  const photosCount = (job.photos?.length || 0) + (job.fittingPhotos?.length || 0);
                  const allImages = [...(job.photos || []), ...(job.fittingPhotos || [])];

                  return (
                    <tr
                      key={job._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors group"
                    >
                      {/* Job ID & Date */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-mono font-semibold text-slate-900 dark:text-white text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit border border-slate-200 dark:border-slate-700">
                          {displayId}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {job.scheduledAt
                            ? format(parseISO(job.scheduledAt), "MMM d, yyyy • p")
                            : job.createdAt
                              ? format(parseISO(job.createdAt), "MMM d, yyyy")
                              : "N/A"}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {job.firstName} {job.lastName}
                        </div>
                        <div className="text-xs text-slate-500 space-y-0.5 mt-0.5">
                          {job.customerPhone && (
                            <a
                              href={`tel:${job.customerPhone}`}
                              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                            >
                              <Phone className="w-3 h-3" /> {job.customerPhone}
                            </a>
                          )}
                          {job.customerEmail && (
                            <span className="flex items-center gap-1 truncate max-w-45">
                              <Mail className="w-3 h-3" /> {job.customerEmail}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Address */}
                      <td className="py-4 px-4 align-top">
                        <div className="text-xs text-slate-700 dark:text-slate-300 max-w-55 line-clamp-2 leading-relaxed">
                          <MapPin className="w-3 h-3 inline mr-1 text-slate-400 shrink-0" />
                          {job.address}
                        </div>
                        {job.propertyType && (
                          <Badge variant="outline" className="text-[10px] mt-1 text-slate-500">
                            {job.propertyType}
                          </Badge>
                        )}
                      </td>

                      {/* Assignments */}
                      <td className="py-4 px-4 align-top space-y-1.5">
                        <div className="text-xs flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 w-12">Sales:</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {getUserNameById(job.assignedSalesman)}
                          </span>
                        </div>
                        <div className="text-xs flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 w-12">Fitter:</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {getUserNameById(job.assignedFitter)}
                          </span>
                        </div>
                      </td>

                      {/* Status & Priority */}
                      <td className="py-4 px-4 align-top space-y-1.5">
                        <div>{getStatusBadge(job.status)}</div>
                        <div>{getPriorityBadge(job.priority)}</div>
                      </td>

                      {/* Customer Google Review Column */}
                      <td className="py-4 px-4 align-top">
                        {job.isReviewed ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              {renderStars(job.reviewRating || 5)}
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {job.reviewRating || 5}.0
                              </span>
                            </div>
                            {job.reviewMessage ? (
                              <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-2 max-w-50">
                                &ldquo;{job.reviewMessage}&rdquo;
                              </p>
                            ) : (
                              <span className="text-[11px] text-emerald-600 font-medium">Reviewed on Google</span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenEdit(job)}
                            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-amber-600 transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>No review yet</span>
                          </button>
                        )}
                      </td>

                      {/* Photos */}
                      <td className="py-4 px-4 align-top">
                        {photosCount > 0 ? (
                          <button
                            onClick={() => setActiveLightboxImages({ urls: allImages, index: 0 })}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors border border-blue-200 dark:border-blue-800"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>{photosCount} photos</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">No photos</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View Job Details"
                            onClick={() => setDetailJobId(job._id)}
                            className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit Job & Review"
                            onClick={() => handleOpenEdit(job)}
                            className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete Job"
                            onClick={() => setDeletingJob(job)}
                            className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION CONTROLS ── */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-900 dark:text-white">{paginatedJobs.length}</span> of{" "}
            <span className="font-semibold text-slate-900 dark:text-white">{filteredJobs.length}</span> total entries
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Per page:</span>
              <Select
                value={String(limit)}
                onValueChange={(val) => {
                  setLimit(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-17.5 bg-white dark:bg-slate-900 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs px-2 font-medium">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* ── JOB DETAIL SHEET ── */}
      {detailJobId && (
        <JobDetailSheet jobId={detailJobId} onClose={() => setDetailJobId(null)} />
      )}

      {/* ── EDIT JOB & GOOGLE REVIEW DIALOG ── */}
      <Dialog open={!!editingJob} onOpenChange={(open) => !open && setEditingJob(null)}>
        <DialogContent className="sm:max-w-4xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Edit2 className="w-5 h-5 text-amber-500" />
              Edit Job: {editingJob ? getJobDisplayId(editingJob) : ""}
            </DialogTitle>
            <DialogDescription>
              Update customer details, status, priority, staff assignments, and Google Customer Review feedback.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-fn">First Name *</Label>
              <Input
                id="edit-fn"
                value={editForm.firstName}
                onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-ln">Last Name</Label>
              <Input
                id="edit-ln"
                value={editForm.lastName}
                onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">Phone Number *</Label>
              <Input
                id="edit-phone"
                value={editForm.customerPhone}
                onChange={(e) => setEditForm((prev) => ({ ...prev, customerPhone: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.customerEmail}
                onChange={(e) => setEditForm((prev) => ({ ...prev, customerEmail: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="edit-addr">Address *</Label>
              <Input
                id="edit-addr"
                value={editForm.address}
                onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(val) => setEditForm((prev) => ({ ...prev, status: val as JobStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(JobStatus).map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={editForm.priority}
                onValueChange={(val) => setEditForm((prev) => ({ ...prev, priority: val as JobPriority }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={JobPriority.High}>High</SelectItem>
                  <SelectItem value={JobPriority.Medium}>Medium</SelectItem>
                  <SelectItem value={JobPriority.Low}>Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ── GOOGLE CUSTOMER REVIEW SECTION ── */}
            <div className="md:col-span-2 p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="edit-reviewed" className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 cursor-pointer">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Customer Google Review
                  </Label>
                  <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                    Check if the customer has completed a Google review and record their rating & message.
                  </p>
                </div>
                <Checkbox
                  id="edit-reviewed"
                  checked={editForm.isReviewed}
                  onCheckedChange={(checked) =>
                    setEditForm((prev) => ({ ...prev, isReviewed: Boolean(checked) }))
                  }
                  className="h-5 w-5 border-amber-400"
                />
              </div>

              {editForm.isReviewed && (
                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-amber-900 dark:text-amber-300">Rating (1 - 5 Stars)</Label>
                    <Select
                      value={String(editForm.reviewRating)}
                      onValueChange={(val) => setEditForm((prev) => ({ ...prev, reviewRating: Number(val) }))}
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">⭐⭐⭐⭐⭐ 5 Stars</SelectItem>
                        <SelectItem value="4">⭐⭐⭐⭐ 4 Stars</SelectItem>
                        <SelectItem value="3">⭐⭐⭐ 3 Stars</SelectItem>
                        <SelectItem value="2">⭐⭐ 2 Stars</SelectItem>
                        <SelectItem value="1">⭐ 1 Star</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs text-amber-900 dark:text-amber-300">Review Message / Feedback</Label>
                    <Textarea
                      rows={2}
                      placeholder="e.g. Excellent service by the fitting team! Very happy with the curtains."
                      value={editForm.reviewMessage}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, reviewMessage: e.target.value }))}
                      className="bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Assigned Salesman</Label>
              <Select
                value={editForm.assignedSalesman || "UNASSIGNED"}
                onValueChange={(val) =>
                  setEditForm((prev) => ({
                    ...prev,
                    assignedSalesman: val === "UNASSIGNED" ? "" : val,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Salesman" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                  {salesmenList.map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Assigned Fitter</Label>
              <Select
                value={editForm.assignedFitter || "UNASSIGNED"}
                onValueChange={(val) =>
                  setEditForm((prev) => ({
                    ...prev,
                    assignedFitter: val === "UNASSIGNED" ? "" : val,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Fitter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                  {fittersList.map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-val">Project Value ($ / AED)</Label>
              <Input
                id="edit-val"
                type="number"
                placeholder="e.g. 1500"
                value={editForm.projectValue}
                onChange={(e) => setEditForm((prev) => ({ ...prev, projectValue: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="edit-notes">Notes / Special Instructions</Label>
              <Input
                id="edit-notes"
                placeholder="Additional notes..."
                value={editForm.notes}
                onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingJob(null)} disabled={isSavingEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit} className="bg-amber-600 hover:bg-amber-700 text-white">
              {isSavingEdit ? "Saving Changes..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRMATION DIALOG ── */}
      <Dialog open={!!deletingJob} onOpenChange={(open) => !open && setDeletingJob(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5" />
              Delete Job Confirmation
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete job{" "}
              <strong className="text-slate-900 dark:text-white font-mono">
                {deletingJob ? getJobDisplayId(deletingJob) : ""}
              </strong>
              ? This operation cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeletingJob(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── PHOTO LIGHTBOX PREVIEW MODAL ── */}
      {activeLightboxImages && (
        <Dialog open={true} onOpenChange={() => setActiveLightboxImages(null)}>
          <DialogContent className="max-w-4xl bg-slate-950 text-white border-slate-800 p-0 overflow-hidden">
            <div className="relative p-6 flex flex-col items-center justify-center min-h-100">


              <div className="mb-4 text-xs font-mono uppercase tracking-widest text-slate-400">
                Image {activeLightboxImages.index + 1} of {activeLightboxImages.urls.length}
              </div>

              {/* Image preview */}
              <div className="relative max-h-[60vh] max-w-full flex items-center justify-center">
                {/* eslint-disable-next-html-element-suppression */}
                <img
                  src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${activeLightboxImages.urls[activeLightboxImages.index]}`}
                  alt={`Job Upload ${activeLightboxImages.index + 1}`}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-2xl border border-slate-800"
                />
              </div>

              {/* Prev / Next controls */}
              {activeLightboxImages.urls.length > 1 && (
                <div className="flex items-center gap-4 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setActiveLightboxImages((prev) =>
                        prev
                          ? {
                            ...prev,
                            index: (prev.index - 1 + prev.urls.length) % prev.urls.length,
                          }
                          : null
                      )
                    }
                    className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setActiveLightboxImages((prev) =>
                        prev
                          ? {
                            ...prev,
                            index: (prev.index + 1) % prev.urls.length,
                          }
                          : null
                      )
                    }
                    className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
