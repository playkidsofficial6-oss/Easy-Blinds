"use client";

import { useState, useEffect, useCallback } from "react";
import { addDays, format, isSameDay, parseISO } from "date-fns";

import { getJobs, type Job } from "./jobs";
import { getUsers, updateUser, type UserRecord } from "./users";

export type FitterStatus = "On the way" | "In progress" | "Completed" | "Offline" | "Fully Booked" | "Available";

export interface FitterEvent {
  id: string;
  type: "status_change" | "check_in" | "completion";
  action: string;
  time: string;
  location: string;
  coordinates?: [number, number];
}

export interface FitterJob {
  id: string;
  client: string;
  address: string;
  time: string;
  endTime: string;
  status: "Pending" | "In Progress" | "Done";
  fabric?: string;
  rooms?: string[];
  coordinates?: [number, number];
  value?: number;
  email?: string;
  phone?: string;
  notes?: string;
  brand?: string;
  property?: string;
  productType?: "Curtains" | "Blinds" | "Shutters" | "Awning";
  priority?: "High" | "Medium" | "Low";
}

export interface Fitter {
  id: string;
  name: string;
  jobRef: string;
  status: FitterStatus;
  location?: [number, number];
  locationLabel?: string;
  lastUpdated: string;
  avatar?: string;
  email?: string;
  phone?: string;
  history: FitterEvent[];
  schedule: {
    today: FitterJob[];
    yesterday: FitterJob[];
    tomorrow: FitterJob[];
    upcoming: FitterJob[];
  };
  currentJobStartTime?: number | null;
  capacity: {
    max: number;
    current: number;
    remaining: number;
  };
  nextAvailableSlot: string;
}

const TIME_SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00"];
const ASSIGNED_FITTER_PATTERN = /Assigned to ([^@.]+)(?: @|\.|$)/i;

function isFitterUser(user: UserRecord) {
  return String(user.role).trim().toLowerCase() === "fitter";
}

function extractAssignedFitter(job: Job) {
  const match = job.notes?.match(ASSIGNED_FITTER_PATTERN);
  return match?.[1]?.trim();
}

function isAssignedToFitter(job: Job, fitter: UserRecord) {
  const assignedName = extractAssignedFitter(job);
  if (!assignedName) return false;

  return assignedName.toLowerCase() === fitter.name.toLowerCase();
}

function isJobForDate(job: Job, date: Date) {
  if (!job.scheduledAt) return false;

  try {
    return isSameDay(parseISO(job.scheduledAt), date);
  } catch {
    return false;
  }
}

function toDisplayTime(value?: string) {
  if (!value) return "";

  try {
    return format(parseISO(value), "HH:mm");
  } catch {
    return "";
  }
}

function toDisplayEndTime(value?: string) {
  if (!value) return "";

  try {
    const start = parseISO(value);
    return format(new Date(start.getTime() + 2 * 60 * 60 * 1000), "HH:mm");
  } catch {
    return "";
  }
}

function toFitterJob(job: Job): FitterJob {
  return {
    id: job._id,
    client: job.customerName,
    address: job.address,
    time: toDisplayTime(job.scheduledAt),
    endTime: toDisplayEndTime(job.scheduledAt),
    status: job.status === "completed" ? "Done" : job.status === "in_progress" ? "In Progress" : "Pending",
    value: job.quantity * 1000,
    email: job.customerEmail,
    phone: job.customerPhone,
    notes: job.notes,
    brand: "Easy Blinds",
    property: `Qty ${job.quantity}`,
    productType: normalizeProductType(job.productType),
    priority: job.priority === "high" ? "High" : job.priority === "medium" ? "Medium" : "Low",
  };
}

function normalizeProductType(productType: string): FitterJob["productType"] {
  const normalized = productType.toLowerCase();

  if (normalized.includes("curtain")) return "Curtains";
  if (normalized.includes("shutter")) return "Shutters";
  if (normalized.includes("awning")) return "Awning";
  return "Blinds";
}

