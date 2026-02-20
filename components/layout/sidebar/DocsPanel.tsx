// components/layout/sidebar/DocsPanel.tsx
'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Folder, LayoutDashboard, Star, FolderOpen } from "lucide-react";

import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import { DocsTree } from "@/app/(workspace)/workspace/[teamId]/[projectId]/docs/_components/note-drive/tree";
import TreeToolbar from "@/app/(workspace)/workspace/[teamId]/[projectId]/docs/_components/note-drive/tree/TreeToolbar";
import { getDocs, setDocStarred } from "@/workspace/docs/_model/docs";

export default function DocsPanel() {
  const { buildHref } = useWorkspacePath();
  const router = useRouter();
  const [starredDocs, setStarredDocs] = useState(() =>
    getDocs().filter((doc) => doc.starred),
  );

  useEffect(() => {
    const sync = () => {
      setStarredDocs(getDocs().filter((doc) => doc.starred));
    };
    sync();
    window.addEventListener("docs:refresh", sync);
    return () => window.removeEventListener("docs:refresh", sync);
  }, []);

  return (
    <div className="p-1">
      <div className="mb-4 flex items-center justify-between border-b border-gray-300 pb-2">
        <div className="flex items-center text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          문서
        </div>

        <TreeToolbar onRefresh={() => window.dispatchEvent(new Event("docs:refresh"))} />
      </div>

      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          <Folder size={16} className="mr-1 text-yellow-500" />
          문서
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => router.push(buildHref("docs", "/docs"))}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <FolderOpen size={12} />
            홈
          </button>
          <button
            type="button"
            onClick={() => router.push(`${buildHref("docs", "/docs")}?read=all`)}
            className="rounded-md px-2 py-1 text-[11px] font-medium text-muted transition hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            전체보기
          </button>
        </div>
      </div>

      <DocsTree />

      <div className="mt-4 border-t border-gray-200 pt-3">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          <span className="inline-flex items-center">
            <Star size={14} className="mr-1 text-amber-500" />
            즐겨찾기
          </span>
          <span>{starredDocs.length}개</span>
        </div>
        <div className="space-y-1">
          {starredDocs.slice(0, 8).map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-1 rounded-md px-1 py-0.5 text-xs text-muted transition hover:bg-subtle/70 hover:text-foreground"
            >
              <button
                type="button"
                onClick={() => router.push(buildHref(["docs", doc.id], `/docs/${doc.id}`))}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left"
              >
                <FileText size={12} className="text-muted-foreground" />
                <span className="truncate">{doc.title}</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  await setDocStarred(doc.id, false);
                  setStarredDocs(getDocs().filter((item) => item.starred));
                }}
                className="rounded-md px-1.5 py-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                title="즐겨찾기 해제"
              >
                -
              </button>
            </div>
          ))}
          {starredDocs.length === 0 && (
            <p className="px-2 py-1 text-xs text-muted">즐겨찾기 문서가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
