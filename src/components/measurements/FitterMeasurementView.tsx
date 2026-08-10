"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Ruler,
    MapPin,
    Phone,
    Calendar,
    Printer,
    ArrowLeft,
    Layers,
    Compass,
    Cpu,
    ImageIcon,
    FileText,
    CheckCircle2,
    X,
    Maximize2,
    Building2,
    Search,
    Navigation
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { ClientDetails, Room, WindowMeasurement } from "@/types/measurement";

interface FitterMeasurementViewProps {
    jobId: string | null;
    clientDetails: Partial<ClientDetails>;
    rooms: Room[];
    isLoading: boolean;
    onSelectJob?: (jobId: string) => void;
    availableJobs?: Array<{ id: string; customerName: string; address: string }>;
}

export function FitterMeasurementView({
    jobId,
    clientDetails,
    rooms,
    isLoading,
    onSelectJob,
    availableJobs = [],
}: FitterMeasurementViewProps) {
    const router = useRouter();
    const [selectedRoomId, setSelectedRoomId] = useState<string | "all">("all");
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const totalOpenings = rooms.reduce((acc, r) => acc + (r.windows?.length || 0), 0);
    const motorizedCount = rooms.reduce((acc, r) => {
        return acc + (r.windows?.filter(w => w.motorType && w.motorType !== "Manual").length || 0);
    }, 0);
    const ceilingMountCount = rooms.reduce((acc, r) => {
        return acc + (r.windows?.filter(w => w.mountType === "Ceiling").length || 0);
    }, 0);
    const wallMountCount = rooms.reduce((acc, r) => {
        return acc + (r.windows?.filter(w => w.mountType === "Wall").length || 0);
    }, 0);

    const filteredRooms = rooms
        .filter(r => selectedRoomId === "all" || r.id === selectedRoomId)
        .map(r => ({
            ...r,
            windows: (r.windows || []).filter(w => {
                if (!searchQuery.trim()) return true;
                const query = searchQuery.toLowerCase();
                return (
                    w.name.toLowerCase().includes(query) ||
                    w.productType?.toLowerCase().includes(query) ||
                    w.fabricSelection?.toLowerCase().includes(query) ||
                    w.customFabricName?.toLowerCase().includes(query) ||
                    w.notes?.toLowerCase().includes(query)
                );
            })
        }))
        .filter(r => r.windows.length > 0 || !searchQuery.trim());

    const handlePrint = () => {
        if (typeof window !== "undefined") {
            window.print();
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-3 text-stone-500">
                    <span className="h-9 w-9 animate-spin rounded-full border-4 border-stone-300 border-t-stone-900"></span>
                    <span className="font-light italic text-sm">Retrieving installation specifications...</span>
                </div>
            </div>
        );
    }

    // Fallback: Picker when no jobId is in query params
    if (!jobId) {
        return (
            <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">Fitter Specifications</h1>
                    <p className="text-stone-500 text-sm mt-1">Select an assigned job to view window dimensions and fitting notes</p>
                </div>

                <Card className="p-4 sm:p-6">
                    {availableJobs.length > 0 ? (
                        <div className="grid gap-3">
                            {availableJobs.map(job => (
                                <button
                                    key={job.id}
                                    onClick={() => onSelectJob ? onSelectJob(job.id) : router.push(`/dashboard/measurements/new?jobId=${job.id}`)}
                                    className="p-4 rounded-xl border border-stone-200 hover:border-stone-400 hover:bg-stone-50 transition-all text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                                >
                                    <div>
                                        <h4 className="font-bold text-stone-900 group-hover:text-blue-600">{job.customerName}</h4>
                                        <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                                            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                            {job.address}
                                        </p>
                                    </div>
                                    <Badge className="bg-stone-900 text-white group-hover:bg-blue-600 self-start sm:self-auto">
                                        View Specs &rarr;
                                    </Badge>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-stone-400 space-y-2">
                            <Ruler className="w-10 h-10 mx-auto text-stone-300" />
                            <p className="text-sm font-medium">No assigned jobs found with measurements.</p>
                        </div>
                    )}

                    <div className="pt-4 border-t border-stone-100 mt-4 flex justify-start">
                        <Button variant="outline" onClick={() => router.push("/dashboard")} className="w-full sm:w-auto">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Return to Dashboard
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 pb-16 print:p-0">
            {/* Page Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden border-b border-stone-200 pb-5">
                <div className="space-y-1.5">

                    <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
                        {clientDetails.name ? `${clientDetails.name}'s Installation Specs` : "Measurement Specifications"}
                    </h1>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">

                    <Button
                        onClick={() => router.push("/dashboard")}
                        className="flex-1 sm:flex-none bg-stone-900 hover:bg-stone-800 text-white shadow-sm"
                    >
                        Dashboard
                    </Button>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-6 border-b border-stone-300 pb-4">
                <h1 className="text-2xl font-bold text-stone-900">MeasurePro Installation Specifications Sheet</h1>
                <p className="text-sm text-stone-600 mt-1">Customer: {clientDetails.name} | Job ID: #{jobId} | Date: {new Date().toLocaleDateString()}</p>
            </div>

            {/* Customer & Location Banner Card */}
            <Card className="p-4 sm:p-6 bg-white border border-stone-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Customer Name</span>
                        <h2 className="text-xl sm:text-2xl font-bold text-stone-900">{clientDetails.name || "Customer Name"}</h2>
                        <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                            <span className="px-2 py-0.5 bg-stone-100 rounded-md font-semibold text-stone-700">{clientDetails.propertyType || "Apartment"}</span>
                            <span>&bull;</span>
                            <span>{clientDetails.area || "Dubai"}</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                        {clientDetails.phone && (
                            <a
                                href={`tel:${clientDetails.phone}`}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-xl text-xs transition-colors border border-emerald-200"
                            >
                                <Phone className="w-4 h-4 text-emerald-600" />
                                Call Client ({clientDetails.phone})
                            </a>
                        )}
                        {clientDetails.location && (
                            <a
                                href={`https://maps.google.com/?q=${encodeURIComponent(clientDetails.location)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold rounded-xl text-xs transition-colors border border-blue-200"
                            >
                                <Navigation className="w-4 h-4 text-blue-600" />
                                Open Map
                            </a>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-xs">
                    <div className="flex items-start gap-2 text-stone-600 bg-stone-50/60 p-3 rounded-xl sm:bg-transparent sm:p-0">
                        <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold text-stone-900 block">Site Address:</span>
                            <span className="break-words">{clientDetails.location || "No address specified"}</span>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 text-stone-600 bg-stone-50/60 p-3 rounded-xl sm:bg-transparent sm:p-0">
                        <Calendar className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold text-stone-900 block">Visit / Measuring Date:</span>
                            <span>
                                {clientDetails.visitDate
                                    ? new Date(clientDetails.visitDate).toLocaleDateString("en-US", {
                                        weekday: "short",
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    })
                                    : "Recently Recorded"}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 text-stone-600 bg-stone-50/60 p-3 rounded-xl sm:bg-transparent sm:p-0">
                        <Building2 className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold text-stone-900 block">Job Status:</span>
                            <span className="text-blue-700 font-bold">Ready for Installation</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <Card className="p-3.5 sm:p-4 bg-white border border-stone-200 rounded-2xl shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                        <Layers className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl sm:text-2xl font-bold text-stone-900">{rooms.length}</div>
                        <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Total Rooms</div>
                    </div>
                </Card>

                <Card className="p-3.5 sm:p-4 bg-white border border-stone-200 rounded-2xl shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
                        <Ruler className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl sm:text-2xl font-bold text-stone-900">{totalOpenings}</div>
                        <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Total Windows</div>
                    </div>
                </Card>

                <Card className="p-3.5 sm:p-4 bg-white border border-stone-200 rounded-2xl shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                        <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl sm:text-2xl font-bold text-stone-900">{motorizedCount}</div>
                        <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Motorized</div>
                    </div>
                </Card>

                <Card className="p-3.5 sm:p-4 bg-white border border-stone-200 rounded-2xl shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                        <Compass className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-stone-900">
                            W: {wallMountCount} &bull; C: {ceilingMountCount}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mt-0.5">Mount Types</div>
                    </div>
                </Card>
            </div>

            {/* Room Filter Pills & Search */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 print:hidden">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-0.5 max-w-full -mx-4 px-4 sm:mx-0 sm:px-0">
                    <button
                        onClick={() => setSelectedRoomId("all")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedRoomId === "all"
                            ? "bg-stone-900 text-white shadow-sm"
                            : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-100"
                            }`}
                    >
                        All Rooms ({rooms.length})
                    </button>

                    {rooms.map(room => (
                        <button
                            key={room.id}
                            onClick={() => setSelectedRoomId(room.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${selectedRoomId === room.id
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-100"
                                }`}
                        >
                            <span>{room.name}</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedRoomId === room.id ? "bg-blue-800 text-white" : "bg-stone-100 text-stone-700"
                                }`}>
                                {room.windows?.length || 0}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64 shrink-0">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                        type="text"
                        placeholder="Search window, fabric..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-white border-stone-200 text-xs h-9.5 w-full"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Room List & Window Specifications */}
            {filteredRooms.length === 0 ? (
                <Card className="p-8 sm:p-12 text-center border-stone-200 bg-white">
                    <FileText className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                    <h3 className="text-base font-bold text-stone-800">No Measurements Match Filter</h3>
                    <p className="text-xs text-stone-500 mt-1">
                        {searchQuery ? "Try clearing your search query to view all rooms." : "No window measurements recorded for this job."}
                    </p>
                </Card>
            ) : (
                <div className="space-y-6">
                    {filteredRooms.map(room => (
                        <div key={room.id} className="space-y-4 print:break-inside-avoid">
                            {/* Room Section Header */}
                            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
                                    {room.name}
                                    <span className="text-xs font-semibold text-stone-500 px-2 py-0.5 bg-stone-100 rounded-md">
                                        {room.windows?.length || 0} Openings
                                    </span>
                                </h3>
                            </div>

                            {/* Window Spec Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {room.windows.map((windowItem, idx) => (
                                    <WindowSpecCard
                                        key={windowItem.id || idx}
                                        window={windowItem}
                                        index={idx + 1}
                                        onPreviewPhoto={setPreviewPhoto}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox Modal for Site Photos */}
            {previewPhoto && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
                    <div className="relative max-w-3xl max-h-[85vh] bg-stone-900 rounded-2xl overflow-hidden shadow-2xl p-2 border border-stone-800 flex flex-col items-center">
                        <button
                            onClick={() => setPreviewPhoto(null)}
                            className="absolute top-4 right-4 p-2 bg-stone-800 hover:bg-stone-700 text-white rounded-full transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        {/* eslint-disable-next-html-element-suppression */}
                        <img
                            src={previewPhoto}
                            alt="Window Site Photo Preview"
                            className="max-h-[75vh] w-auto object-contain rounded-xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// Sub-component: Clean, Standardized Window Spec Card for Fitters
function WindowSpecCard({
    window: win,
    index,
    onPreviewPhoto,
}: {
    window: WindowMeasurement;
    index: number;
    onPreviewPhoto: (url: string) => void;
}) {
    const isCustom = win.productType === "Custom Item";
    const productName = isCustom
        ? (win.customProductName || "Custom Item")
        : (win.productType || "Curtain / Blind");

    const fabricName = win.fabricSelection === "Custom"
        ? win.customFabricName
        : (win.fabricSelection || "Standard Selection");

    const isMotorized = win.motorType && win.motorType !== "Manual";

    return (
        <Card className="p-4 sm:p-5 bg-white border border-stone-200 rounded-2xl shadow-sm space-y-4 hover:border-stone-300 transition-all print:border-stone-400 print:shadow-none">
            {/* Window Title & Badges */}
            <div className="flex flex-wrap justify-between items-start gap-2 border-b border-stone-100 pb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            #{index}
                        </span>
                        <h4 className="font-bold text-stone-900 text-base">{win.name || `Window #${index}`}</h4>
                    </div>
                    <p className="text-xs font-semibold text-blue-700 mt-0.5">{productName}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="bg-stone-50 text-stone-700 border-stone-200 text-[10px]">
                        {win.mountType || "Wall"}
                    </Badge>
                    <Badge variant="outline" className="bg-stone-50 text-stone-700 border-stone-200 text-[10px]">
                        {win.openingDirection || "Split"}
                    </Badge>
                </div>
            </div>

            {/* Prominent High-Visibility Dimension Box */}
            <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Dimensions (Width &times; Drop)</span>
                    <div className="text-xl sm:text-2xl font-mono font-bold text-stone-900 mt-0.5">
                        {win.width || 0} <span className="text-stone-500 text-sm font-normal">cm</span> &times; {win.height || 0} <span className="text-stone-500 text-sm font-normal">cm</span>
                    </div>
                </div>
                <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-stone-200 pt-2 sm:pt-0 sm:pl-3 w-full sm:w-auto">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">In Millimeters</span>
                    <div className="text-xs font-mono font-semibold text-stone-600 mt-0.5">
                        {(win.width || 0) * 10} &times; {(win.height || 0) * 10} mm
                    </div>
                </div>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-stone-50/70 p-2.5 rounded-lg border border-stone-100">
                    <span className="text-stone-400 font-medium block text-[10px] uppercase tracking-wider">Fabric / Material</span>
                    <span className="font-bold text-stone-800 block truncate mt-0.5" title={fabricName}>
                        {fabricName}
                    </span>
                </div>

                <div className="bg-stone-50/70 p-2.5 rounded-lg border border-stone-100">
                    <span className="text-stone-400 font-medium block text-[10px] uppercase tracking-wider">Control / Motor</span>
                    <span className={`font-bold block mt-0.5 ${isMotorized ? "text-amber-700 flex items-center gap-1" : "text-stone-800"}`}>
                        {isMotorized && <Cpu className="w-3 h-3 text-amber-600 shrink-0" />}
                        {win.motorType || "Manual"}
                    </span>
                </div>
            </div>

            {/* Fitting Notes */}
            {win.notes && (
                <div className="p-3 bg-amber-50/80 border border-amber-200/60 text-amber-900 rounded-xl text-xs space-y-1">
                    <div className="font-bold uppercase tracking-wider text-[10px] text-amber-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                        Installation Note
                    </div>
                    <p className="font-medium leading-relaxed">{win.notes}</p>
                </div>
            )}

            {/* Photos attached to this window */}
            {win.photos && win.photos.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-stone-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-stone-400" /> Site Photos ({win.photos.length})
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {win.photos.map((photo, pIdx) => (
                            <button
                                key={pIdx}
                                onClick={() => onPreviewPhoto(photo)}
                                className="relative w-14 h-14 rounded-lg overflow-hidden border border-stone-200 hover:opacity-90 shrink-0 group"
                            >
                                {/* eslint-disable-next-html-element-suppression */}
                                <img src={photo} alt={`Window photo ${pIdx + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <Maximize2 className="w-3.5 h-3.5" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
}
