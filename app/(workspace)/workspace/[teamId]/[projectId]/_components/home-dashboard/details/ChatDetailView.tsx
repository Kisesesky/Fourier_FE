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
              </button>
            )}
            <section className="rounded-2xl border border-border bg-panel/70 p-4">
              {renderDetailTabs(chatTab, setChatTab, [
                { key: "all", label: "전체", icon: MessagesSquare },
                { key: "channels", label: "채널", icon: Hash },
                { key: "messages", label: "메시지", icon: MessageSquare },
                { key: "threads", label: "스레드", icon: GitBranch },
              ])}
            </section>
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
                  <div className="mt-4 space-y-3">
                    {channels
                      .map((channel) => ({
                        id: channel.id,
                        name: channel.name,
                        lastTs: channelActivity[channel.id]?.lastMessageTs ?? 0,
                        preview: channelActivity[channel.id]?.lastPreview ?? "최근 메시지 없음",
                      }))
                      .sort((a: any, b) => b.lastTs - a.lastTs)
                      .slice(0, 8)
                      .map((entry) => (
                        <div key={entry.id} className="rounded-xl border border-border/60 bg-panel px-3 py-2">
                          <div className="flex items-center justify-between text-[11px] text-muted">
                            <span className="font-semibold text-foreground">{entry.id.startsWith("dm:") ? "DM" : "#"}{entry.name}</span>
                            <span>{entry.lastTs ? new Date(entry.lastTs).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "-"}</span>
                          </div>
                          <div className="mt-1 truncate text-[11px] text-muted">{entry.preview}</div>
                        </div>
                      ))}
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
                    {channels.slice(0, 10).map((channel) => (
                      <button
                        key={channel.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-panel px-3 py-2 text-left text-xs hover:bg-accent"
                        onClick={() => onNavigate(`${pathname}/chat/${encodeURIComponent(channel.id)}`)}
                      >
                        <span className="font-semibold text-foreground">
                          {channel.id.startsWith("dm:") ? "DM · " : "#"}
                          {channel.name}
                        </span>
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
