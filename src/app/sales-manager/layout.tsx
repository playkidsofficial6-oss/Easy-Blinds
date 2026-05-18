/* eslint-disable react-hooks/static-components */
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
    UserCheck,
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
    
    { name: "Salesman Assignments", href: "/sales-manager/salesman-assignments", icon: ClipboardList },
    { name: "Fitter Assignments", href: "/sales-manager/assignments", icon: ClipboardList },
    { name: "Salesmen", href: "/sales-manager/salesmen", icon: UserCheck },
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
        <div className="flex flex-col h-full bg-neutral-900 text-white">
            {/* Logo / Brand Header */}
            <div className="flex-shrink-0 px-6 py-6 border-b border-neutral-800">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-base">SM</span>
                    </div>
                    <div>
                        <h1 className="text-base font-bold tracking-tight text-white leading-tight">Easy Blinds</h1>
                        <p className="text-[11px] text-neutral-400 uppercase tracking-[0.25em] font-semibold mt-0.5">
                            Sales Manager
                        </p>
                    </div>
                </div>
            </div>

            {/* Scrollable Navigation — takes all remaining height, scrollable so Sign Out is reachable */}
            <nav
                className="flex-1 overflow-y-auto px-3 py-5 space-y-1"
                style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#525252 transparent",
                }}
            >
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                                "flex items-center justify-between px-5 py-5 text-[15px] font-medium transition-all duration-150 border-l-2 rounded-r-md",
                                isActive
                                    ? "border-amber-500 bg-neutral-800 text-white"
                                    : "border-transparent text-neutral-400 hover:border-neutral-600 hover:bg-neutral-800/70 hover:text-white"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <item.icon className="w-6 h-6 flex-shrink-0" />
                                <span>{item.name}</span>
                            </div>
                            {item.name === "Pending Reviews" && (
                                <span className="bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full leading-none">
                                    12
                                </span>
                            )}
                        </Link>
                    );
                })}

                {/* New Job nav link */}
                <Link
                    href="/sales-manager/jobs/new"
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-4 px-5 py-5 text-[15px] font-medium transition-all duration-150 border-l-2 border-transparent text-neutral-400 hover:border-neutral-600 hover:bg-neutral-800/70 hover:text-white rounded-r-md"
                >
                    <PlusCircle className="w-6 h-6 flex-shrink-0" />
                    <span>New Job</span>
                </Link>

                {/* ─── User + Sign Out — inside scroll so always reachable ─── */}
                <div className="pt-5 mt-3 border-t border-neutral-800">
                    {/* User info */}
                    <div className="flex items-center gap-4 px-5 py-4 mb-1">
                        <Avatar className="h-11 w-11 flex-shrink-0">
                            <AvatarImage src="/placeholder-user.jpg" />
                            <AvatarFallback className="bg-amber-600 text-white text-sm font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-semibold text-white truncate leading-tight">
                                {user?.name ?? "Sales Manager"}
                            </p>
                            <p className="text-xs text-neutral-400 truncate capitalize leading-tight mt-0.5">
                                {user?.role?.replaceAll("_", " ") ?? "Operations"}
                            </p>
                        </div>
                    </div>

                    {/* Sign Out Button */}
                    <button
                        onClick={() => logout("/")}
                        className="w-full flex items-center gap-4 px-5 py-5 text-[15px] font-medium text-red-400 hover:text-white hover:bg-red-600 transition-all duration-200 group border-l-2 border-transparent hover:border-red-500 rounded-r-md"
                    >
                        <LogOut className="w-6 h-6 flex-shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </nav>
        </div>
    );

    return (
        <ProtectedRoute allowedRoles={["sales_manager"]}>
            <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex">
                {/* ─── Desktop Sidebar ─── */}
                <aside className="hidden md:flex md:flex-col w-60 bg-neutral-900 fixed inset-y-0 z-50 border-r border-neutral-800">
                    <NavContent />
                </aside>

                {/* ─── Main content area ─── */}
                <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
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
                                <SheetContent side="left" className="p-0 w-60 border-0">
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
