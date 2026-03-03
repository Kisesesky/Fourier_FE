// hooks/workspace.service.ts
import { z } from "zod";
import { fetchMyWorkspaces } from "@/lib/workspace";
import { WorkspaceSchema } from "./workspace.schemas";

export async function listMyWorkspaces() {
  const data = await fetchMyWorkspaces();
  const parsed = z.array(WorkspaceSchema).safeParse(data ?? []);
  return parsed.success ? parsed.data : [];
}
