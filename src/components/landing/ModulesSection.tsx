import { Laptop, Briefcase, BarChart3, Ruler, CheckSquare, TrendingUp, ChevronRight, Plus, Calendar, MoreHorizontal, Search, User, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ModulesSection() {
    return (
        <section id="modules" className="py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-24 animate-fade-in-up">
                    <span className="text-amber-600 font-semibold tracking-wider uppercase text-sm">One Platform, Complete Workflow</span>
                    <h2 className="mt-2 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
                        Tailored for every role.
                    </h2>
                </div>

                <div className="space-y-32">
                    {/* Field Module - Left Text, Right Visual (iPhone Mock) */}
                    <div className="group">
                        <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
                            <div className="lg:col-span-5 mb-12 lg:mb-0 transform transition-all duration-700 group-hover:translate-x-2">
                                <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 mb-6">
                                    For Fitters
                                </div>
                                <h3 className="text-3xl font-bold text-neutral-900 mb-6">Master the Field.</h3>
                                <p className="text-lg text-neutral-600 mb-8">
                                    Eliminate paper errors. The MeasurePro Field App guides fitters through every measurement, ensuring nothing is missed. Works completely offline.
                                </p>
                                <ul className="space-y-4 mb-8">
                                    <li className="flex items-center gap-3">
                                        <div className="p-1 rounded-full bg-emerald-100"><CheckSquare className="w-4 h-4 text-emerald-600" /></div>
                                        <span className="text-neutral-700">Laser measurement integration</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="p-1 rounded-full bg-emerald-100"><CheckSquare className="w-4 h-4 text-emerald-600" /></div>
                                        <span className="text-neutral-700">Photo & Signature capture</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="p-1 rounded-full bg-emerald-100"><CheckSquare className="w-4 h-4 text-emerald-600" /></div>
                                        <span className="text-neutral-700">Route optimization</span>
                                    </li>
                                </ul>
                                <Button variant="link" className="p-0 text-emerald-600 font-semibold text-lg h-auto">
                                    Learn more about Field App <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                            <div className="lg:col-span-7 flex justify-center perspective-1000">
                                {/* iPhone Mock */}
                                <div className="relative w-[300px] h-[600px] bg-neutral-900 rounded-[3rem] p-4 shadow-2xl border-4 border-neutral-800 transform rotate-y-12 rotate-z-6 transition-transform duration-700 group-hover:rotate-0">
                                    {/* Notch */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-900 rounded-b-xl z-20"></div>

                                    {/* Screen Content */}
                                    <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden flex flex-col relative z-10">
                                        {/* App Header */}
                                        <div className="h-14 bg-neutral-900 flex items-center justify-between px-4 pt-4">
                                            <div className="text-white text-sm font-medium">9:41</div>
                                            <div className="flex gap-1">
                                                <div className="w-4 h-3 bg-white rounded-sm"></div>
                                            </div>
                                        </div>
                                        <div className="bg-neutral-50 p-4 border-b border-neutral-100">
                                            <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium uppercase tracking-wider mb-1">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                Online
                                            </div>
                                            <h4 className="text-lg font-bold text-neutral-900">Villa 42 Measurement</h4>
                                            <p className="text-xs text-neutral-500">Jumeirah Park • Today, 10:00 AM</p>
                                        </div>
                                        {/* App Form */}
                                        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                                            <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-sm">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-medium text-sm">Living Room</span>
                                                    <span className="text-xs text-neutral-400">Ground Floor</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-neutral-50 p-2 rounded-lg">
                                                        <span className="text-[10px] uppercase text-neutral-400">Width</span>
                                                        <div className="text-lg font-mono">245.5<span className="text-xs text-neutral-400 ml-1">cm</span></div>
                                                    </div>
                                                    <div className="bg-neutral-50 p-2 rounded-lg">
                                                        <span className="text-[10px] uppercase text-neutral-400">Drop</span>
                                                        <div className="text-lg font-mono">210.0<span className="text-xs text-neutral-400 ml-1">cm</span></div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-sm opacity-75">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-medium text-sm">Master Bedroom</span>
                                                    <span className="text-xs text-neutral-400">First Floor</span>
                                                </div>
                                                <div className="h-10 bg-neutral-50 rounded-lg w-full"></div>
                                            </div>

                                            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <div className="text-xs text-emerald-800 font-medium">Photos Synced</div>
                                            </div>
                                        </div>
                                        {/* Bottom Nav */}
                                        <div className="h-16 bg-white border-t border-neutral-100 grid grid-cols-3 items-center">
                                            <div className="flex flex-col items-center gap-1 text-emerald-600">
                                                <Ruler className="w-5 h-5" />
                                                <span className="text-[10px] font-medium">Measure</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1 text-neutral-400">
                                                <Calendar className="w-5 h-5" />
                                                <span className="text-[10px] font-medium">Schedule</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1 text-neutral-400">
                                                <User className="w-5 h-5" />
                                                <span className="text-[10px] font-medium">Profile</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sales Module - Right Text, Left Visual (Kanban Mock) */}
                    <div className="group">
                        <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
                            <div className="lg:col-span-7 order-2 lg:order-1 mb-12 lg:mb-0 transform transition-all duration-700 group-hover:scale-105">
                                {/* Kanban Board Mock */}
                                <div className="bg-neutral-100 rounded-xl p-4 shadow-xl border border-neutral-200">
                                    {/* Toolbar */}
                                    <div className="flex justify-between items-center mb-6 bg-white p-3 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="font-bold text-neutral-900">Deals Pipeline</div>
                                            <span className="bg-neutral-100 text-neutral-600 text-xs px-2 py-1 rounded-full">12 Active</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">+</div>
                                            <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center"><Search className="w-4 h-4" /></div>
                                        </div>
                                    </div>
                                    {/* Columns */}
                                    <div className="grid grid-cols-3 gap-4">
                                        {/* Col 1 */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                                                New Leads <span className="text-neutral-300">3</span>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg shadow-sm border border-neutral-200 cursor-pointer hover:shadow-md transition-shadow">
                                                <div className="text-sm font-medium mb-1">Sarah Jones</div>
                                                <div className="text-xs text-neutral-500 mb-2">Villa 12, Springs</div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">New</span>
                                                    <div className="w-6 h-6 rounded-full bg-neutral-100"></div>
                                                </div>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg shadow-sm border border-neutral-200 cursor-pointer hover:shadow-md transition-shadow">
                                                <div className="text-sm font-medium mb-1">Tech Office Fitout</div>
                                                <div className="text-xs text-neutral-500 mb-2">Media City</div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">New</span>
                                                    <div className="w-6 h-6 rounded-full bg-neutral-100"></div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Col 2 */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                                                Quote Sent <span className="text-neutral-300">2</span>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-amber-500 cursor-pointer hover:shadow-md transition-shadow">
                                                <div className="text-sm font-medium mb-1">Ahmed Residence</div>
                                                <div className="text-xs text-neutral-500 mb-2">$4,250.00</div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded">Pending</span>
                                                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px]">AM</div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Col 3 */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                                                Won <span className="text-neutral-300">5</span>
                                            </div>
                                            <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-emerald-500 opacity-60">
                                                <div className="text-sm font-medium mb-1">Palm Villa renovation</div>
                                                <div className="text-xs text-neutral-500 mb-2">$12,800.00</div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">Signed</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-5 order-1 lg:order-2 transform transition-all duration-700 group-hover:-translate-x-2">
                                <div className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 mb-6">
                                    For Sales Managers
                                </div>
                                <h3 className="text-3xl font-bold text-neutral-900 mb-6">Close Deals Faster.</h3>
                                <p className="text-lg text-neutral-600 mb-8">
                                    Turn measurements into beautiful quotes in seconds. Track every lead, follow up automatically, and assign jobs to the right people.
                                </p>
                                <ul className="space-y-4 mb-8">
                                    <li className="flex items-center gap-3">
                                        <div className="p-1 rounded-full bg-amber-100"><CheckSquare className="w-4 h-4 text-amber-600" /></div>
                                        <span className="text-neutral-700">Instant Quote Generation</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="p-1 rounded-full bg-amber-100"><CheckSquare className="w-4 h-4 text-amber-600" /></div>
                                        <span className="text-neutral-700">Drag-and-drop Dispatch</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="p-1 rounded-full bg-amber-100"><CheckSquare className="w-4 h-4 text-amber-600" /></div>
                                        <span className="text-neutral-700">Pipeline Management</span>
                                    </li>
                                </ul>
                                <Button variant="link" className="p-0 text-amber-600 font-semibold text-lg h-auto">
                                    See Sales Features <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Owner Module - Left Text, Right Visual (Dashboard Mock) */}
                    <div className="group">
                        <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
                            <div className="lg:col-span-5 mb-12 lg:mb-0 transform transition-all duration-700 group-hover:translate-x-2">
                                <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 mb-6">
                                    For Owners
                                </div>
                                <h3 className="text-3xl font-bold text-neutral-900 mb-6">Total Control.</h3>
                                <p className="text-lg text-neutral-600 mb-8">
                                    Your business command center. Real-time analytics on revenue, team performance, and inventory. Make decisions based on data, not guesses.
                                </p>
                                <ul className="space-y-4 mb-8">
                                    <li className="flex items-center gap-3">
                                        <div className="p-1 rounded-full bg-indigo-100"><CheckSquare className="w-4 h-4 text-indigo-600" /></div>
                                        <span className="text-neutral-700">Global Financial View</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="p-1 rounded-full bg-indigo-100"><CheckSquare className="w-4 h-4 text-indigo-600" /></div>
                                        <span className="text-neutral-700">Team Performance Metrics</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="p-1 rounded-full bg-indigo-100"><CheckSquare className="w-4 h-4 text-indigo-600" /></div>
                                        <span className="text-neutral-700">Multi-branch support</span>
                                    </li>
                                </ul>
                                <Button variant="link" className="p-0 text-indigo-600 font-semibold text-lg h-auto">
                                    Explore Analytics <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                            <div className="lg:col-span-7 transform transition-all duration-700 group-hover:scale-105">
                                {/* Analytics Dashboard Mock */}
                                <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden relative">
                                    <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-8">
                                            <h4 className="text-xl font-bold text-neutral-900">Revenue Overview</h4>
                                            <div className="flex gap-2">
                                                <span className="px-3 py-1 bg-neutral-100 rounded-md text-xs font-medium text-neutral-600">This Month</span>
                                                <span className="px-3 py-1 bg-white border border-neutral-200 rounded-md text-xs font-medium text-neutral-400">Last Month</span>
                                            </div>
                                        </div>

                                        {/* Chart Area */}
                                        <div className="flex items-end gap-2 h-48 mb-6 relative">
                                            <div className="absolute inset-x-0 top-0 h-px bg-neutral-100 border-dashed border-t border-neutral-200"></div>
                                            <div className="absolute inset-x-0 top-1/4 h-px bg-neutral-100 border-dashed border-t border-neutral-200"></div>
                                            <div className="absolute inset-x-0 top-2/4 h-px bg-neutral-100 border-dashed border-t border-neutral-200"></div>
                                            <div className="absolute inset-x-0 top-3/4 h-px bg-neutral-100 border-dashed border-t border-neutral-200"></div>

                                            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                                <div key={i} className="flex-1 bg-indigo-50 rounded-t-lg relative group/bar hover:bg-indigo-100 transition-colors" style={{ height: `${h}%` }}>
                                                    <div className="absolute bottom-0 w-full bg-indigo-500 rounded-t-lg opacity-80" style={{ height: '40%' }}></div>
                                                    {/* Tooltip */}
                                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                        ${h * 120}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-neutral-50 p-4 rounded-xl">
                                                <div className="text-xs text-neutral-400 uppercase mb-1">Total Sales</div>
                                                <div className="text-2xl font-bold text-neutral-900">$48.2k</div>
                                                <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                                    <TrendingUp className="w-3 h-3" /> +12%
                                                </div>
                                            </div>
                                            <div className="bg-neutral-50 p-4 rounded-xl">
                                                <div className="text-xs text-neutral-400 uppercase mb-1">Conversion</div>
                                                <div className="text-2xl font-bold text-neutral-900">42%</div>
                                                <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                                    <TrendingUp className="w-3 h-3" /> +5%
                                                </div>
                                            </div>
                                            <div className="bg-neutral-50 p-4 rounded-xl">
                                                <div className="text-xs text-neutral-400 uppercase mb-1">Avg Ticket</div>
                                                <div className="text-2xl font-bold text-neutral-900">$1,250</div>
                                                <div className="text-xs text-neutral-400 font-medium">
                                                    -0.8%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
