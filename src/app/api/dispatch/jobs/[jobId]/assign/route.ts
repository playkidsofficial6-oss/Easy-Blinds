import { NextResponse } from "next/server";
import { assignDispatchJob } from "@/lib/dispatch/store";
import type { AssignJobInput } from "@/lib/dispatch/types";

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params;
    const payload = (await request.json()) as AssignJobInput;
    const job = assignDispatchJob(jobId, payload);
    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to assign job." }, { status: 400 });
  }
}
