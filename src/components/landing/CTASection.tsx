import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
    return (
        <section className="relative isolate overflow-hidden bg-neutral-900 py-16 sm:py-24 lg:py-32">
            {/* Background Effects */}
            <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl xl:-top-6" aria-hidden="true">
                <div
                    className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
                    style={{
                        clipPath:
                            "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                    }}
                />
            </div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Ready to revolutionize your curtain business?
                        <br />
                        Start your free trial today.
                    </h2>
                    <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-neutral-300">
                        Join hundreds of curtain studios and fitters who have streamlined their operations with MeasurePro.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link href="/dashboard">
                            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-amber-500/20 transition-all">
                                Get started for free
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                        <Link href="#" className="text-sm font-semibold leading-6 text-white hover:text-amber-500 transition-colors">
                            Talk to sales <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
