"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock, MapPin, ChevronRight, Ruler } from "lucide-react";
import Link from "next/link";

export default function SalesmanPage() {
  const todayJobs = [
    {
      id: "J001",
      time: "10:00 AM",
      client: "Ahmed Al Mansoori",
      area: "Jumeirah Park",
      property: "Villa",
      status: "Completed" as const,
      address: "Villa 42, Jumeirah Park",
    },
    {
      id: "J002",
      time: "12:30 PM",
      client: "Sarah Smith",
      area: "Dubai Marina",
      property: "Apartment",
      status: "In Progress" as const,
      address: "Marina Heights Tower, Apt 1204",
    },
    {
      id: "J003",
      time: "03:00 PM",
      client: "Emaar Properties",
      area: "Downtown Dubai",
      property: "Office",
      status: "Scheduled" as const,
      address: "Business Bay Executive Tower",
    },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
      case 'In Progress':
        return 'bg-amber-50 text-amber-800 border border-amber-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border border-neutral-300';
    }
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto p-8">
      {/* Elegant Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 font-semibold">
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
          <span>Salesman Portal</span>
        </div>
        <h1 className="text-6xl font-light tracking-tight text-neutral-900 dark:text-white">
          Good Morning,
          <span className="block font-semibold mt-1">John</span>
        </h1>
        <p className="text-xl text-neutral-500 font-light">
          {todayJobs.filter(j => j.status !== 'Completed').length} appointments scheduled for today
        </p>
      </div>

      {/* Minimalist Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200 dark:bg-neutral-800">
        <Card className="border-0 rounded-none bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer group">
          <CardContent className="p-10">
            <div className="text-sm uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 font-medium">Total</div>
            <div className="text-6xl font-light text-neutral-900 dark:text-white mb-2">{todayJobs.length}</div>
            <div className="text-xs text-neutral-400">Appointments Today</div>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-none bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer group">
          <CardContent className="p-10">
            <div className="text-sm uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 font-medium">Done</div>
            <div className="text-6xl font-light text-emerald-800 dark:text-emerald-400 mb-2">
              {todayJobs.filter(j => j.status === 'Completed').length}
            </div>
            <div className="text-xs text-neutral-400">Measurements Completed</div>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-none bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer group">
          <CardContent className="p-10">
            <div className="text-sm uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 font-medium">Pending</div>
            <div className="text-6xl font-light text-neutral-900 dark:text-white mb-2">
              {todayJobs.filter(j => j.status === 'Scheduled').length}
            </div>
            <div className="text-xs text-neutral-400">Remaining</div>
          </CardContent>
        </Card>
      </div>

      {/* Premium CTA */}
      <Link href="/salesman/measurements/new">
        <Button
          size="lg"
          className="w-full h-24 text-lg bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 border-0 font-medium tracking-wide uppercase transition-all duration-300 hover:shadow-2xl"
        >
          <Ruler className="w-6 h-6 mr-3" />
          Start New Measurement
        </Button>
      </Link>
    </div>
  );
}
