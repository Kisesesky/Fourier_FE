// src/lib/workspace.ts
import type { Workspace } from "@/types/workspace";
import api from "./api";

export async function fetchMyWorkspace(): Promise<Workspace> {
  const res = await api.get("/workspace/me");
  return res.data;
}
