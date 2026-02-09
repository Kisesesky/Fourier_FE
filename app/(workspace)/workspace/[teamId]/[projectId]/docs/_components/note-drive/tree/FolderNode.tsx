"use client";

import { useState } from "react";
import { Folder, ChevronDown, ChevronRight } from "lucide-react";
import DocNode from "./DocNode";
import type { TreeFolder, TreeContextTarget } from "../../../_model/types";

export default function FolderNode({
  node,
  depth,
  onContextMenu,
}: {
  node: TreeFolder;
  depth: number;
  onContextMenu: (e: React.MouseEvent, target: TreeContextTarget) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <div
        className="flex items-center w-full h-7 rounded-md px-2 cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-foreground transition"
        onClick={() => setOpen(!open)}
        onContextMenu={(e) => onContextMenu(e, { type: "folder", id: node.id })}
        style={{ paddingLeft: depth * 14 + 8 }}
      >
        {open ? (
          <ChevronDown size={15} className="text-gray-500" />
        ) : (
          <ChevronRight size={15} className="text-gray-500" />
        )}

        <Folder size={16} className="ml-1 text-blue-500" />
        <span className="truncate ml-1">{node.name}</span>
      </div>

      {open && (
        <div className="space-y-[2px] mt-[2px]">
          {node.children?.map((child) =>
            child.type === "folder" ? (
              <FolderNode
                key={child.id}
                node={child}
                depth={depth + 1}
                onContextMenu={onContextMenu}
              />
            ) : (
              <DocNode
                key={child.id}
                node={child}
                depth={depth + 1}
                onContextMenu={onContextMenu}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
