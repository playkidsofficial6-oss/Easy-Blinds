"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle, PlusCircle, Users } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { getJobErrorMessage, getJobs, JobStatus, type Job } from "@/lib/jobs";
import { getUsers, type UserRecord } from "@/lib/users";
import { isSalesmanRole } from "@/lib/auth";

import { JobDetailSheet } from "@/components/tracking/JobDetailSheet";

export default function SalesManagerDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [jobsResponse, usersResponse] = await Promise.all([
          getJobs({ limit: 100 }),
          getUsers(),
        ]);
        setJobs(jobsResponse.items);
        setUsers(usersResponse);
      } catch (error) {
        toast.error(getJobErrorMessage(error, "Unable to load dashboard data."));
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const unassignedJobs = useMemo(() => jobs.filter((job) => job.status === JobStatus.Pending).length, [jobs]);
  const scheduledJobs = useMemo(() => jobs.filter((job) => job.status === JobStatus.SalesmanScheduled || job.status === JobStatus.FitterAssigned).length, [jobs]);
  const completedThisMonth = useMemo(() => {
    const now = new Date();
    return jobs.filter((job) => {
      if (job.status !== JobStatus.Completed) {
        return false;
      }

      const date = new Date(job.updatedAt ?? job.createdAt ?? "");
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }).length;
  }, [jobs]);


  const activeSalesmen = useMemo(() => users.filter((u) => isSalesmanRole(u.role)).length, [users]);

  const stats = [
    {
      title: "Unassigned Jobs",
      value: isLoading ? "..." : unassignedJobs,
      icon: AlertCircle,
      href: "/dashboard/salesman-assignments",
    },
    {
      title: "Scheduled Jobs",
      value: isLoading ? "..." : scheduledJobs,
      icon: CheckCircle,
      href: "/dashboard/active",
    },
    {
      title: "Completed (Month)",
      value: isLoading ? "..." : completedThisMonth,
      icon: CheckCircle,
      href: "/dashboard/jobs",
    },
    {
      title: "Active Salesmen",
      value: isLoading ? "..." : activeSalesmen,
      icon: Users,
      href: "/dashboard/salesman-assignments",
    },
  ];

  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="px-4 sm:px-8 py-4 sm:py-8 space-y-6 sm:space-y-12">
      {selectedJobId && (
        <JobDetailSheet jobId={selectedJobId} onClose={() => setSelectedJobId(null)} />
      )}

      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2 sm:space-y-3 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold">
            <div className="w-8 sm:w-12 h-px bg-linear-to-r from-transparent via-amber-600 to-transparent" />
            <span>Operations Overview</span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-neutral-900 dark:text-white leading-tight">
            Sales
            <span className="block font-bold">Assignments</span>
          </h1>
        </div>
        <Link href="/dashboard/jobs/new">
          <button className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white px-4 py-3 sm:px-10 sm:py-5 text-sm sm:text-base font-semibold transition-all duration-150 flex items-center gap-2 sm:gap-3 rounded-sm shadow-lg shadow-amber-900/30 shrink-0 whitespace-nowrap">
            <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="hidden sm:inline">New Job</span>
          </button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-300 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 rounded-sm overflow-hidden">
        {stats.map((stat, index) => {
          const content = (
            <Card className="border-0 rounded-none bg-neutral-100 dark:bg-neutral-900 hover:bg-white dark:hover:bg-neutral-800 transition-colors cursor-pointer group h-full">
              <CardContent className="p-4 sm:p-8">
                <div className="w-8 h-8 sm:w-10 sm:h-10 mb-3 sm:mb-5 border border-neutral-300 dark:border-neutral-700 rounded-sm flex items-center justify-center">
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
                </div>
                <div className="text-[9px] sm:text-[11px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1 sm:mb-2 font-semibold">{stat.title}</div>
                <div className="text-3xl sm:text-5xl font-light text-neutral-900 dark:text-white mb-1 sm:mb-3">{stat.value}</div>
              </CardContent>
            </Card>
          );

          return (
            <div key={`${stat.title}-${index}`} className="contents">
              {content}
            </div>
          );
        })}
      </div>

      {/* Recent Jobs */}
      <div className="space-y-3 sm:space-y-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-light text-neutral-900 dark:text-white whitespace-nowrap">Recent Jobs</h2>
          <div className="h-px flex-1 bg-linear-to-r from-neutral-300 dark:from-neutral-700 to-transparent" />
        </div>
        <div className="rounded-sm overflow-hidden border border-neutral-300 dark:border-neutral-700 divide-y divide-neutral-200 dark:divide-neutral-800">
          {isLoading && (
            <div className="bg-white dark:bg-neutral-900 px-4 sm:px-8 py-6 text-sm text-neutral-500">Loading jobs...</div>
          )}
          {!isLoading && recentJobs.length === 0 && (
            <div className="bg-white dark:bg-neutral-900 px-4 sm:px-8 py-6 text-sm text-neutral-500">
              No jobs found yet. Create a new job to see it here.
            </div>
          )}
          {!isLoading && recentJobs.map((job) => (
            <div
              key={job._id}
              onClick={() => setSelectedJobId(job._id)}
              className="bg-white dark:bg-neutral-900 px-4 sm:px-8 py-3.5 sm:py-5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 cursor-pointer"
            >
              <div className="min-w-0">
                <p className="text-sm sm:text-base font-medium text-neutral-900 dark:text-white mb-0.5 truncate">{job.customerName}</p>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 truncate">{job.address}</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className="text-[10px] sm:text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                  {job.status.replace("_", " ")}
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded border border-amber-200">
                  View Details
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
