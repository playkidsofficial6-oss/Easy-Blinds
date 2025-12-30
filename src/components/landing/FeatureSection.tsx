import { Laptop, Ruler, ShieldCheck, Zap, Scale, Layers } from "lucide-react";

export function FeatureSection() {
    const features = [
        {
            title: "Laser Precision",
            description: "Input measurements down to the millimeter. Automated deductions.",
            icon: Ruler,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            title: "Smart Pricing",
            description: "Instant quotes based on fabric consumption and hardware costs.",
            icon: Scale,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
        },
        {
            title: "Role Security",
            description: "Granular permissions for fitters, sales, and admins.",
            icon: ShieldCheck,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
        },
        {
            title: "Instant Sync",
            description: "Field changes reflect immediately in the office.",
            icon: Zap,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        },
        {
            title: "Multi-Unit Support",
            description: "Work in MM, CM, or Inches. We scale automatically.",
            icon: Layers,
            color: "text-indigo-500",
            bg: "bg-indigo-500/10",
        },
        {
            title: "Dyanmic Proposals",
            description: "Send beautiful, branded PDF quotes to clients.",
            icon: Laptop,
            color: "text-pink-500",
            bg: "bg-pink-500/10",
        }
    ];

    return (
        <section id="features" className="py-24 bg-neutral-900 text-white relative overflow-hidden">
            {/* Ambient background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-blue-600/20 blur-3xl opacity-50"></div>
                <div className="absolute top-1/2 right-0 w-96 h-96 rounded-full bg-amber-600/10 blur-3xl opacity-50"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500">
                        Engineered for Modern Studios
                    </h2>
                    <p className="mt-4 text-lg text-neutral-400 max-w-2xl mx-auto">
                        Upgrade from spreadsheets and generic CRMs to a system built for your craft.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <div key={i} className="group relative p-8 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors duration-300 overflow-hidden">
                            <div className={`absolute top-0 right-0 p-24 rounded-full ${feature.bg} blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                            <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-lg ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                                <p className="text-neutral-400 text-sm">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
