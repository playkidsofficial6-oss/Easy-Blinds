"use client";

import { useState } from "react";
import { MOCK_TEAM } from "@/lib/data/team";
import { getReviewStats } from "@/lib/data/reviews";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Star,
    Briefcase,
    CheckCircle2,
    Calendar,
    Target,
    MapPin,
    Clock,
    ChevronRight,
    BarChart
} from "lucide-react";

export default function FitterPerformancePage() {
    const reviewStats = getReviewStats();
    const [selectedFitter, setSelectedFitter] = useState<any>(null);

    // Merge team data with dynamic review stats
    const teamWithStats = MOCK_TEAM.map(member => {
        const stats = reviewStats.find(s => s.name === member.name) || {
            posted: 0,
            pending: 0,
            total: 0,
            conversionRate: 0,
            avgRating: 0
        };
        return { ...member, stats };
    });

    return (
        <div className="space-y-12">
            <div className="flex items-end justify-between">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold">
                        <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
                        <span>Team Standards</span>
                    </div>
                    <h1 className="text-6xl font-light tracking-tight text-neutral-900 dark:text-white">
                        Fitter
                        <span className="block font-semibold mt-1">Performance</span>
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamWithStats.map((fitter) => (
                    <Card key={fitter.id} className="border-0 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-lg transition-all group overflow-hidden relative">
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Target className="w-48 h-48" />
                        </div>

                        <CardContent className="p-8 relative z-10">
                            {/* Header */}
                            <div className="flex items-center gap-4 mb-8">
                                <Avatar className="w-16 h-16 border-2 border-white shadow-sm">
                                    <AvatarImage src={fitter.avatar} />
                                    <AvatarFallback className="text-lg bg-neutral-900 text-white">{fitter.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-xl font-light text-neutral-900 dark:text-white">{fitter.name}</h3>
                                    <p className="text-sm text-neutral-500 uppercase tracking-wider">{fitter.role}</p>
                                </div>
                                <div className="ml-auto flex flex-col items-end">
                                    <div className="flex items-center gap-1 text-amber-500">
                                        <span className="text-2xl font-bold">{fitter.stats.avgRating || "4.8"}</span>
                                        <Star className="w-4 h-4 fill-current" />
                                    </div>
                                    <span className="text-[10px] text-neutral-400 uppercase tracking-wide">Avg Rating</span>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-8 border-t border-neutral-100 dark:border-neutral-800 pt-8 mb-8">
                                <div>
                                    <div className="flex items-center gap-2 text-neutral-500 mb-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="text-xs uppercase tracking-wider">Jobs Done</span>
                                    </div>
                                    <div className="text-3xl font-light text-neutral-900 dark:text-white">
                                        {fitter.totalCompleted}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-neutral-500 mb-2">
                                        <Target className="w-4 h-4" />
                                        <span className="text-xs uppercase tracking-wider">Review Rate</span>
                                    </div>
                                    <div className="text-3xl font-light text-neutral-900 dark:text-white">
                                        {fitter.stats.conversionRate}%
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-neutral-500 mb-2">
                                        <Briefcase className="w-4 h-4" />
                                        <span className="text-xs uppercase tracking-wider">Active</span>
                                    </div>
                                    <div className="text-3xl font-light text-neutral-900 dark:text-white">
                                        {fitter.todayVisits}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-neutral-500 mb-2">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-xs uppercase tracking-wider">On Time</span>
                                    </div>
                                    <div className="text-3xl font-light text-neutral-900 dark:text-white">
                                        {fitter.onTimeRate}%
                                    </div>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700"
                                onClick={() => setSelectedFitter(fitter)}
                            >
                                <BarChart className="w-4 h-4 mr-2" />
                                Detailed Breakdown
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Detailed Breakdown Section */}
            {selectedFitter && (
                <Card className="border-0 bg-white dark:bg-neutral-900 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardContent className="p-8">
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <Avatar className="w-16 h-16">
                                    <AvatarImage src={selectedFitter.avatar} />
                                    <AvatarFallback>{selectedFitter.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-2xl font-light text-neutral-900 dark:text-white">{selectedFitter.name}</h2>
                                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                                        <Badge variant="outline">{selectedFitter.role}</Badge>
                                        <span>ID: {selectedFitter.id}</span>
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" onClick={() => setSelectedFitter(null)}>Close View</Button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Job History Table */}
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-6 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Recent Job History
                                </h3>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Client & Area</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedFitter.schedule?.history?.map((job: any) => (
                                                <TableRow key={job.id}>
                                                    <TableCell className="font-medium whitespace-nowrap">{job.date}</TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{job.client}</div>
                                                        <div className="text-xs text-neutral-500">{job.area}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                                                            {job.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {(!selectedFitter.schedule?.history || selectedFitter.schedule.history.length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center py-8 text-neutral-500 italic">No recent history.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Upcoming Schedule Table */}
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-6 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Upcoming Schedule
                                </h3>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date & Time</TableHead>
                                                <TableHead>Client & Type</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedFitter.schedule?.upcoming?.map((job: any) => (
                                                <TableRow key={job.id}>
                                                    <TableCell className="whitespace-nowrap">
                                                        <div className="font-medium">{job.date}</div>
                                                        <div className="text-xs text-neutral-500">{job.time}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{job.client}</div>
                                                        <div className="text-xs text-neutral-500">{job.type}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                            <ChevronRight className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
