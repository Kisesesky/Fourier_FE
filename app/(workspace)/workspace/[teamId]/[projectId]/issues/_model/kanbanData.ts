import {
  HumanResource,
  JobSheet,
  Machine,
  PaintJob,
  ProductionRisk,
  Reminder,
  ResourceAlert,
  ResourceLoadEntry,
  Subcontract,
  SummaryStat,
  WorkflowAlert,
  WorkflowHistoryEntry,
  WorkflowNode,
} from "@/workspace/issues/_model/kanbanTypes";

const MS_IN_DAY = 1000 * 60 * 60 * 24;

const durationInDays = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = Math.max(endDate.getTime() - startDate.getTime(), 0);
  return Math.max(1, Math.round(diff / MS_IN_DAY) + 1);
};

const createWorkflowNode = (node: Omit<WorkflowNode, "durationDays">): WorkflowNode => ({
  ...node,
  durationDays: durationInDays(node.startDate, node.endDate),
  assignments: node.assignments ?? [],
});

export const kanbanProductionStats: SummaryStat[] = [
  { id: "completion", title: "Completion", value: "62%", helper: "+4% vs last sprint" },
  { id: "active-orders", title: "Active orders", value: "5", helper: "3 priority items" },
  { id: "handoffs", title: "Handoffs this week", value: "4", helper: "QA + packing" },
];

export const kanbanProductionRisks: ProductionRisk[] = [
  { id: "risk-die-cut", title: "Die-cut delay", owner: "Floor lead", due: "11.27", severity: "high" },
  { id: "risk-ink", title: "Ink shortage (Pantone 238)", owner: "Ink room", due: "11.26", severity: "medium" },
];

export const kanbanJobSheets: JobSheet[] = [
  { id: "JS25-01", code: "JS25-01", name: "Cutting MO25-01", start: "11.20", end: "11.20", status: "completed" },
  { id: "JS25-05", code: "JS25-05", name: "Cutting MO25-05", start: "11.27", end: "11.27", status: "in-progress" },
  { id: "JS25-08", code: "JS25-08", name: "Cutting MO25-08", start: "11.25", end: "11.25", status: "delayed" },
];

export const kanbanPaintQueue: PaintJob[] = [
  { id: "paint-premium-lid", name: "Premium lid", schedule: "11.25", colors: ["Pantone 238", "Pantone 485"], status: "mixing" },
  { id: "paint-label-premium", name: "Label premium", schedule: "11.26", colors: ["Pantone 238"], status: "scheduled" },
  { id: "paint-sleeve-coffee", name: "Sleeve coffee", schedule: "Done", colors: ["Pantone 238"], status: "ready" },
];

export const kanbanSubcontracts: Subcontract[] = [
  { id: "SC25-01", code: "SC25-01", name: "Gold foil", vendor: "Golden Finish", period: "11.25 ~ 11.27", status: "planned" },
  { id: "SC25-02", code: "SC25-02", name: "Laser cutting", vendor: "Laser XYZ", period: "11.26 ~ 11.28", status: "in-progress" },
  { id: "SC25-03", code: "SC25-03", name: "Bag sewing", vendor: "Minh Long", period: "11.24 ~ 12.01", status: "delayed" },
];

export const kanbanMachines: Machine[] = [
  { id: "machine-offset-roland-700", name: "Offset Roland 700", operation: "Print", utilization: 0.85, status: "busy" },
  { id: "machine-die-cutter-be-01", name: "Die Cutter BE-01", operation: "Die cut", utilization: 0.3, status: "available" },
  { id: "machine-packing-line-pl-02", name: "Packing Line PL-02", operation: "Pack", utilization: 0.92, status: "busy" },
];

export const kanbanResourceAlerts: ResourceAlert[] = [
  {
    id: "alert-ink",
    title: "Pantone 238 shortage",
    detail: "Three ink jobs on hold, check ETA.",
    severity: "critical",
    relatedNodeId: "wf-task-calibration",
    dueDate: "2025-11-26",
  },
  {
    id: "alert-laser",
    title: "Laser outsource delay",
    detail: "SC25-03 pushed by one day.",
    severity: "warning",
    relatedNodeId: "wf-task-diecut",
  },
  {
    id: "alert-qa",
    title: "QA handoff window",
    detail: "MO25-001 / MO25-004 on Feb 27-28.",
    severity: "info",
    relatedNodeId: "wf-task-packaging",
  },
];

