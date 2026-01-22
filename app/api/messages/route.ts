import { NextResponse } from "next/server";
import { listMessages } from "@/workspace/chat/_service/api";

export async function GET() {
  const messages = await listMessages();
  return NextResponse.json({ messages });
}
