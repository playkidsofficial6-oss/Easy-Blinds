"use client";

import { useState } from "react";
import { MOCK_JOBS, InstallationJob } from "@/lib/data/jobs";
import { MOCK_TEAM } from "@/lib/data/team";
import { brands } from "@/lib/brands";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, MapPin, ArrowRight, Filter, Clock, Phone } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function AssignmentsPage() {
    const [jobs, setJobs] = useState<InstallationJob[]>(MOCK_JOBS);
    const [selectedFitters, setSelectedFitters] = useState<Record<string, string>>({});
    const [selectedBrands, setSelectedBrands] = useState<Record<string, string>>({});
    const [dateFilter, setDateFilter] = useState<string>("");

    const handleAssign = (jobId: string) => {
        const fitterId = selectedFitters[jobId];
        const brandId = selectedBrands[jobId];

        if (!fitterId) {
            toast.error("Please select a fitter first");
            return;
        }

        if (!brandId) {
            toast.error("Please select a brand first");
            return;
        }

        const fitter = MOCK_TEAM.find(t => t.id === fitterId);
        const brand = brands.find(b => b.id === brandId);

        setJobs(jobs.map(job => {
            if (job.id === jobId) {
                return {
                    ...job,
                    status: "Installation In Progress",
                    team: fitter?.name || "Assigned Team",
                    brand: brand?.name || "Assigned Brand"
                };
            }
            return job;
        }));

        toast.success(`Job assigned to ${fitter?.name} for ${brand?.name}`);

        const newSelectedFitters = { ...selectedFitters };
        delete newSelectedFitters[jobId];
        setSelectedFitters(newSelectedFitters);

        const newSelectedBrands = { ...selectedBrands };
        delete newSelectedBrands[jobId];
        setSelectedBrands(newSelectedBrands);
    };

    const filterJobs = (statusGroup: 'pending' | 'ongoing' | 'completed') => {
        return jobs.filter(job => {
            // Status Logic
            let statusMatch = false;
            if (statusGroup === 'pending') {
                statusMatch = job.status === "Ready for Installation" || job.status === "Pending Team";
            } else if (statusGroup === 'ongoing') {
                statusMatch = job.status === "Installation In Progress" || job.status === "Scheduled";
            } else if (statusGroup === 'completed') {
                statusMatch = job.status === "Completed";
            }

            // Date Logic
            let dateMatch = true;
            if (dateFilter) {
                dateMatch = job.scheduled === dateFilter;
            }

            return statusMatch && dateMatch;
        });
    };

    const getStatusBadge = (status: string) => {
        if (status === "Installation In Progress" || status === "Scheduled") {
            return (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-700 rounded-full border border-orange-200">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wider">{status}</span>
                </div>
            );
        } else if (status === "Completed") {
            return (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-medium uppercase tracking-wider">Completed</span>
                </div>
            );
        } else {
            return (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="text-xs font-medium uppercase tracking-wider">{status}</span>
                </div>
            );
        }
    };

    const renderJobList = (statusGroup: 'pending' | 'ongoing' | 'completed') => {
        const filteredJobs = filterJobs(statusGroup);

        if (filteredJobs.length === 0) {
            return (
                <div className="bg-white dark:bg-neutral-900 p-20 text-center border border-neutral-200 dark:border-neutral-800">
                    <p className="text-neutral-400 font-light text-xl">
                        {dateFilter ? `No ${statusGroup} jobs found for this date.` : `No ${statusGroup} jobs found.`}
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {filteredJobs.map((job) => {
                    // Find the assigned brand object if it exists
                    // ALSO check the selectedBrands state for immediate preview
                    const assignedBrandName = job.brand;
                    const selectedBrandId = selectedBrands[job.id];

                    const effectiveBrand = selectedBrandId
                        ? brands.find(b => b.id === selectedBrandId)
                        : (assignedBrandName ? brands.find(b => b.name === assignedBrandName) : null);

                    // Determine styles
                    // If effectiveBrand exists, use its pre-defined card styles. Else use default neutral.
                    let containerClasses = "bg-white dark:bg-neutral-900 p-10 transition-all duration-300 group border-y border-r";

                    if (effectiveBrand) {
                        // Use the safelisted card styles from brands.ts
                        containerClasses = cn(containerClasses, effectiveBrand.styles.card);
                    } else {
                        // Default border styling if no brand
                        containerClasses = cn(containerClasses, "border-l-4 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800");
                    }

                    return (
                        <div key={job.id} className={containerClasses}>
                            <div className="flex flex-col xl:flex-row xl:items-center gap-10">
                                {/* Job Info */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-2xl font-light text-neutral-900 dark:text-white mb-2">{job.client}</h3>
                                            <div className="flex items-center gap-2 text-neutral-500 mb-1">
                                                <MapPin className="w-4 h-4" />
                                                <span>{job.area}</span>
                                                <span className="text-neutral-300">•</span>
                                                <span>{job.property}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-neutral-400 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{job.scheduled || "ASAP"}</span>
                                                </div>
                                                {job.time && (
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{job.time}</span>
                                                    </div>
                                                )}
                                                {job.whatsapp && (
                                                    <div className="flex items-center gap-2 text-emerald-600">
                                                        <Phone className="w-4 h-4" />
                                                        <span>{job.whatsapp}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-light text-neutral-900 dark:text-white">AED {job.value.toLocaleString()}</div>
                                            <div className="text-xs uppercase tracking-wider text-neutral-400">Value</div>
                                            {job.priority === 'High' && (
                                                <div className="mt-2 inline-flex items-center px-2 py-1 bg-red-50 text-red-700 text-xs uppercase tracking-wider font-medium">
                                                    High Priority
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions / Status Info */}
                                <div className="hidden xl:block w-px h-24 bg-neutral-200 dark:bg-neutral-800"></div>

                                <div className="xl:w-80 space-y-4">
                                    {statusGroup === 'pending' ? (
                                        <>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Select Team</label>
                                                    <Select
                                                        value={selectedFitters[job.id] || ""}
                                                        onValueChange={(val) => setSelectedFitters(prev => ({ ...prev, [job.id]: val }))}
                                                    >
                                                        <SelectTrigger className="h-12 bg-neutral-50 border-neutral-200 rounded-none focus:ring-0 focus:border-neutral-400">
                                                            <SelectValue placeholder="Choose Fitter..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {MOCK_TEAM.map((fitter) => (
                                                                <SelectItem key={fitter.id} value={fitter.id}>
                                                                    {fitter.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Select Brand</label>
                                                    <Select
                                                        value={selectedBrands[job.id] || ""}
                                                        onValueChange={(val) => setSelectedBrands(prev => ({ ...prev, [job.id]: val }))}
                                                    >
                                                        <SelectTrigger className="h-12 bg-neutral-50 border-neutral-200 rounded-none focus:ring-0 focus:border-neutral-400">
                                                            <SelectValue placeholder="Choose Brand..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {brands.map((brand) => (
                                                                <SelectItem key={brand.id} value={brand.id}>
                                                                    {brand.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <Button
                                                className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 rounded-none uppercase tracking-wider text-xs font-medium disabled:opacity-50"
                                                onClick={() => handleAssign(job.id)}
                                                disabled={!selectedFitters[job.id] || !selectedBrands[job.id]}
                                            >
                                                Confirm Assignment
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="h-full flex flex-col justify-center gap-4">
                                            <div>
                                                <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium mb-1">Assigned To</div>
                                                <div className="text-lg font-light text-neutral-900 dark:text-white">
                                                    {job.team}
                                                </div>
                                                {effectiveBrand && (
                                                    <div className={cn("text-sm font-medium mt-1 inline-flex items-center gap-2 px-2 py-0.5 rounded", effectiveBrand.styles.badge)}>
                                                        <span className="w-2 h-2 rounded-full bg-current"></span>
                                                        {effectiveBrand.name}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                {getStatusBadge(job.status)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        );
    };

    return (
        <div className="space-y-12">
            <div className="flex items-end justify-between">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold">
                        <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
                        <span>Workflow</span>
                    </div>
                    <h1 className="text-6xl font-light tracking-tight text-neutral-900 dark:text-white">
                        Job
                        <span className="block font-semibold mt-1">Assignments</span>
                    </h1>
                </div>
                <div className="flex flex-col items-end gap-4">
                    <Link href="/sales-manager/jobs/new">
                        <Button className="h-14 px-8 bg-neutral-900 text-white hover:bg-amber-600 rounded-none uppercase tracking-widest text-xs font-medium transition-colors">
                            Create New Job
                        </Button>
                    </Link>
                </div>
            </div>

            <Tabs defaultValue="pending" className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                    <TabsList className="bg-neutral-100 dark:bg-neutral-800 p-1 h-auto rounded-full inline-flex">
                        {['pending', 'ongoing', 'completed'].map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab}
                                className="rounded-full px-6 py-2 text-sm font-medium transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-900 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 capitalize"
                            >
                                {tab}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="flex items-center gap-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-2 rounded-lg">
                        <div className="flex items-center gap-2 px-2 text-neutral-400">
                            <Filter className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wider font-medium">Filter Date</span>
                        </div>
                        <Input
                            type="date"
                            className="bg-transparent border-0 h-9 w-40 p-0 text-sm focus-visible:ring-0"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>
                </div>

                <TabsContent value="pending" className="mt-0">
                    {renderJobList('pending')}
                </TabsContent>
                <TabsContent value="ongoing" className="mt-0">
                    {renderJobList('ongoing')}
                </TabsContent>
                <TabsContent value="completed" className="mt-0">
                    {renderJobList('completed')}
                </TabsContent>
            </Tabs>
        </div>
    );
}
