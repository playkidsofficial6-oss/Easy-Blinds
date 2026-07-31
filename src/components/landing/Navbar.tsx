import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
    return (
        <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="shrink-0 flex items-center">
                        <span className="text-2xl font-light tracking-tight text-neutral-900">
                            Measure<span className="font-semibold">Pro</span>
                        </span>
                    </div>
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="#features" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
                            Features
                        </Link>
                        <Link href="#how-it-works" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
                            How it works
                        </Link>
                        <Link href="#testimonials" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
                            Success Stories
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="ghost" className="text-neutral-600 hover:text-neutral-900">
                                Log in
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-full px-6">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
