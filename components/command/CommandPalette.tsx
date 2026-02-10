// components/command/CommandPalette.tsx
'use client';

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fuzzyScore, Command } from "@/lib/commands";
import { useToast } from "@/components/ui/Toast";
import { Search } from "lucide-react";
import { searchAll } from "@/lib/search";
import { useChat } from "@/workspace/chat/_model/store";
import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import Highlight from "@/components/command/Highlight";

type Filters = { chat: boolean; issue: boolean; doc: boolean };

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Filters>({ chat: true, issue: true, doc: true });
  const [selIdx, setSelIdx] = useState(0); // 키보드 선택 인덱스

  const router = useRouter();
  const { pathname, buildHref } = useWorkspacePath();
  const currentPath = pathname ?? "";
  const { show } = useToast();

  const commands: Command[] = useMemo(() => {
    const chatHref = buildHref("chat");
    const issuesHref = buildHref("issues");
    const docsHref = buildHref("docs");
    const calendarHref = buildHref("calendar");
    return [
      { id: "goto-chat", label: "Go to Chat", hint: chatHref, keywords: ["채팅", "chat"], run: () => router.push(chatHref) },
      {
        id: "goto-issues",
        label: "Go to Issues (Kanban)",
        hint: issuesHref,
        keywords: ["이슈", "칸반"],
        run: () => router.push(issuesHref),
      },
      { id: "goto-docs", label: "Go to Docs", hint: docsHref, keywords: ["문서", "docs"], run: () => router.push(docsHref) },
      {
        id: "goto-calendar",
        label: "Go to Calendar",
        hint: calendarHref,
        keywords: ["캘린더", "calendar"],
        run: () => router.push(calendarHref),
      },
      {
        id: "new-issue",
        label: "New Issue열",
        hint: "Create issue modal",
        run: () => {
          if (!currentPath.startsWith(issuesHref)) router.push(issuesHref);
          setTimeout(() => window.dispatchEvent(new CustomEvent("open-new-issue-modal")), 200);
          show({ title: "Create Issue", description: "이슈 생성 모달을 여는 중입니다.", variant: "success" });
        },
      },
    ];
  }, [buildHref, currentPath, router, show]);
  const baseResults = useMemo(() => {
    if (!q.trim()) return commands;
    return [...commands]
      .map(c => ({ c, score: Math.max(fuzzyScore(q, c.label), c.hint ? fuzzyScore(q, c.hint) : 0) }))
      .filter(x => x.score > 0)
      .sort((a,b)=>b.score-a.score)
      .map(x=>x.c);
  }, [commands, q]);

  const { results: allResults } = useMemo(() => q.trim() ? searchAll(q) : { results: [] }, [q]);

  const filteredResults = useMemo(() => {
    if (!q.trim()) return [];
    return allResults.filter(r =>
      (r.type === "chat"  && filters.chat) ||
      (r.type === "issue" && filters.issue) ||
      (r.type === "doc"   && filters.doc)
    );
  }, [allResults, filters, q]);

  // 단축키 오픈/클로즈
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(true); }
      if (open && e.key === "Escape") setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // 검색/리스트 변할 때 선택 인덱스 리셋
  const filtersKey = `${filters.chat}-${filters.issue}-${filters.doc}`;
  useEffect(() => {
    setSelIdx(0);
  }, [q, filtersKey]);

  const onRun = (cmd: Command) => {
    setOpen(false); setQ("");
    Promise.resolve(cmd.run()).catch(err => show({ title:"명령 실패", description:String(err), variant:"error" }));
  };

  const goToSearchItem = (item: ReturnType<typeof searchAll>["results"][number]) => {
    if (item.type === "chat") {
      const channelHref = buildHref(["chat", encodeURIComponent(item.channelId)]);
      router.push(channelHref);
      setTimeout(() => { useChat.getState().setChannel(item.channelId); }, 200);
    } else if (item.type === "issue") {
      const issuesHref = buildHref("issues");
      router.push(issuesHref);
      setTimeout(() => { window.dispatchEvent(new CustomEvent("kanban:open-issue", { detail: { id: item.id } })); }, 200);
    } else if (item.type === "doc") {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("fd.docs.active", item.id);
      }
      const docHref = buildHref(["docs", item.id]);
      router.push(docHref);
    }
    setOpen(false); setQ("");
  };

  // 키보드 내비게이션
  const listLength = q.trim() ? filteredResults.length : baseResults.length;
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!listLength) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelIdx((v)=> (v+1) % listLength); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelIdx((v)=> (v-1+listLength) % listLength); }
    if (e.key === "Enter") {
      e.preventDefault();
      if (q.trim()) goToSearchItem(filteredResults[selIdx]);
      else onRun(baseResults[selIdx]);
    }
  };

  const Toggle = ({ k, label }: { k: keyof Filters; label: string }) => (
    <label className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded border border-border bg-subtle/40 cursor-pointer select-none">
      <input type="checkbox" checked={filters[k]} onChange={(e)=> setFilters(prev => ({ ...prev, [k]: e.target.checked }))}/>
      {label}
    </label>
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-24 -translate-x-1/2 w-[760px] rounded-xl border border-border bg-panel shadow-panel p-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5" size={16}/>
            <input
              autoFocus value={q} onChange={(e)=> setQ(e.target.value)}
              placeholder="명령 또는 검색어… (↑/↓로 이동, Enter 실행)"
              className="w-full bg-subtle/60 border border-border rounded-md pl-9 pr-3 py-2 text-sm outline-none"
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* 필터 토글 */}
          <div className="mt-2 flex items-center gap-2 px-2">
            <div className="text-xs text-muted">Filters:</div>
            <Toggle k="chat" label="Chat" />
            <Toggle k="issue" label="Issue" />
            <Toggle k="doc" label="Doc" />
          </div>

          <div className="mt-2 max-h-80 overflow-y-auto text-sm">
            {!q.trim() ? (
              <div className="space-y-1 p-1">
                {baseResults.map((cmd, i) => (
                  <button
                    key={cmd.id}
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-subtle/60 ${i===selIdx?'bg-subtle/60':''}`}
                    onMouseEnter={()=> setSelIdx(i)}
                    onClick={()=> onRun(cmd)}
                    data-selected={i===selIdx}
                  >
                    <div className="font-medium"><Highlight text={cmd.label} query={q} /></div>
                    {cmd.hint && <div className="text-xs text-muted"><Highlight text={cmd.hint} query={q} /></div>}
                  </button>
                ))}
              </div>
            ) : (
              <>
                {filteredResults.length > 0 && (
                  <div className="p-2">
                    <div className="text-xs text-muted mb-1">Search Results</div>
                    <div className="space-y-1">
                      {filteredResults.map((r, i) => (
                        <button
                          key={`${r.type}-${r.id}-${i}`}
                          className={`w-full text-left px-3 py-2 rounded-md hover:bg-subtle/60 ${i===selIdx?'bg-subtle/60':''}`}
                          onMouseEnter={()=> setSelIdx(i)}
                          onClick={()=> goToSearchItem(r)}
                          data-selected={i===selIdx}
                        >
                          {r.type === "chat"  && (<div><span className="font-medium">[Chat]</span> <Highlight text={r.text.slice(0, 80)} query={q} /> <span className="text-muted">#{r.channelId}</span></div>)}
                          {r.type === "issue" && (<div><span className="font-medium">[Issue]</span> <Highlight text={r.title} query={q} /> <span className="text-muted">({r.status})</span></div>)}
                          {r.type === "doc"   && (<div><span className="font-medium">[Doc]</span> <Highlight text={r.title} query={q} /> — <span className="text-muted"><Highlight text={r.snippet.slice(0, 80)} query={q} /></span></div>)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="p-2">
                  <div className="text-xs text-muted mb-1">Commands</div>
                  <div className="space-y-1">
                    {baseResults.map((cmd, i) => (
                      <button
                        key={cmd.id}
                        className={`w-full text-left px-3 py-2 rounded-md hover:bg-subtle/60 ${i===selIdx?'bg-subtle/60':''}`}
                        onMouseEnter={()=> setSelIdx(i)}
                        onClick={()=> onRun(cmd)}
                        data-selected={i===selIdx}
                      >
                        <div className="font-medium"><Highlight text={cmd.label} query={q} /></div>
                        {cmd.hint && <div className="text-xs text-muted"><Highlight text={cmd.hint} query={q} /></div>}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
