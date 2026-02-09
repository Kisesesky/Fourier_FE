export type UserPresenceStatus = "online" | "offline" | "away" | "dnd";

const PRESENCE_KEY = "fd.user.presence";
export const USER_PRESENCE_EVENT = "user:presence:changed";

export function loadUserPresence(): UserPresenceStatus {
  if (typeof window === "undefined") return "online";
  const raw = window.localStorage.getItem(PRESENCE_KEY);
  if (raw === "online" || raw === "offline" || raw === "away" || raw === "dnd") {
    return raw;
  }
  return "online";
}

export function saveUserPresence(status: UserPresenceStatus) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRESENCE_KEY, status);
  window.dispatchEvent(new CustomEvent(USER_PRESENCE_EVENT, { detail: { status } }));
}
