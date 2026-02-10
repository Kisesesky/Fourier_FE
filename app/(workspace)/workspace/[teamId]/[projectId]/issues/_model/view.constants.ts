// app/(workspace)/workspace/[teamId]/[projectId]/issues/_model/view.constants.ts

import { BarChart3, CalendarRange, KanbanSquare, LayoutDashboard, Table2 } from "lucide-react";

import type { Issue } from "@/workspace/issues/_model/types";
import type { ViewMode } from "@/workspace/issues/_model/board.types";

export const ISSUES_BASE_COLUMNS: Array<{ key: Issue["status"]; label: string }> = [
  { key: "todo", label: "할 일" },
  { key: "in_progress", label: "작업 중" },
  { key: "review", label: "리뷰 대기" },
  { key: "done", label: "완료" },
];

export const ISSUES_VIEW_META: Record<
  ViewMode,
  { label: string; description: string; icon: typeof Table2 }
> = {
  table: { label: "메인 테이블", description: "업무를 표 형식으로 관리합니다.", icon: Table2 },
  timeline: { label: "타임라인", description: "기간별 일정 흐름을 확인합니다.", icon: CalendarRange },
  kanban: { label: "칸반", description: "상태별로 업무를 이동하며 관리합니다.", icon: KanbanSquare },
  chart: { label: "차트", description: "업무 진행 지표를 시각화합니다.", icon: BarChart3 },
  dashboard: { label: "대시보드", description: "프로젝트 요약 지표를 확인합니다.", icon: LayoutDashboard },
};
