// app/(workspace)/workspace/[teamId]/[projectId]/_components/home-dashboard/details/ChatDetailView.tsx
'use client';

import { ArrowUpRight, BarChart3, Flame, GitBranch, Hash, MessageSquare, MessagesSquare } from 'lucide-react';
import { buildSeriesFromDates, filterDates } from '../../../_model/dashboard-page.utils';
import type { DetailViewBaseProps } from './detail-view.types';

export default function ChatDetailView({ pathname, onNavigate, renderHeader, renderDetailTabs, renderGraphFilter, renderGraphTabs, renderBars, renderRangeLabels, model }: DetailViewBaseProps) {
  const {
    chatTab,
    setChatTab,
    channels,
    channelActivity,
    chatUsers,
    currentUserId,
    chatStats,
    chatThreadRows,
    messageGraphMode,
    setMessageGraphMode,
    messageHourlyDate,
    setMessageHourlyDate,
    messageDailyMonth,
    setMessageDailyMonth,
    messageMonthlyYear,
    setMessageMonthlyYear,
    messageCounts,
    messageDates,
  } = model;
  const resolveDmUser = (channelId: string) => {
    const ids = channelId.replace(/^dm:/, "").split("+").filter(Boolean);
    const partnerId = ids.find((id) => id !== currentUserId) ?? ids[0];
    return partnerId ? chatUsers[partnerId] : undefined;
  };
  const sortedChannelRows = channels
    .map((channel) => ({
      id: channel.id,
      name: channel.name,
      lastTs: channelActivity[channel.id]?.lastMessageTs ?? 0,
      preview: channelActivity[channel.id]?.lastPreview ?? "최근 메시지 없음",
      isDm: channel.id.startsWith("dm:"),
    }))
    .sort((a, b) => b.lastTs - a.lastTs);
  const dmRows = sortedChannelRows.filter((row) => row.isDm);
  const channelRows = sortedChannelRows.filter((row) => !row.isDm);
        return (
          <>
            {renderHeader(
              "Chat Dashboard",
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-border bg-panel px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-accent"
                onClick={() => onNavigate(`${pathname}/chat`)}
              >
                채팅으로 이동 <ArrowUpRight size={12} />
              </button>,
              renderDetailTabs(chatTab, setChatTab, [
                { key: "all", label: "전체", icon: MessagesSquare },
                { key: "channels", label: "채널", icon: Hash },
                { key: "messages", label: "메시지", icon: MessageSquare },
                { key: "threads", label: "스레드", icon: GitBranch },
              ])
            )}
            <section className="grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><Hash size={16} /> 채널</span>
                  <span className="text-xs text-muted">Total</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{chatStats.channelCount}</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><MessagesSquare size={16} /> DM</span>
                  <span className="text-xs text-muted">Rooms</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{chatStats.dmCount}</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><MessageSquare size={16} /> 메시지</span>
                  <span className="text-xs text-muted">Total</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{chatStats.messageCount}</div>
              </div>
            </section>
            {(chatTab === "all" || chatTab === "channels") && (
              <section className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
                <div className="rounded-2xl border border-border bg-panel/70 p-6">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Flame size={16} /> 채널 활동 타임라인
                  </div>
                  <div className="mt-4 space-y-4">
                    <div className="border-b border-border/60 pb-2 text-[11px] font-semibold text-muted">DM</div>
                    <div className="space-y-3">
                      {dmRows.slice(0, 4).map((entry) => (
                        <div key={entry.id} className="rounded-xl border border-border/60 bg-panel px-3 py-2">
                          <div className="flex items-start justify-between gap-3 text-[11px]">
                            <span className="flex min-w-0 items-start gap-2">
                              <span className="h-9 w-9 overflow-hidden rounded-full bg-muted/40">
                                {resolveDmUser(entry.id)?.avatarUrl ? (
                                  <img src={resolveDmUser(entry.id)?.avatarUrl ?? ""} alt={resolveDmUser(entry.id)?.name ?? entry.name} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="flex h-full w-full items-center justify-center text-[11px]">
                                    {(resolveDmUser(entry.id)?.name ?? entry.name).slice(0, 1)}
                                  </span>
                                )}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate font-semibold text-foreground">{resolveDmUser(entry.id)?.name ?? entry.name}</span>
                                <span className="block truncate text-muted">{entry.preview}</span>
                              </span>
                            </span>
                            <span className="shrink-0 text-muted">
                              {entry.lastTs ? new Date(entry.lastTs).toLocaleDateString("ko-KR") : "-"}
                            </span>
                          </div>
                        </div>
                      ))}
                      {dmRows.length === 0 && <div className="text-xs text-muted">DM 활동이 없습니다.</div>}
                    </div>
                    <div className="border-b border-border/60 pb-2 text-[11px] font-semibold text-muted">채널</div>
                    <div className="space-y-3">
                      {channelRows.slice(0, 4).map((entry) => (
                        <div key={entry.id} className="rounded-xl border border-border/60 bg-panel px-3 py-2">
                          <div className="flex items-center justify-between text-[11px] text-muted">
                            <span className="font-semibold text-foreground">#{entry.name}</span>
                            <span>{entry.lastTs ? new Date(entry.lastTs).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "-"}</span>
                          </div>
                          <div className="mt-1 truncate text-[11px] text-muted">{entry.preview}</div>
                        </div>
                      ))}
                      {channelRows.length === 0 && <div className="text-xs text-muted">채널 활동이 없습니다.</div>}
                    </div>
                    {channels.length === 0 && (
                      <div className="rounded-xl border border-dashed border-border/70 px-3 py-2 text-xs text-muted">
                        아직 채팅 채널이 없습니다.
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-panel/70 p-6">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Hash size={16} /> 채널/DM 목록
                  </div>
                <div className="mt-3 space-y-2">
                    <div className="border-b border-border/60 pb-2 text-[11px] font-semibold text-muted">DM</div>
                    {dmRows.slice(0, 6).map((channel) => (
                      <button
                        key={channel.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-panel px-3 py-2 text-left text-xs hover:bg-accent"
                        onClick={() => onNavigate(`${pathname}/chat/${encodeURIComponent(channel.id)}`)}
                      >
                        <span className="flex items-center gap-2 font-semibold text-foreground">
                          <span className="h-6 w-6 overflow-hidden rounded-full bg-muted/40">
                            {resolveDmUser(channel.id)?.avatarUrl ? (
                              <img src={resolveDmUser(channel.id)?.avatarUrl ?? ""} alt={resolveDmUser(channel.id)?.name ?? channel.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[10px]">
                                {(resolveDmUser(channel.id)?.name ?? channel.name).slice(0, 1)}
                              </span>
                            )}
                          </span>
                          {resolveDmUser(channel.id)?.name ?? channel.name}
                        </span>
                        <span className="text-[10px] text-muted">
                          {channelActivity[channel.id]?.lastMessageTs
                            ? new Date(channelActivity[channel.id]?.lastMessageTs ?? 0).toLocaleDateString("ko-KR")
                            : "-"}
                        </span>
                      </button>
                    ))}
                    <div className="border-b border-border/60 pb-2 pt-1 text-[11px] font-semibold text-muted">채널</div>
                    {channelRows.slice(0, 6).map((channel) => (
                      <button
                        key={channel.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-panel px-3 py-2 text-left text-xs hover:bg-accent"
                        onClick={() => onNavigate(`${pathname}/chat/${encodeURIComponent(channel.id)}`)}
                      >
                        <span className="font-semibold text-foreground">#{channel.name}</span>
                        <span className="text-[10px] text-muted">
                          {channelActivity[channel.id]?.lastMessageTs
                            ? new Date(channelActivity[channel.id]?.lastMessageTs ?? 0).toLocaleDateString("ko-KR")
                            : "-"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}
            {(chatTab === "all" || chatTab === "messages") && (
              <section className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 text-sm text-muted">
                  <span className="flex items-center gap-2"><BarChart3 size={16} /> 메시지 그래프</span>
                  <div className="flex flex-col items-end gap-2">
                    {renderGraphFilter(
                      messageGraphMode,
                      { day: messageHourlyDate, month: messageDailyMonth, year: messageMonthlyYear },
                      (next) => {
                        setMessageHourlyDate(next.day);
                        setMessageDailyMonth(next.month);
                        setMessageMonthlyYear(next.year);
                      }
                    )}
                    {renderGraphTabs(messageGraphMode, setMessageGraphMode)}
                  </div>
                </div>
                <div className="mt-4">
                  {(messageCounts.hourly.length || messageDates.length) ? (
                    <>
                      {messageGraphMode === "hourly" &&
                        renderBars(
                          messageCounts.hourly.length
                            ? messageCounts.hourly
                            : buildSeriesFromDates(filterDates(messageDates, "hourly", { day: messageHourlyDate, month: messageDailyMonth, year: messageMonthlyYear })).hourly,
                          144
                        )}
                      {messageGraphMode === "daily" &&
                        renderBars(
                          messageCounts.daily.length
                            ? messageCounts.daily
                            : buildSeriesFromDates(filterDates(messageDates, "daily", { day: messageHourlyDate, month: messageDailyMonth, year: messageMonthlyYear })).daily,
                          144
                        )}
                      {messageGraphMode === "monthly" &&
                        renderBars(
                          messageCounts.monthly.length
                            ? messageCounts.monthly
                            : buildSeriesFromDates(filterDates(messageDates, "monthly", { day: messageHourlyDate, month: messageDailyMonth, year: messageMonthlyYear })).monthly,
                          144
                        )}
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-xs text-muted">메시지 데이터가 없습니다.</div>
                  )}
                </div>
                {messageGraphMode === "hourly" && renderRangeLabels("hourly", 24)}
                {messageGraphMode === "daily" && renderRangeLabels("daily", buildSeriesFromDates(filterDates(messageDates, "daily", { day: messageHourlyDate, month: messageDailyMonth, year: messageMonthlyYear })).daily.length)}
                {messageGraphMode === "monthly" && renderRangeLabels("monthly", 12)}
              </section>
            )}
            {(chatTab === "all" || chatTab === "threads") && (
              <section className="grid gap-5 md:grid-cols-3">
                <div className="rounded-2xl border border-border bg-panel/70 p-6">
                  <div className="flex items-center justify-between text-sm text-muted">
                    <span className="flex items-center gap-2"><GitBranch size={16} /> 스레드 루트</span>
                    <span className="text-xs text-muted">Total</span>
                  </div>
                  <div className="mt-2 text-2xl font-semibold">{chatStats.threadRootCount}</div>
                </div>
                <div className="rounded-2xl border border-border bg-panel/70 p-6">
                  <div className="flex items-center justify-between text-sm text-muted">
                    <span className="flex items-center gap-2"><GitBranch size={16} /> 스레드 답글</span>
                    <span className="text-xs text-muted">Total</span>
                  </div>
                  <div className="mt-2 text-2xl font-semibold">{chatStats.threadReplyCount}</div>
                </div>
                <div className="rounded-2xl border border-border bg-panel/70 p-6">
                  <div className="flex items-center justify-between text-sm text-muted">
                    <span className="flex items-center gap-2"><MessageSquare size={16} /> 참여 채널</span>
                    <span className="text-xs text-muted">Active</span>
                  </div>
                  <div className="mt-2 text-2xl font-semibold">{chatThreadRows.length}</div>
                </div>
                <div className="md:col-span-3 rounded-2xl border border-border bg-panel/70 p-6">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <GitBranch size={16} /> 채널별 스레드 집중도
                  </div>
                  <div className="mt-3 space-y-2">
                    {chatThreadRows.map((row) => (
                      <div key={row.channelId} className="flex items-center justify-between rounded-lg border border-border/60 bg-panel px-3 py-2 text-xs">
                        <span className="font-semibold text-foreground">{row.channelName}</span>
                        <span className="text-muted">{row.threadCount}개</span>
                      </div>
                    ))}
                    {chatThreadRows.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs text-muted">스레드 데이터가 없습니다.</div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </>
        );

}
