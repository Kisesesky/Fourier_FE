// app/(workspace)/workspace/[teamId]/[projectId]/docs/_model/hooks/useDocTree.ts
'use client';

import { useCallback, useEffect, useState } from "react";
import { getFolders, getDocs } from "../docs";
import { TreeNode, TreeFolder, TreeDoc } from "../types";
import { subscribeDocsEvent } from "../events";

export function useDocTree() {
  const [tree, setTree] = useState<TreeNode[]>([]);

  const buildTree = (): TreeNode[] => {
    const folders = getFolders();
    const docs = getDocs();

    const folderMap: Record<string, TreeFolder> = {};

    folders.forEach((f) => {
      folderMap[f.id] = {
        id: f.id,
        type: "folder",
        name: f.name,
        icon: f.icon,
        color: f.color,
        parentId: f.parentId,
        children: [],
      };
    });

    const roots: TreeNode[] = [];

    folders.forEach((f) => {
      if (!f.parentId) {
        roots.push(folderMap[f.id]);
      } else {
        const parent = folderMap[f.parentId];
        if (parent) {
          parent.children.push(folderMap[f.id]);
        } else {
          roots.push(folderMap[f.id]);
        }
      }
    });

    docs.forEach((d) => {
      const node: TreeDoc = {
        id: d.id,
        type: "doc",
        title: d.title,
        icon: d.icon,
        color: d.color,
        starred: d.starred,
      };

      const folderId = d.folderId;

      if (!folderId) {
        roots.push(node);
      } else {
        const parent = folderMap[folderId];
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      }
    });

    return roots;
  };

  const refresh = useCallback(() => setTree(buildTree()), []);

  useEffect(() => {
    refresh();
    const unsub = subscribeDocsEvent(refresh);
    return () => unsub();
  }, [refresh]);

  return { tree, refresh };
}
