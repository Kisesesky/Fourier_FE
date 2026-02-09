"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { BarChart3, CalendarRange, KanbanSquare, LayoutDashboard, Table2 } from "lucide-react";

import type { Issue, IssueGroup } from "@/workspace/issues/_model/types";
import {
  addSubtask,
  createIssue,
  deleteIssue,
  updateIssue,
} from "@/workspace/issues/_service/api";
import IssuesTableView from "@/workspace/issues/_components/views/IssuesTableView";
import IssuesTimelineView from "@/workspace/issues/_components/views/IssuesTimelineView";
import IssuesKanbanView from "@/workspace/issues/_components/views/IssuesKanbanView";
import IssuesChartView from "@/workspace/issues/_components/views/IssuesChartView";
import IssuesDashboardView from "@/workspace/issues/_components/views/IssuesDashboardView";
import { useIssuesBoardState, ViewMode } from "@/workspace/issues/_components/hooks/useIssuesBoardState";

const BASE_COLUMNS: Array<{ key: Issue["status"]; label: string }> = [
  { key: "todo", label: "할 일" },
  { key: "in_progress", label: "작업 중" },
  { key: "review", label: "리뷰 대기" },
  { key: "done", label: "완료" },
];

const VIEW_META: Record<ViewMode, { label: string; description: string; icon: typeof Table2 }> = {
  table: { label: "메인 테이블", description: "업무를 표 형식으로 관리합니다.", icon: Table2 },
  timeline: { label: "타임라인", description: "기간별 일정 흐름을 확인합니다.", icon: CalendarRange },
  kanban: { label: "칸반", description: "상태별로 업무를 이동하며 관리합니다.", icon: KanbanSquare },
  chart: { label: "차트", description: "업무 진행 지표를 시각화합니다.", icon: BarChart3 },
  dashboard: { label: "대시보드", description: "프로젝트 요약 지표를 확인합니다.", icon: LayoutDashboard },
};

