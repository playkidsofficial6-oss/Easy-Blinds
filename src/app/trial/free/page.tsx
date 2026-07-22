"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserRole } from "@/lib/auth";

type TrialRole = UserRole.Owner | UserRole.SalesManager | UserRole.Salesman | UserRole.Fitter | UserRole.Stitching;

interface TrialMetric {
  label: string;
  value: string;
  helper: string;
}

interface TrialTask {
  title: string;
  detail: string;
  status: string;
}

interface TrialProfile {
  role: TrialRole;
  label: string;
  portalName: string;
  mockUser: string;
  mockEmail: string;
  headline: string;
  description: string;
  accent: string;
  icon: typeof ShieldCheck;
  metrics: TrialMetric[];
  tasks: TrialTask[];
}

const trialProfiles: TrialProfile[] = [
  {
    role: UserRole.Owner,
    label: "Owner",
    portalName: "Executive Control Room",
    mockUser: "Aisha Rahman",
    mockEmail: "owner.trial@easyblinds.demo",
    headline: "Review every brand, team, and revenue movement from one mock workspace.",
    description:
      "This trial view uses local sample figures only, so it never reads from MongoDB or your production backend.",
    accent: "from-slate-950 to-slate-700",
    icon: ShieldCheck,
    metrics: [
      { label: "Monthly Revenue", value: "AED 184K", helper: "+18% mock growth" },
      { label: "Active Jobs", value: "72", helper: "Across all teams" },
      { label: "Team Utilisation", value: "86%", helper: "Demo capacity" },
    ],
    tasks: [
      { title: "Approve premium quote", detail: "Palm Jumeirah villa package", status: "Awaiting review" },
      { title: "Compare branch output", detail: "Dubai vs Sharjah mock sales", status: "Ready" },
      { title: "Inspect overdue installs", detail: "Three sample escalations", status: "High priority" },
    ],
  },
  {
    role: UserRole.SalesManager,
    label: "Sales Manager",
    portalName: "Smart Dispatch Trial",
    mockUser: "Omar Siddiqui",
    mockEmail: "manager.trial@easyblinds.demo",
    headline: "Assign jobs, monitor fitters, and test scheduling with safe dummy records.",
    description:
      "The trial dispatch board is intentionally disconnected from backend jobs, users, and fitter locations.",
    accent: "from-amber-700 to-orange-500",
    icon: Users,
    metrics: [
      { label: "Unassigned Jobs", value: "9", helper: "Demo queue" },
      { label: "Available Fitters", value: "5", helper: "Mock team" },
      { label: "Today Capacity", value: "68%", helper: "Sample load" },
    ],
    tasks: [
      { title: "Assign measurement visit", detail: "Jumeirah Park, 10:00 AM", status: "Suggested" },
      { title: "Reschedule fitting", detail: "Downtown apartment, 2:00 PM", status: "Open" },
      { title: "Check route coverage", detail: "Marina and JLT mock cluster", status: "Optimised" },
    ],
  },
  {
    role: UserRole.Salesman,
    label: "Salesman",
    portalName: "Field Sales Demo",
    mockUser: "John Matthews",
    mockEmail: "sales.trial@easyblinds.demo",
    headline: "Create measurements and quotes using sample leads without touching live records.",
    description:
      "All customers, quote values, and visit notes shown here are static frontend trial data.",
    accent: "from-blue-800 to-indigo-500",
    icon: ClipboardList,
    metrics: [
      { label: "Visits Today", value: "6", helper: "Mock schedule" },
      { label: "Quotes Drafted", value: "14", helper: "Sample pipeline" },
      { label: "Close Rate", value: "41%", helper: "Demo KPI" },
    ],
    tasks: [
      { title: "Measure bay window", detail: "Arabian Ranches villa", status: "Next visit" },
      { title: "Send revised quote", detail: "Motorised blinds package", status: "Draft" },
      { title: "Capture review request", detail: "Completed sample client", status: "Pending" },
    ],
  },
  {
    role: UserRole.Fitter,
    label: "Fitter",
    portalName: "Installation Day View",
    mockUser: "Naveen Kumar",
    mockEmail: "fitter.trial@easyblinds.demo",
    headline: "Preview today’s installation route and job checklist with mock site details.",
    description:
      "No real fitter profile, location, job, or customer data is loaded in this Start Free Trial mode.",
    accent: "from-emerald-700 to-teal-500",
    icon: MapPin,
    metrics: [
      { label: "Stops Today", value: "4", helper: "Demo route" },
      { label: "Completed", value: "2", helper: "Sample jobs" },
      { label: "Next Slot", value: "14:00", helper: "Mock timing" },
    ],
    tasks: [
      { title: "Install blackout blinds", detail: "Business Bay tower", status: "In progress" },
      { title: "Upload completion photos", detail: "Mock image checklist", status: "Required" },
      { title: "Collect sign-off", detail: "Sample customer approval", status: "Pending" },
    ],
  },
  {
    role: UserRole.Stitching,
    label: "Stitching",
    portalName: "Production Queue Trial",
    mockUser: "Fatima Noor",
    mockEmail: "stitching.trial@easyblinds.demo",
    headline: "Track fabric preparation and stitching status with a safe sample production queue.",
    description:
      "This preview is independent from production orders and cannot update operational backend data.",
    accent: "from-purple-800 to-fuchsia-500",
    icon: PackageCheck,
    metrics: [
      { label: "Orders Queued", value: "18", helper: "Demo workload" },
      { label: "Ready Today", value: "7", helper: "Sample output" },
      { label: "Material Holds", value: "2", helper: "Mock alerts" },
    ],
    tasks: [
      { title: "Cut linen panels", detail: "Three-bedroom villa order", status: "Queued" },
      { title: "Finish wave curtains", detail: "Mock hotel suite batch", status: "In progress" },
      { title: "Quality check", detail: "Sample order EB-2048", status: "Ready" },
    ],
  },
];

