"use client";

import { useState, useEffect, useCallback } from "react";
import { addDays, format, isSameDay, parseISO } from "date-fns";

import {
  getFitters,
  type FitterProfileRecord,
  type FitterProfileStatus,
} from "./fitters-api";
import { getJobs, type Job } from "./jobs";
import { getUsers, updateUser, type UserRecord, extractLatLng } from "./users";
import { getAllLiveLocations } from "@/services/api";
import {
  disconnectSocket,
  listenToLocationUpdates,
} from "@/services/socket";
import type {
  LiveLocationPresenceEvent,
  LiveLocationRecord,
} from "@/types/live-location";

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
  jobId?: string;
  client: string;
  address: string;
  time: string;
  endTime: string;
  scheduledAt?: string;
  date?: string;
  status: "Pending" | "On the way" | "In Progress" | "Done";
  fabric?: string;
  rooms?: string[];
  coordinates?: [number, number];
  timerStartedAt?: string;
  value?: number;
  email?: string;
  phone?: string;
  notes?: string;
  brand?: string;
  property?: string;
  productType?: "Curtains" | "Blinds" | "Shutters" | "Awning";
  priority?: "High" | "Medium" | "Low";
  estimatedDuration?: string;
  width?: number;
  drop?: number;
  mountType?: string;
  controlType?: string;
}

