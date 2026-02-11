// app/(workspace)/workspace/[teamId]/[projectId]/_model/dashboard-page.types.ts

export type WorkspaceProjectPageProps = {
  params: { teamId: string; projectId: string };
};

export type GraphMode = "hourly" | "daily" | "monthly";

export type AnalyticsCounts = {
  hourly: number[];
  daily: number[];
  monthly: number[];
};

export type DateFilter = {
  day: string;
  month: string;
  year: string;
};
