import { format } from "date-fns";
import type { Fitter, FitterJob, FitterStatus } from "@/lib/live-store";
import type {
  DispatchAgent,
  DispatchFilters,
  DispatchJob,
  DispatchRecommendation,
  DispatchSortKey,
  SalesAgentStatus,
} from "./types";
import { distanceKm, estimateEtaMinutes } from "./geo";

const unavailableStatuses: SalesAgentStatus[] = ["Offline", "Fully Booked", "Resting", "On Break"];
const priorityWeight = { High: 3, Medium: 2, Low: 1 } as const;

export function availableSlotsForAgent(agent: DispatchAgent, date: string): string[] {
  const dailySlots = ["08:00", "10:00", "12:00", "14:00", "16:00"];
  const busy = agent.schedule[date] ?? [];
  return dailySlots.filter((slot) => !busy.includes(slot));
}

export function agentWorkload(agent: DispatchAgent, date: string): { current: number; remaining: number; max: number } {
  const current = agent.schedule[date]?.length ?? 0;
  return {
    current,
    max: agent.maxDailyJobs,
    remaining: Math.max(agent.maxDailyJobs - current, 0),
  };
}

export function canAssignAgent(agent: DispatchAgent, date: string, slot: string): boolean {
  const workload = agentWorkload(agent, date);
  if (unavailableStatuses.includes(agent.status)) return false;
  if (workload.remaining <= 0) return false;
  return !agent.schedule[date]?.includes(slot);
}

export function recommendAgents(job: DispatchJob, agents: DispatchAgent[]): DispatchRecommendation[] {
  return agents
    .map((agent) => {
      const distance = distanceKm(agent.location, job.coordinates);
      const workload = agentWorkload(agent, job.appointmentDate);
      const availableSlotCount = availableSlotsForAgent(agent, job.appointmentDate).length;
      const territoryBonus = agent.territory.some((area) => job.area.toLowerCase().includes(area.toLowerCase())) ? 12 : 0;
      const statusPenalty = unavailableStatuses.includes(agent.status) ? 100 : agent.status === "Busy" || agent.status === "In Progress" ? 12 : 0;
      const workloadPenalty = workload.current * 8 + (availableSlotCount === 0 ? 80 : 0);
      const priorityBonus = priorityWeight[job.priority] * 2;
      const score = Math.max(0, 100 - distance * 2 - workloadPenalty - statusPenalty + territoryBonus + priorityBonus);
      return {
        id: agent.id,
        name: agent.name,
        dist: Number(distance.toFixed(1)),
        score: Number(score.toFixed(1)),
        etaMinutes: estimateEtaMinutes(distance),
        reason: `${Number(distance.toFixed(1))} km away · ${workload.remaining} slots free · ${agent.status}`,
      };
    })
    .filter((recommendation) => recommendation.score > 0)
    .sort((a, b) => b.score - a.score || a.dist - b.dist)
    .slice(0, 5);
}

export function autoSelectAgent(job: DispatchJob, agents: DispatchAgent[]): DispatchRecommendation | undefined {
  return recommendAgents(job, agents).find((recommendation) => {
    const agent = agents.find((item) => item.id === recommendation.id);
    return agent ? canAssignAgent(agent, job.appointmentDate, job.appointmentTime ?? "10:00") : false;
  });
}

export function filterJobs(jobs: DispatchJob[], filters: DispatchFilters): DispatchJob[] {
  return jobs.filter((job) => {
    if (filters.date && job.appointmentDate !== filters.date) return false;
    if (filters.status && filters.status !== "All" && job.status !== filters.status) return false;
    if (filters.agentId && filters.agentId !== "All" && job.assignedAgentId !== filters.agentId) return false;
    if (filters.location && !`${job.area} ${job.address}`.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.productCategory && filters.productCategory !== "All" && job.productCategory !== filters.productCategory) return false;
    if (filters.priority && filters.priority !== "All" && job.priority !== filters.priority) return false;
    if (filters.installationStage && filters.installationStage !== "All" && job.installationStage !== filters.installationStage) return false;
    if (typeof filters.minQuotation === "number" && job.quotationAmount < filters.minQuotation) return false;
    if (typeof filters.maxQuotation === "number" && job.quotationAmount > filters.maxQuotation) return false;
    return true;
  });
}

