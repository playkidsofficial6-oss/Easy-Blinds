import { AxiosError } from "axios";
import { api } from "./api";

export enum JobStatus {
  Pending = "Pending",
  SalesmanScheduled = "Salesman Scheduled",
  SalesmanOnTheWay = "Salesman On The Way",
  SalesmanReached = "Salesman Reached",
  SalesmanCancelled = "Salesman Cancelled",
  Measuring = "Measuring",
  Quoting = "Quoting",
  ReadyForFitting = "Ready for Fitting",
  FitterAssigned = "Fitter Assigned",
  FitterOnTheWay = "Fitter On The Way",
  FitterReached = "Fitter Reached",
  FitterCancelled = "Fitter Cancelled",
  Fitting = "Fitting",
  TakingPhotos = "Taking Photos",
  Completed = "Completed",
  Cancelled = "Cancelled",
  Dropped = "Dropped",

  // Legacy compatibility
  Scheduled = "Scheduled",
  InProgress = "In Progress",
}

export enum JobPriority {
  Low = "Low",
  Medium = "Medium",
  High = "High",
}




export interface Job {
  _id: string;
  jobId?: string;
  firstName: string;
  lastName: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  address: string;
  productType?: string;
  propertyType?: string;
  projectValue?: number;
  quantity?: number;
  status: JobStatus;
  priority: JobPriority;
  notes?: string;
  scheduledAt?: string;
  timerStartedAt?: string;
  fittingPhotos?: string[];
  fittingNotes?: string;
  activeSalesmanId?: string;
  activeSalesmanName?: string;
  travelStartedAt?: string;
  measurementStartedAt?: string;
  measurementCompletedAt?: string;
  fitterTravelStartedAt?: string;
  fittingStartedAt?: string;
  fittingCompletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  assignedTo?: any;
  assignedBy?: any;
  assignedSalesman?: any;
  assignedFitter?: any;
  quotation?: any;
  location?: {
    type: string;
    coordinates: number[];
  };
  rescheduleRequest?: {
    status: 'pending' | 'resolved';
    requestedAt: string;
  };
  cancelReason?: string;
}

export function isAssignedToUser(job: Job, user?: { _id?: string; name?: string; email?: string } | null): boolean {
  if (!job || !user) return false;

  const targetId = user._id;
  const targetName = user.name ? user.name.toLowerCase().trim() : undefined;
  const targetEmail = user.email ? user.email.toLowerCase().trim() : undefined;

  const checkRef = (ref?: any): boolean => {
    if (!ref) return false;
    if (typeof ref === "object" && ref !== null) {
      if (targetId && (ref._id === targetId || ref.id === targetId)) return true;
      if (targetName && ref.name && typeof ref.name === "string" && ref.name.toLowerCase().trim() === targetName) return true;
      if (targetEmail && ref.email && typeof ref.email === "string" && ref.email.toLowerCase().trim() === targetEmail) return true;
      return false;
    }
    if (typeof ref === "string") {
      const cleanRef = ref.trim();
      if (targetId && cleanRef === targetId) return true;
      if (targetName && cleanRef.toLowerCase() === targetName) return true;
      if (targetEmail && cleanRef.toLowerCase() === targetEmail) return true;
    }
    return false;
  };

  if (checkRef(job.assignedTo) || checkRef(job.assignedSalesman) || checkRef(job.assignedFitter) || checkRef(job.activeSalesmanId)) {
    return true;
  }

  if (job.notes && targetName) {
    const match = job.notes.match(/Assigned to ([^@.]+)(?: @|\.|$)/i);
    const assignedName = match?.[1]?.trim();
    if (assignedName && assignedName.toLowerCase() === targetName) {
      return true;
    }
  }

  return false;
}

