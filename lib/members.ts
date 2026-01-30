import api from "./api";

export type FriendProfile = {
  memberId: string;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  status: string;
  createdAt?: string;
  sharedTeams?: Array<{ id: string; name: string }>;
};

export async function fetchFriends(workspaceId?: string): Promise<FriendProfile[]> {
  const res = await api.get("/members/list", { params: workspaceId ? { workspaceId } : undefined });
  return res.data?.data ?? [];
}

export async function fetchFriendRequests(workspaceId?: string): Promise<FriendProfile[]> {
  const res = await api.get("/members/requests", { params: workspaceId ? { workspaceId } : undefined });
  return res.data?.data ?? [];
}

export async function fetchSentFriendRequests(workspaceId?: string): Promise<FriendProfile[]> {
  const res = await api.get("/members/requests/sent", { params: workspaceId ? { workspaceId } : undefined });
  return res.data?.data ?? [];
}

export async function sendFriendRequest(recipientEmail: string) {
  const res = await api.post("/members/request", { recipientEmail });
  return res.data?.data;
}

export async function acceptFriendRequest(memberId: string) {
  const res = await api.patch("/members/accept", { memberId });
  return res.data?.data;
}

export async function blockFriend(memberId: string) {
  const res = await api.patch("/members/block", { memberId });
  return res.data?.data;
}

export async function removeFriend(memberId: string) {
  const res = await api.delete("/members/remove", { data: { memberId } });
  return res.data;
}

export async function searchFriends(keyword: string, workspaceId?: string) {
  const res = await api.get("/members/search", { params: { keyword, ...(workspaceId ? { workspaceId } : {}) } });
  return res.data?.data ?? [];
}

export async function fetchPresence(): Promise<{ onlineUserIds: string[]; statuses: Record<string, string> }> {
  const res = await api.get("/chat/presence");
  return res.data ?? { onlineUserIds: [], statuses: {} };
}
