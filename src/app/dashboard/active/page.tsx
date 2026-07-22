"use client";

import { useState } from "react";
import { MOCK_STITCHING_JOBS } from "@/lib/data/stitching";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function ActiveStitchingJobs() {
    const [searchQuery, setSearchQuery] = useState("");

    const activeJobs = MOCK_STITCHING_JOBS.filter(job =>
        job.status !== "Ready" &&
        (job.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.id.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Active Production Queue</h1>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                    placeholder="Search by client or order ID..."
                    className="pl-10 max-w-md"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="border rounded-lg bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assigned To</TableHead>
                            <TableHead className="text-right">Due Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activeJobs.map((job) => (
                            <TableRow key={job.id}>
                                <TableCell className="font-mono text-xs">{job.id}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{job.client}</div>
                                    <div className="text-xs text-neutral-500">{job.brand}</div>
                                </TableCell>
                                <TableCell>{job.type}</TableCell>
                                <TableCell>
                                    <Badge variant={job.priority === "Urgent" ? "destructive" : "secondary"}>
                                        {job.priority}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{job.status}</Badge>
                                </TableCell>
                                <TableCell>{job.assignedTo}</TableCell>
                                <TableCell className="text-right">{job.dueDate}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
