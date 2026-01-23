import api from "./api";

export type TeamActivityItem = {
  id: string;
  actor: { id: string; name: string } | null;
  action: string;
  targetType: string;
  targetId: string;
  projectId?: string;
  message: string;
  payload?: unknown;
  createdAt: string;
};

export async function fetchTeamActivity(teamId: string) {
  const res = await api.get(`/teams/${teamId}/activity`);
  return res.data as TeamActivityItem[];
}
