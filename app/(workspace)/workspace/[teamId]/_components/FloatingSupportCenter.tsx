'use client';

import { useEffect, useRef, useState } from "react";
import { Headset, Send, X } from "lucide-react";
import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import { createSupportInquiry } from "@/lib/support";

type SupportMessage = {
  id: string;
  role: "agent" | "user";
  text: string;
  at: string;
};

const INITIAL_MESSAGES: SupportMessage[] = [
  {
    id: "welcome-1",
    role: "agent",
    text: "안녕하세요. Fourier 고객센터입니다. 무엇을 도와드릴까요?",
    at: new Date().toISOString(),
  },
];

const AUTO_REPLIES = [
  "요청 내용을 확인했어요. 조금 더 자세히 알려주시면 바로 도와드릴게요.",
  "관련 담당자에게 전달했어요. 빠르게 확인 후 안내드릴게요.",
  "접수되었습니다. 진행 상황은 이 채팅에서 계속 안내드릴게요.",
];

export default function FloatingSupportCenter() {
  const { workspace } = useWorkspacePath();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<SupportMessage[]>(INITIAL_MESSAGES);
  const [submitting, setSubmitting] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const canSend = draft.trim().length > 0 && !submitting;
  const replyIndexRef = useRef(0);
  const safeDecode = (value: string) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  useEffect(() => {
    const openHandler = () => setOpen(true);
    const toggleHandler = () => setOpen((prev) => !prev);
    const closeHandler = () => setOpen(false);

    window.addEventListener("support:open", openHandler as EventListener);
    window.addEventListener("support:toggle", toggleHandler as EventListener);
    window.addEventListener("support:close", closeHandler as EventListener);

    return () => {
      window.removeEventListener("support:open", openHandler as EventListener);
      window.removeEventListener("support:toggle", toggleHandler as EventListener);
      window.removeEventListener("support:close", closeHandler as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  const sendMessage = async () => {
    const nextText = draft.trim();
    if (!nextText) return;
    if (!workspace?.teamId || !workspace?.projectId) {
      setMessages((prev) => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          role: "agent",
          text: "현재 워크스페이스 문맥을 찾지 못해 문의를 저장할 수 없어요.",
          at: new Date().toISOString(),
        },
      ]);
      return;
    }

    const userMessage: SupportMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: nextText,
      at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setOpen(true);
    setSubmitting(true);

    try {
      await createSupportInquiry({
        teamId: safeDecode(workspace.teamId),
        projectId: safeDecode(workspace.projectId),
        message: nextText,
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `agent-error-${Date.now()}`,
          role: "agent",
          text: "문의 저장 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
          at: new Date().toISOString(),
        },
      ]);
      setSubmitting(false);
      return;
    }

    const replyText = AUTO_REPLIES[replyIndexRef.current % AUTO_REPLIES.length];
    replyIndexRef.current += 1;

    window.setTimeout(() => {
      const agentMessage: SupportMessage = {
        id: `agent-${Date.now()}`,
        role: "agent",
        text: replyText,
        at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, agentMessage]);
      setSubmitting(false);
    }, 450);
  };

  return (
    <>
      {open && (
        <section className="fixed bottom-24 right-6 z-[78] flex h-[420px] w-[min(92vw,360px)] flex-col overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600">
                <Headset size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">고객센터</p>
                <p className="text-[11px] text-muted">평일 09:00 - 18:00</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-accent hover:text-foreground"
              aria-label="고객센터 닫기"
            >
              <X size={15} />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <p
                  className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "bg-accent text-foreground"
                  }`}
                >
                  {message.text}
                </p>
              </div>
            ))}
          </div>

          <footer className="border-t border-border px-3 py-3">
            <div className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="문의 내용을 입력하세요"
                className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none ring-0 placeholder:text-muted focus:border-sidebar-primary"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!canSend}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground disabled:opacity-40"
                aria-label="문의 전송"
              >
                <Send size={15} />
              </button>
            </div>
          </footer>
        </section>
      )}

    </>
  );
}
