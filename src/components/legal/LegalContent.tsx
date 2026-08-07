"use client";

import { useState } from "react";
import { Link2, Check, Mail, MapPin, ExternalLink, ShieldCheck, AlertCircle } from "lucide-react";
import { LegalSection } from "@/lib/legal-data";

interface LegalContentProps {
    sections: LegalSection[];
    searchQuery: string;
}

export function LegalContent({ sections, searchQuery }: LegalContentProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopyAnchor = (id: string) => {
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.hash = `#${id}`;
            navigator.clipboard.writeText(url.toString());
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        }
    };

    const highlightText = (text: string, query: string) => {
        if (!query.trim()) return text;
        const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <mark key={i} className="bg-amber-200 dark:bg-amber-900/60 dark:text-amber-100 rounded-xs px-0.5 font-semibold">
                    {part}
                </mark>
            ) : (
                part
            )
        );
    };

    const filteredSections = sections.filter((section) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchesTitle = section.title.toLowerCase().includes(q);
        const matchesSummary = section.summary?.toLowerCase().includes(q);
        const matchesParagraphs = section.paragraphs.some((p) => p.toLowerCase().includes(q));
        return matchesTitle || matchesSummary || matchesParagraphs;
    });

    if (filteredSections.length === 0) {
        return (
            <div className="py-16 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl">
                <AlertCircle className="w-10 h-10 mx-auto text-neutral-400 mb-3" />
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">
                    No matching clauses found
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
                    We couldn&apos;t find any sections matching &quot;{searchQuery}&quot;. Try searching for general terms like &quot;billing&quot;, &quot;cookies&quot;, or &quot;data&quot;.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 min-w-0 space-y-12">
            {filteredSections.map((section) => (
                <section
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-28 p-6 sm:p-8 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/80 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group relative"
                >
                    {/* Section Header with Anchor Link */}
                    <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                                {highlightText(section.title, searchQuery)}
                            </h2>
                            {section.summary && (
                                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                                    {highlightText(section.summary, searchQuery)}
                                </p>
                            )}
                        </div>

                        <button
                            onClick={() => handleCopyAnchor(section.id)}
                            title="Copy link to this section"
                            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all opacity-0 group-hover:opacity-100 cursor-pointer print:hidden"
                        >
                            {copiedId === section.id ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                                <Link2 className="w-4 h-4" />
                            )}
                        </button>
                    </div>

                    {/* Paragraph Content */}
                    <div className="space-y-3.5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                        {section.paragraphs.map((paragraph, pIdx) => {
                            const isBullet = paragraph.startsWith("•");
                            return (
                                <p
                                    key={pIdx}
                                    className={`${
                                        isBullet
                                            ? "pl-4 text-neutral-600 dark:text-neutral-400 font-normal"
                                            : ""
                                    }`}
                                >
                                    {highlightText(paragraph, searchQuery)}
                                </p>
                            );
                        })}
                    </div>
                </section>
            ))}

            {/* Internal IT & Compliance Contact Card Footer */}
            <div className="p-6 sm:p-8 rounded-2xl bg-linear-to-br from-neutral-900 to-neutral-950 text-white dark:from-neutral-900 dark:to-black border border-neutral-800 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">
                            <ShieldCheck className="w-4 h-4" /> Internal Operations & IT Support
                        </div>
                        <h3 className="text-xl font-bold mb-2">Need help or account permission updates?</h3>
                        <p className="text-xs text-neutral-300 max-w-lg leading-relaxed">
                            For technical assistance with mobile laser devices, account permission upgrades, or reporting lost equipment, contact internal company support.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2.5 w-full sm:w-auto shrink-0">
                        <a
                            href="mailto:support@company.internal"
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 text-xs font-bold transition-colors shadow-xs"
                        >
                            <Mail className="w-4 h-4" /> Internal IT Helpdesk
                        </a>
                        <a
                            href="mailto:privacy@company.internal"
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-500 text-xs font-medium transition-colors"
                        >
                            <Mail className="w-4 h-4" /> Data Compliance
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
