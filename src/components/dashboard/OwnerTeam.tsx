import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { getReviewStats } from "@/lib/data/reviews";

export default function TeamPage() {
    const teamMembers = [
        {
            name: "Mr Alvin",
            role: "Senior Measurer",
            completed: 124,
            revenue: 456000,
            rating: 4.9,
            thisWeek: 12,
            avgTime: 4.2,
            conversion: 72,
            reviews: 45,
        },
        {
            name: "Mr Kashif",
            role: "Measurer",
            completed: 87,
            revenue: 324000,
            rating: 4.8,
            thisWeek: 8,
            avgTime: 4.8,
            conversion: 68,
            reviews: 32,
        },
        {
            name: "Mr Yameen",
            role: "Installation Lead",
            completed: 98,
            revenue: 389000,
            rating: 4.7,
            thisWeek: 10,
            avgTime: 5.1,
            conversion: 65,
            reviews: 28,
        },
    ];

    return (
        <div className="space-y-12">
            <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold">
                    <div className="w-12 h-px bg-linear-to-r from-transparent via-amber-600 to-transparent"></div>
                    <span>Team</span>
                </div>
                <h1 className="text-6xl font-light tracking-tight text-neutral-900 dark:text-white">
                    Team
                    <span className="block font-semibold mt-1">Management</span>
                </h1>
            </div>

            {/* Team Overview */}
            <div className="grid grid-cols-3 gap-px bg-neutral-200 dark:bg-neutral-800">
                <Card className="border-0 rounded-none bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    <CardContent className="p-10">
                        <div className="text-sm uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">Active Staff</div>
                        <div className="text-6xl font-light text-neutral-900 dark:text-white">3</div>
                    </CardContent>
                </Card>

                <Card className="border-0 rounded-none bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    <CardContent className="p-10">
                        <div className="text-sm uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">Total Jobs</div>
                        <div className="text-6xl font-light text-neutral-900 dark:text-white">309</div>
                    </CardContent>
                </Card>

                <Card className="border-0 rounded-none bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    <CardContent className="p-10">
                        <div className="text-sm uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">Avg Rating</div>
                        <div className="text-6xl font-light text-neutral-900 dark:text-white flex items-center gap-3">
                            4.8
                            <Star className="w-10 h-10 text-amber-500 fill-amber-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Team Members */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-light text-neutral-900 dark:text-white">Team Members</h2>
                    <div className="h-px flex-1 bg-linear-to-r from-neutral-200 dark:from-neutral-800 to-transparent"></div>
                </div>

                <div className="space-y-px bg-neutral-200 dark:bg-neutral-800">
                    {teamMembers.map((member, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 p-10 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                            <div className="flex items-start gap-8">
                                {/* Rank Badge */}
                                <div className={`w-20 h-20 ${i === 0 ? 'bg-amber-600' : i === 1 ? 'bg-neutral-400' : 'bg-amber-800'} text-white rounded-none flex items-center justify-center text-3xl font-light`}>
                                    {i + 1}
                                </div>

                                {/* Member Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-3">
                                        <h3 className="text-3xl font-light text-neutral-900 dark:text-white">{member.name}</h3>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                            <span className="text-lg text-neutral-600 dark:text-neutral-400">{member.rating}</span>
                                        </div>
                                    </div>
                                    <p className="text-neutral-500 dark:text-neutral-400 mb-6">{member.role}</p>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-5 gap-8">
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">Total Jobs</div>
                                            <div className="text-3xl font-light text-neutral-900 dark:text-white">{member.completed}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">This Week</div>
                                            <div className="text-3xl font-light text-neutral-900 dark:text-white">{member.thisWeek}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">Avg Time</div>
                                            <div className="text-3xl font-light text-neutral-900 dark:text-white">{member.avgTime}d</div>
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">Conversion</div>
                                            <div className="text-3xl font-light text-neutral-900 dark:text-white">{member.conversion}%</div>
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">Reviews</div>
                                            <div className="text-3xl font-light text-neutral-900 dark:text-white">{member.reviews}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Revenue */}
                                <div className="text-right">
                                    <div className="text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">Total Revenue</div>
                                    <div className="text-4xl font-light text-neutral-900 dark:text-white">
                                        {(member.revenue / 1000).toFixed(0)}k
                                    </div>
                                    <div className="text-sm text-neutral-400">AED</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Reviews Leaderboard */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-light text-neutral-900 dark:text-white">Review Leaderboard</h2>
                    <div className="h-px flex-1 bg-linear-to-r from-neutral-200 dark:from-neutral-800 to-transparent"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200 dark:bg-neutral-800">
                    {getReviewStats().map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 p-10 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600'} rounded-full flex items-center justify-center font-medium`}>
                                        #{i + 1}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-medium text-neutral-900 dark:text-white">{stat.name}</h3>
                                        <p className="text-sm text-neutral-500">{stat.total} total visits</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-light text-neutral-900 dark:text-white">{stat.posted}</div>
                                    <div className="text-xs uppercase tracking-wider text-neutral-500">Reviews</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Conversion Rate</span>
                                    <span className="font-medium text-neutral-900 dark:text-white">{stat.conversionRate}%</span>
                                </div>
                                <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${i === 0 ? 'bg-amber-500' : 'bg-neutral-500'} transition-all duration-500`}
                                        style={{ width: `${stat.conversionRate}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
