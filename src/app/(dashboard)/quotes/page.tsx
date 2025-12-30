import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText, Download, Send, CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function QuotesPage() {
    const quotes = [
        {
            id: "Q001",
            client: "Ahmed Al Mansoori",
            measurementId: "M001",
            total: 12500,
            status: "Approved" as const,
            date: "2024-01-15",
            sentDate: "2024-01-16",
        },
        {
            id: "Q002",
            client: "Sarah Smith",
            measurementId: "M002",
            total: 8300,
            status: "Sent" as const,
            date: "2024-01-16",
            sentDate: "2024-01-17",
        },
        {
            id: "Q003",
            client: "Emaar Properties",
            measurementId: "M003",
            total: 25600,
            status: "Negotiation" as const,
            date: "2024-01-16",
            sentDate: "2024-01-17",
        },
        {
            id: "Q004",
            client: "Villa 124",
            measurementId: "M004",
            total: 15200,
            status: "Draft" as const,
            date: "2024-01-17",
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved':
                return 'bg-green-100 text-green-700';
            case 'Sent':
                return 'bg-blue-100 text-blue-700';
            case 'Negotiation':
                return 'bg-orange-100 text-orange-700';
            case 'Rejected':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-stone-100 text-stone-700';
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-stone-900 dark:text-white">Quotes</h1>
                    <p className="text-stone-500 dark:text-stone-400">Manage and track all quotations</p>
                </div>
                <Link href="/quotes/new">
                    <Button className="bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900">
                        <Plus className="w-4 h-4 mr-2" />
                        New Quote
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Total Quotes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{quotes.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Approved</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {quotes.filter(q => q.status === 'Approved').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {quotes.filter(q => q.status === 'Sent').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500 dark:text-stone-400">Total Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold dark:text-white">
                            AED {quotes.reduce((sum, q) => sum + q.total, 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
                            <Input
                                placeholder="Search quotes..."
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">All Status</Button>
                            <Button variant="outline" size="sm">This Month</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {quotes.map((quote) => (
                            <div
                                key={quote.id}
                                className="border border-stone-200 dark:border-stone-800 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-stone-900 dark:text-white">{quote.id}</h3>
                                            <Badge className={getStatusColor(quote.status)}>
                                                <span className="flex items-center gap-1">
                                                    {getStatusIcon(quote.status)}
                                                    {quote.status}
                                                </span>
                                            </Badge>
                                        </div>
                                        <div className="space-y-1 text-sm text-stone-600 dark:text-stone-400">
                                            <p className="font-medium text-stone-900 dark:text-white">{quote.client}</p>
                                            <p>Created: {new Date(quote.date).toLocaleDateString('en-AE')}</p>
                                            {quote.sentDate && (
                                                <p>Sent: {new Date(quote.sentDate).toLocaleDateString('en-AE')}</p>
                                            )}
                                            <p className="text-lg font-bold text-stone-900 dark:text-white mt-2">
                                                AED {quote.total.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            <FileText className="w-4 h-4 mr-2" />
                                            View
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Download className="w-4 h-4 mr-2" />
                                            PDF
                                        </Button>
                                        {quote.status === 'Draft' && (
                                            <Button size="sm" className="bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-200 dark:text-stone-900">
                                                <Send className="w-4 h-4 mr-2" />
                                                Send
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
