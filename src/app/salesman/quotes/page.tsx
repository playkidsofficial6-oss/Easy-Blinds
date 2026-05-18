"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, Download, Send, CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { useQuotes } from "@/lib/quote-store";

export default function QuotesPage() {
    const { quotes, updateQuoteStatus } = useQuotes();

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
        <div className="space-y-12 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold">
                        <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
                        <span>Quotations</span>
                    </div>
                    <h1 className="text-6xl font-light tracking-tight text-neutral-900">
                        All
                        <span className="block font-semibold mt-1">Quotes</span>
                    </h1>
                </div>
                <Link href="/salesman/quotes/new">
                    <Button className="h-14 px-8 bg-neutral-900 hover:bg-neutral-800 text-white border-0 font-medium uppercase tracking-wide">
                        <Plus className="w-5 h-5 mr-2" />
                        New Quote
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-px bg-neutral-200">
                <Card className="border-0 rounded-none bg-white hover:bg-neutral-50 transition-colors cursor-pointer">
                    <CardContent className="p-10">
                        <div className="text-sm uppercase tracking-wider text-neutral-500 mb-4 font-medium">Total</div>
                        <div className="text-6xl font-light text-neutral-900">{quotes.length}</div>
                    </CardContent>
                </Card>

                <Card className="border-0 rounded-none bg-white hover:bg-neutral-50 transition-colors cursor-pointer">
                    <CardContent className="p-10">
                        <div className="text-sm uppercase tracking-wider text-neutral-500 mb-4 font-medium">Approved</div>
                        <div className="text-6xl font-light text-emerald-800">
                            {quotes.filter(q => q.status === 'Approved').length}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 rounded-none bg-white hover:bg-neutral-50 transition-colors cursor-pointer">
                    <CardContent className="p-10">
                        <div className="text-sm uppercase tracking-wider text-neutral-500 mb-4 font-medium">Pending</div>
                        <div className="text-6xl font-light text-blue-800">
                            {quotes.filter(q => q.status === 'Sent').length}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 rounded-none bg-white hover:bg-neutral-50 transition-colors cursor-pointer">
                    <CardContent className="p-10">
                        <div className="text-sm uppercase tracking-wider text-neutral-500 mb-4 font-medium">Value</div>
                        <div className="text-4xl font-light text-neutral-900">
                            {(quotes.reduce((sum, q) => sum + q.total, 0) / 1000).toFixed(0)}k
                        </div>
                        <div className="text-xs text-neutral-400 mt-1">AED</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <Input
                        placeholder="Search quotes..."
                        className="pl-12 h-14 text-base border-2 border-neutral-200 focus:border-neutral-900"
                    />
                </div>
                <Button variant="outline" className="h-14 px-6 border-2 border-neutral-200 hover:border-neutral-900">
                    All Status
                </Button>
                <Button variant="outline" className="h-14 px-6 border-2 border-neutral-200 hover:border-neutral-900">
                    This Month
                </Button>
            </div>

            {/* Quotes List */}
            <div className="space-y-px bg-neutral-200">
                {quotes.map((quote) => (
                    <div
                        key={quote.id}
                        className="bg-white p-10 hover:bg-neutral-50 transition-colors group cursor-pointer"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-3">
                                    <h3 className="text-2xl font-light text-neutral-900">{quote.id}</h3>
                                    <span className={`px-4 py-1 rounded-full text-xs font-medium uppercase tracking-wider flex items-center gap-2 ${getStatusStyle(quote.status)}`}>
                                        {getStatusIcon(quote.status)}
                                        {quote.status}
                                    </span>
                                </div>
                                <p className="text-lg font-medium text-neutral-900 mb-2">{quote.client}</p>
                                <div className="flex items-center gap-6 text-sm text-neutral-500">
                                    <span>Created: {new Date(quote.date).toLocaleDateString('en-AE')}</span>
                                    {quote.sentDate && (
                                        <>
                                            <span className="text-neutral-300">•</span>
                                            <span>Sent: {new Date(quote.sentDate).toLocaleDateString('en-AE')}</span>
                                        </>
                                    )}
                                    <span className="text-neutral-300">•</span>
                                    <span className="text-lg font-medium text-neutral-900">
                                        AED {quote.total.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link href={`/salesman/quotes/${quote.id}`}>
                                    <Button variant="outline" size="sm" className="h-12 px-6 border-2">
                                        <FileText className="w-4 h-4 mr-2" />
                                        View
                                    </Button>
                                </Link>
                                <Button variant="outline" size="sm" className="h-12 px-6 border-2">
                                    <Download className="w-4 h-4 mr-2" />
                                    PDF
                                </Button>
                                {quote.status === 'Draft' && (
                                    <Button size="sm" className="h-12 px-6 bg-neutral-900 hover:bg-neutral-800" onClick={() => updateQuoteStatus(quote.id, 'Sent')}>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
