// components/issues/NewIssueDialog.tsx
'use client';

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";

export default function NewIssueDialog({
  onCreate
}: {
  onCreate: (title: string, column: "todo" | "doing" | "done", priority: "very_low" | "low" | "medium" | "high" | "very_high", tags: string[], due?: string) => void
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [col, setCol] = useState<'todo'|'doing'|'done'>('todo');
  const [tags, setTags] = useState<string>("");
  const [due, setDue] = useState<string>("");
  const [priority, setPriority] = useState<"very_low" | "low" | "medium" | "high" | "very_high">("medium");

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-new-issue-modal", handler as any);
    return () => window.removeEventListener("open-new-issue-modal", handler as any);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="px-3 py-2 bg-brand/20 border border-brand/40 text-sm rounded-md hover:bg-brand/30">새 이슈</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-28 -translate-x-1/2 w-[480px] rounded-xl border border-border bg-panel shadow-panel p-4 space-y-3">
          <Dialog.Title className="font-semibold">새 이슈 만들기</Dialog.Title>

          <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="제목"
                 className="w-full bg-subtle/60 border border-border rounded-md px-3 py-2 text-sm outline-none" />

          <div className="grid grid-cols-2 gap-2">
            <select value={col} onChange={(e)=>setCol(e.target.value as any)}
                    className="w-full bg-subtle/60 border border-border rounded-md px-3 py-2 text-sm outline-none">
              <option value="todo">To Do</option>
              <option value="doing">In Progress</option>
              <option value="done">Done</option>
            </select>
            <input type="date" value={due} onChange={(e)=>setDue(e.target.value)}
                   className="w-full bg-subtle/60 border border-border rounded-md px-3 py-2 text-sm outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
              className="w-full bg-subtle/60 border border-border rounded-md px-3 py-2 text-sm outline-none"
            >
              <option value="very_low">매우 낮음</option>
              <option value="low">낮음</option>
              <option value="medium">중간</option>
              <option value="high">높음</option>
              <option value="very_high">매우 높음</option>
            </select>
            <div className="w-full rounded-md border border-border bg-subtle/30 px-3 py-2 text-xs text-muted">
              담당자: 본인
            </div>
          </div>

          <input value={tags} onChange={(e)=>setTags(e.target.value)} placeholder="태그 (쉼표로 구분: design,api,urgent)"
                 className="w-full bg-subtle/60 border border-border rounded-md px-3 py-2 text-sm outline-none" />

          <div className="flex justify-end gap-2">
            <button className="px-3 py-2 border border-border rounded-md" onClick={()=>setOpen(false)}>취소</button>
            <button className="px-3 py-2 bg-brand/20 border border-brand/40 rounded-md"
              onClick={()=>{ if(!title.trim()) return;
                onCreate(
                  title.trim(),
                  col,
                  priority,
                  tags.split(',').map(s=>s.trim()).filter(Boolean),
                  due || undefined
                );
                setTitle(""); setTags(""); setDue(""); setPriority("medium");
                setOpen(false);
              }}>
              생성
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
