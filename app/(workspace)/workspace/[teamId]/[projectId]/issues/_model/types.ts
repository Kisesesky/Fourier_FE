export type ID = string;

export type Priority = "very_low" | "low" | "medium" | "high" | "urgent";
export type IssueStatus = "backlog" | "todo" | "in_progress" | "review" | "done";

export interface Issue {
  id: ID;
  key: string;
  title: string;
  description?: string;
  status: IssueStatus;
  priority: Priority;
  assignee?: string;
  assigneeId?: string;
  reporter?: string;
  group?: IssueGroup;
  startAt?: string;
  endAt?: string;
  progress?: number;
  parentId?: ID | null;
  createdAt: string;
  updatedAt: string;
  subtasks?: Issue[];
}

export interface IssueGroup {
  id: ID;
  name: string;
  color?: string;
  sortOrder: number;
  createdAt: string;
}

export interface IssueComment {
  id: ID;
  issueId: ID;
  author: string;
  authorId?: ID;
  authorAvatarUrl?: string | null;
  body: string;
  createdAt: string;
}

export type ActivityType = "status" | "assignee" | "comment" | "system";

export interface IssueActivity {
  id: ID;
  issueId: ID;
  type: ActivityType;
  text: string;
  createdAt: string;
}

export interface User {
  id: ID;
  name: string;
  email: string;
  avatarUrl?: string;
}
