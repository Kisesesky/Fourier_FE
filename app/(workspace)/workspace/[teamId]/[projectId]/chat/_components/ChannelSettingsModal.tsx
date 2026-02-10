// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/ChannelSettingsModal.tsx
'use client';

import React, { useEffect, useState } from "react";
import { useChat } from "@/workspace/chat/_model/store";

export default function ChannelSettingsModal({
  open, onOpenChange, channelId
}: { open:boolean; onOpenChange:(v:boolean)=>void; channelId:string }) {
  const { channelTopics, setChannelTopic, setChannelMuted, channelMembers, users } = useChat();
  const [topic, setTopic] = useState("");
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!open) return;
    const cur = channelTopics[channelId] || { topic:"", muted:false };
    setTopic(cur.topic || "");
    setMuted(!!cur.muted);
  }, [open, channelId, channelTopics]);

  const submit = () => {
    setChannelTopic(channelId, topic.trim());
    setChannelMuted(channelId, muted);
    onOpenChange(false);
  };

  const members = channelMembers[channelId] || [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={()=> onOpenChange(false)} />
      <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[620px] rounded-xl border border-border bg-panel shadow-panel p-4">
        <div className="font-semibold mb-3">Channel Settings</div>

        <div className="space-y-3">
          <div>
            <div className="text-xs text-muted mb-1">Topic</div>
            <input
              className="w-full bg-subtle/60 border border-border rounded px-2 py-1 text-sm"
              placeholder="채널의 주제나 설명을 입력하세요"
              value={topic}
              onChange={e=> setTopic(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={muted} onChange={e=> setMuted(e.target.checked)} />
            Mute notifications for this channel
          </label>

          <div>
            <div className="text-xs text-muted mb-1">Members</div>
            <div className="border border-border rounded p-2 max-h-40 overflow-y-auto text-sm">
              {members.length === 0 && <div className="text-muted">No members</div>}
              {members.map(uid => (
                <div key={uid} className="flex items-center gap-2 py-1">
                  <div className="w-6 h-6 rounded-full bg-subtle/60 border border-border text-[10px] flex items-center justify-center">
                    {(users[uid]?.name || uid).split(/\s+/).map(s=>s[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <span>{users[uid]?.name || uid}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 text-right">
          <button className="px-3 py-1.5 text-sm rounded border border-border hover:bg-subtle/60" onClick={submit}>저장</button>
          <button className="ml-2 px-3 py-1.5 text-sm rounded border border-border hover:bg-subtle/60" onClick={()=> onOpenChange(false)}>닫기</button>
        </div>
      </div>
    </div>
  );
}
