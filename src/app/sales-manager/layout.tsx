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
    Star,
    BarChart3,
    LineChart,
    PlayCircle,
    BookOpen,
    Navigation as NavigationIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/providers/auth-provider";

interface SalesManagerLayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { name: "Dashboard", href: "/sales-manager", icon: LayoutDashboard },
    { name: "Assignments", href: "/sales-manager/assignments", icon: ClipboardList },
    { name: "Fitters", href: "/sales-manager/tracking", icon: NavigationIcon },
    { name: "Fittings Analytics", href: "/sales-manager/analytics", icon: LineChart },
    { name: "Fitter Performance", href: "/sales-manager/performance", icon: BarChart3 },
    { name: "Review Tracking", href: "/sales-manager/reviews", icon: Star },
    { name: "Pending Reviews", href: "/sales-manager/reviews/pending", icon: PlayCircle },
    { name: "Catalogue", href: "/sales-manager/catalogue", icon: BookOpen },
    { name: "Team", href: "/sales-manager/fitters", icon: Users },
];

export default function SalesManagerLayout({ children }: SalesManagerLayoutProps) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { user, logout } = useAuth();

    const initials =
        user?.name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() ?? "SM";

    const NavContent = () => (
        <div className="flex flex-col h-full bg-neutral-900 text-white overflow-hidden">
            {/* Logo / Brand Header */}
            <div className="flex-shrink-0 p-6 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-light text-base">SM</span>
                    </div>
                    <div>
                        <h1 className="text-base font-light tracking-tight text-white leading-tight">Easy Blinds</h1>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-[0.25em] font-medium">
                            Sales Manager
                        </p>
                    </div>
                </div>
            </div>

            {/* Scrollable Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-0.5">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                                "flex items-center justify-between px-3 py-2.5 text-sm font-light transition-all duration-150 border-l-2 rounded-r-lg",
                                isActive
                                    ? "border-amber-500 bg-neutral-800 text-white font-medium"
                                    : "border-transparent text-neutral-400 hover:border-neutral-600 hover:bg-neutral-800/60 hover:text-white"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className="w-4 h-4 flex-shrink-0" />
                                <span>{item.name}</span>
                            </div>
                            {item.name === "Pending Reviews" && (
                                <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                                    12
                                </span>
                            )}
                        </Link>
                    );
                })}
                <Link
                    href="/sales-manager/jobs/new"
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-light transition-all duration-150 border-l-2 border-transparent text-neutral-400 hover:border-neutral-600 hover:bg-neutral-800/60 hover:text-white rounded-r-lg"
                >
                    <PlusCircle className="w-4 h-4 flex-shrink-0" />
                    <span>New Job</span>
                </Link>
            </nav>

            {/* ─── Pinned Bottom: User card + Sign Out ─── */}
            <div className="flex-shrink-0 border-t border-neutral-800 p-4">
                {/* User info */}
                <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback className="bg-amber-600 text-white text-xs font-semibold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate leading-tight">
                            {user?.name ?? "Sales Manager"}
                        </p>
                        <p className="text-[11px] text-neutral-400 truncate capitalize leading-tight mt-0.5">
                            {user?.role?.replaceAll("_", " ") ?? "Operations"}
                        </p>
                    </div>
                </div>

                {/* Sign Out Button */}
                <button
                    onClick={() => logout("/")}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-white hover:bg-red-600 transition-all duration-200 group"
                >
                    <LogOut className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
                    Sign Out
                </button>
            </div>
        </div>
    );

    return (
        <ProtectedRoute allowedRoles={["sales_manager"]}>
            <div className="min-h-screen bg-neutral-50 flex">
                {/* ─── Desktop Sidebar ─── */}
                <aside className="hidden md:flex md:flex-col w-64 bg-neutral-900 fixed inset-y-0 z-50 border-r border-neutral-800">
                    <NavContent />
                </aside>

                {/* ─── Main content area ─── */}
                <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                    {/* Mobile Header */}
                    <header className="md:hidden h-14 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-4 sticky top-0 z-40">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-amber-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                SM
                            </div>
                            <span className="text-sm font-light text-white">Sales Manager</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Mobile logout */}
                            <button
                                onClick={() => logout("/")}
                                title="Sign Out"
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-white hover:bg-red-600 transition-all duration-200"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span className="hidden xs:inline">Sign Out</span>
                            </button>
                            {/* Mobile nav toggle */}
                            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white hover:bg-neutral-800 h-8 w-8">
                                        <Menu className="w-4 h-4" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="p-0 w-64 border-0">
                                    <NavContent />
                                </SheetContent>
                            </Sheet>
                        </div>
                    </header>

                    <main className="flex-1 overflow-x-hidden">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
