"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewJobPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);

        try {
            const response = await fetch("/api/dispatch/jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName: formData.get("client") as string,
                    phone: (formData.get("whatsapp") as string) || "Not provided",
                    email: "not-provided@easy-blinds.local",
                    whatsapp: formData.get("whatsapp") as string,
                    address: formData.get("area") as string,
                    area: formData.get("area") as string,
                    propertyType: formData.get("property") as string,
                    productCategory: "Blinds",
                    priority: formData.get("priority") as string,
                    installationStage: "Installation",
                    appointmentDate: formData.get("scheduled") as string,
                    appointmentTime: formData.get("time") as string,
                    quotationAmount: Number(formData.get("value")),
                    leadSource: "Sales Manager",
                    tags: ["manual-entry", "smart-dispatch"],
                }),
            });

            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.message ?? "Unable to create job.");
            }

            toast.success("Job created successfully");
            router.push("/sales-manager/assignments");
        } catch (caught) {
            toast.error(caught instanceof Error ? caught.message : "Unable to create job.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link
                    href="/sales-manager/assignments"
                    className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-stone-600" />
                </Link>
                <div>
                    <h1 className="text-3xl font-light text-stone-900 dark:text-white">New Job</h1>
                    <p className="text-stone-500 dark:text-neutral-400">Manually add a new installation job</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="client">Client Name</Label>
                            <Input id="client" name="client" required placeholder="e.g. John Doe" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="whatsapp">WhatsApp Number</Label>
                            <Input id="whatsapp" name="whatsapp" type="tel" placeholder="+971 50 123 4567" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="area">Area / Location</Label>
                                <Input id="area" name="area" required placeholder="e.g. Downtown Dubai" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="value">Project Value (AED)</Label>
                                <Input id="value" name="value" type="number" required placeholder="0.00" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="property">Property Type</Label>
                                <Select name="property" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Villa">Villa</SelectItem>
                                        <SelectItem value="Apartment">Apartment</SelectItem>
                                        <SelectItem value="Office">Office</SelectItem>
                                        <SelectItem value="Mansion">Mansion</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select name="priority" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="High">High</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="Low">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="scheduled">Requested Date</Label>
                                <Input id="scheduled" name="scheduled" type="date" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time">Requested Time</Label>
                                <Input id="time" name="time" type="time" />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-4">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Creating..." : "Create Job"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
