// app/(workspace)/workspace/[teamId]/[projectId]/_model/schemas/home-dashboard.schemas.ts

import { z } from "zod";

const MemberApiSchema = z
  .object({
    userId: z.string().optional(),
    id: z.string().optional(),
    name: z.string(),
    avatarUrl: z.string().nullable().optional(),
    role: z.string().optional(),
    joinedAt: z.string().optional(),
    createdAt: z.string().optional(),
  })
  .passthrough();

const DocumentApiSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    updatedAt: z.string(),
    folderId: z.string().nullable().optional(),
  })
  .passthrough();

const FileApiSchema = z
  .object({
    id: z.string(),
    fileName: z.string(),
    createdAt: z.string(),
    fileSize: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

export type ProjectMemberRow = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role?: string;
  joinedAt?: number;
};

export type RecentDocRow = {
  id: string;
  title: string;
  updatedAt: string;
  folderId?: string | null;
};

export type RecentFileRow = {
  id: string;
  name: string;
  createdAt: string;
  size: number;
};

export const parseProjectMembers = (input: unknown): ProjectMemberRow[] => {
  const parsed = z.array(MemberApiSchema).safeParse(input ?? []);
  if (!parsed.success) return [];
  return parsed.data.map((member) => ({
    id: member.userId ?? member.id ?? member.name,
    name: member.name,
    avatarUrl: member.avatarUrl ?? null,
    role: member.role,
    joinedAt: member.joinedAt
      ? new Date(member.joinedAt).getTime()
      : member.createdAt
      ? new Date(member.createdAt).getTime()
      : undefined,
  }));
};

export const parseRecentDocs = (input: unknown): RecentDocRow[] => {
  const parsed = z.array(DocumentApiSchema).safeParse(input ?? []);
  if (!parsed.success) return [];
  return parsed.data.map((doc) => ({
    id: doc.id,
    title: doc.title,
    updatedAt: doc.updatedAt,
    folderId: doc.folderId ?? null,
  }));
};

export const parseRecentFiles = (input: unknown): RecentFileRow[] => {
  const parsed = z.array(FileApiSchema).safeParse(input ?? []);
  if (!parsed.success) return [];
  return parsed.data.map((item) => ({
    id: item.id,
    name: item.fileName,
    createdAt: item.createdAt,
    size: Number(item.fileSize || 0),
  }));
};
