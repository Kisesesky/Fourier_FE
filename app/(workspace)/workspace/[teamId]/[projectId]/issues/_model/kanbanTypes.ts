import type { LucideIcon } from "lucide-react";

export type TabKey = "production" | "jobSheet" | "painting" | "subcontract" | "resource";

export type TabConfig = {
  id: TabKey;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type SummaryStat = {
  id: string;
  title: string;
  value: string;
  helper: string;
};

export type WorkflowStatus = "planned" | "in-progress" | "at-risk" | "blocked" | "done";

export type WorkflowNodeKind = "initiative" | "phase" | "task" | "milestone";

export type WorkflowAssignment = {
  id: string;
  assigneeId: string;
  assigneeName: string;
  role: string;
  allocation: number;
};

export type WorkflowNode = {
  id: string;
  parentId: string | null;
  kind: WorkflowNodeKind;
  title: string;
  description?: string;
  owner: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  progress: number;
  status: WorkflowStatus;
  dependencies: string[];
  resourceLoad: number;
  assignments: WorkflowAssignment[];
  milestone?: boolean;
  isCritical?: boolean;
  forecastEndDate?: string;
  riskNote?: string;
  lastUpdatedIso?: string;
};

export type WorkflowTreeNode = WorkflowNode & {
  depth: number;
  children: WorkflowTreeNode[];
};

export type ProductionRiskSeverity = "high" | "medium" | "watch";

export type ProductionRisk = {
  id: string;
  title: string;
  owner: string;
  due: string;
  severity: ProductionRiskSeverity;
};

export type JobSheetStatus = "planned" | "in-progress" | "completed" | "delayed";

export type JobSheet = {
  id: string;
  code: string;
  name: string;
  start: string;
  end: string;
  status: JobSheetStatus;
};

export type PaintStatus = "scheduled" | "mixing" | "ready";

export type PaintJob = {
  id: string;
  name: string;
  schedule: string;
  colors: string[];
  status: PaintStatus;
};

export type SubcontractStatus = "planned" | "in-progress" | "delayed";

export type Subcontract = {
  id: string;
  code: string;
  name: string;
  vendor: string;
  period: string;
  status: SubcontractStatus;
};

export type MachineStatus = "available" | "busy";

export type Machine = {
  id: string;
  name: string;
  operation: string;
  utilization: number;
  status: MachineStatus;
};

export type ResourceAlertSeverity = "info" | "warning" | "critical";

export type ResourceAlert = {
  id: string;
  title: string;
  detail: string;
  severity: ResourceAlertSeverity;
  relatedNodeId?: string;
  assigneeId?: string;
  dueDate?: string;
  acknowledged?: boolean;
};

export type EntityState<T extends { id: string }> = {
  byId: Record<string, T>;
  allIds: string[];
};

export type TimelineFilter = "all" | WorkflowStatus;
export type VendorFilter = "all" | SubcontractStatus;

export type HumanResource = {
  id: string;
  name: string;
  role: string;
  capacityPerDay: number;
  color: string;
};

export type ResourceLoadEntry = {
  assigneeId: string;
  date: string;
  workload: number;
};

export type WorkflowAlert = {
  id: string;
  type: "overlap" | "deadline" | "status-change";
  nodeId: string;
  assigneeId?: string;
  severity: ResourceAlertSeverity;
  description: string;
  timestamp: string;
};

export type LiveAnnouncement = {
  id: string;
  message: string;
  timestamp: string;
};

export type RealtimeStatus = "idle" | "connecting" | "connected" | "error";

export type WorkflowHistoryChange = {
  field: string;
  from?: string;
  to?: string;
};

export type WorkflowHistoryEntry = {
  id: string;
  nodeId: string;
  author: string;
  timestamp: string;
  summary: string;
  changes?: WorkflowHistoryChange[];
};

export type ReminderStatus = "pending" | "sent" | "acknowledged";

export type Reminder = {
  id: string;
  nodeId: string;
  dueDate: string;
  message: string;
  status: ReminderStatus;
};
