import CalendarView from "@/workspace/calendar/_components/CalendarView";

export default function WorkspaceCalendarDetailPage({
  params,
}: {
  params: { calendarId: string };
}) {
  return <CalendarView focusCalendarId={params.calendarId} />;
}
