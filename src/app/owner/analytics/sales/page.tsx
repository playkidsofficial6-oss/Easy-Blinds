"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, ArrowRight, DollarSign, Filter } from "lucide-react";
import Link from "next/link";
import { MOCK_TEAM } from "@/lib/data/team";
import { MOCK_JOBS } from "@/lib/data/jobs";
import { cn } from "@/lib/utils";

export default function SalesAnalyticsPage() {
    const [dateRange, setDateRange] = useState<"week" | "month" | "quarter">("month");

    // Mock calculations for Sales Funnel (Requirement F)
    const funnelData = [
        { stage: "Enquiries", count: 124, conversion: 100 },
        { stage: "Quotes Sent", count: 86, conversion: 69 },
        { stage: "Sales Closed", count: 54, conversion: 63 }, // From Quotes
        { stage: "Fittings Scheduled", count: 54, conversion: 100 }, // From Sales
        { stage: "Reviews Received", count: 32, conversion: 59 }, // From Fittings
    ];

    // Mock Revenue Data per Fitter (Requirement F)
    const revenueByFitter = MOCK_TEAM.map(fitter => {
        const totalValue = MOCK_JOBS
            .filter(j => j.team === fitter.name && j.status === "Completed")
            .reduce((acc, curr) => acc + curr.value, 0);
        return { name: fitter.name, value: totalValue };
    }).sort((a, b) => b.value - a.value);

    // Mock Revenue per Location (Requirement F)
    const revenueByLocation = [
        { area: "Dubai Marina", value: 145000 },
        { area: "Jumeirah Park", value: 98000 },
        { area: "Downtown", value: 87500 },
        { area: "Arabian Ranches", value: 65000 },
    ];

    const totalRevenue = revenueByFitter.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-light tracking-tight text-neutral-900">
                        Sales <span className="font-semibold">Analytics</span>
                    </h1>
                    <p className="text-neutral-500 mt-2">Revenue, conversion funnels, and location insights.</p>
                </div>

                <div className="flex bg-white rounded-lg border border-neutral-200 p-1">
                    {(["week", "month", "quarter"] as const).map((range) => (
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

            {/* Top Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-neutral-900 text-white border-neutral-800">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-neutral-400 text-xs uppercase tracking-wider">Total Revenue</p>
                                <h3 className="text-4xl font-light">AED {(totalRevenue * 1.5).toLocaleString()}</h3>
                            </div>
                            <div className="p-3 bg-neutral-800 rounded-lg">
                                <DollarSign className="w-5 h-5 text-emerald-400" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
                            <TrendingUp className="w-3 h-3" />
                            <span>+18% vs last period</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-neutral-500 text-xs uppercase tracking-wider">Close Rate</p>
                                <h3 className="text-4xl font-light text-neutral-900">43%</h3>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-neutral-500">
                            Leads to Sales
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-neutral-500 text-xs uppercase tracking-wider">Active Deals</p>
                                <h3 className="text-4xl font-light text-neutral-900">28</h3>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-lg">
                                <Users className="w-5 h-5 text-amber-600" />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-neutral-500">
                            Quotes pending approval
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Requirement F: Conversion Funnel */}
            <Card>
                <CardHeader>
                    <CardTitle>Conversion Funnel</CardTitle>
                    <CardDescription>Customer journey from Enquiry to Review (Requirement F).</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-neutral-100 -z-10" />

                        {funnelData.map((step, index) => (
                            <div key={step.stage} className="flex items-center gap-6 group">
                                <div className={cn(
                                    "w-12 h-12 rounded-full border-4 flex items-center justify-center text-sm font-bold z-10 bg-white transition-all",
                                    index === 0 ? "border-purple-100 text-purple-600" :
                                        index === 1 ? "border-blue-100 text-blue-600" :
                                            index === 2 ? "border-emerald-100 text-emerald-600" :
                                                index === 3 ? "border-amber-100 text-amber-600" :
                                                    "border-neutral-100 text-neutral-600"
                                )}>
                                    {index + 1}
                                </div>
                                <div className="flex-1 bg-neutral-50 hover:bg-neutral-100 transition-colors rounded-lg p-4 border border-neutral-100">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-medium text-neutral-900">{step.stage}</p>
                                        <span className="text-lg font-semibold text-neutral-900">{step.count}</span>
                                    </div>
                                    <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full",
                                                index === 0 ? "bg-purple-500" :
                                                    index === 1 ? "bg-blue-500" :
                                                        index === 2 ? "bg-emerald-500" :
                                                            index === 3 ? "bg-amber-500" :
                                                                "bg-neutral-500"
                                            )}
                                            style={{ width: `${step.conversion}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-2 text-right">
                                        {index > 0 ? `${step.conversion}% conversion` : 'Top of Funnel'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Requirement F: Revenue per Fitter */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue by Fitter</CardTitle>
                        <CardDescription>Value of completed installations.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {revenueByFitter.map((item, i) => (
                                <div key={item.name} className="flex items-center gap-4">
                                    <div className="w-8 text-sm text-neutral-400 font-mono">#{i + 1}</div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-neutral-900">{item.name}</span>
                                            <span className="text-neutral-600">AED {item.value.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-emerald-600 h-full rounded-full"
                                                style={{ width: `${(item.value / revenueByFitter[0].value) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Requirement F: Revenue per Location */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Locations</CardTitle>
                        <CardDescription>High-value areas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {revenueByLocation.map((item, i) => (
                                <div key={item.area} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-700">
                                            {i + 1}
                                        </div>
                                        <span className="font-medium text-neutral-900">{item.area}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-neutral-700">AED {item.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
