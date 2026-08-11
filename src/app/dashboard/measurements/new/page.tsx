"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ClientDetailsStep } from "@/components/measurements/ClientDetailsStep";
import { RoomManagementStep } from "@/components/measurements/RoomManagementStep";
import { WindowMeasurementStep } from "@/components/measurements/WindowMeasurementStep";
import { ReviewStep } from "@/components/measurements/ReviewStep";
import { FitterMeasurementView } from "@/components/measurements/FitterMeasurementView";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getJob, getJobs } from "@/lib/jobs";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { isFitterRole } from "@/lib/auth";
import type { ClientDetails, Room, RoomType, MountType, OpeningDirection, ProductType, MotorType } from "@/types/measurement";

function NewMeasurementForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const jobId = searchParams.get("jobId");
    const { user } = useAuth();
    const isFitter = isFitterRole(user?.role);

    const [currentStep, setCurrentStep] = useState(1);
    const [clientDetails, setClientDetails] = useState<Partial<ClientDetails>>({});
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(!!jobId);
    const [availableJobs, setAvailableJobs] = useState<Array<{ id: string; customerName: string; address: string }>>([]);

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
        if (!jobId) {
            if (isFitter) {
                // Fetch list of assigned jobs for fitter selection if no jobId parameter provided
                getJobs({ limit: 50 })
                    .then((res) => {
                        if (res?.items) {
                            setAvailableJobs(
                                res.items.map((j) => ({
                                    id: j._id || j.jobId || "",
                                    customerName: j.customerName,
                                    address: j.address,
                                }))
                            );
                        }
                    })
                    .catch((err) => console.warn("Failed to load available fitter jobs:", err));
            }
            return;
        }

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
                                    productType: (o.productType === "Custom Item" || o.type === "Custom" ? "Custom Item" : o.productType) as unknown as ProductType,
                                    customProductName: customProductName || (o.type === "Custom" ? String(o.productType || "") : undefined),
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
    }, [jobId, isFitter]);

    // If logged in user is a Fitter, render the specialized Read-Only FitterMeasurementView
    if (isFitter) {
        return (
            <FitterMeasurementView
                jobId={jobId}
                clientDetails={clientDetails}
                rooms={rooms}
                isLoading={isLoading}
                availableJobs={availableJobs}
                onSelectJob={(id) => router.push(`/dashboard/measurements/new?jobId=${id}`)}
            />
        );
    }

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
            <div className="max-w-5xl mx-auto flex items-center justify-center min-h-100">
                <div className="flex flex-col items-center gap-3 text-stone-500">
                    <span className="h-8 w-8 animate-spin rounded-full border-4 border-stone-300 border-t-stone-900"></span>
                    <span className="font-light italic text-sm">Retrieving customer details...</span>
                </div>
            </div>
        );
    }

    const CurrentStepComponent = steps[currentStep - 1].component;

    return (
        <div className="mx-auto w-full min-w-0 max-w-5xl space-y-4 p-3 sm:space-y-6 sm:p-6 lg:p-8">
            <div className="min-w-0">
                <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">New Measurement</h1>
                <p className="break-words text-sm text-stone-500 sm:text-base">
                    {jobId
                        ? `Capturing dimensions for customer: ${clientDetails.name || "Loading..."}`
                        : "Complete the measurement details step by step"}
                </p>
            </div>

            {/* Progress Indicator */}
            <Card className="min-w-0 overflow-hidden p-4 sm:p-6">
                <div className="min-w-0 space-y-3 sm:space-y-4">
                    <div className="flex w-full min-w-0 items-center">
                        {steps.map((step, index) => (
                            <div key={step.id} className="contents">
                                <div className="flex shrink-0 flex-col items-center">
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors sm:h-10 sm:w-10 sm:text-base ${currentStep === step.id
                                            ? "bg-stone-900 text-white"
                                            : currentStep > step.id
                                                ? "bg-green-600 text-white"
                                                : "bg-stone-200 text-stone-600"
                                            }`}
                                    >
                                        {step.id}
                                    </div>
                                    <p
                                        className={`mt-1.5 hidden max-w-[4.5rem] truncate text-center text-xs font-medium sm:mt-2 sm:block sm:max-w-none sm:text-sm ${currentStep === step.id ? "text-stone-900" : "text-stone-500"
                                            }`}
                                    >
                                        {step.name}
                                    </p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`mx-1 h-0.5 min-w-[0.75rem] flex-1 sm:mx-2 sm:h-1 ${currentStep > step.id ? "bg-green-600" : "bg-stone-200"
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-sm font-medium text-stone-700 sm:hidden">
                        Step {currentStep} of {steps.length}: {steps[currentStep - 1].name}
                    </p>
                    <Progress value={progress} className="h-2" />
                </div>
            </Card>

            {/* Step Content */}
            <Card className="min-w-0 overflow-x-hidden p-4 sm:p-6 md:max-h-[75vh] md:overflow-y-auto">
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
                <div className="max-w-5xl mx-auto flex items-center justify-center min-h-100">
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

