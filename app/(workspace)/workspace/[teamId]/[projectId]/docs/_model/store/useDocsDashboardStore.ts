// app/(workspace)/workspace/[teamId]/[projectId]/docs/_model/store/useDocsDashboardStore.ts

import { create } from "zustand";
import type { SetStateAction } from "react";
import type { DocMeta, DocFolder } from "../types";
import type { DocsSortKey } from "../view.types";
import type { DocumentCommentDto } from "@/workspace/docs/_service/api";

type DocsDashboardState = {
  docs: DocMeta[];
  folders: DocFolder[];
  activeFolder: "all" | "unfiled" | string;
  query: string;
  viewMode: "grid" | "list";
  sortKey: DocsSortKey;
  sortDir: "asc" | "desc";
  folderModalOpen: boolean;
  commentsByDoc: Record<string, DocumentCommentDto[]>;
  commentCountByDoc: Record<string, number>;
  openCommentsByDoc: Record<string, boolean>;
  expandedDocsByDoc: Record<string, boolean>;
  visibleCommentsByDoc: Record<string, number>;
  loadingCommentsByDoc: Record<string, boolean>;
  draftByDoc: Record<string, string>;
  savingByDoc: Record<string, boolean>;
  setDocs: (value: SetStateAction<DocMeta[]>) => void;
  setFolders: (value: SetStateAction<DocFolder[]>) => void;
  setActiveFolder: (value: SetStateAction<"all" | "unfiled" | string>) => void;
  setQuery: (value: SetStateAction<string>) => void;
  setViewMode: (value: SetStateAction<"grid" | "list">) => void;
  setSortKey: (value: SetStateAction<DocsSortKey>) => void;
  setSortDir: (value: SetStateAction<"asc" | "desc">) => void;
  setFolderModalOpen: (value: SetStateAction<boolean>) => void;
  setCommentsByDoc: (value: SetStateAction<Record<string, DocumentCommentDto[]>>) => void;
  setCommentCountByDoc: (value: SetStateAction<Record<string, number>>) => void;
  setOpenCommentsByDoc: (value: SetStateAction<Record<string, boolean>>) => void;
  setExpandedDocsByDoc: (value: SetStateAction<Record<string, boolean>>) => void;
  setVisibleCommentsByDoc: (value: SetStateAction<Record<string, number>>) => void;
  setLoadingCommentsByDoc: (value: SetStateAction<Record<string, boolean>>) => void;
  setDraftByDoc: (value: SetStateAction<Record<string, string>>) => void;
  setSavingByDoc: (value: SetStateAction<Record<string, boolean>>) => void;
  resetDocsDashboardState: () => void;
};

const resolve = <T,>(next: SetStateAction<T>, prev: T): T =>
  typeof next === "function" ? (next as (value: T) => T)(prev) : next;

const initialState = {
  docs: [] as DocMeta[],
  folders: [] as DocFolder[],
  activeFolder: "all" as "all" | "unfiled" | string,
  query: "",
  viewMode: "list" as "grid" | "list",
  sortKey: "title" as DocsSortKey,
  sortDir: "asc" as "asc" | "desc",
  folderModalOpen: false,
  commentsByDoc: {} as Record<string, DocumentCommentDto[]>,
  commentCountByDoc: {} as Record<string, number>,
  openCommentsByDoc: {} as Record<string, boolean>,
  expandedDocsByDoc: {} as Record<string, boolean>,
  visibleCommentsByDoc: {} as Record<string, number>,
  loadingCommentsByDoc: {} as Record<string, boolean>,
  draftByDoc: {} as Record<string, string>,
  savingByDoc: {} as Record<string, boolean>,
};

export const useDocsDashboardStore = create<DocsDashboardState>((set) => ({
  ...initialState,
  setDocs: (value) => set((state) => ({ docs: resolve(value, state.docs) })),
  setFolders: (value) => set((state) => ({ folders: resolve(value, state.folders) })),
  setActiveFolder: (value) => set((state) => ({ activeFolder: resolve(value, state.activeFolder) })),
  setQuery: (value) => set((state) => ({ query: resolve(value, state.query) })),
  setViewMode: (value) => set((state) => ({ viewMode: resolve(value, state.viewMode) })),
  setSortKey: (value) => set((state) => ({ sortKey: resolve(value, state.sortKey) })),
  setSortDir: (value) => set((state) => ({ sortDir: resolve(value, state.sortDir) })),
  setFolderModalOpen: (value) => set((state) => ({ folderModalOpen: resolve(value, state.folderModalOpen) })),
  setCommentsByDoc: (value) => set((state) => ({ commentsByDoc: resolve(value, state.commentsByDoc) })),
  setCommentCountByDoc: (value) => set((state) => ({ commentCountByDoc: resolve(value, state.commentCountByDoc) })),
  setOpenCommentsByDoc: (value) => set((state) => ({ openCommentsByDoc: resolve(value, state.openCommentsByDoc) })),
  setExpandedDocsByDoc: (value) => set((state) => ({ expandedDocsByDoc: resolve(value, state.expandedDocsByDoc) })),
  setVisibleCommentsByDoc: (value) => set((state) => ({ visibleCommentsByDoc: resolve(value, state.visibleCommentsByDoc) })),
  setLoadingCommentsByDoc: (value) => set((state) => ({ loadingCommentsByDoc: resolve(value, state.loadingCommentsByDoc) })),
  setDraftByDoc: (value) => set((state) => ({ draftByDoc: resolve(value, state.draftByDoc) })),
  setSavingByDoc: (value) => set((state) => ({ savingByDoc: resolve(value, state.savingByDoc) })),
  resetDocsDashboardState: () => set(initialState),
}));
