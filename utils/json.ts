// utils/json.ts
import type { JSONContent } from "@tiptap/react";

export function textToJSON(text: string): JSONContent {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ],
  };
}
