// app/(auth)/profile/page.tsx
'use client';

import { useState } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

type FormState = {
  name: string;
  title: string;
  email: string;
};

const initialState: FormState = {
  name: "홍길동",
  title: "Product Manager",
  email: "name@company.com",
};

export default function ProfilePage() {
  const [form, setForm] = useState<FormState>(initialState);

  const handleChange = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: connect to profile update API
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.35em] text-muted">Profile</p>
        <h1 className="text-3xl font-semibold leading-tight">내 프로필</h1>
        <p className="text-sm text-muted">이름, 직함, 연락처 정보를 업데이트하세요.</p>
      </div>

      <div className="rounded-xl border border-border bg-subtle px-4 py-3 text-sm text-muted">
        프로필 정보는 워크스페이스 멤버들에게 표시돼요. 최신 상태로 유지해 주세요.
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground">이름</span>
          <Input name="name" value={form.name} onChange={handleChange("name")} />
        </div>
        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground">직함</span>
          <Input name="title" value={form.title} onChange={handleChange("title")} />
        </div>
        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground">이메일</span>
          <Input name="email" type="email" value={form.email} onChange={handleChange("email")} />
        </div>
        <Button type="submit" className="w-full">
          저장
        </Button>
      </form>
    </div>
  );
}
