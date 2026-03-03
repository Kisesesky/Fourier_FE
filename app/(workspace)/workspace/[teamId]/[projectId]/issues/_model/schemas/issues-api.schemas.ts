// app/(workspace)/workspace/[teamId]/[projectId]/issues/_model/schemas/issues-api.schemas.ts
import { z } from 'zod';

export const UnknownArraySchema = z.array(z.unknown());

export const IssuesAnalyticsSchema = z.object({
  counts: z.array(z.number()),
  granularity: z.string(),
});

export const IssueGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
  sortOrder: z.number().optional(),
  createdAt: z.string().optional(),
});

export const IssueUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  avatarUrl: z.string().optional(),
});
