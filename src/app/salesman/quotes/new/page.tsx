"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, ArrowLeft, Calculator } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { updateJob } from "@/lib/jobs";
import { toast } from "sonner";

interface LineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

export type QuoteStatus = "Approved" | "Sent" | "Negotiation" | "Rejected" | "Draft";

export default function NewQuotePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const jobId = searchParams.get("jobId") ?? searchParams.get("measurementId") ?? undefined;
    const { user } = useAuth();
    
    const [clientName, setClientName] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [notes, setNotes] = useState("");

    const [lineItems, setLineItems] = useState<LineItem[]>([
        { id: "1", description: "", quantity: 1, unitPrice: 0 }
    ]);

    const addLineItem = () => {
        setLineItems([
            ...lineItems,
            { id: Math.random().toString(36).substr(2, 9), description: "", quantity: 1, unitPrice: 0 }
        ]);
    };

    const removeLineItem = (id: string) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter(item => item.id !== id));
        }
    };

    const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
        setLineItems(lineItems.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const vat = subtotal * 0.05;
    const total = subtotal + vat;

    const handleSave = async (status: QuoteStatus = "Sent") => {
        if (!jobId) {
            toast.error("No Job ID provided. Cannot save quote without a job.");
            return;
        }
        
        try {
            const quotation = {
                id: `Q${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
                client: clientName || "Unnamed Client",
                salesmanId: user?._id,
                salesmanName: user?.name,
                clientPhone,
                clientEmail,
                notes,
                total,
                status,
                date: new Date().toISOString(),
                sentDate: status === "Sent" ? new Date().toISOString() : undefined,
                items: lineItems.map((item) => ({
                    ...item,
                    total: item.quantity * item.unitPrice,
                })),
            };

            await updateJob(jobId, {
                status: "completed",
                notes: [notes, `Quote submitted by ${user?.name ?? "salesman"}`].filter(Boolean).join("\n"),
                quotation,
            });

            toast.success(status === "Draft" ? "Quote saved as draft to job" : "Quote submitted to sales manager");
            router.push("/salesman/quotes");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to save quote");
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/salesman/quotes">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-neutral-100">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-light text-neutral-900">New Quote</h1>
                        <p className="text-neutral-500 text-sm">Create a new quotation for a client</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-12 px-6 border-2" onClick={() => handleSave("Draft")}>
                        Save Draft
                    </Button>
                    <Button onClick={() => handleSave("Sent")} className="h-12 px-6 bg-neutral-900 hover:bg-neutral-800 text-white">
                        <Save className="w-4 h-4 mr-2" />
                        Create Quote
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Client Details */}
                    <Card className="border-0 shadow-sm ring-1 ring-neutral-200">
                        <CardHeader className="pb-4 border-b border-neutral-100">
                            <CardTitle className="text-lg font-medium">Client Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="clientName">Client Name</Label>
                                    <Input
                                        id="clientName"
                                        placeholder="e.g. Ahmed Al Mansoori"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="clientPhone">Phone Number</Label>
                                    <Input
                                        id="clientPhone"
                                        placeholder="+971 50 123 4567"
                                        value={clientPhone}
                                        onChange={(e) => setClientPhone(e.target.value)}
                                        className="h-11"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="clientEmail">Email Address</Label>
                                <Input
                                    id="clientEmail"
                                    type="email"
                                    placeholder="client@example.com"
                                    value={clientEmail}
                                    onChange={(e) => setClientEmail(e.target.value)}
                                    className="h-11"
                                 />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Line Items */}
                    <Card className="border-0 shadow-sm ring-1 ring-neutral-200">
                        <CardHeader className="pb-4 border-b border-neutral-100 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-medium">Line Items</CardTitle>
                            <Button variant="outline" size="sm" onClick={addLineItem} className="h-9">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Item
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {lineItems.map((item) => (
                                <div key={item.id} className="flex flex-col md:flex-row gap-4 items-start md:items-end p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                                    <div className="flex-1 w-full space-y-2">
                                        <Label className="text-xs text-neutral-500">Description</Label>
                                        <Input
                                            placeholder="Item description"
                                            value={item.description}
                                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="w-full md:w-24 space-y-2">
                                        <Label className="text-xs text-neutral-500">Qty</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="w-full md:w-32 space-y-2">
                                        <Label className="text-xs text-neutral-500">Unit Price</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={item.unitPrice}
                                            onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="w-full md:w-32 space-y-2">
                                        <Label className="text-xs text-neutral-500">Total</Label>
                                        <div className="h-10 px-3 flex items-center bg-neutral-100 rounded-md text-sm font-medium text-neutral-900 border border-neutral-200">
                                            AED {(item.quantity * item.unitPrice).toLocaleString()}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeLineItem(item.id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-10 w-10 shrink-0"
                                        disabled={lineItems.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card className="border-0 shadow-sm ring-1 ring-neutral-200">
                        <CardHeader className="pb-4 border-b border-neutral-100">
                            <CardTitle className="text-lg font-medium">Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Textarea
                                placeholder="Add any notes or terms for this quote..."
                                className="min-h-[120px] resize-none"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Summary */}
                <div className="lg:col-span-1">
                    <div className="sticky top-8 space-y-6">
                        <Card className="border-0 shadow-sm ring-1 ring-neutral-200 bg-neutral-900 text-white">
                            <CardHeader className="pb-4 border-b border-neutral-800">
                                <CardTitle className="text-lg font-medium flex items-center gap-2">
                                    <Calculator className="w-5 h-5" />
                                    Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between text-neutral-400">
                                    <span>Subtotal</span>
                                    <span>AED {subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-neutral-400">
                                    <span>VAT (5%)</span>
                                    <span>AED {vat.toLocaleString()}</span>
                                </div>
                                <div className="pt-4 border-t border-neutral-800 flex justify-between items-end">
                                    <span className="text-lg font-medium">Total</span>
                                    <span className="text-3xl font-light">AED {total.toLocaleString()}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
