export type DispatchRole = "Super Admin" | "Operations Manager" | "Sales Manager" | "Sales Agent";

export type DispatchJobStatus =
  | "Pending"
  | "Assigned"
  | "On the Way"
  | "Arrived"
  | "In Progress"
  | "Completed"
  | "Rescheduled"
  | "Cancelled";

export type SalesAgentStatus =
  | "Available"
  | "Resting"
  | "On Break"
  | "Travelling"
  | "At Site"
  | "Busy"
  | "In Progress"
  | "On the Way"
  | "Fully Booked"
  | "Offline";

export type ProductCategory = "Blinds" | "Curtains" | "AC" | "Shutters" | "Awning";
export type JobPriority = "High" | "Medium" | "Low";
export type InstallationStage = "Survey" | "Quotation" | "Measurement" | "Installation" | "Aftercare";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DispatchTimelineEvent {
  id: string;
  type:
    | "job_created"
    | "job_assigned"
    | "status_changed"
    | "agent_location"
    | "agent_status"
    | "job_rescheduled"
    | "job_cancelled"
    | "note_added";
  actorRole: DispatchRole;
  actorName: string;
  message: string;
  createdAt: string;
  jobId?: string;
  agentId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface DispatchJob {
  id: string;
  customerName: string;
  companyName?: string;
  phone: string;
  email: string;
  whatsapp?: string;
  address: string;
  area: string;
  coordinates: Coordinates;
  propertyType: string;
  productCategory: ProductCategory;
  priority: JobPriority;
  installationStage: InstallationStage;
  status: DispatchJobStatus;
  appointmentDate: string;
  appointmentTime?: string;
  notes?: string;
  quotationAmount: number;
  leadSource: string;
  tags: string[];
  assignedAgentId?: string;
  assignedAgentName?: string;
  etaMinutes?: number;
  routeDistanceKm?: number;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  rejectedReason?: string;
  photos?: string[];
  measurements?: Record<string, string | number | boolean>;
  timeline: DispatchTimelineEvent[];
}

export interface DispatchAgent {
  id: string;
  name: string;
  role: "Sales Agent";
  phone: string;
  email: string;
  avatar?: string;
  status: SalesAgentStatus;
  location: Coordinates;
  territory: string[];
  activeAssignmentIds: string[];
  maxDailyJobs: number;
  batteryLevel?: number;
  networkState?: "Excellent" | "Good" | "Weak" | "Offline";
  lastUpdated: string;
  schedule: Record<string, string[]>;
}

export interface DispatchSnapshot {
  jobs: DispatchJob[];
  agents: DispatchAgent[];
  events: DispatchTimelineEvent[];
  serverTime: string;
}

export interface DispatchFilters {
  date: string;
  status?: DispatchJobStatus | "All";
  agentId?: string | "All";
  location?: string;
  productCategory?: ProductCategory | "All";
  priority?: JobPriority | "All";
  installationStage?: InstallationStage | "All";
  minQuotation?: number;
  maxQuotation?: number;
}

export type DispatchSortKey = "Default Sorting" | "nearest" | "highest_value" | "newest" | "urgent_first" | "oldest_pending";

export interface DispatchRecommendation {
  id: string;
  name: string;
  dist: number;
  score: number;
  etaMinutes: number;
  reason: string;
}

export interface CreateDispatchJobInput {
  customerName: string;
  companyName?: string;
  phone: string;
  email: string;
  whatsapp?: string;
  address: string;
  area: string;
  coordinates?: Coordinates;
  propertyType: string;
  productCategory: ProductCategory;
  priority: JobPriority;
  installationStage?: InstallationStage;
  appointmentDate: string;
  appointmentTime?: string;
  notes?: string;
  quotationAmount: number;
  leadSource: string;
  tags?: string[];
}

export interface AssignJobInput {
  agentId: string;
  appointmentDate: string;
  appointmentTime: string;
  mode?: "manual" | "drag_drop" | "auto";
}

export interface RescheduleJobInput {
  appointmentDate: string;
  appointmentTime: string;
}

export interface UpdateJobStatusInput {
  status: DispatchJobStatus;
  notes?: string;
}

export interface UpdateAgentStatusInput {
  status: SalesAgentStatus;
}

export interface UpdateAgentLocationInput {
  coordinates: Coordinates;
  batteryLevel?: number;
  networkState?: DispatchAgent["networkState"];
}
