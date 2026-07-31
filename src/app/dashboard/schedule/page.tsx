"use client";

import { useState } from "react";
import { MOCK_TEAM } from "@/lib/data/team";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, } from "@/components/ui/avatar";
import {
    ChevronLeft,
    ChevronRight,
    MapPin,
    Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Flatten all upcoming jobs from all fitters
const getAllUpcomingJobs = () => {
    const jobs: any[] = [];
    MOCK_TEAM.forEach(fitter => {
        if (fitter.schedule && fitter.schedule.upcoming) {
            fitter.schedule.upcoming.forEach(job => {
                jobs.push({
                    ...job,
                    fitterName: fitter.name,
                    fitterAvatar: fitter.avatar,
                    fitterId: fitter.id
                });
            });
        }
        // Also include today's jobs
        if (fitter.schedule && fitter.schedule.today) {
            fitter.schedule.today.forEach(job => {
                jobs.push({
                    ...job,
                    fitterName: fitter.name,
                    fitterAvatar: fitter.avatar,
                    fitterId: fitter.id,
                    isToday: true
                });
            });
        }
    });

    // Sort by date (mock sort logic)
    return jobs.sort((a, b) => {
        if (a.date === "Today") return -1;
        if (b.date === "Today") return 1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
};

export default function MasterSchedulePage() {
    const allJobs = getAllUpcomingJobs();
    const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

    return (
        <div className="space-y-8">
            <div className="flex items-end justify-between">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold">
                        <div className="w-12 h-px bg-linear-to-r from-transparent via-amber-600 to-transparent"></div>
                        <span>Operations Forecast</span>
                    </div>
                    <h1 className="text-6xl font-light tracking-tight text-neutral-900 dark:text-white">
                        Master
                        <span className="block font-semibold mt-1">Schedule</span>
                    </h1>
                </div>
                <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode("list")}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-md transition-all",
                            viewMode === "list" ? "bg-white dark:bg-neutral-900 shadow-sm text-neutral-900 dark:text-white" : "text-neutral-500 hover:text-neutral-900"
                        )}
                    >
                        List View
                    </button>
                    <button
                        onClick={() => setViewMode("calendar")}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-md transition-all",
                            viewMode === "calendar" ? "bg-white dark:bg-neutral-900 shadow-sm text-neutral-900 dark:text-white" : "text-neutral-500 hover:text-neutral-900"
                        )}
                    >
                        Calendar
                    </button>
                </div>
            </div>

            {/* Date Navigation (Mock) */}
            <div className="flex items-center justify-between bg-white dark:bg-neutral-900 p-4 border border-neutral-200 dark:border-neutral-800">
                <Button variant="ghost" size="icon">
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="text-lg font-medium text-neutral-900 dark:text-white">December 2023</div>
                <Button variant="ghost" size="icon">
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            {/* Jobs List */}
            <div className="space-y-px bg-neutral-200 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800">
                {allJobs.map((job, i) => (
                    <div key={i} className="bg-white dark:bg-neutral-900 p-6 flex flex-col md:flex-row md:items-center gap-6 group hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                        {/* Date/Time Column */}
                        <div className="w-32 shrink-0">
                            <div className={cn(
                                "text-sm font-bold uppercase tracking-wider mb-1",
                                job.isToday ? "text-emerald-600" : "text-neutral-900 dark:text-white"
                            )}>
                                {job.date}
                            </div>
                            <div className="text-neutral-500 flex items-center gap-1.5 text-sm">
                                <Clock className="w-3 h-3" />
                                {job.time}
                            </div>
                        </div>

                        {/* Fitter Column */}
                        <div className="w-48 shrink-0 flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs bg-neutral-200 dark:bg-neutral-800">{job.fitterName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="truncate text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                {job.fitterName}
                            </div>
                        </div>

                        {/* Job Details Column */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-neutral-900 dark:text-white truncate">{job.client}</h3>
                                <Badge variant="outline" className="text-[10px] uppercase font-normal text-neutral-500">
                                    {job.type}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-neutral-500">
                                <MapPin className="w-3 h-3" />
                                {job.area}
                            </div>
                        </div>

                        {/* Status Column */}
                        <div className="w-32 shrink-0 text-right">
                            <Badge className={cn(
                                "uppercase tracking-wide text-[10px] font-bold",
                                job.status === "Completed" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200" :
                                    job.status === "In Progress" ? "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200" :
                                        "bg-neutral-100 text-neutral-600 hover:bg-neutral-100 border-neutral-200"
                            )}>
                                {job.status}
                            </Badge>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center text-xs text-neutral-400 uppercase tracking-widest pt-8">
                End of Scheduled Jobs
            </div>
        </div>
    );
}
