// app/(workspace)/workspace/[teamId]/[projectId]/issues/_components/views/timeline/TimelineTooltip.tsx
'use client';

export default function TimelineTooltip({
  hoveredIssue,
}: {
  hoveredIssue: {
    title: string;
    range: string;
    assignee: string;
    avatarUrl?: string | null;
    x: number;
    y: number;
  } | null;
}) {
  if (!hoveredIssue) return null;
  const offset = 12;
  const width = 240;
  const height = 130;
  const maxX = typeof window !== "undefined" ? window.innerWidth : 0;
  const maxY = typeof window !== "undefined" ? window.innerHeight : 0;
  const left = maxX ? Math.min(hoveredIssue.x + offset, maxX - width - 8) : hoveredIssue.x + offset;
  const top = maxY ? Math.min(hoveredIssue.y + offset, maxY - height - 8) : hoveredIssue.y + offset;
  return (
    <div
      className="fixed z-[60] w-56 rounded-lg border border-border bg-panel px-3 py-2 text-[11px] text-foreground shadow-lg"
      style={{ left, top }}
    >
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-subtle px-2 py-0.5 text-[10px] font-semibold text-muted">타이틀</span>
        <span className="truncate font-semibold">{hoveredIssue.title}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="rounded-full bg-subtle px-2 py-0.5 text-[10px] font-semibold text-muted">날짜</span>
        <span className="text-muted">{hoveredIssue.range}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="rounded-full bg-subtle px-2 py-0.5 text-[10px] font-semibold text-muted">담당자</span>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 overflow-hidden rounded-full border border-border bg-subtle/60">
            {hoveredIssue.avatarUrl ? (
              <img src={hoveredIssue.avatarUrl} alt={hoveredIssue.assignee} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                {hoveredIssue.assignee.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-foreground">{hoveredIssue.assignee}</span>
        </div>
      </div>
    </div>
  );
}
