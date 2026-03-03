'use client';

import { ArrowLeft, ChevronDown, MoreHorizontal, Plus, Reply, Search, Send, Smile, SmilePlus } from "lucide-react";
import Modal from "@/components/common/Modal";
import EmojiPicker from "@/workspace/chat/_components/EmojiPicker";
import DmListView from "./floating-dm/_components/DmListView";
import FloatingLauncher from "./floating-dm/_components/FloatingLauncher";
import {
  FLOATING_DM_FILE_TYPE_OPTIONS,
  FLOATING_DM_STORAGE_KEYS,
} from "./floating-dm/_model/constants/floating-dm.constants";
import {
  getFloatingDmInitials,
  getFloatingDmMessageTimeLabel,
  getFloatingDmRelativeDateLabel,
} from "./floating-dm/_model/utils/floating-dm.utils";
import { useFloatingDmController } from "./floating-dm/_model/hooks/useFloatingDmController";

export default function FloatingDm() {
  const {
    profile,
    open,
    setOpen,
    floatingHidden,
    setFloatingHidden,
    floatingPos,
    setFloatingPos,
    contextOpen,
    setContextOpen,
    contextPos,
    setContextPos,
    selected,
    loadingFriends,
    loadingMessages,
    draft,
    setDraft,
    query,
    setQuery,
    recentByFriend,
    unreadByFriend,
    canSend,
    view,
    setView,
    replyTarget,
    setReplyTarget,
    emojiOpenFor,
    setEmojiOpenFor,
    menuOpenFor,
    setMenuOpenFor,
    setInputFocused,
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    detailSearchOpen,
    setDetailSearchOpen,
    searchResults,
    setSearchResults,
    searchIndex,
    setSearchIndex,
    detailKeyword,
    setDetailKeyword,
    detailDate,
    setDetailDate,
    detailFileType,
    setDetailFileType,
    detailFileOpen,
    setDetailFileOpen,
    filteredFriends,
    recentFriends,
    orderedMessages,
    groupedMessages,
    detailResults,
    messageRefs,
    messageScrollRef,
    draftInputRef,
    detailFileRef,
    floatingBtnRef,
    contextRef,
    dragState,
    dmComposerShellClass,
    handleSelectFriend,
    handleSend,
    scrollToMessage,
    goToSearchResult,
    handleToggleReaction,
  } = useFloatingDmController();

  return (
    <>
      <FloatingLauncher
        hidden={floatingHidden}
        pos={floatingPos}
        contextOpen={contextOpen}
        contextPos={contextPos}
        floatingBtnRef={floatingBtnRef}
        contextRef={contextRef}
        dragState={dragState}
        onOpen={() => setOpen(true)}
        onSetContextOpen={setContextOpen}
        onSetContextPos={setContextPos}
        onSetPos={setFloatingPos}
        onHide={() => {
          setOpen(false);
          setFloatingHidden(true);
          if (typeof window !== "undefined") {
            localStorage.removeItem(FLOATING_DM_STORAGE_KEYS.floatingPos);
          }
        }}
      />

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setView("list");
          setSearchOpen(false);
          setDetailSearchOpen(false);
        }}
        title="Direct Message"
        widthClass={detailSearchOpen ? "max-w-5xl" : "max-w-3xl"}
        bodyClassName="overflow-hidden"
      >
        <div className="h-[72vh] p-6">
          {view === "list" ? (
            <DmListView
              loading={loadingFriends}
              query={query}
              onChangeQuery={setQuery}
              filteredFriends={filteredFriends}
              recentFriends={recentFriends}
              selectedMemberId={selected?.memberId}
              myUserId={profile?.id}
              unreadByFriend={unreadByFriend}
              recentByFriend={recentByFriend}
              onSelectFriend={handleSelectFriend}
            />
          ) : (
            <div className={`grid h-full gap-4 ${detailSearchOpen ? "md:grid-cols-[1fr_280px]" : ""}`}>
              <div className="flex min-h-0 h-full flex-col rounded-2xl border border-border bg-panel/80">
                <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted hover:text-foreground"
                      onClick={() => setView("list")}
                      aria-label="Back to friends"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <span>
                      {selected?.displayName ?? ""}
                      {selected?.userId === profile?.id ? " (나)" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted hover:text-foreground"
                      onClick={() => setSearchOpen((prev) => !prev)}
                      aria-label="Search messages"
                    >
                      <Search size={14} />
                    </button>
                  </div>
                </div>
                {searchOpen && (
                  <div className="border-b border-border px-4 py-2">
                    <div className="flex items-center gap-2 rounded-full border border-border bg-panel px-4">
                      <input
                        className="h-9 w-full bg-transparent text-xs text-foreground placeholder:text-muted focus:outline-none"
                        placeholder="메시지 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const keyword = searchQuery.trim().toLowerCase();
                            if (!keyword) return;
                            if (searchResults.length > 0) {
                              goToSearchResult("next");
                            }
                          }
                        }}
                      />
                      <div className="flex items-center gap-1 text-[10px] text-muted">
                        <span>
                          {searchResults.length === 0 ? "0" : searchIndex + 1}/{searchResults.length}
                        </span>
                        <button
                          type="button"
                          className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted hover:text-foreground"
                          onClick={() => goToSearchResult("prev")}
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted hover:text-foreground"
                          onClick={() => goToSearchResult("next")}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        className="rounded-full border border-border px-3 py-1 text-[10px] text-muted hover:text-foreground"
                        onClick={() => setDetailSearchOpen((prev) => !prev)}
                      >
                        상세검색하기
                      </button>
                    </div>
                  </div>
                )}
                <div ref={messageScrollRef} className="flex-1 min-h-0 space-y-4 overflow-y-auto px-4 py-3 text-sm">
                  {loadingMessages ? (
                    <div className="rounded-xl border border-border bg-panel/80 p-3 text-xs text-muted">메시지 불러오는 중...</div>
                  ) : orderedMessages.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-panel/80 p-3 text-xs text-muted">
                      아직 메시지가 없습니다.
                    </div>
                  ) : (
                    groupedMessages.map((group) => (
                      <div key={group.dateKey} className="space-y-4">
                        <div className="flex items-center gap-3 py-1">
                          <div className="h-0 flex-1 border-t border-border/80" />
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-200">
                              {getFloatingDmRelativeDateLabel(new Date(group.items[0].createdAt))}
                            </span>
                            <span className="text-[9px] uppercase tracking-[0.2em] text-muted/70">
                              {new Date(group.items[0].createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="h-0 flex-1 border-t border-border/80" />
                        </div>
                        {group.items.map((msg) => {
                          const mine = msg.senderId === profile?.id;
                          return (
                            <div
                              key={msg.id}
                              ref={(el) => {
                                messageRefs.set(msg.id, el);
                              }}
                              className={`group relative flex ${mine ? "justify-end" : "justify-start"} rounded-2xl transition ${
                                searchResults.includes(msg.id)
                                  ? "bg-black/5 dark:bg-white/5"
                                  : "hover:bg-black/5 dark:hover:bg-white/5"
                              }`}
                            >
                              <div className="flex w-full items-start gap-3">
                                <div className="h-10 w-10 overflow-hidden rounded-full bg-muted/20 text-[10px] font-semibold text-foreground">
                                  {mine ? (
                                    profile?.avatarUrl ? (
                                      <img
                                        src={profile.avatarUrl}
                                        alt={profile.displayName ?? "Me"}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center">
                                        {getFloatingDmInitials(profile?.displayName ?? profile?.name ?? "Me")}
                                      </div>
                                    )
                                  ) : selected?.avatarUrl ? (
                                    <img src={selected.avatarUrl} alt={selected.displayName} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                      {getFloatingDmInitials(selected?.displayName)}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
                                      <span>{mine ? profile?.displayName ?? profile?.name ?? "Me" : selected?.displayName ?? "Friend"}</span>
                                      {mine && (
                                        <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-foreground">
                                          나
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-muted">
                                      {getFloatingDmMessageTimeLabel(new Date(msg.createdAt))}
                                    </div>
                                  </div>
                                  {msg.reply && (
                                    <button
                                      type="button"
                                      className="mt-1 flex w-full items-center gap-3 rounded-xl border border-border/70 bg-panel/70 px-3 py-2 text-left text-[12px] text-muted transition hover:border-border hover:text-foreground"
                                      onClick={() => scrollToMessage(msg.reply?.id)}
                                    >
                                      <span className="h-7 w-7 overflow-hidden rounded-full bg-muted/20 text-[10px] font-semibold text-foreground">
                                        {msg.reply.sender?.avatar ? (
                                          <img
                                            src={msg.reply.sender.avatar}
                                            alt={msg.reply.sender.name ?? "User"}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <span className="flex h-full w-full items-center justify-center">
                                            {getFloatingDmInitials(msg.reply.sender?.name ?? "User")}
                                          </span>
                                        )}
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 text-[10px] text-muted">
                                          <span className="font-semibold text-foreground">
                                            {msg.reply.sender?.name ?? "User"}
                                          </span>
                                          <span>Reply</span>
                                        </div>
                                        <div className="truncate text-[11px] text-muted">
                                          {msg.reply.isDeleted ? "(삭제된 메시지)" : msg.reply.content ?? ""}
                                        </div>
                                      </div>
                                      <span className="h-full w-[2px] rounded-full bg-border/80" />
                                    </button>
                                  )}
                                  <div className="mt-1 text-left text-[16px] text-foreground">{msg.content ?? ""}</div>
                                  {msg.reactions && msg.reactions.length > 0 && (
                                    <div className={`mt-2 flex flex-wrap gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                                      {msg.reactions.map((reaction) => (
                                        <button
                                          key={`${msg.id}-${reaction.emoji}`}
                                          type="button"
                                          className={`rounded-full border px-2 py-0.5 text-[11px] ${
                                            reaction.reactedByMe
                                              ? "border-primary/50 bg-primary/10 text-foreground"
                                              : "border-border bg-panel/80 text-muted"
                                          }`}
                                          onClick={() => handleToggleReaction(msg.id, reaction.emoji)}
                                        >
                                          {reaction.emoji} {reaction.count}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                  <div className="absolute right-2 top-1 z-20 flex items-center gap-0.5 rounded-lg border border-border bg-background px-1 py-0.5 opacity-0 shadow-lg transition group-hover:opacity-100">
                                    <div className="relative" data-dm-menu>
                                      <button
                                        type="button"
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-subtle/60"
                                        onClick={() => setEmojiOpenFor((prev) => (prev === msg.id ? null : msg.id))}
                                        aria-label="퀵 이모지"
                                      >
                                        <SmilePlus size={15} />
                                      </button>
                                      {emojiOpenFor === msg.id && (
                                        <div className="absolute bottom-full right-0 mb-1 flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-1 shadow-lg">
                                          {["😁", "😥", "👌", "👋", "🙏", "❤️", "✅"].map((emoji) => (
                                            <button
                                              key={`${msg.id}-${emoji}`}
                                              type="button"
                                              className="inline-flex h-7 w-7 items-center justify-center rounded text-base hover:bg-subtle/60"
                                              onClick={() => {
                                                handleToggleReaction(msg.id, emoji);
                                                setEmojiOpenFor(null);
                                              }}
                                            >
                                              {emoji}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-subtle/60"
                                      onClick={() => setReplyTarget(msg)}
                                      aria-label="답장"
                                    >
                                      <Reply size={14} />
                                    </button>
                                    <div className="relative" data-dm-menu>
                                      <button
                                        type="button"
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-subtle/60"
                                        onClick={() => setMenuOpenFor((prev) => (prev === msg.id ? null : msg.id))}
                                        aria-label="추가 메뉴"
                                      >
                                        <MoreHorizontal size={14} />
                                      </button>
                                      {menuOpenFor === msg.id && (
                                        <div className="absolute right-0 top-full z-30 mt-1 w-36 rounded-lg border border-border bg-panel p-1 shadow-xl">
                                          <button
                                            type="button"
                                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-muted hover:bg-subtle/60 hover:text-foreground"
                                            onClick={() => {
                                              setMenuOpenFor(null);
                                              setEmojiOpenFor(msg.id);
                                            }}
                                          >
                                            <SmilePlus size={13} />
                                            반응 추가
                                          </button>
                                          <button
                                            type="button"
                                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-muted hover:bg-subtle/60 hover:text-foreground"
                                            onClick={() => {
                                              setMenuOpenFor(null);
                                              setReplyTarget(msg);
                                            }}
                                          >
                                            <Reply size={13} />
                                            답장
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
                <div className="flex items-center gap-2 border-t border-border px-4 py-3">
                  <div className="flex-1">
                    {replyTarget && (
                      <div className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-panel/80 px-3 py-2 text-left text-[11px] text-muted">
                        <span className="h-6 w-6 overflow-hidden rounded-full bg-muted/20 text-[10px] font-semibold text-foreground">
                          {replyTarget.sender?.avatar ? (
                            <img
                              src={replyTarget.sender.avatar}
                              alt={replyTarget.sender.name ?? "User"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center">
                              {getFloatingDmInitials(replyTarget.sender?.name ?? "User")}
                            </span>
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-[10px] text-muted">
                            <span className="font-semibold text-foreground">
                              {replyTarget.sender?.name ?? "User"}
                            </span>
                            <span>Replying</span>
                          </div>
                          <div className="truncate text-[11px] text-muted">{replyTarget.content ?? ""}</div>
                        </div>
                        <button
                          type="button"
                          className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted hover:text-foreground"
                          onClick={() => setReplyTarget(null)}
                        >
                          취소
                        </button>
                      </div>
                    )}
                    <div className={dmComposerShellClass}>
                      <button
                        type="button"
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-foreground/90 transition hover:bg-subtle/80 hover:text-foreground"
                      >
                        <Plus size={20} />
                      </button>
                      <EmojiPicker
                        presentation="modal"
                        anchorClass="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/90 hover:bg-subtle/80"
                        triggerContent={<Smile size={22} />}
                        onPick={(emoji) => setDraft((prev) => `${prev}${emoji}`)}
                      />
                      <textarea
                        ref={draftInputRef}
                        rows={1}
                        maxLength={3000}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        className="hide-scrollbar max-h-24 min-h-10 flex-1 resize-none rounded-xl bg-background/70 px-3 py-2.5 text-[15px] leading-snug text-foreground outline-none placeholder:text-muted/75"
                        placeholder={selected ? `@${selected.displayName}에게 메시지 보내기` : "메시지 입력…"}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (e.shiftKey) return;
                            e.preventDefault();
                            void handleSend();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:bg-subtle/70 disabled:text-muted"
                        disabled={!canSend}
                        onClick={handleSend}
                      >
                        <Send size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {detailSearchOpen && (
                <aside className="hidden h-full min-h-0 rounded-2xl border border-border bg-panel/80 p-4 shadow-panel md:flex md:flex-col md:gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-muted">상세검색</p>
                    <h4 className="mt-2 text-sm font-semibold text-foreground">필터</h4>
                  </div>
                  <div className="flex min-h-0 flex-col gap-3 text-xs text-muted">
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-muted">메시지</p>
                      <input
                        className="h-9 w-full rounded-full border border-border bg-panel px-3 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                        placeholder="키워드 검색"
                        value={detailKeyword}
                        onChange={(e) => setDetailKeyword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-muted">날짜</p>
                      <input
                        type="date"
                        className="h-9 w-full rounded-full border border-border bg-panel px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                        value={detailDate}
                        onChange={(e) => setDetailDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-muted">분류</p>
                      <div ref={detailFileRef} className="relative">
                        <button
                          type="button"
                          className="flex h-9 w-full items-center justify-between rounded-full border border-border bg-panel px-3 text-xs text-foreground transition hover:border-primary"
                          onClick={() => setDetailFileOpen((prev) => !prev)}
                        >
                          <span>
                            {FLOATING_DM_FILE_TYPE_OPTIONS.find((option) => option.value === detailFileType)?.label ?? "전체"}
                          </span>
                          <ChevronDown size={12} className={`transition ${detailFileOpen ? "rotate-180" : ""}`} />
                        </button>
                        {detailFileOpen && (
                          <div className="absolute z-20 mt-2 w-full rounded-2xl border border-border bg-panel p-1 shadow-lg">
                            {FLOATING_DM_FILE_TYPE_OPTIONS.map((option) => (
                              <button
                                key={option.value || "all"}
                                type="button"
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs text-foreground transition hover:bg-black/5 dark:hover:bg-white/5 ${
                                  detailFileType === option.value ? "bg-black/10 dark:bg-white/10" : ""
                                }`}
                                onClick={() => {
                                  setDetailFileType(option.value);
                                  setDetailFileOpen(false);
                                }}
                              >
                                <span>{option.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex min-h-0 flex-col gap-2 border-t border-border pt-3">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-muted">검색 결과</p>
                      {detailFileType ? (
                        <div className="rounded-xl border border-border bg-panel/80 p-3 text-[11px] text-muted">
                          파일 검색은 파일 메타 연동 후 제공됩니다.
                        </div>
                      ) : detailResults.length === 0 ? (
                        <div className="rounded-xl border border-border bg-panel/80 p-3 text-[11px] text-muted">
                          검색 결과가 없습니다.
                        </div>
                      ) : (
                        <div className="flex-1 min-h-0 space-y-2 overflow-y-auto">
                          {detailResults.map((msg) => (
                            <button
                              key={`detail-${msg.id}`}
                              type="button"
                              className={`flex w-full items-center gap-3 rounded-xl border border-border bg-panel/80 px-3 py-2 text-left text-[11px] text-muted hover:text-foreground ${
                                searchResults.includes(msg.id) ? "bg-black/5 dark:bg-white/5" : ""
                              }`}
                              onClick={() => {
                                setSearchResults([msg.id]);
                                setSearchIndex(0);
                                scrollToMessage(msg.id);
                              }}
                            >
                              <div className="h-8 w-8 overflow-hidden rounded-full bg-muted/20 text-xs font-semibold text-foreground">
                                {msg.sender?.avatar ? (
                                  <img src={msg.sender.avatar} alt={msg.sender.name ?? "User"} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    {getFloatingDmInitials(msg.sender?.name ?? "User")}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate font-semibold text-foreground">
                                    {msg.sender?.name ?? "User"}
                                  </span>
                                  <span className="text-[10px] text-muted">
                                    {new Date(msg.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="truncate">{msg.content ?? ""}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </aside>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
