// app/(workspace)/workspace/[teamId]/[projectId]/file/_service/api.ts
import api from "@/lib/api";
import { z } from "zod";
import type { FileFolderDto, ProjectFileDto, UploadedProjectFileDto } from "@/workspace/file/_model/types/api.types";
import {
  FileFolderDtoSchema,
  ProjectFileDtoSchema,
  UploadedProjectFileDtoSchema,
} from "@/workspace/file/_model/schemas/file-api.schemas";

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
  const res = await api.post<UploadedProjectFileDto>("/files/project/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const parsed = UploadedProjectFileDtoSchema.safeParse(res.data);
  return parsed.success ? parsed.data : res.data;
}

export async function deleteProjectFile(fileId: string) {
  const res = await api.delete<{ ok: boolean }>(`/files/${fileId}`);
  return res.data;
}
