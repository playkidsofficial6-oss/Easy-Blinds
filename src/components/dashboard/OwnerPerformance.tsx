"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Target, TrendingUp, Clock, Award, Star } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { brands } from "@/lib/brands";

export default function PerformancePage() {
    const [selectedMonth, setSelectedMonth] = useState("December");
    const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>("all");

    // Mock data per brand
    const brandFitterData = {
        "easy-blinds": [
            { name: "Mr Alvin", reviews: 25, rate: 38, rating: 4.9, revenue: 165000, jobs: 42, efficiency: 96 },
            { name: "Mr Kashif", reviews: 18, rate: 35, rating: 4.8, revenue: 142000, jobs: 38, efficiency: 92 },
        ],
        "my-thread": [
            { name: "Mr Yameen", reviews: 15, rate: 32, rating: 4.7, revenue: 128000, jobs: 31, efficiency: 89 },
            { name: "Mr Ahmed", reviews: 12, rate: 30, rating: 4.6, revenue: 98000, jobs: 24, efficiency: 85 },
        ],
        "oceana": [
            { name: "Mr Hassan", reviews: 10, rate: 28, rating: 4.8, revenue: 110000, jobs: 28, efficiency: 91 },
            { name: "Mr Ravi", reviews: 8, rate: 25, rating: 4.7, revenue: 85000, jobs: 20, efficiency: 88 },
        ],
        "hillarys": [
            { name: "Mr David", reviews: 7, rate: 22, rating: 4.5, revenue: 75000, jobs: 18, efficiency: 84 },
        ]
    };

    // Aggregate all fitters for "all brands"
    const allFitters = Object.values(brandFitterData).flat();

    const fitters = selectedBrandFilter === "all"
        ? allFitters.sort((a, b) => b.reviews - a.reviews)
        : brandFitterData[selectedBrandFilter as keyof typeof brandFitterData];

    return (
        <div className="space-y-12">
            <div className="flex items-end justify-between">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold">
                        <div className="w-12 h-px bg-linear-to-r from-transparent via-amber-600 to-transparent"></div>
                        <span>Performance</span>
                    </div>
                    <h1 className="text-6xl font-light tracking-tight text-neutral-900">
                        Performance
                        <span className="block font-semibold mt-1">Metrics</span>
                    </h1>
                </div>

                <div className="w-64">
                    <label className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">Filter by Brand</label>
                    <Select value={selectedBrandFilter} onValueChange={setSelectedBrandFilter}>
                        <SelectTrigger className="bg-white border-neutral-200">
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

            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-px bg-neutral-200">
                <Card className="border-0 rounded-none bg-white hover:bg-neutral-50 transition-colors">
                    <CardContent className="p-10">
                        <div className="w-12 h-12 mb-6 border border-neutral-200 rounded-none flex items-center justify-center">
                            <Target className="w-6 h-6 text-neutral-600" />
                        </div>
                        <div className="text-xs uppercase tracking-wider text-neutral-500 mb-3">Conversion Rate</div>
                        <div className="text-6xl font-light text-neutral-900">68%</div>
                        <div className="text-sm text-neutral-400 mt-2">Measurement → Sale</div>
                    </CardContent>
                </Card>

                <Card className="border-0 rounded-none bg-white hover:bg-neutral-50 transition-colors">
                    <CardContent className="p-10">
                        <div className="w-12 h-12 mb-6 border border-neutral-200 rounded-none flex items-center justify-center">
                            <Clock className="w-6 h-6 text-neutral-600" />
                        </div>
                        <div className="text-xs uppercase tracking-wider text-neutral-500 mb-3">Avg Completion</div>
                        <div className="text-6xl font-light text-neutral-900">5.2</div>
                        <div className="text-sm text-neutral-400 mt-2">days</div>
                    </CardContent>
                </Card>

                <Card className="border-0 rounded-none bg-white hover:bg-neutral-50 transition-colors">
                    <CardContent className="p-10">
                        <div className="w-12 h-12 mb-6 border border-neutral-200 rounded-none flex items-center justify-center">
                            <Award className="w-6 h-6 text-neutral-600" />
                        </div>
                        <div className="text-xs uppercase tracking-wider text-neutral-500 mb-3">Customer Rating</div>
                        <div className="text-6xl font-light text-neutral-900">4.8</div>
                        <div className="text-sm text-neutral-400 mt-2">out of 5</div>
                    </CardContent>
                </Card>

                <Card className="border-0 rounded-none bg-white hover:bg-neutral-50 transition-colors">
                    <CardContent className="p-10">
                        <div className="w-12 h-12 mb-6 border border-neutral-200 rounded-none flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-neutral-600" />
                        </div>
                        <div className="text-xs uppercase tracking-wider text-neutral-500 mb-3">Growth Rate</div>
                        <div className="text-6xl font-light text-emerald-700">+23%</div>
                        <div className="text-sm text-neutral-400 mt-2">vs last month</div>
                    </CardContent>
                </Card>
            </div>

            {/* Team Efficiency & Revenue - NEW SECTION */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-light text-neutral-900">Team Efficiency & Revenue</h2>
                        <div className="h-px w-24 bg-linear-to-r from-neutral-200 to-transparent"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-px bg-neutral-200">
                    <div className="bg-white p-6 grid grid-cols-6 gap-4 text-xs uppercase tracking-wider text-neutral-500 font-medium">
                        <div className="col-span-2">Team Member</div>
                        <div className="text-right">Revenue</div>
                        <div className="text-right">Jobs</div>
                        <div className="text-right">Efficiency</div>
                        <div className="text-right">Rating</div>
                    </div>
                    {fitters.map((fitter, i) => (
                        <div key={i} className="bg-white p-6 grid grid-cols-6 gap-4 items-center hover:bg-neutral-50 transition-colors group">
                            <div className="col-span-2 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-900 font-medium text-sm">
                                    {fitter.name.split(' ')[1]?.[0] || fitter.name[0]}
                                </div>
                                <span className="text-lg font-light text-neutral-900">{fitter.name}</span>
                            </div>
                            <div className="text-right text-neutral-900 font-light text-lg">
                                AED {(fitter.revenue / 1000).toFixed(1)}k
                            </div>
                            <div className="text-right text-neutral-900 font-light text-lg">
                                {fitter.jobs}
                            </div>
                            <div className="text-right font-light text-lg">
                                <span className={fitter.efficiency >= 90 ? "text-emerald-600" : "text-amber-600"}>
                                    {fitter.efficiency}%
                                </span>
                            </div>
                            <div className="text-right flex justify-end items-center gap-1">
                                <span className="font-medium">{fitter.rating}</span>
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Review Performance */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-light text-neutral-900">Review Performance</h2>
                        <div className="h-px w-24 bg-linear-to-r from-neutral-200 to-transparent"></div>
                    </div>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[180px] bg-white border-neutral-200">
                            <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="December">December 2023</SelectItem>
                            <SelectItem value="November">November 2023</SelectItem>
                            <SelectItem value="October">October 2023</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-3 gap-px bg-neutral-200">
                    {fitters.map((fitter, i) => (
                        <div key={i} className="bg-white p-10 hover:bg-neutral-50 transition-colors">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-medium text-neutral-900">{fitter.name}</h3>
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                    <span className="text-sm font-medium">{fitter.rating}</span>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Reviews</div>
                                    <div className="text-4xl font-light text-neutral-900">{fitter.reviews}</div>
                                </div>
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Review Rate</div>
                                    <div className="text-3xl font-light text-neutral-900">{fitter.rate}%</div>
                                    <div className="h-1.5 bg-neutral-100 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full bg-neutral-900"
                                            style={{ width: `${fitter.rate}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Monthly Comparison */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-light text-neutral-900">Monthly Comparison</h2>
                        <div className="h-px w-24 bg-linear-to-r from-neutral-200 to-transparent"></div>
                    </div>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[180px] bg-white border-neutral-200">
                            <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="December">December 2023</SelectItem>
                            <SelectItem value="November">November 2023</SelectItem>
                            <SelectItem value="October">October 2023</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-px bg-neutral-200">
                    {[
                        { month: "December", revenue: 485000, jobs: 62, growth: 23 },
                        { month: "November", revenue: 394000, jobs: 54, growth: 18 },
                        { month: "October", revenue: 334000, jobs: 48, growth: 12 },
                        { month: "September", revenue: 298000, jobs: 42, growth: 8 },
                    ].filter(item => selectedMonth === "December" ? true : item.month === selectedMonth).map((item, i) => (
                        <div key={i} className="bg-white p-10 hover:bg-neutral-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-12">
                                    <div className="w-32">
                                        <h3 className="text-2xl font-light text-neutral-900">{item.month}</h3>
                                    </div>
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Revenue</div>
                                        <div className="text-3xl font-light text-neutral-900">
                                            AED {(item.revenue / 1000).toFixed(0)}k
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Jobs</div>
                                        <div className="text-3xl font-light text-neutral-900">{item.jobs}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Growth</div>
                                        <div className="text-3xl font-light text-emerald-700">+{item.growth}%</div>
                                    </div>
                                </div>
                                {item.month === "December" && (
                                    <div className="px-4 py-2 bg-amber-600 text-white text-sm uppercase tracking-wider">
                                        Current
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Goals */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-light text-neutral-900">Goals & Targets</h2>
                    <div className="h-px flex-1 bg-linear-to-r from-neutral-200 to-transparent"></div>
                </div>

                <div className="grid grid-cols-2 gap-px bg-neutral-200">
                    {[
                        { goal: "Monthly Revenue", target: 500000, current: 485000, percent: 97 },
                        { goal: "Customer Acquisition", target: 100, current: 87, percent: 87 },
                        { goal: "Conversion Rate", target: 75, current: 68, percent: 91 },
                        { goal: "Team Efficiency", target: 4.5, current: 5.2, percent: 87 },
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-10 hover:bg-neutral-50 transition-colors">
                            <h3 className="text-2xl font-light text-neutral-900 mb-6">{item.goal}</h3>
                            <div className="flex items-end justify-between mb-4">
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Current</div>
                                    <div className="text-4xl font-light text-neutral-900">
                                        {item.goal.includes('Revenue') ? `AED ${(item.current / 1000).toFixed(0)}k` : item.current}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Target</div>
                                    <div className="text-2xl font-light text-neutral-500">
                                        {item.goal.includes('Revenue') ? `${(item.target / 1000).toFixed(0)}k` : item.target}
                                    </div>
                                </div>
                            </div>
                            <div className="h-3 bg-neutral-100 rounded-none overflow-hidden">
                                <div
                                    className="h-full bg-emerald-600 transition-all duration-500"
                                    style={{ width: `${item.percent}%` }}
                                ></div>
                            </div>
                            <div className="mt-2 text-right text-sm text-neutral-500">{item.percent}% achieved</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
