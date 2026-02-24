// app/(auth)/find-password/page.tsx
'use client';

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

type FormState = {
  email: string;
};

const initialState: FormState = {
  email: "",
};

export default function FindPasswordPage() {
  const [form, setForm] = useState<FormState>(initialState);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: connect to reset-password API
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.35em] text-muted">Reset</p>
        <h1 className="text-3xl font-semibold leading-tight">비밀번호 찾기</h1>
        <p className="text-sm text-muted">계정에 등록된 이메일로 재설정 안내를 보내드려요.</p>
      </div>

      <div className="rounded-xl border border-border bg-subtle px-4 py-3 text-sm text-muted">
        회사 메일을 사용했다면 스팸함까지 확인해 주세요.
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          required
          type="email"
          name="email"
          placeholder="name@company.com"
          autoComplete="email"
          value={form.email}
          onChange={(event) => setForm({ email: event.target.value })}
        />
        <Button type="submit" className="w-full">
          재설정 링크 보내기
        </Button>
      </form>

      <div className="flex flex-col gap-2 border-t border-border pt-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <Link href="/sign-in" className="text-foreground underline decoration-border underline-offset-4 hover:text-primary">
          로그인으로 돌아가기
        </Link>
        <Link href="/sign-up" className="text-foreground underline decoration-border underline-offset-4 hover:text-primary">
          새 계정 만들기
        </Link>
      </div>
    </div>
  );
}
