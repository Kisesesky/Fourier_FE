// app/(workspace)/workspace/[teamId]/_components/floating-dm/DmListView.tsx
'use client';

import type { FriendProfile } from "@/lib/members";
import { getFloatingDmInitials } from "./floating-dm.utils";

type DmListViewProps = {
  loading: boolean;
  query: string;
  onChangeQuery: (value: string) => void;
  filteredFriends: FriendProfile[];
  recentFriends: Array<{ friend: FriendProfile; meta: { preview: string; at: string } }>;
  selectedMemberId?: string;
  myUserId?: string;
  unreadByFriend: Record<string, number>;
  recentByFriend: Record<string, { preview: string; at: string }>;
  onSelectFriend: (friend: FriendProfile) => void;
};

export default function DmListView({
  loading,
  query,
  onChangeQuery,
  filteredFriends,
  recentFriends,
  selectedMemberId,
  myUserId,
  unreadByFriend,
  recentByFriend,
  onSelectFriend,
}: DmListViewProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Direct Messages</p>
        <h3 className="mt-1 text-lg font-semibold text-foreground">대화</h3>
      </div>
      <div className="flex items-center rounded-full border border-border bg-panel px-4">
        <input
          className="h-10 w-full bg-transparent text-xs text-foreground placeholder:text-muted focus:outline-none"
          placeholder="이름 검색"
          value={query}
          onChange={(e) => onChangeQuery(e.target.value)}
        />
      </div>
      {loading ? (
        <div className="rounded-xl border border-border bg-panel/80 p-3 text-xs text-muted">불러오는 중...</div>
      ) : filteredFriends.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-panel/80 p-3 text-xs text-muted">
          친구가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {recentFriends.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-muted">최근 대화</p>
              <div className="space-y-2">
                {recentFriends.map(({ friend, meta }) => (
                  <button
                    key={`recent-${friend.memberId}`}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-panel/80 px-3 py-2 text-left text-sm transition hover:bg-accent"
                    onClick={() => onSelectFriend(friend)}
                  >
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-muted/20 text-xs font-semibold text-foreground">
                      {friend.avatarUrl ? (
                        <img src={friend.avatarUrl} alt={friend.displayName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          {getFloatingDmInitials(friend.displayName)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium text-foreground">
                          {friend.displayName}
                          {friend.userId === myUserId ? " (나)" : ""}
                        </span>
                        <span className="text-[10px] text-muted">
                          {new Date(meta.at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted">{meta.preview}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-muted">친구 목록</p>
            <div className="space-y-2">
              {filteredFriends.map((friend) => (
                <button
                  key={friend.memberId}
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${
                    selectedMemberId === friend.memberId
                      ? "border-primary/60 bg-accent text-foreground"
                      : "border-border bg-panel/80 text-muted hover:bg-accent"
                  }`}
                  onClick={() => onSelectFriend(friend)}
                >
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-muted/20 text-xs font-semibold text-foreground">
                    {friend.avatarUrl ? (
                      <img src={friend.avatarUrl} alt={friend.displayName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        {getFloatingDmInitials(friend.displayName)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {friend.displayName}
                        {friend.userId === myUserId ? " (나)" : ""}
                      </span>
                      <div className="flex items-center gap-2">
                        {unreadByFriend[friend.userId] ? (
                          <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                            {unreadByFriend[friend.userId]}
                          </span>
                        ) : null}
                        {recentByFriend[friend.userId] && (
                          <span className="text-[10px] text-muted">
                            {new Date(recentByFriend[friend.userId].at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {recentByFriend[friend.userId] && (
                      <p className="truncate text-[11px] text-muted">
                        {recentByFriend[friend.userId].preview}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
