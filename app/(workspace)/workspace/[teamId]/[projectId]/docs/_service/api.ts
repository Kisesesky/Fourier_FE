// app/(workspace)/workspace/[teamId]/[projectId]/docs/_service/api.ts
import api from "@/lib/api";
import type { JSONContent } from "@tiptap/react";
import { z } from "zod";
import type { DocumentCommentDto, DocumentDto, DocsAnalyticsDto, FolderDto } from "@/workspace/docs/_model/types/api.types";
import {
  DocumentCommentDtoSchema,
  DocumentDtoSchema,
  DocsAnalyticsSchema,
  FolderDtoSchema,
} from "@/workspace/docs/_model/schemas/docs-api.schemas";

export async function getDocsAnalytics(params: {
  granularity: "hourly" | "daily" | "monthly";
  date?: string;
  month?: string;
  year?: string;
  projectId?: string;
}) {
  const res = await api.get<DocsAnalyticsDto>("/docs/analytics", { params });
  const parsed = DocsAnalyticsSchema.safeParse(res.data);
  return parsed.success ? parsed.data : { counts: [], granularity: params.granularity };
}

export async function listFolders(projectId: string) {
  const res = await api.get<FolderDto[]>("/docs/folders", { params: { projectId } });
  const parsed = z.array(FolderDtoSchema).safeParse(res.data ?? []);
  return parsed.success ? parsed.data : [];
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
  const parsed = z.array(DocumentDtoSchema).safeParse(res.data ?? []);
  return parsed.success ? parsed.data : [];
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
  const parsed = z.array(DocumentDtoSchema).safeParse(res.data ?? []);
  return parsed.success ? parsed.data : [];
}

export async function listDocumentComments(documentId: string) {
  const res = await api.get<DocumentCommentDto[]>(`/docs/document/${documentId}/comments`);
  const parsed = z.array(DocumentCommentDtoSchema).safeParse(res.data ?? []);
  return parsed.success ? parsed.data : [];
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
