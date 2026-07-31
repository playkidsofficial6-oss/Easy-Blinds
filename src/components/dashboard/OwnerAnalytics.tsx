import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, TrendingUp, DollarSign, Target } from "lucide-react";

export default function AnalyticsPage() {
    return (
        <div className="space-y-12">
            <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold">
                    <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
                    <span>Analytics</span>
                </div>
                <h1 className="text-6xl font-light tracking-tight text-neutral-900">
                    Detailed
                    <span className="block font-semibold mt-1">Analytics</span>
                </h1>
            </div>

            {/* Revenue Breakdown */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-light text-neutral-900">Revenue Breakdown</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-neutral-200 to-transparent"></div>
                </div>

                <div className="grid grid-cols-3 gap-px bg-neutral-200">
                    <Card className="border-0 rounded-none bg-white hover:bg-neutral-50 transition-colors">
                        <CardContent className="p-12">
                            <div className="flex items-center gap-2 mb-6">
                                <DollarSign className="w-6 h-6 text-neutral-400" />
                                <span className="text-sm uppercase tracking-wider text-neutral-500">This Month</span>
                            </div>
                            <div className="text-6xl font-light text-neutral-900 mb-3">485k</div>
                            <div className="flex items-center gap-2 text-emerald-700">
                                <ArrowUp className="w-4 h-4" />
                                <span className="text-sm font-medium">+23% vs last month</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 rounded-none bg-white hover:bg-neutral-50 transition-colors">
                        <CardContent className="p-12">
                            <div className="flex items-center gap-2 mb-6">
                                <TrendingUp className="w-6 h-6 text-neutral-400" />
                                <span className="text-sm uppercase tracking-wider text-neutral-500">Average Deal</span>
                            </div>
                            <div className="text-6xl font-light text-neutral-900 mb-3">7.8k</div>
                            <div className="text-sm text-neutral-500">AED per project</div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 rounded-none bg-white hover:bg-neutral-50 transition-colors">
                        <CardContent className="p-12">
                            <div className="flex items-center gap-2 mb-6">
                                <Target className="w-6 h-6 text-neutral-400" />
                                <span className="text-sm uppercase tracking-wider text-neutral-500">Goal Progress</span>
                            </div>
                            <div className="text-6xl font-light text-neutral-900 mb-3">87%</div>
                            <div className="text-sm text-neutral-500">On track for target</div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Conversion Funnel */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-light text-neutral-900">Conversion Funnel</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-neutral-200 to-transparent"></div>
                </div>

                <div className="space-y-px bg-neutral-200">
                    {[
                        { stage: "Leads", count: 156, percent: 100, color: "bg-blue-500" },
                        { stage: "Measurements", count: 98, percent: 63, color: "bg-purple-500" },
                        { stage: "Quotes Sent", count: 76, percent: 49, color: "bg-amber-500" },
                        { stage: "Approved", count: 54, percent: 35, color: "bg-emerald-500" },
                        { stage: "Installed", count: 62, percent: 40, color: "bg-green-600" },
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-8 hover:bg-neutral-50 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-6">
                                    <span className="text-2xl font-light text-neutral-900 w-48">{item.stage}</span>
                                    <span className="text-4xl font-light text-neutral-900">{item.count}</span>
                                </div>
                                <span className="text-2xl font-light text-neutral-500">{item.percent}%</span>
                            </div>
                            <div className="h-3 bg-neutral-100 rounded-none overflow-hidden">
                                <div
                                    className={`h-full ${item.color} transition-all duration-500`}
                                    style={{ width: `${item.percent}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Product Performance */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-light text-neutral-900">Product Performance</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-neutral-200 to-transparent"></div>
                </div>

                <div className="grid grid-cols-2 gap-px bg-neutral-200">
                    {[
                        { name: "Blackout Curtains", sales: 42, revenue: 156000 },
                        { name: "Sheer Curtains", sales: 28, revenue: 98000 },
                        { name: "Roller Blinds", sales: 18, revenue: 87000 },
                        { name: "Wooden Blinds", sales: 12, revenue: 65000 },
                    ].map((product, i) => (
                        <div key={i} className="bg-white p-10 hover:bg-neutral-50 transition-colors">
                            <h3 className="text-2xl font-light text-neutral-900 mb-4">{product.name}</h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-neutral-500 mb-1">Sales</p>
                                    <p className="text-4xl font-light text-neutral-900">{product.sales}%</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-neutral-500 mb-1">Revenue</p>
                                    <p className="text-2xl font-light text-neutral-900">AED {(product.revenue / 1000).toFixed(0)}k</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