export function sortJobs(jobs: DispatchJob[], sortKey: DispatchSortKey, agents: DispatchAgent[]): DispatchJob[] {
  const result = [...jobs];
  switch (sortKey) {
    case "nearest":
      return result.sort((a, b) => nearestDistance(a, agents) - nearestDistance(b, agents));
    case "highest_value":
      return result.sort((a, b) => b.quotationAmount - a.quotationAmount);
    case "newest":
      return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case "urgent_first":
      return result.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
    case "oldest_pending":
      return result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    default:
      return result;
  }
}

export function toLegacyJob(job: DispatchJob) {
  return {
    id: job.id,
    client: job.customerName,
    email: job.email,
    phone: job.phone,
    whatsapp: job.whatsapp,
    area: job.area,
    address: job.address,
    property: job.propertyType,
    status: toLegacyStatus(job.status),
    team: job.assignedAgentName ?? "Unassigned",
    scheduled: job.appointmentDate,
    time: job.appointmentTime,
    value: job.quotationAmount,
    priority: job.priority,
    productType: job.productCategory,
    coordinates: [job.coordinates.lat, job.coordinates.lng] as [number, number],
    fitterStatus: job.status === "In Progress" ? "On-site" : job.status === "On the Way" ? "Travelling" : "Free",
    reviewStatus: "none" as const,
  };
}

export function toMapFitter(agent: DispatchAgent, jobs: DispatchJob[]): Fitter {
  const today = format(new Date(), "yyyy-MM-dd");
  const todayJobs = jobs.filter((job) => job.assignedAgentId === agent.id && job.appointmentDate === today);
  const tomorrow = format(new Date(Date.now() + 24 * 60 * 60 * 1000), "yyyy-MM-dd");
  const tomorrowJobs = jobs.filter((job) => job.assignedAgentId === agent.id && job.appointmentDate === tomorrow);
  const current = todayJobs.length;
  const status: FitterStatus = agent.status === "In Progress" || agent.status === "Busy" || agent.status === "At Site"
    ? "In progress"
    : agent.status === "On the Way" || agent.status === "Travelling"
      ? "On the way"
      : agent.status === "Fully Booked" || agent.status === "Offline" || agent.status === "Available"
        ? agent.status
        : "Available";
  return {
    id: agent.id,
    name: agent.name,
    jobRef: todayJobs[0]?.id ?? "--",
    status,
    location: [agent.location.lat, agent.location.lng] as [number, number],
    lastUpdated: agent.lastUpdated,
    avatar: agent.avatar,
    history: [],
    schedule: {
      today: todayJobs.map(toFitterJob),
      yesterday: [],
      tomorrow: tomorrowJobs.map(toFitterJob),
      upcoming: jobs.filter((job) => job.assignedAgentId === agent.id && job.appointmentDate > tomorrow).map(toFitterJob),
    },
    capacity: { max: agent.maxDailyJobs, current, remaining: Math.max(agent.maxDailyJobs - current, 0) },
    nextAvailableSlot: availableSlotsForAgent(agent, today)[0] ?? "None",
  };
}

function toFitterJob(job: DispatchJob): FitterJob {
  return {
    id: job.id,
    client: job.customerName,
    address: job.address,
    time: job.appointmentTime ?? "10:00",
    endTime: "",
    status: job.status === "Completed" ? "Done" : job.status === "In Progress" ? "In Progress" : "Pending",
    coordinates: [job.coordinates.lat, job.coordinates.lng] as [number, number],
    value: job.quotationAmount,
    email: job.email,
    phone: job.phone,
    property: job.propertyType,
    productType: job.productCategory === "AC" ? "Blinds" : job.productCategory,
    priority: job.priority,
  };
}

function nearestDistance(job: DispatchJob, agents: DispatchAgent[]): number {
  if (!agents.length) return Number.MAX_SAFE_INTEGER;
  return Math.min(...agents.map((agent) => distanceKm(agent.location, job.coordinates)));
}

function toLegacyStatus(status: DispatchJob["status"]) {
  if (status === "Pending") return "Pending Team";
  if (status === "Assigned" || status === "On the Way" || status === "Arrived" || status === "Rescheduled") return "Scheduled";
  if (status === "In Progress") return "Installation In Progress";
  if (status === "Completed") return "Completed";
  return "Pending Team";
}
