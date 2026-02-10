// app/(workspace)/workspace/[teamId]/[projectId]/chat/_service/api.ts
import api from "@/lib/api";
import type { Channel } from "@/workspace/chat/_model/types";

type ChannelResponse = {
  id: string;
  name: string;
  projectId?: string;
  isDefault?: boolean;
  memberIds?: string[];
};

type MessageResponse = {
  id: string;
  content?: string;
  senderId: string;
  sender?: { id: string; name: string; avatar?: string };
  createdAt: string;
  editedAt?: string;
  threadParentId?: string;
  thread?: { count: number };
};

export async function listChannels(projectId: string): Promise<Channel[]> {
  const res = await api.get<ChannelResponse[]>("/chat/channels", { params: { projectId } });
  const data = res.data ?? [];
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    workspaceId: item.projectId ?? projectId,
  }));
}

export async function createChannel(
  projectId: string,
  name: string,
  memberIds: string[] = [],
): Promise<ChannelResponse> {
  const res = await api.post<ChannelResponse>("/chat/channels", {
    projectId,
    name,
    memberIds,
  });
  return res.data;
}

export async function listMessages(channelId: string): Promise<MessageResponse[]> {
  const res = await api.get<MessageResponse[]>("/chat/channel/messages", { params: { channelId, limit: 100 } });
  return res.data ?? [];
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

export async function listProjectMembers(teamId: string, projectId: string): Promise<Array<{ userId: string; name: string; avatarUrl?: string | null }>> {
  const res = await api.get(`/team/${teamId}/project/${projectId}/members`);
  return res.data ?? [];
}

export async function getChannelPreferences(projectId: string): Promise<{ pinnedChannelIds: string[]; archivedChannelIds: string[] }> {
  const res = await api.get("/chat/channel/preferences", { params: { projectId } });
  return res.data ?? { pinnedChannelIds: [], archivedChannelIds: [] };
}

export async function getMessageAnalytics(params: {
  projectId: string;
  granularity: "hourly" | "daily" | "monthly";
  date?: string;
  month?: string;
  year?: string;
}) {
  const res = await api.get<{ counts: number[]; granularity: string }>("/chat/analytics/messages", {
    params,
  });
  return res.data;
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
