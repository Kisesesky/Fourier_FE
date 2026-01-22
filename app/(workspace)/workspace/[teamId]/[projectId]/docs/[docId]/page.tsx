"use client";

import { useParams } from "next/navigation";

import { DocEditorProvider } from "@/workspace/docs/_components/DocEditorContext";
import DocEditorTabs from "@/workspace/docs/_components/DocEditorTabs";
import DocView from "@/workspace/docs/_components/DocView";
import DocsRightPanel from "@/workspace/docs/_components/DocsRightPanel";

export default function DocDetailPage() {
  const params = useParams();
  const docId = params?.docId;

  if (!docId || typeof docId !== "string") {
    return (
      <div className="flex h-full items-center justify-center bg-white text-sm text-red-500">
        문서 ID가 유효하지 않습니다.
      </div>
    );
  }

  return (
    <DocEditorProvider docId={docId}>
      <div className="flex h-full flex-col bg-[#f4f7fb]">
        <DocEditorTabs />

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 border-r border-border bg-[#f7f9fb]">
            <DocView />
          </div>
          <aside className="w-80 border-l border-border bg-white">
            <DocsRightPanel />
          </aside>
        </div>
      </div>
    </DocEditorProvider>
  );
}
