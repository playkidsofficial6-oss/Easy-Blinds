import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User, Phone, MapPin, ChevronRight, Briefcase, AlertCircle, ArrowRight } from "lucide-react";
import { InstallationJob } from "@/lib/data/jobs"; // We might need a unified type, but for now assuming compatible
import React from "react";

// Unified Job Interface compatible with both pages
export interface UnifiedJob {
    id: string;
    client: string;
    value?: number;
    email?: string;
    phone?: string;
    brand?: string;
    property?: string;
    productType?: string;
    priority?: string;
    address?: string; // detailed
    area?: string;    // fallback
    status?: string;
    time?: string;
    endTime?: string;
    // For Assignments Page Logic
    recommendedFitters?: Array<{ id: string; name: string; dist?: number }>;
    team?: string; // Assigned fitter name
    assignedBy?: string; // Who assigned it
}

interface JobCardProps {
    job: UnifiedJob;
    isSelected: boolean;
    onSelect: () => void;
    onAction?: (actionType: string, payload?: any) => void; // Generic action handler
    variant?: "assignment" | "schedule";
}

export function JobCard({ job, isSelected, onSelect, onAction, variant = "assignment" }: JobCardProps) {

    // Determine priority styling
    const isHighPriority = job.priority === "High";

    return (
        <div
            id={`job-card-${job.id}`}
            onClick={(e) => {
                onSelect();
                // Auto-scroll logic could be handled here or parent, keeping it simple here
                if (!isSelected) {
                    setTimeout(() => {
                        document.getElementById(`job-card-${job.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                }
            }}
            className={cn(
                "cursor-pointer border transition-all relative group hover:shadow-md rounded-xl overflow-hidden active:scale-[0.99] duration-200 mb-3", // Added mb-3 for lists
                isSelected ? "bg-white border-amber-500 shadow-xl ring-1 ring-amber-500/20 z-10" : "bg-white border-slate-200 hover:border-amber-300"
            )}
        >
            <div className="p-5">
                {/* Header: Client & Value */}
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h4 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                            {job.client}
                            {isHighPriority && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
                        </h4>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">{job.brand || "Standard Account"}</div>
                    </div>
                    <div className="flex flex-col items-end">
                        {job.value && <div className="font-mono font-medium text-emerald-700 text-sm">AED {job.value.toLocaleString()}</div>}
                        <div className="flex items-center gap-1 mt-1">
                            {isHighPriority && <Badge variant="destructive" className="text-[9px] h-4 px-1 rounded-[4px]">HIGH PRIORITY</Badge>}
                            <ChevronRight className={cn("w-4 h-4 text-slate-300 transition-transform duration-300", isSelected && "rotate-90 text-amber-500")} />
                        </div>
                    </div>
                </div>

                {/* Contact Details Grid — always shown: assigned fitter + phone */}
                <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                    <div
                        className="text-xs text-slate-500 flex items-center gap-2 truncate p-1"
                        title={job.team || job.email || "Not assigned"}
                    >
                        <div className="w-5 h-5 flex flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <User className="w-3 h-3" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className={`truncate font-medium leading-none ${job.team && job.team !== "Assigned Team" ? "text-amber-700" : "text-slate-400"}`}>
                                {job.team && job.team !== "Assigned Team" ? job.team : (job.email || "--")}
                            </span>
                            {job.assignedBy && <span className="text-[9px] text-slate-400 mt-0.5 truncate">by {job.assignedBy}</span>}
                        </div>
                    </div>
                    <a href={`tel:${job.phone}`} className="text-xs text-slate-500 hover:text-amber-600 flex items-center gap-2 truncate p-1 hover:bg-white rounded transition-colors" title={job.phone} onClick={(e) => e.stopPropagation()}>
                        <div className="w-5 h-5 flex flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Phone className="w-3 h-3" /></div>
                        <span className="truncate">{job.phone || "--"}</span>
                    </a>
                </div>

                {/* Footer: Location & Meta */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    {job.property && <Badge variant="outline" className="text-[10px] font-normal text-slate-600 bg-slate-50 border-slate-200">{job.property}</Badge>}
                    {job.productType && <Badge variant="outline" className="text-[10px] font-normal text-slate-600 bg-slate-50 border-slate-200">{job.productType}</Badge>}
                    {job.status && <Badge variant="outline" className="text-[10px] font-normal text-slate-600 bg-slate-50 border-slate-200">{job.status}</Badge>}

                    <div className="h-4 w-px bg-slate-200 mx-1"></div>

                    <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 truncate max-w-[180px]" title={job.address || job.area}>
                        <MapPin className="w-3 h-3 text-slate-300 flex-shrink-0" />
                        <span className="truncate">{job.address || job.area}</span>
                    </div>
                </div>
            </div>

            {/* Selection Overlay / Action Area (Only for Assignments variant) */}
            {isSelected && variant === "assignment" && job.recommendedFitters && (
                <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="pt-4 border-t border-slate-100">
                        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                            AI Recommended Fitters
                        </div>
                        <div className="space-y-2">
                            {job.recommendedFitters.map((rec, i) => (
                                <div key={rec.id} className="group/fitter flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-amber-500/50 hover:bg-white hover:shadow-md transition-all cursor-pointer" onClick={(e) => { e.stopPropagation(); onAction && onAction("assign", rec.id); }}>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-slate-700 text-xs font-bold border border-slate-200 shadow-sm transition-colors group-hover/fitter:bg-amber-500 group-hover/fitter:text-white group-hover/fitter:border-amber-500">{i + 1}</div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800 group-hover/fitter:text-slate-900 transition-colors">{rec.name}</p>
                                            <p className="text-[10px] text-slate-500 group-hover/fitter:text-amber-600/80">{typeof rec.dist === "number" ? `${rec.dist.toFixed(1)} km from site` : "Available fitter"}</p>
                                        </div>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-300 group-hover/fitter:text-amber-500 group-hover/fitter:border-amber-200 transition-all">
                                        <ArrowRight className="w-4 h-4 transform group-hover/fitter:translate-x-0.5 transition-transform" />
                                    </div>
                                </div>
                            ))}
                            {job.recommendedFitters.length === 0 && <p className="text-xs text-red-500 italic flex items-center gap-1"><AlertCircle className="w-3 h-3" /> No fitters in range.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
