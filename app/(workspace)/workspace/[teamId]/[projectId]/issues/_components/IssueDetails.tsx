// components/issues/IssueDetails.tsx
'use client';

import React, { useState } from "react";

export type ChecklistItem = { id: string; text: string; done: boolean };

export type Issue = {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
  assignee?: string;
  priority?: "low" | "medium" | "high";
  description?: string;
  labels?: string[];
  due?: string; // YYYY-MM-DD
  points?: number;
  checklist?: ChecklistItem[];
};

export default function IssueDetails({
  issue, onClose, onUpdate
}: {
  issue: Issue | null;
  onClose: () => void;
  onUpdate: (patch: Partial<Issue>) => void;
}) {
  const [labelInput, setLabelInput] = useState("");
  const [checkText, setCheckText] = useState("");

  if (!issue) {
    return (
      <div className="p-4 space-y-3 text-sm">
        <div className="text-muted">선택된 이슈가 없습니다.</div>
      </div>
    );
  }

  const addLabel = () => {
    const v = labelInput.trim();
    if (!v) return;
    const next = Array.from(new Set([...(issue.labels || []), v]));
    onUpdate({ labels: next });
    setLabelInput("");
  };
  const removeLabel = (v: string) => {
    const next = (issue.labels || []).filter(l => l !== v);
    onUpdate({ labels: next });
  };

  const addChecklist = () => {
    const v = checkText.trim();
    if (!v) return;
    const next = [ ...(issue.checklist || []), { id: crypto.randomUUID(), text: v, done: false } ];
    onUpdate({ checklist: next });
    setCheckText("");
  };
  const toggleChecklist = (id: string) => {
    const next = (issue.checklist || []).map(i => i.id === id ? { ...i, done: !i.done } : i);
    onUpdate({ checklist: next });
  };
  const removeChecklist = (id: string) => {
    const next = (issue.checklist || []).filter(i => i.id !== id);
    onUpdate({ checklist: next });
  };

  const percent = (() => {
    const list = issue.checklist || [];
    if (list.length === 0) return 0;
    const done = list.filter(i=>i.done).length;
    return Math.round((done / list.length) * 100);
  })();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="h-14 px-4 border-b border-border flex items-center justify-between">
        <div className="font-semibold">Issue Details</div>
        <button onClick={onClose} className="px-2 py-1 border border-border rounded-md text-xs hover:bg-subtle/60">닫기</button>
      </div>
      <div className="p-4 space-y-4 text-sm overflow-y-auto">
        <div>
          <div className="text-xs text-muted mb-1">제목</div>
          <input
            className="w-full bg-subtle/60 border border-border rounded-md px-3 py-2 text-sm outline-none"
            value={issue.title}
            onChange={(e)=> onUpdate({ title: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted mb-1">상태</div>
            <select
              className="w-full bg-subtle/60 border border-border rounded-md px-3 py-2 text-sm outline-none"
              value={issue.status}
              onChange={(e)=> onUpdate({ status: e.target.value as Issue["status"] })}
            >
              <option value="todo">To Do</option>
              <option value="doing">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">우선순위</div>
            <select
              className="w-full bg-subtle/60 border border-border rounded-md px-3 py-2 text-sm outline-none"
              value={issue.priority || "medium"}
              onChange={(e)=> onUpdate({ priority: e.target.value as Issue["priority"] })}
            >
              <option value="low">낮음</option>
              <option value="medium">보통</option>
              <option value="high">높음</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted mb-1">담당자</div>
            <input
              className="w-full bg-subtle/60 border border-border rounded-md px-3 py-2 text-sm outline-none"
              value={issue.assignee || ""}
              onChange={(e)=> onUpdate({ assignee: e.target.value })}
              placeholder="예: Alice"
            />
          </div>
          <div>
            <div className="text-xs text-muted mb-1">스토리 포인트</div>
            <input
              type="number" min={0}
              className="w-full bg-subtle/60 border border-border rounded-md px-3 py-2 text-sm outline-none"
              value={Number.isFinite(issue.points) ? String(issue.points) : ""}
              onChange={(e)=> onUpdate({ points: e.target.value === "" ? undefined : Number(e.target.value) })}
              placeholder="예: 3"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted mb-1">마감일</div>
            <input
              type="date"
              className="w-full bg-subtle/60 border border-border rounded-md px-3 py-2 text-sm outline-none"
              value={issue.due || ""}
              onChange={(e)=> onUpdate({ due: e.target.value || undefined })}
            />
          </div>
          <div>
            <div className="text-xs text-muted mb-1">라벨</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {(issue.labels || []).map(l => (
                <span key={l} className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border bg-subtle/40">
                  {l}
                  <button onClick={()=> removeLabel(l)} className="text-xs hover:underline">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={labelInput}
                onChange={(e)=> setLabelInput(e.target.value)}
                placeholder="라벨 추가 후 Enter"
                onKeyDown={(e)=> { if (e.key === "Enter") { e.preventDefault(); addLabel(); } }}
                className="flex-1 bg-subtle/60 border border-border rounded-md px-3 py-2 text-sm outline-none"
              />
              <button onClick={addLabel} className="px-3 py-2 bg-brand/20 border border-brand/40 rounded-md">추가</button>
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs text-muted mb-1">체크리스트 <span className="ml-1 text-[11px] text-muted">({percent}%)</span></div>
          <div className="space-y-2">
            {(issue.checklist || []).map(i => (
              <label key={i.id} className="flex items-center gap-2">
                <input type="checkbox" checked={i.done} onChange={()=> toggleChecklist(i.id)} />
                <span className={`${i.done ? 'line-through text-muted' : ''}`}>{i.text}</span>
                <button className="ml-auto text-xs px-2 py-1 rounded border border-border hover:bg-subtle/60"
                        onClick={()=> removeChecklist(i.id)}>삭제</button>
              </label>
            ))}
            <div className="flex gap-2">
              <input
                value={checkText}
                onChange={(e)=> setCheckText(e.target.value)}
                placeholder="체크리스트 항목 입력 후 Enter"
                onKeyDown={(e)=> { if (e.key === "Enter") { e.preventDefault(); addChecklist(); } }}
                className="flex-1 bg-subtle/60 border border-border rounded-md px-3 py-2 text-sm outline-none"
              />
              <button onClick={addChecklist} className="px-3 py-2 bg-brand/20 border border-brand/40 rounded-md">추가</button>
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs text-muted mb-1">설명</div>
          <textarea
            className="w-full bg-subtle/60 border border-border rounded-md px-3 py-2 text-sm outline-none min-h-[120px]"
            value={issue.description || ""}
            onChange={(e)=> onUpdate({ description: e.target.value })}
            placeholder="설명을 입력하세요"
          />
        </div>
      </div>
    </div>
  );
}
