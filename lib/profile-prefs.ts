export const USER_PROFILE_PREFS_EVENT = "user:profile:prefs:changed";

const NAME_KEY = "fd.user.displayName";
const AVATAR_KEY = "fd.user.avatarUrl";
const BACKGROUND_KEY = "fd.user.backgroundImageUrl";

export function loadProfilePrefs() {
  if (typeof window === "undefined") {
    return { displayName: "", avatarUrl: "", backgroundImageUrl: "" };
  }
  return {
    displayName: window.localStorage.getItem(NAME_KEY) ?? "",
    avatarUrl: window.localStorage.getItem(AVATAR_KEY) ?? "",
    backgroundImageUrl: window.localStorage.getItem(BACKGROUND_KEY) ?? "",
  };
}

export function saveProfilePrefs(patch: { displayName?: string; avatarUrl?: string | null; backgroundImageUrl?: string | null }) {
  if (typeof window === "undefined") return;
  if (patch.displayName !== undefined) {
    window.localStorage.setItem(NAME_KEY, patch.displayName);
  }
  if (patch.avatarUrl !== undefined) {
    if (patch.avatarUrl === null || patch.avatarUrl === "") {
      window.localStorage.removeItem(AVATAR_KEY);
    } else {
      window.localStorage.setItem(AVATAR_KEY, patch.avatarUrl);
    }
  }
  if (patch.backgroundImageUrl !== undefined) {
    if (patch.backgroundImageUrl === null || patch.backgroundImageUrl === "") {
      window.localStorage.removeItem(BACKGROUND_KEY);
    } else {
      window.localStorage.setItem(BACKGROUND_KEY, patch.backgroundImageUrl);
    }
  }
  window.dispatchEvent(new Event(USER_PROFILE_PREFS_EVENT));
}
