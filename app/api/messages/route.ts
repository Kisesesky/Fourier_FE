import { NextResponse } from "next/server";
import { listMessages } from "@/workspace/chat/_service/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId");
  if (!channelId) {
    return NextResponse.json({ error: "channelId is required" }, { status: 400 });
  }
  const messages = await listMessages(channelId);
  return NextResponse.json({ messages });
}
