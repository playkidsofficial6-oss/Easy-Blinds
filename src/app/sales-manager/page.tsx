"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowUp, CheckCircle, ClipboardList, PlusCircle, Users } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { getJobErrorMessage, getJobs, type Job } from "@/lib/jobs";
import { MOCK_TEAM } from "@/lib/data/team";

export default function SalesManagerDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      setIsLoading(true);
      try {
        const response = await getJobs({ limit: 100 });
        setJobs(response.items);
      } catch (error) {
        toast.error(getJobErrorMessage(error, "Unable to load sales-manager jobs from MongoDB."));
      } finally {
        setIsLoading(false);
      }
    }

    loadJobs();
  }, []);

  const unassignedJobs = useMemo(() => jobs.filter((job) => job.status === "pending").length, [jobs]);
  const completedThisMonth = useMemo(() => {
    const now = new Date();
    return jobs.filter((job) => {
      if (job.status !== "completed") {
        return false;
      }

      const date = new Date(job.updatedAt ?? job.createdAt ?? "");
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }).length;
  }, [jobs]);

  const activeFitters = MOCK_TEAM.length;
  const pendingReviews = 0;

  const stats = [
    {
      title: "Unassigned Jobs",
      value: isLoading ? "..." : unassignedJobs,
      icon: AlertCircle,
      trend: "MongoDB",
      trendColor: "text-amber-600",
    },
    {
      title: "Active Fitters",
      value: activeFitters,
      icon: Users,
      trend: "Team data",
      trendColor: "text-emerald-600",
    },
    {
      title: "Completed (Month)",
      value: isLoading ? "..." : completedThisMonth,
      icon: CheckCircle,
      trend: "MongoDB",
      trendColor: "text-emerald-600",
    },
    {
      title: "Pending Reviews",
      value: pendingReviews,
      icon: ClipboardList,
      trend: "No dummy jobs",
      trendColor: "text-neutral-600",
    },
  ];

  const recentJobs = jobs.slice(0, 3);

  return (
    <div className="space-y-16">
      <div className="flex items-end justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold">
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-600 to-transparent" />
            <span>Operations Overview</span>
          </div>
          <h1 className="text-6xl font-light tracking-tight text-neutral-900 dark:text-white">
            Sales
            <span className="block font-semibold mt-1">Assignments</span>
          </h1>
        </div>
        <Link href="/sales-manager/jobs/new">
          <button className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 text-sm font-medium transition-colors flex items-center gap-2">
            <PlusCircle className="w-5 h-5" />
            New Job
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800">
        {stats.map((stat, index) => {
          const content = (
            <Card className="border-0 rounded-none bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer group h-full">
              <CardContent className="p-10">
                <div className="w-12 h-12 mb-6 border border-neutral-200 dark:border-neutral-800 rounded-none flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                </div>
                <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">{stat.title}</div>
                <div className="text-5xl font-light text-neutral-900 dark:text-white">{stat.value}</div>
                <div className={`flex items-center gap-1 text-xs mt-3 ${stat.trendColor}`}>
                  <ArrowUp className="w-3 h-3" />
                  <span>{stat.trend}</span>
                </div>
              </CardContent>
            </Card>
          );

          if (stat.title === "Unassigned Jobs") {
            return (
              <Link key={stat.title} href="/sales-manager/assignments" className="contents">
                {content}
              </Link>
            );
          }

          return (
            <div key={`${stat.title}-${index}`} className="contents">
              {content}
            </div>
          );
        })}
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-light text-neutral-900 dark:text-white">Recent Backend Jobs</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-neutral-200 dark:from-neutral-800 to-transparent" />
        </div>
        <div className="space-y-px bg-neutral-200 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800">
          {isLoading && <div className="bg-white dark:bg-neutral-900 p-8 text-sm text-neutral-500">Loading MongoDB jobs...</div>}
          {!isLoading && recentJobs.length === 0 && (
            <div className="bg-white dark:bg-neutral-900 p-8 text-sm text-neutral-500">No MongoDB jobs found yet. Create a new job to see it here.</div>
          )}
          {!isLoading && recentJobs.map((job) => (
            <div key={job._id} className="bg-white dark:bg-neutral-900 p-8 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-between">
              <div>
                <p className="text-lg font-light text-neutral-900 dark:text-white mb-1">{job.customerName}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{job.productType} · {job.address}</p>
              </div>
              <span className="text-sm text-neutral-400 uppercase tracking-wider">{job.status.replace("_", " ")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
