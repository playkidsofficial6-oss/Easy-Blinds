import { randomUUID } from "crypto";
import type {
  AssignJobInput,
  CreateDispatchJobInput,
  DispatchAgent,
  DispatchJob,
  DispatchSnapshot,
  DispatchTimelineEvent,
  RescheduleJobInput,
  UpdateAgentLocationInput,
  UpdateAgentStatusInput,
  UpdateJobStatusInput,
} from "./types";
import { DISPATCH_AGENTS_SEED, DISPATCH_EVENTS_SEED, DISPATCH_JOBS_SEED } from "./seed";
import { fallbackKeralaCoordinates, routeSummary } from "./geo";
import { canAssignAgent } from "./engine";

type DispatchState = {
  jobs: DispatchJob[];
  agents: DispatchAgent[];
  events: DispatchTimelineEvent[];
};

declare global {
  var easyBlindsDispatchState: DispatchState | undefined;
}

function state(): DispatchState {
  if (!globalThis.easyBlindsDispatchState) {
    globalThis.easyBlindsDispatchState = {
      jobs: structuredClone(DISPATCH_JOBS_SEED),
      agents: structuredClone(DISPATCH_AGENTS_SEED),
      events: structuredClone(DISPATCH_EVENTS_SEED),
    };
  }
  return globalThis.easyBlindsDispatchState;
}

export function getDispatchSnapshot(): DispatchSnapshot {
  const current = state();
  return {
    jobs: current.jobs,
    agents: current.agents,
    events: current.events.slice(-100).reverse(),
    serverTime: new Date().toISOString(),
  };
}

export function createDispatchJob(input: CreateDispatchJobInput): DispatchJob {
  const current = state();
  const now = new Date().toISOString();
  const job: DispatchJob = {
    id: `DSP-${Date.now().toString().slice(-6)}`,
    customerName: input.customerName,
    companyName: input.companyName,
    phone: input.phone,
    email: input.email,
    whatsapp: input.whatsapp,
    address: input.address,
    area: input.area,
    coordinates: input.coordinates ?? fallbackKeralaCoordinates(input.area || input.address),
    propertyType: input.propertyType,
    productCategory: input.productCategory,
    priority: input.priority,
    installationStage: input.installationStage ?? "Survey",
    status: "Pending",
    appointmentDate: input.appointmentDate,
    appointmentTime: input.appointmentTime,
    notes: input.notes,
    quotationAmount: input.quotationAmount,
    leadSource: input.leadSource,
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
    timeline: [],
  };
  const created = addEvent("job_created", `New job created for ${job.customerName}.`, { jobId: job.id });
  job.timeline = [created];
  current.jobs.unshift(job);
  return job;
}

export function assignDispatchJob(jobId: string, input: AssignJobInput): DispatchJob {
  const current = state();
  const job = findJob(jobId);
  const agent = findAgent(input.agentId);
  if (!canAssignAgent(agent, input.appointmentDate, input.appointmentTime)) {
    throw new Error(`${agent.name} is not available for ${input.appointmentDate} at ${input.appointmentTime}.`);
  }
  const route = routeSummary(agent.location, job.coordinates);
  job.status = input.mode === "auto" ? "Assigned" : "Assigned";
  job.assignedAgentId = agent.id;
  job.assignedAgentName = agent.name;
  job.appointmentDate = input.appointmentDate;
  job.appointmentTime = input.appointmentTime;
  job.etaMinutes = route.etaMinutes;
  job.routeDistanceKm = route.distanceKm;
  job.updatedAt = new Date().toISOString();
  agent.schedule[input.appointmentDate] = Array.from(new Set([...(agent.schedule[input.appointmentDate] ?? []), input.appointmentTime])).sort();
  agent.activeAssignmentIds = Array.from(new Set([...agent.activeAssignmentIds, job.id]));
  agent.status = agent.schedule[input.appointmentDate].length >= agent.maxDailyJobs ? "Fully Booked" : agent.status === "Offline" ? "Offline" : "Available";
  agent.lastUpdated = job.updatedAt;
  const evt = addEvent("job_assigned", `${job.customerName} assigned to ${agent.name} for ${input.appointmentDate} ${input.appointmentTime}.`, { jobId: job.id, agentId: agent.id });
  job.timeline.unshift(evt);
  current.jobs = current.jobs.map((item) => (item.id === job.id ? job : item));
  current.agents = current.agents.map((item) => (item.id === agent.id ? agent : item));
  return job;
}

