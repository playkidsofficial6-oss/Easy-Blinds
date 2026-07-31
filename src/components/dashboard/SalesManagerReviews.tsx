"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { MOCK_JOBS } from "@/lib/data/jobs";
import { MOCK_TEAM } from "@/lib/data/team";
import { cn } from "@/lib/utils";

export default function ReviewTrackingPage() {
    const [selectedFitter, setSelectedFitter] = useState<string>("all");

    // Calculations for Analytics (Requirement D)
    const fitterStats = MOCK_TEAM.map(fitter => {
        const jobs = MOCK_JOBS.filter(j => j.team === fitter.name && j.status === "Completed");
        const totalCompleted = jobs.length;
        const reviews = jobs.filter(j => j.reviewStatus === "received");
        const pending = jobs.filter(j => j.reviewStatus === "pending");

        const reviewCount = reviews.length;
        const avgRating = reviewCount > 0
            ? (reviews.reduce((acc, curr) => acc + (curr.reviewRating || 0), 0) / reviewCount).toFixed(1)
            : "0.0";

        const conversionRate = totalCompleted > 0
            ? Math.round((reviewCount / totalCompleted) * 100)
            : 0;

        return {
            ...fitter,
            totalCompleted,
            reviewCount,
            pendingCount: pending.length,
            avgRating,
            conversionRate
        };
    });

    // Filter Logic
    const filteredStats = selectedFitter === "all"
        ? fitterStats
        : fitterStats.filter(f => f.name === selectedFitter);

    // Aggregate Stats
    const totalReviews = filteredStats.reduce((acc, curr) => acc + curr.reviewCount, 0);
    const avgTeamRating = (filteredStats.reduce((acc, curr) => acc + parseFloat(curr.avgRating), 0) / (filteredStats.length || 1)).toFixed(1);
    const totalPending = filteredStats.reduce((acc, curr) => acc + curr.pendingCount, 0);

    // Brand Stats Calculation
    const brandStats = Array.from(new Set(MOCK_JOBS.map(j => j.brand).filter(Boolean))).map(brand => {
        const jobs = MOCK_JOBS.filter(j => j.brand === brand && j.status === "Completed");
        const total = jobs.length;
        const reviews = jobs.filter(j => j.reviewStatus === "received").length;
        const rate = total > 0 ? Math.round((reviews / total) * 100) : 0;
        return { brand: brand!, total, reviews, rate };
    }).sort((a, b) => b.rate - a.rate);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-light tracking-tight text-neutral-900">
                        Review <span className="font-semibold">Tracking</span>
                    </h1>
                    <p className="text-neutral-500 mt-2">Monitor review performance across fitters and brands.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Select value={selectedFitter} onValueChange={setSelectedFitter}>
                        <SelectTrigger className="w-[200px] bg-white">
                            <SelectValue placeholder="Filter by Fitter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Fitters</SelectItem>
                            {MOCK_TEAM.map(f => (
                                <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Link href="/sales-manager/reviews/pending">
                        <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Chase Pending ({totalPending})
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-neutral-900 text-white border-neutral-800">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-neutral-400 text-xs uppercase tracking-wider">Review Conversion</p>
                                <h3 className="text-4xl font-light mt-2">68%</h3>
                            </div>
                            <div className="p-3 bg-neutral-800 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-neutral-400">
                            +12% vs last month
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-neutral-500 text-xs uppercase tracking-wider">Average Rating</p>
                                <div className="flex items-end gap-2 mt-2">
                                    <h3 className="text-4xl font-light text-neutral-900">{avgTeamRating}</h3>
                                    <div className="flex mb-1.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-lg">
                                <Star className="w-5 h-5 text-amber-600" />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-neutral-500">
                            Based on {totalReviews} reviews
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-neutral-500 text-xs uppercase tracking-wider">Pending Action</p>
                                <h3 className="text-4xl font-light mt-2 text-neutral-900">{totalPending}</h3>
                            </div>
                            <div className="p-3 bg-rose-50 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-rose-600" />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-neutral-500">
                            Jobs completed {'>'} 24h ago
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Brand Performance - New Section */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Brand Analysis</CardTitle>
                        <CardDescription>Review collection by brand.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {brandStats.map((stat) => (
                                <div key={stat.brand} className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-neutral-900">{stat.brand}</p>
                                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                                            <span>{stat.reviews}/{stat.total} Reviews</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline" className={cn(
                                            stat.rate >= 70 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                stat.rate >= 40 ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                    "bg-rose-50 text-rose-700 border-rose-100"
                                        )}>
                                            {stat.rate}%
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                            {brandStats.length === 0 && <p className="text-sm text-neutral-500 italic">No brand data available.</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Team Performance Table */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Team Performance</CardTitle>
                        <CardDescription>Detailed review statistics per fitter (Requirement D).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-neutral-200 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                                    <tr>
                                        <th className="px-6 py-4">Fitter</th>
                                        <th className="px-6 py-4 text-center">Jobs</th>
                                        <th className="px-6 py-4 text-center">Reviews</th>
                                        <th className="px-6 py-4 text-center">Conv. %</th>
                                        <th className="px-6 py-4 text-center">Rating</th>
                                        <th className="px-6 py-4 text-center">Pending</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {filteredStats.map((stat) => (
                                        <tr key={stat.id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-neutral-900 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-600">
                                                    {stat.name.split(" ")[1]?.[0]}
                                                </div>
                                                {stat.name}
                                            </td>
                                            <td className="px-6 py-4 text-center text-neutral-600">{stat.totalCompleted}</td>
                                            <td className="px-6 py-4 text-center text-neutral-600">{stat.reviewCount}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={cn(
                                                    "font-medium",
                                                    stat.conversionRate >= 70 ? "text-emerald-600" :
                                                        stat.conversionRate >= 50 ? "text-amber-600" :
                                                            "text-rose-600"
                                                )}>
                                                    {stat.conversionRate}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1 font-medium text-neutral-900">
                                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                    {stat.avgRating}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {stat.pendingCount > 0 ? (
                                                    <Badge variant="secondary" className="bg-rose-100 text-rose-700 hover:bg-rose-200">
                                                        {stat.pendingCount}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-neutral-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Reviews Feed */}
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-medium mb-4">Positive Highlight</h3>
                    <div className="space-y-4">
                        {MOCK_JOBS.filter(j => j.reviewRating && j.reviewRating >= 4).slice(0, 3).map(j => (
                            <Card key={j.id} className="bg-emerald-50/50 border-emerald-100">
                                <CardContent className="p-4">
                                    <div className="flex justify-between mb-2">
                                        <div className="flex gap-1">
                                            {[...Array(Math.floor(j.reviewRating || 5))].map((_, i) => (
                                                <Star key={i} className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                                            ))}
                                        </div>
                                        <span className="text-xs text-emerald-700 font-medium">{j.team}</span>
                                    </div>
                                    <p className="text-sm text-emerald-900 italic">"{j.reviewComment}"</p>
                                    <p className="text-xs text-emerald-600 mt-2">- {j.client} ({j.brand})</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-medium mb-4">Focus Areas</h3>
                    <div className="space-y-4">
                        {MOCK_JOBS.filter(j => j.reviewRating && j.reviewRating < 5).slice(0, 3).map(j => (
                            <Card key={j.id} className="bg-rose-50/50 border-rose-100">
                                <CardContent className="p-4">
                                    <div className="flex justify-between mb-2">
                                        <div className="flex gap-1">
                                            {[...Array(Math.floor(j.reviewRating || 3))].map((_, i) => (
                                                <Star key={i} className="w-3 h-3 fill-rose-400 text-rose-400" />
                                            ))}
                                        </div>
                                        <span className="text-xs text-rose-700 font-medium">{j.team}</span>
                                    </div>
                                    <p className="text-sm text-rose-900 italic">"{j.reviewComment}"</p>
                                    <p className="text-xs text-rose-600 mt-2">- {j.client} ({j.brand})</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
