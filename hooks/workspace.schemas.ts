// hooks/workspace.schemas.ts
import { z } from "zod";

export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
});

export const WorkspaceSelectEventSchema = z.object({
  workspaceId: z.string().optional(),
});
