// app/(workspace)/workspace/[teamId]/[projectId]/issues/_model/board.types.ts
import type { Issue, IssueGroup } from "@/workspace/issues/_model/types";

export type ViewMode = "table" | "timeline" | "kanban" | "chart" | "dashboard";

export type IssueCreateModalState = {
  groupKey: string;
  title: string;
  status: Issue["status"];
  priority: Issue["priority"];
  startAt: string;
  endAt: string;
  parentId?: string;
  parentTitle?: string;
  parentStartAt?: string;
  parentEndAt?: string;
  isSubtask?: boolean;
};

export type IssueEditModalState = {
  issue: Issue;
  title: string;
  status: Issue["status"];
  priority: Issue["priority"];
  startAt: string;
  endAt: string;
};

export type GroupModalState = {
  mode: "create" | "edit";
  group?: IssueGroup;
  name: string;
  color: string;
};
