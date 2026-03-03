// app/(workspace)/workspace/[teamId]/_model/schemas/team-api.schemas.ts
import { z } from "zod";

export const TeamBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  iconType: z.literal("IMAGE").optional(),
  iconValue: z.string().optional(),
  role: z.string().optional(),
  members: z.number().optional(),
});

export const TeamMemberSummarySchema = z.object({
  userId: z.string(),
  role: z.string(),
}).passthrough();
