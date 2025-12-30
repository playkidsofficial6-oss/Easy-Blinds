import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, MapPin, Search, Menu, Bell, User } from "lucide-react";

export function Hero() {
    return (
        <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden bg-white">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.50),white)] opacity-40" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
                <div className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-sm leading-6 text-neutral-600 mb-8 animate-fade-in-up">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
                    The new standard for curtain professionals
                </div>

                <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-neutral-900 mb-6 max-w-4xl mx-auto leading-tight">
                    Precision in every fold. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-neutral-900 via-neutral-600 to-neutral-800">
                        Perfection in every project.
                    </span>
                </h1>

                <p className="mt-4 text-xl text-neutral-600 max-w-2xl mx-auto mb-10 leading-relaxed text-balance">
                    The all-in-one platform for modern curtain and blind businesses.
                    Manage measurements, quotes, and installations with unparalleled ease.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-16">
                    <Link href="/dashboard">
                        <Button size="lg" className="h-12 px-8 rounded-full text-base bg-neutral-900 hover:bg-neutral-800 text-white w-full sm:w-auto shadow-lg hover:shadow-xl transition-all">
                            Start Free Trial
                            <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                    <Link href="#features">
                        <Button size="lg" variant="outline" className="h-12 px-8 rounded-full text-base w-full sm:w-auto border-neutral-200 hover:bg-neutral-50">
                            Explore Modules
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-neutral-500 mb-20">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Works Offline</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>14-day free trial</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Zapier Integration</span>
                    </div>
                </div>

                {/* Dashboard Preview - Realistic Mockup */}
                <div className="relative w-full max-w-6xl mx-auto mt-8 rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden backdrop-blur-sm ring-1 ring-neutral-900/5">
                    {/* Fake Browser Chrome */}
                    <div className="h-10 bg-neutral-50 border-b border-neutral-200 flex items-center px-4 gap-2">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                            <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                        </div>
                        <div className="flex-1 text-center text-xs text-neutral-400 font-medium">measurepro.app/field</div>
                    </div>

                    {/* Dashboard Content Mockup */}
                    <div className="bg-neutral-50 flex h-[600px] text-left">
                        {/* Sidebar Mock */}
                        <div className="w-64 bg-white border-r border-neutral-200 hidden md:flex flex-col p-6">
                            <div className="text-xl font-bold tracking-tight mb-8">Measure<span className="font-light">Pro</span></div>
                            <div className="space-y-1">
                                <div className="px-3 py-2 bg-neutral-100 rounded-lg text-sm font-medium text-neutral-900">Dashboard</div>
                                <div className="px-3 py-2 text-sm text-neutral-600">Measurements</div>
                                <div className="px-3 py-2 text-sm text-neutral-600">Installations</div>
                                <div className="px-3 py-2 text-sm text-neutral-600">Quotes</div>
                                <div className="px-3 py-2 text-sm text-neutral-600">Products</div>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 flex flex-col min-w-0">
                            {/* Header Mock */}
                            <header className="h-16 bg-white border-b border-neutral-200 px-8 flex items-center justify-between">
                                <div className="w-64 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <div className="w-full h-9 bg-neutral-100 rounded-md"></div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Bell className="w-5 h-5 text-neutral-400" />
                                    <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
                                        <User className="w-4 h-4 text-neutral-500" />
                                    </div>
                                </div>
                            </header>

                            <div className="flex-1 p-8 overflow-hidden bg-neutral-50/50">
                                {/* Page Header */}
                                <div className="mb-8 space-y-2">
                                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold">
                                        <div className="w-8 h-px bg-amber-600"></div>
                                        <span>Field Operations</span>
                                    </div>
                                    <h2 className="text-3xl font-light text-neutral-900">Good Morning, <span className="font-semibold">John</span></h2>
                                </div>

                                {/* Cards Row */}
                                <div className="grid grid-cols-3 gap-6 mb-8">
                                    <div className="bg-white p-6 rounded-none border border-neutral-200 shadow-sm relative overflow-hidden">
                                        <div className="text-sm uppercase tracking-wider text-neutral-500 mb-2">Today's Visits</div>
                                        <div className="text-4xl font-light text-neutral-900">12</div>
                                    </div>
                                    <div className="bg-white p-6 rounded-none border border-neutral-200 shadow-sm relative overflow-hidden">
                                        <div className="text-sm uppercase tracking-wider text-neutral-500 mb-2">Pending</div>
                                        <div className="text-4xl font-light text-amber-600">4</div>
                                    </div>
                                    <div className="bg-white p-6 rounded-none border border-neutral-200 shadow-sm relative overflow-hidden">
                                        <div className="text-sm uppercase tracking-wider text-neutral-500 mb-2">Revenue</div>
                                        <div className="text-4xl font-light text-emerald-600">$2.4k</div>
                                    </div>
                                </div>

                                {/* List Mock */}
                                <div className="bg-white border border-neutral-200 shadow-sm">
                                    <div className="p-4 border-b border-neutral-100 flex justify-between items-center">
                                        <h3 className="font-medium text-neutral-900">Upcoming Schedule</h3>
                                    </div>
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="p-4 border-b border-neutral-100 flex items-center gap-6 last:border-0 hover:bg-neutral-50 transition-colors">
                                            <div className="w-16 text-center">
                                                <div className="text-lg font-medium text-neutral-900">10:00</div>
                                                <div className="text-xs text-neutral-400 uppercase">AM</div>
                                            </div>
                                            <div className="w-px h-10 bg-neutral-200"></div>
                                            <div className="flex-1">
                                                <div className="font-medium text-neutral-900">Ahmed Al Mansoori</div>
                                                <div className="flex items-center gap-2 text-sm text-neutral-500">
                                                    <MapPin className="w-3 h-3" />
                                                    Jumeirah Park • Villa
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 text-xs font-medium rounded-full ${i === 2 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {i === 2 ? 'In Progress' : 'Completed'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
