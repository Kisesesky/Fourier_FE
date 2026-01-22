// components/members/InviteForm.tsx

import { useState } from "react";
import type { MemberRole } from "@/workspace/members/_model/types";

type Props = {
  onSubmit: (payload: { email: string; name?: string; role?: MemberRole; message?: string }) => void;
  onCancel: () => void;
};

export default function InviteForm({ onSubmit, onCancel }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("member");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    onSubmit({ email, name, role, message });
    setName("");
    setEmail("");
    setRole("member");
    setMessage("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-dashed border-brand/40 bg-brand/5 p-4 text-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-brand">친구 초대</div>
          <p className="text-xs text-muted">이메일로 초대장을 보내고 바로 협업을 시작해요.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-3 py-1.5 text-muted hover:bg-border/20"
          >
            취소
          </button>
          <button
            type="submit"
            className="rounded-md bg-brand px-4 py-1.5 font-semibold text-white shadow-sm transition hover:bg-brand/90"
          >
            초대 보내기
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">이름</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="홍길동"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">이메일 *</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="teammate@company.com"
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
          />
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">역할</label>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as MemberRole)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
          >
            {["owner", "admin", "member", "guest"].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">메시지</label>
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Issues 정리 부탁드려요"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
          />
        </div>
      </div>
    </form>
  );
}
