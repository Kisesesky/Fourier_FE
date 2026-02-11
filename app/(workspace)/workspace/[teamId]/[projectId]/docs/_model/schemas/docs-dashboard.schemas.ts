// app/(workspace)/workspace/[teamId]/[projectId]/docs/_model/schemas/docs-dashboard.schemas.ts

import { z } from "zod";
import type { DocumentCommentDto } from "@/workspace/docs/_service/api";

const DocumentCommentSchema = z.object({
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

export const parseDocumentComments = (input: unknown): DocumentCommentDto[] => {
  const parsed = z.array(DocumentCommentSchema).safeParse(input ?? []);
  return parsed.success ? parsed.data : [];
};

