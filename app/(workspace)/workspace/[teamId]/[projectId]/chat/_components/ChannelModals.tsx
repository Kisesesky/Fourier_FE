// components/chat/ChannelModals.tsx
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
        <div className="mt-3 text-right">
          <button className="text-xs px-3 py-1 rounded border border-border hover:bg-subtle/60" onClick={()=> onOpenChange(false)}>닫기</button>
        </div>
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
  const [sel, setSel] = useState<Record<string,boolean>>({});

  const candidates = useMemo(()=> Object.values(users).filter(u => u.id !== me.id), [users, me.id]);

  const submit = async () => {
    const memberIds = [me.id].concat(candidates.filter(c => sel[c.id]).map(c => c.id));
    if (!name.trim()) return;
    const id = await createChannel(name.trim(), memberIds);
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
          <div className="text-xs text-muted mb-1">멤버 선택</div>
          <div className="max-h-48 overflow-y-auto border border-border rounded p-2 space-y-1">
            {candidates.map(u => (
              <label key={u.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!sel[u.id]} onChange={e=> setSel(s => ({...s, [u.id]: e.target.checked}))}/>
                <span>{u.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="text-right">
          <button className="px-3 py-1.5 text-sm rounded border border-border hover:bg-subtle/60" onClick={submit}>Create</button>
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
        </div>
      </div>
    </ModalShell>
  );
}
