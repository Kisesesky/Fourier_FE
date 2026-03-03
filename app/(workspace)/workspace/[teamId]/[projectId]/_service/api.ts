// app/(workspace)/workspace/[teamId]/[projectId]/_service/api.ts
import { z } from "zod";
import { fetchProjects } from "@/lib/projects";
import type { Project } from "@/types/project";
import { ProjectSummarySchema } from "../_model/schemas/project-api.schemas";

export async function listTeamProjects(teamId: string, signal?: AbortSignal): Promise<Project[]> {
  const data = await fetchProjects(teamId, signal);
  const parsed = z.array(ProjectSummarySchema).safeParse(data ?? []);
  return parsed.success ? parsed.data : [];
}
