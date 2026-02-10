// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/ProfilePopover.tsx
'use client';
import { useEffect, useState } from 'react';
import { searchUsers } from '@/workspace/issues/_service/api';

export default function ProfilePopover() {
  const [open, setOpen] = useState<null | { handle:string; user?: any; pos:{x:number;y:number} }>(null);

  useEffect(() => {
    const onOpen = async (e: any) => {
      const handle = e.detail?.handle as string;
      const rect = { x: (window.innerWidth-320)/2, y: 120 };
      const users = await searchUsers(handle, 1);
      setOpen({ handle, user: users[0], pos: { x: rect.x, y: rect.y } });
    };
    window.addEventListener('chat:open-profile', onOpen as any);
    return () => window.removeEventListener('chat:open-profile', onOpen as any);
  }, []);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" onClick={()=> setOpen(null)}>
      <div className="absolute inset-0" />
      <div
        className="absolute w-72 rounded-md border border-border bg-panel shadow-panel p-3"
        style={{ left: open.pos.x, top: open.pos.y }}
        onClick={(e)=> e.stopPropagation()}
      >
        {!open.user ? (
          <div className="text-sm">사용자를 찾는 중…</div>
        ) : (
          <>
            <div className="text-sm font-semibold">{open.user.name}</div>
            <div className="text-xs text-muted">{open.user.email}</div>
            <div className="mt-2 text-sm">클릭 시 알림/DM 기능 확장 예정</div>
          </>
        )}
        <div className="mt-3 text-right">
          <button className="text-xs px-2 py-1 rounded border border-border hover:bg-subtle/60" onClick={()=> setOpen(null)}>닫기</button>
        </div>
      </div>
    </div>
  );
}
