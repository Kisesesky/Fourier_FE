import { NextResponse, type NextRequest } from "next/server";
import { listChannels } from "@/workspace/chat/_service/api";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }
  const channels = await listChannels(projectId);
  return NextResponse.json({ channels });
}
