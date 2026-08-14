"use client";
/* eslint-disable react-hooks/static-components */

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
    TrendingUp,
    MapPin,
    Settings,
    PieChart,
    Award,
    Package,
    Ruler,
    FileText,
    Scissors,
    History,
    ChevronDown,
    Check,
    Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBrand } from "@/components/providers/brand-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { isFieldRole, isFitterRole, isOwnerRole, isSalesManagerRole, isSalesmanRole, UserRole } from "@/lib/auth";
import { brands } from "@/lib/brands";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

export function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { selectedBrand, setSelectedBrand } = useBrand();
    const { user, logout } = useAuth();

    const initials = user?.name
        ? user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()
        : "EB";

    const getNavItems = (role?: UserRole | null) => {
        let items: Array<{ name: string; href: string; icon: any }> = [];
        if (isOwnerRole(role)) {
            items = [
                { name: 'Executive Dashboard', href: '/dashboard', icon: BarChart3 },
                { name: 'Fleet Map', href: '/dashboard/map', icon: MapPin },
                { name: 'All Jobs', href: '/dashboard/jobs', icon: Briefcase },
                { name: 'Sales Insights', href: '/dashboard/analytics/sales', icon: TrendingUp },
                { name: 'Fitting Efficiency', href: '/dashboard/performance', icon: PieChart },
                { name: 'Review Performance', href: '/dashboard/analytics/reviews', icon: Star },
                { name: 'Team Rankings', href: '/dashboard/analytics/rankings', icon: Award },
                { name: 'Team Management', href: '/dashboard/team', icon: Users },
                { name: 'Area Analysis', href: '/dashboard/areas', icon: MapPin },
            ];
        } else if (isSalesManagerRole(role)) {
            items = [
                { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
                { name: "Fleet Map", href: "/dashboard/map", icon: MapPin },
                { name: "All Jobs", href: "/dashboard/jobs", icon: Briefcase },
                { name: "Salesman Assignments", href: "/dashboard/salesman-assignments", icon: ClipboardList },
                { name: "Fitter Assignments", href: "/dashboard/fitter-assignments", icon: ClipboardList },
                { name: "Staff Directory", href: "/dashboard/staff", icon: Users },
                { name: "Staff Requests", href: "/dashboard/staff-request", icon: Users },
            ];
        } else if (isSalesmanRole(role) || isFieldRole(role)) {
            items = [
                { name: "Field Work", href: "/dashboard", icon: Ruler },
                { name: "Quotes", href: "/dashboard/quotes", icon: FileText },
            ];
        } else if (role === UserRole.Stitching || String(role).toLowerCase() === "stitching") {
            items = [
                { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
                { name: 'Active Jobs', href: '/dashboard/active', icon: Scissors },
                { name: 'History', href: '/dashboard/history', icon: History },
            ];
        } else if (isFitterRole(role)) {
            items = [
                { name: "My Tasks", href: "/dashboard", icon: ClipboardList },
            ];
        } else {
            items = [
                { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            ];
        }

        return items;
    };

    const navItems = getNavItems(user?.role);

    const NavContent = () => (
        <div className="flex flex-col h-full bg-neutral-900 border-r border-neutral-800">
            <div className="p-8 border-b border-neutral-800">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-4 w-full text-left group outline-none">
                            <div className={cn("w-14 h-14 rounded-none flex items-center justify-center transition-colors duration-300", selectedBrand.styles.badge.replace("text-", "bg-").replace("bg-", "text-"))}>
                                <span className="font-light text-2xl text-white">{selectedBrand.initials}</span>
                            </div>
                            <div className="flex-1 min-w-0 text-white">
                                <h1 className="text-xl font-light tracking-tight truncate group-hover:text-neutral-300 transition-colors">
                                    {selectedBrand.name}
                                </h1>
                                <p className="text-xs text-neutral-400 uppercase tracking-[0.2em] font-medium flex items-center gap-1">
                                    Dubai <ChevronDown className="w-3 h-3" />
                                </p>
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 bg-neutral-800 text-white border-neutral-700">
                        {brands.map((brand) => (
                            <DropdownMenuItem
                                key={brand.id}
                                onClick={() => setSelectedBrand(brand.id)}
                                className="flex items-center justify-between hover:bg-neutral-700 cursor-pointer focus:bg-neutral-700 focus:text-white"
                            >
                                <span>{brand.name}</span>
                                {selectedBrand.id === brand.id && <Check className="w-4 h-4" />}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-2" style={{ scrollbarWidth: "thin", scrollbarColor: "#525252 transparent" }}>
                {navItems.map((item) => {
                    const isNewJobRoute = pathname === "/dashboard/jobs/new";
                    const isActive =
                        (pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))) &&
                        !(item.href === "/dashboard/jobs" && isNewJobRoute);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                                "flex items-center gap-4 px-4 py-4 text-sm font-medium transition-all duration-200 border-l-4 rounded-r-md",
                                isActive
                                    ? selectedBrand.styles.sidebarActive
                                    : "border-transparent text-neutral-400 hover:border-neutral-500 hover:bg-neutral-800/50 hover:text-white"
                            )}
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            <span>{item.name}</span>
                            {item.name === "Pending Reviews" && (
                                <span className="ml-auto bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full leading-none">
                                    12
                                </span>
                            )}
                        </Link>
                    );
                })}

                {isSalesManagerRole(user?.role) && (
                    <Link
                        href="/dashboard/jobs/new"
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                            "flex items-center gap-4 px-4 py-4 text-sm font-medium transition-all duration-200 border-l-4 rounded-r-md",
                            pathname === "/dashboard/jobs/new"
                                ? selectedBrand.styles.sidebarActive
                                : "border-transparent text-neutral-400 hover:border-neutral-500 hover:bg-neutral-800/50 hover:text-white"
                        )}
                    >
                        <PlusCircle className="w-5 h-5 shrink-0" />
                        <span>New Job</span>
                    </Link>
                )}
            </nav>

            <div className="p-4 border-t border-neutral-800">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback className="bg-amber-600 text-white">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {user?.name ?? "Portal User"}
                        </p>
                        <p className="text-xs text-neutral-400 truncate capitalize">
                            {user?.role?.replaceAll("_", " ") ?? "Unknown Role"}
                        </p>
                    </div>
                </div>
                <div className="space-y-1">
                    <Button asChild variant="ghost" size="sm" className="w-full justify-start text-neutral-400 hover:text-white hover:bg-neutral-800">
                        <Link href="/dashboard/settings" onClick={() => setIsMobileOpen(false)}>
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </Link>
                    </Button>
                    <Button onClick={() => logout("/")} variant="ghost" size="sm" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <ProtectedRoute allowedRoles={allowedRoles}>
            <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 flex w-full max-w-[100vw] overflow-x-hidden">
                <aside className="hidden md:flex flex-col w-64 border-r border-neutral-800 bg-neutral-900 fixed inset-y-0 z-50">
                    <NavContent />
                </aside>

                <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-stone-50 dark:bg-neutral-950 md:ml-64">
                    <header className="md:hidden sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-900 px-4">
                        <div className="min-w-0 flex-1 pr-3">
                            <h1 className="truncate text-lg font-bold text-white">{selectedBrand.name}</h1>
                        </div>
                        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-white hover:bg-neutral-800">
                                    <Menu className="w-6 h-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-72 border-none">
                                <NavContent />
                            </SheetContent>
                        </Sheet>
                    </header>

                    <main className="m-0 min-w-0 flex-1 overflow-x-hidden p-0">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