export interface Fitter {
  id: string;
  name: string;
  role?: "Fitter" | "Salesman";
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
    completed?: FitterJob[];
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

function extractAssignedFitter(job: Job) {
  if (job.assignedTo) return job.assignedTo;
  const match = job.notes?.match(ASSIGNED_FITTER_PATTERN);
  return match?.[1]?.trim();
}

function isAssignedToFitter(job: Job, fitter: Pick<UserRecord, "name" | "_id">) {
  if (job.assignedTo) {
    // New format: compare by MongoDB _id
    if (job.assignedTo === fitter._id) return true;
    // Legacy fallback: assignedTo might still be a name string
    if (job.assignedTo.toLowerCase() === fitter.name.toLowerCase()) return true;
    return false;
  }
  // Oldest legacy: name embedded in notes
  const match = job.notes?.match(ASSIGNED_FITTER_PATTERN);
  const assignedName = match?.[1]?.trim();
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
  const ll = extractLatLng(job.location as any);
  return {
    id: job._id,
    jobId: job.jobId,
    client: job.customerName,
    address: job.address,
    time: toDisplayTime(job.scheduledAt),
    endTime: toDisplayEndTime(job.scheduledAt),
    scheduledAt: job.scheduledAt,
    date: job.scheduledAt ? format(parseISO(job.scheduledAt), "yyyy-MM-dd") : undefined,
    timerStartedAt: job.timerStartedAt,
    status: job.status === "completed" ? "Done" : job.status === "in_progress" ? "In Progress" : "Pending",
    value: job.projectValue ?? ((job.quantity ?? 1) * 1000),
    email: job.customerEmail,
    phone: job.customerPhone,
    notes: job.notes,
    brand: "Easy Blinds",
    property: `Qty ${job.quantity ?? 1}`,
    productType: normalizeProductType(job.productType),
    priority: job.priority === "high" ? "High" : job.priority === "medium" ? "Medium" : "Low",
    coordinates: ll ? [ll.lat, ll.lng] as [number, number] : undefined,
    estimatedDuration: (job as any).estimatedDuration,
    width: (job as any).width,
    drop: (job as any).drop,
    mountType: (job as any).mountType,
    controlType: (job as any).controlType,
  };
}

function normalizeProductType(productType?: string): FitterJob["productType"] {
  const normalized = productType?.toLowerCase() ?? "";

  if (normalized.includes("curtain")) return "Curtains";
  if (normalized.includes("shutter")) return "Shutters";
  if (normalized.includes("awning")) return "Awning";
  return "Blinds";
}

function toReadableLastUpdated(source?: string) {
  if (!source) return "Not updated";

  try {
    return format(parseISO(source), "MMM d, HH:mm");
  } catch {
    return "Not updated";
  }
}

function toIsoString(v?: string | Date): string | undefined {
  if (!v) return undefined;
  if (typeof v === "string") return v;
  return v.toISOString();
}

function getLastUpdated(
  profile: FitterProfileRecord,
  liveLocation?: LiveLocationRecord,
) {
  return toReadableLastUpdated(
    toIsoString(liveLocation?.lastUpdatedAt) ??
      toIsoString(liveLocation?.updatedAt) ??
      toIsoString(profile.location?.updatedAt) ??
      toIsoString(profile.updatedAt) ??
      toIsoString(profile.user.location?.updatedAt) ??
      toIsoString(profile.user.updatedAt),
  );
}

function toLiveStatus(status: FitterProfileStatus): FitterStatus {
  if (status === "fully_booked") return "Fully Booked";
  if (status === "in_progress") return "In progress";
  if (status === "on_the_way") return "On the way";
  return "Available";
}

function getStatus(
  profile: FitterProfileRecord,
  todayJobs: FitterJob[],
  capacityRemaining: number,
  liveLocation?: LiveLocationRecord,
): FitterStatus {
  if (liveLocation && !liveLocation.isOnline) return "Offline";
  if (capacityRemaining <= 0) return "Fully Booked";
  if (todayJobs.some((job) => job.status === "In Progress")) return "In progress";
  if (todayJobs.some((job) => job.status === "Pending")) return "On the way";
  if (profile.user.liveStatus === "Offline") return "Offline";
  if (profile.user.liveStatus === "Completed") return "Completed";
  return toLiveStatus(profile.status);
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

function buildFitter(
  profile: FitterProfileRecord,
  jobs: Job[],
  liveLocation?: LiveLocationRecord,
): Fitter {
  const user = profile.user;
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const assignedJobs = jobs.filter((job) => ["scheduled", "in_progress", "completed"].includes(job.status) && isAssignedToFitter(job, user));
  const todayJobs = assignedJobs.filter((job) => isJobForDate(job, today)).map(toFitterJob);
  const tomorrowJobs = assignedJobs.filter((job) => isJobForDate(job, tomorrow)).map(toFitterJob);
  const upcomingJobs = assignedJobs
    .filter((job) => job.scheduledAt && !isJobForDate(job, today) && !isJobForDate(job, tomorrow))
    .map(toFitterJob);
  const maxCapacity = profile.capacity || 5;
  const currentCapacity = todayJobs.length;
  const remainingCapacity = Math.max(0, maxCapacity - currentCapacity);
  const busySlots = todayJobs.map((job) => job.time).filter(Boolean);
  const nextAvailableSlot = TIME_SLOTS.find((slot) => !busySlots.includes(slot)) ?? "None";
  const activeJob = todayJobs.find((job) => job.status === "In Progress") ?? todayJobs.find((job) => job.status === "Pending");
  const location = liveLocation
    ? ([liveLocation.lat, liveLocation.lng] as [number, number])
    : (() => { const ll = extractLatLng(profile.location); return ll ? [ll.lat, ll.lng] as [number, number] : undefined; })();

  return {
    id: user._id,
    name: user.name,
    role: "Fitter",
    jobRef: activeJob?.id ?? "--",
    status: getStatus(profile, todayJobs, remainingCapacity, liveLocation),
    location,
    locationLabel: profile.location?.address,
    lastUpdated: getLastUpdated(profile, liveLocation),
    avatar: user.avatar,
    email: user.email,
    phone: profile.phone ?? user.phone,
    history: buildInitialHistory(liveLocation),
    schedule: {
      yesterday: [],
      today: todayJobs,
      tomorrow: tomorrowJobs,
      upcoming: upcomingJobs,
      completed: assignedJobs.filter((job) => job.status === "completed").map(toFitterJob),
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

function buildProfilesFromUsers(users: UserRecord[]): FitterProfileRecord[] {
  return users
    .filter((user) => user.role?.toLowerCase() === "fitter")
    .map((user) => ({
      userId: user._id,
      user,
      phone: user.phone,
      location: user.location,
      status: "available",
      capacity: user.maxDailyJobs || 5,
      skills: [],
    }));
}

const MAX_HISTORY = 50; // keep last 50 events in memory

function buildInitialHistory(liveLocation?: LiveLocationRecord): FitterEvent[] {
  if (!liveLocation?.lastUpdatedAt && !liveLocation?.updatedAt) return [];

  const ts = liveLocation.lastUpdatedAt ?? liveLocation.updatedAt ?? "";
  let timeLabel = "--";
  try { timeLabel = format(new Date(ts), "HH:mm"); } catch {}

  return [{
    id: `init-${ts}`,
    type: "status_change",
    action: liveLocation.isOnline ? "Came Online" : "Last Seen",
    time: timeLabel,
    location: liveLocation.isOnline ? "GPS active" : "GPS inactive",
    coordinates: [liveLocation.lat, liveLocation.lng],
  }];
}

function applyLiveLocationToFitters(
  currentFitters: Fitter[],
  liveLocation: LiveLocationRecord,
): Fitter[] {
  return currentFitters.map((fitter) => {
    if (fitter.id !== liveLocation.userId) return fitter;

    const ts = liveLocation.lastUpdatedAt ?? liveLocation.updatedAt ?? new Date().toISOString();
    let timeLabel = "--";
    try { timeLabel = format(new Date(ts), "HH:mm:ss"); } catch {}

    const newEvent: FitterEvent = {
      id: `loc-${ts}-${Math.random().toString(36).slice(2, 7)}`,
      type: "check_in",
      action: "Location Updated",
      time: timeLabel,
      location: liveLocation.isOnline ? "GPS ping received" : "GPS offline",
      coordinates: [liveLocation.lat, liveLocation.lng],
    };

    const updatedHistory = [newEvent, ...fitter.history].slice(0, MAX_HISTORY);

    return {
      ...fitter,
      location: [liveLocation.lat, liveLocation.lng],
      status: liveLocation.isOnline ? (liveLocation.liveStatus as any || (fitter.status === "Offline" ? "Available" : fitter.status)) : "Offline",
      lastUpdated: toReadableLastUpdated(liveLocation.lastUpdatedAt ?? liveLocation.updatedAt),
      history: updatedHistory,
    };
  });
}

function applyPresenceToFitters(
  currentFitters: Fitter[],
  event: LiveLocationPresenceEvent,
  isOnline: boolean,
): Fitter[] {
  return currentFitters.map((fitter) => {
    if (fitter.id !== event.userId) return fitter;

    const ts = event.timestamp ?? event.lastUpdatedAt ?? new Date().toISOString();
    let timeLabel = "--";
    try { timeLabel = format(new Date(ts), "HH:mm:ss"); } catch {}

    const newEvent: FitterEvent = {
      id: `presence-${ts}-${Math.random().toString(36).slice(2, 7)}`,
      type: "status_change",
      action: isOnline ? "Came Online" : "Went Offline",
      time: timeLabel,
      location: isOnline ? "GPS tracking started" : "GPS tracking stopped",
    };

    const updatedHistory = [newEvent, ...fitter.history].slice(0, MAX_HISTORY);

    return {
      ...fitter,
      status: isOnline && fitter.status === "Offline" ? "Available" : isOnline ? fitter.status : "Offline",
      lastUpdated: event.timestamp ? toReadableLastUpdated(event.timestamp) : fitter.lastUpdated,
      history: updatedHistory,
    };
  });
}

export function useLiveFitters() {
  const [fitters, setFitters] = useState<Fitter[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFitters = useCallback(async () => {
    await Promise.resolve(); // prevent synchronous state update within effect
    setIsLoaded(false);
    setError(null);

    try {
      let jobItems: Job[] = [];
      try {
        const jobsResponse = await getJobs({ limit: 100 });
        jobItems = jobsResponse?.items ?? [];
      } catch (jobErr) {
        console.warn("[useLiveFitters] Could not load jobs, fitters will show with empty schedules:", jobErr);
      }

      let fitterProfiles: FitterProfileRecord[] = [];
      try {
        fitterProfiles = await getFitters();
      } catch (fittersErr) {
        console.warn("[useLiveFitters] Could not load /fitters, falling back to /users:", fittersErr);
        const allUsers = await getUsers();
        fitterProfiles = buildProfilesFromUsers(allUsers);
      }

      let liveLocations: LiveLocationRecord[] = [];
      try {
        liveLocations = await getAllLiveLocations();
      } catch (locationErr) {
        console.warn("[useLiveFitters] Could not load live locations, using fitter profile locations:", locationErr);
      }

      const liveLocationByUserId = liveLocations.reduce<Record<string, LiveLocationRecord>>((accumulator, liveLocation) => {
        accumulator[liveLocation.userId] = liveLocation;
        return accumulator;
      }, {});

      setFitters(
        fitterProfiles.map((profile) =>
          buildFitter(profile, jobItems, liveLocationByUserId[profile.userId]),
        ),
      );
    } catch (loadError) {
      console.error("[useLiveFitters] Failed to load fitters:", loadError);
      setError(loadError instanceof Error ? loadError.message : "Unable to load live fitter data from backend.");
      setFitters([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
     
    loadFitters();
  }, [loadFitters]);

  useEffect(() => {
    const cleanupListeners = listenToLocationUpdates({
      onLocationUpdated: (liveLocation) => {
        setFitters((currentFitters) =>
          applyLiveLocationToFitters(currentFitters, liveLocation),
        );
      },
      onUserOnline: (event) => {
        setFitters((currentFitters) =>
          applyPresenceToFitters(currentFitters, event, true),
        );
      },
      onUserOffline: (event) => {
        setFitters((currentFitters) =>
          applyPresenceToFitters(currentFitters, event, false),
        );
      },
      onSalesmanStatusChanged: (event) => {
        setFitters((currentFitters) =>
          currentFitters.map((f) => {
            if (f.id !== event.userId) return f;

            let status: FitterStatus = "Available";
            if (event.status === "On the way") status = "On the way";
            else if (event.status === "In progress" || event.status === "In Progress" || event.status === "Measuring") status = "In progress";
            else if (event.status === "Offline") status = "Offline";

            return {
              ...f,
              status,
              jobRef: event.jobId ?? f.jobRef,
            };
          })
        );
        // Background reload to sync the schedule and details
        void loadFitters();
      },
      onError: (socketError) => {
        console.warn("[useLiveFitters] Live-location socket error:", socketError);
      },
    });

    return () => {
      cleanupListeners();
    };
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
