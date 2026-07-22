"use client";

import { differenceInDays, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, ExternalLink, AlertCircle, Copy, Check } from "lucide-react";
import Link from "next/link";
import { MOCK_JOBS } from "@/lib/data/jobs";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function PendingReviewsPage() {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Filter for pending reviews
    const pendingJobs = MOCK_JOBS.filter(job =>
        job.status === "Completed" &&
        job.reviewStatus === "pending"
    ).sort((a, b) => new Date(b.scheduled).getTime() - new Date(a.scheduled).getTime());

    const handleCopyLink = (id: string, client: string) => {
        const text = `Hi ${client}, hope you're enjoying your new blinds! Could you please leave us a review here? https://maps.app.goo.gl/WCwfyyEhR7Upk4E69/review`;
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success("Review link copied to clipboard");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getDaysPending = (dateStr: string) => {
        return differenceInDays(new Date(), new Date(dateStr));
    };

    const getStatusColor = (days: number) => {
        if (days > 7) return "bg-rose-100 text-rose-700 border-rose-200"; // Critical
        if (days > 3) return "bg-amber-100 text-amber-700 border-amber-200"; // Warning
        return "bg-blue-100 text-blue-700 border-blue-200"; // Recent
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <Link href="/sales-manager/reviews" className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-900 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Tracking
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-light tracking-tight text-neutral-900">
                            Pending <span className="font-semibold">Follow-ups</span>
                        </h1>
                        <p className="text-neutral-500 mt-2">Operational view for chasing missing reviews (Requirement E).</p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        Action Required ({pendingJobs.length})
                    </CardTitle>
                    <CardDescription>
                        Jobs completed but missing a Google Review. Priority based on time elapsed.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-neutral-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                                <tr>
                                    <th className="px-6 py-4">Fitter</th>
                                    <th className="px-6 py-4">Brand</th>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4">Completion Date</th>
                                    <th className="px-6 py-4 text-center">Days Pending</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {pendingJobs.map((job) => {
                                    const daysPending = getDaysPending(job.scheduled);
                                    return (
                                        <tr key={job.id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-neutral-900 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-600">
                                                    {job.team.split(" ")[1]?.[0]}
                                                </div>
                                                {job.team}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-700 text-sm">
                                                {job.brand || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-900">
                                                {job.client}
                                                <div className="text-xs text-neutral-400">{job.whatsapp}</div>
                                            </td>
                                            <td className="px-6 py-4 text-neutral-500">
                                                {format(new Date(job.scheduled), "MMM d, yyyy")}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge variant="outline" className={cn("font-medium", getStatusColor(daysPending))}>
                                                    {daysPending} days
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleCopyLink(job.id, job.client)}>
                                                        {copiedId === job.id ? (
                                                            <Check className="w-4 h-4 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="w-4 h-4" />
                                                        )}
                                                        <span className="sr-only">Copy Link</span>
                                                    </Button>
                                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                                        <Send className="w-3 h-3 mr-2" />
                                                        Send WhatsApp
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
