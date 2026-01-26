import { useMemo, useState } from "react";
import type { MemberRole } from "@/workspace/members/_model/types";

type Props = {
  members: Array<{ id: string; name: string; email?: string | null }>;
  onSubmit: (payload: { userId: string; role: MemberRole }) => void;
  onCancel: () => void;
};

const projectRoles: MemberRole[] = ["manager", "member", "guest"];
const roleLabel: Record<MemberRole, string> = {
  owner: "Owner",
  manager: "Admin",
  member: "Editor",
  guest: "Viewer",
};

export default function InviteForm({ members, onSubmit, onCancel }: Props) {
  const [selectedId, setSelectedId] = useState("");
  const [role, setRole] = useState<MemberRole>("member");
  const options = useMemo(() => members, [members]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId) return;
    onSubmit({ userId: selectedId, role });
    setSelectedId("");
    setRole("member");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-dashed border-brand/40 bg-brand/5 p-4 text-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-brand">프로젝트 멤버 추가</div>
          <p className="text-xs text-muted">팀 멤버 중에서 프로젝트 멤버를 선택하세요.</p>
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
            disabled={!selectedId}
            className="rounded-md bg-brand px-4 py-1.5 font-semibold text-white shadow-sm transition hover:bg-brand/90 disabled:opacity-50"
          >
            추가하기
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">팀 멤버</label>
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
          >
            <option value="">멤버 선택</option>
            {options.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} {member.email ? `(${member.email})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">역할</label>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as MemberRole)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
          >
            {projectRoles.map((item) => (
              <option key={item} value={item}>
                {roleLabel[item] ?? "Editor"}
              </option>
            ))}
          </select>
        </div>
      </div>
    </form>
  );
}
