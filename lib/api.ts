// lib/api.ts
import axios, { AxiosHeaders } from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1",
  withCredentials: true, // 쿠키 기반 인증 대비
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status !== 401) {
      console.error("API Error:", err.response?.data || err.message);
    }
    return Promise.reject(err);
  }
);

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("accessToken");
    const headers = AxiosHeaders.from(config.headers ?? {});

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    config.headers = headers;
  }

  return config;
});

export function setAuthToken(token?: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
