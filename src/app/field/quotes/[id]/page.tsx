"use client";

import { use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Send, Edit, Phone, Mail, Calendar, FileText, CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";

// Mock data function to simulate fetching a quote
const getQuote = (id: string) => {
    return {
        id,
        clientName: "Ahmed Al Mansoori",
        clientPhone: "+971 50 123 4567",
        clientEmail: "ahmed.m@example.com",
        status: "Approved",
        createdAt: "2024-01-15",
        sentAt: "2024-01-16",
        approvedAt: "2024-01-17",
        lineItems: [
            { id: "1", description: "Living Room - Motorized Roller Blinds (Somfy Motor)", quantity: 3, unitPrice: 2500 },
            { id: "2", description: "Master Bedroom - Blackout Curtains (Velvet)", quantity: 2, unitPrice: 1800 },
            { id: "3", description: "Installation Service", quantity: 1, unitPrice: 1400 },
        ],
        subtotal: 12500,
        vat: 625,
        total: 13125,
        notes: "Installation to be scheduled on weekends only as per client request."
    };
};

export default function ViewQuotePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const quote = getQuote(id);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Approved':
                return 'bg-emerald-50 text-emerald-800 border-emerald-200';
            case 'Sent':
                return 'bg-blue-50 text-blue-800 border-blue-200';
            case 'Negotiation':
                return 'bg-amber-50 text-amber-800 border-amber-200';
            case 'Rejected':
                return 'bg-red-50 text-red-800 border-red-200';
            default:
                return 'bg-neutral-100 text-neutral-700 border-neutral-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Approved': return <CheckCircle className="w-4 h-4" />;
            case 'Sent': return <Send className="w-4 h-4" />;
            case 'Negotiation': return <Clock className="w-4 h-4" />;
            case 'Rejected': return <XCircle className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/field/quotes">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-neutral-100">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-light text-neutral-900 dark:text-white">Quote {quote.id}</h1>
                            <Badge variant="outline" className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider gap-2 ${getStatusStyle(quote.status)}`}>
                                {getStatusIcon(quote.status)}
                                {quote.status}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-neutral-500 mt-1">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                Created: {new Date(quote.createdAt).toLocaleDateString('en-AE')}
                            </span>
                            {quote.sentAt && (
                                <span className="flex items-center gap-1">
                                    <Send className="w-3.5 h-3.5" />
                                    Sent: {new Date(quote.sentAt).toLocaleDateString('en-AE')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-12 px-6 border-2">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                    <Button variant="outline" className="h-12 px-6 border-2">
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                    </Button>
                    <Button className="h-12 px-6 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900">
                        <Send className="w-4 h-4 mr-2" />
                        Send Email
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Line Items */}
                    <Card className="border-0 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900">
                        <CardHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
                            <CardTitle className="text-lg font-medium text-neutral-900 dark:text-white">Items & Services</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-neutral-500 dark:text-neutral-400 uppercase bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">Description</th>
                                            <th className="px-6 py-4 font-medium text-center">Qty</th>
                                            <th className="px-6 py-4 font-medium text-right">Unit Price</th>
                                            <th className="px-6 py-4 font-medium text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {quote.lineItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                                <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">{item.description}</td>
                                                <td className="px-6 py-4 text-center text-neutral-600 dark:text-neutral-400">{item.quantity}</td>
                                                <td className="px-6 py-4 text-right text-neutral-600 dark:text-neutral-400">AED {item.unitPrice.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right font-medium text-neutral-900 dark:text-white">AED {(item.quantity * item.unitPrice).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    {quote.notes && (
                        <Card className="border-0 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900">
                            <CardHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
                                <CardTitle className="text-lg font-medium text-neutral-900 dark:text-white">Notes & Terms</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{quote.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Client Details */}
                    <Card className="border-0 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900">
                        <CardHeader className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
                            <CardTitle className="text-lg font-medium text-neutral-900 dark:text-white">Client Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div>
                                <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Name</div>
                                <div className="font-medium text-neutral-900 dark:text-white">{quote.clientName}</div>
                            </div>
                            <Separator className="dark:bg-neutral-800" />
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-xs text-neutral-500 dark:text-neutral-400">Phone</div>
                                    <div className="text-sm font-medium text-neutral-900 dark:text-white">{quote.clientPhone}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-xs text-neutral-500 dark:text-neutral-400">Email</div>
                                    <div className="text-sm font-medium text-neutral-900 dark:text-white">{quote.clientEmail}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial Summary */}
                    <Card className="border-0 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800 bg-neutral-900 dark:bg-neutral-800 text-white">
                        <CardHeader className="pb-4 border-b border-neutral-800">
                            <CardTitle className="text-lg font-medium">Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between text-neutral-400">
                                <span>Subtotal</span>
                                <span>AED {quote.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-neutral-400">
                                <span>VAT (5%)</span>
                                <span>AED {quote.vat.toLocaleString()}</span>
                            </div>
                            <div className="pt-4 border-t border-neutral-800 flex justify-between items-end">
                                <span className="text-lg font-medium">Total</span>
                                <span className="text-3xl font-light">AED {quote.total.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