export function updateDispatchJobStatus(jobId: string, input: UpdateJobStatusInput): DispatchJob {
  const current = state();
  const job = findJob(jobId);
  job.status = input.status;
  job.updatedAt = new Date().toISOString();
  if (input.status === "Completed" && job.assignedAgentId) {
    const agent = findAgent(job.assignedAgentId);
    agent.activeAssignmentIds = agent.activeAssignmentIds.filter((id) => id !== job.id);
    agent.status = "Available";
    agent.lastUpdated = job.updatedAt;
  }
  const evt = addEvent("status_changed", `${job.customerName} status changed to ${input.status}${input.notes ? `: ${input.notes}` : "."}`, { jobId: job.id, agentId: job.assignedAgentId });
  job.timeline.unshift(evt);
  current.jobs = current.jobs.map((item) => (item.id === job.id ? job : item));
  return job;
}

export function rescheduleDispatchJob(jobId: string, input: RescheduleJobInput): DispatchJob {
  const current = state();
  const job = findJob(jobId);
  const previousDate = job.appointmentDate;
  const previousTime = job.appointmentTime;
  if (job.assignedAgentId) {
    const agent = findAgent(job.assignedAgentId);
    agent.schedule[previousDate] = (agent.schedule[previousDate] ?? []).filter((slot) => slot !== previousTime);
    agent.schedule[input.appointmentDate] = Array.from(new Set([...(agent.schedule[input.appointmentDate] ?? []), input.appointmentTime])).sort();
    current.agents = current.agents.map((item) => (item.id === agent.id ? agent : item));
  }
  job.status = "Rescheduled";
  job.appointmentDate = input.appointmentDate;
  job.appointmentTime = input.appointmentTime;
  job.updatedAt = new Date().toISOString();
  const evt = addEvent("job_rescheduled", `${job.customerName} rescheduled to ${input.appointmentDate} ${input.appointmentTime}.`, { jobId: job.id, agentId: job.assignedAgentId });
  job.timeline.unshift(evt);
  current.jobs = current.jobs.map((item) => (item.id === job.id ? job : item));
  return job;
}

export function updateAgentStatus(agentId: string, input: UpdateAgentStatusInput): DispatchAgent {
  const current = state();
  const agent = findAgent(agentId);
  agent.status = input.status;
  agent.lastUpdated = new Date().toISOString();
  addEvent("agent_status", `${agent.name} is now ${input.status}.`, { agentId });
  current.agents = current.agents.map((item) => (item.id === agent.id ? agent : item));
  return agent;
}

export function updateAgentLocation(agentId: string, input: UpdateAgentLocationInput): DispatchAgent {
  const current = state();
  const agent = findAgent(agentId);
  agent.location = input.coordinates;
  agent.batteryLevel = input.batteryLevel ?? agent.batteryLevel;
  agent.networkState = input.networkState ?? agent.networkState;
  agent.lastUpdated = new Date().toISOString();
  addEvent("agent_location", `${agent.name} location updated.`, { agentId });
  current.agents = current.agents.map((item) => (item.id === agent.id ? agent : item));
  return agent;
}

function findJob(jobId: string): DispatchJob {
  const job = state().jobs.find((item) => item.id === jobId);
  if (!job) throw new Error(`Job ${jobId} not found.`);
  return job;
}

function findAgent(agentId: string): DispatchAgent {
  const agent = state().agents.find((item) => item.id === agentId);
  if (!agent) throw new Error(`Agent ${agentId} not found.`);
  return agent;
}

function addEvent(type: DispatchTimelineEvent["type"], message: string, ids: { jobId?: string; agentId?: string }): DispatchTimelineEvent {
  const current = state();
  const evt: DispatchTimelineEvent = {
    id: randomUUID(),
    type,
    actorRole: "Sales Manager",
    actorName: "Smart Dispatch",
    message,
    createdAt: new Date().toISOString(),
    jobId: ids.jobId,
    agentId: ids.agentId,
  };
  current.events.push(evt);
  return evt;
}
