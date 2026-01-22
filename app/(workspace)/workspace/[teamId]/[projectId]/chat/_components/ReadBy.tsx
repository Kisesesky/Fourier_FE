// components/chat/ReadBy.tsx
'use client';

import React from "react";

function initials(name: string) {
  return name.split(/\s+/).map(s=>s[0]).join('').slice(0,2).toUpperCase();
}

export default function ReadBy({
  userNames
}: {
  userNames: string[];
}) {
  if (!userNames.length) return null;
  return (
    <div className="mt-1 flex items-center gap-1">
      {userNames.slice(0,5).map((n, i)=> (
        <div key={i} className="w-5 h-5 rounded-full bg-subtle/70 border border-border text-[9px] flex items-center justify-center" title={n}>
          {initials(n)}
        </div>
      ))}
      {userNames.length > 5 && (
        <span className="text-[11px] text-muted">+{userNames.length - 5}</span>
      )}
    </div>
  );
}
