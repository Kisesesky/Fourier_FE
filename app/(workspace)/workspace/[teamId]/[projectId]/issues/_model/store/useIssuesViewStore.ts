// app/(workspace)/workspace/[teamId]/[projectId]/issues/_model/store/useIssuesViewStore.ts

import { create } from "zustand";
import type { SetStateAction } from "react";
import type { Issue } from "../types";
import type { ViewMode } from "../board.types";

type IssuesViewState = {
  tableStatusFilter: Record<string, Set<Issue["status"]>>;
  tablePriorityFilter: Record<string, Set<Issue["priority"]>>;
  tableOwnerFilter: Record<string, Set<string>>;
  tableDateFilter: Record<string, Set<string>>;
  tablePrioritySort: Record<string, "none" | "asc" | "desc">;
  tableOwnerSort: Record<string, "none" | "asc" | "desc">;
  tableDateSort: Record<string, "none" | "asc" | "desc">;
  openFilter: string | null;
  view: ViewMode;
  setTableStatusFilter: (value: SetStateAction<Record<string, Set<Issue["status"]>>>) => void;
  setTablePriorityFilter: (value: SetStateAction<Record<string, Set<Issue["priority"]>>>) => void;
  setTableOwnerFilter: (value: SetStateAction<Record<string, Set<string>>>) => void;
  setTableDateFilter: (value: SetStateAction<Record<string, Set<string>>>) => void;
  setTablePrioritySort: (value: SetStateAction<Record<string, "none" | "asc" | "desc">>) => void;
  setTableOwnerSort: (value: SetStateAction<Record<string, "none" | "asc" | "desc">>) => void;
  setTableDateSort: (value: SetStateAction<Record<string, "none" | "asc" | "desc">>) => void;
  setOpenFilter: (value: SetStateAction<string | null>) => void;
  setView: (value: SetStateAction<ViewMode>) => void;
  resetIssuesViewState: () => void;
};

const resolve = <T,>(next: SetStateAction<T>, prev: T): T =>
  typeof next === "function" ? (next as (value: T) => T)(prev) : next;

const initialState = {
  tableStatusFilter: {},
  tablePriorityFilter: {},
  tableOwnerFilter: {},
  tableDateFilter: {},
  tablePrioritySort: {},
  tableOwnerSort: {},
  tableDateSort: {},
  openFilter: null,
  view: "table" as ViewMode,
};

export const useIssuesViewStore = create<IssuesViewState>((set) => ({
  ...initialState,
  setTableStatusFilter: (value) => set((state) => ({ tableStatusFilter: resolve(value, state.tableStatusFilter) })),
  setTablePriorityFilter: (value) => set((state) => ({ tablePriorityFilter: resolve(value, state.tablePriorityFilter) })),
  setTableOwnerFilter: (value) => set((state) => ({ tableOwnerFilter: resolve(value, state.tableOwnerFilter) })),
  setTableDateFilter: (value) => set((state) => ({ tableDateFilter: resolve(value, state.tableDateFilter) })),
  setTablePrioritySort: (value) => set((state) => ({ tablePrioritySort: resolve(value, state.tablePrioritySort) })),
  setTableOwnerSort: (value) => set((state) => ({ tableOwnerSort: resolve(value, state.tableOwnerSort) })),
  setTableDateSort: (value) => set((state) => ({ tableDateSort: resolve(value, state.tableDateSort) })),
  setOpenFilter: (value) => set((state) => ({ openFilter: resolve(value, state.openFilter) })),
  setView: (value) => set((state) => ({ view: resolve(value, state.view) })),
  resetIssuesViewState: () => set(initialState),
}));
