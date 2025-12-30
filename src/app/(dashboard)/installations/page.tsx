import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Calendar, User, MapPin, DollarSign } from "lucide-react";

export default function InstallationsPage() {
    const jobs = [
        {
            id: "J001",
            client: "Ahmed Al Mansoori",
            area: "Jumeirah Park",
            property: "Villa",
            status: "Installation In Progress" as const,
            team: "Team Alpha",
            scheduled: "2024-01-20",
            value: 12500,
            priority: "High" as const,
        },
        {
            id: "J002",
            client: "Sarah Smith",
            area: "Dubai Marina",
            property: "Apartment",
            status: "Ready for Installation" as const,
            team: "Team Beta",
            scheduled: "2024-01-22",
            value: 8300,
            priority: "Medium" as const,
        },
        {
            id: "J003",
            client: "Villa 124",
            area: "Arabian Ranches",
            property: "Villa",
            status: "Quote Approved" as const,
            team: null,
            scheduled: null,
            value: 15200,
            priority: "Low" as const,
        },
        {
            id: "J004",
            client: "Business Center",
            area: "DIFC",
            property: "Office",
            status: "Installed" as const,
            team: "Team Alpha",
            scheduled: "2024-01-18",
            value: 22000,
            priority: "High" as const,
        },
    ];

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            "Measurement Scheduled": "bg-blue-100 text-blue-700",
            "Measurement Completed": "bg-green-100 text-green-700",
            "Quote Approved": "bg-purple-100 text-purple-700",
            "Ready for Installation": "bg-orange-100 text-orange-700",
            "Installation In Progress": "bg-yellow-100 text-yellow-700",
            "Installed": "bg-green-100 text-green-700",
            "Closed": "bg-stone-100 text-stone-700",
        };
        return colors[status] || "bg-stone-100 text-stone-700";
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High':
                return 'bg-red-100 text-red-700';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-700';
            default:
                return 'bg-stone-100 text-stone-700';
        }
    };

    const groupedJobs = {
        "Quote Approved": jobs.filter(j => j.status === "Quote Approved"),
        "Ready for Installation": jobs.filter(j => j.status === "Ready for Installation"),
        "Installation In Progress": jobs.filter(j => j.status === "Installation In Progress"),
        "Installed": jobs.filter(j => j.status === "Installed"),
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-stone-900">Installations</h1>
                    <p className="text-stone-500">Track and manage installation jobs</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Active Jobs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {jobs.filter(j => j.status === "Installation In Progress" || j.status === "Ready for Installation").length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {jobs.filter(j => j.status === "Installed").length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">This Week</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">5</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Total Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            AED {jobs.reduce((sum, j) => sum + j.value, 0).toLocaleString()}
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
                                placeholder="Search jobs..."
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="Ready for Installation">
                        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
                            {Object.entries(groupedJobs).map(([status, jobs]) => (
                                <TabsTrigger key={status} value={status}>
                                    {status} ({jobs.length})
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {Object.entries(groupedJobs).map(([status, jobs]) => (
                            <TabsContent key={status} value={status} className="space-y-4 mt-4">
                                {jobs.length === 0 ? (
                                    <div className="text-center py-12 text-stone-500">
                                        No jobs in this category
                                    </div>
                                ) : (
                                    jobs.map((job) => (
                                        <div
                                            key={job.id}
                                            className="border border-stone-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-semibold text-stone-900">{job.client}</h3>
                                                        <Badge className={getPriorityColor(job.priority)}>
                                                            {job.priority}
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-stone-600">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-4 h-4 text-stone-400" />
                                                            <span>{job.area} • {job.property}</span>
                                                        </div>
                                                        {job.team && (
                                                            <div className="flex items-center gap-2">
                                                                <User className="w-4 h-4 text-stone-400" />
                                                                <span>{job.team}</span>
                                                            </div>
                                                        )}
                                                        {job.scheduled && (
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-stone-400" />
                                                                <span>{new Date(job.scheduled).toLocaleDateString('en-AE')}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <DollarSign className="w-4 h-4 text-stone-400" />
                                                            <span className="font-semibold">AED {job.value.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm">View Details</Button>
                                                    {job.status === "Quote Approved" && (
                                                        <Button size="sm" className="bg-stone-900 hover:bg-stone-800">
                                                            Schedule
                                                        </Button>
                                                    )}
                                                    {job.status === "Installation In Progress" && (
                                                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                                            Mark Complete
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
