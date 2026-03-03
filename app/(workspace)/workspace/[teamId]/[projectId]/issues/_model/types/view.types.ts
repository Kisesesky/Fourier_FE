// app/(workspace)/workspace/[teamId]/[projectId]/issues/_model/types/view.types.ts

import type { Issue, IssueGroup } from "@/workspace/issues/_model/types";

export type IssuesAnalyticsViewProps = {
  issues: Issue[];
  memberMap: Record<string, { name: string; avatarUrl?: string | null }>;
  issueGroups: IssueGroup[];
  loading?: boolean;
};
