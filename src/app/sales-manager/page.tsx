"use client";

import { MOCK_JOBS } from "@/lib/data/jobs";
import { MOCK_TEAM } from "@/lib/data/team";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ClipboardList, Users, AlertCircle, CheckCircle, ArrowUp, PlusCircle } from "lucide-react";

export default function SalesManagerDashboard() {
    const unassignedJobs = MOCK_JOBS.filter(
        (job) => job.status === "Ready for Installation" || job.status === "Pending Team"
    ).length;

    const activeFitters = MOCK_TEAM.length;
    const completedThisMonth = 45; // Mock stat
    const pendingReviews = 12; // Mock stat

    const stats = [
        {
            title: "Unassigned Jobs",
            value: unassignedJobs,
            icon: AlertCircle,
            trend: "+2",
            trendColor: "text-amber-600"
        },
        {
            title: "Active Fitters",
            value: activeFitters,
            icon: Users,
            trend: "Stable",
            trendColor: "text-emerald-600"
        },
        {
            title: "Completed (Month)",
            value: completedThisMonth,
            icon: CheckCircle,
            trend: "+12%",
            trendColor: "text-emerald-600"
        },
        {
            title: "Pending Reviews",
            value: pendingReviews,
            icon: ClipboardList,
            trend: "-5%",
            trendColor: "text-neutral-600"
        },
    ];

    return (
        <div className="space-y-16">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold">
                        <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
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

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800">
                {stats.map((stat, i) => {
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
                            <Link key={i} href="/sales-manager/assignments" className="contents">
                                {content}
                            </Link>
                        );
                    }

                    return (
                        <div key={i} className="contents">
                            {content}
                        </div>
                    );
                })}
            </div>

            {/* Recent Activity */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-light text-neutral-900 dark:text-white">Recent Activity</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-neutral-200 dark:from-neutral-800 to-transparent"></div>
                </div>
                <div className="space-y-px bg-neutral-200 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800">
                    <div className="bg-white dark:bg-neutral-900 p-8 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer flex items-center justify-between">
                        <div>
                            <p className="text-lg font-light text-neutral-900 dark:text-white mb-1">Job #J001 Completed</p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Ahmed Al Mansoori - Villa</p>
                        </div>
                        <span className="text-sm text-neutral-400 uppercase tracking-wider">2 hours ago</span>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 p-8 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer flex items-center justify-between">
                        <div>
                            <p className="text-lg font-light text-neutral-900 dark:text-white mb-1">New Job Added</p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Palm Hotel - Hotel</p>
                        </div>
                        <span className="text-sm text-neutral-400 uppercase tracking-wider">5 hours ago</span>
                    </div>
                    <div className="bg-white dark:bg-neutral-900 p-8 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer flex items-center justify-between">
                        <div>
                            <p className="text-lg font-light text-neutral-900 dark:text-white mb-1">Fitter Assigned</p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Mr Alvin assigned to Job #J006</p>
                        </div>
                        <span className="text-sm text-neutral-400 uppercase tracking-wider">1 day ago</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
