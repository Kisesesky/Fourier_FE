// app/(workspace)/workspace/[teamId]/[projectId]/calendar/_model/store/useCalendarViewStore.ts

import { create } from "zustand";
import type { SetStateAction } from "react";
import type { CalendarMemberOption, CalendarType } from "../types";

type CalendarViewState = {
  detailsOpen: boolean;
  manageOpen: boolean;
  manageCalendarId: string | null;
  manageName: string;
  manageColor: string;
  manageError: string | null;
  manageType: CalendarType;
  manageMemberIds: string[];
  memberOptions: CalendarMemberOption[];
  categoryModalOpen: boolean;
  newCategoryName: string;
  newCategoryColor: string;
  setDetailsOpen: (value: SetStateAction<boolean>) => void;
  setManageOpen: (value: SetStateAction<boolean>) => void;
  setManageCalendarId: (value: SetStateAction<string | null>) => void;
  setManageName: (value: SetStateAction<string>) => void;
  setManageColor: (value: SetStateAction<string>) => void;
  setManageError: (value: SetStateAction<string | null>) => void;
  setManageType: (value: SetStateAction<CalendarType>) => void;
  setManageMemberIds: (value: SetStateAction<string[]>) => void;
  setMemberOptions: (value: SetStateAction<CalendarMemberOption[]>) => void;
  setCategoryModalOpen: (value: SetStateAction<boolean>) => void;
  setNewCategoryName: (value: SetStateAction<string>) => void;
  setNewCategoryColor: (value: SetStateAction<string>) => void;
  resetCalendarViewState: () => void;
};

const resolve = <T,>(next: SetStateAction<T>, prev: T): T =>
  typeof next === "function" ? (next as (value: T) => T)(prev) : next;

const initialState = {
  detailsOpen: false,
  manageOpen: false,
  manageCalendarId: null as string | null,
  manageName: "",
  manageColor: "#0c66e4",
  manageError: null as string | null,
  manageType: "TEAM" as CalendarType,
  manageMemberIds: [] as string[],
  memberOptions: [] as CalendarMemberOption[],
  categoryModalOpen: false,
  newCategoryName: "",
  newCategoryColor: "#0c66e4",
};

export const useCalendarViewStore = create<CalendarViewState>((set) => ({
  ...initialState,
  setDetailsOpen: (value) => set((state) => ({ detailsOpen: resolve(value, state.detailsOpen) })),
  setManageOpen: (value) => set((state) => ({ manageOpen: resolve(value, state.manageOpen) })),
  setManageCalendarId: (value) => set((state) => ({ manageCalendarId: resolve(value, state.manageCalendarId) })),
  setManageName: (value) => set((state) => ({ manageName: resolve(value, state.manageName) })),
  setManageColor: (value) => set((state) => ({ manageColor: resolve(value, state.manageColor) })),
  setManageError: (value) => set((state) => ({ manageError: resolve(value, state.manageError) })),
  setManageType: (value) => set((state) => ({ manageType: resolve(value, state.manageType) })),
  setManageMemberIds: (value) => set((state) => ({ manageMemberIds: resolve(value, state.manageMemberIds) })),
  setMemberOptions: (value) => set((state) => ({ memberOptions: resolve(value, state.memberOptions) })),
  setCategoryModalOpen: (value) => set((state) => ({ categoryModalOpen: resolve(value, state.categoryModalOpen) })),
  setNewCategoryName: (value) => set((state) => ({ newCategoryName: resolve(value, state.newCategoryName) })),
  setNewCategoryColor: (value) => set((state) => ({ newCategoryColor: resolve(value, state.newCategoryColor) })),
  resetCalendarViewState: () => set(initialState),
}));

