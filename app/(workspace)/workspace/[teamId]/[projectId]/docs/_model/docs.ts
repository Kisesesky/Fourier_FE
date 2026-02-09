import type { JSONContent } from "@tiptap/react";
import type { DocExtra, DocFolder, DocMeta, FolderExtra } from "./types";
export type { DocMeta, DocFolder } from "./types";
import {
  createDocument as createDocumentApi,
  createFolder as createFolderApi,
  deleteDocument as deleteDocumentApi,
  deleteFolder as deleteFolderApi,
  deserializeDocContent,
  listDocuments,
  listFolders,
  moveFolder as moveFolderApi,
  serializeDocContent,
  updateDocument as updateDocumentApi,
  updateFolder as updateFolderApi,
} from "@/workspace/docs/_service/api";

const LEGACY_FOLDER_KEY = "fd.folders";
const LEGACY_DOC_KEY = "fd.docs";

const now = () => new Date().toISOString();
const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function emitRefresh() {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent("docs:refresh"));
}

function getCurrentProjectId(): string {
  if (!isBrowser()) return "";
  const pathname = window.location.pathname || "";
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "workspace" || segments.length < 3) return "";
  return decodeURIComponent(segments[2] ?? "");
}

function getFolderKey(projectId: string) {
  return `fd.folders:${projectId || "global"}`;
}

function getDocKey(projectId: string) {
  return `fd.docs:${projectId || "global"}`;
}

function clearLegacyDocsCache() {
  if (!isBrowser()) return;
  localStorage.removeItem(LEGACY_FOLDER_KEY);
  localStorage.removeItem(LEGACY_DOC_KEY);
}

