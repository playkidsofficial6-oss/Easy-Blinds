"use client";

import { useState, useRef, useEffect } from "react";
import { format, parse, isPast, isToday } from "date-fns";
import {
    MapPin, Navigation, ChevronRight, CheckCircle, Clock, Calendar,
    ArrowLeft, Camera, ShieldCheck, Ruler, ClipboardList, Info,
    AlertCircle, X, Check, Menu, Timer, Wallet, AlertTriangle,
    Phone, MessageSquare, ExternalLink, Zap, MousePointer2
} from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const JobDetailMap = dynamic(() => import("@/components/fitter/JobDetailMap"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-light italic">Initializing Map...</div>
});

type Tab = "today" | "tomorrow" | "upcoming" | "completed";

// Mock Data
const MOCK_SALESMAN_SCHEDULE = {
    today: [
        { id: "M001", time: "10:00 AM", client: "Ahmed Al Mansoori", address: "Villa 42, Jumeirah Park", status: "Pending", fabric: "Velvet & Sheer", notes: "Gate code #1234", coordinates: [25.07, 55.14] },
        { id: "M002", time: "12:30 PM", client: "Sarah Smith", address: "Marina Heights, Apt 1204", status: "Pending", fabric: "Linen Blinds", notes: "Check for high ceiling", coordinates: [25.08, 55.15] },
        { id: "M003", time: "03:00 PM", client: "Emaar Properties", address: "Business Bay Tower", status: "Pending", fabric: "Motorized Rollers", notes: "Office measurement", coordinates: [25.18, 55.27] },
    ],
    tomorrow: [
        { id: "M004", time: "09:00 AM", client: "Villa 101", address: "Palm Jumeirah", status: "Pending", fabric: "Outdoor Blinds", notes: "Pool area", coordinates: [25.11, 55.13] },
        { id: "M005", time: "11:30 AM", client: "Luxury Hotel", address: "Downtown Dubai", status: "Pending", fabric: "Blackout Curtains", notes: "50 rooms", coordinates: [25.20, 55.27] },
    ],
    upcoming: [
        { id: "M006", time: "10:00 AM", client: "Future Project", address: "Dubai Creek", status: "Pending", fabric: "TBD", notes: "Initial consult", coordinates: [25.23, 55.33] }
    ],
    completed: [
        { id: "M000", time: "04:00 PM", client: "Old Client", address: "Springs 12", status: "Done", fabric: "Completed", notes: "Done yesterday", coordinates: [25.06, 55.18] }
    ]
} as const;


export default function FieldPage() {
    const [activeTab, setActiveTab] = useState<Tab>("today");
    const [selectedJob, setSelectedJob] = useState<any | null>(null);
    const [schedule, setSchedule] = useState(MOCK_SALESMAN_SCHEDULE);

    const getJobsForTab = (tab: Tab) => {
        switch (tab) {
            case "today": return schedule.today;
            case "tomorrow": return schedule.tomorrow;
            case "upcoming": return schedule.upcoming;
            case "completed": return schedule.completed;
            default: return [];
        }
    };

    const jobs = getJobsForTab(activeTab);

    const handleUpdateStatus = (id: string, newStatus: string) => {
        setSchedule(prev => {
            const updated = { ...prev };
            if (activeTab === 'today') {
                updated.today = (updated.today as any).map((j: any) => j.id === id ? { ...j, status: newStatus === "Completed" ? "Done" : newStatus === "In progress" ? "In Progress" : newStatus } : j);
            }
            return updated;
        });

        if (selectedJob && selectedJob.id === id) {
            setSelectedJob((prev: any) => ({ ...prev, status: newStatus === "Completed" ? "Done" : newStatus === "In progress" ? "In Progress" : newStatus }));
        }
    };


    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col h-screen overflow-hidden select-none">

            {/* Premium Header */}
            <header className="bg-[#0F172A] border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-xl flex-shrink-0 z-50 h-[80px]">
                <div className="flex items-center gap-5">
                    <div className="h-11 w-11 bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-black text-2xl rounded-xl shadow-lg shadow-amber-600/20">EB</div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight leading-none">Field Portal</h1>
                        <div className="flex items-center gap-2 mt-1.5 ">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.25em]">Session Active • Dubai</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <Link href="/field/quotes/new">
                        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] uppercase tracking-widest h-11 px-8 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95">
                            <Zap className="w-3.5 h-3.5 mr-2 fill-slate-950" /> New Quote
                        </Button>
                    </Link>
                    <div className="text-right hidden sm:block border-l border-slate-700 pl-6 h-10 flex flex-col justify-center">
                        <div className="text-sm font-black text-white leading-none">John Salesman</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{format(new Date(), "EEEE, d MMM")}</div>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">

                {/* Sidebar Filtered List */}
                <aside className={cn(
                    "w-full md:w-80 bg-[#F8FAFC] border-r border-slate-200 flex flex-col z-40 transition-transform duration-500 absolute md:relative h-full",
                    selectedJob ? "-translate-x-full md:translate-x-0" : "translate-x-0"
                )}>
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 bg-white p-2 gap-1">
                        {(["today", "tomorrow", "upcoming", "completed"] as Tab[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "flex-1 py-3 text-[9px] font-black uppercase tracking-wider text-center transition-all rounded-lg",
                                    activeTab === tab ? "text-amber-700 bg-amber-50 shadow-sm" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Job List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        {jobs.length === 0 ? (
                            <div className="text-center py-20 text-slate-400 px-6">
                                <Calendar className="w-10 h-10 mx-auto mb-4 opacity-10" />
                                <p className="font-bold text-[10px] uppercase tracking-widest">No entries found</p>
                            </div>
                        ) : (
                            jobs.map(job => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    isSelected={selectedJob?.id === job.id}
                                    onSelect={() => setSelectedJob(job)}
                                />
                            ))
                        )}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className={cn(
                    "flex-1 bg-white relative overflow-hidden flex flex-col transition-all duration-500 w-full md:w-auto absolute md:relative h-full",
                    selectedJob ? "opacity-100 z-50 pointer-events-auto" : "opacity-100 z-10 md:z-0"
                )}>
                    {selectedJob ? (
                        <div className="h-full overflow-y-auto flex flex-col animate-fadeIn">
                            <JobDetailView
                                job={selectedJob}
                                onStatusChange={(newStatus) => handleUpdateStatus(selectedJob.id, newStatus)}
                                onBack={() => setSelectedJob(null)}
                            />
                        </div>
                    ) : (
                        <WorkspaceOverview onSelectFirst={() => schedule.today.length > 0 && setSelectedJob(schedule.today[0])} />
                    )}
                </main>
            </div>

        </div>
    );
}

