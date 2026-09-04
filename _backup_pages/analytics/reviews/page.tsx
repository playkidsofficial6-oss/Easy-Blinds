"use client";

import { Card, CardContent, } from "@/components/ui/card";

import { MOCK_JOBS } from "@/lib/data/jobs";
import { Star, TrendingUp } from "lucide-react";

export default function OwnerReviewsPage() {
    // Aggregate Review Data
    const totalReviews = MOCK_JOBS.filter(j => j.reviewStatus === "received").length;


    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold mb-2">
                        <span className="w-8 h-px bg-amber-600"></span>
                        <span>Service Quality</span>
                    </div>
                    <h1 className="text-3xl font-light tracking-tight text-neutral-900">
                        Review <span className="font-semibold">Performance</span>
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-neutral-900 text-white border-0">
                    <CardContent className="p-8">
                        <div className="text-sm uppercase tracking-wider text-neutral-400 mb-4">Overall Rating</div>
                        <div className="flex items-end gap-3">
                            <div className="text-6xl font-light">4.8</div>
                            <div className="flex mb-2">
                                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                            </div>
                        </div>
                        <div className="mt-6 text-sm text-neutral-400">
                            Based on {totalReviews} verified reviews
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 bg-white">
                    <CardContent className="p-8">
                        <div className="text-sm uppercase tracking-wider text-neutral-500 mb-4">Review Velocity</div>
                        <div className="text-6xl font-light text-neutral-900">+12</div>
                        <div className="mt-6 flex items-center gap-2 text-sm text-emerald-600">
                            <TrendingUp className="w-4 h-4" />
                            <span>Up 15% this month</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed correlation charts would go here in a real implementation */}
        </div>
    );
}