function normalizeFolders(items: DocFolder[]): DocFolder[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    icon: item.icon,
    color: item.color,
    parentId: item.parentId ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

function normalizeDocs(items: DocMeta[]): DocMeta[] {
  return items.map((item) => ({
    ...item,
    folderId: item.folderId ?? null,
    locations: item.locations ?? (item.folderId ? [item.folderId] : []),
    content: item.content || emptyContent(),
    owner: item.owner || "User",
    ownerAvatarUrl: item.ownerAvatarUrl ?? null,
    createdAt: item.createdAt || now(),
    updatedAt: item.updatedAt || now(),
  }));
}

function mapFolderDto(item: { id: string; name: string; parentId?: string | null; createdAt: string; updatedAt: string }): DocFolder {
  return {
    id: item.id,
    name: item.name === "Docs" ? "프로젝트 폴더" : item.name,
    parentId: item.parentId ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapDocumentDto(item: {
  id: string;
  title: string;
  content?: string | null;
  starred?: boolean;
  folderId?: string | null;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}): DocMeta {
  const folderId = item.folderId ?? null;
  return {
    id: item.id,
    title: item.title,
    folderId,
    locations: folderId ? [folderId] : [],
    owner: item.authorName || "User",
    ownerAvatarUrl: item.authorAvatarUrl ?? null,
    content: deserializeDocContent(item.content),
    starred: Boolean(item.starred),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export const getFolders = (): DocFolder[] => {
  const projectId = getCurrentProjectId();
  return normalizeFolders(read(getFolderKey(projectId), [] as DocFolder[]));
};
export const getDocs = (): DocMeta[] => {
  const projectId = getCurrentProjectId();
  return normalizeDocs(read(getDocKey(projectId), [] as DocMeta[]));
};

export const saveFolders = (v: DocFolder[]) => {
  const projectId = getCurrentProjectId();
  write(getFolderKey(projectId), normalizeFolders(v));
  emitRefresh();
};

export const saveDocs = (v: DocMeta[]) => {
  const projectId = getCurrentProjectId();
  write(getDocKey(projectId), normalizeDocs(v));
  emitRefresh();
};

export async function syncDocsFromServer() {
  const projectId = getCurrentProjectId();
  if (!projectId) {
    const emptyFolders: DocFolder[] = [];
    const emptyDocs: DocMeta[] = [];
    write(getFolderKey(projectId), emptyFolders);
    write(getDocKey(projectId), emptyDocs);
    emitRefresh();
    return { folders: emptyFolders, docs: emptyDocs };
  }
  const [folders, docs] = await Promise.all([listFolders(projectId), listDocuments(projectId)]);
  const nextFolders = folders.map(mapFolderDto);
  const nextDocs = docs.map(mapDocumentDto);
  write(getFolderKey(projectId), nextFolders);
  write(getDocKey(projectId), nextDocs);
  clearLegacyDocsCache();
  emitRefresh();
  return { folders: nextFolders, docs: nextDocs };
}

export async function createFolder(name: string, parentId?: string, extra?: FolderExtra) {
  const projectId = getCurrentProjectId();
  if (!projectId) throw new Error("projectId not found");
  const created = await createFolderApi({ projectId, name, parentId });
  const folder: DocFolder = {
    id: created.id,
    name: created.name,
    parentId: created.parentId ?? null,
    color: extra?.color ?? "#94a3b8",
    icon: extra?.icon ?? "📁",
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  };
  const folders = [...getFolders(), folder];
  saveFolders(folders);
  return folder;
}

export async function createDoc(title: string, parentId?: string, extra?: DocExtra) {
  const projectId = getCurrentProjectId();
  if (!projectId) throw new Error("projectId not found");
  const created = await createDocumentApi({
    projectId,
    title,
    folderId: parentId,
    content: serializeDocContent(emptyContent()),
    starred: false,
  });

  const doc: DocMeta = {
    id: created.id,
    title: created.title,
    folderId: created.folderId ?? parentId ?? null,
    locations: created.folderId ? [created.folderId] : parentId ? [parentId] : [],
    color: extra?.color ?? "#e5e7eb",
    icon: extra?.icon ?? "📄",
    starred: false,
    owner: created.authorName || "User",
    ownerAvatarUrl: null,
    content: deserializeDocContent(created.content),
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  };

  const docs = [...getDocs(), doc];
  saveDocs(docs);
  return doc;
}

export async function renameFolder(id: string, name: string) {
  await updateFolderApi(id, { name });
  saveFolders(getFolders().map((f) => (f.id === id ? { ...f, name, updatedAt: now() } : f)));
}

export async function renameDoc(id: string, title: string) {
  await updateDocumentApi(id, { title });
  saveDocs(getDocs().map((d) => (d.id === id ? { ...d, title, updatedAt: now() } : d)));
}

export async function setDocStarred(id: string, starred: boolean) {
  await updateDocumentApi(id, { starred });
  saveDocs(getDocs().map((d) => (d.id === id ? { ...d, starred, updatedAt: now() } : d)));
}

export function addDocLocation(docId: string, folderId: string) {
  const current = getDocs();
  const target = current.find((d) => d.id === docId);
  if (!target) return;
  void updateDocumentApi(docId, { folderId });
  saveDocs(
    current.map((d) =>
      d.id !== docId
        ? d
        : {
            ...d,
            folderId,
            locations: d.locations.includes(folderId) ? d.locations : [...d.locations, folderId],
            updatedAt: now(),
          },
    ),
  );
}

export function removeDocLocation(docId: string, folderId: string) {
  const current = getDocs();
  const target = current.find((d) => d.id === docId);
  if (!target) return;
  const nextLocations = target.locations.filter((loc) => loc !== folderId);
  const nextFolderId = nextLocations[0] ?? null;
  void updateDocumentApi(docId, { folderId: nextFolderId });
  saveDocs(
    current.map((d) =>
      d.id !== docId
        ? d
        : {
            ...d,
            folderId: nextFolderId,
            locations: nextLocations,
            updatedAt: now(),
          },
    ),
  );
}

export async function moveDocToFolder(docId: string, folderId: string | null) {
  await updateDocumentApi(docId, { folderId });
  saveDocs(
    getDocs().map((d) =>
      d.id !== docId
        ? d
        : {
            ...d,
            folderId,
            locations: folderId ? [folderId] : [],
            updatedAt: now(),
          },
    ),
  );
}

export async function moveFolder(folderId: string, newParentId: string | null) {
  await moveFolderApi(folderId, newParentId);
  saveFolders(
    getFolders().map((f) =>
      f.id !== folderId
        ? f
        : { ...f, parentId: newParentId, updatedAt: now() },
    ),
  );
}

export async function deleteFolder(folderId: string, fullDelete: boolean) {
  const folders = getFolders();
  const target = folders.find((f) => f.id === folderId);
  if (!target) return;

  if (!fullDelete) {
    const parentId = target.parentId ?? null;
    const children = folders.filter((f) => f.parentId === folderId);
    const docsInFolder = getDocs().filter((d) => d.folderId === folderId);
    await Promise.all([
      ...children.map((child) => updateFolderApi(child.id, { parentId })),
      ...docsInFolder.map((doc) => updateDocumentApi(doc.id, { folderId: parentId })),
    ]);
  }

  await deleteFolderApi(folderId);
  await syncDocsFromServer();
}

export async function deleteDoc(docId: string) {
  await deleteDocumentApi(docId);
  saveDocs(getDocs().filter((d) => d.id !== docId));
}

export const getDocMeta = (id: string) => getDocs().find((d) => d.id === id) ?? null;
export const getFolderMeta = (id: string) => getFolders().find((f) => f.id === id) ?? null;

export function getDocsInFolder(folderId: string) {
  const docs = getDocs();
  if (folderId === "all") return docs;
  if (folderId === "unfiled") return docs.filter((d) => d.locations.length === 0);
  return docs.filter((d) => d.locations.includes(folderId));
}

export const getFoldersInFolder = (folderId: string) => getFolders().filter((f) => f.parentId === folderId);

export function getDocLocations(doc: DocMeta) {
  const folders = getFolders();
  return doc.locations
    .map((id) => folders.find((f) => f.id === id))
    .filter(Boolean);
}

export function patchDocMeta(id: string, patch: Partial<DocMeta>) {
  const docs = getDocs().map((d) => (d.id === id ? { ...d, ...patch, updatedAt: now() } : d));
  saveDocs(docs);

  const payload: { title?: string; folderId?: string | null; content?: string; starred?: boolean } = {};
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.folderId !== undefined) payload.folderId = patch.folderId;
  if (patch.content !== undefined) payload.content = serializeDocContent(patch.content as JSONContent);
  if (patch.starred !== undefined) payload.starred = patch.starred;
  if (Object.keys(payload).length > 0) {
    void updateDocumentApi(id, payload).catch(() => {});
  }
}

function emptyContent(): JSONContent {
  return { type: "doc", content: [] };
}