function WorkspaceOverview({ onSelectFirst }: { onSelectFirst: () => void }) {
    return (
        <div className="h-full relative flex flex-col">
            <div className="absolute inset-0 z-0 opacity-10">
                <JobDetailMap coordinates={[25.07, 55.14]} />
            </div>
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-b from-transparent via-white/80 to-white">
                <div className="w-24 h-24 bg-white border border-slate-200 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl animate-bounce-slow">
                    <MousePointer2 className="w-10 h-10 text-amber-500 rotate-12" />
                </div>
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Select Workspace</h2>
                <p className="text-slate-500 max-w-sm mt-0 text-lg font-medium leading-snug">Pick an assignment from the sidebar to view blueprints and start your session.</p>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                    {[
                        { val: "3", label: "Today's Work", color: "amber" },
                        { val: "2", label: "Upcoming", color: "blue" },
                        { val: "94%", label: "Eficiency", color: "emerald" }
                    ].map((stat, i) => (
                        <div key={i} className="p-8 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 group hover:scale-105 transition-transform cursor-default">
                            <div className="text-5xl font-black text-slate-900 tracking-tighter mb-2">{stat.val}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</div>
                            <div className={cn("h-1 w-8 rounded-full mt-4 mx-auto opacity-40", `bg-${stat.color}-500`)}></div>
                        </div>
                    ))}
                </div>

                <Button
                    onClick={onSelectFirst}
                    variant="ghost"
                    className="mt-16 text-slate-400 hover:text-amber-600 font-bold uppercase tracking-[0.2em] text-[10px] group"
                >
                    Quick Start First Job <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
        </div>
    );
}