export interface CreateJobInput {
  firstName: string;
  lastName: string;
  customerEmail?: string;
  customerPhone: string;
  address: string;
  productType?: string;
  propertyType?: string;
  projectValue?: number;
  quantity?: number;
  status?: JobStatus;
  priority?: JobPriority;
  notes?: string;
  scheduledAt?: string;
  timerStartedAt?: string;
  activeSalesmanId?: string;
  activeSalesmanName?: string;
  travelStartedAt?: string;
  measurementStartedAt?: string;
  measurementCompletedAt?: string;
  assignedTo?: string;
  assignedBy?: string;
  assignedSalesman?: string;
  assignedFitter?: string;
  quotation?: any;
  location?: {
    type: string;
    coordinates: number[];
  };
  rescheduleRequest?: {
    status: 'pending' | 'resolved';
    requestedAt: string;
  };
}

export type UpdateJobInput = Partial<CreateJobInput>;

export function getJobDisplayId(job: Pick<Job, "_id" | "jobId">): string {
  return job.jobId || `JOB-${job._id.slice(-6).toUpperCase()}`;
}

export function getJobRecordId(job: Pick<Job, "_id">): string {
  return job._id;
}

export interface SalesmanWorkflowInput {
  salesmanId?: string;
  salesmanName?: string;
  notes?: string;
}

export interface JobsQuery {
  page?: number;
  limit?: number;
  status?: JobStatus;
  priority?: JobPriority;
  search?: string;
}

export interface JobsResponse {
  items: Job[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  const { data } = await api.post<Job>("/jobs", input);
  return data;
}

export async function getJobs(query: JobsQuery = {}): Promise<JobsResponse> {
  const { data } = await api.get<JobsResponse>("/jobs", { params: query });
  return data;
}

export async function getJob(id: string): Promise<Job> {
  const { data } = await api.get<Job>(`/jobs/${id}`);
  return data;
}

export async function updateJob(id: string, input: UpdateJobInput): Promise<Job> {
  const { data } = await api.patch<Job>(`/jobs/${id}`, input);
  return data;
}

export async function deleteJob(id: string): Promise<{ deleted: boolean; id: string; jobId?: string }> {
  const { data } = await api.delete<{ deleted: boolean; id: string; jobId?: string }>(`/jobs/${id}`);
  return data;
}

export async function startSalesmanTravel(id: string, input: SalesmanWorkflowInput = {}): Promise<Job> {
  const { data } = await api.patch<Job>(`/jobs/${id}/salesman-travel`, input);
  return data;
}

export async function startSalesmanMeasuring(id: string, input: SalesmanWorkflowInput = {}): Promise<Job> {
  const { data } = await api.patch<Job>(`/jobs/${id}/salesman-measuring`, input);
  return data;
}

export async function completeSalesmanWorkflow(id: string, input: SalesmanWorkflowInput = {}): Promise<Job> {
  const { data } = await api.patch<Job>(`/jobs/${id}/salesman-complete`, input);
  return data;
}

export async function assignFitter(id: string, fitterId: string): Promise<Job> {
  const { data } = await api.patch<Job>(`/jobs/${id}/assign-fitter`, { fitterId });
  return data;
}

export async function startFitterTravel(id: string, input: { fitterId?: string; notes?: string } = {}): Promise<Job> {
  const { data } = await api.patch<Job>(`/jobs/${id}/fitter-travel`, input);
  return data;
}

export async function startFitterFitting(id: string, input: { fitterId?: string; notes?: string } = {}): Promise<Job> {
  const { data } = await api.patch<Job>(`/jobs/${id}/fitter-fitting`, input);
  return data;
}

export async function completeFitterWorkflow(
  id: string,
  input: { fitterId?: string; notes?: string; photos?: string[] } = {},
): Promise<Job> {
  const { data } = await api.patch<Job>(`/jobs/${id}/fitter-complete`, input);
  return data;
}

export function getJobErrorMessage(error: unknown, fallback = "Unable to process job request."): string {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(" ");
    }

    if (typeof message === "string") {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
