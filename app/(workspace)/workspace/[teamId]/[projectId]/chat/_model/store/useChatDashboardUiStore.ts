// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/store/useChatDashboardUiStore.ts

import { create } from "zustand";
import type { SetStateAction } from "react";

type FilterKey = "all" | "starred" | "unread" | "mentions" | "dm";
type ListMode = "all" | "unreads";

type ChatDashboardUiState = {
  filter: FilterKey;
  query: string;
  listMode: ListMode;
  showArchived: boolean;
  mentionsOnly: boolean;
  menuOpen: boolean;
  setFilter: (value: SetStateAction<FilterKey>) => void;
  setQuery: (value: SetStateAction<string>) => void;
  setListMode: (value: SetStateAction<ListMode>) => void;
  setShowArchived: (value: SetStateAction<boolean>) => void;
  setMentionsOnly: (value: SetStateAction<boolean>) => void;
  setMenuOpen: (value: SetStateAction<boolean>) => void;
  resetChatDashboardUiState: () => void;
};

const resolve = <T,>(next: SetStateAction<T>, prev: T): T =>
  typeof next === "function" ? (next as (value: T) => T)(prev) : next;

const initialState = {
  filter: "all" as FilterKey,
  query: "",
  listMode: "all" as ListMode,
  showArchived: false,
  mentionsOnly: false,
  menuOpen: false,
};

export const useChatDashboardUiStore = create<ChatDashboardUiState>((set) => ({
  ...initialState,
  setFilter: (value) => set((state) => ({ filter: resolve(value, state.filter) })),
  setQuery: (value) => set((state) => ({ query: resolve(value, state.query) })),
  setListMode: (value) => set((state) => ({ listMode: resolve(value, state.listMode) })),
  setShowArchived: (value) => set((state) => ({ showArchived: resolve(value, state.showArchived) })),
  setMentionsOnly: (value) => set((state) => ({ mentionsOnly: resolve(value, state.mentionsOnly) })),
  setMenuOpen: (value) => set((state) => ({ menuOpen: resolve(value, state.menuOpen) })),
  resetChatDashboardUiState: () => set(initialState),
}));

