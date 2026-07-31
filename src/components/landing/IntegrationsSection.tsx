import { LayoutGrid, Smartphone, Zap } from "lucide-react";

export function IntegrationsSection() {
    return (
        <section className="py-24 bg-neutral-900 text-white overflow-hidden relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500 via-neutral-900 to-neutral-900 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
                            Connects with everything. <br />
                            <span className="text-amber-500">Works everywhere.</span>
                        </h2>
                        <p className="text-lg text-neutral-400 mb-8">
                            MeasurePro isn't just a tool; it's the heart of your ecosystem. Connect with your favorite apps and work without limits.
                        </p>

                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <div className="bg-neutral-800 p-3 rounded-lg h-fit">
                                    <Zap className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-medium mb-2">Zapier & API Integration</h3>
                                    <p className="text-neutral-400 text-sm">
                                        Automate workflows by connecting MeasurePro to Xero, QuickBooks, Slack, or thousands of other apps via Zapier or our robust API.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="bg-neutral-800 p-3 rounded-lg h-fit">
                                    <Smartphone className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-medium mb-2">Offline-First Architecture</h3>
                                    <p className="text-neutral-400 text-sm">
                                        No internet? No problem. MeasurePro's field app works completely offline and intelligently syncs when connectivity returns.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="bg-neutral-800 p-3 rounded-lg h-fit">
                                    <LayoutGrid className="w-6 h-6 text-purple-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-medium mb-2">Fully Customizable</h3>
                                    <p className="text-neutral-400 text-sm">
                                        Tailor the experience to your brand. Custom fields, branded reports, and workflow adjustments to match your business logic.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        {/* Abstract visual of connections */}
                        <div className="aspect-square rounded-full border border-neutral-800 relative animate-spin-slow duration-[30s]">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />

                            {/* Orbiting Icons */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-800 p-4 rounded-xl border border-neutral-700">
                                <span className="font-bold text-white">Xero</span>
                            </div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-neutral-800 p-4 rounded-xl border border-neutral-700">
                                <span className="font-bold text-white">Slack</span>
                            </div>
                            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-800 p-4 rounded-xl border border-neutral-700">
                                <span className="font-bold text-white">Gmail</span>
                            </div>
                            <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 bg-neutral-800 p-4 rounded-xl border border-neutral-700">
                                <span className="font-bold text-white">CRM</span>
                            </div>
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-40 h-40 bg-neutral-900 rounded-2xl border border-neutral-700 flex flex-col items-center justify-center z-10 shadow-2xl">
                                <span className="text-2xl font-light text-white">Measure<span className="font-semibold">Pro</span></span>
                                <div className="flex gap-2 mt-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-xs text-neutral-500">Connected</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
