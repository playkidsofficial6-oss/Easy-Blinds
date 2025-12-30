import Link from "next/link";

export function Footer() {
    return (
        <footer className="bg-white border-t border-neutral-100 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-2 md:col-span-1">
                        <span className="text-2xl font-light tracking-tight text-neutral-900 mb-4 block">
                            Measure<span className="font-semibold">Pro</span>
                        </span>
                        <p className="text-neutral-500 text-sm">
                            The operating system for modern curtain and blind businesses.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-neutral-900 mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-neutral-500">
                            <li><Link href="#" className="hover:text-neutral-900">Features</Link></li>
                            <li><Link href="#" className="hover:text-neutral-900">Pricing</Link></li>
                            <li><Link href="#" className="hover:text-neutral-900">Enterprise</Link></li>
                            <li><Link href="/dashboard" className="hover:text-neutral-900">Login</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-neutral-900 mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-neutral-500">
                            <li><Link href="#" className="hover:text-neutral-900">About</Link></li>
                            <li><Link href="#" className="hover:text-neutral-900">Blog</Link></li>
                            <li><Link href="#" className="hover:text-neutral-900">Careers</Link></li>
                            <li><Link href="#" className="hover:text-neutral-900">Contact</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-neutral-900 mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-neutral-500">
                            <li><Link href="#" className="hover:text-neutral-900">Privacy</Link></li>
                            <li><Link href="#" className="hover:text-neutral-900">Terms</Link></li>
                            <li><Link href="#" className="hover:text-neutral-900">Security</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-neutral-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-neutral-400 text-sm">
                        © {new Date().getFullYear()} MeasurePro. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        {/* Social icons could go here */}
                    </div>
                </div>
            </div>
        </footer>
    );
}
