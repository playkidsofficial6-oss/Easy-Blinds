"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ClipboardList,
    Users,
    LogOut,
    Menu,
    PlusCircle,
    Briefcase,
    TrendingUp,
    Star,
    AlertCircle,
    Calendar,
    Activity,
    BarChart3,
    MapPin,
    LineChart,
    PlayCircle,
    BookOpen,
    Navigation as NavigationIcon // Renamed to avoid confusion with Navigation API
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SalesManagerLayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { name: 'Dashboard', href: '/sales-manager', icon: LayoutDashboard },
    { name: 'Assignments', href: '/sales-manager/assignments', icon: ClipboardList },
    { name: 'Fitters', href: '/sales-manager/tracking', icon: NavigationIcon }, // Renamed from Live Tracking
    { name: 'Fittings Analytics', href: '/sales-manager/analytics', icon: LineChart },
    { name: 'Fitter Performance', href: '/sales-manager/performance', icon: BarChart3 },
    { name: 'Review Tracking', href: '/sales-manager/reviews', icon: Star },
    { name: 'Pending Reviews', href: '/sales-manager/reviews/pending', icon: PlayCircle },
    { name: 'Catalogue', href: '/sales-manager/catalogue', icon: BookOpen },
    { name: 'Team', href: '/sales-manager/fitters', icon: Users }, // Renamed from Fitters
];

export default function SalesManagerLayout({ children }: SalesManagerLayoutProps) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const NavContent = () => (
        <div className="flex flex-col h-full bg-neutral-900 text-white">
            <div className="p-8 border-b border-neutral-800">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-600 rounded-none flex items-center justify-center">
                        <span className="text-white font-light text-2xl">SM</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-light tracking-tight text-white">
                            Easy Blinds
                        </h1>
                        <p className="text-xs text-neutral-400 uppercase tracking-[0.2em] font-medium">
                            Sales Manager
                        </p>
                    </div>
                </div>
            </div>
            <nav className="flex-1 px-6 py-12 space-y-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                                "flex items-center justify-between px-6 py-5 text-base font-light transition-all duration-200 border-l-2",
                                isActive
                                    ? "border-amber-600 bg-neutral-800 text-white font-medium"
                                    : "border-transparent text-neutral-400 hover:border-neutral-600 hover:text-white"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </div>
                            {item.name === 'Pending Reviews' && (
                                <span className="bg-rose-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                                    12
                                </span>
                            )}
                            {item.name === 'Live Tracking' && (
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                            )}
                        </Link>
                    );
                })}
                <Link
                    href="/sales-manager/jobs/new"
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-4 px-6 py-5 text-base font-light transition-all duration-200 border-l-2 border-transparent text-neutral-400 hover:border-neutral-600 hover:text-white"
                >
                    <PlusCircle className="w-5 h-5" />
                    New Job
                </Link>
            </nav>
            <div className="p-6 border-t border-neutral-800">
                <div className="flex items-center gap-3 mb-4">
                    <Avatar>
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback className="bg-amber-600">SM</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            Sales Manager
                        </p>
                        <p className="text-xs text-neutral-400 truncate">
                            Operations
                        </p>
                    </div>
                </div>
                <div className="space-y-1">
                    <Button asChild variant="ghost" size="sm" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30">
                        <Link href="/">
                            <LogOut className="w-4 h-4 mr-2" />
                            Exit Portal
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-72 border-r border-neutral-200 bg-neutral-900 fixed inset-y-0 z-50">
                <NavContent />
            </aside>

            {/* Mobile Header & Content */}
            <div className="flex-1 md:ml-72 flex flex-col min-h-screen">
                <header className="md:hidden h-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 sticky top-0 z-40">
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-light text-neutral-900 dark:text-white">Sales Manager</h1>
                    </div>
                    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-72">
                            <NavContent />
                        </SheetContent>
                    </Sheet>
                </header>

                <main className="flex-1 p-0 overflow-x-hidden md:p-0"> {/* Updated padding to 0 for full width layouts */}
                    <div className="w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
