"use client";

import { useEffect, useState } from "react";
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
      if (!f.parentId) roots.push(folderMap[f.id]);
      else {
        const parent = folderMap[f.parentId];
        parent ? parent.children.push(folderMap[f.id]) : roots.push(folderMap[f.id]);
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

      if (!folderId) roots.push(node);
      else {
        const parent = folderMap[folderId];
        parent ? parent.children.push(node) : roots.push(node);
      }
    });

    return roots;
  };

  const refresh = () => setTree(buildTree());

  useEffect(() => {
    refresh();
    const unsub = subscribeDocsEvent(refresh);
    return () => unsub();
  }, []);

  return { tree, refresh };
}