export const kanbanWorkflowNodes: WorkflowNode[] = [
  createWorkflowNode({
    id: "wf-1",
    parentId: null,
    kind: "initiative",
    title: "봄 출시 프로젝트",
    owner: "기획팀",
    startDate: "2025-11-17",
    endDate: "2025-11-10",
    progress: 0.58,
    status: "in-progress",
    dependencies: [],
    resourceLoad: 0.3,
    isCritical: true,
    assignments: [{ id: "assign-init-1", assigneeId: "res-eunji", assigneeName: "Eunji Park", role: "기획", allocation: 0.5 }],
  }),
  createWorkflowNode({
    id: "wf-1-a",
    parentId: "wf-1",
    kind: "phase",
    title: "디자인 준비",
    owner: "디자인팀",
    startDate: "2025-11-17",
    endDate: "2025-11-23",
    progress: 0.72,
    status: "in-progress",
    dependencies: [],
    resourceLoad: 0.5,
    assignments: [{ id: "assign-prepress-1", assigneeId: "res-thien", assigneeName: "Thien Nguyen", role: "리드", allocation: 0.6 }],
  }),
  createWorkflowNode({
    id: "wf-1-a-1",
    parentId: "wf-1-a",
    kind: "task",
    title: "라벨 스케치",
    owner: "서연",
    startDate: "2025-11-17",
    endDate: "2025-11-18",
    progress: 1,
    status: "done",
    dependencies: [],
    resourceLoad: 0.3,
    assignments: [{ id: "assign-dielines-1", assigneeId: "res-thien", assigneeName: "Thien Nguyen", role: "디자이너", allocation: 0.4 }],
  }),
  createWorkflowNode({
    id: "wf-1-a-2",
    parentId: "wf-1-a",
    kind: "task",
    title: "색상 보정",
    owner: "민호",
    startDate: "2025-11-19",
    endDate: "2025-11-22",
    progress: 0.45,
    status: "at-risk",
    dependencies: ["wf-task-dielines"],
    resourceLoad: 0.6,
    assignments: [{ id: "assign-calib-1", assigneeId: "res-lan", assigneeName: "Lan Pham", role: "엔지니어", allocation: 0.7 }],
    forecastEndDate: "2025-11-23",
    riskNote: "잉크 입고 지연",
  }),
  createWorkflowNode({
    id: "wf-1-b",
    parentId: "wf-1",
    kind: "phase",
    title: "양산 준비",
    owner: "현장팀",
    startDate: "2025-11-24",
    endDate: "2025-12-08",
    progress: 0.38,
    status: "planned",
    dependencies: ["wf-phase-prepress"],
    resourceLoad: 0.5,
    assignments: [{ id: "assign-prod-1", assigneeId: "res-floor", assigneeName: "Floor Lead", role: "슈퍼바이저", allocation: 0.5 }],
  }),
  createWorkflowNode({
    id: "wf-1-b-1",
    parentId: "wf-1-b",
    kind: "task",
    title: "인쇄",
    owner: "민준",
    startDate: "2025-11-24",
    endDate: "2025-11-27",
    progress: 0.25,
    status: "planned",
    dependencies: ["wf-task-calibration"],
    resourceLoad: 0.7,
    assignments: [{ id: "assign-print-1", assigneeId: "res-press", assigneeName: "Press Team", role: "인쇄", allocation: 0.7 }],
  }),
  createWorkflowNode({
    id: "wf-1-b-2",
    parentId: "wf-1-b",
    kind: "task",
    title: "재단",
    owner: "현장팀",
    startDate: "2025-11-28",
    endDate: "2025-12-03",
    progress: 0.1,
    status: "planned",
    dependencies: ["wf-task-print"],
    resourceLoad: 0.5,
    assignments: [{ id: "assign-diecut-1", assigneeId: "res-ops", assigneeName: "Ops Crew", role: "재단", allocation: 0.5 }],
  }),
  createWorkflowNode({
    id: "wf-1-b-3",
    parentId: "wf-1-b",
    kind: "task",
    title: "포장",
    owner: "QA팀",
    startDate: "2025-12-04",
    endDate: "2025-12-07",
    progress: 0.2,
    status: "blocked",
    dependencies: ["wf-task-diecut"],
    resourceLoad: 0.4,
    assignments: [{ id: "assign-packaging-1", assigneeId: "res-qa", assigneeName: "QA Pod", role: "검수", allocation: 0.4 }],
    riskNote: "재단 샘플 대기",
  }),
  createWorkflowNode({
    id: "wf-1-m",
    parentId: "wf-1",
    kind: "milestone",
    title: "출고 점검",
    owner: "기획팀",
    startDate: "2025-12-05",
    endDate: "2025-12-05",
    progress: 0,
    status: "planned",
    dependencies: ["wf-task-packaging"],
    resourceLoad: 0.1,
    milestone: true,
    assignments: [{ id: "assign-milestone", assigneeId: "res-eunji", assigneeName: "Eunji Park", role: "PM", allocation: 0.2 }],
  }),
];

