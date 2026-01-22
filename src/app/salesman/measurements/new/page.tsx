"use client";

import { useState } from "react";
import { ClientDetailsStep } from "@/components/measurements/ClientDetailsStep";
import { RoomManagementStep } from "@/components/measurements/RoomManagementStep";
import { WindowMeasurementStep } from "@/components/measurements/WindowMeasurementStep";
import { ReviewStep } from "@/components/measurements/ReviewStep";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ClientDetails, Room } from "@/types/measurement";

const STEPS = [
    { id: 1, name: "Client Details", component: ClientDetailsStep },
    { id: 2, name: "Rooms", component: RoomManagementStep },
    { id: 3, name: "Measurements", component: WindowMeasurementStep },
    { id: 4, name: "Review", component: ReviewStep },
];

export default function NewMeasurementPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [clientDetails, setClientDetails] = useState<Partial<ClientDetails>>({});
    const [rooms, setRooms] = useState<Room[]>([]);

    const progress = (currentStep / STEPS.length) * 100;

    const handleNext = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const CurrentStepComponent = STEPS[currentStep - 1].component;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-stone-900">New Measurement</h1>
                <p className="text-stone-500">Complete the measurement details step by step</p>
            </div>

            {/* Progress Indicator */}
            <Card className="p-6">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="flex-1 flex items-center">
                                <div className="flex flex-col items-center flex-1">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${currentStep === step.id
                                                ? "bg-stone-900 text-white"
                                                : currentStep > step.id
                                                    ? "bg-green-600 text-white"
                                                    : "bg-stone-200 text-stone-600"
                                            }`}
                                    >
                                        {step.id}
                                    </div>
                                    <p className={`text-sm mt-2 font-medium hidden md:block ${currentStep === step.id ? "text-stone-900" : "text-stone-500"
                                        }`}>
                                        {step.name}
                                    </p>
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div className={`h-1 flex-1 mx-2 ${currentStep > step.id ? "bg-green-600" : "bg-stone-200"
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </Card>

            {/* Step Content */}
            <Card className="p-6">
                <CurrentStepComponent
                    clientDetails={clientDetails}
                    setClientDetails={setClientDetails}
                    rooms={rooms}
                    setRooms={setRooms}
                    onNext={handleNext}
                    onBack={handleBack}
                    isFirstStep={currentStep === 1}
                    isLastStep={currentStep === STEPS.length}
                />
            </Card>
        </div>
    );
}
