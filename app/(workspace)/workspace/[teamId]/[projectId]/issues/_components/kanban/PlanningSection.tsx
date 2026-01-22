import { useKanban } from "@/workspace/issues/_model/store";
import type { TimelineFilter, WorkflowStatus } from "@/workspace/issues/_model/kanbanTypes";
import { ChevronDown, ChevronRight, Filter, Plus, Search, X } from "lucide-react";
import type { FormEvent } from "react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

import { BASE_DAY_CELL, ROW_HEIGHT, WORKFLOW_BAR_COLOR, WORKFLOW_STATUS_LABEL, WORKFLOW_STATUS_PILL, WORKFLOW_STATUSES } from "./constants";
import { buildTimelineDays, DAY_IN_MS, formatDateInput, formatShortDate, isToday } from "./date";
import { KANBAN_TEXT } from "./text";
import type { HeaderChip, QuickTaskFormState } from "./types";
import { buildWorkflowRows, computeWorkflowRange, entityToList, getBarPosition, timelineFilterLabel } from "./utils";
import { validateQuickTaskForm } from "./validation";

export function PlanningSection() {
  const {
    productionStats,
    workflow,
    filters,
    openFilterPanel,
    toggleWorkflowNode,
    humanResources,
    setTimelineFilter,
    setOwnerFilter,
    setScopeFilter,
    createQuickTask,
    emitWorkflowUpdate,
  } = useKanban((state) => ({
    productionStats: state.productionStats,
    workflow: state.workflow,
    filters: state.filters,
    openFilterPanel: state.openFilterPanel,
    toggleWorkflowNode: state.toggleWorkflowNode,
    humanResources: state.humanResources,
    setTimelineFilter: state.setTimelineFilter,
    setOwnerFilter: state.setOwnerFilter,
    setScopeFilter: state.setScopeFilter,
    createQuickTask: state.createQuickTask,
    emitWorkflowUpdate: state.emitWorkflowUpdate,
  }));

  const humans = useMemo(() => entityToList(humanResources), [humanResources]);
  const humanColorMap = useMemo(
    () =>
      humans.reduce<Record<string, { name: string; color: string }>>((acc, person) => {
        acc[person.id] = { name: person.name, color: person.color };
        return acc;
      }, {}),
    [humans],
  );
  const workflowRows = useMemo(() => buildWorkflowRows(workflow, filters.timeline), [workflow, filters.timeline]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const ownerOptions = useMemo(() => {
    const unique = new Set<string>();
    workflowRows.forEach((row) => {
      if (row.owner) unique.add(row.owner);
    });
    return Array.from(unique);
  }, [workflowRows]);
  useEffect(() => {
    if (filters.scope !== "mine") return;
    if (filters.owner === "all" && ownerOptions.length) {
      setOwnerFilter(ownerOptions[0]);
    } else if (filters.owner !== "all" && !ownerOptions.includes(filters.owner)) {
      setOwnerFilter(ownerOptions[0] || "all");
    }
  }, [filters.scope, filters.owner, ownerOptions, setOwnerFilter]);
  const searchFilteredRows = useMemo(() => {
    if (!searchTerm.trim()) return workflowRows;
    const keyword = searchTerm.toLowerCase();
    return workflowRows.filter((row) =>
      row.title.toLowerCase().includes(keyword) || row.id.toLowerCase().includes(keyword),
    );
  }, [workflowRows, searchTerm]);
  const visibleRows = useMemo(() => {
    if (filters.scope === "mine" && filters.owner !== "all") {
      return searchFilteredRows.filter((row) => row.owner === filters.owner);
    }
    return searchFilteredRows;
  }, [searchFilteredRows, filters.scope, filters.owner]);
  const statusHighlights = useMemo(() => {
    const config = [
      { key: "done" as const, label: KANBAN_TEXT.labels.statusHighlights.done, classes: "border-emerald-200 bg-emerald-50 text-emerald-700" },
      { key: "in-progress" as const, label: KANBAN_TEXT.labels.statusHighlights.inProgress, classes: "border-brand/30 bg-brand/5 text-brand" },
      { key: "delayed" as const, label: KANBAN_TEXT.labels.statusHighlights.delayed, classes: "border-rose-200 bg-rose-50 text-rose-600" },
    ];
    return config.map((item) => {
      const count = visibleRows.filter((row) => {
        if (item.key === "delayed") {
          return row.status === "blocked" || row.status === "at-risk";
        }
        return row.status === item.key;
      }).length;
      return { ...item, count };
    });
  }, [visibleRows]);
  const [zoom, setZoom] = useState(100);
  const dayCellWidth = useMemo(() => Math.round((BASE_DAY_CELL * zoom) / 100), [zoom]);
  const timelineRange = useMemo(() => computeWorkflowRange(workflow), [workflow]);
  const timelineDays = useMemo(() => (timelineRange ? buildTimelineDays(timelineRange) : []), [timelineRange]);
  const timelineWidth = Math.max(timelineDays.length * dayCellWidth, 640);
  const [detailNodeId, setDetailNodeId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskFormError, setTaskFormError] = useState<string | null>(null);
  const [toolbarHint, setToolbarHint] = useState<string | null>(null);
  const defaultTaskForm = useMemo<QuickTaskFormState>(() => {
    const start = new Date();
    const end = new Date(start.getTime() + DAY_IN_MS * 2);
    return {
      title: "",
      owner: filters.owner !== "all" ? filters.owner : ownerOptions[0] || "",
      start: formatDateInput(start),
      end: formatDateInput(end),
      status: "in-progress" as WorkflowStatus,
    };
  }, [filters.owner, ownerOptions]);
  const [taskForm, setTaskForm] = useState<QuickTaskFormState>(defaultTaskForm);
  useEffect(() => {
    setTaskForm((prev) => ({ ...prev, owner: prev.owner || defaultTaskForm.owner }));
  }, [defaultTaskForm]);
  useEffect(() => {
    setTaskFormError(validateQuickTaskForm(taskForm));
  }, [taskForm]);
  const toggleDetail = (id: string) => setDetailNodeId((prev) => (prev === id ? null : id));
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);
  const timelineCycle: TimelineFilter[] = ["all", ...WORKFLOW_STATUSES];

  useEffect(() => {
    const preset = viewMode === "day" ? 110 : viewMode === "week" ? 90 : 75;
    setZoom((prev) => (prev === preset ? prev : preset));
  }, [viewMode]);

  const scrollToToday = () => {
    if (!timelineScrollRef.current) return;
    const container = timelineScrollRef.current;
    const todayIndex = timelineDays.findIndex((day) => isToday(day.ts));
    if (todayIndex === -1) {
      setToolbarHint(KANBAN_TEXT.messages.noToday);
      return;
    }
    setToolbarHint(null);
    const target = todayIndex * dayCellWidth - container.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  };

  const toggleScopeFilter = () => {
    const next = filters.scope === "mine" ? "all" : "mine";
    setScopeFilter(next);
    if (next === "mine" && filters.owner === "all" && ownerOptions.length) {
      setOwnerFilter(ownerOptions[0]);
    }
  };

  const cycleOwnerFilter = () => {
    if (!ownerOptions.length) return;
    if (filters.scope !== "mine") {
      setScopeFilter("mine");
      setOwnerFilter(ownerOptions[0]);
      return;
    }
    const current = filters.owner === "all" ? ownerOptions[0] : filters.owner;
    const currentIndex = ownerOptions.indexOf(current);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % ownerOptions.length;
    setOwnerFilter(ownerOptions[nextIndex]);
  };

  const handleStatusChip = () => {
    const currentIndex = timelineCycle.indexOf(filters.timeline);
    const nextIndex = (currentIndex + 1) % timelineCycle.length;
    setTimelineFilter(timelineCycle[nextIndex]);
  };
  const updateNodeStatus = (id: string, status: WorkflowStatus) => {
    emitWorkflowUpdate({ nodeId: id, status });
  };
  const updateNodeProgress = (id: string, value: number) => {
    emitWorkflowUpdate({ nodeId: id, progress: value / 100 });
  };

  const resetPlanningFilters = () => {
    setSearchTerm("");
    setScopeFilter("all");
    setOwnerFilter("all");
    setTimelineFilter("all");
  };

  const headerFilterChips: HeaderChip[] = [
    {
      label: KANBAN_TEXT.filters.view.label,
      value: filters.scope === "mine" ? KANBAN_TEXT.filters.view.mine : KANBAN_TEXT.filters.view.all,
      onClick: toggleScopeFilter,
      onReset: filters.scope === "all" ? undefined : () => setScopeFilter("all"),
    },
    {
      label: KANBAN_TEXT.filters.owner.label,
      value:
        filters.scope === "mine"
          ? filters.owner === "all"
            ? ownerOptions[0] || KANBAN_TEXT.filters.owner.empty
            : filters.owner
          : KANBAN_TEXT.filters.view.all,
      onClick: cycleOwnerFilter,
      onReset:
        filters.owner === "all"
          ? undefined
          : () => {
              setOwnerFilter("all");
              setScopeFilter("all");
            },
      disabled: !ownerOptions.length,
    },
    {
      label: KANBAN_TEXT.filters.status.label,
      value: timelineFilterLabel(filters.timeline),
      onClick: handleStatusChip,
      onReset: filters.timeline === "all" ? undefined : () => setTimelineFilter("all"),
    },
  ];

  const isTaskFormValid = !taskFormError;

  const handleTaskSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateQuickTaskForm(taskForm);
    if (validation) {
      setTaskFormError(validation);
      return;
    }
    createQuickTask({
      title: taskForm.title.trim(),
      owner: taskForm.owner,
      startDate: taskForm.start,
      endDate: taskForm.end,
      status: taskForm.status,
    });
    setTaskDialogOpen(false);
    setTaskForm(defaultTaskForm);
    setTaskFormError(null);
  };

  return (
    <div className="space-y-6">
      <section className="w-full rounded-3xl border border-border bg-panel shadow-sm">
        <div className="space-y-4 border-b border-border/60 px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
              <label className="flex flex-1 items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-2 text-sm text-muted focus-within:border-brand">
                <Search size={14} className="text-muted" />
                <span className="sr-only">{KANBAN_TEXT.filters.taskSearch}</span>
                <input
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
                  placeholder={KANBAN_TEXT.filters.taskSearch}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>
              <div className="flex items-center gap-2 text-xs">
                <select
                  className="rounded-full border border-border/70 bg-background px-3 py-2 text-[10px] font-semibold text-muted"
                  value={viewMode}
                  onChange={(event) => setViewMode(event.target.value as typeof viewMode)}
                >
                  <option value="day">{KANBAN_TEXT.viewModes.day}</option>
                  <option value="week">{KANBAN_TEXT.viewModes.week}</option>
                  <option value="month">{KANBAN_TEXT.viewModes.month}</option>
                </select>
                <div className="flex items-center gap-1 rounded-full border border-border/70 bg-background px-2 py-1.5 text-[10px] font-semibold text-muted">
                  <button type="button" aria-label="Zoom out" className="rounded-full p-1 hover:text-brand" onClick={() => setZoom((prev) => Math.max(70, prev - 10))}>
                    -
                  </button>
                  <span>{zoom}%</span>
                  <button type="button" aria-label="Zoom in" className="rounded-full p-1 hover:text-brand" onClick={() => setZoom((prev) => Math.min(140, prev + 10))}>
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-border/70 px-3 py-2 text-[10px] font-semibold text-muted hover:border-brand hover:text-brand"
                  onClick={scrollToToday}
                >
                  {KANBAN_TEXT.actions.today}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="rounded-full border border-border/60 px-3 py-1">{`${visibleRows.length}${KANBAN_TEXT.labels.taskCountSuffix}`}</span>
              <button
                type="button"
                onClick={() => openFilterPanel("timeline")}
                className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-muted hover:border-brand hover:bg-brand/5 hover:text-brand"
              >
                <Filter size={12} />
                {KANBAN_TEXT.actions.filter}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTaskForm(defaultTaskForm);
                  setTaskFormError(null);
                  setTaskDialogOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-3 py-2 text-xs font-semibold text-white shadow-sm"
              >
                <Plus size={12} /> {KANBAN_TEXT.actions.newTask}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted">
            {headerFilterChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.onClick}
                disabled={chip.disabled}
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 transition",
                  chip.disabled
                    ? "cursor-not-allowed border-border/40 text-muted/70"
                    : "border-border/60 bg-background/70 hover:border-brand hover:text-brand",
                ].join(" ")}
              >
                <span className="text-[10px] uppercase tracking-[0.2em]">{chip.label}</span>
                <span className="text-sm font-semibold text-foreground">{chip.value}</span>
                {chip.onReset && !chip.disabled ? (
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(event) => {
                      event.stopPropagation();
                      chip.onReset?.();
                    }}
                    className="rounded-full border border-border/50 p-1 text-muted hover:text-brand"
                  >
                    <X size={12} />
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            {statusHighlights.map((highlight) => (
              <span
                key={highlight.label}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold ${highlight.classes}`}
              >
                <span className="text-base leading-none">{highlight.count}</span>
                <span>{highlight.label}</span>
              </span>
            ))}
          </div>
          {toolbarHint && <p className="text-[10px] text-rose-500">{toolbarHint}</p>}
        </div>

        <div className="grid w-full gap-6 px-3 py-6 sm:px-8 lg:grid-cols-[3fr_2fr]">
          <div className="overflow-x-auto rounded-2xl border border-border bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="px-3 py-3 text-left">{KANBAN_TEXT.labels.taskTable.title}</th>
                  <th className="px-3 py-3 text-left">{KANBAN_TEXT.filters.owner.label}</th>
                  <th className="px-3 py-3 text-left">{KANBAN_TEXT.labels.taskTable.status}</th>
                  <th className="px-3 py-3 text-left">{KANBAN_TEXT.labels.taskTable.progress}</th>
                  <th className="px-3 py-3 text-left">{KANBAN_TEXT.labels.quickTask.start}</th>
                  <th className="px-3 py-3 text-left">{KANBAN_TEXT.labels.quickTask.end}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 text-xs">
                {visibleRows.map((node) => {
                  const indent = node.depth * 16;
                  const isParent = node.hasChildren;
                  const isExpanded = workflow.expanded[node.id];
                  const progressPercent = Math.round(node.progress * 100);
                  const startLabel = formatShortDate(node.startDate);
                  const endLabel = formatShortDate(node.endDate);
                  return (
                    <Fragment key={node.id}>
                      <tr style={{ height: ROW_HEIGHT }} className="transition hover:bg-brand/5">
                        <td className="px-3">
                          <div className="flex items-center gap-2" style={{ paddingLeft: indent }}>
                            {isParent ? (
                              <button
                                type="button"
                                onClick={() => toggleWorkflowNode(node.id)}
                                className="rounded-full border border-border p-1 text-muted hover:text-foreground"
                                aria-label={isExpanded ? "Collapse node" : "Expand node"}
                              >
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                            ) : (
                              <span className="h-1.5 w-1.5 rounded-full bg-border" />
                            )}
                            <div className="max-w-[220px]">
                              <p className="truncate text-sm font-semibold text-foreground">{node.title}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 text-sm text-muted">{node.owner || KANBAN_TEXT.filters.owner.empty}</td>
                        <td className="px-3">
                          <select
                            className="rounded-full border border-border/60 bg-background px-3 py-1 text-[10px] font-semibold"
                            aria-label={`${node.title} ${KANBAN_TEXT.labels.statusChange}`}
                            value={node.status}
                            onChange={(event) => updateNodeStatus(node.id, event.target.value as WorkflowStatus)}
                          >
                            {WORKFLOW_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {WORKFLOW_STATUS_LABEL[status]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3">
                          <label className="flex items-center gap-2" htmlFor={`progress-${node.id}`}>
                            <span className="sr-only" id={`progress-label-${node.id}`}>
                              {node.title} {KANBAN_TEXT.labels.taskTable.progress}
                            </span>
                            <input
                              id={`progress-${node.id}`}
                              type="range"
                              min={0}
                              max={100}
                              step={1}
                              aria-labelledby={`progress-label-${node.id}`}
                              value={progressPercent}
                              onChange={(event) => updateNodeProgress(node.id, Number(event.target.value))}
                              className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-slate-200"
                            />
                            <span className="text-xs font-semibold text-foreground">{progressPercent}%</span>
                          </label>
                        </td>
                        <td className="px-3 text-sm text-muted">{startLabel}</td>
                        <td className="px-3 text-sm text-muted">
                          <div className="flex items-center justify-between gap-2">
                            <span>{endLabel}</span>
                            <button
                              type="button"
                              onClick={() => toggleDetail(node.id)}
                              className="text-[10px] font-semibold text-brand underline-offset-2 hover:underline"
                            >
                              {detailNodeId === node.id ? KANBAN_TEXT.labels.detail.close : KANBAN_TEXT.labels.detail.open}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {detailNodeId === node.id && (
                        <tr>
                          <td colSpan={6} className="bg-background/80 px-6 py-4">
                            <div className="space-y-3 text-[10px] text-muted">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="font-semibold text-foreground">{node.title}</span>
                                <StatusBadge label={node.status} />
                                <span>
                                  {node.durationDays}d · {Math.round(node.progress * 100)}%
                                </span>
                                <span>
                                  {startLabel} → {endLabel}
                                </span>
                              </div>
                              {node.assignments.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Assignments</p>
                                  <div className="flex flex-wrap gap-2">
                                    {node.assignments.map((assignment) => {
                                      const meta = humanColorMap[assignment.assigneeId];
                                      return (
                                        <span
                                          key={assignment.id}
                                          className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-[10px] font-semibold text-white"
                                          style={{ backgroundColor: meta?.color || "#4B5563" }}
                                        >
                                          {meta?.name || assignment.assigneeName}
                                          <span className="text-[10px] font-normal">
                                            {assignment.role} · {Math.round(assignment.allocation * 100)}%
                                          </span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {node.dependencies.length > 0 && (
                                <div>
                                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Dependencies</p>
                                  <div className="mt-1 flex flex-wrap gap-2">
                                    {node.dependencies.map((dep) => (
                                      <span key={dep} className="rounded border border-border/70 px-2 py-1 text-[10px]">
                                        {workflow.nodes.byId[dep]?.title || dep}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {node.riskNote && <p className="text-rose-500">Risk: {node.riskNote}</p>}
                              {node.forecastEndDate && <p>Forecast end → {formatShortDate(node.forecastEndDate)}</p>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {!visibleRows.length && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-muted">
                      <div className="space-y-2">
                        <p>{KANBAN_TEXT.empty.noTasks}</p>
                        <button
                          type="button"
                          onClick={resetPlanningFilters}
                          className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1.5 text-xs font-semibold text-muted hover:border-brand hover:text-brand"
                        >
                          {KANBAN_TEXT.actions.resetFilters}
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div ref={timelineScrollRef} className="overflow-auto rounded-2xl border border-border bg-background/40 scrollbar-thin">
            {timelineRange ? (
              <div className="min-w-[520px]">
                <div className="sticky top-0 z-10 flex items-center justify-between bg-background/90 px-2 py-2 text-[10px] font-semibold text-muted">
                  <div className="flex flex-1">
                    {timelineDays.map((day) => {
                      const todayLabel = isToday(day.ts);
                      return (
                        <div
                          key={day.ts}
                          className={`border-r px-2 text-center ${todayLabel ? "border-brand/60 bg-brand/5 font-semibold text-brand" : "border-border/40"}`}
                          style={{ width: dayCellWidth }}
                        >
                          {day.label}
                        </div>
                      );
                    })}
                  </div>
                  <div className="ml-4 flex items-center gap-2 text-[10px]">
                    <span className="rounded-full border border-border/60 px-2 py-1">
                      Zoom {zoom}%
                    </span>
                <button
                  type="button"
                  onClick={scrollToToday}
                  className="rounded-full border border-border/60 px-2 py-1 text-muted hover:border-brand hover:text-brand"
                >
                  {KANBAN_TEXT.actions.today}
                </button>
                  </div>
                </div>
                <div className="relative px-2 pb-4">
                  <div className="relative border-l border-border/60" style={{ height: ROW_HEIGHT * visibleRows.length, width: timelineWidth }}>
                    {timelineDays.map((day, index) => (
                      <div
                        key={`${day.ts}-grid`}
                        className={`absolute top-0 bottom-0 border-r ${isToday(day.ts) ? "border-brand/70" : "border-border/30"}`}
                        style={{ left: index * dayCellWidth, width: dayCellWidth }}
                      >
                        {isToday(day.ts) && <div className="absolute inset-y-0 left-1/2 w-px bg-brand" />}
                      </div>
                    ))}
                    {visibleRows.map((node, index) => {
                      const position = getBarPosition(timelineRange, node, timelineWidth);
                      const top = index * ROW_HEIGHT + ROW_HEIGHT / 3;
                      const left = (position.offsetPercent / 100) * timelineWidth;
                      const barWidth = (position.widthPercent / 100) * timelineWidth;
                      const progressPercent = Math.round(node.progress * 100);
                      if (node.milestone) {
                        return (
                          <div key={`${node.id}-milestone`} className="absolute" style={{ top, left: left - 6 }}>
                            <div className="h-3 w-3 rotate-45 rounded-sm bg-brand shadow" />
                          </div>
                        );
                      }
                      const showStatusLabel = barWidth > 80;
                      const barLabel = `${node.title} ${WORKFLOW_STATUS_LABEL[node.status]} ${progressPercent}% (${formatShortDate(node.startDate)} ~ ${formatShortDate(node.endDate)})`;
                      return (
                        <div
                          key={node.id}
                          className="absolute flex items-center gap-2 rounded-full text-[10px] font-semibold text-white"
                          style={{
                            top,
                            left,
                            width: Math.max(barWidth, 34),
                            height: 22,
                            padding: "0 12px",
                            backgroundColor: WORKFLOW_BAR_COLOR[node.status],
                            boxShadow: "0 6px 14px rgba(15,23,42,0.18)",
                            backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0))",
                          }}
                          tabIndex={0}
                          aria-label={barLabel}
                        >
                          <span>{progressPercent}%</span>
                          {showStatusLabel && (
                            <span className="text-[10px] font-medium uppercase tracking-[0.25em]">
                              {WORKFLOW_STATUS_LABEL[node.status]}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <p className="px-3 py-6 text-center text-xs text-muted">No timeline data available.</p>
            )}
          </div>
        </div>
      </section>
      {taskDialogOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3 py-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-panel p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted">{KANBAN_TEXT.actions.newTask}</p>
                <h3 className="text-lg font-semibold">{KANBAN_TEXT.labels.quickTask.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTaskDialogOpen(false);
                  setTaskFormError(null);
                }}
                className="rounded-full border border-border p-1 text-muted hover:text-foreground"
                aria-label="Close quick task dialog"
              >
                <X size={16} />
              </button>
            </div>
            <form className="mt-4 space-y-4" onSubmit={handleTaskSubmit}>
              <label className="space-y-1 text-sm">
                <span className="text-muted">{KANBAN_TEXT.labels.quickTask.name}</span>
                <input
                  className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
                  value={taskForm.title}
                  onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder={KANBAN_TEXT.labels.quickTask.placeholder}
                  required
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-muted">{KANBAN_TEXT.labels.quickTask.owner}</span>
                  <select
                    className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
                    value={taskForm.owner}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, owner: event.target.value }))}
                    required
                  >
                    <option value="" disabled>
                      {KANBAN_TEXT.labels.quickTask.ownerPlaceholder}
                    </option>
                    {ownerOptions.map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted">{KANBAN_TEXT.labels.quickTask.status}</span>
                  <select
                    className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
                    value={taskForm.status}
                    onChange={(event) =>
                      setTaskForm((prev) => ({ ...prev, status: event.target.value as WorkflowStatus }))
                    }
                  >
                    {WORKFLOW_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {WORKFLOW_STATUS_LABEL[status]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-muted">{KANBAN_TEXT.labels.quickTask.start}</span>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
                    value={taskForm.start}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, start: event.target.value }))}
                    required
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted">{KANBAN_TEXT.labels.quickTask.end}</span>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
                    value={taskForm.end}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, end: event.target.value }))}
                    required
                  />
                </label>
              </div>
              {taskFormError && <p className="text-xs text-rose-500">{taskFormError}</p>}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="rounded-full border border-border/70 px-3 py-2 text-sm text-muted hover:border-rose-300 hover:text-foreground"
                  onClick={() => {
                    setTaskDialogOpen(false);
                    setTaskFormError(null);
                  }}
                >
                  {KANBAN_TEXT.actions.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!isTaskFormValid}
                  className="rounded-full bg-brand px-3 py-2 text-sm font-semibold text-white shadow disabled:opacity-50"
                >
                  {KANBAN_TEXT.actions.add}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ label }: { label: WorkflowStatus }) {
  return (
    <span className={["inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold", WORKFLOW_STATUS_PILL[label]].join(" ")}>
      {timelineFilterLabel(label)}
    </span>
  );
}
