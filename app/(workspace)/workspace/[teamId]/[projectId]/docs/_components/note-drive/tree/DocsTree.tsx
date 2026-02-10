// app/(workspace)/workspace/[teamId]/[projectId]/docs/_components/note-drive/tree/DocsTree.tsx
'use client';

import { useState } from "react";
import FolderNode from "./FolderNode";
import DocNode from "./DocNode";
import { useDocTree } from "../../../_model/hooks/useDocTree";
import { TreeNode, TreeContextTarget } from "../../../_model/types";
import TreeContextMenu from "./TreeContextMenu";

export default function DocsTree() {
  const { tree } = useDocTree();
  const [context, setContext] = useState<{
    x: number;
    y: number;
    target: TreeContextTarget | null;
  }>({ x: 0, y: 0, target: null });

  const handleContextMenu = (
    e: React.MouseEvent,
    target: TreeContextTarget
  ) => {
    e.preventDefault();
    setContext({
      x: e.clientX,
      y: e.clientY,
      target,
    });
  };

  const closeMenu = () =>
    setContext((prev) => ({ ...prev, target: null }));

  return (
    <div className="select-none text-[13px] leading-[1.3]">
      <div className="mt-3 space-y-[2px]">
        {tree.map((node: TreeNode) =>
          node.type === "folder" ? (
            <FolderNode
              key={node.id}
              node={node}
              depth={0}
              onContextMenu={handleContextMenu}
            />
          ) : (
            <DocNode
              key={node.id}
              node={node}
              depth={0}
              onContextMenu={handleContextMenu}
            />
          )
        )}
      </div>

      {context.target && (
        <TreeContextMenu
          x={context.x}
          y={context.y}
          target={context.target}
          onClose={closeMenu}
        />
      )}
    </div>
  );
}
