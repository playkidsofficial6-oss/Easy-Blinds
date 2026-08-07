"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { LegalHeader } from "@/components/legal/LegalHeader";
import { LegalTLDRCard } from "@/components/legal/LegalTLDRCard";
import { LegalTableOfContents } from "@/components/legal/LegalTableOfContents";
import { LegalContent } from "@/components/legal/LegalContent";
import { TERMS_OF_SERVICE } from "@/lib/legal-data";

export default function TermsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeSectionId, setActiveSectionId] = useState(TERMS_OF_SERVICE.sections[0]?.id || "");

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
            for (const section of TERMS_OF_SERVICE.sections) {
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
    }, []);

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col font-sans selection:bg-neutral-900 selection:text-white">
            <Navbar />
            
            <main className="flex-1 pt-16">
                <LegalHeader
                    title={TERMS_OF_SERVICE.title}
                    subtitle={TERMS_OF_SERVICE.subtitle}
                    lastUpdated={TERMS_OF_SERVICE.lastUpdated}
                    version={TERMS_OF_SERVICE.version}
                    readTime={TERMS_OF_SERVICE.readTime}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <LegalTLDRCard items={TERMS_OF_SERVICE.tldrSummaries} />

                    <div className="flex flex-col lg:flex-row gap-10">
                        <LegalTableOfContents
                            sections={TERMS_OF_SERVICE.sections}
                            activeSectionId={activeSectionId}
                            onSectionClick={handleSectionClick}
                        />

                        <LegalContent
                            sections={TERMS_OF_SERVICE.sections}
                            searchQuery={searchQuery}
                        />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
