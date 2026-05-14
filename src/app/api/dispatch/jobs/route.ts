import { NextResponse } from "next/server";
import { createDispatchJob, getDispatchSnapshot } from "@/lib/dispatch/store";
import type { CreateDispatchJobInput } from "@/lib/dispatch/types";

export async function GET() {
  return NextResponse.json(getDispatchSnapshot().jobs);
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateDispatchJobInput;
    const job = createDispatchJob(payload);
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to create job." }, { status: 400 });
  }
}
