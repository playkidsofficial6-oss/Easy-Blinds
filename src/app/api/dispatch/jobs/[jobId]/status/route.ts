import { NextResponse } from "next/server";
import { updateDispatchJobStatus } from "@/lib/dispatch/store";
import type { UpdateJobStatusInput } from "@/lib/dispatch/types";

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params;
    const payload = (await request.json()) as UpdateJobStatusInput;
    const job = updateDispatchJobStatus(jobId, payload);
    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to update job status." }, { status: 400 });
  }
}
