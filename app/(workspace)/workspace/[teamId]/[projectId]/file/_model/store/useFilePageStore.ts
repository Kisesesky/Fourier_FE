// app/(workspace)/workspace/[teamId]/[projectId]/file/_model/store/useFilePageStore.ts

import { create } from "zustand";
import type { ViewFile } from "../file-page.types";

type FilePageState = {
  files: ViewFile[];
  errorMessage: string;
  previewFile: ViewFile | null;
  previewText: string;
  previewLoading: boolean;
  setFiles: (files: ViewFile[]) => void;
  setErrorMessage: (message: string) => void;
  setPreviewFile: (file: ViewFile | null) => void;
  setPreviewText: (text: string) => void;
  setPreviewLoading: (loading: boolean) => void;
};

export const useFilePageStore = create<FilePageState>((set) => ({
  files: [],
  errorMessage: "",
  previewFile: null,
  previewText: "",
  previewLoading: false,
  setFiles: (files) => set({ files }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  setPreviewFile: (previewFile) => set({ previewFile }),
  setPreviewText: (previewText) => set({ previewText }),
  setPreviewLoading: (previewLoading) => set({ previewLoading }),
}));
