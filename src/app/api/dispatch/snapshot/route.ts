import { NextResponse } from "next/server";
import { getDispatchSnapshot } from "@/lib/dispatch/store";

export async function GET() {
  return NextResponse.json(getDispatchSnapshot());
}
