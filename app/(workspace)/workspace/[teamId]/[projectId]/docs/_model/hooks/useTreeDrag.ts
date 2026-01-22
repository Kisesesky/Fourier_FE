"use client";

import { moveFolder, moveDocToFolder } from "../docs";
import { TreeContextTarget } from "../types";

export function useTreeDrag() {
  const onDragStart = (e: React.DragEvent, item: TreeContextTarget) => {
    e.dataTransfer.setData("application/tree-item", JSON.stringify(item));
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();

    const raw = e.dataTransfer.getData("application/tree-item");
    if (!raw) return;

    const item: TreeContextTarget = JSON.parse(raw);

    if (item.type === "doc") {
      moveDocToFolder(item.id, targetFolderId);
    } else if (item.type === "folder") {
      moveFolder(item.id, targetFolderId);
    }
  };

  return { onDragStart, onDragOver, onDrop };
}
