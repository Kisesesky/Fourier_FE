"use client";

import { Suspense } from "react";
import KanbanView from "@/workspace/issues/_components/KanbanView";

export default function WorkspaceIssuesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">이슈 보드를 불러오는 중입니다…</div>}>
      <KanbanView />
    </Suspense>
  );
}
