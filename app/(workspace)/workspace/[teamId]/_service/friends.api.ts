// app/(workspace)/workspace/[teamId]/_service/friends.api.ts
import {
  acceptFriendRequest,
  blockFriend,
  fetchFriendRequests,
  fetchFriends,
  fetchPresence,
  fetchSentFriendRequests,
  removeFriend,
  searchFriends,
  sendFriendRequest,
  type FriendProfile,
} from "@/lib/members";

export async function listFriends(workspaceId?: string) {
  return fetchFriends(workspaceId);
}

export async function listReceivedFriendRequests(workspaceId?: string) {
  return fetchFriendRequests(workspaceId);
}

export async function listSentFriendRequests(workspaceId?: string) {
  return fetchSentFriendRequests(workspaceId);
}

export async function listPresenceOnlineUserIds() {
  const presence = await fetchPresence();
  return presence?.onlineUserIds ?? [];
}

export async function searchFriendDirectory(query: string, workspaceId?: string): Promise<FriendProfile[]> {
  return searchFriends(query, workspaceId);
}

export async function requestFriendByEmail(email: string) {
  return sendFriendRequest(email);
}

export async function acceptIncomingFriendRequest(memberId: string) {
  return acceptFriendRequest(memberId);
}

export async function removeExistingFriend(memberId: string) {
  return removeFriend(memberId);
}

export async function blockExistingFriend(memberId: string) {
  return blockFriend(memberId);
}

