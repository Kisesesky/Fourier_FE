// src/lib/auth.ts
import api from "./api";

export type AuthProfile = {
  id: string;
  email: string;
  name?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
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
