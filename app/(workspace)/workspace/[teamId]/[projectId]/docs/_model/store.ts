// store.ts
"use client";

import { create } from "zustand";

type SelectionState = {
  selectedDocs: string[];
  toggleDoc: (id: string) => void;
  selectDoc: (id: string) => void;
  selectMany: (ids: string[]) => void;
  clear: () => void;
};

export const useDocSelection = create<SelectionState>((set) => ({
  selectedDocs: [],

  toggleDoc: (id) =>
    set((state) => {
      return state.selectedDocs.includes(id)
        ? { selectedDocs: state.selectedDocs.filter((d) => d !== id) }
        : { selectedDocs: [...state.selectedDocs, id] };
    }),

  selectDoc: (id) => set(() => ({ selectedDocs: [id] })),

  selectMany: (ids) => set(() => ({ selectedDocs: ids })),

  clear: () => set(() => ({ selectedDocs: [] })),
}));
