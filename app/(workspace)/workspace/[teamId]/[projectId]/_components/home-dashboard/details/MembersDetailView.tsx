// app/(workspace)/workspace/[teamId]/[projectId]/_components/home-dashboard/details/MembersDetailView.tsx
'use client';

import { ArrowUpRight, CheckCircle2, Clock4, LayoutGrid, LineChart, UserSquare2, Users } from 'lucide-react';
import { MEMBER_ROLE_LABELS } from '../../../_model/dashboard-page.constants';
import { buildSeriesFromDates, filterDates } from '../../../_model/dashboard-page.utils';
import type { DetailViewBaseProps } from './detail-view.types';

export default function MembersDetailView({ pathname, onNavigate, renderHeader, renderDetailTabs, renderGraphFilter, renderGraphTabs, renderBars, renderRangeLabels, model }: DetailViewBaseProps) {
  const {
    memberTab,
    setMemberTab,
    memberCount,
    memberGraphMode,
    setMemberGraphMode,
    memberHourlyDate,
    setMemberHourlyDate,
    memberDailyMonth,
    setMemberDailyMonth,
    memberMonthlyYear,
    setMemberMonthlyYear,
    memberCounts,
    members,
  } = model;
        return (
          <>
            {renderHeader(
              "Members Dashboard",
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-border bg-panel px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-accent"
                onClick={() => onNavigate(`${pathname}/members`)}
              >
                멤버로 이동 <ArrowUpRight size={12} />
              </button>,
              renderDetailTabs(memberTab, setMemberTab, [
                { key: "all", label: "전체", icon: Users },
                { key: "directory", label: "디렉토리", icon: UserSquare2 },
                { key: "roles", label: "역할", icon: LayoutGrid },
                { key: "activity", label: "활동", icon: LineChart },
              ])
            )}
            <section className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><Users size={16} /> 멤버</span>
                  <span className="text-xs text-muted">Total</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{memberCount}</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><CheckCircle2 size={16} /> 소유자</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">
                  {members.filter((member) => (member.role ?? "").toUpperCase() === "OWNER").length}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><CheckCircle2 size={16} /> 관리자</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">
                  {members.filter((member) => (member.role ?? "").toUpperCase() === "MANAGER").length}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><CheckCircle2 size={16} /> 멤버</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">
                  {members.filter((member) => (member.role ?? "").toUpperCase() === "MEMBER").length}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><CheckCircle2 size={16} /> 게스트</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">
                  {members.filter((member) => (member.role ?? "").toUpperCase() === "GUEST").length}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><Clock4 size={16} /> 최근 참여</span>
                  <span className="text-xs text-muted">Recent</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{members.length}</div>
              </div>
            </section>
            {(memberTab === "all" || memberTab === "directory") && (
              <section className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="mb-3 flex items-center gap-2 text-sm text-muted">
                  <Users size={16} /> 멤버 디렉토리
                </div>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-panel px-3 py-2 text-xs">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted/40">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-foreground">{member.name.slice(0, 1)}</span>
                          )}
                        </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-foreground">{member.displayName ?? member.name}</span>
                          <span
                            className="mt-0.5 inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold"
                            style={
                              (member.role ?? "").toUpperCase() === "OWNER"
                                ? { borderColor: "#f59e0b66", backgroundColor: "#f59e0b22", color: "#b45309" }
                                : (member.role ?? "").toUpperCase() === "MANAGER"
                                ? { borderColor: "#3b82f666", backgroundColor: "#3b82f622", color: "#1d4ed8" }
                                : (member.role ?? "").toUpperCase() === "GUEST"
                                ? { borderColor: "#a855f766", backgroundColor: "#a855f722", color: "#7e22ce" }
                                : { borderColor: "#10b98166", backgroundColor: "#10b98122", color: "#047857" }
                            }
                          >
                            {MEMBER_ROLE_LABELS[(member.role ?? "MEMBER").toUpperCase() as keyof typeof MEMBER_ROLE_LABELS] ?? (member.role ?? "MEMBER")}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 text-[11px] text-muted">
                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString("ko-KR") : "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {(memberTab === "all" || memberTab === "roles") && (
              <section className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="mb-3 flex items-center gap-2 text-sm text-muted">
                  <LayoutGrid size={16} /> 역할 분포
                </div>
                <div className="grid gap-3 text-xs">
                  {(["OWNER", "MANAGER", "MEMBER", "GUEST"] as const).map((role) => {
                    const roleMembers = members.filter((member) => (member.role ?? "").toUpperCase() === role);
                    const count = roleMembers.length;
                    return (
                      <div key={role} className="rounded-lg border border-border/60 bg-panel px-3 py-3">
                        <div className="flex items-center justify-between">
                          <div className="text-muted">{MEMBER_ROLE_LABELS[role]}</div>
                          <div className="text-sm font-semibold text-foreground">{count}</div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {roleMembers.length === 0 && (
                            <span className="text-[11px] text-muted">해당 멤버 없음</span>
                          )}
                          {roleMembers.map((member) => (
                            <span key={`${role}-${member.id}`} className="inline-flex items-center gap-2 rounded-full bg-panel px-2 py-1 text-[12px]">
                              <span className="h-10 w-10 overflow-hidden rounded-full bg-muted/40">
                                {member.avatarUrl ? (
                                  <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="flex h-full w-full items-center justify-center text-[12px]">{member.name.slice(0, 1)}</span>
                                )}
                              </span>
                              <span className="text-foreground">{member.displayName ?? member.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            {(memberTab === "all" || memberTab === "activity") && (
              <section className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 text-sm text-muted">
                  <span className="flex items-center gap-2"><LineChart size={16} /> 멤버 접속 시간대</span>
                  <div className="flex flex-col items-end gap-2">
                    {renderGraphFilter(
                      memberGraphMode,
                      { day: memberHourlyDate, month: memberDailyMonth, year: memberMonthlyYear },
                      (next) => {
                        setMemberHourlyDate(next.day);
                        setMemberDailyMonth(next.month);
                        setMemberMonthlyYear(next.year);
                      }
                    )}
                    {renderGraphTabs(memberGraphMode, setMemberGraphMode)}
                  </div>
                </div>
                <div className="mt-4">
                  {memberGraphMode === "hourly" && renderBars(memberCounts.hourly.length ? memberCounts.hourly : buildSeriesFromDates(filterDates(members.map((m) => m.joinedAt ?? 0).filter(Boolean), "hourly", { day: memberHourlyDate, month: memberDailyMonth, year: memberMonthlyYear })).hourly, 72)}
                  {memberGraphMode === "daily" && renderBars(memberCounts.daily.length ? memberCounts.daily : buildSeriesFromDates(filterDates(members.map((m) => m.joinedAt ?? 0).filter(Boolean), "daily", { day: memberHourlyDate, month: memberDailyMonth, year: memberMonthlyYear })).daily, 72)}
                  {memberGraphMode === "monthly" && renderBars(memberCounts.monthly.length ? memberCounts.monthly : buildSeriesFromDates(filterDates(members.map((m) => m.joinedAt ?? 0).filter(Boolean), "monthly", { day: memberHourlyDate, month: memberDailyMonth, year: memberMonthlyYear })).monthly, 72)}
                  {memberGraphMode === "hourly" && renderRangeLabels("hourly", 24)}
                  {memberGraphMode === "daily" && renderRangeLabels("daily", memberCounts.daily.length || 31)}
                  {memberGraphMode === "monthly" && renderRangeLabels("monthly", 12)}
                </div>
              </section>
            )}
          </>
        );

}
