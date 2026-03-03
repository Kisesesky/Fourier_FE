// app/(workspace)/workspace/[teamId]/[projectId]/file/_model/schemas/file-api.schemas.ts
import { z } from "zod";

export const FileFolderDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ProjectFileDtoSchema = z.object({
  id: z.string(),
  fileUrl: z.string(),
  thumbnailUrl: z.string().nullable().optional(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSize: z.union([z.number(), z.string()]),
  createdAt: z.string(),
  folder: z.object({ id: z.string(), name: z.string() }).nullable().optional(),
  folderId: z.string().nullable().optional(),
});

export const UploadedProjectFileDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  fileUrl: z.string(),
  thumbnailUrl: z.string().nullable().optional(),
  mimeType: z.string(),
  size: z.number(),
  createdAt: z.string(),
  folderId: z.string().nullable().optional(),
});
