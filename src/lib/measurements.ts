import { api } from "./api";

export enum OpeningType {
  Window = "WINDOW",
  Door = "DOOR",
  Custom = "CUSTOM",
}

export enum MeasurementStatus {
  Pending = "PENDING",
  InProgress = "IN_PROGRESS",
  Completed = "COMPLETED",
  Cancelled = "CANCELLED",
}

export interface OpeningInput {
  id: string;
  type: OpeningType | "WINDOW" | "DOOR" | "CUSTOM";
  name: string;
  width: number;
  height: number;
  measurementUnit: string;
  mountType: string;
  openingDirection: string;
  productType: string;
  materialType: string;
  customMaterial?: string;
  motorType: string;
  notes?: string;
  images: string[];
  metadata: Record<string, unknown>;
}

export interface RoomInput {
  id: string;
  name: string;
  category: string;
  openings: OpeningInput[];
}

export interface CreateMeasurementInput {
  jobId: string;
  assignedStaff: string;
  visitDate: string;
  status: MeasurementStatus;
  rooms: RoomInput[];
}

export interface MeasurementResponse extends CreateMeasurementInput {
  _id: string;
  totalRooms: number;
  totalOpenings: number;
  totalWindows: number;
  totalDoors: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * High-performance upsert logic for measurements.
 * Checks if a measurement already exists for this Job. If yes, updates it; if no, creates it.
 */
export async function saveMeasurementToBackend(input: CreateMeasurementInput): Promise<MeasurementResponse> {
  try {
    // 1. Check if a measurement already exists for this jobId
    const { data: existing } = await api.get<MeasurementResponse>(`/measurements/job/${input.jobId}`);
    if (existing && existing._id) {
      // 2. If it exists, update it via PATCH
      const { data: updated } = await api.patch<MeasurementResponse>(`/measurements/${existing._id}`, input);
      return updated;
    }
  } catch (error: unknown) {
    // A 404 error is expected if no measurement exists yet for this job
    const err = error as { response?: { status?: number } };
    if (err?.response?.status !== 404) {
      console.warn("Unexpected error checking existing measurement:", error);
    }
  }

  // 3. Otherwise, create a new measurement via POST
  const { data: created } = await api.post<MeasurementResponse>("/measurements", input);
  return created;
}
