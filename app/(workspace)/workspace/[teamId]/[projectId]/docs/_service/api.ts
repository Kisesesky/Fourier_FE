// app/(workspace)/workspace/[teamId]/[projectId]/docs/_service/api.ts
import api from "@/lib/api";
import type { JSONContent } from "@tiptap/react";

export async function getDocsAnalytics(params: { granularity: "hourly" | "daily" | "monthly"; date?: string; month?: string; year?: string }) {
  const res = await api.get<{ counts: number[]; granularity: string }>("/docs/analytics", { params });
  return res.data;
}

export type FolderDto = {
  id: string;
  name: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentDto = {
  id: string;
  title: string;
  content?: string | null;
  starred?: boolean;
  folderId?: string | null;
  authorId?: string | null;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentCommentDto = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId?: string | null;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  authorRole?: string | null;
  mine?: boolean;
};

export async function listFolders(projectId: string) {
  const res = await api.get<FolderDto[]>("/docs/folders", { params: { projectId } });
  return res.data ?? [];
}

export async function createFolder(payload: { projectId: string; name: string; parentId?: string }) {
  const res = await api.post<FolderDto>("/docs/folder", payload);
  return res.data;
}

export async function updateFolder(id: string, payload: { name?: string; parentId?: string | null }) {
  const res = await api.patch<FolderDto | null>(`/docs/folder/${id}`, payload);
  return res.data;
}

export async function moveFolder(id: string, parentId?: string | null) {
  const res = await api.patch(`/docs/folder/${id}/move`, { parentId: parentId ?? undefined });
  return res.data;
}

export async function deleteFolder(id: string) {
  const res = await api.delete(`/docs/folder/${id}`);
  return res.data;
}

export async function listDocuments(projectId: string) {
  const res = await api.get<DocumentDto[]>("/docs/documents", { params: { projectId } });
  return res.data ?? [];
}

export async function createDocument(payload: { projectId: string; title: string; folderId?: string; content?: string; starred?: boolean }) {
  const res = await api.post<DocumentDto>("/docs/document", payload);
  return res.data;
}

export async function updateDocument(id: string, payload: { title?: string; folderId?: string | null; content?: string; starred?: boolean }) {
  const res = await api.patch<DocumentDto>(`/docs/document/${id}`, payload);
  return res.data;
}

export async function deleteDocument(id: string) {
  const res = await api.delete(`/docs/document/${id}`);
  return res.data;
}

export async function searchDocuments(q: string) {
  const res = await api.get<DocumentDto[]>("/docs/search", { params: { q } });
  return res.data ?? [];
}

export async function listDocumentComments(documentId: string) {
  const res = await api.get<DocumentCommentDto[]>(`/docs/document/${documentId}/comments`);
  return res.data ?? [];
}

export async function createDocumentComment(documentId: string, content: string) {
  const res = await api.post<DocumentCommentDto>(`/docs/document/${documentId}/comment`, { content });
  return res.data;
}

export async function updateDocumentComment(commentId: string, content: string) {
  const res = await api.patch<DocumentCommentDto>(`/docs/comment/${commentId}`, { content });
  return res.data;
}

export async function deleteDocumentComment(commentId: string) {
  const res = await api.delete<{ ok: boolean }>(`/docs/comment/${commentId}`);
  return res.data;
}

export function serializeDocContent(content?: JSONContent | null) {
  if (!content) return "";
  return JSON.stringify(content);
}

export function deserializeDocContent(raw?: string | null): JSONContent {
  if (!raw) return { type: "doc", content: [] };
  try {
    const parsed = JSON.parse(raw) as JSONContent;
    if (parsed && typeof parsed === "object" && parsed.type) {
      return parsed;
    }
  } catch {
    // fallback to paragraph
  }
  return {
    type: "doc",
    content: raw.trim()
      ? [{ type: "paragraph", content: [{ type: "text", text: raw }] }]
      : [],
  };
}
