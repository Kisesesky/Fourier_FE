// app/(workspace)/workspace/[teamId]/[projectId]/chat/_service/api.ts
import api from "@/lib/api";
import type { Channel } from "@/workspace/chat/_model/types";
import { z } from "zod";
import type { AxiosError } from "axios";
import type { AnalyticsResponse, ChannelResponse, MessageResponse } from "../_model/types/api.types";
import { AnalyticsSchema, ChannelResponseSchema, MessageResponseSchema } from "../_model/schemas/chat-api.schemas";

const toChannelKind = (
  type?: "CHAT" | "VOICE" | "VIDEO",
): "text" | "voice" | "video" => {
  if (type === "VOICE") return "voice";
  if (type === "VIDEO") return "video";
  return "text";
};


export async function listChannels(projectId: string): Promise<Channel[]> {
  try {
    const res = await api.get<ChannelResponse[]>("/chat/channels", { params: { projectId } });
    const parsed = z.array(ChannelResponseSchema).safeParse(res.data ?? []);
    const data = parsed.success ? parsed.data : [];
    return data.map((item) => ({
      id: item.id,
      name: item.name,
      workspaceId: item.projectId ?? projectId,
      createdAt: item.createdAt,
      kind: toChannelKind(item.type),
    }));
  } catch (error) {
    const status = (error as AxiosError)?.response?.status;
    if (status === 401) return [];
    throw error;
  }
}

export async function createChannel(
  projectId: string,
  name: string,
  memberIds: string[] = [],
  kind: "text" | "voice" | "video" = "text",
): Promise<ChannelResponse> {
  const channelType: "CHAT" | "VOICE" | "VIDEO" =
    kind === "voice" ? "VOICE" : kind === "video" ? "VIDEO" : "CHAT";
  const res = await api.post<ChannelResponse>("/chat/channels", {
    projectId,
    name,
    memberIds,
    type: channelType,
  });
  return res.data;
}

export async function listMessages(channelId: string): Promise<MessageResponse[]> {
  try {
    const res = await api.get<MessageResponse[]>("/chat/channel/messages", { params: { channelId, limit: 100 } });
    const parsed = z.array(MessageResponseSchema).safeParse(res.data ?? []);
    return parsed.success ? parsed.data : [];
  } catch (error) {
    const status = (error as AxiosError)?.response?.status;
    if (status === 401) return [];
    throw error;
  }
}

export async function getPinnedMessages(channelId: string): Promise<string[]> {
  const res = await api.get("/chat/channel/pins", { params: { channelId } });
  return res.data?.messageIds ?? [];
}

export async function getSavedMessages(): Promise<string[]> {
  const res = await api.get("/chat/messages/saved");
  return res.data?.messageIds ?? [];
}

export async function sendChannelMessage(channelId: string, content: string, opts?: { replyToMessageId?: string | null; threadParentId?: string | null }) {
  const res = await api.post<MessageResponse>("/chat/channel/message", {
    channelId,
    content,
    replyToMessageId: opts?.replyToMessageId ?? undefined,
    threadParentId: opts?.threadParentId ?? undefined,
  });
  return res.data;
}

export async function getOrCreateDmRoom(userIds: string[]): Promise<{ id: string }> {
  const res = await api.post<{ id: string }>("/chat/dm/room", { userIds });
  return res.data;
}

export async function sendDmMessage(roomId: string, content: string, opts?: { replyToMessageId?: string | null; fileIds?: string[] }) {
  const res = await api.post<MessageResponse>("/chat/dm/message", {
    roomId,
    content,
    replyToMessageId: opts?.replyToMessageId ?? undefined,
    fileIds: opts?.fileIds ?? undefined,
  });
  return res.data;
}

export async function sendThreadMessage(threadParentId: string, content: string, fileIds: string[] = []) {
  const res = await api.post<MessageResponse>("/chat/thread/message", {
    threadParentId,
    content,
    fileIds,
  });
  return res.data;
}

export async function listProjectMembers(
  teamId: string,
  projectId: string,
): Promise<Array<{
  userId: string;
  name: string;
  displayName?: string;
  role?: "owner" | "manager" | "member" | "guest";
  avatarUrl?: string | null;
  backgroundImageUrl?: string | null;
}>> {
  const res = await api.get(`/team/${teamId}/project/${projectId}/members`);
  const schema = z.array(
    z.object({
      userId: z.string().optional(),
      id: z.string().optional(),
      name: z.string(),
      displayName: z.string().optional(),
      role: z.string().optional(),
      avatarUrl: z.string().nullable().optional(),
      backgroundImageUrl: z.string().nullable().optional(),
    }).passthrough(),
  );
  const parsed = schema.safeParse(res.data ?? []);
  return parsed.success
    ? parsed.data.map((item) => ({
        userId: item.userId ?? item.id ?? "",
        name: item.name,
        displayName: item.displayName,
        role:
          item.role?.toLowerCase() === "owner" ||
          item.role?.toLowerCase() === "manager" ||
          item.role?.toLowerCase() === "member" ||
          item.role?.toLowerCase() === "guest"
            ? (item.role.toLowerCase() as "owner" | "manager" | "member" | "guest")
            : undefined,
        avatarUrl: item.avatarUrl ?? null,
        backgroundImageUrl: item.backgroundImageUrl ?? null,
      }))
    : [];
}

export async function getChannelPreferences(projectId: string): Promise<{ pinnedChannelIds: string[]; archivedChannelIds: string[] }> {
  const res = await api.get("/chat/channel/preferences", { params: { projectId } });
  const parsed = z
    .object({
      pinnedChannelIds: z.array(z.string()).default([]),
      archivedChannelIds: z.array(z.string()).default([]),
    })
    .safeParse(res.data ?? {});
  return parsed.success ? parsed.data : { pinnedChannelIds: [], archivedChannelIds: [] };
}

export async function getMessageAnalytics(params: {
  projectId: string;
  granularity: "hourly" | "daily" | "monthly";
  date?: string;
  month?: string;
  year?: string;
}) {
  const res = await api.get<AnalyticsResponse>("/chat/analytics/messages", {
    params,
  });
  const parsed = AnalyticsSchema.safeParse(res.data);
  return parsed.success ? parsed.data : { counts: [], granularity: params.granularity };
}

export async function saveChannelPreferences(
  projectId: string,
  payload: { pinnedChannelIds: string[]; archivedChannelIds: string[] },
) {
  const res = await api.post("/chat/channel/preferences", {
    projectId,
    pinnedChannelIds: payload.pinnedChannelIds,
    archivedChannelIds: payload.archivedChannelIds,
  });
  return res.data ?? payload;
}
