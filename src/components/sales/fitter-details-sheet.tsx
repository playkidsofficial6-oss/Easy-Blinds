
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MapPin, Phone, Star, Calendar, Clock, CheckCircle2, Circle, ArrowRight } from "lucide-react";

interface ScheduleItem {
    id: string;
    client: string;
    area: string;
    status: string;
    time: string;
    date: string;
    type: string;
}

interface Fitter {
    id: string;
    name: string;
    role: string;
    avatar: string;
    status: string;
    location?: string;
    phone?: string;
    rating?: number;
    totalCompleted?: number;
    onTimeRate?: number;
    schedule?: {
        history: ScheduleItem[];
        today: ScheduleItem[];
        upcoming: ScheduleItem[];
    };
}

interface FitterDetailsSheetProps {
    fitter: Fitter | null;
    isOpen: boolean;
    onClose: () => void;
}

export function FitterDetailsSheet({ fitter, isOpen, onClose }: FitterDetailsSheetProps) {
    if (!fitter) return null;

    const renderTimelineItem = (item: ScheduleItem, isLast: boolean, section: 'history' | 'today' | 'upcoming') => {
        let statusColor = "bg-neutral-200 text-neutral-500";
        let icon = <Circle className="w-3 h-3" />;

        if (item.status === 'Completed') {
            statusColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
            icon = <CheckCircle2 className="w-3 h-3" />;
        } else if (item.status === 'In Progress') {
            statusColor = "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
            icon = <Clock className="w-3 h-3" />;
        } else if (section === 'upcoming') {
            statusColor = "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            icon = <Calendar className="w-3 h-3" />;
        }

        return (
            <div key={item.id} className="relative pl-6 pb-8 last:pb-0">
                {!isLast && (
                    <div className="absolute left-[11px] top-6 bottom-0 w-px bg-neutral-200 dark:bg-neutral-800" />
                )}
                <div className={cn("absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 bg-neutral-50 dark:bg-neutral-900")}>
                    {section === 'today' ? <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> : <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />}
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <div className="font-medium text-neutral-900 dark:text-white">{item.client}</div>
                            <div className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" /> {item.area}
                            </div>
                        </div>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border-0 uppercase tracking-wide font-semibold", statusColor)}>
                            {item.status}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 pt-3 mt-3">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {item.time}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {item.date}
                        </div>
                        <div className="ml-auto font-medium text-neutral-700 dark:text-neutral-300">
                            {item.type}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] p-0 border-l border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
                <ScrollArea className="h-full">
                    {/* Header Portion */}
                    <div className="bg-white dark:bg-neutral-900 p-8 border-b border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-start gap-6">
                            <Avatar className="h-20 w-20 border-2 border-white shadow-sm">
                                <AvatarImage src={fitter.avatar} />
                                <AvatarFallback className="text-xl bg-neutral-100 dark:bg-neutral-800">{fitter.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <h2 className="text-2xl font-light text-neutral-900 dark:text-white">{fitter.name}</h2>
                                <div className="flex items-center gap-2 text-sm text-neutral-500">
                                    <span className="font-medium text-neutral-900 dark:text-neutral-200">{fitter.role}</span>
                                    <span>•</span>
                                    <span className={cn(
                                        "capitalize px-2 py-0.5 rounded text-xs font-medium border",
                                        fitter.status === "Available" ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30" :
                                            fitter.status === "Busy" ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30" :
                                                "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
                                    )}>
                                        {fitter.status}
                                    </span>
                                </div>
                                {fitter.phone && (
                                    <div className="flex items-center gap-2 text-sm text-neutral-400 mt-2">
                                        <Phone className="w-3 h-3" />
                                        {fitter.phone}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-8">
                            <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                <div className="text-xl font-light text-neutral-900 dark:text-white">{fitter.rating}</div>
                                <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium flex items-center justify-center gap-1">
                                    Rating <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                </div>
                            </div>
                            <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                <div className="text-xl font-light text-neutral-900 dark:text-white">{fitter.totalCompleted}</div>
                                <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Jobs Done</div>
                            </div>
                            <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                <div className="text-xl font-light text-emerald-600 dark:text-emerald-400">{fitter.onTimeRate}%</div>
                                <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">On Time</div>
                            </div>
                        </div>
                    </div>

                    {/* Content Tabs */}
                    <div className="p-8">
                        <Tabs defaultValue="schedule" className="w-full">
                            <TabsList className="w-full grid grid-cols-2 mb-8 bg-neutral-100 dark:bg-neutral-800 p-1 h-auto rounded-lg">
                                <TabsTrigger value="schedule" className="rounded-md py-2 text-sm font-medium transition-all">Schedule</TabsTrigger>
                                <TabsTrigger value="performance" className="rounded-md py-2 text-sm font-medium transition-all">Full Performance</TabsTrigger>
                            </TabsList>

                            <TabsContent value="schedule" className="space-y-8 mt-0">

                                {/* TODAY */}
                                <div>
                                    <h3 className="text-sm font-medium text-neutral-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                        Today
                                    </h3>
                                    <div className="ml-1 pl-2 border-l-2 border-neutral-100 dark:border-neutral-800 space-y-0">
                                        {fitter.schedule?.today && fitter.schedule.today.length > 0 ? (
                                            fitter.schedule.today.map((item, i) => renderTimelineItem(item, i === fitter.schedule!.today.length - 1, 'today'))
                                        ) : (
                                            <div className="text-sm text-neutral-400 italic pl-6">No jobs scheduled for today</div>
                                        )}
                                    </div>
                                </div>

                                {/* UPCOMING */}
                                <div>
                                    <h3 className="text-sm font-medium text-neutral-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                        Upcoming
                                    </h3>
                                    <div className="ml-1 pl-2 border-l-2 border-neutral-100 dark:border-neutral-800 space-y-0">
                                        {fitter.schedule?.upcoming && fitter.schedule.upcoming.length > 0 ? (
                                            fitter.schedule.upcoming.map((item, i) => renderTimelineItem(item, i === fitter.schedule!.upcoming.length - 1, 'upcoming'))
                                        ) : (
                                            <div className="text-sm text-neutral-400 italic pl-6">No upcoming jobs</div>
                                        )}
                                    </div>
                                </div>

                                {/* HISTORY */}
                                <div>
                                    <h3 className="text-sm font-medium text-neutral-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
                                        History (Recent)
                                    </h3>
                                    <div className="ml-1 pl-2 border-l-2 border-neutral-100 dark:border-neutral-800 space-y-0">
                                        {fitter.schedule?.history && fitter.schedule.history.length > 0 ? (
                                            fitter.schedule.history.map((item, i) => renderTimelineItem(item, i === fitter.schedule!.history.length - 1, 'history'))
                                        ) : (
                                            <div className="text-sm text-neutral-400 italic pl-6">No history available</div>
                                        )}
                                    </div>
                                </div>

                            </TabsContent>

                            <TabsContent value="performance">
                                <div className="text-center py-12 text-neutral-400">
                                    Performance charts placeholder
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
