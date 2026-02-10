// app/(workspace)/workspace/[teamId]/[projectId]/docs/_components/note-drive/tree/DocNode.tsx
'use client';

import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import type { TreeDoc, TreeContextTarget } from "../../../_model/types";

export default function DocNode({
  node,
  depth,
  onContextMenu,
}: {
  node: TreeDoc;
  depth: number;
  onContextMenu: (e: React.MouseEvent, target: TreeContextTarget) => void;
}) {
  const router = useRouter();
  const { buildHref } = useWorkspacePath();

  const gotoDoc = () => {
    router.push(buildHref(["docs", node.id]));
  };

  return (
    <div
      className="flex items-center w-full h-7 rounded-md px-2 cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-foreground transition"
      onClick={gotoDoc}
      onContextMenu={(e) => onContextMenu(e, { type: "doc", id: node.id })}
      style={{ paddingLeft: depth * 14 + 15 }}
    >
      <FileText size={14} className="text-muted" />
      <span className="truncate ml-2">{node.title}</span>
    </div>
  );
}
