"use client";

import { Suspense } from "react";
import MembersView from "@/workspace/members/_components/MembersView";

export default function WorkspaceMembersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">멤버 정보를 불러오는 중입니다…</div>}>
      <MembersView />
    </Suspense>
  );
}
