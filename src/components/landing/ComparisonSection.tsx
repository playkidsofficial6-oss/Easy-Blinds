import { Check, X } from "lucide-react";

export function ComparisonSection() {
    const features = [
        { name: "Industry Specialization", measurePro: true, others: false, label: "Built for Curtains & Blinds" },
        { name: "Unit Handling", measurePro: true, others: false, label: "MM, CM, & Inches support" },
        { name: "Offline Capability", measurePro: true, others: false, label: "Full Offline Field App" },
        { name: "Pricing Engine", measurePro: true, others: false, label: "Auto-calculate Fabric Usage" },
        { name: "Modern UX", measurePro: true, others: false, label: "No clunky legacy interface" },
        { name: "Open API", measurePro: true, others: false, label: "Connect to any CRM/Accounting" },
    ];

    return (
        <section className="bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center mb-16">
                    <h2 className="text-base font-semibold leading-7 text-amber-600 uppercase tracking-widest">
                        Why Switch
                    </h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                        Stop struggling with generic software.
                    </p>
                    <p className="mt-6 text-lg leading-8 text-neutral-600">
                        Most CRMs are built for selling software or consulting. MeasurePro is built for selling window treatments.
                    </p>
                </div>

                <div className="relative overflow-hidden rounded-3xl border border-neutral-200">
                    <div className="grid grid-cols-3 border-b border-neutral-200 bg-neutral-50/50 p-6 text-sm font-medium text-neutral-500">
                        <div>Feature</div>
                        <div className="text-center text-neutral-900 font-bold">MeasurePro</div>
                        <div className="text-center">Generic CRMs</div>
                    </div>

                    <div className="divide-y divide-neutral-200 bg-white">
                        {features.map((feature) => (
                            <div key={feature.name} className="grid grid-cols-3 p-6 hover:bg-neutral-50 transition-colors">
                                <div className="flex flex-col justify-center">
                                    <span className="font-medium text-neutral-900">{feature.name}</span>
                                    <span className="text-xs text-neutral-500 hidden sm:block">{feature.label}</span>
                                </div>
                                <div className="flex items-center justify-center">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                                        <Check className="h-5 w-5 text-emerald-600" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-center">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                                        <X className="h-5 w-5 text-red-600" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
