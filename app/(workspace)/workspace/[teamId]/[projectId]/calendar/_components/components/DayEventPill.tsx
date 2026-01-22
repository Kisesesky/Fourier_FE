import type { CalendarEvent } from "@/workspace/calendar/_model/types";

type DayEventPillProps = {
  event: CalendarEvent;
  color?: string;
  variant: "single" | "start" | "middle" | "end";
  showLabel?: boolean;
  tooltip?: string;
};

const OFFSET = 6;

const RADIUS: Record<DayEventPillProps["variant"], string> = {
  single: "9999px",
  start: "9999px 0 0 9999px",
  middle: "0",
  end: "0 9999px 9999px 0",
};

const LEFT_MARGIN: Record<DayEventPillProps["variant"], number> = {
  single: 0,
  start: 0,
  middle: -OFFSET,
  end: -OFFSET,
};

const RIGHT_MARGIN: Record<DayEventPillProps["variant"], number> = {
  single: 0,
  start: -OFFSET,
  middle: -OFFSET,
  end: 0,
};

export function DayEventPill({
  event,
  color,
  variant,
  showLabel = false,
  tooltip,
}: DayEventPillProps) {
  const baseColor = color ?? "#2563eb";

  return (
    <div
      className="pointer-events-auto w-full px-2 py-[5px] text-[11px] font-medium leading-tight text-white shadow-sm transition"
      style={{
        backgroundColor: baseColor,
        borderRadius: RADIUS[variant],
        marginLeft: LEFT_MARGIN[variant],
        marginRight: RIGHT_MARGIN[variant],
      }}
      title={tooltip ?? event.title}
    >
      {showLabel ? <span className="truncate">{event.title}</span> : <span aria-hidden> </span>}
    </div>
  );
}
