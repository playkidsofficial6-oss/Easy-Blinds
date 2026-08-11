"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, Download, Send, CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getJobs, isAssignedToUser, updateJob } from "@/lib/jobs";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";

export default function QuotesPage() {
    const { user } = useAuth();
    const [quotes, setQuotes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchQuotes = async () => {
            if (!user?._id) return;
            try {
                const response = await getJobs({ limit: 100 });
                const assignedJobs = response.items.filter((job) =>
                    isAssignedToUser(job, user)
                );

                // Extract quotations from jobs
                const extractedQuotes = assignedJobs
                    .filter(job => job.quotation)
                    .map(job => ({ ...job.quotation, jobId: job._id }));

                setQuotes(extractedQuotes);
            } catch (error) {
                toast.error("Failed to fetch quotes");
            } finally {
                setIsLoading(false);
            }
        };

        void fetchQuotes();
    }, [user?._id, user?.email, user?.name]);

    const handleUpdateQuoteStatus = async (quote: any, newStatus: string) => {
        try {
            const updatedQuotation = { ...quote, status: newStatus };
            if (newStatus === "Sent") {
                updatedQuotation.sentDate = new Date().toISOString();
            }
            await updateJob(quote.jobId, { quotation: updatedQuotation });
            setQuotes(quotes.map(q => q.id === quote.id ? updatedQuotation : q));
            toast.success(`Quote status updated to ${newStatus}`);
        } catch (error) {
            toast.error("Failed to update quote status");
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Approved':
                return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
            case 'Sent':
                return 'bg-blue-50 text-blue-800 border border-blue-200';
            case 'Negotiation':
                return 'bg-amber-50 text-amber-800 border border-amber-200';
            case 'Rejected':
                return 'bg-red-50 text-red-800 border border-red-200';
            default:
                return 'bg-neutral-100 text-neutral-700 border border-neutral-300';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Approved':
                return <CheckCircle className="w-4 h-4" />;
            case 'Sent':
                return <Send className="w-4 h-4" />;
            case 'Negotiation':
                return <Clock className="w-4 h-4" />;
            case 'Rejected':
                return <XCircle className="w-4 h-4" />;
            default:
                return <FileText className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-6 sm:space-y-12 max-w-7xl mx-auto p-4 sm:p-0 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 sm:space-y-3">
                    <div className="flex items-center gap-2 sm:gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold">
                        <div className="w-8 sm:w-12 h-px bg-linear-to-r from-transparent via-amber-600 to-transparent"></div>
                        <span>Quotations</span>
                    </div>
                    <h1 className="text-3xl sm:text-6xl font-light tracking-tight text-neutral-900">
                        All <span className="inline-block sm:block font-semibold">Quotes</span>
                    </h1>
                </div>
                <Link href="/dashboard/quotes/new" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto h-11 sm:h-14 px-6 sm:px-8 bg-neutral-900 hover:bg-neutral-800 text-white border-0 font-medium uppercase tracking-wide">
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        New Quote
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            {isLoading ? (
                <div className="p-12 text-center text-neutral-400 font-light">Loading quotes...</div>
            ) : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-px sm:bg-neutral-200">
                        <Card className="border sm:border-0 rounded-xl sm:rounded-none bg-white hover:bg-neutral-50 transition-colors cursor-pointer">
                            <CardContent className="p-4 sm:p-8">
                                <div className="text-xs sm:text-sm uppercase tracking-wider text-neutral-500 mb-2 sm:mb-4 font-medium">Total</div>
                                <div className="text-3xl sm:text-6xl font-light text-neutral-900">{quotes.length}</div>
                            </CardContent>
                        </Card>

                        <Card className="border sm:border-0 rounded-xl sm:rounded-none bg-white hover:bg-neutral-50 transition-colors cursor-pointer">
                            <CardContent className="p-4 sm:p-8">
                                <div className="text-xs sm:text-sm uppercase tracking-wider text-neutral-500 mb-2 sm:mb-4 font-medium">Approved</div>
                                <div className="text-3xl sm:text-6xl font-light text-emerald-800">
                                    {quotes.filter(q => q.status === 'Approved').length}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border sm:border-0 rounded-xl sm:rounded-none bg-white hover:bg-neutral-50 transition-colors cursor-pointer">
                            <CardContent className="p-4 sm:p-8">
                                <div className="text-xs sm:text-sm uppercase tracking-wider text-neutral-500 mb-2 sm:mb-4 font-medium">Pending</div>
                                <div className="text-3xl sm:text-6xl font-light text-blue-800">
                                    {quotes.filter(q => q.status === 'Sent').length}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border sm:border-0 rounded-xl sm:rounded-none bg-white hover:bg-neutral-50 transition-colors cursor-pointer">
                            <CardContent className="p-4 sm:p-8">
                                <div className="text-xs sm:text-sm uppercase tracking-wider text-neutral-500 mb-2 sm:mb-4 font-medium">Value</div>
                                <div className="text-2xl sm:text-4xl font-light text-neutral-900">
                                    {(quotes.reduce((sum, q) => sum + (q.total || 0), 0) / 1000).toFixed(0)}k
                                </div>
                                <div className="text-[10px] sm:text-xs text-neutral-400 mt-0.5">AED</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Search & Filter */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4 sm:w-5 sm:h-5" />
                            <Input
                                placeholder="Search quotes..."
                                className="pl-11 sm:pl-12 h-11 sm:h-14 text-sm sm:text-base border border-neutral-200 focus:border-neutral-900 bg-white"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="flex-1 sm:flex-initial h-11 sm:h-14 px-3 sm:px-6 text-xs sm:text-sm border border-neutral-200 hover:border-neutral-900 bg-white">
                                All Status
                            </Button>
                            <Button variant="outline" className="flex-1 sm:flex-initial h-11 sm:h-14 px-3 sm:px-6 text-xs sm:text-sm border border-neutral-200 hover:border-neutral-900 bg-white">
                                This Month
                            </Button>
                        </div>
                    </div>

                    {/* Quotes List */}
                    <div className="space-y-3 sm:space-y-px sm:bg-neutral-200">
                        {quotes.map((quote) => (
                            <div
                                key={quote.id}
                                className="bg-white p-4 sm:p-8 rounded-xl sm:rounded-none border sm:border-0 border-neutral-200 hover:bg-neutral-50 transition-colors group cursor-pointer"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2">
                                            <h3 className="text-xl sm:text-2xl font-light text-neutral-900">{quote.id}</h3>
                                            <span className={`px-3 py-0.5 sm:px-4 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 ${getStatusStyle(quote.status)}`}>
                                                {getStatusIcon(quote.status)}
                                                {quote.status}
                                            </span>
                                        </div>
                                        <p className="text-base sm:text-lg font-medium text-neutral-900 mb-1.5 truncate">{quote.client}</p>
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-500 font-medium">
                                            <span>Created: {new Date(quote.date).toLocaleDateString('en-AE')}</span>
                                            {quote.sentDate && (
                                                <>
                                                    <span className="text-neutral-300">•</span>
                                                    <span>Sent: {new Date(quote.sentDate).toLocaleDateString('en-AE')}</span>
                                                </>
                                            )}
                                            <span className="text-neutral-300">•</span>
                                            <span className="text-sm sm:text-lg font-semibold text-neutral-900">
                                                AED {quote.total?.toLocaleString() ?? 0}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-neutral-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link href={`/dashboard/quotes/${quote.id}`} className="flex-1 sm:flex-initial">
                                            <Button variant="outline" size="sm" className="w-full sm:w-auto h-9 sm:h-12 px-4 sm:px-6 text-xs sm:text-sm border">
                                                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                                                View
                                            </Button>
                                        </Link>
                                        <Button variant="outline" size="sm" className="flex-1 sm:flex-initial h-9 sm:h-12 px-4 sm:px-6 text-xs sm:text-sm border">
                                            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                                            PDF
                                        </Button>
                                        {quote.status === 'Draft' && (
                                            <Button size="sm" className="flex-1 sm:flex-initial h-9 sm:h-12 px-4 sm:px-6 text-xs sm:text-sm bg-neutral-900 hover:bg-neutral-800" onClick={() => handleUpdateQuoteStatus(quote, 'Sent')}>
                                                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                                                Send
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
