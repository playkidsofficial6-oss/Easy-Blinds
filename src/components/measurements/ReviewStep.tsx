"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientDetails, Room } from "@/types/measurement";
import { CheckCircle, MapPin, Phone, Calendar, Home } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { updateJob, getJob, JobStatus } from "@/lib/jobs";
import { toast } from "sonner";

import { saveMeasurementToBackend } from "@/lib/measurements";

interface ReviewStepProps {
    clientDetails: Partial<ClientDetails>;
    rooms: Room[];
    onBack: () => void;
    isFirstStep: boolean;
    isLastStep: boolean;
}

const FABRICS = [
    { id: "F001", name: "Silk Sheer - Ivory", price: 45 },
    { id: "F002", name: "Blackout Premium - Charcoal", price: 65 },
    { id: "F003", name: "Linen Blend - Beige", price: 55 },
    { id: "F004", name: "Velvet Luxury - Navy", price: 85 },
    { id: "F005", name: "Cotton Light - White", price: 40 },
];

export function ReviewStep({
    clientDetails,
    rooms,
    onBack,
}: ReviewStepProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const jobId = searchParams.get("jobId") ?? searchParams.get("measurementId");

    const totalWindows = rooms.reduce((sum, room) => sum + room.windows.length, 0);

    const persistMeasurement = async (status: "Draft" | "Completed") => {
        const measurement = {
            id: jobId ?? `M${Date.now()}`,
            jobId: jobId ?? undefined,
            client: clientDetails,
            rooms,
            status,
            totalWindows,
            updatedAt: new Date().toISOString(),
        };

        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("eb_salesman_measurements_v1");
            const measurements = stored ? JSON.parse(stored) : [];
            const nextMeasurements = [measurement, ...measurements.filter((item: { id?: string }) => item.id !== measurement.id)];
            localStorage.setItem("eb_salesman_measurements_v1", JSON.stringify(nextMeasurements));
        }

        if (jobId) {
            // Map frontend structures to the strict backend opening schemas
            const backendRooms = rooms.map(room => ({
                id: room.id || `room_${Math.random().toString(36).substring(2, 9)}`,
                name: room.name || "Room",
                category: room.type || "Other",
                openings: (room.windows || []).map(w => {
                    const rawProduct = (w.productType || "").toLowerCase();
                    const type = w.productType === "Custom Item"
                        ? "Custom"
                        : (rawProduct.includes("door") ? "Door" : "Window");

                    // Format custom material & fabric selection
                    const materialType = w.fabricSelection === "Custom" ? "custom" : "standard";
                    const customMaterial = w.fabricSelection === "Custom"
                        ? (w.customFabricName || "Custom Fabric")
                        : (FABRICS.find(f => f.id === w.fabricSelection)?.name || w.fabricSelection || "None");

                    return {
                        id: w.id || `win_${Math.random().toString(36).substring(2, 9)}`,
                        type,
                        name: w.name || "Window 1",
                        width: Number(w.width) > 0 ? Number(w.width) : 100,
                        height: Number(w.height) > 0 ? Number(w.height) : 100,
                        measurementUnit: "cm",
                        mountType: w.mountType || "Wall",
                        openingDirection: w.openingDirection || "Split",
                        productType: w.productType === "Custom Item" ? (w.customProductName || "Custom Item") : (w.productType || "Curtains"),
                        materialType,
                        customMaterial,
                        motorType: w.motorType || "Manual",
                        notes: w.notes || "",
                        images: w.photos || [],
                        metadata: {
                            fabricSelection: w.fabricSelection || "standard",
                            customFabricName: w.customFabricName || "",
                            customProductName: w.customProductName || ""
                        }
                    };
                })
            }));

            const backendPayload = {
                jobId,
                visitDate: clientDetails.visitDate ? new Date(clientDetails.visitDate).toISOString() : new Date().toISOString(),
                status: status === "Completed" ? "Completed" : "Pending",
                rooms: backendRooms
            };

            // Save to dedicated measurements collection in backend
            await saveMeasurementToBackend(backendPayload);

            let appendedNotes = "";
            if (typeof window !== "undefined") {
                const measStart = localStorage.getItem(`eb_measurement_start_${jobId}`);
                let measSecs = 0;
                if (measStart) {
                    measSecs = Math.floor((Date.now() - Number(measStart)) / 1000);
                }
                const travelSecs = localStorage.getItem(`eb_travel_secs_${jobId}`);

                const formatSecs = (s: number) => {
                    const h = Math.floor(s / 3600);
                    const m = Math.floor((s % 3600) / 60);
                    const sec = s % 60;
                    return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${sec}s`.trim();
                };

                appendedNotes = `[TIME_LOG] Travel: ${travelSecs ? formatSecs(Number(travelSecs)) : 'N/A'} | Measuring: ${measSecs > 0 ? formatSecs(measSecs) : 'N/A'}`;

                if (status === "Completed") {
                    localStorage.removeItem(`eb_measurement_start_${jobId}`);
                    localStorage.removeItem(`eb_travel_start_${jobId}`);
                    localStorage.removeItem(`eb_travel_secs_${jobId}`);
                }
            }

            let originalNotes = "";
            try {
                const job = await getJob(jobId);
                originalNotes = job.notes || "";
            } catch (err) {
                console.warn("Failed to fetch original job notes", err);
            }

            // Also keep job notes & status updated for backwards compatibility with a concise note
            await updateJob(jobId, {
                status: status === "Completed" ? JobStatus.ReadyForFitting : JobStatus.SalesmanScheduled,
                notes: [originalNotes, appendedNotes].filter(Boolean).join("\n"),
            });
        }
    };

    const handleSaveDraft = async () => {
        try {
            await persistMeasurement("Draft");
            toast.success("Measurement saved as draft");
            router.push("/dashboard/measurements");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to save measurement");
        }
    };

    const handleComplete = async () => {
        try {
            await persistMeasurement("Completed");
            toast.success("Measurement completed successfully!");
            router.push(jobId ? `/dashboard/quotes/new?jobId=${jobId}` : "/dashboard/measurements");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to complete measurement");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-stone-900 mb-2">Review & Submit</h2>
                <p className="text-stone-500">Review all details before submitting the measurement</p>
            </div>

            {/* Client Details Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Client & Visit Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-stone-500">Client Name</p>
                            <p className="font-medium text-stone-900">{clientDetails.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-stone-500 flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                Phone
                            </p>
                            <p className="font-medium text-stone-900">{clientDetails.phone}</p>
                        </div>
                        {clientDetails.email && (
                            <div>
                                <p className="text-sm text-stone-500">Email</p>
                                <p className="font-medium text-stone-900">{clientDetails.email}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-stone-500 flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                Location
                            </p>
                            <p className="font-medium text-stone-900">{clientDetails.area}</p>
                        </div>
                        <div>
                            <p className="text-sm text-stone-500 flex items-center gap-1">
                                <Home className="w-4 h-4" />
                                Property Type
                            </p>
                            <p className="font-medium text-stone-900">{clientDetails.propertyType}</p>
                        </div>
                        <div>
                            <p className="text-sm text-stone-500 flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Visit Date
                            </p>
                            <p className="font-medium text-stone-900">
                                {clientDetails.visitDate ? new Date(clientDetails.visitDate).toLocaleString('en-AE') : 'N/A'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Rooms & Windows Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Measurements Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 p-4 bg-stone-50 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-stone-900">Total Rooms:</span>
                            <span className="text-xl font-bold text-stone-900">{rooms.length}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="font-medium text-stone-900">Total Windows:</span>
                            <span className="text-xl font-bold text-stone-900">{totalWindows}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {rooms.map((room) => (
                            <div key={room.id} className="border border-stone-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-stone-900">{room.name}</h3>
                                    <span className="text-sm text-stone-500">{room.type}</span>
                                </div>

                                {room.windows.length > 0 ? (
                                    <div className="space-y-3">
                                        {room.windows.map((window) => {
                                            const fabric = FABRICS.find(f => f.id === window.fabricSelection);
                                            const displayProduct = window.productType === "Custom Item"
                                                ? `Custom Item (${window.customProductName || "Unnamed"})`
                                                : window.productType;
                                            const displayFabric = window.fabricSelection === "Custom"
                                                ? (window.customFabricName || "Custom Fabric")
                                                : fabric?.name;
                                            return (
                                                <div key={window.id} className="bg-stone-50 p-3 rounded-lg">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium text-stone-900">{window.name}</p>
                                                            <div className="text-sm text-stone-600 mt-1 space-y-1">
                                                                <p>Size: {window.width}cm × {window.height}cm</p>
                                                                <p>Product: {displayProduct}</p>
                                                                <p>Mount: {window.mountType} • Opening: {window.openingDirection}</p>
                                                                {displayFabric && <p>Fabric: {displayFabric}</p>}
                                                                <p>Motor: {window.motorType}</p>
                                                                {window.notes && (
                                                                    <p className="text-stone-500 italic mt-2">Note: {window.notes}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-stone-500">No windows added</p>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-between gap-3 pt-4 border-t border-stone-200">
                <Button type="button" variant="outline" size="lg" onClick={onBack}>
                    Back
                </Button>
                <div className="flex gap-3">
                    <Button type="button" variant="outline" size="lg" onClick={handleSaveDraft}>
                        Save as Draft
                    </Button>
                    <Button type="button" size="lg" onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete Measurement
                    </Button>
                </div>
            </div>
        </div>
    );
}
