import api from "@/lib/api";
import type { Channel } from "@/workspace/chat/_model/types";

type ChannelResponse = {
  id: string;
  name: string;
  projectId?: string;
  isDefault?: boolean;
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

export async function listMessages(channelId: string): Promise<MessageResponse[]> {
  const res = await api.get<MessageResponse[]>("/chat/channel/messages", { params: { channelId, limit: 100 } });
  return res.data ?? [];
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

export async function listProjectMembers(teamId: string, projectId: string): Promise<Array<{ userId: string; name: string; avatarUrl?: string | null }>> {
  const res = await api.get(`/team/${teamId}/project/${projectId}/members`);
  return res.data ?? [];
}
