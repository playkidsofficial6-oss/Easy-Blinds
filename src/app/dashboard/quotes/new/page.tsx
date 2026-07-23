"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, ArrowLeft, Calculator, X, FileText, Send } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { updateJob, getJob, JobStatus } from "@/lib/jobs";
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
    
    const [isLoading, setIsLoading] = useState(false);
    const [existingQuoteId, setExistingQuoteId] = useState<string | null>(null);
    const [clientName, setClientName] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [notes, setNotes] = useState("");
    const [originalJobNotes, setOriginalJobNotes] = useState("");
    
    // Invoice preview states
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [tempQuoteId, setTempQuoteId] = useState("");

    useEffect(() => {
        if (existingQuoteId) {
            setTempQuoteId(existingQuoteId);
        } else {
            setTempQuoteId(`Q${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`);
        }
    }, [existingQuoteId]);

    const [lineItems, setLineItems] = useState<LineItem[]>([
        { id: "1", description: "", quantity: 1, unitPrice: 0 }
    ]);

    useEffect(() => {
        async function loadJobData() {
            if (!jobId) return;
            setIsLoading(true);
            try {
                const job = await getJob(jobId);
                if (job.quotation) {
                    setExistingQuoteId(job.quotation.id);
                    setClientName(job.quotation.client || job.customerName || "");
                    setClientPhone(job.quotation.clientPhone || job.customerPhone || "");
                    setClientEmail(job.quotation.clientEmail || job.customerEmail || "");
                    setNotes(job.quotation.notes || "");
                    if (job.quotation.items && job.quotation.items.length > 0) {
                        setLineItems(job.quotation.items.map((i: any) => ({
                            id: i.id || Math.random().toString(36).substr(2, 9),
                            description: i.description || "",
                            quantity: i.quantity || 1,
                            unitPrice: i.unitPrice || 0
                        })));
                    }
                } else {
                    setClientName(job.customerName || "");
                    setClientPhone(job.customerPhone || "");
                    setClientEmail(job.customerEmail || "");
                }
                setOriginalJobNotes(job.notes || "");
            } catch (error) {
                toast.error("Failed to load job details");
            } finally {
                setIsLoading(false);
            }
        }
        loadJobData();
    }, [jobId]);

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
                let finalValue = value;
                if (field === 'description' && typeof value === 'string') {
                    finalValue = value.charAt(0).toUpperCase() + value.slice(1);
                }
                return { ...item, [field]: finalValue };
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
                id: tempQuoteId || `Q${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
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
                status: JobStatus.ReadyForFitting,
                notes: [originalJobNotes, notes, `Quote submitted by ${user?.name ?? "salesman"}`].filter(Boolean).join("\n"),
                quotation,
            });

            toast.success(status === "Draft" ? "Quote saved as draft to job" : "Quote submitted to sales manager");
            router.push(`/salesman?jobId=${jobId}`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to save quote");
        }
    };

    if (isLoading) {
        return <div className="p-12 text-center text-neutral-400 font-light">Loading quotation details...</div>;
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/salesman">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-neutral-100">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-light text-neutral-900">{existingQuoteId ? `Edit Quote ${existingQuoteId}` : "New Quote"}</h1>
                        <p className="text-neutral-500 text-sm">{existingQuoteId ? "Modify an existing quotation" : "Create a new quotation for a client"}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-12 px-6 border-2" onClick={() => handleSave("Draft")}>
                        Save Draft
                    </Button>
                    <Button onClick={() => setShowInvoiceModal(true)} className="h-12 px-6 bg-neutral-900 hover:bg-neutral-800 text-white">
                        <Save className="w-4 h-4 mr-2" />
                        {existingQuoteId ? "Update Quote" : "Create Quote"}
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
                                        className="h-11 bg-stone-50 text-stone-500 cursor-not-allowed"
                                        readOnly
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="clientPhone">Phone Number</Label>
                                    <Input
                                        id="clientPhone"
                                        placeholder="+971 50 123 4567"
                                        value={clientPhone}
                                        onChange={(e) => setClientPhone(e.target.value)}
                                        className="h-11 bg-stone-50 text-stone-500 cursor-not-allowed"
                                        readOnly
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
                                    className="h-11 bg-stone-50 text-stone-500 cursor-not-allowed"
                                    readOnly
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
                                            value={item.quantity === 0 ? "" : item.quantity}
                                            onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="w-full md:w-32 space-y-2">
                                        <Label className="text-xs text-neutral-500">Unit Price</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={item.unitPrice === 0 ? "" : item.unitPrice}
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

            {/* Invoice Preview Modal UI */}
            {showInvoiceModal && (
                <div className="fixed inset-0 z-[200] bg-neutral-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
                    <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden border border-stone-200 animate-slideUp my-8">
                        {/* Modal Header */}
                        <div className="bg-neutral-900 text-white p-6 flex justify-between items-center border-b border-neutral-800">
                            <div className="flex items-center gap-3">
                                <FileText className="w-6 h-6 text-indigo-400" />
                                <div className="text-left">
                                    <h2 className="text-xl font-light tracking-wide text-white">Invoice Preview</h2>
                                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">Review and live-edit details before submitting</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowInvoiceModal(false)}
                                className="text-neutral-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Invoice Document Body */}
                        <div className="p-8 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
                            {/* Invoice Branding & Header */}
                            <div className="flex justify-between items-start gap-4">
                                <div className="text-left">
                                    <h3 className="text-2xl font-black text-neutral-900 tracking-wider">EASY BLINDS</h3>
                                    <p className="text-xs text-neutral-500 font-medium">Premium Window Treatments & Custom Automation</p>
                                    <p className="text-[11px] text-neutral-400 mt-2">Dubai, United Arab Emirates<br />info@easyblinds.ae | +971 4 123 4567</p>
                                </div>
                                <div className="text-right">
                                    <span className="px-3 py-1 bg-neutral-100 text-neutral-800 text-[10px] font-black tracking-widest uppercase rounded border border-neutral-200">
                                        OFFICIAL QUOTATION
                                    </span>
                                    <h4 className="text-xl font-light text-neutral-700 mt-3">{tempQuoteId}</h4>
                                    <p className="text-[11px] text-neutral-500 mt-1 font-medium">Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                            </div>

                            <hr className="border-stone-100" />

                            {/* Client & Salesman Info Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-stone-50 p-6 rounded-xl border border-stone-100">
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase text-neutral-400 tracking-wider mb-2">Prepared For</p>
                                    <p className="text-base font-bold text-neutral-900">{clientName || "Unnamed Client"}</p>
                                    <p className="text-xs text-neutral-600 font-medium mt-1">Phone: {clientPhone || "N/A"}</p>
                                    <p className="text-xs text-neutral-600 font-medium">Email: {clientEmail || "N/A"}</p>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase text-neutral-400 tracking-wider mb-2">Prepared By</p>
                                    <p className="text-base font-bold text-neutral-900">{user?.name || "Easy Blinds Sales Representative"}</p>
                                    <p className="text-xs text-neutral-600 font-medium mt-1">ID: {user?._id?.slice(-8).toUpperCase()}</p>
                                    <p className="text-xs text-neutral-600 font-medium">Email: {user?.email || "N/A"}</p>
                                </div>
                            </div>

                            {/* Live Editable Item Table */}
                            <div>
                                <p className="text-[10px] font-black uppercase text-neutral-400 tracking-wider mb-4 text-left">Line Items (Edit directly below)</p>
                                <div className="border border-stone-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-neutral-100 border-b border-stone-200 text-xs font-bold text-neutral-700">
                                                <th className="p-3 w-12 text-center">#</th>
                                                <th className="p-3">Description</th>
                                                <th className="p-3 w-28 text-center">Qty</th>
                                                <th className="p-3 w-36 text-right">Unit Price (AED)</th>
                                                <th className="p-3 w-36 text-right">Total (AED)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-100 text-sm">
                                            {lineItems.map((item, idx) => (
                                                <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                                                    <td className="p-3 text-center text-neutral-400 font-medium">{idx + 1}</td>
                                                    <td className="p-2">
                                                        <input 
                                                            type="text" 
                                                            value={item.description}
                                                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                                            placeholder="Item description"
                                                            className="w-full bg-transparent focus:bg-white hover:bg-stone-50 border border-transparent focus:border-stone-300 rounded px-2 py-1 text-sm font-medium text-neutral-800 transition-colors outline-none focus:ring-1 focus:ring-neutral-400/20"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input 
                                                            type="number" 
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                                            className="w-full bg-transparent focus:bg-white hover:bg-stone-50 border border-transparent focus:border-stone-300 rounded px-2 py-1 text-sm font-medium text-center text-neutral-800 transition-colors outline-none focus:ring-1 focus:ring-neutral-400/20"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input 
                                                            type="number" 
                                                            min="0"
                                                            value={item.unitPrice}
                                                            onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                            className="w-full bg-transparent focus:bg-white hover:bg-stone-50 border border-transparent focus:border-stone-300 rounded px-2 py-1 text-sm font-medium text-right text-neutral-800 transition-colors outline-none focus:ring-1 focus:ring-neutral-400/20"
                                                        />
                                                    </td>
                                                    <td className="p-3 text-right text-neutral-800 font-semibold">
                                                        {(item.quantity * item.unitPrice).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Notes & Summary Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-2 space-y-2 text-left">
                                    <Label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Invoice Notes & Terms</Label>
                                    <textarea
                                        className="w-full h-24 p-3 border border-stone-200 rounded-xl resize-none text-xs text-stone-600 bg-stone-50 focus:bg-white transition-colors outline-none focus:ring-1 focus:ring-neutral-200 focus:border-stone-300"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Terms and conditions, delivery, and payment terms..."
                                    />
                                </div>
                                <div className="bg-stone-50 p-5 rounded-xl border border-stone-100 space-y-3 text-sm">
                                    <div className="flex justify-between text-neutral-500 font-medium">
                                        <span>Subtotal</span>
                                        <span>AED {subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-neutral-500 font-medium">
                                        <span>VAT (5%)</span>
                                        <span>AED {vat.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline">
                                        <span className="font-bold text-neutral-900">Total</span>
                                        <span className="text-2xl font-light text-neutral-900">AED {total.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="bg-neutral-50 px-8 py-5 flex justify-end gap-3 border-t border-stone-200">
                            <Button 
                                variant="outline" 
                                onClick={() => setShowInvoiceModal(false)}
                                className="h-11 px-5 font-medium border-2"
                            >
                                Back to Editor
                            </Button>
                            <Button 
                                onClick={() => {
                                    setShowInvoiceModal(false);
                                    void handleSave("Sent");
                                }}
                                className="h-11 px-6 bg-neutral-900 hover:bg-neutral-800 text-white font-medium flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                Approve & Save Quote
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
