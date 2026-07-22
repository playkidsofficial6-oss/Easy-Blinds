"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ClientDetailsStep } from "@/components/measurements/ClientDetailsStep";
import { RoomManagementStep } from "@/components/measurements/RoomManagementStep";
import { WindowMeasurementStep } from "@/components/measurements/WindowMeasurementStep";
import { ReviewStep } from "@/components/measurements/ReviewStep";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getJob } from "@/lib/jobs";
import { api } from "@/lib/api";
import type { ClientDetails, Room, RoomType, MountType, OpeningDirection, ProductType, MotorType } from "@/types/measurement";
 
function NewMeasurementForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const jobId = searchParams.get("jobId");
 
    const [currentStep, setCurrentStep] = useState(1);
    const [clientDetails, setClientDetails] = useState<Partial<ClientDetails>>({});
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(!!jobId);

    // Dynamic steps setup: if jobId is provided, skip the "Client Details" step
    const steps = jobId
        ? [
              { id: 1, name: "Rooms", component: RoomManagementStep },
              { id: 2, name: "Measurements", component: WindowMeasurementStep },
              { id: 3, name: "Review", component: ReviewStep },
          ]
        : [
              { id: 1, name: "Client Details", component: ClientDetailsStep },
              { id: 2, name: "Rooms", component: RoomManagementStep },
              { id: 3, name: "Measurements", component: WindowMeasurementStep },
              { id: 4, name: "Review", component: ReviewStep },
          ];

    // Automatically load customer details & saved measurement if jobId is in URL
    useEffect(() => {
        if (!jobId) return;

        async function fetchJobAndMeasurement() {
            try {
                const job = await getJob(jobId as string);
                setClientDetails({
                    name: job.customerName,
                    phone: job.customerPhone,
                    email: job.customerEmail || "",
                    location: job.address,
                    area: job.address.split(",")[0]?.trim() || "Dubai",
                    propertyType: (job.propertyType as any) || "Apartment",
                    visitDate: new Date(),
                    assignedStaff: job.assignedSalesman || "Salesman",
                });

                // Fetch existing measurement from backend
                try {
                    const { data: measurement } = await api.get(`/measurements/job/${jobId}`);
                    if (measurement && measurement.rooms) {
                        const frontendRooms: Room[] = (measurement.rooms as Record<string, unknown>[]).map((r) => ({
                            id: String(r.id || ""),
                            name: String(r.name || ""),
                            type: (r.category || "Bedroom") as unknown as RoomType,
                            windows: ((r.openings as Record<string, unknown>[]) || []).map((o) => {
                                const metadata = (o.metadata || {}) as Record<string, unknown>;
                                const fabricSelection = String(metadata.fabricSelection || o.customMaterial || "None");
                                const customFabricName = String(metadata.customFabricName || "");
                                const customProductName = String(metadata.customProductName || "");

                                return {
                                    id: String(o.id || ""),
                                    name: String(o.name || ""),
                                    width: Number(o.width || 0),
                                    height: Number(o.height || 0),
                                    mountType: (o.mountType || "Wall") as unknown as MountType,
                                    openingDirection: (o.openingDirection || "Split") as unknown as OpeningDirection,
                                    productType: (o.productType === "Custom Item" || o.type === "CUSTOM" ? "Custom Item" : o.productType) as unknown as ProductType,
                                    customProductName: customProductName || (o.type === "CUSTOM" ? String(o.productType || "") : undefined),
                                    fabricSelection,
                                    customFabricName,
                                    motorType: (o.motorType || "Manual") as unknown as MotorType,
                                    notes: String(o.notes || ""),
                                    photos: (o.images as string[]) || [],
                                };
                            })
                        }));
                        setRooms(frontendRooms);
                    }
                } catch (err: unknown) {
                    const errorResponse = err as { response?: { status?: number } };
                    if (errorResponse?.response?.status !== 404) {
                        console.warn("Error fetching existing measurement:", err);
                    }
                }
            } catch (err) {
                console.error("Failed to automatically retrieve job details:", err);
            } finally {
                setIsLoading(false);
            }
        }
        void fetchJobAndMeasurement();
    }, [jobId]);

    const progress = (currentStep / steps.length) * 100;

    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            router.push("/salesman");
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3 text-stone-500">
                    <span className="h-8 w-8 animate-spin rounded-full border-4 border-stone-300 border-t-stone-900"></span>
                    <span className="font-light italic text-sm">Retrieving customer details...</span>
                </div>
            </div>
        );
    }

    const CurrentStepComponent = steps[currentStep - 1].component;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-stone-900">New Measurement</h1>
                <p className="text-stone-500">
                    {jobId
                        ? `Capturing dimensions for customer: ${clientDetails.name || "Loading..."}`
                        : "Complete the measurement details step by step"}
                </p>
            </div>

            {/* Progress Indicator */}
            <Card className="p-6">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex-1 flex items-center">
                                <div className="flex flex-col items-center flex-1">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                                            currentStep === step.id
                                                ? "bg-stone-900 text-white"
                                                : currentStep > step.id
                                                ? "bg-green-600 text-white"
                                                : "bg-stone-200 text-stone-600"
                                        }`}
                                    >
                                        {step.id}
                                    </div>
                                    <p
                                        className={`text-sm mt-2 font-medium hidden md:block ${
                                            currentStep === step.id ? "text-stone-900" : "text-stone-500"
                                        }`}
                                    >
                                        {step.name}
                                    </p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`h-1 flex-1 mx-2 ${
                                            currentStep > step.id ? "bg-green-600" : "bg-stone-200"
                                        }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </Card>

            {/* Step Content */}
            <Card className="p-6 max-h-[75vh] overflow-y-auto">
                <CurrentStepComponent
                    clientDetails={clientDetails}
                    setClientDetails={setClientDetails}
                    rooms={rooms}
                    setRooms={setRooms}
                    onNext={handleNext}
                    onBack={handleBack}
                    isFirstStep={currentStep === 1}
                    isLastStep={currentStep === steps.length}
                />
            </Card>
        </div>
    );
}

export default function NewMeasurementPage() {
    return (
        <Suspense
            fallback={
                <div className="max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
                    <div className="flex flex-col items-center gap-3 text-stone-500">
                        <span className="h-8 w-8 animate-spin rounded-full border-4 border-stone-300 border-t-stone-900"></span>
                        <span className="font-light italic text-sm">Loading measurement form...</span>
                    </div>
                </div>
            }
        >
            <NewMeasurementForm />
        </Suspense>
    );
}