function getLastUpdated(user: UserRecord) {
  const source = user.location?.updatedAt ?? user.updatedAt;
  if (!source) return "Not updated";

  try {
    return format(parseISO(source), "MMM d, HH:mm");
  } catch {
    return "Not updated";
  }
}

function getStatus(user: UserRecord, todayJobs: FitterJob[], capacityRemaining: number): FitterStatus {
  if (capacityRemaining <= 0) return "Fully Booked";
  if (todayJobs.some((job) => job.status === "In Progress")) return "In progress";
  if (todayJobs.some((job) => job.status === "Pending")) return "On the way";
  if (user.liveStatus === "Offline") return "Offline";
  if (user.liveStatus === "Completed") return "Completed";
  return "Available";
}

function getCurrentJobStartTime(jobs: Job[]) {
  const activeJob = jobs.find((job) => job.status === "in_progress" && job.scheduledAt);
  if (!activeJob?.scheduledAt) return null;

  try {
    return parseISO(activeJob.scheduledAt).getTime();
  } catch {
    return null;
  }
}

function buildFitter(user: UserRecord, jobs: Job[]): Fitter {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const assignedJobs = jobs.filter((job) => ["scheduled", "in_progress", "completed"].includes(job.status) && isAssignedToFitter(job, user));
  const todayJobs = assignedJobs.filter((job) => isJobForDate(job, today)).map(toFitterJob);
  const tomorrowJobs = assignedJobs.filter((job) => isJobForDate(job, tomorrow)).map(toFitterJob);
  const upcomingJobs = assignedJobs
    .filter((job) => job.scheduledAt && !isJobForDate(job, today) && !isJobForDate(job, tomorrow))
    .map(toFitterJob);
  const maxCapacity = user.maxDailyJobs ?? 5;
  const currentCapacity = todayJobs.length;
  const remainingCapacity = Math.max(0, maxCapacity - currentCapacity);
  const busySlots = todayJobs.map((job) => job.time).filter(Boolean);
  const nextAvailableSlot = TIME_SLOTS.find((slot) => !busySlots.includes(slot)) ?? "None";
  const activeJob = todayJobs.find((job) => job.status === "In Progress") ?? todayJobs.find((job) => job.status === "Pending");
  const location = user.location ? ([user.location.lat, user.location.lng] as [number, number]) : undefined;

  return {
    id: user._id,
    name: user.name,
    jobRef: activeJob?.id ?? "--",
    status: getStatus(user, todayJobs, remainingCapacity),
    location,
    locationLabel: user.location?.address,
    lastUpdated: getLastUpdated(user),
    avatar: user.avatar,
    email: user.email,
    phone: user.phone,
    history: [],
    schedule: {
      yesterday: [],
      today: todayJobs,
      tomorrow: tomorrowJobs,
      upcoming: upcomingJobs,
    },
    currentJobStartTime: getCurrentJobStartTime(assignedJobs),
    capacity: {
      max: maxCapacity,
      current: currentCapacity,
      remaining: remainingCapacity,
    },
    nextAvailableSlot,
  };
}

export function useLiveFitters() {
  const [fitters, setFitters] = useState<Fitter[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFitters = useCallback(async () => {
    setIsLoaded(false);
    setError(null);

    try {
      const [users, jobsResponse] = await Promise.all([getUsers(), getJobs({ limit: 500 })]);
      const fitterUsers = users.filter(isFitterUser);
      setFitters(fitterUsers.map((user) => buildFitter(user, jobsResponse.items)));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load live fitter data from backend.");
      setFitters([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadFitters();
  }, [loadFitters]);

  const updateFitterStatus = useCallback(
    async (fitterId: string, status: FitterStatus) => {
      await updateUser(fitterId, { liveStatus: status });
      await loadFitters();
    },
    [loadFitters],
  );

  return { fitters, updateFitterStatus, isLoaded, error, reload: loadFitters };
}
