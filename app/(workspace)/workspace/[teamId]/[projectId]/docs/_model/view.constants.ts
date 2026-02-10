// app/(workspace)/workspace/[teamId]/[projectId]/docs/_model/view.constants.ts

import type { DocsSortOption, SlashMenuItem } from "./view.types";

export const DOCS_SORT_OPTIONS: DocsSortOption[] = [
  { key: "title", label: "이름" },
  { key: "owner", label: "소유자" },
  { key: "updatedAt", label: "수정 날짜" },
];

export const DOC_TAB_STORAGE_KEY = "fd.docs.openTabs";
export const DOC_HISTORY_STORAGE_KEY = "fd.docs.closedTabs";
export const DOC_MAX_HISTORY = 6;

export const DOC_SLASH_MENU_ITEMS: SlashMenuItem[] = [
  {
    key: "h2",
    label: "Heading 2",
    run: (editor) =>
      editor
        .chain()
        .focus()
        .insertContent({
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Heading 2" }],
        })
        .run(),
  },
  {
    key: "h3",
    label: "Heading 3",
    run: (editor) =>
      editor
        .chain()
        .focus()
        .insertContent({
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: "Heading 3" }],
        })
        .run(),
  },
  {
    key: "ul",
    label: "Bullet List",
    run: (editor) =>
      editor
        .chain()
        .focus()
        .insertContent({
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [{ type: "paragraph", content: [{ type: "text", text: "List item" }] }],
            },
          ],
        })
        .run(),
  },
  {
    key: "hr",
    label: "Divider",
    run: (editor) =>
      editor
        .chain()
        .focus()
        .insertContent({ type: "horizontalRule" })
        .run(),
  },
];
