// app/(workspace)/workspace/[teamId]/[projectId]/docs/_model/hooks/useDocOutline.ts
'use client';

import type { JSONContent } from "@tiptap/react";

export interface OutlineItem {
  id: string;
  level: number;
  text: string;
}

export function createDocOutline(doc: JSONContent) {
  const result: { id: string; level: number; text: string }[] = [];

  if (!doc || !Array.isArray(doc.content)) return result;

  doc.content.forEach((node, index) => {
    if (node.type === "heading") {
      result.push({
        id: `h-${index}`,
        level: node.attrs?.level ?? 1,
        text: node.content?.map((c) => c.text).join("") ?? "",
      });
    }
  });

  return result;
}
