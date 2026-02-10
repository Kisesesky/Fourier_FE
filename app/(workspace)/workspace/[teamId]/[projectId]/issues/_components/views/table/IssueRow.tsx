// app/(workspace)/workspace/[teamId]/[projectId]/issues/_components/views/table/IssueRow.tsx
'use client';

import { CornerDownRight } from "lucide-react";
import type React from "react";

import type { Issue } from "@/workspace/issues/_model/types";
import {
  PRIORITY_STYLE,
  STATUS_STYLE,
  formatIssueDateRange,
} from "@/workspace/issues/_model/utils/issueViewUtils";

export default function IssueRow({
  issue,
  isSubtask,
  depth = 0,
  groupColor,
  memberMap,
  columns,
  setIssueActionsId,
  setIssues,
  handleStatusChange,
  handleProgressCommit,
  handlePriorityChange,
  onRowClick,
}: {
  issue: Issue;
  isSubtask?: boolean;
  depth?: number;
  groupColor?: string | null;
  memberMap: Record<string, { name: string; avatarUrl?: string | null }>;
  columns: Array<{ key: Issue["status"]; label: string }>;
  setIssueActionsId: React.Dispatch<React.SetStateAction<string | null>>;
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  handleStatusChange: (issue: Issue, next: Issue["status"]) => void | Promise<void>;
  handleProgressCommit: (issue: Issue, next: number) => void | Promise<void>;
  handlePriorityChange: (issue: Issue, next: Issue["priority"]) => void | Promise<void>;
  onRowClick?: () => void;
}) {
  const subtask = isSubtask ?? false;
  const colorBase = groupColor ?? "#94a3b8";
  const hexToRgba = (hex: string, alpha: number) => {
    const normalized = hex.replace("#", "");
    if (normalized.length !== 6) return `rgba(148,163,184,${alpha})`;
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const depthLevel = depth > 0 ? depth : subtask ? 1 : 0;
  const bgAlpha = depthLevel >= 2 ? 0.04 : depthLevel === 1 ? 0.07 : 0.12;
  const tintBg = hexToRgba(colorBase, bgAlpha);
  const member =
    (issue.assigneeId && memberMap[issue.assigneeId]) ||
    Object.values(memberMap).find((m) => m.name === issue.assignee);
  const avatar = member?.avatarUrl;
  const assigneeName = member?.name || issue.assignee || "미지정";
  const rowText =
    depthLevel >= 2 ? "text-[11px]" : depthLevel === 1 ? "text-[12px]" : "text-sm";
  const titleHeight =
    depthLevel >= 2 ? "h-8" : depthLevel === 1 ? "h-9" : "h-11";
  const cellText =
    depthLevel >= 2 ? "text-[11px]" : depthLevel === 1 ? "text-[12px]" : "text-md";
  const avatarSize =
    depthLevel >= 2 ? "h-7 w-7" : depthLevel === 1 ? "h-8 w-8" : "h-10 w-10";
  const selectHeight =
    depthLevel >= 2 ? "h-8" : depthLevel === 1 ? "h-9" : "h-11";
  const progressHeight = "h-8";
  const progressInputHeight = "h-6 w-12 text-[10px]";
  const indentPx = depthLevel > 0 ? 8 + (depthLevel - 1) * 6 : 0;

  return (
    <div className="space-y-2">
      <div
        className={[
          "flex flex-col gap-2 rounded-md px-3 py-3 text-foreground md:grid md:grid-cols-[2fr_110px_120px_90px_90px_130px] md:items-center md:gap-2 md:py-2",
          rowText,
        ].join(" ")}
        onClick={(event) => {
          const target = event.target as HTMLElement | null;
          if (target && target.closest("select, input, button, a, textarea")) return;
          onRowClick?.();
        }}
      >
        <div
          className={[
            "md:hidden rounded-md px-2 py-1 font-semibold flex items-center gap-2 text-foreground",
            titleHeight,
            subtask ? "relative" : "",
          ].join(" ")}
          style={{ backgroundColor: tintBg, paddingLeft: subtask ? 24 + indentPx : undefined }}
        >
          {subtask && (
            <span
              className="absolute top-1/2 -translate-y-1/2 text-foreground/60"
              style={{ left: 10 + indentPx }}
            >
              <CornerDownRight size={12} />
            </span>
          )}
          <button
            type="button"
            onClick={() => setIssueActionsId((prev) => (prev === issue.id ? null : issue.id))}
            className="min-w-0 flex-1 truncate text-left font-semibold text-foreground"
            style={{ color: "inherit" }}
          >
            {issue.title || "제목 없음"}
          </button>
        </div>
        <div
          className={["md:hidden flex items-center justify-between rounded-md px-2 py-1 text-muted", titleHeight].join(" ")}
          style={{ backgroundColor: tintBg }}
        >
          <span className={subtask ? "text-[10px]" : "text-[11px]"}>{formatIssueDateRange(issue.startAt, issue.endAt)}</span>
          <div className="flex items-center gap-2 text-foreground">
            {avatar ? (
              <img
                src={avatar}
                alt={assigneeName || "avatar"}
                className={["rounded-full object-cover", subtask ? "h-4 w-4" : "h-5 w-5"].join(" ")}
              />
            ) : (
              <div
                className={[
                  "flex items-center justify-center rounded-full bg-subtle font-semibold text-muted",
                  subtask ? "h-4 w-4 text-[8px]" : "h-5 w-5 text-[9px]",
                ].join(" ")}
              >
                {assigneeName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className={subtask ? "text-[10px] font-medium" : "text-[11px] font-medium"}>
              {assigneeName}
            </span>
          </div>
        </div>
        <div className="md:hidden flex items-center gap-2">
          <select
            aria-label={`${issue.title} 우선순위`}
            className={[
              "appearance-none rounded-md px-3 py-1 font-semibold cursor-pointer flex items-center",
              subtask ? "h-7 text-[10px]" : "h-8 text-[11px]",
              PRIORITY_STYLE[issue.priority],
            ].join(" ")}
            value={issue.priority}
            onChange={(e) => {
              const next = e.target.value as Issue["priority"];
              void handlePriorityChange(issue, next);
            }}
          >
            <option value="very_low">매우 낮음</option>
            <option value="low">낮음</option>
            <option value="medium">중간</option>
            <option value="high">높음</option>
            <option value="urgent">매우 높음</option>
          </select>
          <select
            aria-label={`${issue.title} 상태`}
            className={[
              "appearance-none rounded-md px-3 py-1 font-semibold cursor-pointer flex items-center",
              subtask ? "h-7 text-[10px]" : "h-8 text-[11px]",
              STATUS_STYLE[issue.status],
            ].join(" ")}
            value={issue.status}
            onChange={(e) => handleStatusChange(issue, e.target.value as Issue["status"])}
          >
            {columns.map((option) => (
              <option key={option.key} value={option.key}>
                {option.key === "in_progress"
                  ? "작업 중"
                  : option.key === "review"
                    ? "리뷰 대기"
                    : option.key === "done"
                      ? "완료"
                      : option.key === "backlog"
                        ? "백로그"
                        : "할 일"}
              </option>
            ))}
          </select>
        </div>
        <div className="md:hidden flex h-10 w-full flex-col justify-center">
          <div className={["relative w-full", progressHeight].join(" ")}>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(issue.progress ?? 0)}
              onChange={(e) => {
                const next = Number(e.target.value);
                setIssues((prev) =>
                  prev.map((item) => (item.id === issue.id ? { ...item, progress: next } : item)),
                );
              }}
              onMouseUp={(e) => void handleProgressCommit(issue, Number((e.target as HTMLInputElement).value))}
              onTouchEnd={(e) =>
                void handleProgressCommit(issue, Number((e.target as HTMLInputElement).value))
              }
              onKeyUp={(e) => void handleProgressCommit(issue, Number((e.target as HTMLInputElement).value))}
              aria-label={`${issue.title} 진행률`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(issue.progress ?? 0)}
              aria-valuetext={`${Math.round(issue.progress ?? 0)}%`}
              className="absolute inset-0 h-2 w-full cursor-pointer appearance-none rounded-full"
              style={{
                background: `linear-gradient(to right, #38bdf8 0%, #3b82f6 ${Math.round(
                  issue.progress ?? 0,
                )}%, #f3f4f6 ${Math.round(issue.progress ?? 0)}%, #f3f4f6 100%)`,
              }}
            />
            <div className="absolute left-1/2 -bottom-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                pattern="[0-9]*"
                value={Math.round(issue.progress ?? 0)}
                onChange={(e) => {
                  const next = Math.max(0, Math.min(100, Number(e.target.value)));
                  setIssues((prev) =>
                    prev.map((item) => (item.id === issue.id ? { ...item, progress: next } : item)),
                  );
                }}
                onBlur={(e) => {
                  const next = Math.max(0, Math.min(100, Number(e.target.value)));
                  void handleProgressCommit(issue, next);
                }}
                aria-label={`${issue.title} 진행률 숫자 입력`}
                className={["rounded-md border border-border bg-background px-1 text-center", progressInputHeight].join(" ")}
              />
              <span className="text-[10px] text-muted">%</span>
            </div>
          </div>
        </div>
        <div
          className={[
            "hidden md:flex truncate rounded-md px-2 py-1 font-semibold items-center gap-2 text-foreground",
            titleHeight,
            cellText,
            subtask ? "relative" : "",
          ].join(" ")}
          style={{ backgroundColor: tintBg, paddingLeft: subtask ? 24 + indentPx : undefined }}
        >
          {subtask && (
            <span
              className="absolute top-1/2 -translate-y-1/2 text-foreground/60"
              style={{ left: 10 + indentPx }}
            >
              <CornerDownRight size={12} />
            </span>
          )}
          <button
            type="button"
            onClick={() => setIssueActionsId((prev) => (prev === issue.id ? null : issue.id))}
            className="min-w-0 flex-1 truncate text-left font-semibold text-foreground"
            style={{ color: "inherit" }}
          >
            {issue.title || "제목 없음"}
          </button>
        </div>
        <div
          className={["hidden md:flex rounded-md px-2 py-1 text-muted items-center", titleHeight, cellText].join(" ")}
          style={{ backgroundColor: tintBg }}
        >
          {formatIssueDateRange(issue.startAt, issue.endAt)}
        </div>
        <div className={["hidden md:flex items-center gap-2 rounded-md px-2 py-1", subtask ? "h-9" : "h-10"].join(" ")}>
          {avatar ? (
            <img src={avatar} alt={assigneeName || "avatar"} className={["rounded-full object-cover", avatarSize].join(" ")} />
          ) : (
            <div className={["flex items-center justify-center rounded-full bg-subtle font-semibold text-muted", avatarSize, subtask ? "text-[10px]" : "text-md"].join(" ")}>
              {assigneeName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className={["font-medium", cellText].join(" ")}>{assigneeName}</span>
        </div>
        <div className="hidden md:block">
          <select
            aria-label={`${issue.title} 우선순위`}
            className={[
              "appearance-none rounded-md px-6 py-1 font-semibold cursor-pointer flex items-center",
              selectHeight,
              cellText,
              PRIORITY_STYLE[issue.priority],
            ].join(" ")}
            value={issue.priority}
            onChange={(e) => {
              const next = e.target.value as Issue["priority"];
              void handlePriorityChange(issue, next);
            }}
          >
            <option value="very_low">매우 낮음</option>
            <option value="low">낮음</option>
            <option value="medium">중간</option>
            <option value="high">높음</option>
            <option value="urgent">매우 높음</option>
          </select>
        </div>
        <div className="hidden md:block">
          <select
            aria-label={`${issue.title} 상태`}
            className={[
              "appearance-none rounded-md px-6 py-1 font-semibold cursor-pointer flex items-center",
              selectHeight,
              cellText,
              STATUS_STYLE[issue.status],
            ].join(" ")}
            value={issue.status}
            onChange={(e) => handleStatusChange(issue, e.target.value as Issue["status"])}
          >
            {columns.map((option) => (
              <option key={option.key} value={option.key}>
                {option.key === "in_progress"
                  ? "작업 중"
                  : option.key === "review"
                    ? "리뷰 대기"
                    : option.key === "done"
                      ? "완료"
                      : option.key === "backlog"
                        ? "백로그"
                        : "할 일"}
              </option>
            ))}
          </select>
        </div>
        <div className="hidden md:flex h-11 w-full flex-col justify-center">
          <div className={["relative w-full", progressHeight].join(" ")}>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(issue.progress ?? 0)}
              onChange={(e) => {
                const next = Number(e.target.value);
                setIssues((prev) =>
                  prev.map((item) => (item.id === issue.id ? { ...item, progress: next } : item)),
                );
              }}
              onMouseUp={(e) => void handleProgressCommit(issue, Number((e.target as HTMLInputElement).value))}
              onTouchEnd={(e) =>
                void handleProgressCommit(issue, Number((e.target as HTMLInputElement).value))
              }
              onKeyUp={(e) => void handleProgressCommit(issue, Number((e.target as HTMLInputElement).value))}
              aria-label={`${issue.title} 진행률`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(issue.progress ?? 0)}
              aria-valuetext={`${Math.round(issue.progress ?? 0)}%`}
              className="absolute inset-0 h-2 w-full cursor-pointer appearance-none rounded-full"
              style={{
                background: `linear-gradient(to right, #38bdf8 0%, #3b82f6 ${Math.round(
                  issue.progress ?? 0,
                )}%, #f3f4f6 ${Math.round(issue.progress ?? 0)}%, #f3f4f6 100%)`,
              }}
            />
            <div className="absolute left-1/2 -bottom-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                pattern="[0-9]*"
                value={Math.round(issue.progress ?? 0)}
                onChange={(e) => {
                  const next = Math.max(0, Math.min(100, Number(e.target.value)));
                  setIssues((prev) =>
                    prev.map((item) => (item.id === issue.id ? { ...item, progress: next } : item)),
                  );
                }}
                onBlur={(e) => {
                  const next = Math.max(0, Math.min(100, Number(e.target.value)));
                  void handleProgressCommit(issue, next);
                }}
                aria-label={`${issue.title} 진행률 숫자 입력`}
                className={["rounded-md border border-border bg-background px-1 text-center", progressInputHeight].join(" ")}
              />
              <span className="text-[10px] text-muted">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
