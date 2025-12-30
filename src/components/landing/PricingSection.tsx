import { CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PricingSection() {
    const tiers = [
        {
            name: "Starter",
            id: "starter",
            href: "#",
            priceMonthly: "$49",
            description: "Essential tools for small curtain studios and independent fitters.",
            features: [
                "Up to 3 Users",
                "Unlimited Measurements",
                "Basic Quotes",
                "Mobile App Access (Offline Mode)",
                "Email Support",
            ],
            featured: false,
        },
        {
            name: "Professional",
            id: "professional",
            href: "#",
            priceMonthly: "$129",
            description: "Everything you need to scale your window business operations.",
            features: [
                "Up to 10 Users",
                "Advanced Pricing Engine",
                "Fabric & Hardware Product Catalog",
                "Zapier & API Integration",
                "Team Scheduling & Dispatch",
                "Priority Support",
            ],
            featured: true,
        },
        {
            name: "Enterprise",
            id: "enterprise",
            href: "#",
            priceMonthly: "Custom",
            description: "Dedicated support and infrastructure for large retailers.",
            features: [
                "Unlimited Users",
                "Multi-Branch Support",
                "Custom Branding & White Label",
                "Dedicated Success Manager",
                "SLA & Advanced Security",
                "Custom Onboarding",
            ],
            featured: false,
        },
    ];

    return (
        <section id="pricing" className="bg-neutral-50 py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-base font-semibold leading-7 text-amber-600 uppercase tracking-widest">
                        Pricing
                    </h2>
                    <p className="mt-2 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
                        Choose the right plan for your growth.
                    </p>
                </div>
                <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-neutral-600">
                    Transparent pricing. No hidden installation fees. Start with a 14-day free trial.
                </p>
                <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                    {tiers.map((tier, tierIdx) => (
                        <div
                            key={tier.id}
                            className={`flex flex-col justify-between rounded-3xl p-8 ring-1 xl:p-10 ${tier.featured
                                    ? "bg-neutral-900 ring-neutral-900 shadow-xl scale-105 z-10"
                                    : "bg-white ring-neutral-200"
                                }`}
                        >
                            <div>
                                <div className="flex items-center justify-between gap-x-4">
                                    <h3
                                        id={tier.id}
                                        className={`text-lg font-semibold leading-8 ${tier.featured ? "text-white" : "text-neutral-900"
                                            }`}
                                    >
                                        {tier.name}
                                    </h3>
                                    {tier.featured && (
                                        <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold leading-5 text-amber-500 ring-1 ring-inset ring-amber-500/20">
                                            Most Popular
                                        </span>
                                    )}
                                </div>
                                <p className={`mt-4 text-sm leading-6 ${tier.featured ? "text-neutral-300" : "text-neutral-600"}`}>
                                    {tier.description}
                                </p>
                                <p className="mt-6 flex items-baseline gap-x-1">
                                    <span className={`text-4xl font-bold tracking-tight ${tier.featured ? "text-white" : "text-neutral-900"}`}>
                                        {tier.priceMonthly}
                                    </span>
                                    {tier.priceMonthly !== "Custom" && (
                                        <span className={`text-sm font-semibold leading-6 ${tier.featured ? "text-neutral-300" : "text-neutral-600"}`}>
                                            /month
                                        </span>
                                    )}
                                </p>
                                <ul
                                    role="list"
                                    className={`mt-8 space-y-3 text-sm leading-6 ${tier.featured ? "text-neutral-300" : "text-neutral-600"
                                        }`}
                                >
                                    {tier.features.map((feature) => (
                                        <li key={feature} className="flex gap-x-3">
                                            <CheckCircle2
                                                className={`h-6 w-5 flex-none ${tier.featured ? "text-white" : "text-amber-600"
                                                    }`}
                                                aria-hidden="true"
                                            />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Button
                                variant={tier.featured ? "default" : "outline"}
                                className={`mt-8 w-full ${tier.featured ? "bg-amber-500 hover:bg-amber-600 text-white border-0" : "border-neutral-200"}`}
                            >
                                Get started today
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
