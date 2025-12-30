import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-8">
            <div className="max-w-2xl text-center space-y-8">
                <div className="space-y-4">
                    <div className="w-20 h-20 bg-neutral-900 rounded-none flex items-center justify-center mx-auto mb-8">
                        <span className="text-white font-light text-4xl">EB</span>
                    </div>
                    <h1 className="text-6xl font-light tracking-tight text-neutral-900">
                        Easy Blinds
                        <span className="block font-semibold mt-2">Dubai</span>
                    </h1>
                    <p className="text-xl text-neutral-500 font-light">
                        Premium measurement and installation management
                    </p>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link href="/field" className="group">
                        <div className="bg-white border-2 border-neutral-200 p-8 hover:border-neutral-900 transition-all duration-300 cursor-pointer h-full">
                            <h2 className="text-2xl font-light text-neutral-900 mb-3 group-hover:font-medium transition-all">
                                Field Work
                            </h2>
                            <p className="text-neutral-500 mb-6 text-sm">
                                For measurement and installation teams
                            </p>
                            <div className="flex items-center gap-2 text-neutral-400 text-sm uppercase tracking-wider">
                                <span>Enter</span>
                                <ArrowLeft className="w-4 h-4 rotate-180" />
                            </div>
                        </div>
                    </Link>

                    <Link href="/sales-manager" className="group">
                        <div className="bg-amber-50 border-2 border-amber-200 p-8 hover:border-amber-500 transition-all duration-300 cursor-pointer h-full">
                            <h2 className="text-2xl font-light text-amber-900 mb-3 group-hover:font-medium transition-all">
                                Sales Manager
                            </h2>
                            <p className="text-amber-700/70 mb-6 text-sm">
                                Job assignment and team coordination
                            </p>
                            <div className="flex items-center gap-2 text-amber-600 text-sm uppercase tracking-wider">
                                <span>Enter</span>
                                <ArrowLeft className="w-4 h-4 rotate-180" />
                            </div>
                        </div>
                    </Link>

                    <Link href="/owner" className="group">
                        <div className="bg-neutral-900 border-2 border-neutral-900 p-8 hover:bg-neutral-800 transition-all duration-300 cursor-pointer h-full">
                            <h2 className="text-2xl font-light text-white mb-3 group-hover:font-medium transition-all">
                                Owner Portal
                            </h2>
                            <p className="text-neutral-400 mb-6 text-sm">
                                Business intelligence and analytics
                            </p>
                            <div className="flex items-center gap-2 text-amber-600 text-sm uppercase tracking-wider">
                                <span>Enter</span>
                                <ArrowLeft className="w-4 h-4 rotate-180" />
                            </div>
                        </div>
                    </Link>

                    <Link href="/stitching" className="group">
                        <div className="bg-indigo-50 border-2 border-indigo-200 p-8 hover:border-indigo-500 transition-all duration-300 cursor-pointer h-full">
                            <h2 className="text-2xl font-light text-indigo-900 mb-3 group-hover:font-medium transition-all">
                                Stitching Team
                            </h2>
                            <p className="text-indigo-700/70 mb-6 text-sm">
                                Workshop tasks and production queue
                            </p>
                            <div className="flex items-center gap-2 text-indigo-600 text-sm uppercase tracking-wider">
                                <span>Enter</span>
                                <ArrowLeft className="w-4 h-4 rotate-180" />
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
