import api from "@/lib/api";
import type { ActivityType, ID, Issue, IssueActivity, IssueComment, IssueGroup, User } from "@/workspace/issues/_model/types";

const DEFAULT_PROJECT_ID = process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID;

const mapStatus = (status?: string): Issue["status"] => {
  switch ((status || "").toUpperCase()) {
    case "PLANNED":
      return "todo";
    case "IN_PROGRESS":
      return "in_progress";
    case "REVIEW":
      return "review";
    case "DONE":
      return "done";
    case "WARNING":
    case "DELAYED":
      return "in_progress";
    default:
      return "todo";
  }
};

const mapPriority = (value?: string): Issue["priority"] => {
  switch ((value || "").toUpperCase()) {
    case "VERY_LOW":
      return "very_low";
    case "LOW":
      return "low";
    case "MEDIUM":
      return "medium";
    case "HIGH":
      return "high";
    case "URGENT":
      return "urgent";
    default:
      return "medium";
  }
};

const toBackendPriority = (value?: Issue["priority"]) => {
  switch (value) {
    case "very_low":
      return "VERY_LOW";
    case "low":
      return "LOW";
    case "medium":
      return "MEDIUM";
    case "high":
      return "HIGH";
    case "urgent":
      return "URGENT";
    default:
      return undefined;
  }
};

const toBackendStatus = (status?: Issue["status"]) => {
  switch (status) {
    case "backlog":
    case "todo":
      return "PLANNED";
    case "in_progress":
      return "IN_PROGRESS";
    case "review":
      return "REVIEW";
    case "done":
      return "DONE";
    default:
      return "PLANNED";
  }
};

const mapIssue = (item: any): Issue => ({
  id: item.id,
  key: item.key ?? (item.id ? `ISSUE-${String(item.id).slice(0, 6)}` : "ISSUE"),
  title: item.title ?? "",
  description: item.description ?? item.content ?? "",
  status: mapStatus(item.status),
  priority: mapPriority(item.priority),
  assignee: item.assignee?.name || item.assigneeId || "",
  assigneeId: item.assignee?.id || item.assigneeId || "",
  reporter: item.reporter?.name || item.creator?.name || item.reporterId || "",
  group: item.group
    ? {
        id: item.group.id,
        name: item.group.name,
        color: item.group.color,
        sortOrder: item.group.sortOrder ?? 0,
        createdAt: item.group.createdAt ?? new Date().toISOString(),
      }
    : undefined,
  startAt: item.startAt ?? undefined,
  endAt: item.endAt ?? undefined,
  progress: typeof item.progress === "number" ? item.progress : undefined,
  parentId: item.parentId ?? item.parent?.id ?? null,
  createdAt: item.createdAt || new Date().toISOString(),
  updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
  subtasks: Array.isArray(item.subtasks) ? item.subtasks.map(mapIssue) : undefined,
  comments: Array.isArray(item.comments) ? item.comments.map((comment: any) => mapComment(comment, item.id)) : [],
});

const mapComment = (item: any, issueId: ID): IssueComment => ({
  id: item.id,
  issueId,
  author: item.author?.name || item.authorId || "Unknown",
  authorId: item.author?.id || item.authorId || undefined,
  authorAvatarUrl: item.author?.avatarUrl ?? undefined,
  body: item.body ?? item.content ?? "",
  createdAt: item.createdAt || new Date().toISOString(),
});

const mapActivityType = (action?: string): ActivityType => {
  const v = (action || "").toLowerCase();
  if (v.includes("comment")) return "comment";
  if (v.includes("assign")) return "assignee";
  if (v.includes("status")) return "status";
  return "system";
};

const mapActivity = (item: any, issueId: ID): IssueActivity => ({
  id: item.id,
  issueId,
  type: mapActivityType(item.action || item.type),
  text: item.message || item.text || "",
  createdAt: item.createdAt || new Date().toISOString(),
});

const mapUser = (item: any): User => ({
  id: item.id,
  name: item.name,
  email: item.email,
  avatarUrl: item.avatarUrl,
});

