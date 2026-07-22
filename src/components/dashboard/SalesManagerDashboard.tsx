"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowUp, CheckCircle, ClipboardList, PlusCircle, Users } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { getJobErrorMessage, getJobs, JobStatus, type Job } from "@/lib/jobs";
import { getUsers, type UserRecord } from "@/lib/users";
import { isFitterRole, isSalesmanRole } from "@/lib/auth";

export default function SalesManagerDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  const scheduledJobs = useMemo(() => jobs.filter((job) => job.status === JobStatus.Scheduled).length, [jobs]);
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

  const activeFitters = useMemo(() => users.filter((u) => isFitterRole(u.role)).length, [users]);
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
      href: "/dashboard/salesmen",
    },
  ];

  const recentJobs = jobs.slice(0, 3);

  return (
    <div className="px-8 py-8 space-y-12">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold">
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-600 to-transparent" />
            <span>Operations Overview</span>
          </div>
          <h1 className="text-5xl font-light tracking-tight text-neutral-900 dark:text-white leading-tight">
            Sales
            <span className="block font-bold">Assignments</span>
          </h1>
        </div>
        <Link href="/dashboard/jobs/new">
          <button className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white px-10 py-5 text-base font-semibold transition-all duration-150 flex items-center gap-3 rounded-sm shadow-lg shadow-amber-900/30">
            <PlusCircle className="w-6 h-6" />
            New Job
          </button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-300 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 rounded-sm overflow-hidden">
        {stats.map((stat, index) => {
          const content = (
            <Card className="border-0 rounded-none bg-neutral-100 dark:bg-neutral-900 hover:bg-white dark:hover:bg-neutral-800 transition-colors cursor-pointer group h-full">
              <CardContent className="p-8">
                <div className="w-10 h-10 mb-5 border border-neutral-300 dark:border-neutral-700 rounded-sm flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
                </div>
                <div className="text-[11px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-2 font-semibold">{stat.title}</div>
                <div className="text-5xl font-light text-neutral-900 dark:text-white mb-3">{stat.value}</div>
                {/* <div className={`flex items-center gap-1 text-xs ${stat.trendColor}`}>
                  <ArrowUp className="w-3 h-3" />
                  <span>{stat.trend}</span>
                </div> */}
              </CardContent>
            </Card>
          );

          // if (stat.title === "Unassigned Jobs") {
          //   return (
          //     <Link key={stat.title} href="/sales-manager/assignments" className="contents">
          //        {content}
          //     </Link>
          //   );
          // }

          return (
            <div key={`${stat.title}-${index}`} className="contents">
              {content}
            </div>
          );
        })}
      </div>

      {/* Recent Jobs */}
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-light text-neutral-900 dark:text-white">Recent Jobs</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-neutral-300 dark:from-neutral-700 to-transparent" />
        </div>
        <div className="rounded-sm overflow-hidden border border-neutral-300 dark:border-neutral-700 divide-y divide-neutral-200 dark:divide-neutral-800">
          {isLoading && (
            <div className="bg-white dark:bg-neutral-900 px-8 py-6 text-sm text-neutral-500">Loading jobs...</div>
          )}
          {!isLoading && recentJobs.length === 0 && (
            <div className="bg-white dark:bg-neutral-900 px-8 py-6 text-sm text-neutral-500">
              No jobs found yet. Create a new job to see it here.
            </div>
          )}
          {!isLoading && recentJobs.map((job) => (
            <div
              key={job._id}
              className="bg-white dark:bg-neutral-900 px-8 py-5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-base font-medium text-neutral-900 dark:text-white mb-0.5">{job.customerName}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{job.address}</p>
              </div>
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                {job.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
