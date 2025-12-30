"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SignaturePad } from "@/components/ui/signature-pad";
import { ArrowLeft, CheckCircle2, Upload, Star, MapPin, User, Home, Calendar, ShieldCheck, Camera } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import QRCode from "react-qr-code";

export default function InstallationCompletePage() {
    const router = useRouter();
    const params = useParams();
    const [signature, setSignature] = useState<string>("");
    const [checklist, setChecklist] = useState({
        allItemsInstalled: false,
        areaCleaned: false,
        demoGiven: false,
        wasteRemoved: false,
    });
    const [rating, setRating] = useState(0);

    const allChecked = Object.values(checklist).every(Boolean);

    const handleSubmit = () => {
        if (!allChecked || !signature) {
            toast.error("Please complete all steps to proceed");
            return;
        }

        // Mock API call
        toast.success("Job Completed Successfully!");

        // Redirect after delay
        setTimeout(() => {
            router.push("/field");
        }, 1500);
    };

    // Mock Data for "Proof"
    const jobDetails = {
        id: params?.id || 'J001',
        client: "Ahmed Al Mansoori",
        address: "Villa 42, Jumeirah Park, Dubai",
        date: "December 08, 2025",
        items: [
            { room: "Living Room", product: "Motorized Roller Blinds", qty: 3, fabric: "Blackout - Charcoal" },
            { room: "Master Bedroom", product: "S-Fold Curtains", qty: 2, fabric: "Linen Sheer - Ivory" },
            { room: "Guest Room", product: "Venetian Blinds", qty: 1, fabric: "Wood - Walnut" },
        ]
    };

    return (
        <div className="min-h-screen bg-neutral-50/50 pb-20">
            {/* Top Navigation */}
            <div className="max-w-7xl mx-auto pt-8 px-6 mb-8">
                <Link href="/field" className="inline-flex items-center text-neutral-500 hover:text-neutral-900 transition-colors mb-6 group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Schedule
                </Link>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold mb-2">
                            <span className="w-8 h-px bg-amber-600"></span>
                            <span>Handover & Completion</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-light text-neutral-900">
                            Job Completion
                        </h1>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-neutral-900">Job #{jobDetails.id}</p>
                        <p className="text-sm text-neutral-500">{jobDetails.date}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COLUMN: Job Proof / Context */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Client & Usage Summary */}
                    <Card className="border-0 shadow-sm ring-1 ring-neutral-200">
                        <CardHeader className="pb-4 border-b border-neutral-100">
                            <CardTitle className="flex items-center gap-2 text-lg font-medium">
                                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                Job Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-neutral-100 rounded-lg">
                                        <User className="w-5 h-5 text-neutral-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-500 mb-0.5">Client</p>
                                        <p className="font-medium text-neutral-900">{jobDetails.client}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-neutral-100 rounded-lg">
                                        <MapPin className="w-5 h-5 text-neutral-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-500 mb-0.5">Location</p>
                                        <p className="font-medium text-neutral-900">{jobDetails.address}</p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h4 className="text-sm font-medium text-neutral-900 mb-4 flex items-center gap-2">
                                    <Home className="w-4 h-4 text-neutral-500" />
                                    Installed Items
                                </h4>
                                <div className="space-y-3">
                                    {jobDetails.items.map((item, i) => (
                                        <div key={i} className="flex justify-between items-start text-sm p-3 bg-neutral-50 rounded-md border border-neutral-100">
                                            <div>
                                                <p className="font-medium text-neutral-900">{item.room}</p>
                                                <p className="text-neutral-500">{item.product}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-neutral-900">x{item.qty}</p>
                                                <p className="text-xs text-neutral-400">{item.fabric}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Support Info */}
                    <Card className="bg-amber-50 border-amber-100 shadow-none">
                        <CardContent className="p-6 flex items-start gap-4">
                            <div className="p-2 bg-amber-100 rounded-full text-amber-700">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-medium text-amber-900 mb-1">Installation Warranty</h4>
                                <p className="text-sm text-amber-800/80">
                                    This installation is covered by our 2-year service warranty. Please keep this digital receipt for your records.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Action Flow */}
                <div className="lg:col-span-7 space-y-6">

                    {/* 1. Checklist */}
                    <Card className="border-0 shadow-sm ring-1 ring-neutral-200">
                        <CardHeader>
                            <CardTitle className="text-lg">1. Installation Checklist</CardTitle>
                            <CardDescription>Verify these points before handover</CardDescription>
                        </CardHeader>
                        <CardContent className="grid sm:grid-cols-2 gap-4">
                            {[
                                { id: "installed", label: "All Items Installed", key: "allItemsInstalled" },
                                { id: "clean", label: "Area Cleaned", key: "areaCleaned" },
                                { id: "demo", label: "Operation Demo Given", key: "demoGiven" },
                                { id: "waste", label: "Waste Removed", key: "wasteRemoved" },
                            ].map((item) => (
                                <div key={item.id} className={`flex items-center space-x-3 p-4 rounded-lg border transition-all ${checklist[item.key as keyof typeof checklist] ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-neutral-200'}`}>
                                    <Checkbox
                                        id={item.id}
                                        checked={checklist[item.key as keyof typeof checklist]}
                                        onCheckedChange={(c) => setChecklist(prev => ({ ...prev, [item.key]: !!c }))}
                                        className={checklist[item.key as keyof typeof checklist] ? 'border-emerald-600 data-[state=checked]:bg-emerald-600' : ''}
                                    />
                                    <Label htmlFor={item.id} className="cursor-pointer font-medium text-neutral-700">{item.label}</Label>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* 2. Photo Evidence */}
                    <Card className="border-0 shadow-sm ring-1 ring-neutral-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">2. Proof of Work</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 flex flex-col items-center justify-center text-neutral-400 hover:bg-neutral-50 hover:border-neutral-300 transition-all cursor-pointer group">
                                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-neutral-200 transition-colors">
                                    <Camera className="w-6 h-6 text-neutral-500" />
                                </div>
                                <p className="font-medium text-neutral-900">Upload Installation Photos</p>
                                <span className="text-sm mt-1">Tap to capture or select from gallery</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3. Review & Signature */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Review */}
                        <Card className="border-0 shadow-sm ring-1 ring-neutral-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">3. Experience</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex justify-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`w-9 h-9 cursor-pointer transition-all ${star <= rating ? 'fill-amber-400 text-amber-400 scale-110' : 'text-neutral-200 hover:text-amber-200'
                                                }`}
                                            onClick={() => setRating(star)}
                                        />
                                    ))}
                                </div>

                                {rating > 0 && (
                                    <div className="animate-in fade-in slide-in-from-top-2 flex items-center gap-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100/50">
                                        <div className="p-2 bg-white rounded-lg shadow-sm border border-neutral-100 shrink-0">
                                            <QRCode
                                                value="https://maps.app.goo.gl/WCwfyyEhR7Upk4E69/review"
                                                size={64}
                                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                viewBox={`0 0 256 256`}
                                            />
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-medium text-blue-900">Google Reviews</p>
                                            <p className="text-blue-700/80 text-xs mb-1">Scan to leave a review</p>
                                            <Link
                                                href="https://maps.app.goo.gl/WCwfyyEhR7Upk4E69/review"
                                                target="_blank"
                                                className="text-[10px] font-medium text-blue-600 hover:underline uppercase tracking-wider"
                                            >
                                                Open Link
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Signature */}
                        <Card className="border-0 shadow-sm ring-1 ring-neutral-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">4. Client Sign-off</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <SignaturePad
                                    className="h-32 w-full bg-neutral-50 rounded-lg border-neutral-200"
                                    onSave={setSignature}
                                />
                                <p className="text-[10px] text-neutral-400 text-center mt-2">
                                    I confirm completion of the above works.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Submit Buttom */}
                    <div className="pt-4">
                        <Button
                            size="lg"
                            className="w-full h-16 text-lg bg-neutral-900 hover:bg-neutral-800 text-white shadow-xl shadow-neutral-900/10 transition-all hover:scale-[1.01]"
                            onClick={handleSubmit}
                            disabled={!allChecked || !signature}
                        >
                            <CheckCircle2 className="w-6 h-6 mr-3" />
                            Complete Job & Send Report
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
