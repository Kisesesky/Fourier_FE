// app/(workspace)/workspace/[teamId]/[projectId]/calendar/[calendarId]/page.tsx
import CalendarView from "@/workspace/calendar/_components/CalendarView";

export default function WorkspaceCalendarDetailPage({
  params,
}: {
  params: { calendarId: string };
}) {
  return <CalendarView key={`calendar-${params.calendarId}`} focusCalendarId={params.calendarId} />;
}
