"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Star, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { MOCK_TEAM } from "@/lib/data/team";
import { MOCK_JOBS } from "@/lib/data/jobs";
import { cn } from "@/lib/utils";

export default function TeamRankingsPage() {
    // Calculate Rankings based on weighted score
    const rankings = MOCK_TEAM.map(fitter => {
        const completedJobs = MOCK_JOBS.filter(j => j.team === fitter.name && j.status === "Completed");
        const totalRevenue = completedJobs.reduce((acc, curr) => acc + curr.value, 0);
        const reviews = MOCK_JOBS.filter(j => j.team === fitter.name && j.reviewStatus === "received");
        const avgRating = reviews.length > 0
            ? reviews.reduce((acc, curr) => acc + (curr.reviewRating || 0), 0) / reviews.length
            : 0;

        // Simple Scoring: (Revenue / 1000) + (Jobs * 10) + (Rating * 20)
        const score = Math.round((totalRevenue / 1000) + (completedJobs.length * 10) + (avgRating * 20));

        return {
            ...fitter,
            stats: {
                revenue: totalRevenue,
                jobs: completedJobs.length,
                rating: avgRating.toFixed(1),
                score
            }
        };
    }).sort((a, b) => b.stats.score - a.stats.score);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold mb-2">
                        <span className="w-8 h-px bg-amber-600"></span>
                        <span>Performance Leaderboard</span>
                    </div>
                    <h1 className="text-3xl font-light tracking-tight text-neutral-900">
                        Team <span className="font-semibold">Rankings</span>
                    </h1>
                    <p className="text-neutral-500 mt-2">Weighted scoring based on revenue, volume, and quality.</p>
                </div>
            </div>

            <div className="grid gap-6">
                {rankings.map((fitter, index) => (
                    <Card key={fitter.id} className={cn(
                        "transition-all hover:shadow-md",
                        index === 0 ? "border-amber-400 bg-amber-50/30" :
                            index === 1 ? "border-neutral-300 bg-neutral-50/30" :
                                index === 2 ? "border-orange-200 bg-orange-50/20" : "border-neutral-100"
                    )}>
                        <CardContent className="p-6 flex items-center gap-6">
                            {/* Rank Position */}
                            <div className={cn(
                                "w-12 h-12 flex items-center justify-center text-xl font-bold rounded-full",
                                index === 0 ? "bg-amber-100 text-amber-700" :
                                    index === 1 ? "bg-neutral-100 text-neutral-700" :
                                        index === 2 ? "bg-orange-100 text-orange-800" :
                                            "bg-neutral-50 text-neutral-400"
                            )}>
                                #{index + 1}
                            </div>

                            {/* Fitter Info */}
                            <div className="flex-1 flex items-center gap-4">
                                <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                                    <AvatarImage src={fitter.avatar} />
                                    <AvatarFallback>{fitter.name.split(" ")[1]?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-lg font-medium text-neutral-900 flex items-center gap-2">
                                        {fitter.name}
                                        {index === 0 && <Trophy className="w-4 h-4 text-amber-500 fill-amber-500" />}
                                    </h3>
                                    <div className="flex items-center gap-3 text-sm text-neutral-500">
                                        <span className="flex items-center gap-1">
                                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                            {fitter.stats.rating}
                                        </span>
                                        <span>•</span>
                                        <span>{fitter.role}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="flex items-center gap-12 mr-6">
                                <div className="text-right">
                                    <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Revenue</div>
                                    <div className="font-medium text-neutral-900">AED {(fitter.stats.revenue / 1000).toFixed(1)}k</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Jobs</div>
                                    <div className="font-medium text-neutral-900">{fitter.stats.jobs}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Score</div>
                                    <div className="text-2xl font-light text-neutral-900">{fitter.stats.score}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
