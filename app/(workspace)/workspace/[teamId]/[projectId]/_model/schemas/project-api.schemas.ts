// app/(workspace)/workspace/[teamId]/[projectId]/_model/schemas/project-api.schemas.ts
import { z } from "zod";

export const ProjectSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  iconType: z.literal("IMAGE").optional(),
  iconValue: z.string().optional(),
  status: z.enum(["ACTIVE", "DRAFT", "DISABLED"]).optional(),
  isFavorite: z.boolean().optional(),
  teamId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
