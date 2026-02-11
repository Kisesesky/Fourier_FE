// app/(workspace)/workspace/[teamId]/[projectId]/file/_model/schemas/file.schemas.ts

import { z } from "zod";
import type { ProjectFileDto } from "@/workspace/file/_service/api";
import type { FileCategory, ViewFile } from "../file-page.types";

export const MAX_SIZE_MB: Record<FileCategory, number> = {
  image: 10,
  document: 20,
  other: 30,
};

export const PREVIEWABLE_TEXT_EXTS = new Set(["txt", "md", "csv", "json", "js", "ts", "tsx", "jsx"]);
export const PREVIEWABLE_DOC_EXTS = new Set(["pdf", ...PREVIEWABLE_TEXT_EXTS]);

const ProjectFileSchema = z
  .object({
    id: z.string(),
    fileName: z.string(),
    fileSize: z.union([z.number(), z.string()]),
    mimeType: z.string(),
    createdAt: z.string(),
    fileUrl: z.string(),
    folderId: z.string().nullable().optional(),
    folder: z
      .object({
        id: z.string(),
      })
      .nullable()
      .optional(),
  })
  .passthrough();

const getExt = (name: string) => {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
};

const detectCategory = (fileName: string, mimeType: string): FileCategory => {
  const ext = getExt(fileName);
  if (mimeType.startsWith("image/")) return "image";
  if (["pdf", "txt", "md", "csv", "json", "js", "ts", "tsx", "jsx", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "hwp"].includes(ext)) {
    return "document";
  }
  return "other";
};

export const parseProjectFiles = (input: ProjectFileDto[]): ViewFile[] => {
  const parsed = z.array(ProjectFileSchema).safeParse(input ?? []);
  if (!parsed.success) return [];
  return parsed.data.map((item) => {
    const name = item.fileName;
    const ext = getExt(name);
    return {
      id: item.id,
      name,
      size: Number(item.fileSize || 0),
      mimeType: item.mimeType,
      ext,
      category: detectCategory(name, item.mimeType),
      createdAt: item.createdAt,
      url: item.fileUrl,
      folderId: item.folder?.id ?? item.folderId ?? null,
    };
  });
};

export const detectUploadCategory = (file: File): FileCategory => detectCategory(file.name, file.type);
