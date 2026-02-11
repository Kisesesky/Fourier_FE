// app/(workspace)/workspace/[teamId]/[projectId]/calendar/_model/schemas/calendar-view.schemas.ts

import { z } from "zod";
import type { CalendarMemberOption } from "../types";

const ProjectMemberSchema = z
  .object({
    userId: z.string().optional(),
    id: z.string().optional(),
    name: z.string(),
    avatarUrl: z.string().nullable().optional(),
  })
  .passthrough();

const CalendarMemberSchema = z
  .object({
    userId: z.string(),
  })
  .passthrough();

export const parseCalendarMemberOptions = (input: unknown): CalendarMemberOption[] => {
  const parsed = z.array(ProjectMemberSchema).safeParse(input ?? []);
  if (!parsed.success) return [];
  return parsed.data
    .map((member) => ({
      id: member.userId ?? member.id ?? "",
      name: member.name,
      avatarUrl: member.avatarUrl ?? null,
    }))
    .filter((member) => Boolean(member.id));
};

export const parseCalendarMemberIds = (input: unknown): string[] => {
  const parsed = z.array(CalendarMemberSchema).safeParse(input ?? []);
  if (!parsed.success) return [];
  return parsed.data.map((member) => member.userId).filter(Boolean);
};

