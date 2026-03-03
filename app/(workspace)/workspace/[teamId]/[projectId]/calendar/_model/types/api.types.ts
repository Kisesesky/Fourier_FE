// app/(workspace)/workspace/[teamId]/[projectId]/calendar/_model/types/api.types.ts
import type { z } from "zod";
import type {
  CalendarAnalyticsSchema,
  CalendarCategoryResponseSchema,
  CalendarEventResponseSchema,
  CalendarFolderResponseSchema,
  CalendarResponseSchema,
} from "../schemas/calendar-api.schemas";

export type CalendarEventResponse = z.infer<typeof CalendarEventResponseSchema>;
export type CalendarCategoryResponse = z.infer<typeof CalendarCategoryResponseSchema>;
export type CalendarResponse = z.infer<typeof CalendarResponseSchema>;
export type CalendarFolderResponse = z.infer<typeof CalendarFolderResponseSchema>;
export type CalendarAnalyticsResponse = z.infer<typeof CalendarAnalyticsSchema>;
