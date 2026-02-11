// app/(workspace)/workspace/[teamId]/[projectId]/calendar/page.tsx
'use client';

import { Suspense } from "react";
import CalendarView from "@/workspace/calendar/_components/CalendarView";

export default function WorkspaceCalendarPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">캘린더를 불러오는 중입니다…</div>}>
      <CalendarView key="calendar-all" />
    </Suspense>
  );
}
