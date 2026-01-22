import type { JobSheet, Machine, PaintJob, Subcontract, WorkflowStatus } from "@/workspace/issues/_model/kanbanTypes";

export const KANBAN_TEXT = {
  headings: {
    planningEyebrow: "Planning",
    planningTitle: "간단한 타임라인 보드",
    planningSubtitle: "필터와 빠른 입력으로 업무를 조정하세요.",
    jobSheetEyebrow: "Job sheet",
    inkEyebrow: "Ink queue",
    inkTitle: "잉크 준비 현황",
    subcontractTitle: "외주 진행 상태",
    resourceTitle: "설비 · 인력 상태",
  },
  filters: {
    view: { label: "보기", all: "전체", mine: "내 업무" },
    owner: { label: "담당자", empty: "미지정" },
    status: { label: "상태" },
    taskSearch: "업무 검색…",
    subcontractSearch: "업체/코드 검색",
  },
  actions: {
    filter: "필터",
    newTask: "새 업무",
    newJobSheet: "새로운 작업지",
    today: "오늘",
    resetFilters: "필터 초기화",
    add: "추가하기",
    cancel: "취소",
    acknowledge: "확인",
  },
  viewModes: {
    day: "일",
    week: "주",
    month: "월",
  },
  labels: {
    taskCountSuffix: "개 업무",
    statusHighlights: {
      done: "완료됨",
      inProgress: "진행 중",
      delayed: "지연",
    },
    taskTable: {
      title: "업무명",
      quantity: "수량",
      status: "상태",
      progress: "진행률",
      duration: "시간",
    },
    statusChange: "상태 변경",
    detail: {
      open: "자세히",
      close: "닫기",
    },
    quickTask: {
      title: "빠른 업무 추가",
      name: "업무명",
      placeholder: "예: 1단계 가이드 정비",
      owner: "담당자",
      ownerPlaceholder: "선택하세요",
      status: "진행상태",
      start: "시작일",
      end: "마감일",
    },
    jobSheet: {
      plannerTitle: "작업지 플래너",
      countPrefix: "총 ",
      countSuffix: "건",
      start: "시작일",
      end: "마감일",
    },
    jobSheetForm: {
      title: "작업지 생성",
      code: "코드",
      name: "작업명",
      start: "시작일",
      end: "마감일",
    },
    scheduleNote: "일정 메모",
  },
  messages: {
    noToday: "현재 범위에 오늘 일정이 없습니다.",
  },
  empty: {
    noTasks: "조건에 맞는 업무가 없습니다.",
    noInk: "등록된 잉크 작업이 없습니다.",
    noSubcontract: "조건을 만족하는 외주 항목이 없습니다.",
    noAlerts: "열람할 경고가 없습니다.",
  },
  statuses: {
    workflow: {
      planned: "예정",
      "in-progress": "진행",
      "at-risk": "주의",
      blocked: "지연",
      done: "완료",
    } as Record<WorkflowStatus, string>,
    jobSheet: {
      planned: "계획",
      "in-progress": "진행",
      completed: "완료",
      delayed: "지연",
    } as Record<JobSheet["status"], string>,
    paint: {
      scheduled: "예약",
      mixing: "믹싱",
      ready: "준비완료",
    } as Record<PaintJob["status"], string>,
    subcontract: {
      planned: "준비",
      "in-progress": "진행",
      delayed: "지연",
    } as Record<Subcontract["status"], string>,
    machine: {
      available: "대기",
      busy: "사용 중",
    } as Record<Machine["status"], string>,
  },
  validation: {
    quickTask: {
      title: "업무명을 입력하세요.",
      owner: "담당자를 선택하세요.",
      date: "올바른 날짜를 입력하세요.",
      range: "시작일이 마감일보다 늦습니다.",
    },
    jobSheet: {
      name: "작업명을 입력하세요.",
      date: "날짜를 다시 확인하세요.",
      range: "시작일이 마감일보다 늦습니다.",
    },
  },
} as const;

export type KanbanText = typeof KANBAN_TEXT;
