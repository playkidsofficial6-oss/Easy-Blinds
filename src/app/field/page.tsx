"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock, MapPin, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function FieldWorkPage() {
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
    <div className="space-y-12 max-w-7xl mx-auto">
      {/* Elegant Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 font-semibold">
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
          <span>Field Operations</span>
        </div>
        <h1 className="text-6xl font-light tracking-tight text-neutral-900 dark:text-white">
          Good Morning,
          <span className="block font-semibold mt-1">John</span>
        </h1>
        <p className="text-xl text-neutral-500 font-light">
          {todayJobs.filter(j => j.status !== 'Completed').length} visits scheduled for today
        </p>
      </div>

      {/* Minimalist Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200 dark:bg-neutral-800">
        <Card className="border-0 rounded-none bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer group">
          <CardContent className="p-10">
            <div className="text-sm uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 font-medium">Total</div>
            <div className="text-6xl font-light text-neutral-900 dark:text-white mb-2">{todayJobs.length}</div>
            <div className="text-xs text-neutral-400">Visits Today</div>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-none bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer group">
          <CardContent className="p-10">
            <div className="text-sm uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 font-medium">Done</div>
            <div className="text-6xl font-light text-emerald-800 dark:text-emerald-400 mb-2">
              {todayJobs.filter(j => j.status === 'Completed').length}
            </div>
            <div className="text-xs text-neutral-400">Completed</div>
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
      <Link href="/field/measurements/new">
        <Button
          size="lg"
          className="w-full h-24 text-lg bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 border-0 font-medium tracking-wide uppercase transition-all duration-300 hover:shadow-2xl"
        >
          <Plus className="w-6 h-6 mr-3" />
          Start New Measurement
        </Button>
      </Link>

      {/* Today's Schedule - Luxury List */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-light text-neutral-900 dark:text-white">Today's Schedule</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-neutral-200 dark:from-neutral-800 to-transparent"></div>
        </div>

        <div className="space-y-px bg-neutral-200 dark:bg-neutral-800">
          {todayJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white dark:bg-neutral-900 p-6 md:p-10 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
                {/* Elegant Time */}
                <div className="text-center min-w-[100px]">
                  <div className="text-4xl font-light text-neutral-900 dark:text-white mb-1">
                    {job.time.split(':')[0]}
                  </div>
                  <div className="text-xs uppercase tracking-widest text-neutral-400">
                    {job.time.split(' ')[1]}
                  </div>
                </div>

                <div className="hidden md:block w-px h-20 bg-neutral-200 dark:bg-neutral-800"></div>

                {/* Job Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <h3 className="text-2xl font-light text-neutral-900 dark:text-white">{job.client}</h3>
                    <span className={`px-4 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${getStatusStyle(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{job.area}</span>
                    <span className="text-neutral-300">•</span>
                    <span>{job.property}</span>
                  </div>
                  <p className="text-sm text-neutral-400">{job.address}</p>
                </div>

                <Link href={`/field/installations/${job.id}/complete`} onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" className="hidden md:flex text-neutral-600 border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900">
                    Complete
                  </Button>
                </Link>

                <ChevronRight className="w-6 h-6 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Work - Clean List */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-light text-neutral-900 dark:text-white">Recent Measurements</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-neutral-200 dark:from-neutral-800 to-transparent"></div>
          <Link href="/field/measurements">
            <Button variant="ghost" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium">
              View All →
            </Button>
          </Link>
        </div>

        <div className="space-y-px bg-neutral-200 dark:bg-neutral-800">
          {[
            { client: "Ahmed Al Mansoori", area: "Jumeirah Park", date: "Today", rooms: 5 },
            { client: "Villa 124", area: "Arabian Ranches", date: "Yesterday", rooms: 3 },
          ].map((item, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 p-8 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer group flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-none flex items-center justify-center">
                  <span className="text-2xl font-light">{item.rooms}</span>
                </div>
                <div>
                  <p className="text-lg font-light text-neutral-900 dark:text-white mb-1">{item.client}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.area}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm text-neutral-400 uppercase tracking-wider">{item.date}</span>
                <ChevronRight className="w-5 h-5 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
