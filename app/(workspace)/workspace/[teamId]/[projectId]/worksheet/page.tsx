"use client";

import { Suspense } from "react";
import WorksheetListView from "@/workspace/worksheet/_components/WorksheetListView";

export default function WorkspaceWorksheetPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">워크시트를 불러오는 중입니다…</div>}>
      <WorksheetListView />
    </Suspense>
  );
}
