// src/lib/auth.ts
import api from "./api";

export type AuthProfile = {
  id: string;
  email: string;
  name?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  backgroundImageUrl?: string | null;
  bio?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SignInPayload = {
  email: string;
  password: string;
};

export type SignInResponse = {
  accessToken: string;
  refreshToken?: string;
};

export async function signIn(payload: SignInPayload): Promise<SignInResponse> {
  const res = await api.post("/auth/sign-in", payload);
  return res.data;
}

export async function signOut(): Promise<void> {
  await api.post("/auth/sign-out");
}

export async function fetchProfile(): Promise<AuthProfile> {
  const res = await api.get("/auth/profile");
  return res.data;
}

export async function updateProfile(payload: { displayName?: string; backgroundImageUrl?: string; bio?: string }) {
  const form = new FormData();
  if (payload.displayName !== undefined) {
    form.append("displayName", payload.displayName);
  }
  if (payload.backgroundImageUrl !== undefined) {
    form.append("backgroundImageUrl", payload.backgroundImageUrl);
  }
  if (payload.bio !== undefined) {
    form.append("bio", payload.bio);
  }
  const res = await api.patch("/users/update", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
