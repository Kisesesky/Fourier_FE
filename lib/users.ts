// lib/users.ts
import api from "./api";

export type UserSearchResult = {
  id: string;
  name: string;
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
};

export async function searchUsers(keyword: string) {
  const res = await api.get(`/users/search`, {
    params: { q: keyword },
  });
  return res.data as UserSearchResult[];
}
