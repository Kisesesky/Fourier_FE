// app/(workspace)/workspace/[teamId]/[projectId]/members/_model/schemas/member.schemas.ts

import { z } from "zod";
import type { Member } from "../types";

const ProjectMemberSchema = z
  .object({
    userId: z.string().optional(),
    id: z.string().optional(),
    name: z.string(),
    email: z.string().nullable().optional(),
    avatarUrl: z.string().nullable().optional(),
    backgroundImageUrl: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    role: z.string(),
  })
  .passthrough();

const TeamMemberSchema = z
  .object({
    userId: z.string().optional(),
    id: z.string().optional(),
    name: z.string(),
    email: z.string().nullable().optional(),
  })
  .passthrough();

const mapProjectRole = (role: string): Member["role"] => {
  switch (role) {
    case "OWNER":
      return "owner";
    case "MANAGER":
      return "manager";
    case "MEMBER":
      return "member";
    case "GUEST":
      return "guest";
    default:
      return "member";
  }
};

export const parseProjectMembers = (input: unknown): Member[] => {
  const parsed = z.array(ProjectMemberSchema).safeParse(input ?? []);
  if (!parsed.success) return [];
  return parsed.data.map((member) => ({
    id: member.userId ?? member.id ?? member.name,
    name: member.name,
    displayName: member.name,
    email: member.email ?? "",
    role: mapProjectRole(member.role),
    description: member.bio ?? undefined,
    avatarUrl: member.avatarUrl ?? undefined,
    backgroundImageUrl: member.backgroundImageUrl ?? undefined,
    joinedAt: Date.now(),
    lastActiveAt: Date.now(),
  }));
};

export const parseTeamMembers = (input: unknown): Array<{ id: string; name: string; email?: string | null }> => {
  const parsed = z.array(TeamMemberSchema).safeParse(input ?? []);
  if (!parsed.success) return [];
  return parsed.data.map((member) => ({
    id: member.userId ?? member.id ?? member.name,
    name: member.name,
    email: member.email ?? null,
  }));
};