export default function FreeTrialPage() {
  const [selectedRole, setSelectedRole] = useState<TrialRole>(UserRole.SalesManager);
  const profile = useMemo(
    () => trialProfiles.find((item) => item.role === selectedRole) ?? trialProfiles[0],
    [selectedRole],
  );
  const Icon = profile.icon;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.22),transparent_32rem),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_30rem)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to website
          </Link>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
            Frontend-only trial
          </div>
        </div>

        <section className="grid flex-1 items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
              No backend login, no MongoDB reads, no production data
            </div>
            <h1 className="text-4xl font-light tracking-tight text-white sm:text-6xl">
              Try role-based access with safe mock data.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300">
              This page is connected only to the landing page <strong>Start Free Trial</strong> button. It does not change the original login flow, the registration <strong>Get Started</strong> button, or any protected portal page.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {trialProfiles.map((item) => {
                const RoleIcon = item.icon;
                const isActive = item.role === selectedRole;

                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setSelectedRole(item.role)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition",
                      isActive
                        ? "border-amber-300 bg-white text-neutral-950 shadow-2xl shadow-amber-950/30"
                        : "border-white/10 bg-white/5 text-white hover:border-white/30 hover:bg-white/10",
                    )}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", isActive ? "bg-neutral-950 text-white" : "bg-white/10 text-amber-200")}>
                        <RoleIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{item.label}</p>
                        <p className={cn("text-xs", isActive ? "text-neutral-500" : "text-neutral-400")}>{item.portalName}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white text-neutral-950 shadow-2xl shadow-black/40">
            <div className={cn("bg-gradient-to-br p-6 text-white", profile.accent)}>
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/70">{profile.label} trial access</p>
                  <h2 className="mt-2 text-3xl font-light">{profile.portalName}</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                  <Icon className="h-6 w-6" />
                </div>
              </div>

              <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                <p className="text-sm text-white/75">Signed in as mock user</p>
                <p className="mt-1 text-xl font-semibold">{profile.mockUser}</p>
                <p className="text-sm text-white/75">{profile.mockEmail}</p>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-semibold tracking-tight">{profile.headline}</h3>
                <p className="mt-3 leading-7 text-neutral-600">{profile.description}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {profile.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{metric.label}</p>
                    <p className="mt-3 text-3xl font-light text-neutral-950">{metric.value}</p>
                    <p className="mt-1 text-sm text-neutral-500">{metric.helper}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-neutral-200">
                <div className="flex items-center gap-3 border-b border-neutral-200 p-4">
                  <CalendarCheck className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-semibold">Sample work queue</p>
                    <p className="text-sm text-neutral-500">Static dummy records for this button only</p>
                  </div>
                </div>
                <div className="divide-y divide-neutral-100">
                  {profile.tasks.map((task) => (
                    <div key={task.title} className="flex items-center justify-between gap-4 p-4">
                      <div>
                        <p className="font-medium text-neutral-900">{task.title}</p>
                        <p className="text-sm text-neutral-500">{task.detail}</p>
                      </div>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{task.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button className="h-11 rounded-full bg-neutral-950 px-6 text-white hover:bg-neutral-800" onClick={() => setSelectedRole(UserRole.SalesManager)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Reset to manager demo
                </Button>
                <Link href="/login">
                  <Button variant="outline" className="h-11 rounded-full px-6">
                    Use real login instead
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
