// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/ChannelModals.tsx
'use client';

import React, { useMemo, useState } from "react";
import { useChat } from "@/workspace/chat/_model/store";

function ModalShell({ open, onOpenChange, title, children }:{
  open:boolean; onOpenChange:(v:boolean)=>void; title:string; children:React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={()=> onOpenChange(false)} />
      <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[520px] rounded-xl border border-border bg-panel shadow-panel p-4">
        <div className="font-semibold mb-2">{title}</div>
        {children}
      </div>
    </div>
  );
}

export function CreateChannelModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (id: string) => void;
}) {
  const { users, me, createChannel, setChannel } = useChat();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"text" | "voice">("text");
  const [sel, setSel] = useState<Record<string,boolean>>({});

  const candidates = useMemo(()=> Object.values(users).filter(u => u.id !== me.id), [users, me.id]);
  const roleLabel = (role?: string) => {
    if (role === "owner") return { text: "소유자", cls: "bg-rose-500/15 text-rose-500" };
    if (role === "manager") return { text: "편집자", cls: "bg-emerald-500/15 text-emerald-500" };
    if (role === "member") return { text: "멤버", cls: "bg-sky-500/15 text-sky-500" };
    return { text: "게스트", cls: "bg-slate-500/15 text-slate-500" };
  };

  const submit = async () => {
    const memberIds = [me.id].concat(candidates.filter(c => sel[c.id]).map(c => c.id));
    if (!name.trim()) return;
    const id = await createChannel(name.trim(), memberIds, kind);
    await setChannel(id);
    onCreated?.(id);
    onOpenChange(false);
  };

  return (
    <ModalShell open={open} onOpenChange={onOpenChange} title="채널 생성">
      <div className="space-y-3">
        <div>
          <div className="text-xs text-muted mb-1">채널명</div>
          <input
            className="w-full bg-subtle/60 border border-border rounded px-2 py-1 text-sm"
            value={name}
            onChange={e=> setName(e.target.value)}
            placeholder="ex) design, dev-backend"
          />
        </div>
        <div>
          <div className="text-xs text-muted mb-1">채널 타입</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "text", label: "채팅" },
              { value: "voice", label: "음성" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                className={`rounded-md border px-2 py-1.5 text-sm transition ${
                  kind === item.value
                    ? "border-sky-400 bg-sky-500/15 text-sky-500"
                    : "border-border bg-panel hover:bg-subtle/50"
                }`}
                onClick={() => setKind(item.value as "text" | "voice")}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted mb-1">멤버 선택</div>
          <div className="max-h-48 overflow-y-auto border border-border rounded p-2 space-y-1">
            {candidates.map(u => (
              <label key={u.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-subtle/50">
                <input type="checkbox" checked={!!sel[u.id]} onChange={e=> setSel(s => ({...s, [u.id]: e.target.checked}))}/>
                <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-muted/20 text-[10px] font-semibold text-foreground">
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.displayName || u.name} className="h-full w-full object-cover" />
                  ) : (
                    (u.displayName || u.name || "?").slice(0, 2).toUpperCase()
                  )}
                </span>
                <span className="truncate text-sm text-foreground">{u.displayName || u.name}</span>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleLabel(u.role).cls}`}>
                  {roleLabel(u.role).text}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            className="rounded-md bg-rose-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-400"
            onClick={() => onOpenChange(false)}
          >
            닫기
          </button>
          <button
            className="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-400"
            onClick={submit}
          >
            생성
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export function InviteModal({ open, onOpenChange, channelId }:{open:boolean; onOpenChange:(v:boolean)=>void; channelId:string;}) {
  const { users, me, channelMembers, inviteToChannel } = useChat();
  const [sel, setSel] = useState<Record<string,boolean>>({});
  const members = new Set(channelMembers[channelId] || []);
  const candidates = useMemo(
    ()=> Object.values(users).filter(u => u.id !== me.id && !members.has(u.id)),
    [users, me.id, channelId]
  );

  const submit = () => {
    const ids = candidates.filter(c => sel[c.id]).map(c => c.id);
    if (ids.length === 0) return;
    inviteToChannel(channelId, ids);
    onOpenChange(false);
  };

  return (
    <ModalShell open={open} onOpenChange={onOpenChange} title="채널 초대">
      <div className="space-y-3">
        <div className="max-h-60 overflow-y-auto border border-border rounded p-2 space-y-1">
          {candidates.length === 0 && <div className="text-sm text-muted">초대 가능한 사용자가 없습니다.</div>}
          {candidates.map(u => (
            <label key={u.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!sel[u.id]} onChange={e=> setSel(s => ({...s, [u.id]: e.target.checked}))}/>
              <span>{u.name}</span>
            </label>
          ))}
        </div>
        <div className="text-right">
          <button className="px-3 py-1.5 text-sm rounded border border-border hover:bg-subtle/60" onClick={submit}>Invite</button>
          <button className="ml-2 px-3 py-1.5 text-sm rounded border border-border hover:bg-subtle/60" onClick={()=> onOpenChange(false)}>닫기</button>
        </div>
      </div>
    </ModalShell>
  );
}