export default function IssuesBoardView() {
  const params = useParams<{ teamId?: string; projectId?: string; id?: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const teamId = params?.teamId as string | undefined;
  const projectId = params?.projectId as string | undefined;
  const routeId = params?.id as string | undefined;

  const {
    issues,
    setIssues,
    issueGroups,
    setIssueGroups,
    groupModal,
    setGroupModal,
    groupDeleteModal,
    setGroupDeleteModal,
    issueCreateModal,
    setIssueCreateModal,
    issueActionsId,
    setIssueActionsId,
    issueDeleteModal,
    setIssueDeleteModal,
    issueEditModal,
    setIssueEditModal,
    issueDetail,
    setIssueDetail,
    commentThreads,
    setCommentThreads,
    openCommentThreads,
    setOpenCommentThreads,
    commentThreadDrafts,
    setCommentThreadDrafts,
    commentSubmitting,
    setCommentSubmitting,
    commentEditingId,
    setCommentEditingId,
    commentEditingDraft,
    setCommentEditingDraft,
    commentReactions,
    setCommentReactions,
    loading,
    memberMap,
    profile,
    tableStatusFilter,
    setTableStatusFilter,
    tablePriorityFilter,
    setTablePriorityFilter,
    tableOwnerFilter,
    setTableOwnerFilter,
    tableDateFilter,
    setTableDateFilter,
    tablePrioritySort,
    setTablePrioritySort,
    tableOwnerSort,
    setTableOwnerSort,
    tableDateSort,
    setTableDateSort,
    openFilter,
    setOpenFilter,
    view,
    setView,
    issueActionsRef,
    handleToggleComments,
    columns,
    grouped,
    tableGroups,
    handleAddGroup,
    handleRenameGroup,
    handleRemoveGroup,
    handleSubmitGroupModal,
    handleStatusChange,
    handleProgressCommit,
    handlePriorityChange,
    updateIssueTree,
  } = useIssuesBoardState({ teamId, projectId, baseColumns: BASE_COLUMNS });
  const [timelineFilters, setTimelineFilters] = useState<Record<string, boolean>>({});

  const timelineOptions = useMemo(() => {
    const opts = issueGroups.map((group) => ({ key: group.id, label: group.name }));
    const hasUngrouped = issues.some((issue) => !issue.group && !issue.parentId);
    if (hasUngrouped) {
      opts.push({ key: "ungrouped", label: "미분류" });
    }
    return opts;
  }, [issueGroups, issues]);

  const defaultIssueGroup = useMemo(
    () => issueGroups.find((group) => group.name === "프로젝트") ?? issueGroups[0],
    [issueGroups],
  );

  useEffect(() => {
    setTimelineFilters((prev) => {
      const next = { ...prev };
      let changed = false;
      timelineOptions.forEach((opt) => {
        if (next[opt.key] === undefined) {
          next[opt.key] = true;
          changed = true;
        }
      });
      Object.keys(next).forEach((key) => {
        if (!timelineOptions.find((opt) => opt.key === key)) {
          delete next[key];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [timelineOptions]);

  useEffect(() => {
    const viewParam = searchParams?.get("view") as ViewMode | null;
    if (!viewParam) return;
    if (["table", "timeline", "kanban", "chart", "dashboard"].includes(viewParam)) {
      setView(viewParam);
    }
  }, [searchParams, setView]);

  const submitIssueCreate = useCallback(async () => {
    if (!projectId || !issueCreateModal?.title.trim()) return;
    if (issueCreateModal.isSubtask && !issueCreateModal.parentId) return;
    const today = new Date().toISOString().slice(0, 10);
    let startAt = issueCreateModal.startAt || "";
    let endAt = issueCreateModal.endAt || "";
    if (!startAt && !endAt) {
      startAt = today;
      endAt = today;
    } else if (startAt && !endAt) {
      endAt = startAt;
    } else if (!startAt && endAt) {
      startAt = endAt;
    }
    if (issueCreateModal.isSubtask) {
      const minDate = issueCreateModal.parentStartAt || "";
      const maxDate = issueCreateModal.parentEndAt || "";
      if (minDate && startAt && startAt < minDate) startAt = minDate;
      if (maxDate && endAt && endAt > maxDate) endAt = maxDate;
      if (minDate && endAt && endAt < minDate) endAt = minDate;
      if (maxDate && startAt && startAt > maxDate) startAt = maxDate;
    }
    if (startAt && endAt && endAt < startAt) endAt = startAt;
    const created = issueCreateModal.isSubtask
      ? await addSubtask(projectId, {
          parentId: issueCreateModal.parentId ?? "",
          title: issueCreateModal.title.trim(),
          assigneeId: profile?.id,
          startAt: startAt || undefined,
          dueAt: endAt || undefined,
        })
      : await createIssue(projectId, {
          title: issueCreateModal.title.trim(),
          status: issueCreateModal.status,
          priority: issueCreateModal.priority,
          assigneeId: profile?.id,
          groupId: issueCreateModal.groupKey === "ungrouped" ? undefined : issueCreateModal.groupKey,
          startAt: startAt || undefined,
          endAt: endAt || undefined,
          parentId: issueCreateModal.parentId,
        });
    const fallbackGroup =
      issueCreateModal.groupKey === "ungrouped"
        ? defaultIssueGroup
        : issueGroups.find((group) => group.id === issueCreateModal.groupKey);
    const createdWithGroup =
      !issueCreateModal.isSubtask && !created.group && fallbackGroup
        ? { ...created, group: fallbackGroup }
        : created;
    const createdSubtask =
      issueCreateModal.isSubtask && issueCreateModal.parentId && !created.parentId
        ? { ...createdWithGroup, parentId: issueCreateModal.parentId }
        : createdWithGroup;
    setIssues((prev) => {
      const next = [...prev, createdSubtask];
      if (issueCreateModal.isSubtask && issueCreateModal.parentId) {
        return updateIssueTree(next, issueCreateModal.parentId, (item) => ({
          ...item,
          subtasks: [...(item.subtasks ?? []), createdSubtask],
        }));
      }
      return next;
    });
    if (issueCreateModal.isSubtask && issueCreateModal.parentId) {
      setIssueDetail((prev) => {
        if (!prev || prev.id !== issueCreateModal.parentId) return prev;
        return { ...prev, subtasks: [...(prev.subtasks ?? []), createdSubtask] };
      });
    }
    if (issueCreateModal.isSubtask) {
      const needsPriority = issueCreateModal.priority && issueCreateModal.priority !== "medium";
      const needsStatus = issueCreateModal.status && issueCreateModal.status !== "todo";
      if (needsPriority || needsStatus) {
        try {
          const updated = await updateIssue(projectId, createdSubtask.id, {
            priority: issueCreateModal.priority,
            status: issueCreateModal.status,
          });
          setIssues((prev) => updateIssueTree(prev, updated.id, () => updated));
        } catch {
          // ignore
        }
      }
    }
    setIssueCreateModal(null);
  }, [defaultIssueGroup, issueCreateModal, issueGroups, profile?.id, projectId, setIssueDetail, setIssues, updateIssueTree]);

  const submitIssueEdit = useCallback(async () => {
    if (!projectId || !issueEditModal) return;
    const updated = await updateIssue(projectId, issueEditModal.issue.id, {
      title: issueEditModal.title.trim(),
      startAt: issueEditModal.startAt || undefined,
      endAt: issueEditModal.endAt || undefined,
      groupId: issueEditModal.issue.group?.id,
    });
    setIssues((prev) => updateIssueTree(prev, updated.id, () => updated));
    setIssueDetail((prev) => {
      if (!prev) return prev;
      if (prev.id === updated.id) return { ...prev, ...updated };
      if (!prev.subtasks?.length) return prev;
      return {
        ...prev,
        subtasks: prev.subtasks.map((item) => (item.id === updated.id ? updated : item)),
      };
    });
    setIssueEditModal(null);
  }, [issueEditModal, projectId, setIssueDetail, setIssues, updateIssueTree]);

  useEffect(() => {
    if (!issueCreateModal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIssueCreateModal(null);
      }
      if (event.key === "Enter") {
        if (event.target instanceof HTMLTextAreaElement) return;
        event.preventDefault();
        void submitIssueCreate();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [issueCreateModal, submitIssueCreate, setIssueCreateModal]);

  useEffect(() => {
    if (!issueEditModal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIssueEditModal(null);
      }
      if (event.key === "Enter") {
        if (event.target instanceof HTMLTextAreaElement) return;
        event.preventDefault();
        void submitIssueEdit();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [issueEditModal, submitIssueEdit, setIssueEditModal]);

  const openIssue = (issueId: string) => {
    if (!pathname) return;
    if (pathname.endsWith(`/issues/${issueId}`)) return;
    router.push(`${pathname.replace(/\/issues(?:\/.*)?$/, "/issues")}/${issueId}`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <header className="border-b border-border bg-panel/70">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-10">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              {(() => {
                const Icon = VIEW_META[view].icon;
                return <Icon size={20} />;
              })()}
            </span>
            <div>
              <div className="text-lg font-semibold text-foreground">{VIEW_META[view].label}</div>
              <div className="text-sm text-muted">{VIEW_META[view].description}</div>
              {view === "timeline" && timelineOptions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                  {timelineOptions.map((opt) => (
                    <label key={opt.key} className="inline-flex items-center gap-2 rounded-full border border-border bg-panel/60 px-3 py-1">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5"
                        checked={timelineFilters[opt.key] ?? true}
                        onChange={(e) =>
                          setTimelineFilters((prev) => ({ ...prev, [opt.key]: e.target.checked }))
                        }
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <section className="flex min-h-0 flex-1 flex-col px-4 py-6 sm:px-10">
          {loading ? (
            <div className="rounded-xl border border-border bg-panel/60 p-6 text-sm text-muted">이슈를 불러오는 중입니다…</div>
          ) : (
            <>
              {view === "kanban" && (
                <IssuesKanbanView
                  columns={columns}
                  grouped={grouped}
                  memberMap={memberMap}
                  issueGroups={issueGroups}
                  onCreateIssue={(status) =>
                    setIssueCreateModal({
                      groupKey: defaultIssueGroup?.id ?? "ungrouped",
                      title: "",
                      status,
                      priority: "medium",
                      startAt: "",
                      endAt: "",
                    })
                  }
                  issueActionsId={issueActionsId}
                  setIssueActionsId={setIssueActionsId}
                  issueActionsRef={issueActionsRef}
                  onOpenIssue={openIssue}
                  setIssueCreateModal={setIssueCreateModal}
                  setIssueEditModal={setIssueEditModal}
                  setIssueDeleteModal={setIssueDeleteModal}
                  handleToggleComments={handleToggleComments}
                  commentThreads={commentThreads}
                  setCommentThreads={setCommentThreads}
                  openCommentThreads={openCommentThreads}
                  commentThreadDrafts={commentThreadDrafts}
                  setCommentThreadDrafts={setCommentThreadDrafts}
                  commentSubmitting={commentSubmitting}
                  setCommentSubmitting={setCommentSubmitting}
                  commentEditingId={commentEditingId}
                  setCommentEditingId={setCommentEditingId}
                  commentEditingDraft={commentEditingDraft}
                  setCommentEditingDraft={setCommentEditingDraft}
                  commentReactions={commentReactions}
                  setCommentReactions={setCommentReactions}
                  profile={profile}
                  projectId={projectId}
                />
              )}

              {view === "table" && (
                <IssuesTableView
                  tableGroups={tableGroups}
                  issueGroups={issueGroups}
                  columns={columns}
                  memberMap={memberMap}
                  openFilter={openFilter}
                  setOpenFilter={setOpenFilter}
                  tableDateFilter={tableDateFilter}
                  setTableDateFilter={setTableDateFilter}
                  tableOwnerFilter={tableOwnerFilter}
                  setTableOwnerFilter={setTableOwnerFilter}
                  tableStatusFilter={tableStatusFilter}
                  setTableStatusFilter={setTableStatusFilter}
                  tablePriorityFilter={tablePriorityFilter}
                  setTablePriorityFilter={setTablePriorityFilter}
                  tableDateSort={tableDateSort}
                  setTableDateSort={setTableDateSort}
                  tableOwnerSort={tableOwnerSort}
                  setTableOwnerSort={setTableOwnerSort}
                  tablePrioritySort={tablePrioritySort}
                  setTablePrioritySort={setTablePrioritySort}
                  issueActionsId={issueActionsId}
                  setIssueActionsId={setIssueActionsId}
                  issueActionsRef={issueActionsRef}
                  setIssueCreateModal={setIssueCreateModal}
                  setIssueEditModal={setIssueEditModal}
                  setIssueDeleteModal={setIssueDeleteModal}
                  setGroupDeleteModal={setGroupDeleteModal}
                  onOpenIssue={openIssue}
                  onRenameGroup={handleRenameGroup}
                  onAddGroup={handleAddGroup}
                  handleStatusChange={handleStatusChange}
                  handleProgressCommit={handleProgressCommit}
                  handlePriorityChange={handlePriorityChange}
                  setIssues={setIssues}
                  handleToggleComments={handleToggleComments}
                  commentThreads={commentThreads}
                  setCommentThreads={setCommentThreads}
                  openCommentThreads={openCommentThreads}
                  commentThreadDrafts={commentThreadDrafts}
                  setCommentThreadDrafts={setCommentThreadDrafts}
                  commentSubmitting={commentSubmitting}
                  setCommentSubmitting={setCommentSubmitting}
                  commentEditingId={commentEditingId}
                  setCommentEditingId={setCommentEditingId}
                  commentEditingDraft={commentEditingDraft}
                  setCommentEditingDraft={setCommentEditingDraft}
                  commentReactions={commentReactions}
                  setCommentReactions={setCommentReactions}
                  profile={profile}
                  projectId={projectId}
                />
              )}

              {view === "timeline" && (
                <IssuesTimelineView issues={issues} memberMap={memberMap} groupFilter={timelineFilters} />
              )}

              {view === "chart" && (
                <IssuesChartView
                  issues={issues}
                  memberMap={memberMap}
                  issueGroups={issueGroups}
                  loading={loading}
                />
              )}

              {view === "dashboard" && (
                <IssuesDashboardView
                  issues={issues}
                  memberMap={memberMap}
                  issueGroups={issueGroups}
                  loading={loading}
                />
              )}
            </>
          )}
        </section>

        {routeId && null}
      </div>
      {groupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-panel p-4 shadow-lg">
            <div className="mb-3 text-sm font-semibold text-foreground">
              {groupModal.mode === "create" ? "테이블 추가" : "테이블 수정"}
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted">이름</div>
                <input
                  value={groupModal.name}
                  onChange={(e) => setGroupModal((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                  placeholder="예: 메인업무"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted">색상</div>
                <input
                  type="color"
                  value={groupModal.color}
                  onChange={(e) => setGroupModal((prev) => (prev ? { ...prev, color: e.target.value } : prev))}
                  className="h-9 w-16 cursor-pointer rounded-md border border-border bg-background p-0"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setGroupModal(null)}
                className="h-9 rounded-md border border-border px-3 text-sm text-muted hover:bg-subtle/60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmitGroupModal}
                className="h-9 rounded-md bg-brand px-3 text-sm font-semibold text-white hover:bg-brand/90"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
      {groupDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-panel p-4 shadow-lg">
            <div className="mb-2 text-sm font-semibold text-foreground">테이블 삭제</div>
            <div className="text-sm text-muted">
              “{groupDeleteModal.name}” 테이블을 삭제할까요? 이슈는 미분류로 이동됩니다.
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setGroupDeleteModal(null)}
                className="h-9 rounded-md border border-border px-3 text-sm text-muted hover:bg-subtle/60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = groupDeleteModal;
                  setGroupDeleteModal(null);
                  if (target) await handleRemoveGroup(target);
                }}
                className="h-9 rounded-md bg-rose-500 px-3 text-sm font-semibold text-white hover:bg-rose-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
      {issueCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-panel p-4 shadow-lg">
            <div className="mb-3 text-sm font-semibold text-foreground">이슈 추가</div>
            <div className="space-y-3">
              {issueCreateModal.isSubtask && (
                <div className="rounded-md border border-border/60 bg-background/60 px-3 py-2 text-xs text-muted">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-[2px] rounded-full bg-border" />
                    <span className="text-foreground">하위 업무 추가</span>
                  </div>
                  {issueCreateModal.parentTitle && (
                    <div className="mt-1 pl-4 text-[11px] text-muted">상위: {issueCreateModal.parentTitle}</div>
                  )}
                </div>
              )}
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted">제목</div>
                <input
                  value={issueCreateModal.title}
                  onChange={(e) => setIssueCreateModal((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                  placeholder="업무 제목을 입력하세요"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted">상태</div>
                  <select
                    value={issueCreateModal.status}
                    onChange={(e) =>
                      setIssueCreateModal((prev) =>
                        prev ? { ...prev, status: e.target.value as Issue["status"] } : prev,
                      )
                    }
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  >
                    <option value="todo">할 일</option>
                    <option value="in_progress">작업 중</option>
                    <option value="review">리뷰 대기</option>
                    <option value="done">완료</option>
                    {columns.some((c) => c.key === "backlog") && <option value="backlog">백로그</option>}
                  </select>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted">우선순위</div>
                  <select
                    value={issueCreateModal.priority}
                    onChange={(e) =>
                      setIssueCreateModal((prev) =>
                        prev ? { ...prev, priority: e.target.value as Issue["priority"] } : prev,
                      )
                    }
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  >
                                    <option value="very_low">매우 낮음</option>
                                    <option value="low">낮음</option>
                    <option value="medium">중간</option>
                    <option value="high">높음</option>
                    <option value="urgent">매우 높음</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted">시작일</div>
                  <input
                    type="date"
                    value={issueCreateModal.startAt}
                    onChange={(e) => setIssueCreateModal((prev) => (prev ? { ...prev, startAt: e.target.value } : prev))}
                    min={issueCreateModal.isSubtask ? issueCreateModal.parentStartAt : undefined}
                    max={issueCreateModal.isSubtask ? issueCreateModal.parentEndAt : undefined}
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted">종료일</div>
                  <input
                    type="date"
                    value={issueCreateModal.endAt}
                    onChange={(e) => setIssueCreateModal((prev) => (prev ? { ...prev, endAt: e.target.value } : prev))}
                    min={issueCreateModal.isSubtask ? issueCreateModal.parentStartAt : undefined}
                    max={issueCreateModal.isSubtask ? issueCreateModal.parentEndAt : undefined}
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  />
                </div>
              </div>
              {!issueCreateModal.isSubtask && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted">테이블 선택</div>
                  <select
                    value={issueCreateModal.groupKey}
                    onChange={(e) =>
                      setIssueCreateModal((prev) =>
                        prev ? { ...prev, groupKey: e.target.value } : prev,
                      )
                    }
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  >
                    <option value="ungrouped">미분류</option>
                    {issueGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIssueCreateModal(null)}
                className="h-9 rounded-md border border-border px-3 text-sm text-muted hover:bg-subtle/60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void submitIssueCreate()}
                className="h-9 rounded-md bg-brand px-3 text-sm font-semibold text-white hover:bg-brand/90"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
      {issueEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-panel p-4 shadow-lg">
            <div className="mb-3 text-sm font-semibold text-foreground">이슈 수정</div>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted">제목</div>
                <input
                  value={issueEditModal.title}
                  onChange={(e) => setIssueEditModal((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted">시작일</div>
                  <input
                    type="date"
                    value={issueEditModal.startAt}
                    onChange={(e) => setIssueEditModal((prev) => (prev ? { ...prev, startAt: e.target.value } : prev))}
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted">종료일</div>
                  <input
                    type="date"
                    value={issueEditModal.endAt}
                    onChange={(e) => setIssueEditModal((prev) => (prev ? { ...prev, endAt: e.target.value } : prev))}
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted">테이블 이동</div>
                <select
                  value={issueEditModal.issue.group?.id ?? "ungrouped"}
                  onChange={(e) =>
                    setIssueEditModal((prev) =>
                      prev
                        ? {
                            ...prev,
                            issue: {
                              ...prev.issue,
                              group: e.target.value === "ungrouped"
                                ? undefined
                                : issueGroups.find((g) => g.id === e.target.value),
                            },
                          }
                        : prev,
                    )
                  }
                  className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                >
                  <option value="ungrouped">미분류</option>
                  {issueGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIssueEditModal(null)}
                className="h-9 rounded-md border border-border px-3 text-sm text-muted hover:bg-subtle/60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void submitIssueEdit()}
                className="h-9 rounded-md bg-brand px-3 text-sm font-semibold text-white hover:bg-brand/90"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
      {issueDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-panel p-4 shadow-lg">
            <div className="mb-2 text-sm font-semibold text-foreground">이슈 삭제</div>
            <div className="text-sm text-muted">“{issueDeleteModal.title}” 이슈를 삭제할까요?</div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIssueDeleteModal(null)}
                className="h-9 rounded-md border border-border px-3 text-sm text-muted hover:bg-subtle/60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!projectId) return;
                  await deleteIssue(projectId, issueDeleteModal.id);
                  setIssues((prev) => prev.filter((item) => item.id !== issueDeleteModal.id));
                  setIssueDeleteModal(null);
                }}
                className="h-9 rounded-md bg-rose-500 px-3 text-sm font-semibold text-white hover:bg-rose-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
