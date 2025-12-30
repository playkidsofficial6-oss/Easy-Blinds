import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { FeatureSection } from "@/components/landing/FeatureSection";
import { ModulesSection } from "@/components/landing/ModulesSection";
import { IntegrationsSection } from "@/components/landing/IntegrationsSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function MarketingPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main>
                <Hero />
                <FeatureSection />
                <ModulesSection />
                <ComparisonSection />
                <IntegrationsSection />
                <PricingSection />
                <CTASection />
                <Footer />
            </main>
        </div>
    );
}
