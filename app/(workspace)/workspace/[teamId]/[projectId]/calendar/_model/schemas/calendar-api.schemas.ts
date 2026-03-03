// app/(workspace)/workspace/[teamId]/[projectId]/calendar/_model/schemas/calendar-api.schemas.ts
import { z } from "zod";

export const CalendarEventResponseSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  title: z.string().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  location: z.string().nullable().optional(),
  memo: z.string().nullable().optional(),
  calendarId: z.string().optional(),
  categoryId: z.string().optional(),
  category: z
    .object({
      id: z.string(),
      name: z.string(),
      categoryColor: z.string().optional(),
      color: z.string().optional(),
    })
    .passthrough()
    .nullable()
    .optional(),
  createdBy: z.object({ id: z.string(), name: z.string(), avatarUrl: z.string().nullable().optional() }).optional(),
  sourceType: z.enum(["manual", "issue"]).optional(),
  linkedIssueId: z.string().optional(),
}).passthrough();

export const CalendarCategoryResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  categoryColor: z.string().optional(),
  color: z.string().optional(),
  calendarId: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const CalendarResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.union([z.literal("TEAM"), z.literal("PERSONAL"), z.literal("PRIVATE")]),
  color: z.string(),
  ownerId: z.string().nullable().optional(),
  folderId: z.string().nullable().optional(),
});

export const CalendarFolderResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdById: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const CalendarAnalyticsSchema = z.object({
  counts: z.array(z.number()),
  granularity: z.string(),
});
