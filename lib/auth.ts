// lib/auth.ts
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

export type VerificationPayload = {
  email: string;
};

export type VerifyCodePayload = {
  email: string;
  code: string;
};

export type ResetPasswordPayload = {
  email: string;
  newPassword: string;
  confirmPassword: string;
};

export async function signIn(payload: SignInPayload): Promise<SignInResponse> {
  const res = await api.post("/auth/sign-in", payload);
  return res.data;
}

export async function sendSignUpVerificationCode(payload: VerificationPayload) {
  const res = await api.post("/verification/sign-up/sendcode", payload);
  return res.data as { success: boolean; message: string };
}

export async function verifySignUpCode(payload: VerifyCodePayload) {
  const res = await api.post("/verification/sign-up/verifycode", payload);
  return res.data as { success: boolean; message: string };
}

export async function sendPasswordResetVerificationCode(payload: VerificationPayload) {
  const res = await api.post("/verification/find-password/sendcode", payload);
  return res.data as { success: boolean; message: string };
}

export async function verifyPasswordResetCode(payload: VerifyCodePayload) {
  const res = await api.post("/verification/find-password/verifycode", payload);
  return res.data as { success: boolean; message: string };
}

export async function signUp(payload: FormData) {
  const res = await api.post("/auth/sign-up", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const res = await api.post("/auth/reset-password", payload);
  return res.data as { success: boolean; message: string };
}

export async function signOut(): Promise<void> {
  await api.post("/auth/sign-out");
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const res = await api.post("/auth/change-password", payload);
  return res.data as { success: boolean; message: string };
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
