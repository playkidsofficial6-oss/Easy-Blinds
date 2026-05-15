import { AxiosError } from "axios";
import { api } from "./api";

export type JobStatus = "pending" | "scheduled" | "in_progress" | "completed" | "cancelled";
export type JobPriority = "low" | "medium" | "high";

export interface Job {
  _id: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateJobInput {
  customerName: string;
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
}

export type UpdateJobInput = Partial<CreateJobInput>;

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

export async function updateJob(id: string, input: UpdateJobInput): Promise<Job> {
  const { data } = await api.patch<Job>(`/jobs/${id}`, input);
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
