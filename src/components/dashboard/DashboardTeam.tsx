import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, CheckCircle, Clock, Phone } from "lucide-react";

export default function TeamPage() {
    const team = [
        {
            id: "T001",
            name: "John Doe",
            role: "Senior Measurer",
            avatar: "/placeholder.jpg",
            todayVisits: 3,
            completedToday: 2,
            upcomingVisits: [
                { time: "03:00 PM", client: "Emaar Properties", area: "Downtown Dubai" },
            ],
            totalCompleted: 124,
            phone: "+971 50 123 4567",
        },
        {
            id: "T002",
            name: "Mike Johnson",
            role: "Installation Lead",
            avatar: "/placeholder.jpg",
            todayVisits: 2,
            completedToday: 1,
            upcomingVisits: [
                { time: "02:00 PM", client: "Villa 124", area: "Arabian Ranches" },
            ],
            totalCompleted: 98,
            phone: "+971 50 234 5678",
        },
        {
            id: "T003",
            name: "Sarah Williams",
            role: "Measurer",
            avatar: "/placeholder.jpg",
            todayVisits: 4,
            completedToday: 3,
            upcomingVisits: [
                { time: "04:30 PM", client: "Marina Residence", area: "Dubai Marina" },
            ],
            totalCompleted: 87,
            phone: "+971 50 345 6789",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-stone-900">Team</h1>
                <p className="text-stone-500">Monitor team activity and performance</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Active Staff</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{team.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Today's Visits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {team.reduce((sum, member) => sum + member.todayVisits, 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-500">Completed Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {team.reduce((sum, member) => sum + member.completedToday, 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {team.map((member) => (
                    <Card key={member.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <Avatar className="w-16 h-16">
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback className="text-lg">
                                            {member.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-lg text-stone-900">{member.name}</h3>
                                        <p className="text-sm text-stone-500">{member.role}</p>
                                        <div className="flex items-center gap-1 text-sm text-stone-600 mt-1">
                                            <Phone className="w-3 h-3" />
                                            <span>{member.phone}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 p-4 bg-stone-50 rounded-lg">
                                <div>
                                    <p className="text-xs text-stone-500">Today</p>
                                    <p className="text-lg font-bold text-stone-900">{member.todayVisits}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-500">Completed</p>
                                    <p className="text-lg font-bold text-green-600">{member.completedToday}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-500">Total</p>
                                    <p className="text-lg font-bold text-stone-900">{member.totalCompleted}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-stone-900 mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Upcoming Visits
                                </h4>
                                {member.upcomingVisits.length > 0 ? (
                                    <div className="space-y-2">
                                        {member.upcomingVisits.map((visit, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 bg-white border border-stone-200 rounded-lg">
                                                <Calendar className="w-4 h-4 text-stone-400 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="font-medium text-stone-900">{visit.client}</p>
                                                    <div className="flex items-center gap-2 text-sm text-stone-500 mt-1">
                                                        <span>{visit.time}</span>
                                                        <span>•</span>
                                                        <span>{visit.area}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-stone-500">No upcoming visits</p>
                                )}
                            </div>

                            <Button variant="outline" className="w-full">
                                View Full Schedule
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
