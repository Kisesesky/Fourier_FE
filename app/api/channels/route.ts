import { NextResponse } from "next/server";
import { listChannels } from "@/workspace/chat/_service/api";

export async function GET() {
  const channels = await listChannels();
  return NextResponse.json({ channels });
}
