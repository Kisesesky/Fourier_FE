// app/(workspace)/workspace/[teamId]/[projectId]/_components/home-dashboard/details/FileDetailView.tsx
'use client';

import { Archive, ArrowUpRight, BarChart3, Clock4, FileText } from 'lucide-react';
import type { DetailViewBaseProps } from './detail-view.types';

export default function FileDetailView({ pathname, onNavigate, renderHeader, renderDetailTabs, formatBytes, model }: DetailViewBaseProps) {
  const {
    fileTab,
    setFileTab,
    fileCount,
    fileTotalBytes,
    recentFiles,
  } = model;
        return (
          <>
            {renderHeader(
              "File Dashboard",
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-border bg-panel px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-accent"
                onClick={() => onNavigate(`${pathname}/file`)}
              >
                파일로 이동 <ArrowUpRight size={12} />
              </button>,
              renderDetailTabs(fileTab, setFileTab, [
                { key: "all", label: "전체", icon: Archive },
                { key: "files", label: "파일", icon: FileText },
                { key: "storage", label: "용량", icon: BarChart3 },
                { key: "recent", label: "최근", icon: Clock4 },
              ])
            )}
            <section className="grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><Archive size={16} /> 파일 수</span>
                  <span className="text-xs text-muted">Total</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{fileCount}</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><BarChart3 size={16} /> 총 용량</span>
                  <span className="text-xs text-muted">Usage</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{formatBytes(fileTotalBytes)}</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><Clock4 size={16} /> 최근 업로드</span>
                  <span className="text-xs text-muted">5개</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{recentFiles.length}</div>
              </div>
            </section>
            {(fileTab === "all" || fileTab === "files" || fileTab === "recent") && (
              <section className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="mb-3 flex items-center gap-2 text-sm text-muted">
                  <FileText size={16} /> 최근 파일
                </div>
                <div className="space-y-2">
                  {recentFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-panel px-3 py-2 text-xs">
                      <span className="truncate font-semibold text-foreground">{file.name}</span>
                      <span className="text-[11px] text-muted">
                        {new Date(file.createdAt).toLocaleDateString("ko-KR")} · {formatBytes(file.size)}
                      </span>
                    </div>
                  ))}
                  {recentFiles.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs text-muted">최근 파일이 없습니다.</div>
                  )}
                </div>
              </section>
            )}
            {(fileTab === "all" || fileTab === "storage") && (
              <section className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="mb-3 flex items-center gap-2 text-sm text-muted">
                  <BarChart3 size={16} /> 용량 요약
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-border/60 bg-panel px-3 py-2 text-xs">
                    <div className="text-muted">평균 파일 크기</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{fileCount ? formatBytes(Math.floor(fileTotalBytes / fileCount)) : "0 B"}</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-panel px-3 py-2 text-xs">
                    <div className="text-muted">총 사용량</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{formatBytes(fileTotalBytes)}</div>
                  </div>
                </div>
              </section>
            )}
          </>
        );

}
