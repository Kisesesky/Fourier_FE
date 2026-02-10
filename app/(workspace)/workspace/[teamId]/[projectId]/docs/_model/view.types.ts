// app/(workspace)/workspace/[teamId]/[projectId]/docs/_model/view.types.ts

import type { Editor } from "@tiptap/react";

export type AlignKey = "left" | "center" | "right";

export type DocsSortKey = "title" | "updatedAt" | "owner";

export type DocsFilterKey = "all" | "starred" | "shared" | "recent";

export type DocsSortOption = {
  key: DocsSortKey;
  label: string;
};

export type DocTab = {
  id: string;
  title: string;
};

export type HistoryItem = DocTab & { closedAt: string };

export type SlashMenuItem = {
  key: string;
  label: string;
  run: (editor: Editor) => boolean;
};
