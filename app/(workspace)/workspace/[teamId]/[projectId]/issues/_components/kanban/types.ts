import type {
  EntityState,
  JobSheet,
  TimelineFilter,
  VendorFilter,
  WorkflowNode,
  WorkflowStatus,
} from "@/workspace/issues/_model/kanbanTypes";

export type WorkflowSnapshot = {
  nodes: EntityState<WorkflowNode>;
  rootIds: string[];
  expanded: Record<string, boolean>;
};

export type WorkflowRow = WorkflowNode & {
  depth: number;
  hasChildren: boolean;
};

export type TimelineRange = {
  start: number;
  end: number;
  totalDays: number;
};

export type QuickTaskFormState = {
  title: string;
  owner: string;
  start: string;
  end: string;
  status: WorkflowStatus;
};

export type JobSheetFormState = {
  code: string;
  name: string;
  start: string;
  end: string;
  status: JobSheet["status"];
};

export type HeaderChip = {
  label: string;
  value: string;
  onClick: () => void;
  onReset?: () => void;
  disabled?: boolean;
};

export type ScopeFilter = "all" | "mine";

export type TimelineFilterCycle = TimelineFilter[];

export type VendorFilterOptions = VendorFilter[];
