"use client";

import Link from "next/link";
import { useState } from "react";
import { 
    Calendar, 
    Clock, 
    Printer, 
    Share2, 
    Search, 
    ShieldCheck, 
    Check, 
    ArrowLeft, 
    Sparkles 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LegalHeaderProps {
    title: string;
    subtitle: string;
    lastUpdated: string;
    version: string;
    readTime: string;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    activeTab?: "terms" | "privacy";
    onTabChange?: (tab: "terms" | "privacy") => void;
}

export function LegalHeader({
    title,
    subtitle,
    lastUpdated,
    version,
    readTime,
    searchQuery,
    onSearchChange,
    activeTab,
    onTabChange,
}: LegalHeaderProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        if (typeof window !== "undefined") {
            try {
                await navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch {
                // fallback
            }
        }
    };

    const handlePrint = () => {
        if (typeof window !== "undefined") {
            window.print();
        }
    };

    return (
        <header className="relative pt-12 pb-10 overflow-hidden border-b border-neutral-200 dark:border-neutral-800 bg-linear-to-b from-neutral-50 via-white to-neutral-50 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900 print:hidden">
            {/* Ambient Background Blur Elements */}
            <div className="absolute -top-24 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-10 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Back to Home & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to MeasurePro
                    </Link>

                    <div className="flex items-center gap-2">
                        {/* Tab Switcher if on unified page */}
                        {onTabChange && activeTab && (
                            <div className="inline-flex p-1 bg-neutral-200/70 dark:bg-neutral-800 rounded-full text-xs font-medium mr-2">
                                <button
                                    onClick={() => onTabChange("terms")}
                                    className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                                        activeTab === "terms"
                                            ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold"
                                            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                                    }`}
                                >
                                    Terms of Service
                                </button>
                                <button
                                    onClick={() => onTabChange("privacy")}
                                    className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                                        activeTab === "privacy"
                                            ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold"
                                            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                                    }`}
                                >
                                    Privacy Policy
                                </button>
                            </div>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleShare}
                            className="h-8 gap-1.5 text-xs rounded-full border-neutral-300 dark:border-neutral-700 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xs hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
                            {copied ? "Link Copied" : "Share"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="h-8 gap-1.5 text-xs rounded-full border-neutral-300 dark:border-neutral-700 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xs hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                            <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                        </Button>
                    </div>
                </div>

                {/* Hero Header Content */}
                <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge
                            variant="secondary"
                            className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-mono text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                        >
                            Internal Corporate Policy
                        </Badge>
                        <Badge
                            variant="outline"
                            className="border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-mono text-[11px] px-2.5 py-0.5 rounded-full"
                        >
                            {version}
                        </Badge>
                        <Badge
                            variant="outline"
                            className="border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30 text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1"
                        >
                            <ShieldCheck className="w-3 h-3" /> Company Staff Only
                        </Badge>
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-4">
                        {title}
                    </h1>

                    <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-6 leading-relaxed">
                        {subtitle}
                    </p>

                    {/* Metadata Pill & Search */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
                        <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                                Last updated: <strong className="text-neutral-700 dark:text-neutral-200 font-medium">{lastUpdated}</strong>
                            </span>
                            <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                                Est. {readTime}
                            </span>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-72">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                            <Input
                                type="text"
                                placeholder="Search clauses (e.g. cookies, billing)..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-9 pr-4 py-1.5 text-xs h-9 rounded-full border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus-visible:ring-neutral-400"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => onSearchChange("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
