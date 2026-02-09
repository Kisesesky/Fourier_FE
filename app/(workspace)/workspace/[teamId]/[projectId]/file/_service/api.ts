import api from "@/lib/api";

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

export async function listFileFolders(projectId: string) {
  const res = await api.get<FileFolderDto[]>("/files/folders", { params: { projectId } });
  return res.data ?? [];
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
  return res.data ?? [];
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

