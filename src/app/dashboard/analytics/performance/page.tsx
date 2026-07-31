"use client";

import { Card, CardContent, } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_TEAM } from "@/lib/data/team";
import { MOCK_JOBS } from "@/lib/data/jobs";
import { cn } from "@/lib/utils";

export default function OwnerPerformancePage() {
    // Aggregated Performance Data Calculation
    const teamStats = MOCK_TEAM.map(fitter => {
        const jobs = MOCK_JOBS.filter(j => j.team === fitter.name && j.status === "Completed");
        const total = jobs.length;
        // Mock avg time calculation
        const avgTime = "2h 15m";

        return {
            ...fitter,
            total,
            avgTime
        };
    }).sort((a, b) => b.total - a.total);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold mb-2">
                        <span className="w-8 h-px bg-amber-600"></span>
                        <span>Operations Analysis</span>
                    </div>
                    <h1 className="text-3xl font-light tracking-tight text-neutral-900">
                        Fitting <span className="font-semibold">Efficiency</span>
                    </h1>
                    <p className="text-neutral-500 mt-2">Team velocity and operational metrics.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {teamStats.map((fitter, i) => (
                    <Card key={fitter.id} className={cn(
                        "border-t-4",
                        i === 0 ? "border-t-amber-500" : "border-t-neutral-200"
                    )}>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-lg font-bold text-neutral-700">
                                    {fitter.name.split(" ")[1][0]}
                                </div>
                                {i === 0 && (
                                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
                                        Top Efficiency
                                    </Badge>
                                )}
                            </div>

                            <h3 className="text-xl font-medium text-neutral-900 mb-1">{fitter.name}</h3>
                            <p className="text-sm text-neutral-500 mb-6">Senior Fitter</p>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Jobs Completed</span>
                                    <span className="font-medium">{fitter.total}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Avg Duration</span>
                                    <span className="font-medium">{fitter.avgTime}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">On-Time Rate</span>
                                    <span className="font-medium text-emerald-600">98%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
