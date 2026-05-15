"use client";
/* eslint-disable react-hooks/static-components */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Scissors,
    History,
    Settings,
    LogOut,
    Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/providers/auth-provider";

const navItems = [
    { name: 'Dashboard', href: '/stitching', icon: LayoutDashboard },
    { name: 'Active Jobs', href: '/stitching/active', icon: Scissors },
    { name: 'History', href: '/stitching/history', icon: History },
    { name: 'Settings', href: '/stitching/settings', icon: Settings },
];

export default function StitchingLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { logout } = useAuth();

    const NavContent = () => (
        <div className="flex flex-col h-full bg-white dark:bg-neutral-950">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                <h1 className="text-xl font-bold text-neutral-900 dark:text-white uppercase tracking-tight">Workshop</h1>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                isActive
                                    ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
                                    : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
                <Button onClick={() => logout()} variant="ghost" className="w-full justify-start text-neutral-500 hover:text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Exit
                </Button>
            </div>
        </div>
    );

    return (
        <ProtectedRoute allowedRoles={["admin", "owner", "stitching"]}>
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex font-sans">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 fixed h-full z-30">
                <NavContent />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
                {/* Mobile Header */}
                <header className="lg:hidden h-16 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 sticky top-0 z-40">
                    <h1 className="text-lg font-bold text-neutral-900 dark:text-white uppercase tracking-tight">Workshop</h1>
                    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64">
                            <NavContent />
                        </SheetContent>
                    </Sheet>
                </header>

                <main className="flex-1 p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
        </ProtectedRoute>
    );
}

