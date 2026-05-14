import { NextResponse } from "next/server";
import { updateAgentStatus } from "@/lib/dispatch/store";
import type { UpdateAgentStatusInput } from "@/lib/dispatch/types";

interface RouteContext {
  params: Promise<{ agentId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { agentId } = await context.params;
    const payload = (await request.json()) as UpdateAgentStatusInput;
    const agent = updateAgentStatus(agentId, payload);
    return NextResponse.json(agent);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to update agent status." }, { status: 400 });
  }
}
