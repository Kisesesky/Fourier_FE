import type { Channel, Msg } from "@/workspace/chat/_model/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";
const DEFAULT_PROJECT_ID = process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID;
const DEFAULT_CHANNEL_ID = process.env.NEXT_PUBLIC_DEFAULT_CHANNEL_ID;

const withAuthHeaders = (init?: RequestInit): RequestInit => ({
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  },
  ...init,
});

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, withAuthHeaders(init));
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

export async function listChannels(projectId?: string): Promise<Channel[]> {
  const pid = projectId || DEFAULT_PROJECT_ID;
  if (!pid) return [];
  const data = await http<any[]>(`/projects/${pid}/channels`);
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    workspaceId: item.teamId || "default",
    isDM: item.isDm,
  }));
}

export async function listMessages(channelId?: string): Promise<Msg[]> {
  const cid = channelId || DEFAULT_CHANNEL_ID;
  if (!cid) return [];
  const data = await http<any[]>(`/channels/${cid}/messages`);
  return data.map((item) => ({
    id: item.id,
    author: item.author?.name || item.authorId || "Unknown",
    authorId: item.authorId || "unknown",
    text: item.text,
    ts: item.createdAt ? Date.parse(item.createdAt) : Date.now(),
    channelId: item.channelId,
  }));
}
