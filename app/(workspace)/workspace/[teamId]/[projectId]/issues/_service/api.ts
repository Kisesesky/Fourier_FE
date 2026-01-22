import type {
  ActivityType,
  Issue,
  IssueActivity,
  IssueComment,
  ID,
  User,
} from "@/workspace/issues/_model/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";
const DEFAULT_PROJECT_ID = process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID;

const withAuthHeaders = (init?: RequestInit): RequestInit => ({
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  },
  ...init,
});

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, withAuthHeaders(init));
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

const mapIssue = (item: any): Issue => ({
  id: item.id,
  key: item.key,
  title: item.title,
  description: item.description ?? "",
  status: item.status,
  priority: item.priority,
  assignee: item.assignee?.name || item.assigneeId || "",
  reporter: item.reporter?.name || item.reporterId || "",
  createdAt: item.createdAt || new Date().toISOString(),
  updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
});

const mapComment = (item: any): IssueComment => ({
  id: item.id,
  issueId: item.issueId,
  author: item.author?.name || item.authorId || "Unknown",
  body: item.body,
  createdAt: item.createdAt || new Date().toISOString(),
});

const mapActivity = (item: any): IssueActivity => ({
  id: item.id,
  issueId: item.issueId,
  type: item.type,
  text: item.text,
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
  const data = await http<any[]>(`/projects/${pid}/issues`);
  return data.map(mapIssue);
}

export async function getIssueById(id: ID): Promise<Issue | null> {
  try {
    const data = await http<any>(`/issues/${id}`);
    return mapIssue(data);
  } catch (err) {
    return null;
  }
}

export async function listComments(issueId: ID): Promise<IssueComment[]> {
  const data = await http<any[]>(`/issues/${issueId}/comments`);
  return data.map(mapComment);
}

export async function addComment(issueId: ID, author: string, body: string): Promise<IssueComment> {
  const data = await http<any>(`/issues/${issueId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
  // 백엔드가 author 정보를 돌려주지 않으면 호출자 이름을 보정
  return mapComment({ ...data, authorId: data.authorId ?? author });
}

export async function listActivities(issueId: ID, type?: ActivityType): Promise<IssueActivity[]> {
  const query = type ? `?type=${encodeURIComponent(type)}` : "";
  const data = await http<any[]>(`/issues/${issueId}/activities${query}`);
  return data.map(mapActivity);
}

export async function searchUsers(q: string, limit = 8): Promise<User[]> {
  if (!q.trim()) return [];
  const data = await http<any[]>(`/users/search?q=${encodeURIComponent(q)}&limit=${limit}`);
  return data.map(mapUser);
}
