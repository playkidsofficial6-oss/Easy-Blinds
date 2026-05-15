"use client";

import { useMemo, useState, type ComponentProps } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Phone, MoreHorizontal, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FitterDetailsSheet } from "@/components/sales/fitter-details-sheet";
import { useLiveFitters, type Fitter, type FitterJob } from "@/lib/live-store";

function toLocationLabel(fitter: Fitter) {
    if (fitter.locationLabel) return fitter.locationLabel;
    if (fitter.location) return `${fitter.location[0].toFixed(5)}, ${fitter.location[1].toFixed(5)}`;
    return undefined;
}

function isAssignedStatus(status: Fitter["status"]) {
    return status === "On the way" || status === "In progress" || status === "Fully Booked";
}

function toScheduleItem(job: FitterJob, date: string) {
    return {
        id: job.id,
        client: job.client,
        area: job.address,
        status: job.status === "Done" ? "Completed" : job.status,
        time: job.time,
        date,
        type: job.productType ?? "Job",
    };
}

export default function FittersPage() {
    const { fitters: liveFitters } = useLiveFitters();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newFitter, setNewFitter] = useState({
        name: "",
        role: "Fitter",
        phone: "",
        status: "Available"
    });
    const [selectedFitter, setSelectedFitter] = useState<ComponentProps<typeof FitterDetailsSheet>["fitter"]>(null);

    const fitters = useMemo(() => liveFitters.map((fitter) => {
        const completedJobs = [
            ...fitter.schedule.today,
            ...fitter.schedule.yesterday,
            ...fitter.schedule.tomorrow,
            ...fitter.schedule.upcoming,
        ].filter((job) => job.status === "Done");

        return {
            ...fitter,
            role: "Fitter",
            location: toLocationLabel(fitter),
            todayVisits: fitter.schedule.today.length,
            completedToday: fitter.schedule.today.filter((job) => job.status === "Done").length,
            upcomingVisits: [...fitter.schedule.tomorrow, ...fitter.schedule.upcoming],
            totalCompleted: completedJobs.length,
            rating: undefined,
            onTimeRate: undefined,
            reviews: undefined,
                        schedule: {
                history: [],
                today: fitter.schedule.today.map((job) => toScheduleItem(job, "Today")),
                upcoming: [
                    ...fitter.schedule.tomorrow.map((job) => toScheduleItem(job, "Tomorrow")),
                    ...fitter.schedule.upcoming.map((job) => toScheduleItem(job, "Upcoming")),
                ],
            },

        };
    }), [liveFitters]);

    const handleAddFitter = () => {
        toast.error("Please create fitter users in the backend so this page stays connected to real data only.");
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "In progress":
            case "On the way":
            case "Fully Booked":
                return "bg-amber-50 text-amber-700 border-amber-200";
            case "Available":
            case "Completed":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "Offline":
                return "bg-neutral-100 text-neutral-600 border-neutral-200";
            default:
                return "bg-neutral-50 text-neutral-600 border-neutral-200";
        }
    };

    return (
        <div className="space-y-12">
            <div className="flex items-end justify-between">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 font-semibold">
                        <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
                        <span>Resource Management</span>
                    </div>
                    <h1 className="text-6xl font-light tracking-tight text-neutral-900 dark:text-white">
                        Team
                        <span className="block font-semibold mt-1">Performance</span>
                    </h1>
                </div>
                <div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-14 px-8 bg-neutral-900 text-white hover:bg-amber-600 rounded-none uppercase tracking-widest text-xs font-medium transition-colors">
                                <UserPlus className="w-4 h-4 mr-2" />
                                Add Team Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-light">Add New Team Member</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right text-xs uppercase tracking-wider text-neutral-500">
                                        Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={newFitter.name}
                                        onChange={(e) => setNewFitter({ ...newFitter, name: e.target.value })}
                                        className="col-span-3 h-10 border-neutral-200"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="role" className="text-right text-xs uppercase tracking-wider text-neutral-500">
                                        Role
                                    </Label>
                                    <Select
                                        value={newFitter.role}
                                        onValueChange={(val) => setNewFitter({ ...newFitter, role: val })}
                                    >
                                        <SelectTrigger className="col-span-3 h-10 border-neutral-200">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Fitter">Fitter</SelectItem>
                                            <SelectItem value="Senior Fitter">Senior Fitter</SelectItem>
                                            <SelectItem value="Trainee">Trainee</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="phone" className="text-right text-xs uppercase tracking-wider text-neutral-500">
                                        Phone
                                    </Label>
                                    <Input
                                        id="phone"
                                        value={newFitter.phone}
                                        onChange={(e) => setNewFitter({ ...newFitter, phone: e.target.value })}
                                        className="col-span-3 h-10 border-neutral-200"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" onClick={handleAddFitter} className="bg-neutral-900 text-white hover:bg-amber-600 rounded-none uppercase tracking-wider text-xs font-medium">
                                    Add Member
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Availability Overview */}
            <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center gap-4 mb-2">
                    <h2 className="text-2xl font-light text-neutral-900 dark:text-white">Real-Time Availability</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-neutral-200 dark:from-neutral-800 to-transparent"></div>
                </div>

                <div className="space-y-px bg-neutral-200 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800">
                    {fitters.map((fitter) => (
                        <div
                            key={fitter.id}
                            className="bg-white dark:bg-neutral-900 p-8 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group cursor-pointer"
                            onClick={() => setSelectedFitter(fitter)}
                        >
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                                        <AvatarImage src={fitter.avatar} />
                                        <AvatarFallback className="bg-neutral-900 text-white text-lg">{fitter.name.split(' ')[1]?.[0] || fitter.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${fitter.status === 'Available' ? 'bg-emerald-500' : isAssignedStatus(fitter.status) ? 'bg-amber-500' : 'bg-neutral-400'}`}></span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-light text-neutral-900 dark:text-white">{fitter.name}</h3>
                                    <div className="flex flex-col gap-1 mt-1">
                                        <div className="flex items-center gap-3 text-sm text-neutral-500">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(fitter.status || "")}`}>
                                                {fitter.status}
                                            </span>
                                            {fitter.role && <span className="text-xs uppercase tracking-wider text-neutral-400">{fitter.role}</span>}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-neutral-400 mt-1">
                                            {fitter.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {fitter.location}
                                                </span>
                                            )}
                                            {fitter.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {fitter.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline Interaction */}
                            <div className="flex-1 px-4 md:px-12">
                                <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full relative overflow-hidden">
                                    {isAssignedStatus(fitter.status) && (
                                        <div className="absolute top-0 left-0 h-full w-2/3 bg-amber-200 dark:bg-amber-900/40 rounded-full">
                                            <div className="absolute top-0 right-0 h-full w-20 bg-amber-500 animate-pulse"></div>
                                        </div>
                                    )}
                                    {fitter.status === 'Available' && (
                                        <div className="absolute top-0 left-0 h-full w-full bg-emerald-100 dark:bg-emerald-900/20"></div>
                                    )}
                                </div>
                                <div className="flex justify-between text-[10px] text-neutral-400 mt-2 uppercase tracking-wider font-medium">
                                    <span>08:00</span>
                                    <span>12:00</span>
                                    <span>16:00</span>
                                    <span>20:00</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-10 border border-neutral-200 hover:bg-neutral-100"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFitter(fitter);
                                    }}
                                >
                                    View Schedule
                                </Button>
                                <Button variant="outline" size="sm" className="h-10 border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:border-neutral-300">
                                    <Phone className="w-4 h-4 mr-2" />
                                    Contact
                                </Button>
                                <Button size="icon" variant="ghost">
                                    <MoreHorizontal className="w-5 h-5 text-neutral-400" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detailed Performance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {fitters.map((fitter) => (
                    <Card key={fitter.id} className="border-0 rounded-none bg-neutral-900 text-white overflow-hidden group">
                        <CardContent className="p-8 relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Star className="w-32 h-32" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl font-light">
                                        {fitter.name.split(' ')[1]?.[0] || fitter.name[0]}
                                    </div>
                                    <div className="flex items-center gap-1 text-amber-400">
                                        <span className="text-2xl font-semibold">{fitter.rating ?? "—"}</span>
                                        <Star className="w-4 h-4 fill-amber-400" />
                                    </div>
                                </div>

                                <h3 className="text-2xl font-light mb-1">{fitter.name}</h3>
                                <p className="text-neutral-400 text-sm mb-8">{fitter.role}</p>

                                <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
                                    <div>
                                        <div className="text-3xl font-light mb-1">{fitter.totalCompleted}</div>
                                        <div className="text-xs uppercase tracking-wider text-neutral-500">Jobs Done</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-light mb-1 text-emerald-400">{fitter.onTimeRate ?? "—"}{typeof fitter.onTimeRate === "number" ? "%" : ""}</div>
                                        <div className="text-xs uppercase tracking-wider text-neutral-500">On Time</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <FitterDetailsSheet
                fitter={selectedFitter}
                isOpen={Boolean(selectedFitter)}
                onClose={() => setSelectedFitter(null)}
            />
        </div>
    );
}
