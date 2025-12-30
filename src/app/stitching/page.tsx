"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_STITCHING_JOBS } from "@/lib/data/stitching";
import { Scissors, Clock, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function StitchingDashboard() {
    const totalPending = MOCK_STITCHING_JOBS.filter(j => j.status !== "Ready").length;
    const urgentJobs = MOCK_STITCHING_JOBS.filter(j => j.priority === "Urgent").length;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Workshop Dashboard</h1>
                <Link href="/stitching/active">
                    <Button>
                        View Active Queue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                        <Scissors className="h-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPending}</div>
                        <p className="text-xs text-muted-foreground">Across all production stages</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Urgent Priority</CardTitle>
                        <AlertCircle className="h-4 h-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-500">{urgentJobs}</div>
                        <p className="text-xs text-muted-foreground">Requires immediate attention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
                        <Clock className="h-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">94%</div>
                        <p className="text-xs text-muted-foreground">+2% from last week</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Jobs</CardTitle>
                        <CardDescription>Latest production tasks added to the queue.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {MOCK_STITCHING_JOBS.slice(0, 5).map((job) => (
                                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <div className="font-medium">{job.client}</div>
                                        <div className="text-xs text-muted-foreground">{job.type} • {job.fabric}</div>
                                    </div>
                                    <Badge variant={job.priority === "Urgent" ? "destructive" : "secondary"}>
                                        {job.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Workshop Status</CardTitle>
                        <CardDescription>Real-time capacity and resource status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Stitching Machines</span>
                                    <span className="font-medium">6/8 Active</span>
                                </div>
                                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600 w-[75%]" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Tailor Availability</span>
                                    <span className="font-medium">4/4 Present</span>
                                </div>
                                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[100%]" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
