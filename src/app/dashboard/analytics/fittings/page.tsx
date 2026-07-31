"use client";

import { useState } from "react";
import { format, isToday } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Clock, MapPin, } from "lucide-react";
import Link from "next/link";
import { MOCK_JOBS, FitterStatus } from "@/lib/data/jobs";
import { MOCK_TEAM } from "@/lib/data/team";
import { cn } from "@/lib/utils";

// Helper to get status color
const getStatusColor = (status?: FitterStatus) => {
    switch (status) {
        case "Busy": return "bg-rose-100 text-rose-700 border-rose-200";
        case "Free": return "bg-emerald-100 text-emerald-700 border-emerald-200";
        case "On-site": return "bg-amber-100 text-amber-700 border-amber-200";
        case "Travelling": return "bg-blue-100 text-blue-700 border-blue-200";
        case "Leave": return "bg-neutral-100 text-neutral-600 border-neutral-200";
        default: return "bg-neutral-50 text-neutral-600 border-neutral-200";
    }
};

export default function FittingsAnalyticsPage() {
    const [selectedFitter, setSelectedFitter] = useState<string>("all");
    const [dateRange, setDateRange] = useState<"today" | "week" | "month">("today");

    // Filter Logic
    const filteredJobs = MOCK_JOBS.filter(job => {
        if (selectedFitter !== "all" && job.team !== selectedFitter) return false;
        // Simple date filtering mock - normally would use date-fns interval checks
        if (dateRange === "today" && !isToday(new Date(job.scheduled))) return false;
        return true;
    });

    // Real-time Status & Workload Logic
    const fitterWorkload = MOCK_TEAM.map(fitter => {
        // Active Job for Status
        const activeJob = MOCK_JOBS.find(j => j.team === fitter.name && j.fitterStatus);

        // Workload Counts based on selected date range (filteredJobs)
        // We filter MOCK_JOBS directly here to ensure we get counts for the DATE RANGE irrespective of the fitter filter text (which handles visibility)
        // Actually, we want counts for the selected date range.
        const dateRangeJobs = MOCK_JOBS.filter(job => {
            if (dateRange === "today" && !isToday(new Date(job.scheduled))) return false;
            // Add week/month logic if needed, simplifed to today for now or all if not today
            return true;
        }).filter(j => j.team === fitter.name);

        return {
            name: fitter.name,
            status: activeJob?.fitterStatus || "Free",
            currentJob: activeJob,
            stats: {
                completed: dateRangeJobs.filter(j => j.status === "Completed").length,
                scheduled: dateRangeJobs.filter(j => j.status === "Scheduled" || j.status === "Ready for Installation").length,
                inProgress: dateRangeJobs.filter(j => j.status === "Installation In Progress").length,
                total: dateRangeJobs.length
            }
        };
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <Link href="/sales-manager" className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-light tracking-tight text-neutral-900">
                        Fitting <span className="font-semibold">Workload</span>
                    </h1>
                    <p className="text-neutral-500 mt-2">Real-time status and per-fitter volume analysis.</p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3">
                    <Select value={selectedFitter} onValueChange={setSelectedFitter}>
                        <SelectTrigger className="w-[180px] bg-white">
                            <SelectValue placeholder="All Fitters" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Fitters</SelectItem>
                            {MOCK_TEAM.map(f => (
                                <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex bg-white rounded-lg border border-neutral-200 p-1">
                        {(["today", "week", "month"] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                                    dateRange === range
                                        ? "bg-neutral-900 text-white shadow-sm"
                                        : "text-neutral-500 hover:bg-neutral-50"
                                )}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 1. Fitter Workload Cards (Enriched) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {fitterWorkload.filter(f => selectedFitter === "all" || f.name === selectedFitter).map((fitter) => (
                    <Card
                        key={fitter.name}
                        onClick={() => setSelectedFitter(fitter.name === selectedFitter ? "all" : fitter.name)}
                        className={cn(
                            "border-l-4 transition-all overflow-hidden cursor-pointer",
                            fitter.name === selectedFitter
                                ? "border-l-amber-600 ring-2 ring-amber-600 ring-offset-2"
                                : "border-l-transparent hover:border-l-amber-500 hover:shadow-md",
                            getStatusColor(fitter.status as FitterStatus).replace('bg-', 'border-l-') // Keep status color logic if needed, or override
                        )}
                    >
                        <CardContent className="pt-6 pb-0 px-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 font-semibold">
                                        {fitter.name.split(" ")[1]?.[0]}{fitter.name.split(" ")[2]?.[0]}
                                    </div>
                                    <div>
                                        <p className="font-medium text-neutral-900">{fitter.name}</p>
                                        <p className="text-xs text-neutral-500">Sr. Fitter</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className={cn("capitalize", getStatusColor(fitter.status as FitterStatus))}>
                                    {fitter.status}
                                </Badge>
                            </div>

                            {/* Enriched Stats Grid */}
                            <div className="grid grid-cols-3 gap-2 py-4 border-t border-b border-neutral-100 mb-4">
                                <div className="text-center border-r border-neutral-100">
                                    <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Done</div>
                                    <div className="font-medium text-emerald-600">{fitter.stats.completed}</div>
                                </div>
                                <div className="text-center border-r border-neutral-100">
                                    <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Active</div>
                                    <div className="font-medium text-amber-600">{fitter.stats.inProgress}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Next</div>
                                    <div className="font-medium text-blue-600">{fitter.stats.scheduled}</div>
                                </div>
                            </div>

                            {fitter.currentJob ? (
                                <div className="bg-neutral-50 rounded-lg p-3 text-sm space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-neutral-700">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span className="truncate">{fitter.currentJob.area}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-neutral-500 text-xs">
                                        <Clock className="w-3" />
                                        <span>Started {fitter.currentJob.time || '09:00'}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-neutral-50 rounded-lg p-3 text-sm text-neutral-400 text-center italic mb-4">
                                    No active job right now
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 3. Detailed Workload Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detailed Schedule</CardTitle>
                    <CardDescription>Comprehensive view of all assignments for the selected period.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-neutral-200">
                        <div className="grid grid-cols-12 gap-4 p-4 bg-neutral-50 border-b border-neutral-200 font-medium text-sm text-neutral-500">
                            <div className="col-span-2">Time</div>
                            <div className="col-span-3">Client & Location</div>
                            <div className="col-span-3">Fitter</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2 text-right">Value</div>
                        </div>
                        <div className="divide-y divide-neutral-100">
                            {filteredJobs.length === 0 ? (
                                <div className="p-8 text-center text-neutral-500">No jobs found for this period.</div>
                            ) : (
                                filteredJobs.map((job) => (
                                    <div key={job.id} className="grid grid-cols-12 gap-4 p-4 items-center text-sm hover:bg-neutral-50/50 transition-colors">
                                        <div className="col-span-2 font-medium text-neutral-900">
                                            {job.time || '09:00'}
                                            <div className="text-xs text-neutral-400 font-normal">{format(new Date(job.scheduled), "MMM d")}</div>
                                        </div>
                                        <div className="col-span-3">
                                            <div className="font-medium text-neutral-900">{job.client}</div>
                                            <div className="text-xs text-neutral-500">{job.area}, {job.property}</div>
                                        </div>
                                        <div className="col-span-3 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-600">
                                                {job.team.split(" ")[1]?.[0]}
                                            </div>
                                            <span className="text-neutral-700">{job.team}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <Badge variant="secondary" className="font-normal bg-neutral-100 text-neutral-600 hover:bg-neutral-200">
                                                {job.status}
                                            </Badge>
                                        </div>
                                        <div className="col-span-2 text-right font-medium text-neutral-900">
                                            AED {job.value.toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
