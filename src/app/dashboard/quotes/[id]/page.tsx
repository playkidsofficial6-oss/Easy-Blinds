"use client";

import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Send, Edit, Phone, Mail, Calendar, FileText, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { getJobs } from "@/lib/jobs";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";

export default function ViewQuotePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const [quote, setQuote] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchQuote = async () => {
            if (!user?._id) return;
            try {
                const response = await getJobs({ limit: 100 });
                const assignedJobs = response.items.filter((job) =>
                    job.assignedTo === user._id || job.assignedTo === user.name || job.assignedTo === user.email
                );
                
                // Find the job containing this quotation ID
                const jobWithQuote = assignedJobs.find(job => job.quotation?.id === id);
                
                if (jobWithQuote && jobWithQuote.quotation) {
                    const q = jobWithQuote.quotation;
                    
                    // Normalize the data structure
                    setQuote({
                        id: q.id,
                        clientName: q.client || jobWithQuote.customerName,
                        clientPhone: q.clientPhone || jobWithQuote.customerPhone,
                        clientEmail: q.clientEmail || jobWithQuote.customerEmail || "Not Provided",
                        status: q.status || "Draft",
                        createdAt: q.date,
                        sentAt: q.sentDate,
                        lineItems: q.items || [],
                        subtotal: q.items?.reduce((sum: number, item: any) => sum + (item.price || item.unitPrice || 0) * (item.quantity || 1), 0) || 0,
                        vat: (q.items?.reduce((sum: number, item: any) => sum + (item.price || item.unitPrice || 0) * (item.quantity || 1), 0) || 0) * 0.05,
                        total: q.total,
                        notes: q.notes || "No additional notes."
                    });
                } else {
                    toast.error("Quote not found");
                }
            } catch (error) {
                toast.error("Failed to load quote details");
            } finally {
                setIsLoading(false);
            }
        };

        void fetchQuote();
    }, [id, user?._id, user?.email, user?.name]);

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
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                    <p className="text-neutral-500 font-light">Loading Quote Details...</p>
                </div>
            ) : !quote ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <XCircle className="w-12 h-12 text-neutral-300" />
                    <h2 className="text-2xl font-light text-neutral-700">Quote Not Found</h2>
                    <Link href="/dashboard/quotes">
                        <Button variant="outline">Back to Quotes</Button>
                    </Link>
                </div>
            ) : (
                <>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/quotes">
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
                                        {quote.lineItems.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                                <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">{item.description || item.name}</td>
                                                <td className="px-6 py-4 text-center text-neutral-600 dark:text-neutral-400">{item.quantity || 1}</td>
                                                <td className="px-6 py-4 text-right text-neutral-600 dark:text-neutral-400">AED {(item.unitPrice || item.price || 0).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right font-medium text-neutral-900 dark:text-white">AED {((item.quantity || 1) * (item.unitPrice || item.price || 0)).toLocaleString()}</td>
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
                </>
            )}
        </div>
    );
}
