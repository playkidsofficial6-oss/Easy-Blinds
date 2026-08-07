"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { LegalHeader } from "@/components/legal/LegalHeader";
import { LegalTLDRCard } from "@/components/legal/LegalTLDRCard";
import { LegalTableOfContents } from "@/components/legal/LegalTableOfContents";
import { LegalContent } from "@/components/legal/LegalContent";
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from "@/lib/legal-data";

export default function LegalHubPage() {
    const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");
    const [searchQuery, setSearchQuery] = useState("");

    const activeDocument = activeTab === "terms" ? TERMS_OF_SERVICE : PRIVACY_POLICY;
    const [activeSectionId, setActiveSectionId] = useState(activeDocument.sections[0]?.id || "");

    useEffect(() => {
        setActiveSectionId(activeDocument.sections[0]?.id || "");
    }, [activeTab, activeDocument]);

    const handleSectionClick = (id: string) => {
        setActiveSectionId(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 180;
            for (const section of activeDocument.sections) {
                const element = document.getElementById(section.id);
                if (element) {
                    const top = element.offsetTop;
                    const height = element.offsetHeight;
                    if (scrollPosition >= top && scrollPosition < top + height) {
                        setActiveSectionId(section.id);
                        break;
                    }
                }
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [activeDocument]);

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col font-sans selection:bg-neutral-900 selection:text-white">
            <Navbar />
            
            <main className="flex-1 pt-16">
                <LegalHeader
                    title={activeDocument.title}
                    subtitle={activeDocument.subtitle}
                    lastUpdated={activeDocument.lastUpdated}
                    version={activeDocument.version}
                    readTime={activeDocument.readTime}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <LegalTLDRCard items={activeDocument.tldrSummaries} />

                    <div className="flex flex-col lg:flex-row gap-10">
                        <LegalTableOfContents
                            sections={activeDocument.sections}
                            activeSectionId={activeSectionId}
                            onSectionClick={handleSectionClick}
                        />

                        <LegalContent
                            sections={activeDocument.sections}
                            searchQuery={searchQuery}
                        />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