export async function listIssues(projectId?: string): Promise<Issue[]> {
  const pid = projectId || DEFAULT_PROJECT_ID;
  if (!pid) return [];
  const { data } = await api.get<any[]>(`/projects/${pid}/issues`);
  return data.map(mapIssue);
}

export async function getIssueBoard(projectId?: string): Promise<Issue[]> {
  const pid = projectId || DEFAULT_PROJECT_ID;
  if (!pid) return [];
  const { data } = await api.get<any[]>(`/projects/${pid}/issues/board`);
  return data.map(mapIssue);
}

export async function getIssueAnalytics(projectId: string, params: { granularity: "hourly" | "daily" | "monthly"; date?: string; month?: string; year?: string }) {
  const query = new URLSearchParams();
  query.set("granularity", params.granularity);
  if (params.date) query.set("date", params.date);
  if (params.month) query.set("month", params.month);
  if (params.year) query.set("year", params.year);
  const { data } = await api.get<{ counts: number[]; granularity: string }>(`/projects/${projectId}/issues/analytics?${query.toString()}`);
  return data;
}

export async function getIssueById(id: ID, projectId?: string): Promise<Issue | null> {
  const pid = projectId || DEFAULT_PROJECT_ID;
  if (!pid) return null;
  try {
    const { data } = await api.get<any[]>(`/projects/${pid}/issues`);
    const found = data.find((item) => item.id === id);
    return found ? mapIssue(found) : null;
  } catch (err) {
    return null;
  }
}

export async function createIssue(
  projectId: string,
  payload: {
    title: string;
    status?: Issue["status"];
    priority?: Issue["priority"];
    assigneeId?: string;
    groupId?: string;
    startAt?: string;
    endAt?: string;
    progress?: number;
    parentId?: string;
    dueAt?: string | null;
  },
): Promise<Issue> {
  const { data } = await api.post<any>(`/projects/${projectId}/issues`, {
    title: payload.title,
    status: payload.status ? toBackendStatus(payload.status) : undefined,
    priority: payload.priority ? toBackendPriority(payload.priority) : undefined,
    assigneeId: payload.assigneeId,
    groupId: payload.groupId,
    startAt: payload.startAt,
    endAt: payload.endAt,
    progress: payload.progress,
    parentId: payload.parentId,
    dueAt: payload.dueAt ?? undefined,
  });
  return mapIssue(data);
}

export async function updateIssue(
  projectId: string,
  issueId: ID,
  patch: {
    title?: string;
    status?: Issue["status"];
    assigneeId?: string;
    priority?: Issue["priority"];
    groupId?: string;
    startAt?: string;
    endAt?: string;
    progress?: number;
    parentId?: string | null;
    dueAt?: string | null;
  },
): Promise<Issue> {
  let title = patch.title;
  if (!title) {
    const existing = await getIssueById(issueId, projectId);
    title = existing?.title ?? "";
  }
  const { data } = await api.patch<any>(`/projects/${projectId}/issues/${issueId}`, {
    title,
    status: patch.status ? toBackendStatus(patch.status) : undefined,
    assigneeId: patch.assigneeId,
    priority: patch.priority ? toBackendPriority(patch.priority) : undefined,
    groupId: patch.groupId,
    startAt: patch.startAt,
    endAt: patch.endAt,
    progress: patch.progress,
    parentId: patch.parentId,
    dueAt: patch.dueAt ?? undefined,
  });
  return mapIssue(data);
}

export async function deleteIssue(projectId: string, issueId: ID): Promise<{ ok: boolean }> {
  const { data } = await api.delete<{ ok: boolean }>(`/projects/${projectId}/issues/${issueId}`);
  return data;
}

export async function listIssueGroups(projectId: string): Promise<IssueGroup[]> {
  const { data } = await api.get<IssueGroup[]>(`/projects/${projectId}/issues/groups`);
  return data ?? [];
}

export async function createIssueGroup(projectId: string, payload: { name?: string; color?: string }): Promise<IssueGroup> {
  const { data } = await api.post<IssueGroup>(`/projects/${projectId}/issues/groups`, payload);
  return data;
}

