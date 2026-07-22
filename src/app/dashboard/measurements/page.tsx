"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MapPin, Calendar, User } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { getJobs, isAssignedToUser } from "@/lib/jobs";

interface MeasurementListItem {
    id: string;
    client: string;
    area: string;
    property: string;
    date: string;
    status: string;
    rooms: number;
    assignedTo: string;
}

interface StoredMeasurement {
    id: string;
    client?: {
        name?: string;
        area?: string;
        location?: string;
        propertyType?: string;
    };
    rooms?: unknown[];
    status?: string;
    updatedAt?: string;
}

export default function MeasurementsPage() {
    const { user } = useAuth();
    const [measurements, setMeasurements] = useState<MeasurementListItem[]>([]);

    useEffect(() => {
        const loadMeasurements = async () => {
            const stored = typeof window !== "undefined" ? localStorage.getItem("eb_salesman_measurements_v1") : null;
            const savedMeasurements: StoredMeasurement[] = stored ? JSON.parse(stored) : [];
            const savedItems: MeasurementListItem[] = savedMeasurements.map((measurement) => ({
                id: measurement.id,
                client: measurement.client?.name ?? "Unnamed Client",
                area: measurement.client?.area ?? measurement.client?.location ?? "Not specified",
                property: measurement.client?.propertyType ?? "Property",
                date: measurement.updatedAt ?? new Date().toISOString(),
                status: measurement.status ?? "Draft",
                rooms: measurement.rooms?.length ?? 0,
                assignedTo: user?.name ?? "Salesman",
            }));

            if (!user?._id) {
                setMeasurements(savedItems);
                return;
            }

            const response = await getJobs({ limit: 100 });
            const assignedItems: MeasurementListItem[] = response.items
                .filter((job) => isAssignedToUser(job, user))
                .map((job) => ({
                    id: job._id,
                    client: job.customerName,
                    area: job.address,
                    property: job.propertyType ?? "Property",
                    date: job.scheduledAt ?? job.updatedAt ?? job.createdAt ?? new Date().toISOString(),
                    status: job.status === "completed" ? "Completed" : "Draft",
                    rooms: job.quantity ?? 0,
                    assignedTo: user.name,
                }));

            const savedIds = new Set(savedItems.map((item) => item.id));
            setMeasurements([...savedItems, ...assignedItems.filter((item) => !savedIds.has(item.id))]);
        };

        void loadMeasurements();
    }, [user?._id, user?.email, user?.name]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-stone-900">Measurements</h1>
                    <p className="text-stone-500">Manage all client measurements and site visits</p>
                </div>
                <Link href="/salesman/measurements/new">
                    <Button className="bg-stone-900 hover:bg-stone-800 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        New Measurement
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
                            <Input
                                placeholder="Search by client, location, or ID..."
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">All Status</Button>
                            <Button variant="outline" size="sm">Today</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {measurements.map((measurement) => (
                            <div
                                key={measurement.id}
                                className="border border-stone-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                            >
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-stone-900">{measurement.client}</h3>
                                                    <Badge variant={measurement.status === 'Completed' ? 'default' : 'secondary'}>
                                                        {measurement.status}
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-stone-600">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-stone-400" />
                                                        <span>{measurement.area} • {measurement.property}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-stone-400" />
                                                        <span>{new Date(measurement.date).toLocaleDateString('en-AE')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-stone-400" />
                                                        <span>{measurement.assignedTo}</span>
                                                    </div>
                                                    <div className="text-stone-500">
                                                        {measurement.rooms} room{measurement.rooms > 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link href={`/salesman/measurements/${measurement.id}`}>
                                            <Button variant="outline" size="sm">View Details</Button>
                                        </Link>
                                        {measurement.status === 'Completed' && (
                                            <Link href={`/salesman/quotes/new?measurementId=${measurement.id}`}>
                                                <Button size="sm" className="bg-stone-900 hover:bg-stone-800">
                                                    Create Quote
                                                </Button>
                                            </Link>
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