export const kanbanHumanResources: HumanResource[] = [
  { id: "res-eunji", name: "Eunji Park", role: "PM", capacityPerDay: 6, color: "#8B5CF6" },
  { id: "res-huy", name: "Huy Tran", role: "Coordinator", capacityPerDay: 7, color: "#EC4899" },
  { id: "res-thien", name: "Thien Nguyen", role: "Design Lead", capacityPerDay: 7, color: "#F97316" },
  { id: "res-lan", name: "Lan Pham", role: "Process Eng", capacityPerDay: 8, color: "#10B981" },
  { id: "res-ops", name: "Ops Crew", role: "Operations", capacityPerDay: 10, color: "#3B82F6" },
  { id: "res-floor", name: "Floor Lead", role: "Supervisor", capacityPerDay: 8, color: "#F59E0B" },
  { id: "res-press", name: "Press Team", role: "Print", capacityPerDay: 9, color: "#0EA5E9" },
  { id: "res-qa", name: "QA Pod", role: "QA", capacityPerDay: 6, color: "#84CC16" },
];

export const kanbanResourceLoads: ResourceLoadEntry[] = [
  { assigneeId: "res-thien", date: "2025-11-20", workload: 7 },
  { assigneeId: "res-thien", date: "2025-11-21", workload: 8 },
  { assigneeId: "res-lan", date: "2025-11-22", workload: 9 },
  { assigneeId: "res-ops", date: "2025-12-02", workload: 11 },
  { assigneeId: "res-ops", date: "2025-12-03", workload: 10 },
  { assigneeId: "res-qa", date: "2025-12-06", workload: 7 },
];

export const kanbanWorkflowAlerts: WorkflowAlert[] = [
  {
    id: "wf-alert-1",
    type: "overlap",
    nodeId: "wf-task-calibration",
    assigneeId: "res-lan",
    severity: "warning",
    description: "Lan Pham is overallocated (120%) on Feb 22.",
    timestamp: "2025-11-21T09:00:00Z",
  },
  {
    id: "wf-alert-2",
    type: "deadline",
    nodeId: "wf-task-packaging",
    severity: "critical",
    description: "Packaging run likely to slip by three days.",
    timestamp: "2025-12-02T12:00:00Z",
  },
];

export const kanbanWorkflowHistory: WorkflowHistoryEntry[] = [
  {
    id: "hist-1",
    nodeId: "wf-task-calibration",
    author: "Lan Pham",
    timestamp: "2025-11-20T08:00:00Z",
    summary: "Calibration shifted by +1 day due to ink delay.",
    changes: [
      { field: "endDate", from: "2025-11-22", to: "2025-11-23" },
      { field: "status", from: "planned", to: "at-risk" },
    ],
  },
  {
    id: "hist-2",
    nodeId: "wf-task-print",
    author: "Press team",
    timestamp: "2025-11-24T12:00:00Z",
    summary: "Print kickoff confirmed.",
    changes: [{ field: "status", from: "planned", to: "in-progress" }],
  },
  {
    id: "hist-3",
    nodeId: "wf-task-packaging",
    author: "QA pod",
    timestamp: "2025-12-01T09:30:00Z",
    summary: "Blocked awaiting die-cut QA samples.",
    changes: [{ field: "status", from: "planned", to: "blocked" }],
  },
];

export const kanbanReminders: Reminder[] = [
  {
    id: "rem-1",
    nodeId: "wf-milestone-pilot",
    dueDate: "2025-12-05",
    message: "Pilot shipment dry-run",
    status: "pending",
  },
  {
    id: "rem-2",
    nodeId: "wf-task-packaging",
    dueDate: "2025-12-04",
    message: "QA packaging review",
    status: "sent",
  },
];
