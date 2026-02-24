// app/(workspace)/workspace/[teamId]/[projectId]/docs/[docId]/page.tsx
'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { DocEditorProvider } from "@/workspace/docs/_components/DocEditorContext";
import DocEditorTabs from "@/workspace/docs/_components/DocEditorTabs";
import DocView from "@/workspace/docs/_components/DocView";
import DocCommentsPanel from "@/workspace/docs/_components/DocCommentsPanel";
import DocReadView from "@/workspace/docs/_components/DocReadView";
import { deleteDoc } from "@/workspace/docs/_model/docs";
import { listDocumentComments } from "@/workspace/docs/_service/api";

export default function DocDetailPage() {
  const router = useRouter();
  const params = useParams();
  const docId = params?.docId;
  const teamId = typeof params?.teamId === "string" ? params.teamId : null;
  const projectId =
    typeof params?.projectId === "string" ? params.projectId : null;
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [commentsOpen, setCommentsOpen] = useState(true);
  const [commentCount, setCommentCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    setMode("view");
  }, [docId]);

  useEffect(() => {
    if (!docId || typeof docId !== "string") return;
    setCommentsOpen(mode !== "edit");
    void listDocumentComments(docId)
      .then((rows) => setCommentCount(rows.length))
      .catch(() => setCommentCount(0));
  }, [docId, mode]);

  useEffect(() => {
    if (!docId || typeof docId !== "string") return;
    const handleCommentsChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ docId?: string; count?: number }>).detail;
      if (!detail || detail.docId !== docId) return;
      setCommentCount(detail.count ?? 0);
    };
    window.addEventListener("docs:comments:changed", handleCommentsChanged as EventListener);
    return () =>
      window.removeEventListener(
        "docs:comments:changed",
        handleCommentsChanged as EventListener,
      );
  }, [docId]);

  if (!docId || typeof docId !== "string") {
    return (
      <div className="flex h-full items-center justify-center bg-white text-sm text-red-500">
        문서 ID가 유효하지 않습니다.
      </div>
    );
  }

  return (
    <DocEditorProvider docId={docId}>
      <div className="flex h-full min-h-0 flex-col bg-[#f4f7fb] dark:bg-slate-950">
        <DocEditorTabs />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 bg-[#f7f9fb] dark:bg-slate-950">
            {mode === "edit" ? (
              <DocView />
            ) : (
              <DocReadView
                onEdit={() => setMode("edit")}
                onDelete={async () => {
                  await deleteDoc(docId);
                  if (teamId && projectId) {
                    router.push(`/workspace/${teamId}/${projectId}/docs`);
                    return;
                  }
                  router.push("/");
                }}
              />
            )}
          </div>
          <div className="border-t border-border bg-white px-4 py-2 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setCommentsOpen((prev) => !prev)}
              className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-subtle/60 hover:text-foreground"
            >
              댓글 <span suppressHydrationWarning>{hydrated ? commentCount : 0}</span>개
            </button>
          </div>
          {commentsOpen && (
            <section className="h-80 border-t border-border bg-white dark:bg-slate-900">
              <DocCommentsPanel layout="bottom" showOutline={false} />
            </section>
          )}
        </div>
      </div>
    </DocEditorProvider>
  );
}
