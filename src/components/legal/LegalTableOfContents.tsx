"use client";

import { useEffect, useState } from "react";
import { ListFilter, ChevronRight } from "lucide-react";
import { LegalSection } from "@/lib/legal-data";

interface LegalTableOfContentsProps {
    sections: LegalSection[];
    activeSectionId: string;
    onSectionClick: (id: string) => void;
}

export function LegalTableOfContents({
    sections,
    activeSectionId,
    onSectionClick,
}: LegalTableOfContentsProps) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Desktop Sidebar TOC */}
            <aside className="hidden lg:block w-72 shrink-0 print:hidden">
                <div className="sticky top-24 space-y-6">
                    <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xs">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-200/60 dark:border-neutral-800/60">
                            <ListFilter className="w-4 h-4 text-neutral-500" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                Table of Contents
                            </h3>
                        </div>

                        <nav className="space-y-1">
                            {sections.map((section) => {
                                const isActive = activeSectionId === section.id;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => onSectionClick(section.id)}
                                        className={`w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition-all flex items-center justify-between group cursor-pointer ${
                                            isActive
                                                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-xs"
                                                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                                        }`}
                                    >
                                        <span className="truncate">{section.title}</span>
                                        <ChevronRight
                                            className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                                                isActive
                                                    ? "opacity-100 translate-x-0.5"
                                                    : "opacity-0 group-hover:opacity-100"
                                            }`}
                                        />
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Quick Support Card */}
                    <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-900 text-white dark:bg-neutral-950 dark:border-neutral-700">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                            Internal System Helpdesk
                        </h4>
                        <p className="text-xs text-neutral-300 mb-3 leading-relaxed">
                            Questions regarding tablet laser pairing or staff access permissions?
                        </p>
                        <a
                            href="mailto:support@company.internal"
                            className="inline-flex items-center text-xs font-medium text-blue-400 hover:text-blue-300 underline underline-offset-4"
                        >
                            Email support@company.internal &rarr;
                        </a>
                    </div>
                </div>
            </aside>

            {/* Mobile Dropdown TOC */}
            <div className="lg:hidden mb-6 print:hidden">
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-left text-xs font-semibold text-neutral-900 dark:text-white shadow-xs"
                >
                    <span className="flex items-center gap-2">
                        <ListFilter className="w-4 h-4 text-neutral-500" />
                        Jump to Section ({sections.length} topics)
                    </span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${mobileOpen ? "rotate-90" : ""}`} />
                </button>

                {mobileOpen && (
                    <div className="mt-2 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1 shadow-lg">
                        {sections.map((section) => {
                            const isActive = activeSectionId === section.id;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => {
                                        onSectionClick(section.id);
                                        setMobileOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all ${
                                        isActive
                                            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold"
                                            : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                    }`}
                                >
                                    {section.title}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
