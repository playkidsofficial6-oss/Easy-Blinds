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
    Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/mode-toggle";
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
        if (isOwnerRole(role)) {
            return [
                { name: 'Executive Dashboard', href: '/dashboard', icon: BarChart3 },
                { name: 'Sales Insights', href: '/dashboard/analytics/sales', icon: TrendingUp },
                { name: 'Fitting Efficiency', href: '/dashboard/performance', icon: PieChart },
                { name: 'Review Performance', href: '/dashboard/analytics/reviews', icon: Star },
                { name: 'Team Rankings', href: '/dashboard/analytics/rankings', icon: Award },
                { name: 'Team Management', href: '/dashboard/team', icon: Users },
                { name: 'Area Analysis', href: '/dashboard/areas', icon: MapPin },
                { name: 'Settings', href: '/dashboard/settings', icon: Settings },
            ];
        }
        if (isSalesManagerRole(role)) {
            return [
                { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
                { name: "Salesman Assignments", href: "/dashboard/salesman-assignments", icon: ClipboardList },
                { name: "Fitter Assignments", href: "/dashboard/assignments", icon: ClipboardList },
                { name: "Salesmen", href: "/dashboard/salesmen", icon: UserCheck },
                { name: "Fitters", href: "/dashboard/fitter", icon: NavigationIcon },
                { name: "Fittings Analytics", href: "/dashboard/analytics", icon: LineChart },
                { name: "Fitter Performance", href: "/dashboard/performance", icon: BarChart3 },
                { name: "Review Tracking", href: "/dashboard/reviews", icon: Star },
                { name: "Pending Reviews", href: "/dashboard/reviews/pending", icon: PlayCircle },
                { name: "Catalogue", href: "/dashboard/catalogue", icon: BookOpen },
                { name: "Staff Directory", href: "/dashboard/staff", icon: Users },
                { name: "Staff Requests", href: "/dashboard/staff-request", icon: Users },
            ];
        }
        if (isSalesmanRole(role) || isFieldRole(role)) {
            return [
                { name: "Field Work", href: "/dashboard", icon: Ruler },
                { name: "Quotes", href: "/dashboard/quotes", icon: FileText },
                { name: "Products", href: "/dashboard/products", icon: Package },
                { name: "Our Gallery", href: "/dashboard/gallery", icon: LayoutDashboard },
                { name: "Reviews", href: "/dashboard/reviews", icon: Star },
            ];
        }
        if (role === UserRole.Stitching || String(role).toLowerCase() === "stitching") {
            return [
                { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
                { name: 'Active Jobs', href: '/dashboard/active', icon: Scissors },
                { name: 'History', href: '/dashboard/history', icon: History },
                { name: 'Settings', href: '/dashboard/settings', icon: Settings },
            ];
        }
        if (isFitterRole(role)) {
            return [
                { name: "My Tasks", href: "/dashboard", icon: ClipboardList },
            ];
        }
        return [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        ];
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
                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
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
                        className="flex items-center gap-4 px-4 py-4 text-sm font-medium transition-all duration-200 border-l-4 border-transparent text-neutral-400 hover:border-neutral-500 hover:bg-neutral-800/50 hover:text-white rounded-r-md"
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
                    <Button variant="ghost" size="sm" className="w-full justify-start text-neutral-400 hover:text-white hover:bg-neutral-800">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                    </Button>
                    <Button onClick={() => logout("/")} variant="ghost" size="sm" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                    <div className="pt-2 px-2">
                        <ModeToggle />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <ProtectedRoute allowedRoles={allowedRoles}>
            <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 flex">
                <aside className="hidden md:flex flex-col w-64 border-r border-neutral-800 bg-neutral-900 fixed inset-y-0 z-50">
                    <NavContent />
                </aside>

                <div className="flex-1 md:ml-64 flex flex-col min-h-screen bg-stone-50 dark:bg-neutral-950">
                    <header className="md:hidden h-16 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-4 sticky top-0 z-40">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-white">{selectedBrand.name}</h1>
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

                    <main className="flex-1 overflow-x-hidden p-0 m-0">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
