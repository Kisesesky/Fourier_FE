import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCalendarEvents } from "@/workspace/calendar/_service/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const result = await getCalendarEvents({ start, end });
  return NextResponse.json(result);
}
