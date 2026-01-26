import api from "./api";

export type DmMessage = {
  id: string;
  content?: string | null;
  senderId: string;
  sender?: { id: string; name: string; avatar?: string | null };
  createdAt: string;
  reply?: {
    id: string;
    content?: string | null;
    sender?: { id: string; name: string; avatar?: string | null };
    isDeleted?: boolean;
  };
  reactions?: Array<{ emoji: string; count: number; reactedByMe: boolean }>;
};

export async function createDmRoom(userIds: string[]) {
  const res = await api.post("/chat/dm/room", { userIds });
  return res.data;
}

export async function sendDmMessage(roomId: string, content: string, replyToMessageId?: string | null) {
  const res = await api.post("/chat/dm/message", { roomId, content, replyToMessageId });
  return res.data;
}

export async function fetchDmMessages(roomId: string, limit = 20) {
  const res = await api.get("/chat/dm/messages", { params: { roomId, limit } });
  return res.data ?? [];
}
