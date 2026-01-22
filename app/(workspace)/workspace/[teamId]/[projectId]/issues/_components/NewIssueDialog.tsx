// components/issues/NewIssueDialog.tsx
'use client';

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";

export default function NewIssueDialog({
  onCreate
}: {
  onCreate: (title:string, column:'todo'|'doing'|'done', labels: string[], due?: string, assignee?: string, points?: number)=>void
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [col, setCol] = useState<'todo'|'doing'|'done'>('todo');
  const [labels, setLabels] = useState<string>("");
  const [due, setDue] = useState<string>("");
  const [assignee, setAssignee] = useState<string>("Alice");
  const [points, setPoints] = useState<string>("");

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
            <input value={assignee} onChange={(e)=>setAssignee(e.target.value)} placeholder="담당자 (예: Alice)"
                   className="w-full bg-subtle/60 border border-border rounded-md px-3 py-2 text-sm outline-none" />
            <input value={points} onChange={(e)=>setPoints(e.target.value)} placeholder="스토리 포인트 (숫자)"
                   className="w-full bg-subtle/60 border border-border rounded-md px-3 py-2 text-sm outline-none" />
          </div>

          <input value={labels} onChange={(e)=>setLabels(e.target.value)} placeholder="라벨 (쉼표로 구분: design,api,urgent)"
                 className="w-full bg-subtle/60 border border-border rounded-md px-3 py-2 text-sm outline-none" />

          <div className="flex justify-end gap-2">
            <button className="px-3 py-2 border border-border rounded-md" onClick={()=>setOpen(false)}>취소</button>
            <button className="px-3 py-2 bg-brand/20 border border-brand/40 rounded-md"
              onClick={()=>{ if(!title.trim()) return;
                onCreate(
                  title.trim(),
                  col,
                  labels.split(',').map(s=>s.trim()).filter(Boolean),
                  due || undefined,
                  assignee || undefined,
                  Number.isNaN(Number(points)) || points==="" ? undefined : Number(points)
                );
                setTitle(""); setLabels(""); setDue(""); setAssignee("Alice"); setPoints("");
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
