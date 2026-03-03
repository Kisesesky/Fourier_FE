// app/(workspace)/workspace/[teamId]/[projectId]/docs/_model/types/api.types.ts
import type { z } from "zod";
import type {
  DocsAnalyticsSchema,
  DocumentCommentDtoSchema,
  DocumentDtoSchema,
  FolderDtoSchema,
} from "../schemas/docs-api.schemas";

export type DocsAnalyticsDto = z.infer<typeof DocsAnalyticsSchema>;
export type FolderDto = z.infer<typeof FolderDtoSchema>;
export type DocumentDto = z.infer<typeof DocumentDtoSchema>;
export type DocumentCommentDto = z.infer<typeof DocumentCommentDtoSchema>;
