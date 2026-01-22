// docs.ts (OPTION A — localStorage 기반 완전 통합)

import type { DocExtra, DocFolder, DocMeta, FolderExtra } from "./types";
export type { DocMeta, DocFolder } from "./types";
import { MOCK_DATA } from "@/workspace/docs/lib/mocks/mocks";

/** STORAGE KEYS */
const FOLDER_KEY = "fd.folders";
const DOC_KEY = "fd.docs";

/** UTIL */
const now = () => new Date().toISOString();
const isBrowser = () => typeof window !== "undefined";

/** read/write */
function read(key: string, fallback: any) {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: any) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function emitRefresh() {
  window.dispatchEvent(new CustomEvent("docs:refresh"));
}

/* GETTERS */
export const getFolders = (): DocFolder[] => read(FOLDER_KEY, []);
export const getDocs = (): DocMeta[] => {
  const docs = read(DOC_KEY, []) as DocMeta[];

  return docs.map((d: DocMeta) => ({
    ...d,
    content: d.content || emptyContent(),
  }));
};

export const saveFolders = (v: DocFolder[]) => {
  write(FOLDER_KEY, v);
  emitRefresh();
};
export const saveDocs = (v: DocMeta[]) => {
  write(DOC_KEY, v);
  emitRefresh();
};

/* CREATE FOLDER */
export function createFolder(
  name: string,
  parentId?: string,
  extra?: FolderExtra
) {
  const folders = getFolders();

  const folder: DocFolder = {
    id: crypto.randomUUID(),
    name,
    parentId: parentId ?? null,
    color: extra?.color ?? "#94a3b8",
    icon: extra?.icon ?? "📁",
    createdAt: now(),
    updatedAt: now(),
  };

  folders.push(folder);
  saveFolders(folders);
  return folder;
}

/* CREATE DOC */
export function createDoc(
  title: string,
  parentId?: string,
  extra?: DocExtra
) {
  const docs = getDocs();

  const doc: DocMeta = {
    id: crypto.randomUUID(),
    title,
    folderId: parentId ?? null,
    locations: parentId ? [parentId] : [],
    color: extra?.color ?? "#e5e7eb",
    icon: extra?.icon ?? "📄",
    starred: false,
    owner: "User",
    createdAt: now(),
    updatedAt: now(),
  };

  docs.push(doc);
  saveDocs(docs);
  return doc;
}

/* UPDATE NAMES */
export function renameFolder(id: string, name: string) {
  saveFolders(
    getFolders().map(f =>
      f.id === id ? { ...f, name, updatedAt: now() } : f
    )
  );
}

export function renameDoc(id: string, title: string) {
  saveDocs(
    getDocs().map(d =>
      d.id === id ? { ...d, title, updatedAt: now() } : d
    )
  );
}

/* MULTI-LOCATION */
export function addDocLocation(docId: string, folderId: string) {
  saveDocs(
    getDocs().map(d =>
      d.id !== docId
        ? d
        : {
            ...d,
            locations: d.locations.includes(folderId)
              ? d.locations
              : [...d.locations, folderId],
            updatedAt: now(),
          }
    )
  );
}

export function removeDocLocation(docId: string, folderId: string) {
  saveDocs(
    getDocs().map(d =>
      d.id !== docId
        ? d
        : {
            ...d,
            locations: d.locations.filter(loc => loc !== folderId),
            updatedAt: now(),
          }
    )
  );
}

/* MOVE DOC */
export function moveDocToFolder(docId: string, folderId: string | null) {
  saveDocs(
    getDocs().map(d =>
      d.id !== docId
        ? d
        : {
            ...d,
            locations: folderId ? [folderId] : [],
            updatedAt: now(),
          }
    )
  );
}

/* MOVE FOLDER */
export function moveFolder(folderId: string, newParentId: string | null) {
  const folders = getFolders();

  function isChild(childId: string, parentId: string): boolean {
    const target = folders.find(f => f.id === childId);
    if (!target) return false;
    if (target.parentId === parentId) return true;
    if (!target.parentId) return false;
    return isChild(target.parentId, parentId);
  }

  if (newParentId && isChild(newParentId, folderId)) {
    console.warn("순환 이동 방지됨");
    return;
  }

  saveFolders(
    folders.map(f =>
      f.id !== folderId
        ? f
        : { ...f, parentId: newParentId, updatedAt: now() }
    )
  );
}

/* DELETE FOLDER (fullDelete / move children) */
export function deleteFolder(folderId: string, fullDelete: boolean) {
  const folders = getFolders();
  const docs = getDocs();

  const target = folders.find(f => f.id === folderId);
  if (!target) return;

  const parentId = target.parentId ?? null;

  if (fullDelete) {
    saveFolders(folders.filter(f =>
      f.id !== folderId && f.parentId !== folderId
    ));

    saveDocs(
      docs
        .map(d => ({
          ...d,
          locations: d.locations.filter(loc => loc !== folderId),
        }))
        .filter(d => d.locations.length > 0)
    );

    return;
  }

  saveFolders(
    folders
      .filter(f => f.id !== folderId)
      .map(f =>
        f.parentId === folderId
          ? { ...f, parentId, updatedAt: now() }
          : f
      )
  );

  saveDocs(
    docs.map(d => {
      if (!d.locations.includes(folderId)) return d;

      const next = d.locations.filter(loc => loc !== folderId);
      if (parentId && !next.includes(parentId)) next.push(parentId);

      return { ...d, locations: next, updatedAt: now() };
    })
  );
}

/* DELETE DOC */
export function deleteDoc(docId: string) {
  saveDocs(getDocs().filter(d => d.id !== docId));
}

/* GETTERS */
export const getDocMeta = (id: string) =>
  getDocs().find(d => d.id === id) ?? null;

export const getFolderMeta = (id: string) =>
  getFolders().find(f => f.id === id) ?? null;

export function getDocsInFolder(folderId: string) {
  const docs = getDocs();
  if (folderId === "all") return docs;
  if (folderId === "unfiled") return docs.filter(d => d.locations.length === 0);
  return docs.filter(d => d.locations.includes(folderId));
}

export const getFoldersInFolder = (folderId: string) =>
  getFolders().filter(f => f.parentId === folderId);

export function getDocLocations(doc: DocMeta) {
  const folders = getFolders();
  return doc.locations
    .map(id => folders.find(f => f.id === id))
    .filter(Boolean);
}

export function patchDocMeta(id: string, patch: Partial<DocMeta>) {
  const docs = getDocs().map(d =>
    d.id === id ? { ...d, ...patch, updatedAt: now() } : d
  );
  saveDocs(docs);
}

function ensureInitialData() {
  if (!isBrowser()) return;

  const hasFolders = localStorage.getItem("fd.folders");
  const hasDocs = localStorage.getItem("fd.docs");

  if (!hasFolders && !hasDocs) {
    localStorage.setItem("fd.folders", JSON.stringify(MOCK_DATA.folders));
    localStorage.setItem("fd.docs", JSON.stringify(MOCK_DATA.docs));
    console.log("[Docs] 초기 Mock 데이터가 로딩되었습니다.");
  }
}

// 앱 로드 시 자동 실행
ensureInitialData();

function emptyContent() {
  return { type: "doc", content: [] };
}
