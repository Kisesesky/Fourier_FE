// src/lib/projects.ts
import api from "./api";

export type CreateProjectPayload = {
  name: string;
  description?: string;
  iconType?: "IMAGE";
  iconValue?: string;
  status?: "ACTIVE" | "DRAFT" | "DISABLED";
  selectedUserIds?: string[];
};

export async function fetchProjects(teamId: string, signal?: AbortSignal) {
  const res = await api.get(`/team/${teamId}/project`, { signal });
  return res.data ?? [];
}

export async function createProject(teamId: string, payload: CreateProjectPayload) {
  const res = await api.post(`/team/${teamId}/project`, payload);
  return res.data;
}

export async function updateProject(
  teamId: string,
  projectId: string,
  payload: Partial<CreateProjectPayload>
) {
  const res = await api.patch(`/team/${teamId}/project/${projectId}`, payload);
  return res.data;
}

export async function cloneProject(teamId: string, projectId: string) {
  const res = await api.post(`/team/${teamId}/project/${projectId}/clone`);
  return res.data;
}

export async function deleteProject(teamId: string, projectId: string) {
  const res = await api.delete(`/team/${teamId}/project/${projectId}`);
  return res.data;
}

export async function fetchProjectMembers(teamId: string, projectId: string) {
  const res = await api.get(`/team/${teamId}/project/${projectId}/members`);
  return res.data ?? [];
}

export async function getProjectMemberAnalytics(
  teamId: string,
  projectId: string,
  params: { granularity: "hourly" | "daily" | "monthly"; date?: string; month?: string; year?: string }
) {
  const query = new URLSearchParams();
  query.set("granularity", params.granularity);
  if (params.date) query.set("date", params.date);
  if (params.month) query.set("month", params.month);
  if (params.year) query.set("year", params.year);
  const res = await api.get(`/team/${teamId}/project/${projectId}/members/analytics?${query.toString()}`);
  return res.data ?? { counts: [] };
}

export async function removeProjectMember(teamId: string, projectId: string, userId: string) {
  const res = await api.delete(`/team/${teamId}/project/${projectId}/member/${userId}`);
  return res.data;
}

export async function addProjectMember(
  teamId: string,
  projectId: string,
  payload: { userId: string; role: string }
) {
  const res = await api.post(`/team/${teamId}/project/${projectId}/member`, payload);
  return res.data;
}

export async function favoriteProject(teamId: string, projectId: string) {
  const res = await api.post(`/team/${teamId}/project/${projectId}/favorite`);
  return res.data;
}

export async function unfavoriteProject(teamId: string, projectId: string) {
  const res = await api.delete(`/team/${teamId}/project/${projectId}/favorite`);
  return res.data;
}
