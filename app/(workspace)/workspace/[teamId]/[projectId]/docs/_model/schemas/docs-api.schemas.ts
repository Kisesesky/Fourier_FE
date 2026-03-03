// app/(workspace)/workspace/[teamId]/[projectId]/docs/_model/schemas/docs-api.schemas.ts
import { z } from "zod";

export const DocsAnalyticsSchema = z.object({
  counts: z.array(z.number()),
  granularity: z.string(),
});

export const FolderDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const DocumentDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().nullable().optional(),
  starred: z.boolean().optional(),
  folderId: z.string().nullable().optional(),
  authorId: z.string().nullable().optional(),
  authorName: z.string().nullable().optional(),
  authorAvatarUrl: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const DocumentCommentDtoSchema = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  authorId: z.string().nullable().optional(),
  authorName: z.string().nullable().optional(),
  authorAvatarUrl: z.string().nullable().optional(),
  authorRole: z.string().nullable().optional(),
  mine: z.boolean().optional(),
});
