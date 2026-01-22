"use client";

import { Suspense } from "react";
import CalendarView from "@/workspace/calendar/_components/CalendarView";

export default function WorkspaceCalendarPage() {
  if (typeof window !== "undefined") {
    (window as any).__FLOW_USERS__ = [
      { id: "u-you", name: "You" },
      { id: "u-alice", name: "Alice" },
      { id: "u-bob", name: "Bob" },
    ];
  }

  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">캘린더를 불러오는 중입니다…</div>}>
      <CalendarView />
    </Suspense>
  );
}
