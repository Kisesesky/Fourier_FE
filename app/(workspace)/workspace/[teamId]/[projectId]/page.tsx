// app/(workspace)/workspcae/[teamId]/[projectId]/page.tsx
"use client";

import { useEffect } from "react";
import InviteBanner from "@/workspace/root/InviteBanner";
import RecentVisitedView from "@/workspace/root/views/RecentVisitedView";
import { useProject } from "@/hooks/useProject";
import { usePathname } from "next/navigation";

type WorkspaceProjectPageProps = {
  params: { teamId: string; projectId: string };
};

export default function WorkspaceProjectPage({ params }: WorkspaceProjectPageProps) {
  const teamId = decodeURIComponent(params.teamId);
  const projectId = decodeURIComponent(params.projectId);
  const pathname = usePathname();

  const { project, loading, error } = useProject(teamId, projectId);

  useEffect(() => {
    if (!project) return;
    if (typeof window === "undefined") return;
    if (!pathname) return;
    const STORAGE_KEY = "recently-visited";
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
      const next = parsed.map((item) => {
        if (item.path !== pathname) return item;
        return {
          ...item,
          title: project.name,
          description: project.description || "프로젝트",
          tag: "Project",
          iconValue: project.iconValue ?? "",
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("recently-visited:update"));
    } catch (err) {
      console.error("Failed to update recent visited title", err);
    }
  }, [pathname, project]);

  if (loading) {
    return <div className="px-8 py-6 text-muted">프로젝트 불러오는 중…</div>;
  }

  if (error || !project) {
    return (
      <div className="px-8 py-6 text-red-500">
        {error ?? "프로젝트를 찾을 수 없습니다."}
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-6 px-4 py-6 md:px-8">
      <section className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-muted">
          Team {teamId}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            {project.name}
          </h1>

          {project.iconValue && (
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
              {project.iconValue}
            </span>
          )}
        </div>

        <p className="text-sm text-muted">
          {project.description || "프로젝트 설명이 없습니다."}
        </p>
      </section>

      <section className="space-y-6">
        <InviteBanner />
        <RecentVisitedView />
      </section>
    </div>
  );
}
