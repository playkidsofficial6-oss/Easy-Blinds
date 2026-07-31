import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default function AreasPage() {
    const areas = [
        { name: "Dubai Marina", jobs: 24, revenue: 156000, conversion: 68, growth: 23, avgValue: 6500 },
        { name: "Downtown Dubai", jobs: 18, revenue: 132000, conversion: 72, growth: 18, avgValue: 7333 },
        { name: "Palm Jumeirah", jobs: 15, revenue: 189000, conversion: 75, growth: 31, avgValue: 12600 },
        { name: "Arabian Ranches", jobs: 12, revenue: 98000, conversion: 65, growth: 12, avgValue: 8167 },
        { name: "Jumeirah Park", jobs: 10, revenue: 87000, conversion: 62, growth: 8, avgValue: 8700 },
    ];

    return (
        <div className="space-y-12">
            <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold">
                    <div className="w-12 h-px bg-linear-to-r from-transparent via-amber-600 to-transparent"></div>
                    <span>Geographic Performance</span>
                </div>
                <h1 className="text-6xl font-light tracking-tight text-neutral-900">
                    Area
                    <span className="block font-semibold mt-1">Performance</span>
                </h1>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-4 gap-px bg-neutral-200">
                <Card className="border-0 rounded-none bg-white hover:bg-neutral-50 transition-colors">
                    <CardContent className="p-10">
                        <div className="text-sm uppercase tracking-wider text-neutral-500 mb-4">Total Areas</div>
                        <div className="text-6xl font-light text-neutral-900">{areas.length}</div>
                    </CardContent>
                </Card>

                <Card className="border-0 rounded-none bg-white hover:bg-neutral-50 transition-colors">
                    <CardContent className="p-10">
                        <div className="text-sm uppercase tracking-wider text-neutral-500 mb-4">Top Area</div>
                        <div className="text-3xl font-light text-neutral-900">Palm</div>
                        <div className="text-sm text-neutral-500 mt-2">By revenue</div>
                    </CardContent>
                </Card>

                <Card className="border-0 rounded-none bg-white hover:bg-neutral-50 transition-colors">
                    <CardContent className="p-10">
                        <div className="text-sm uppercase tracking-wider text-neutral-500 mb-4">Best Growth</div>
                        <div className="text-6xl font-light text-emerald-700">+31%</div>
                    </CardContent>
                </Card>

                <Card className="border-0 rounded-none bg-white hover:bg-neutral-50 transition-colors">
                    <CardContent className="p-10">
                        <div className="text-sm uppercase tracking-wider text-neutral-500 mb-4">Avg Conversion</div>
                        <div className="text-6xl font-light text-neutral-900">68%</div>
                    </CardContent>
                </Card>
            </div>

            {/* Area Breakdown */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-light text-neutral-900">Area Breakdown</h2>
                    <div className="h-px flex-1 bg-linear-to-r from-neutral-200 to-transparent"></div>
                </div>

                <div className="space-y-px bg-neutral-200">
                    {areas.map((area, i) => (
                        <div key={i} className="bg-white p-10 hover:bg-neutral-50 transition-colors">
                            <div className="flex items-start gap-8">
                                {/* Rank */}
                                <div className="w-16 h-16 bg-neutral-900 text-white rounded-none flex items-center justify-center text-2xl font-light">
                                    {i + 1}
                                </div>

                                {/* Area Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <MapPin className="w-6 h-6 text-neutral-400" />
                                        <h3 className="text-3xl font-light text-neutral-900">{area.name}</h3>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-5 gap-8">
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Jobs</div>
                                            <div className="text-3xl font-light text-neutral-900">{area.jobs}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Revenue</div>
                                            <div className="text-2xl font-light text-neutral-900">
                                                {(area.revenue / 1000).toFixed(0)}k
                                            </div>
                                            <div className="text-xs text-neutral-400">AED</div>
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Conversion</div>
                                            <div className="text-3xl font-light text-emerald-700">{area.conversion}%</div>
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Growth</div>
                                            <div className="text-3xl font-light text-neutral-900">+{area.growth}%</div>
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Avg Value</div>
                                            <div className="text-2xl font-light text-neutral-900">
                                                {(area.avgValue / 1000).toFixed(1)}k
                                            </div>
                                            <div className="text-xs text-neutral-400">AED</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
