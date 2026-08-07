"use client";

import { 
    ShieldCheck, 
    CreditCard, 
    Ruler, 
    Zap, 
    Lock, 
    ShieldAlert, 
    Cookie, 
    UserCheck,
    Sparkles 
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
    ShieldCheck,
    CreditCard,
    Ruler,
    Zap,
    Lock,
    ShieldAlert,
    Cookie,
    UserCheck,
};

interface TLDRItem {
    title: string;
    description: string;
    icon: string;
}

interface LegalTLDRCardProps {
    items: TLDRItem[];
}

export function LegalTLDRCard({ items }: LegalTLDRCardProps) {
    return (
        <section className="mb-12 print:hidden">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Key Highlights (TL;DR)
                </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {items.map((item, idx) => {
                    const IconComponent = ICON_MAP[item.icon] || ShieldCheck;
                    return (
                        <div
                            key={idx}
                            className="group relative p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-2xs hover:shadow-md"
                        >
                            <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                <IconComponent className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
                            </div>
                            <h3 className="font-semibold text-sm text-neutral-900 dark:text-white mb-1">
                                {item.title}
                            </h3>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
