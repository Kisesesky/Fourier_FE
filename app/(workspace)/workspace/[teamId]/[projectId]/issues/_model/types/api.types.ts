// app/(workspace)/workspace/[teamId]/[projectId]/issues/_model/types/api.types.ts
import { z } from 'zod';
import { IssueGroupSchema, IssuesAnalyticsSchema, IssueUserSchema } from '../schemas/issues-api.schemas';

export type IssuesAnalyticsResponse = z.infer<typeof IssuesAnalyticsSchema>;
export type IssueGroupResponse = z.infer<typeof IssueGroupSchema>;
export type IssueUserResponse = z.infer<typeof IssueUserSchema>;
