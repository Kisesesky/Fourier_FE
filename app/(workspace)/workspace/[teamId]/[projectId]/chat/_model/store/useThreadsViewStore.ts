// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/store/useThreadsViewStore.ts

import { create } from "zustand";
import type { SetStateAction } from "react";

type SortMode = "recent" | "oldest";
type SearchMode = "content" | "author";

type ThreadsViewState = {
  sortMode: SortMode;
  expanded: Set<string>;
  query: string;
  searchMode: SearchMode;
  editingId: string | null;
  draft: string;
  selectedId: string | null;
  filterOpen: boolean;
  setSortMode: (value: SetStateAction<SortMode>) => void;
  setExpanded: (value: SetStateAction<Set<string>>) => void;
  setQuery: (value: SetStateAction<string>) => void;
  setSearchMode: (value: SetStateAction<SearchMode>) => void;
  setEditingId: (value: SetStateAction<string | null>) => void;
  setDraft: (value: SetStateAction<string>) => void;
  setSelectedId: (value: SetStateAction<string | null>) => void;
  setFilterOpen: (value: SetStateAction<boolean>) => void;
  resetThreadsViewState: () => void;
};

const resolve = <T,>(next: SetStateAction<T>, prev: T): T =>
  typeof next === "function" ? (next as (value: T) => T)(prev) : next;

const initialState = {
  sortMode: "recent" as SortMode,
  expanded: new Set<string>(),
  query: "",
  searchMode: "content" as SearchMode,
  editingId: null as string | null,
  draft: "",
  selectedId: null as string | null,
  filterOpen: false,
};

export const useThreadsViewStore = create<ThreadsViewState>((set) => ({
  ...initialState,
  setSortMode: (value) => set((state) => ({ sortMode: resolve(value, state.sortMode) })),
  setExpanded: (value) => set((state) => ({ expanded: resolve(value, state.expanded) })),
  setQuery: (value) => set((state) => ({ query: resolve(value, state.query) })),
  setSearchMode: (value) => set((state) => ({ searchMode: resolve(value, state.searchMode) })),
  setEditingId: (value) => set((state) => ({ editingId: resolve(value, state.editingId) })),
  setDraft: (value) => set((state) => ({ draft: resolve(value, state.draft) })),
  setSelectedId: (value) => set((state) => ({ selectedId: resolve(value, state.selectedId) })),
  setFilterOpen: (value) => set((state) => ({ filterOpen: resolve(value, state.filterOpen) })),
  resetThreadsViewState: () => set(initialState),
}));

