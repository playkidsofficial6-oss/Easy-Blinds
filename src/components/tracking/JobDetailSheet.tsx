"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { getJob, assignFitter, type Job, JobStatus } from "@/lib/jobs";
import { getUsers, type UserRecord } from "@/lib/users";
import { isFitterRole } from "@/lib/auth";
import { toast } from "sonner";
import {
    X, Ruler, FileText, UserCheck, ChevronDown, ChevronUp,
    Loader2, CheckCircle, Phone, MapPin, Home,
    Package, DoorOpen, Wrench, AlertCircle, Camera, Image as ImageIcon, Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";

interface JobDetailSheetProps {
    jobId: string | null;
    onClose: () => void;
}

type TabKey = "measurements" | "quotation" | "assign" | "photos";

export function JobDetailSheet({ jobId, onClose }: JobDetailSheetProps) {
    const [job, setJob] = useState<Job | null>(null);
    const [measurement, setMeasurement] = useState<any>(null);
    const [fitters, setFitters] = useState<UserRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>("measurements");
    const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
    const [selectedFitter, setSelectedFitter] = useState("");
    const [isAssigning, setIsAssigning] = useState(false);

    const load = useCallback(async () => {
        if (!jobId) return;
        setIsLoading(true);
        try {
            const [jobData, measurementRes, usersData] = await Promise.allSettled([
                getJob(jobId),
                api.get<any>(`/measurements/job/${jobId}`),
                getUsers(),
            ]);

            if (jobData.status === "fulfilled") {
                const j = jobData.value;
                setJob(j);

            }
            if (measurementRes.status === "fulfilled") {
                setMeasurement(measurementRes.value.data);
            }
            if (usersData.status === "fulfilled") {
                setFitters(usersData.value.filter(u => isFitterRole(u.role)));
            }
        } catch (e) {
            toast.error("Failed to load job details");
        } finally {
            setIsLoading(false);
        }
    }, [jobId]);

    useEffect(() => {
        load();
    }, [load]);

    const handleAssign = async () => {
        if (!job || !selectedFitter) return;
        setIsAssigning(true);
        try {
            await assignFitter(job._id, selectedFitter);
            toast.success("Job successfully assigned to fitter!");
            await load();
        } catch {
            toast.error("Failed to assign fitter.");
        } finally {
            setIsAssigning(false);
        }
    };



    if (!jobId) return null;

    const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
        { key: "measurements", label: "Measurements", icon: <Ruler className="w-3.5 h-3.5" /> },
        { key: "quotation", label: "Quotation", icon: <FileText className="w-3.5 h-3.5" /> },
        { key: "assign", label: "Assign Fitter", icon: <UserCheck className="w-3.5 h-3.5" /> },
        { key: "photos", label: "Fitting Photos", icon: <Camera className="w-3.5 h-3.5" /> },
    ];

    const quote = job?.quotation;
    const quoteItems: any[] = quote?.items || [];
    const quoteTotal = quoteItems.reduce((s: number, i: any) => s + ((i.unitPrice || i.price || 0) * (i.quantity || 1)), 0);
    const vat = quoteTotal * 0.05;

    const assignedFitterUser = fitters.find(f => f._id === job?.assignedFitter);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

            {/* Sheet */}
            <div className="relative z-10 w-full sm:w-[560px] h-full sm:h-[90vh] bg-white sm:rounded-l-3xl shadow-2xl flex flex-col animate-in slide-in-from-right-10 duration-300">

                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-br from-slate-900 to-slate-800 sm:rounded-tl-3xl text-white shrink-0">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-1">Completed Job</p>
                            <h2 className="text-2xl font-semibold tracking-tight">{job?.customerName || "Loading..."}</h2>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {job && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="truncate">{job.customerPhone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="truncate">{job.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] uppercase font-bold">
                                    <CheckCircle className="w-3 h-3 mr-1" /> Completed
                                </Badge>
                                {job.productType && (
                                    <Badge className="bg-white/10 text-slate-300 border-white/10 text-[10px] uppercase font-bold">
                                        {job.productType}
                                    </Badge>
                                )}
                            </div>
                            {job.scheduledAt && (
                                <span className="text-xs text-slate-400">
                                    {format(parseISO(job.scheduledAt), "MMM d, yyyy · HH:mm")}
                                </span>
                            )}
                            {job.isReviewed && (
                                <div className="col-span-2 mt-1 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5 text-amber-300 font-medium shrink-0">
                                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        <span>Google Review: {job.reviewRating || 5}.0 Stars</span>
                                    </div>
                                    {job.reviewMessage && (
                                        <span className="text-[11px] text-amber-200/80 italic max-w-[240px] truncate ml-2">
                                            &ldquo;{job.reviewMessage}&rdquo;
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 bg-white shrink-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 py-3.5 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2",
                                activeTab === tab.key
                                    ? "border-slate-900 text-slate-900"
                                    : "border-transparent text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full gap-3 text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-sm font-medium">Loading details…</span>
                        </div>
                    ) : (
                        <>
                            {/* ── MEASUREMENTS TAB ── */}
                            {activeTab === "measurements" && (
                                <div className="p-6 space-y-4">
                                    {!measurement ? (
                                        <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
                                            <AlertCircle className="w-10 h-10" />
                                            <p className="text-sm font-medium">No measurements recorded yet.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Summary Strip */}
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { label: "Rooms", value: measurement.totalRooms },
                                                    { label: "Windows", value: measurement.totalWindows },
                                                ].map(s => (
                                                    <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                                                        <p className="text-2xl font-bold text-slate-900">{s.value ?? 0}</p>
                                                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">{s.label}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Visit Date */}
                                            <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                                    <Ruler className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Visit Date</p>
                                                    <p className="text-sm font-semibold text-slate-800">
                                                        {measurement.visitDate ? format(parseISO(measurement.visitDate), "MMMM d, yyyy") : "N/A"}
                                                    </p>
                                                </div>
                                                <Badge className={cn("ml-auto text-[10px] uppercase font-bold",
                                                    measurement.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                                                )}>
                                                    {measurement.status}
                                                </Badge>
                                            </div>

                                            {/* Rooms */}
                                            <div className="space-y-3">
                                                <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 flex items-center gap-2">
                                                    <Home className="w-3 h-3" /> Rooms & Openings
                                                </h3>
                                                {(measurement.rooms || []).map((room: any) => (
                                                    <div key={room.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                                        <button
                                                            className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                                                            onClick={() => setExpandedRoom(expandedRoom === room.id ? null : room.id)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                                                    <Home className="w-4 h-4 text-slate-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-slate-900 text-sm">{room.name}</p>
                                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{room.category}</p>
                                                                </div>
                                                            </div>
                                                            {expandedRoom === room.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                                        </button>

                                                        {expandedRoom === room.id && (
                                                            <div className="border-t border-slate-100 divide-y divide-slate-50">
                                                                {(room.openings || []).map((opening: any) => (
                                                                    <div key={opening.id} className="px-4 py-3 bg-slate-50/50">
                                                                        <div className="flex items-start justify-between mb-2">
                                                                            <div className="flex items-center gap-2">
                                                                                {opening.type === "Window" ? <Package className="w-3.5 h-3.5 text-blue-500" /> : <DoorOpen className="w-3.5 h-3.5 text-amber-500" />}
                                                                                <span className="text-sm font-semibold text-slate-800">{opening.name}</span>
                                                                                <Badge variant="outline" className="text-[9px] uppercase">{opening.type}</Badge>
                                                                            </div>
                                                                            <span className="text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                                                                                {opening.width} × {opening.height} {opening.measurementUnit}
                                                                            </span>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-6">
                                                                            {[
                                                                                ["Mount", opening.mountType],
                                                                                ["Direction", opening.openingDirection],
                                                                                ["Product", opening.productType],
                                                                                ["Material", opening.materialType || opening.customMaterial],
                                                                                ["Motor", opening.motorType],
                                                                            ].filter(([, v]) => v).map(([k, v]) => (
                                                                                <div key={String(k)} className="flex gap-1 text-[10px]">
                                                                                    <span className="text-slate-400 font-bold uppercase">{k}:</span>
                                                                                    <span className="text-slate-600">{String(v)}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        {opening.notes && (
                                                                            <p className="mt-2 pl-6 text-xs text-slate-500 italic">{opening.notes}</p>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ── QUOTATION TAB ── */}
                            {activeTab === "quotation" && (
                                <div className="p-6 space-y-4">
                                    {!quote ? (
                                        <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
                                            <FileText className="w-10 h-10" />
                                            <p className="text-sm font-medium">No quotation found for this job.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Status */}
                                            <div className="bg-white rounded-xl border border-slate-200 p-4">
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Quote ID</p>
                                                    <p className="text-sm font-bold text-slate-800 font-mono">{quote.id}</p>
                                                </div>
                                            </div>


                                            {/* Line Items */}
                                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                                                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Line Items</p>
                                                </div>
                                                {quoteItems.length === 0 ? (
                                                    <p className="text-xs text-slate-400 text-center py-6 italic">No line items</p>
                                                ) : (
                                                    <div className="divide-y divide-slate-50">
                                                        {quoteItems.map((item: any, idx: number) => (
                                                            <div key={item.id || idx} className="px-4 py-3 flex items-center justify-between gap-4">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-slate-800 truncate">{item.description}</p>
                                                                    <p className="text-[11px] text-slate-400 mt-0.5">Qty {item.quantity || 1} × AED {(item.unitPrice || item.price || 0).toLocaleString()}</p>
                                                                </div>
                                                                <span className="text-sm font-bold text-slate-800 font-mono whitespace-nowrap">
                                                                    AED {((item.unitPrice || item.price || 0) * (item.quantity || 1)).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* Totals */}
                                                <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 space-y-1.5">
                                                    <div className="flex justify-between text-xs text-slate-500">
                                                        <span>Subtotal</span>
                                                        <span className="font-mono">AED {quoteTotal.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-slate-500">
                                                        <span>VAT (5%)</span>
                                                        <span className="font-mono">AED {vat.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200 mt-1">
                                                        <span>Total</span>
                                                        <span className="font-mono text-emerald-700">AED {(quote.total || quoteTotal + vat).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Notes (view mode) */}
                                            {quote.notes && (
                                                <div className="bg-white rounded-xl border border-slate-200 p-4">
                                                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Notes</p>
                                                    <p className="text-sm text-slate-600 leading-relaxed">{quote.notes}</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ── ASSIGN FITTER TAB ── */}
                            {activeTab === "assign" && (
                                <div className="p-6 space-y-4">
                                    {/* Current Assignment */}
                                    {assignedFitterUser && (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <Wrench className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-600">Currently Assigned Fitter</p>
                                                <p className="text-sm font-semibold text-emerald-900">{assignedFitterUser.name}</p>
                                                {assignedFitterUser.phoneNumber && <p className="text-xs text-emerald-700">{assignedFitterUser.phoneNumber}</p>}
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-3">Select Fitter</p>
                                            <Select value={selectedFitter} onValueChange={setSelectedFitter}>
                                                <SelectTrigger className="h-11 border-slate-200">
                                                    <SelectValue placeholder="Choose a fitter to assign…" />
                                                </SelectTrigger>
                                                <SelectContent className="z-[9999]">
                                                    {fitters.length === 0 ? (
                                                        <div className="p-4 text-xs text-slate-400 text-center">No fitters available</div>
                                                    ) : fitters.map(f => (
                                                        <SelectItem key={f._id} value={f._id}>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                                    {f.name.substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">{f.name}</span>
                                                                    {f.phoneNumber && <span className="text-slate-400 ml-2 text-xs">{f.phoneNumber}</span>}
                                                                </div>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Job Summary */}
                                        <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-1.5">
                                            {[
                                                ["Client", job?.customerName],
                                                ["Address", job?.address],
                                                ["Product", job?.productType],
                                                ["Value", job?.projectValue ? `AED ${job.projectValue.toLocaleString()}` : undefined],
                                            ].filter(([, v]) => v).map(([k, v]) => (
                                                <div key={String(k)} className="flex gap-2 text-xs">
                                                    <span className="text-slate-400 font-bold uppercase w-14 shrink-0">{k}</span>
                                                    <span className="text-slate-700">{String(v)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <Button
                                            onClick={handleAssign}
                                            disabled={!selectedFitter || isAssigning}
                                            className="w-full h-11 bg-slate-900 hover:bg-slate-700 text-white font-semibold gap-2"
                                        >
                                            {isAssigning ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Assigning…</>
                                            ) : (
                                                <><UserCheck className="w-4 h-4" /> Confirm Assignment</>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* ── FITTING PHOTOS TAB ── */}
                            {activeTab === "photos" && (
                                <div className="p-6 space-y-4">
                                    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Current Job Status</p>
                                                <p className="text-sm font-semibold text-slate-800">{job?.status || "Pending"}</p>
                                            </div>
                                            {job?.status === JobStatus.Completed && (
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold uppercase">
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Completed
                                                </Badge>
                                            )}
                                        </div>

                                        {job?.fittingNotes && (
                                            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-1">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Fitter Notes</p>
                                                <p className="text-xs text-slate-700">{job.fittingNotes}</p>
                                            </div>
                                        )}

                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-3">Uploaded Photos</p>
                                            {(() => {
                                                const photosList = job?.photos || job?.fittingPhotos || [];
                                                return photosList.length === 0 ? (
                                                    <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400">
                                                        <ImageIcon className="w-8 h-8 stroke-[1.5]" />
                                                        <p className="text-xs font-medium">No photos uploaded yet.</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {photosList.map((url, idx) => (
                                                            <a
                                                                key={idx}
                                                                href={`${process.env.NEXT_PUBLIC_IMAGE_URL}${url}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 block"
                                                            >
                                                                <img
                                                                    src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${url}`}
                                                                    alt={`Fitting photo ${idx + 1}`}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                />
                                                            </a>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
