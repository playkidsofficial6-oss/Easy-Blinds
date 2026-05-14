import { NextResponse } from "next/server";
import { rescheduleDispatchJob } from "@/lib/dispatch/store";
import type { RescheduleJobInput } from "@/lib/dispatch/types";

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params;
    const payload = (await request.json()) as RescheduleJobInput;
    const job = rescheduleDispatchJob(jobId, payload);
    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to reschedule job." }, { status: 400 });
  }
}
