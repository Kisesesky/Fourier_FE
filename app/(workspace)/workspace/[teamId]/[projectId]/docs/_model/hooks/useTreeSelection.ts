"use client";

import { create } from "zustand";
import { SelectionState, DocID, FolderID } from "../types";

type SelectionActions = {
  clear: () => void;

  toggleDoc: (id: DocID) => void;
  selectDoc: (id: DocID) => void;
  unselectDoc: (id: DocID) => void;
  selectManyDocs: (ids: DocID[]) => void;
  isSelectedDoc: (id: DocID) => boolean;

  toggleFolder: (id: FolderID) => void;
  selectFolder: (id: FolderID) => void;
  unselectFolder: (id: FolderID) => void;
  selectManyFolders: (ids: FolderID[]) => void;
  isSelectedFolder: (id: FolderID) => boolean;
};

export const useTreeSelection = create<SelectionState & SelectionActions>(
  (set, get) => ({
    docs: new Set(),
    folders: new Set(),

    clear: () => set({ docs: new Set(), folders: new Set() }),

    toggleDoc: (id) =>
      set((s) => {
        const d = new Set(s.docs);
        d.has(id) ? d.delete(id) : d.add(id);
        return { docs: d };
      }),

    selectDoc: (id) =>
      set((s) => ({ docs: new Set([...s.docs, id]) })),

    unselectDoc: (id) =>
      set((s) => {
        const d = new Set(s.docs);
        d.delete(id);
        return { docs: d };
      }),

    selectManyDocs: (ids) =>
      set((s) => ({ docs: new Set([...s.docs, ...ids]) })),

    isSelectedDoc: (id) => get().docs.has(id),

    toggleFolder: (id) =>
      set((s) => {
        const f = new Set(s.folders);
        f.has(id) ? f.delete(id) : f.add(id);
        return { folders: f };
      }),

    selectFolder: (id) =>
      set((s) => ({ folders: new Set([...s.folders, id]) })),

    unselectFolder: (id) =>
      set((s) => {
        const f = new Set(s.folders);
        f.delete(id);
        return { folders: f };
      }),

    selectManyFolders: (ids) =>
      set((s) => ({ folders: new Set([...s.folders, ...ids]) })),

    isSelectedFolder: (id) => get().folders.has(id),
  })
);
