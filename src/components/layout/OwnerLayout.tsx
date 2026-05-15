"use client";
/* eslint-disable react-hooks/static-components */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    TrendingUp,
    Users,
    MapPin,
    Settings,
    LogOut,
    BarChart3,
    PieChart,
    Star,
    Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/providers/auth-provider";

interface OwnerLayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { name: 'Executive Dashboard', href: '/owner', icon: BarChart3 },
    { name: 'Sales Insights', href: '/owner/analytics/sales', icon: TrendingUp },
    { name: 'Fitting Efficiency', href: '/owner/performance', icon: PieChart },
    { name: 'Review Performance', href: '/owner/analytics/reviews', icon: Star },
    { name: 'Team Rankings', href: '/owner/analytics/rankings', icon: Award },
    { name: 'Team Management', href: '/owner/team', icon: Users },
    { name: 'Area Analysis', href: '/owner/areas', icon: MapPin },
    { name: 'Settings', href: '/owner/settings', icon: Settings },
];

export function OwnerLayout({ children }: OwnerLayoutProps) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { user, logout } = useAuth();
    const initials = user?.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "OW";

    const NavContent = () => (
        <div className="flex flex-col h-full bg-neutral-900 text-white">
            <div className="p-8 border-b border-neutral-800">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-600 rounded-none flex items-center justify-center">
                        <span className="text-white font-light text-2xl">EB</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-light tracking-tight text-white">
                            Easy Blinds
                        </h1>
                        <p className="text-xs text-neutral-400 uppercase tracking-[0.2em] font-medium">
                            Owner Portal
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
                                "flex items-center gap-4 px-6 py-5 text-base font-light transition-all duration-200 border-l-2",
                                isActive
                                    ? "border-amber-600 bg-neutral-800 text-white font-medium"
                                    : "border-transparent text-neutral-400 hover:border-neutral-600 hover:text-white"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-6 border-t border-neutral-800">
                <div className="flex items-center gap-3 mb-4">
                    <Avatar>
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback className="bg-amber-600">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {user?.name ?? "Owner"}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">
                            {user?.role.replaceAll("_", " ") ?? "Full Access"}
                        </p>
                    </div>
                </div>
                <div className="space-y-1">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-neutral-400 hover:text-white hover:bg-neutral-800">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                    </Button>
                    <Button onClick={() => logout()} variant="ghost" size="sm" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <ProtectedRoute allowedRoles={["owner"]}>
        <div className="min-h-screen bg-neutral-50 flex">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-72 border-r border-neutral-200 bg-neutral-900 fixed inset-y-0 z-50">
                <NavContent />
            </aside>

            {/* Mobile Header & Content */}
            <div className="flex-1 md:ml-72 flex flex-col min-h-screen">
                <header className="md:hidden h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 sticky top-0 z-40">
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-light text-neutral-900">Owner Portal</h1>
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

                <main className="flex-1 p-8 md:p-12 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
        </ProtectedRoute>
    );
}
