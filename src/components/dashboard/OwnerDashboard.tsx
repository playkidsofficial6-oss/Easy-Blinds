"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    TrendingUp,
    DollarSign,
    Users,
    CheckCircle,
    MapPin,
    Award,
    ArrowUp,
    ArrowDown,
    FileText,
    Star,
    Hammer,
    Target,
    Clock,
} from "lucide-react";
import { brands } from "@/lib/brands";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function OwnerOverviewPage() {
    const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>("all");
    // Mock Data for each brand
    const brandPerformanceData = {
        "easy-blinds": {
            revenue: 185000,
            leads: 65,
            measurements: 42,
            quotesSent: 35,
            quotesApproved: 22,
            installations: 28,
            activeJobs: 12,
            conversion: 63,
            growth: 12
        },
        "my-thread": {
            revenue: 124000,
            leads: 45,
            measurements: 28,
            quotesSent: 22,
            quotesApproved: 15,
            installations: 18,
            activeJobs: 8,
            conversion: 68,
            growth: 18
        },
        "oceana": {
            revenue: 98000,
            leads: 32,
            measurements: 18,
            quotesSent: 14,
            quotesApproved: 10,
            installations: 12,
            activeJobs: 6,
            conversion: 71,
            growth: 24
        },
        "hillarys": {
            revenue: 78000,
            leads: 14,
            measurements: 10,
            quotesSent: 5,
            quotesApproved: 7,
            installations: 4,
            activeJobs: 5,
            conversion: 70,
            growth: 8
        }
    };

    // Calculate Aggregated Data (Combined)
    const aggregatedData = Object.values(brandPerformanceData).reduce((acc, curr) => ({
        revenue: acc.revenue + curr.revenue,
        leads: acc.leads + curr.leads,
        measurements: acc.measurements + curr.measurements,
        quotesSent: acc.quotesSent + curr.quotesSent,
        quotesApproved: acc.quotesApproved + curr.quotesApproved,
        installations: acc.installations + curr.installations,
        activeJobs: acc.activeJobs + curr.activeJobs,
        // Weighted average for percentages could be better, but simple average for mock is fine
        conversion: Math.round((acc.conversion + curr.conversion) / 2),
        growth: Math.round((acc.growth + curr.growth) / 2)
    }));

    // Fix average calculation for initial reduce step
    aggregatedData.conversion = Math.round(Object.values(brandPerformanceData).reduce((acc, curr) => acc + curr.conversion, 0) / 4);
    aggregatedData.growth = Math.round(Object.values(brandPerformanceData).reduce((acc, curr) => acc + curr.growth, 0) / 4);

    // Get current data based on filter
    const currentData = selectedBrandFilter === "all"
        ? aggregatedData
        : brandPerformanceData[selectedBrandFilter as keyof typeof brandPerformanceData];

    const kpiData = {
        today: {
            leads: Math.round(currentData.leads / 30),
            measurements: Math.round(currentData.measurements / 30),
            quotesSent: Math.round(currentData.quotesSent / 30),
            quotesApproved: Math.round(currentData.quotesApproved / 30),
            installations: Math.round(currentData.installations / 30),
            revenue: Math.round(currentData.revenue / 30),
            deposit: Math.round(currentData.revenue / 30 * 0.4),
            outstanding: Math.round(currentData.revenue / 30 * 0.6)
        },
        week: {
            leads: Math.round(currentData.leads / 4),
            measurements: Math.round(currentData.measurements / 4),
            quotesSent: Math.round(currentData.quotesSent / 4),
            quotesApproved: Math.round(currentData.quotesApproved / 4),
            installations: Math.round(currentData.installations / 4),
            revenue: Math.round(currentData.revenue / 4),
            deposit: Math.round(currentData.revenue / 4 * 0.4),
            outstanding: Math.round(currentData.revenue / 4 * 0.6)
        },
        month: {
            leads: currentData.leads,
            measurements: currentData.measurements,
            quotesSent: currentData.quotesSent,
            quotesApproved: currentData.quotesApproved,
            installations: currentData.installations,
            revenue: currentData.revenue,
            deposit: Math.round(currentData.revenue * 0.4),
            outstanding: Math.round(currentData.revenue * 0.6)
        },
    };

    const activeJobs = [
        { client: "Ahmed Al Mansoori", area: "Jumeirah Park", status: "In Progress", value: 12500 },
        { client: "Sarah Smith", area: "Dubai Marina", status: "Scheduled", value: 8300 },
        { client: "Emaar Properties", area: "Downtown Dubai", status: "Ready", value: 25600 },
    ];

    const teamPerformance = [
        { name: "John Doe", completed: 124, revenue: 456000 },
        { name: "Sarah Williams", completed: 87, revenue: 324000 },
        { name: "Mike Johnson", completed: 98, revenue: 389000 },
    ];

    const areaPerformance = [
        { area: "Dubai Marina", jobs: 24, revenue: 156000, conversion: 68 },
        { area: "Downtown Dubai", jobs: 18, revenue: 132000, conversion: 72 },
        { area: "Palm Jumeirah", jobs: 15, revenue: 189000, conversion: 75 },
        { area: "Arabian Ranches", jobs: 12, revenue: 98000, conversion: 65 },
    ];

    return (
        <div className="space-y-16">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold">
                        <div className="w-12 h-px bg-linear-to-r from-transparent via-amber-600 to-transparent"></div>
                        <span>Business Intelligence</span>
                    </div>
                    <h1 className="text-6xl font-light tracking-tight text-neutral-900 dark:text-white">
                        Real-Time
                        <span className="block font-semibold mt-1">Insights</span>
                    </h1>
                </div>

                <div className="w-64">
                    <label className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">Filter by Brand</label>
                    <Select value={selectedBrandFilter} onValueChange={setSelectedBrandFilter}>
                        <SelectTrigger className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                            <SelectValue placeholder="Select Brand" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Brands (Combined)</SelectItem>
                            {brands.map(brand => (
                                <SelectItem key={brand.id} value={brand.id}>
                                    {brand.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* KPI Tabs */}
            <Tabs defaultValue="month" className="space-y-12">
                <TabsList className="bg-transparent border-b border-neutral-200 dark:border-neutral-800 rounded-none h-auto p-0 w-full justify-start">
                    <TabsTrigger
                        value="today"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-neutral-900 dark:data-[state=active]:border-white data-[state=active]:bg-transparent px-8 py-4 text-base font-light data-[state=active]:font-medium data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white text-neutral-500 dark:text-neutral-400"
                    >
                        Today
                    </TabsTrigger>
                    <TabsTrigger
                        value="week"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-neutral-900 dark:data-[state=active]:border-white data-[state=active]:bg-transparent px-8 py-4 text-base font-light data-[state=active]:font-medium data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white text-neutral-500 dark:text-neutral-400"
                    >
                        This Week
                    </TabsTrigger>
                    <TabsTrigger
                        value="month"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-neutral-900 dark:data-[state=active]:border-white data-[state=active]:bg-transparent px-8 py-4 text-base font-light data-[state=active]:font-medium data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white text-neutral-500 dark:text-neutral-400"
                    >
                        This Month
                    </TabsTrigger>
                </TabsList>

                {Object.entries(kpiData).map(([period, data]) => (
                    <TabsContent key={period} value={period} className="space-y-12">
                        {/* Revenue Highlight */}
                        <Card className="border-0 bg-neutral-900 dark:bg-neutral-800 text-white">
                            <CardContent className="p-12">
                                <div className="grid grid-cols-3 gap-12">
                                    {/* Total Revenue */}
                                    <div className="flex items-end justify-between border-r border-neutral-800 pr-12">
                                        <div>
                                            <div className="text-sm uppercase tracking-[0.2em] text-neutral-400 mb-6 font-medium">Total Revenue</div>
                                            <div className="text-5xl font-light mb-4">AED {data.revenue.toLocaleString()}</div>
                                            <div className="flex items-center gap-2 text-neutral-400">
                                                <ArrowUp className="w-4 h-4" />
                                                <span className="text-sm">+18% vs last</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Deposit */}
                                    <div className="flex items-end justify-between border-r border-neutral-800 pr-12">
                                        <div>
                                            <div className="text-sm uppercase tracking-[0.2em] text-neutral-400 mb-6 font-medium">Deposit Collected</div>
                                            <div className="text-5xl font-light mb-4 text-emerald-400">AED {data.deposit.toLocaleString()}</div>
                                            <div className="flex items-center gap-2 text-neutral-400">
                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                <span className="text-sm">Secured</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Outstanding */}
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <div className="text-sm uppercase tracking-[0.2em] text-neutral-400 mb-6 font-medium">Outstanding</div>
                                            <div className="text-5xl font-light mb-4 text-amber-400">AED {data.outstanding.toLocaleString()}</div>
                                            <div className="flex items-center gap-2 text-neutral-400">
                                                <Clock className="w-4 h-4 text-amber-500" />
                                                <span className="text-sm">Pending Collection</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-5 gap-px bg-neutral-200 dark:bg-neutral-800">
                            <Card className="border-0 rounded-none bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                                <CardContent className="p-10">
                                    <div className="w-12 h-12 mb-6 border border-neutral-200 dark:border-neutral-800 rounded-none flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                                    </div>
                                    <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">Leads</div>
                                    <div className="text-5xl font-light text-neutral-900 dark:text-white">{data.leads}</div>
                                    <div className="flex items-center gap-1 text-xs text-emerald-700 mt-3">
                                        <ArrowUp className="w-3 h-3" />
                                        <span>+12%</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 rounded-none bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                                <CardContent className="p-10">
                                    <div className="w-12 h-12 mb-6 border border-neutral-200 dark:border-neutral-800 rounded-none flex items-center justify-center">
                                        <Users className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                                    </div>
                                    <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">Measurements</div>
                                    <div className="text-5xl font-light text-neutral-900 dark:text-white">{data.measurements}</div>
                                    <div className="flex items-center gap-1 text-xs text-emerald-700 mt-3">
                                        <ArrowUp className="w-3 h-3" />
                                        <span>+8%</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 rounded-none bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition- colors cursor-pointer">
                                <CardContent className="p-10">
                                    <div className="w-12 h-12 mb-6 border border-neutral-200 dark:border-neutral-800 rounded-none flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                                    </div>
                                    <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">Quotes</div>
                                    <div className="text-5xl font-light text-neutral-900 dark:text-white">{data.quotesSent}</div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 rounded-none bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                                <CardContent className="p-10">
                                    <div className="w-12 h-12 mb-6 border border-neutral-200 dark:border-neutral-800 rounded-none flex items-center justify-center">
                                        <CheckCircle className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                                    </div>
                                    <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">Approved</div>
                                    <div className="text-5xl font-light text-neutral-900 dark:text-white">{data.quotesApproved}</div>
                                    <div className="flex items-center gap-1 text-xs text-emerald-700 mt-3">
                                        <ArrowUp className="w-3 h-3" />
                                        <span>+15%</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 rounded-none bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                                <CardContent className="p-10">
                                    <div className="w-12 h-12 mb-6 border border-neutral-200 dark:border-neutral-800 rounded-none flex items-center justify-center">
                                        <Hammer className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                                    </div>
                                    <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">Installs</div>
                                    <div className="text-5xl font-light text-neutral-900 dark:text-white">{data.installations}</div>
                                    <div className="flex items-center gap-1 text-xs text-red-700 mt-3">
                                        <ArrowDown className="w-3 h-3" />
                                        <span>-3%</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            {/* Brand Performance Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-light text-neutral-900 dark:text-white">Brand Performance</h2>
                    <div className="h-px flex-1 bg-linear-to-r from-neutral-200 dark:from-neutral-800 to-transparent"></div>
                </div>

                <div className="grid grid-cols-4 gap-6">
                    {brands.map((brand) => {
                        const data = brandPerformanceData[brand.id as keyof typeof brandPerformanceData];
                        return (
                            <Card key={brand.id} className={cn("border-2 transition-all duration-300 hover:shadow-lg", brand.styles.border)}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium", brand.styles.badge)}>
                                            {brand.initials}
                                        </div>
                                        <div className={cn("px-2 py-1 rounded text-xs font-medium", brand.styles.badge.replace("text-", "bg-").replace("bg-", "bg-opacity-10 text-"))}>
                                            +{data.growth}%
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">{brand.name}</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Revenue</div>
                                            <div className="text-2xl font-light">AED {(data.revenue / 1000).toFixed(1)}k</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Active</div>
                                                <div className="text-xl font-light">{data.activeJobs} Jobs</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Conv.</div>
                                                <div className="text-xl font-light">{data.conversion}%</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Active Jobs */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-light text-neutral-900 dark:text-white">Active Jobs</h2>
                    <div className="h-px flex-1 bg-linear-to-r from-neutral-200 dark:from-neutral-800 to-transparent"></div>
                </div>

                <div className="space-y-px bg-neutral-200 dark:bg-neutral-800">
                    {activeJobs.map((job, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 p-10 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-light text-neutral-900 dark:text-white mb-2">{job.client}</h3>
                                    <div className="flex items-center gap-6 text-sm text-neutral-500 dark:text-neutral-400">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            <span>{job.area}</span>
                                        </div>
                                        <span className="text-neutral-300">•</span>
                                        <span>{job.status}</span>
                                        <span className="text-neutral-300 dark:text-neutral-600">•</span>
                                        <span className="font-medium text-neutral-900 dark:text-white">AED {job.value.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-2 gap-12">
                {/* Team Performance */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-light text-neutral-900 dark:text-white">Team Performance</h2>
                        <div className="h-px flex-1 bg-linear-to-r from-neutral-200 dark:from-neutral-800 to-transparent"></div>
                    </div>

                    <div className="space-y-px bg-neutral-200 dark:bg-neutral-800">
                        {teamPerformance.map((member, i) => (
                            <div key={i} className="bg-white dark:bg-neutral-900 p-8 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-8">
                                <div className={`w-16 h-16 ${i === 0 ? 'bg-amber-600' : i === 1 ? 'bg-neutral-400' : 'bg-amber-800'} text-white rounded-none flex items-center justify-center text-2xl font-light`}>
                                    {i + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="text-lg font-light text-neutral-900 dark:text-white mb-1">{member.name}</p>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{member.completed} jobs completed</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-light text-neutral-900 dark:text-white">AED {(member.revenue / 1000).toFixed(0)}k</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Area Performance */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-light text-neutral-900 dark:text-white">Top Areas</h2>
                        <div className="h-px flex-1 bg-linear-to-r from-neutral-200 dark:from-neutral-800 to-transparent"></div>
                    </div>

                    <div className="space-y-px bg-neutral-200 dark:bg-neutral-800">
                        {areaPerformance.map((area, i) => (
                            <div key={i} className="bg-white dark:bg-neutral-900 p-8 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-lg font-light text-neutral-900 dark:text-white">{area.area}</p>
                                    <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-medium">
                                        {area.conversion}% conversion
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-neutral-500 dark:text-neutral-400">{area.jobs} jobs</span>
                                    <span className="font-medium text-neutral-900 dark:text-white">AED {area.revenue.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Business Insights */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-light text-neutral-900 dark:text-white">Business Insights</h2>
                    <div className="h-px flex-1 bg-linear-to-r from-neutral-200 dark:from-neutral-800 to-transparent"></div>
                </div>

                <div className="grid grid-cols-4 gap-px bg-neutral-200 dark:bg-neutral-800">
                    <Card className="border-0 rounded-none bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                        <CardContent className="p-10">
                            <div className="w-12 h-12 mb-6 border border-neutral-200 dark:border-neutral-800 rounded-none flex items-center justify-center">
                                <Target className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                            </div>
                            <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">Conversion</div>
                            <div className="text-5xl font-light text-neutral-900 dark:text-white mb-2">68%</div>
                            <div className="text-xs text-neutral-400">Measurement → Sale</div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 rounded-none bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                        <CardContent className="p-10">
                            <div className="w-12 h-12 mb-6 border border-neutral-200 dark:border-neutral-800 rounded-none flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                            </div>
                            <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">Avg Value</div>
                            <div className="text-5xl font-light text-neutral-900 dark:text-white mb-2">7.8k</div>
                            <div className="text-xs text-neutral-400">AED per job</div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 rounded-none bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                        <CardContent className="p-10">
                            <div className="w-12 h-12 mb-6 border border-neutral-200 dark:border-neutral-800 rounded-none flex items-center justify-center">
                                <Clock className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                            </div>
                            <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">Timeline</div>
                            <div className="text-5xl font-light text-neutral-900 dark:text-white mb-2">5.2</div>
                            <div className="text-xs text-neutral-400">days average</div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 rounded-none bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                        <CardContent className="p-10">
                            <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">Top Product</div>
                            <div className="text-3xl font-light text-neutral-900 dark:text-white mb-2">Blackout</div>
                            <div className="text-xs text-neutral-400">42% of sales</div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            {/* Strategic Performance Analysis (Programmatic) */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-light text-neutral-900 dark:text-white">Strategic Analysis</h2>
                    <div className="h-px flex-1 bg-linear-to-r from-neutral-200 dark:from-neutral-800 to-transparent"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Top Performer Insight - Dynamic */}
                    {(() => {
                        // Calculate Top Performer based on Revenue
                        const topPerformer = teamPerformance.reduce((prev, current) => (prev.revenue > current.revenue) ? prev : current);

                        return (
                            <Card className="border-0 bg-neutral-900 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Award className="w-48 h-48" />
                                </div>
                                <CardContent className="p-10 relative z-10">
                                    <div className="text-sm uppercase tracking-[0.2em] text-neutral-400 mb-6 font-medium">Top Performer</div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                            {topPerformer.name.split(" ")[1]?.[0] || "A"}
                                        </div>
                                        <div>
                                            <div className="text-2xl font-light">{topPerformer.name}</div>
                                            <div className="flex items-center gap-1 text-amber-400 text-sm">
                                                <Star className="w-4 h-4 fill-current" />
                                                <span>5.0 Rating</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-neutral-300 font-light mb-6">
                                        Contributed <span className="text-white font-medium">AED {(topPerformer.revenue / 1000).toFixed(0)}k</span> in revenue this month.
                                    </p>
                                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-400">
                                        <TrendingUp className="w-4 h-4" />
                                        Highest Revenue
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })()}

                    {/* Correlation Insight - Programmatic Logic */}
                    <Card className="border-0 bg-white dark:bg-neutral-900">
                        <CardContent className="p-10 h-full flex flex-col justify-between">
                            <div>
                                <div className="text-sm uppercase tracking-[0.2em] text-neutral-500 font-medium mb-6">Correlation Data</div>
                                <h3 className="text-2xl font-light text-neutral-900 dark:text-white mb-4">
                                    Review Impact
                                </h3>
                                <p className="text-neutral-500 font-light">
                                    Fitters with <span className="text-neutral-900 dark:text-white font-medium">4.8+ rating</span> have
                                    <span className="text-emerald-600 font-medium"> 22% higher</span> quote approval rates on future jobs.
                                </p>
                            </div>
                            <div className="mt-8 pt-8 border-t border-neutral-100 dark:border-neutral-800">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-neutral-500">Rating &gt; 4.8</span>
                                    <span className="text-emerald-600 font-medium">72% Close Rate</span>
                                </div>
                                <div className="flex justify-between items-center text-sm mt-2">
                                    <span className="text-neutral-500">Rating &lt; 4.0</span>
                                    <span className="text-neutral-400">50% Close Rate</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Risk Alert - Dynamic */}
                    {(() => {
                        // Mock identifying a low performer or high gap
                        const riskPerformer = teamPerformance.reduce((prev, current) => (prev.completed < current.completed) ? prev : current);

                        return (
                            <Card className="border-0 bg-amber-50 dark:bg-amber-900/10">
                                <CardContent className="p-10 h-full flex flex-col justify-between">
                                    <div>
                                        <div className="text-sm uppercase tracking-[0.2em] text-amber-700/60 dark:text-amber-500 font-medium mb-6">Performance Risk</div>
                                        <h3 className="text-2xl font-light text-amber-900 dark:text-amber-100 mb-4">
                                            Volume Gap
                                        </h3>
                                        <p className="text-amber-800/80 dark:text-amber-200/80 font-light">
                                            <span className="font-medium">{riskPerformer.name}</span> has lower volume ({riskPerformer.completed} jobs) compared to team avg.
                                        </p>
                                    </div>
                                    <div className="mt-8">
                                        <div className="w-full bg-amber-200 dark:bg-amber-900/30 h-2 rounded-full overflow-hidden">
                                            <div className="bg-amber-500 h-full w-[12%]"></div>
                                        </div>
                                        <div className="flex justify-between text-xs text-amber-700/60 dark:text-amber-400 mt-2 uppercase tracking-wide">
                                            <span>Current: {riskPerformer.completed}</span>
                                            <span>Target: 100</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
