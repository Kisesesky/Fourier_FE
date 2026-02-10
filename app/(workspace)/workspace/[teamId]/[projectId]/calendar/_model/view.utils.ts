// Path: app/(workspace)/workspace/[teamId]/[projectId]/calendar/_model/view.utils.ts
import { format } from "date-fns";

export const formatTimelineRange = (start: Date, end: Date, allDay: boolean) => {
  const startLabel = format(start, "yyyy.MM.dd");
  const endLabel = format(end, "yyyy.MM.dd");
  if (startLabel === endLabel) {
    return allDay ? startLabel : format(start, "yyyy.MM.dd HH:mm");
  }
  const template = allDay ? "yyyy.MM.dd" : "yyyy.MM.dd HH:mm";
  return `${format(start, template)} ~ ${format(end, template)}`;
};
