import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Issue, IssueGroup } from '../types';

export type TimelineFilterOption = {
  key: string;
  label: string;
  color: string;
};

export function useIssuesTimelineFilters(issues: Issue[], issueGroups: IssueGroup[]) {
  const [timelineFilters, setTimelineFilters] = useState<Record<string, boolean>>({});

  const timelineOptions = useMemo<TimelineFilterOption[]>(() => {
    const opts = issueGroups.map((group) => ({
      key: group.id,
      label: group.name,
      color: group.color ?? '#475569',
    }));
    const hasUngrouped = issues.some((issue) => !issue.group && !issue.parentId);
    if (hasUngrouped) {
      opts.push({ key: 'ungrouped', label: '미분류', color: '#64748b' });
    }
    return opts;
  }, [issueGroups, issues]);

  useEffect(() => {
    setTimelineFilters((prev) => {
      const next = { ...prev };
      let changed = false;
      timelineOptions.forEach((opt) => {
        if (next[opt.key] === undefined) {
          next[opt.key] = true;
          changed = true;
        }
      });
      Object.keys(next).forEach((key) => {
        if (!timelineOptions.find((opt) => opt.key === key)) {
          delete next[key];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [timelineOptions]);

  const timelineAllChecked = useMemo(
    () => timelineOptions.length > 0 && timelineOptions.every((opt) => timelineFilters[opt.key] ?? true),
    [timelineFilters, timelineOptions],
  );

  const toggleTimelineAll = useCallback(
    (checked: boolean) => {
      setTimelineFilters((prev) => {
        const next = { ...prev };
        timelineOptions.forEach((opt) => {
          next[opt.key] = checked;
        });
        return next;
      });
    },
    [timelineOptions],
  );

  return {
    timelineFilters,
    setTimelineFilters,
    timelineOptions,
    timelineAllChecked,
    toggleTimelineAll,
  };
}
