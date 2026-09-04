"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClientDetails, PropertyType } from "@/types/measurement";
import { MapPin, Phone, Mail, Calendar } from "lucide-react";

interface ClientDetailsStepProps {
    clientDetails: Partial<ClientDetails>;
    setClientDetails: (details: Partial<ClientDetails>) => void;
    onNext: () => void;
    onBack: () => void;
    isFirstStep: boolean;
    isLastStep: boolean;
}

const DUBAI_AREAS = [
    "Al Safa",
    "Al Wasl",
    "Barsha Heights (Tecom)",
    "Bluewaters Island",
    "City Walk",
    "Discovery Gardens",
    "District One",
    "Dubai Design District (d3)",
    "Dubai Healthcare City",
    "Dubai Hills Estate",
    "Dubai Internet City",
    "Dubai Land (Dubailand)",
    "Dubai Marina",
    "Dubai Media City",
    "Dubai Silicon Oasis",
    "Dubai South",
    "Emirates Hills",
    "Jumeirah Islands",
    "Jumeirah Park",
    "MBR City (Mohammed Bin Rashid City)",
    "Meydan",
    "Motor City",
    "Nad Al Sheba",
    "Sports City",
    "The Greens",
    "Town Square",
    "Umm Suqeim 1",
    "Umm Suqeim 2",
    "Umm Suqeim 3",
    "World Trade Centre Area",
    "Other"
];

export function ClientDetailsStep({
    clientDetails,
    setClientDetails,
    onNext,
}: ClientDetailsStepProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
            document.documentElement?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
            document.body?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        }
        onNext();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-stone-900 mb-2">Client & Visit Details</h2>
                <p className="text-stone-500">Enter the basic information about the client and visit</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="clientName" className="text-base">Client Name *</Label>
                    <Input
                        id="clientName"
                        placeholder="Ahmed Al Mansoori"
                        value={clientDetails.name || ""}
                        onChange={(e) => setClientDetails({ ...clientDetails, name: e.target.value })}
                        required
                        className="h-12 text-base"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-base flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number (WhatsApp) *
                    </Label>
                    <Input
                        id="phone"
                        type="tel"
                        placeholder="+971 50 123 4567"
                        value={clientDetails.phone || ""}
                        onChange={(e) => setClientDetails({ ...clientDetails, phone: e.target.value })}
                        required
                        className="h-12 text-base"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email" className="text-base flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email (Optional)
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="client@example.com"
                        value={clientDetails.email || ""}
                        onChange={(e) => setClientDetails({ ...clientDetails, email: e.target.value })}
                        className="h-12 text-base"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="area" className="text-base flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Area *
                    </Label>
                    <Select
                        value={clientDetails.area}
                        onValueChange={(value) => setClientDetails({ ...clientDetails, area: value })}
                    >
                        <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Select area" />
                        </SelectTrigger>
                        <SelectContent>
                            {DUBAI_AREAS.map((area) => (
                                <SelectItem key={area} value={area}>
                                    {area}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="location" className="text-base">Full Address / Google Maps Link</Label>
                    <Input
                        id="location"
                        placeholder="Villa 123, Palm Jumeirah..."
                        value={clientDetails.location || ""}
                        onChange={(e) => setClientDetails({ ...clientDetails, location: e.target.value })}
                        className="h-12 text-base"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="propertyType" className="text-base">Property Type *</Label>
                    <Select
                        value={clientDetails.propertyType}
                        onValueChange={(value: PropertyType) => setClientDetails({ ...clientDetails, propertyType: value })}
                    >
                        <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Apartment">Apartment</SelectItem>
                            <SelectItem value="Villa">Villa</SelectItem>
                            <SelectItem value="Office">Office</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="visitDate" className="text-base flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Visit Date & Time *
                    </Label>
                    <Input
                        id="visitDate"
                        type="datetime-local"
                        value={clientDetails.visitDate ? new Date(clientDetails.visitDate).toISOString().slice(0, 16) : ""}
                        onChange={(e) => setClientDetails({ ...clientDetails, visitDate: new Date(e.target.value) })}
                        required
                        className="h-12 text-base"
                    />
                </div>


            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <Button type="submit" size="lg" className="bg-stone-900 hover:bg-stone-800">
                    Continue to Rooms
                </Button>
            </div>
        </form>
    );
}
