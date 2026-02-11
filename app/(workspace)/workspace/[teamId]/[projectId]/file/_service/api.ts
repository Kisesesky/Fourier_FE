// app/(workspace)/workspace/[teamId]/[projectId]/file/_service/api.ts
import api from "@/lib/api";
import { z } from "zod";

export type FileFolderDto = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectFileDto = {
  id: string;
  fileUrl: string;
  thumbnailUrl?: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number | string;
  createdAt: string;
  folder?: { id: string; name: string } | null;
  folderId?: string | null;
};

const FileFolderDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const ProjectFileDtoSchema = z.object({
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

export async function listFileFolders(projectId: string) {
  const res = await api.get<FileFolderDto[]>("/files/folders", { params: { projectId } });
  const parsed = z.array(FileFolderDtoSchema).safeParse(res.data ?? []);
  return parsed.success ? parsed.data : [];
}

export async function createFileFolder(projectId: string, name: string) {
  const res = await api.post<FileFolderDto>("/files/folder", { projectId, name });
  return res.data;
}

export async function updateFileFolder(folderId: string, name: string) {
  const res = await api.patch<FileFolderDto>(`/files/folder/${folderId}`, { name });
  return res.data;
}

export async function deleteFileFolder(folderId: string) {
  const res = await api.delete<{ ok: boolean }>(`/files/folder/${folderId}`);
  return res.data;
}

export async function listProjectFiles(projectId: string, folderId?: string) {
  const res = await api.get<ProjectFileDto[]>("/files", {
    params: {
      projectId,
      folderId: folderId ?? undefined,
    },
  });
  const parsed = z.array(ProjectFileDtoSchema).safeParse(res.data ?? []);
  return parsed.success ? parsed.data : [];
}

export async function uploadProjectFile(projectId: string, file: globalThis.File, folderId?: string) {
  const form = new FormData();
  form.append("projectId", projectId);
  if (folderId) form.append("folderId", folderId);
  form.append("file", file);
  const res = await api.post<{
    id: string;
    name: string;
    fileUrl: string;
    thumbnailUrl?: string | null;
    mimeType: string;
    size: number;
    createdAt: string;
    folderId?: string | null;
  }>("/files/project/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteProjectFile(fileId: string) {
  const res = await api.delete<{ ok: boolean }>(`/files/${fileId}`);
  return res.data;
}