export async function updateIssueGroup(
  projectId: string,
  groupId: string,
  payload: { name?: string; color?: string; sortOrder?: number },
): Promise<IssueGroup> {
  const { data } = await api.patch<IssueGroup>(`/projects/${projectId}/issues/groups/${groupId}`, payload);
  return data;
}

export async function removeIssueGroup(projectId: string, groupId: string): Promise<{ ok: boolean }> {
  const { data } = await api.patch<{ ok: boolean }>(`/projects/${projectId}/issues/groups/${groupId}/remove`);
  return data;
}

export async function updateIssueStatus(projectId: string, issueId: ID, status: Issue["status"]): Promise<Issue> {
  const { data } = await api.patch<any>(`/projects/${projectId}/issues/${issueId}/status`, {
    status: toBackendStatus(status),
  });
  return mapIssue(data);
}

export async function updateIssueProgress(projectId: string, issueId: ID, progress: number): Promise<Issue> {
  const { data } = await api.patch<any>(`/projects/${projectId}/issues/${issueId}/progress`, { progress });
  return mapIssue(data);
}

export async function assignIssue(projectId: string, issueId: ID, userId: string): Promise<Issue> {
  const { data } = await api.patch<any>(`/projects/${projectId}/issues/${issueId}/assign`, { userId });
  return mapIssue(data);
}

export async function listComments(issueId: ID, projectId?: string): Promise<IssueComment[]> {
  const pid = projectId || DEFAULT_PROJECT_ID;
  if (!pid) return [];
  const { data } = await api.get<any[]>(`/projects/${pid}/issues`);
  const issue = data.find((item) => item.id === issueId);
  const comments = issue?.comments ?? [];
  return comments.map((comment: any) => mapComment(comment, issueId));
}

export async function addComment(issueId: ID, author: string, body: string, projectId?: string): Promise<IssueComment> {
  const pid = projectId || DEFAULT_PROJECT_ID;
  if (!pid) throw new Error("Missing projectId");
  const { data } = await api.post<any>(`/projects/${pid}/issues/${issueId}/comment`, { content: body });
  // 백엔드가 author 정보를 돌려주지 않으면 호출자 이름을 보정
  return mapComment({ ...data, authorId: data.authorId ?? author }, issueId);
}

export async function deleteComment(projectId: string, commentId: ID): Promise<{ issueId?: ID; commentId?: ID }> {
  const { data } = await api.delete<{ issueId?: ID; commentId?: ID }>(`/projects/${projectId}/issues/comment/${commentId}`);
  return data ?? { commentId };
}

export async function addSubtask(
  projectId: string,
  payload: { parentId: ID; title: string; assigneeId?: string; startAt?: string; dueAt?: string },
): Promise<Issue> {
  const { data } = await api.post<any>(`/projects/${projectId}/issues/subtask`, payload);
  return mapIssue(data);
}

export async function deleteSubtask(projectId: string, subtaskId: ID): Promise<{ parentId?: ID | null }> {
  const { data } = await api.delete<{ parentId?: ID | null }>(`/projects/${projectId}/issues/subtask/${subtaskId}`);
  return data ?? { parentId: null };
}

export async function listActivities(issueId: ID, projectId?: string, type?: ActivityType): Promise<IssueActivity[]> {
  const pid = projectId || DEFAULT_PROJECT_ID;
  if (!pid) return [];
  const { data } = await api.get<any[]>(`/projects/${pid}/activity`);
  const items = data.filter((item) => item.targetType === "ISSUE" && item.targetId === issueId);
  const mapped = items.map((item) => mapActivity(item, issueId));
  if (!type) return mapped;
  return mapped.filter((item) => item.type === type);
}

export async function searchUsers(q: string, limit = 8): Promise<User[]> {
  if (!q.trim()) return [];
  const { data } = await api.get<any[]>(`/users/search?q=${encodeURIComponent(q)}&limit=${limit}`);
  return data.map(mapUser);
}