function JobCard({ job, onSelect, isSelected }: { job: any; onSelect: () => void; isSelected: boolean }) {
    const isLate = calculateIsLate(job.time, job.status);

    return (
        <div
            onClick={onSelect}
            className={cn(
                "p-5 cursor-pointer transition-all border rounded-2xl relative group",
                isSelected
                    ? "bg-white border-amber-500 shadow-xl shadow-amber-500/10 scale-[1.02]"
                    : "bg-white/50 border-transparent hover:border-slate-300 hover:shadow-md"
            )}
        >
            <div className="flex justify-between items-start mb-3">
                <span className={cn(
                    "px-2.5 py-1 text-[8px] font-black tracking-widest rounded-lg uppercase border shadow-sm",
                    job.status === "Done" || job.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        job.status === "In Progress" || job.status === "In progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            job.status === "On the way" ? "bg-amber-100 text-amber-800 border-amber-300" :
                                isLate ? "bg-rose-50 text-rose-700 border-rose-200" :
                                    "bg-slate-100 text-slate-600 border-slate-200"
                )}>
                    {isLate && job.status === "Pending" ? "DELAYED" : job.status}
                </span>

                <div className={cn(
                    "font-black text-[10px] flex items-center gap-1.5 uppercase tracking-wider",
                    isLate ? "text-rose-600" : "text-slate-400"
                )}>
                    <Clock className="w-3.5 h-3.5" />
                    {job.time}
                </div>
            </div>

            <h3 className={cn("text-lg font-black transition-colors leading-tight", isSelected ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900")}>
                {job.client}
            </h3>

            <div className="flex items-start gap-1.5 text-slate-500 text-[10px] mt-2 font-bold opacity-70">
                <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" />
                <span className="line-clamp-1">{job.address}</span>
            </div>
        </div>
    );
}

function JobDetailView({ job, onStatusChange, onBack }: { job: any; onStatusChange: (status: string) => void; onBack: () => void }) {
    const isLate = calculateIsLate(job.time, job.status);
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (job.status === "In Progress" || job.status === "In progress") {
            interval = setInterval(() => {
                setSeconds(s => s + 1);
            }, 1000);
        } else {
            setSeconds(0);
        }
        return () => clearInterval(interval);
    }, [job.status]);

    const formatTimer = (s: number) => {
        const h = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;
        return `${h > 0 ? h + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* Visual Context Header */}
            <div className="h-48 bg-slate-950 relative flex-shrink-0 border-b border-white/10 group shadow-2xl overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-60 transition-opacity">
                    <JobDetailMap coordinates={job.coordinates || [25.20, 55.27]} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent z-10"></div>

                <button
                    onClick={onBack}
                    className="absolute top-6 left-6 z-[60] bg-white/10 backdrop-blur-xl text-white p-3.5 rounded-2xl border border-white/20 hover:bg-white/20 active:scale-95 transition-all shadow-2xl"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="absolute right-6 bottom-6 z-20 flex gap-2">
                    <Button className="bg-white/10 backdrop-blur-lg border border-white/20 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest px-6 h-10 hover:bg-white/20">
                        <Phone className="w-3.5 h-3.5 mr-2" /> Direct Call
                    </Button>
                    <Button className="bg-emerald-500/20 backdrop-blur-lg border border-emerald-500/30 text-emerald-400 rounded-xl font-bold text-[10px] uppercase tracking-widest px-6 h-10 hover:bg-emerald-500/30">
                        <MessageSquare className="w-3.5 h-3.5 mr-2" /> Signal WhatsApp
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full pb-48 custom-scrollbar">

                {/* Executive Dossier Header */}
                <div className="px-10 py-10 bg-[#0F172A] text-white flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shadow-2xl">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-4 py-1.5 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-[0.3em] rounded-lg shadow-lg shadow-amber-500/20">Task {job.id}</span>
                            <div className="h-1 w-8 bg-slate-700 rounded-full"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Scheduled for {job.time}</span>
                        </div>
                        <h2 className="text-6xl font-black tracking-tighter text-white">{job.client}</h2>
                        <div className="flex items-center gap-3 text-slate-400 text-lg font-medium tracking-tight">
                            <MapPin className="w-5 h-5 text-amber-500" />
                            {job.address}
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-10">
                    {/* High-Contrast Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: "Assignment", val: job.id, icon: Wallet, color: "slate" },
                            { label: "Active Counter", val: job.status === "In Progress" || job.status === "In progress" ? formatTimer(seconds) : "Paused", icon: Timer, color: "blue", mono: true },
                            { label: "Expected Finish", val: "1h 15m", icon: Clock, color: "amber" },
                            { label: "Current Node", val: job.status, icon: Info, color: "emerald" }
                        ].map((node, i) => (
                            <div key={i} className="bg-[#F8FAFC] p-8 rounded-[2.5rem] border border-slate-100 group transition-all">
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                    <node.icon className={cn("w-3.5 h-3.5", `text-${node.color}-500`)} /> {node.label}
                                </div>
                                <div className={cn("text-3xl font-black text-slate-900 tracking-tighter", node.mono && "font-mono text-blue-600")}>{node.val}</div>
                            </div>
                        ))}
                    </div>

                    {/* Integrated Specifications Card */}
                    <div className="bg-white border-[3px] border-[#F1F5F9] rounded-[3.5rem] p-12 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform group-hover:rotate-45">
                            <Ruler className="w-32 h-32" />
                        </div>
                        <div className="flex items-center gap-4 mb-10">
                            <div className="h-14 w-14 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-2xl">
                                <ShieldCheck className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tight">Measurement Dossier</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Confirmed Product Specifications</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-5 gap-12 relative z-10">
                            <div className="md:col-span-2">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Product Selection</h4>
                                <p className="text-4xl font-black text-slate-900 leading-tight">{job.fabric}</p>
                                <div className="flex items-center gap-2 mt-6">
                                    <div className="h-4 w-4 rounded-full bg-slate-900 border-2 border-white shadow-sm"></div>
                                    <span className="text-xs font-bold text-slate-500">Premium Finish Requested</span>
                                </div>
                            </div>
                            <div className="md:col-span-3">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Surveyor Instructions</h4>
                                <div className="bg-[#F8FAFC] p-8 rounded-[2rem] border-l-[6px] border-amber-500">
                                    <p className="text-xl text-slate-700 font-bold leading-relaxed italic">
                                        "{job.notes}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-500/5 p-10 rounded-[2.5rem] border-2 border-amber-500/10 flex flex-col md:flex-row items-center gap-8 justify-between">
                        <div className="flex items-center gap-6">
                            <div className="h-14 w-14 bg-amber-500 rounded-full flex items-center justify-center text-amber-950 font-bold">!</div>
                            <div>
                                <h5 className="text-xl font-bold text-amber-900">Validation Protocol</h5>
                                <p className="text-sm font-medium text-amber-700">All laser measurements must be uploaded before completing the task.</p>
                            </div>
                        </div>
                        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black h-12 px-10 rounded-xl shadow-xl">Audit Details</Button>
                    </div>
                </div>
            </div>

            {/* Premium Floating Actions */}
            {job.status !== "Done" && job.status !== "Completed" && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-6xl">
                    <div className="bg-[#0F172A]/90 backdrop-blur-3xl p-4 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/10 flex items-center gap-4">
                        <ActionButton
                            icon={Navigation} label="Travel" activeLabel="En Route"
                            isActive={job.status === "On the way"}
                            disabled={job.status !== "Pending"}
                            variant="amber"
                            onClick={() => onStatusChange("On the way")}
                        />
                        <ActionButton
                            icon={Timer} label="Work" activeLabel="Measuring"
                            isActive={job.status === "In Progress" || job.status === "In progress"}
                            disabled={job.status !== "On the way" && job.status !== "In Progress" && job.status !== "Pending"}
                            variant="blue"
                            onClick={() => onStatusChange("In progress")}
                        />
                        <Link href="/field/quotes/new" className="flex-[1.5]">
                            <button className={cn(
                                "w-full h-20 rounded-[1.5rem] flex flex-col items-center justify-center gap-1 transition-all group overflow-hidden relative",
                                (job.status === "In Progress" || job.status === "In progress")
                                    ? "bg-purple-600 hover:bg-purple-500 text-white shadow-2xl shadow-purple-600/30"
                                    : "bg-slate-800 text-slate-500 opacity-40 cursor-not-allowed"
                            )}>
                                {(job.status === "In Progress" || job.status === "In progress") && (
                                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer scale-x-150"></div>
                                )}
                                <ClipboardList className="w-6 h-6 group-hover:scale-110 transition-transform mb-1" />
                                <span className="text-[10px] font-black uppercase tracking-[0.25em]">Generate Quote</span>
                            </button>
                        </Link>
                        <ActionButton
                            icon={CheckCircle} label="Finalize" activeLabel="Complete"
                            isActive={false}
                            disabled={job.status !== "In Progress" && job.status !== "In progress"}
                            variant="emerald"
                            onClick={() => onStatusChange("Completed")}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function ActionButton({ icon: Icon, label, activeLabel, isActive, disabled, variant, onClick }: any) {
    const variants: any = {
        amber: isActive ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-amber-500 shadow-inner",
        blue: isActive ? "bg-blue-600 text-white" : "bg-slate-800 text-blue-500 shadow-inner",
        emerald: isActive ? "bg-emerald-600 text-white" : "bg-slate-800 text-emerald-500 shadow-inner"
    };

    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "flex-1 h-20 rounded-[1.5rem] flex flex-col items-center justify-center gap-1 transition-all duration-500 border border-white/5",
                variants[variant],
                disabled ? "opacity-20 grayscale cursor-not-allowed scale-95" : "hover:scale-105 active:scale-95 cursor-pointer shadow-2xl",
                isActive && "ring-4 ring-white/10"
            )}
        >
            {isActive && variant === "blue" ? (
                <div className="text-xl font-black tabular-nums tracking-tighter mb-1">...</div>
            ) : (
                <Icon className={cn("w-6 h-6 transition-transform", isActive ? "scale-110" : "group-hover:scale-110 mb-1")} />
            )}
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isActive ? activeLabel : label}</span>
        </button>
    );
}

function calculateIsLate(jobTime: string, status: string) {
    if (status === "Done" || status === "In Progress" || status === "Completed" || status === "In progress") return false;
    try {
        const todayStr = format(new Date(), "yyyy-MM-dd");
        const jobDate = parse(`${todayStr} ${jobTime}`, "yyyy-MM-dd hh:mm aa", new Date());
        const fifteenMinsAfter = new Date(jobDate.getTime() + 15 * 60000);
        return isPast(fifteenMinsAfter);
    } catch (e) {
        return false;
    }
}
