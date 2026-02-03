// components/issues/RightPanel.tsx
'use client';
import { Tabs } from "@/components/ui/Tabs";
import type { ActivityType, Issue } from "@/workspace/issues/_model/types";
import { addComment, getIssueById, listActivities, listComments, searchUsers, updateIssue, updateIssueStatus } from "@/workspace/issues/_service/api";
import clsx from "clsx";
import { useParams, useRouter } from "next/navigation";
import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import React, { useEffect, useMemo, useRef, useState } from "react";

export default function RightPanel({
  issue: issueProp,
  onClose,
  onUpdate,
}: {
  issue?: Issue | null;
  onClose?: () => void;
  onUpdate?: (patch: Partial<Issue>) => void;
}) {
  const params = useParams<{ teamId?: string; projectId?: string; id?: string }>();
  const router = useRouter();
  const { buildHref } = useWorkspacePath();
  const routeId = (params?.id as string) || undefined;
  const projectId = (params?.projectId as string) || undefined;

  const [issue, setIssue] = useState<Issue | null>(issueProp ?? null);
  const [tab, setTab] = useState<"details" | "comments" | "activity">("details");

  // 댓글/활동 데이터
  const [comments, setComments] = useState<{ id: string; author: string; body: string; createdAt: string }[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [activity, setActivity] = useState<{ id: string; type: ActivityType; text: string; createdAt: string }[]>([]);
  const [actFilter, setActFilter] = useState<ActivityType | "all">("all");

  useEffect(() => {
    let mounted = true;
    async function load() {
      const id = issueProp?.id || routeId;
      if (!id) { setIssue(null); return; }
      const it = await getIssueById(id, projectId);
      if (!mounted) return;
      setIssue(it);
      const [c, a] = await Promise.all([listComments(id, projectId), listActivities(id, projectId)]);
      if (!mounted) return;
      setComments(c);
      setActivity(a);
    }
    load();
    return () => { mounted = false; };
  }, [issueProp?.id, routeId]);

  const updateField = async (patch: Partial<Issue>) => {
    if (!issue?.id || !projectId) return;
    try {
      const updated = await updateIssue(projectId, issue.id, patch);
      setIssue(updated);
    } catch {
      // ignore
    }
  };

  const updateStatus = async (status: Issue["status"]) => {
    if (!issue?.id || !projectId) return;
    try {
      const updated = await updateIssueStatus(projectId, issue.id, status);
      setIssue(updated);
    } catch {
      // ignore
    }
  };

  const title = useMemo(() => issue?.title ?? "Details", [issue]);

  // 활동 필터링
  const filteredActivity = useMemo(() => {
    if (actFilter === "all") return activity;
    return activity.filter(a => a.type === actFilter);
  }, [activity, actFilter]);

  return (
    <div className="flex min-h-0 w-full flex-col">
      <div className="h-14 px-4 border-b border-border flex items-center justify-between">
        <div className="font-semibold truncate">{title}</div>
        <div className="flex items-center gap-2">
          {routeId && (
            <button
              className="text-xs px-2 py-1 rounded border border-border hover:bg-subtle/60"
              onClick={() => router.push(buildHref("issues"))}
              title="패널 닫기"
            >
              닫기
            </button>
          )}
          {!routeId && onClose && (
            <button
              className="text-xs px-2 py-1 rounded border border-border hover:bg-subtle/60"
              onClick={onClose}
            >
              닫기
            </button>
          )}
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={(k) => setTab(k as any)}
        items={[
          { key: "details", label: "상세" },
          { key: "comments", label: "댓글" },
          { key: "activity", label: "활동" },
        ]}
      />

      <div className="p-3">
        {tab === "details" && <DetailsView issue={issue} onUpdate={updateField} onStatusChange={updateStatus} />}

        {tab === "comments" && (
          <CommentsView
            issueId={issue?.id}
            comments={comments}
            onAdd={async (body) => {
              if (!issue) return;
              const created = await addComment(issue.id, "You", body, projectId);
              setComments(prev => [...prev, created]);
              // 활동 로그도 새로고침
              const acts = await listActivities(issue.id, projectId);
              setActivity(acts);
            }}
          />
        )}

        {tab === "activity" && (
          <ActivityView
            items={filteredActivity}
            filter={actFilter}
            onFilterChange={setActFilter}
            onRefresh={async () => {
              if (!issue) return;
              const acts = await listActivities(issue.id, projectId);
              setActivity(acts);
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ───────── Details ───────── */
function DetailsView({
  issue,
  onUpdate,
  onStatusChange,
}: {
  issue: Issue | null;
  onUpdate: (patch: Partial<Issue>) => void;
  onStatusChange: (status: Issue["status"]) => void;
}) {
  const [titleDraft, setTitleDraft] = useState("");

  useEffect(() => {
    setTitleDraft(issue?.title ?? "");
  }, [issue?.title]);

  if (!issue) {
    return (
      <div className="rounded border border-border p-3 text-sm text-muted">
        이슈를 선택하면 상세가 여기에 표시됩니다.
      </div>
    );
  }
  return (
    <div className="space-y-3 text-sm">
      <div className="rounded border border-border p-3">
        <div className="text-xs text-muted mb-1">제목</div>
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={() => {
            if (titleDraft.trim() && titleDraft !== issue.title) {
              onUpdate({ title: titleDraft.trim() });
            }
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded border border-border p-3">
          <div className="text-xs text-muted mb-1">상태</div>
          <select
            className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
            value={issue.status}
            onChange={(e) => onStatusChange(e.target.value as Issue["status"])}
          >
            <option value="backlog">백로그</option>
            <option value="todo">할 일</option>
            <option value="in_progress">작업 중</option>
            <option value="review">리뷰 대기</option>
            <option value="done">완료</option>
          </select>
        </div>
        <div className="rounded border border-border p-3">
          <div className="text-xs text-muted mb-1">우선순위</div>
          <div>{issue.priority}</div>
        </div>
      </div>
      <div className="rounded border border-border p-3">
        <div className="text-xs text-muted mb-1">Assignee · Reporter</div>
        <div>{issue.assignee || "—"} · {issue.reporter || "—"}</div>
      </div>
      {issue.description && (
        <div className="rounded border border-border p-3 whitespace-pre-wrap">
          {issue.description}
        </div>
      )}
    </div>
  );
}

/* ───────── Comments (with @mention) ───────── */
function CommentsView({
  issueId,
  comments,
  onAdd
}: {
  issueId?: string;
  comments: { id: string; author: string; body: string; createdAt: string }[];
  onAdd: (body: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionList, setMentionList] = useState<{ id: string; name: string; email: string }[]>([]);
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // 멘션 검색
  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!mentionOpen || !mentionQuery.trim()) { setMentionList([]); return; }
      const res = await searchUsers(mentionQuery);
      if (!mounted) return;
      setMentionList(res);
      setSel(0);
    }
    run();
    return () => { mounted = false; };
  }, [mentionOpen, mentionQuery]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!mentionOpen) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(s + 1, Math.max(mentionList.length - 1, 0))); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter")     { e.preventDefault(); if (mentionList[sel]) insertMention(mentionList[sel].name); }
    if (e.key === "Escape")    { setMentionOpen(false); }
  };

  const insertMention = (name: string) => {
    // draft의 마지막 "@query"를 "@name "으로 치환
    const idx = draft.lastIndexOf("@");
    if (idx >= 0) {
      const head = draft.slice(0, idx);
      const tail = draft.slice(idx + 1);
      const spaceIdx = tail.search(/\s/);
      const after = spaceIdx === -1 ? "" : tail.slice(spaceIdx);
      setDraft(`${head}@${name}${after ? "" : " "}${after}`);
    }
    setMentionOpen(false);
    setMentionQuery("");
    inputRef.current?.focus();
  };

  const onChange = (v: string) => {
    setDraft(v);
    // 커서 앞의 토큰을 읽어서 '@' 시작이면 오픈
    const atIdx = v.lastIndexOf("@");
    if (atIdx === -1) { setMentionOpen(false); return; }
    const tail = v.slice(atIdx + 1);
    const matched = tail.match(/^([^\s]{0,32})/);
    const q = matched ? matched[1] : "";
    if (q.length === 0) { setMentionOpen(true); setMentionQuery(""); }
    else { setMentionOpen(true); setMentionQuery(q); }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {comments.length === 0 && <div className="text-sm text-muted">아직 댓글이 없습니다.</div>}
        {comments.map(c => (
          <div key={c.id} className="rounded border border-border p-2">
            <div className="text-xs text-muted">{c.author} · {new Date(c.createdAt).toLocaleString()}</div>
            <div className="text-sm whitespace-pre-wrap">{c.body}</div>
          </div>
        ))}
      </div>

      {issueId && (
        <form
          className="relative"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            await onAdd(draft.trim());
            setDraft("");
          }}
        >
          <input
            ref={inputRef}
            className="w-full rounded border border-border bg-background px-2 py-2 text-sm"
            placeholder="댓글을 입력하세요… (@로 멘션)"
            value={draft}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
          />

          {/* 멘션 팝업 */}
          {mentionOpen && (
            <div className="absolute left-0 right-0 top-[110%] z-20 rounded-md border border-border bg-panel shadow-panel p-1">
              {mentionList.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted">검색 결과 없음</div>
              )}
              {mentionList.map((u, i) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => insertMention(u.name)}
                  className={clsx(
                    "w-full text-left px-3 py-2 rounded text-sm",
                    i === sel ? "bg-subtle/70" : "hover:bg-subtle/50"
                  )}
                >
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-muted">{u.email}</div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-2 text-right">
            <button className="text-sm px-3 rounded border border-border hover:bg-subtle/60">등록</button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ───────── Activity (filter) ───────── */
function ActivityView({
  items,
  filter,
  onFilterChange,
  onRefresh,
}: {
  items: { id: string; type: ActivityType; text: string; createdAt: string }[];
  filter: ActivityType | "all";
  onFilterChange: (t: ActivityType | "all") => void;
  onRefresh: () => void | Promise<void>;
}) {
  const types: (ActivityType | "all")[] = ["all", "status", "assignee", "comment", "system"];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {types.map(t => (
          <button
            key={t}
            className={clsx(
              "text-xs px-2 py-1 rounded border",
              filter === t ? "border-foreground" : "border-border hover:bg-subtle/60"
            )}
            onClick={() => onFilterChange(t)}
          >
            {t}
          </button>
        ))}
        <div className="ml-auto">
          <button className="text-xs px-2 py-1 rounded border border-border hover:bg-subtle/60" onClick={() => onRefresh()}>
            새로고침
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {items.length === 0 && <div className="text-sm text-muted">표시할 활동이 없습니다.</div>}
        {items.map(a => (
          <div key={a.id} className="text-sm rounded border border-border p-2">
            <div className="text-xs text-muted flex items-center gap-2">
              <span className="uppercase">{a.type}</span>
              <span>· {new Date(a.createdAt).toLocaleString()}</span>
            </div>
            <div>{a.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
