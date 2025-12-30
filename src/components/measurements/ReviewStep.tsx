"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientDetails, Room } from "@/types/measurement";
import { CheckCircle, MapPin, Phone, Calendar, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

    const handleSaveDraft = () => {
        // TODO: Save to backend
        toast.success("Measurement saved as draft");
        router.push("/measurements");
    };

    const handleComplete = () => {
        // TODO: Save to backend and mark as completed
        toast.success("Measurement completed successfully!");
        router.push("/measurements");
    };

    const totalWindows = rooms.reduce((sum, room) => sum + room.windows.length, 0);

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
                                            return (
                                                <div key={window.id} className="bg-stone-50 p-3 rounded-lg">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium text-stone-900">{window.name}</p>
                                                            <div className="text-sm text-stone-600 mt-1 space-y-1">
                                                                <p>Size: {window.width}cm × {window.height}cm</p>
                                                                <p>Product: {window.productType}</p>
                                                                <p>Mount: {window.mountType} • Opening: {window.openingDirection}</p>
                                                                {fabric && <p>Fabric: {fabric.name}</p>}
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
