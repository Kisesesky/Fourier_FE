// app/(workspace)/workspace/[teamId]/[projectId]/_model/dashboard-page.utils.ts

import type { AnalyticsCounts, DateFilter, GraphMode } from "./dashboard-page.types";

export const buildSeriesFromDates = (dates: number[]): AnalyticsCounts => {
  const now = new Date();
  const todayKey = now.toDateString();
  const hourly = Array.from({ length: 24 }, () => 0);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daily = Array.from({ length: daysInMonth }, () => 0);
  const monthly = Array.from({ length: 12 }, () => 0);

  dates.forEach((ts) => {
    const dt = new Date(ts);
    if (Number.isNaN(dt.getTime())) return;
    if (dt.toDateString() === todayKey) {
      hourly[dt.getHours()] += 1;
    }
    if (dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth()) {
      daily[dt.getDate() - 1] += 1;
    }
    if (dt.getFullYear() === now.getFullYear()) {
      monthly[dt.getMonth()] += 1;
    }
  });

  return { hourly, daily, monthly };
};

export const filterDates = (dates: number[], mode: GraphMode, filter: DateFilter): number[] => {
  if (!dates.length) return dates;

  if (mode === "hourly") {
    const target = new Date(filter.day);
    if (Number.isNaN(target.getTime())) return [];
    return dates.filter((ts) => {
      const dt = new Date(ts);
      return dt.toDateString() === target.toDateString();
    });
  }

  if (mode === "daily") {
    const [y, m] = filter.month.split("-").map(Number);
    if (!y || !m) return [];
    return dates.filter((ts) => {
      const dt = new Date(ts);
      return dt.getFullYear() === y && dt.getMonth() + 1 === m;
    });
  }

  const y = Number(filter.year);
  if (!y) return [];
  return dates.filter((ts) => new Date(ts).getFullYear() === y);
};
