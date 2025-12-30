"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, LayoutDashboard, Ruler, FileText, Hammer, Users, Briefcase, Menu, LogOut, Settings, Star, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/mode-toggle";
import { useBrand } from "@/components/providers/brand-provider";
import { brands } from "@/lib/brands";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { href: "/field", label: "Field Work", icon: Ruler },
    { href: "/field/quotes", label: "Quotes", icon: FileText },
    { href: "/field/products", label: "Products", icon: Package },
    { href: "/field/gallery", label: "Our Gallery", icon: LayoutDashboard },
    { href: "/field/reviews", label: "Reviews", icon: Star },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { selectedBrand, setSelectedBrand } = useBrand();

    const NavContent = () => (
        <div className="flex flex-col h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
            <div className="p-8 border-b border-neutral-200 dark:border-neutral-800">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-4 w-full text-left group outline-none">
                            <div className={cn("w-14 h-14 rounded-none flex items-center justify-center transition-colors duration-300", selectedBrand.styles.badge.replace("text-", "bg-").replace("bg-", "text-"))}>
                                <span className="font-light text-2xl">{selectedBrand.initials}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl font-light tracking-tight text-neutral-900 dark:text-white truncate group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                                    {selectedBrand.name}
                                </h1>
                                <p className="text-xs text-neutral-400 uppercase tracking-[0.2em] font-medium flex items-center gap-1">
                                    Dubai <ChevronDown className="w-3 h-3" />
                                </p>
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                        {brands.map((brand) => (
                            <DropdownMenuItem
                                key={brand.id}
                                onClick={() => setSelectedBrand(brand.id)}
                                className="flex items-center justify-between"
                            >
                                <span>{brand.name}</span>
                                {selectedBrand.id === brand.id && <Check className="w-4 h-4" />}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <nav className="flex-1 px-6 py-12 space-y-3">{navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                            "flex items-center gap-4 px-6 py-5 text-base font-light transition-all duration-200 border-l-4 min-h-[64px]",
                            isActive
                                ? selectedBrand.styles.sidebarActive
                                : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white dark:hover:border-neutral-700"
                        )}
                    >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                    </Link>
                );
            })}
            </nav>
            <div className="p-4 border-t border-stone-200 dark:border-neutral-800">
                <div className="flex items-center gap-3 mb-4">
                    <Avatar>
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 dark:text-white truncate">
                            John Doe
                        </p>
                        <p className="text-xs text-stone-500 truncate">
                            Senior Measurer
                        </p>
                    </div>
                </div>
                <div className="space-y-1">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-stone-600 dark:text-neutral-400 dark:hover:text-white">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                    <div className="pt-2">
                        <ModeToggle />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 flex">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 border-r border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 fixed inset-y-0 z-50">
                <NavContent />
            </aside>

            {/* Mobile Header & Content */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen bg-stone-50 dark:bg-neutral-950">
                <header className="md:hidden h-16 bg-white dark:bg-neutral-900 border-b border-stone-200 dark:border-neutral-800 flex items-center justify-between px-4 sticky top-0 z-40">
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold text-stone-900 dark:text-white">{selectedBrand.name}</h1>
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

                <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
