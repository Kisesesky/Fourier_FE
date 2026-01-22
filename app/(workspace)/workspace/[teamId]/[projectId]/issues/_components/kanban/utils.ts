import type {
  EntityState,
  ResourceLoadEntry,
  TimelineFilter,
  VendorFilter,
  WorkflowNode,
} from "@/workspace/issues/_model/kanbanTypes";

import { DAY_IN_MS, normalizeDate } from "./date";
import { TIMELINE_FILTER_LABELS, VENDOR_FILTER_LABELS } from "./constants";
import type { TimelineRange, WorkflowRow, WorkflowSnapshot } from "./types";

export function entityToList<T extends { id: string }>(entity: EntityState<T>): T[] {
  return entity.allIds.map((id) => entity.byId[id]);
}

export function buildWorkflowRows(workflow: WorkflowSnapshot, filter: TimelineFilter): WorkflowRow[] {
  const nodeMap = workflow.nodes.byId;
  const childrenMap = workflow.nodes.allIds.reduce<Record<string, string[]>>((acc, id) => {
    const parentId = nodeMap[id]?.parentId;
    if (parentId) {
      acc[parentId] = acc[parentId] ? [...acc[parentId], id] : [id];
    }
    return acc;
  }, {});

  const includeNode = (node: WorkflowNode) => filter === "all" || node.status === filter;

  const traverse = (ids: string[], depth = 0): WorkflowRow[] => {
    const rows: WorkflowRow[] = [];
    ids.forEach((id) => {
      const node = nodeMap[id];
      if (!node) return;
      const children = childrenMap[id] || [];
      const childRows = workflow.expanded[id] ? traverse(children, depth + 1) : [];
      const shouldRender = includeNode(node) || childRows.length > 0;
      if (!shouldRender) {
        rows.push(...childRows);
        return;
      }
      rows.push({ ...node, depth, hasChildren: children.length > 0 });
      rows.push(...childRows);
    });
    return rows;
  };

  return traverse(workflow.rootIds);
}

export function computeWorkflowRange(workflow: WorkflowSnapshot): TimelineRange | null {
  if (!workflow.nodes.allIds.length) return null;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  workflow.nodes.allIds.forEach((id) => {
    const node = workflow.nodes.byId[id];
    if (!node) return;
    const start = normalizeDate(node.startDate);
    const end = normalizeDate(node.endDate);
    if (start < min) min = start;
    if (end > max) max = end;
  });

  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  const totalDays = Math.max(1, Math.round((max - min) / DAY_IN_MS) + 1);
  return { start: min, end: max, totalDays };
}

export function getBarPosition(range: TimelineRange, node: WorkflowNode, timelineWidth: number) {
  const start = normalizeDate(node.startDate);
  const end = normalizeDate(node.endDate);
  const offsetDays = Math.max(0, Math.round((start - range.start) / DAY_IN_MS));
  const durationDays = Math.max(1, Math.round((end - start) / DAY_IN_MS) + 1);
  const offsetPercent = Math.min(100, (offsetDays / range.totalDays) * 100);
  const baseWidth = (durationDays / range.totalDays) * 100;
  const minPx = node.milestone ? 8 : 34;
  const minPercent = timelineWidth ? (minPx / timelineWidth) * 100 : 0;
  const widthPercent = Math.min(100 - offsetPercent, Math.max(baseWidth, minPercent));
  return { offsetPercent, widthPercent };
}

export function groupLoadByAssignee(entries: ResourceLoadEntry[]) {
  const grouped = entries.reduce<Record<string, ResourceLoadEntry[]>>((acc, entry) => {
    acc[entry.assigneeId] = acc[entry.assigneeId] ? [...acc[entry.assigneeId], entry] : [entry];
    return acc;
  }, {});
  Object.keys(grouped).forEach((id) => {
    grouped[id] = grouped[id].sort((a, b) => a.date.localeCompare(b.date));
  });
  return grouped;
}

export function timelineFilterLabel(filter: TimelineFilter) {
  return TIMELINE_FILTER_LABELS[filter];
}

export function vendorFilterLabel(filter: VendorFilter) {
  return VENDOR_FILTER_LABELS[filter];
}
