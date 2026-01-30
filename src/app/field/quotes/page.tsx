"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, Download, Send, CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { useQuotes } from "@/lib/quote-store";
import { format } from "date-fns";
import { useState } from "react";

export default function FieldQuotesPage() {
    const { quotes, isLoaded } = useQuotes();
    const [searchQuery, setSearchQuery] = useState("");

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

    const filteredQuotes = quotes.filter(q =>
        q.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: quotes.length,
        approved: quotes.filter(q => q.status === 'Approved').length,
        pending: quotes.filter(q => q.status === 'Sent' || q.status === 'Negotiation').length,
        value: quotes.reduce((sum, q) => sum + q.total, 0)
    };

    if (!isLoaded) {
        return <div className="p-8 text-center text-slate-400">Loading quotes...</div>;
    }

    return (
        <div className="space-y-12 max-w-7xl mx-auto p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold">
                        <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
                        <span>Field Operations</span>
                    </div>
                    <h1 className="text-6xl font-light tracking-tight text-neutral-900">
                        My
                        <span className="block font-semibold mt-1">Quotes</span>
                    </h1>
                </div>
                <Link href="/field/quotes/new">
                    <Button className="h-14 px-8 bg-neutral-900 hover:bg-neutral-800 text-white border-0 font-medium uppercase tracking-wide rounded-full shadow-lg hover:shadow-xl transition-all">
                        <Plus className="w-5 h-5 mr-2" />
                        New Quote
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-px bg-neutral-200 border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-white p-10 hover:bg-neutral-50 transition-colors">
                    <div className="text-sm uppercase tracking-wider text-neutral-500 mb-4 font-medium">Total Quotes</div>
                    <div className="text-5xl font-light text-neutral-900">{stats.total}</div>
                </div>

                <div className="bg-white p-10 hover:bg-neutral-50 transition-colors">
                    <div className="text-sm uppercase tracking-wider text-neutral-500 mb-4 font-medium">Approved</div>
                    <div className="text-5xl font-light text-emerald-600">
                        {stats.approved}
                    </div>
                </div>

                <div className="bg-white p-10 hover:bg-neutral-50 transition-colors">
                    <div className="text-sm uppercase tracking-wider text-neutral-500 mb-4 font-medium">Pending</div>
                    <div className="text-5xl font-light text-blue-600">
                        {stats.pending}
                    </div>
                </div>

                <div className="bg-white p-10 hover:bg-neutral-50 transition-colors">
                    <div className="text-sm uppercase tracking-wider text-neutral-500 mb-4 font-medium">Total Value</div>
                    <div className="flex items-baseline gap-1">
                        <div className="text-4xl font-light text-neutral-900">
                            {(stats.value / 1000).toFixed(1)}k
                        </div>
                        <div className="text-xs text-neutral-400 mt-1 font-medium">AED</div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 sticky top-4 z-10 bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-slate-100">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <Input
                        placeholder="Search client or quote ID..."
                        className="pl-12 h-14 text-base border-transparent bg-slate-50 focus:bg-white focus:border-neutral-200 rounded-xl transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="h-8 w-px bg-slate-200 mx-2"></div>
                <Button variant="ghost" className="h-14 px-6 text-slate-500 hover:text-slate-900 rounded-xl">
                    All Status
                </Button>
                <Button variant="ghost" className="h-14 px-6 text-slate-500 hover:text-slate-900 rounded-xl">
                    This Month
                </Button>
            </div>

            {/* Quotes List */}
            <div className="space-y-4">
                {filteredQuotes.length > 0 ? filteredQuotes.map((quote) => (
                    <div
                        key={quote.id}
                        className="bg-white p-8 hover:shadow-md transition-all group cursor-pointer border border-slate-100 rounded-2xl"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-3">
                                    <h3 className="text-xl font-light text-neutral-900 font-mono tracking-tight">{quote.id}</h3>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${getStatusStyle(quote.status)}`}>
                                        {getStatusIcon(quote.status)}
                                        {quote.status}
                                    </span>
                                </div>
                                <p className="text-xl font-medium text-neutral-900 mb-2">{quote.client}</p>
                                <div className="flex items-center gap-6 text-sm text-neutral-500">
                                    <span>{new Date(quote.date).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                    {quote.sentDate && (
                                        <>
                                            <span className="text-neutral-300">•</span>
                                            <span>Sent: {new Date(quote.sentDate).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}</span>
                                        </>
                                    )}
                                    <span className="text-neutral-300">•</span>
                                    <span className="text-lg font-medium text-neutral-900 font-mono">
                                        AED {quote.total.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-200">
                                <Button variant="outline" size="sm" className="h-10 px-4 rounded-lg bg-white hover:bg-slate-50">
                                    <FileText className="w-4 h-4 mr-2" />
                                    View
                                </Button>
                                {quote.status === 'Draft' ? (
                                    <Button size="sm" className="h-10 px-4 bg-neutral-900 hover:bg-neutral-800 rounded-lg">
                                        <Send className="w-4 h-4 mr-2" />
                                        Send
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="sm" className="h-10 px-4 rounded-lg bg-white hover:bg-slate-50">
                                        <Download className="w-4 h-4 mr-2" />
                                        PDF
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">No quotes found</h3>
                        <p className="text-slate-500">Try adjusting your search or create a new quote.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
