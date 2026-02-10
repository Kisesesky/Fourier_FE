// app/(auth)/sign-up/page.tsx
'use client';

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { AUTH_PATHS, SIGN_UP_INITIAL_STATE } from "@/app/(auth)/_model/auth.constants";
import type { SignUpFormState } from "@/app/(auth)/_model/auth.types";

export default function SignUpPage() {
  const [form, setForm] = useState<SignUpFormState>(SIGN_UP_INITIAL_STATE);

  const handleChange = (key: keyof SignUpFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("agreedTerms", "true");
      formData.append("agreedPrivacy", "true");
      // avatar는 선택사항이므로 비워두거나, 파일 업로드 input 추가 가능
      // formData.append("avatar", avatarFile);

      const res = await fetch("http://localhost:3001/api/v1/auth/sign-up", {
        method: "POST",
        body: formData, // JSON이 아닌 FormData
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "회원가입 실패");
        return;
      }

      alert("회원가입 성공! 로그인 페이지로 이동합니다.");
      window.location.href = AUTH_PATHS.signIn;
    } catch (error) {
      console.error(error);
      alert("서버와 통신 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.35em] text-muted">Sign up</p>
        <h1 className="text-3xl font-semibold leading-tight">계정 만들기</h1>
        <p className="text-sm text-muted">워크스페이스에서 팀과 함께 시작하세요.</p>
      </div>

      <div className="rounded-xl border border-border bg-subtle px-4 py-3 text-sm text-muted">
        회사 이메일을 사용하면 초대된 워크스페이스를 자동으로 탐색할 수 있어요.
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          required
          name="name"
          placeholder="이름 또는 닉네임"
          value={form.name}
          onChange={handleChange("name")}
        />
        <Input
          required
          type="email"
          name="email"
          placeholder="name@company.com"
          autoComplete="email"
          value={form.email}
          onChange={handleChange("email")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            required
            type="password"
            name="password"
            placeholder="비밀번호 (8자 이상)"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange("password")}
          />
          <Input
            required
            type="password"
            name="confirmPassword"
            placeholder="비밀번호 확인"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange("confirmPassword")}
          />
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-border bg-background px-3 py-3 text-sm">
          <input
            required
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border border-border accent-primary"
            aria-label="서비스 이용약관 및 개인정보 처리방침에 동의"
          />
          <span className="text-muted">
            <span className="text-foreground">서비스 이용약관</span>과{" "}
            <span className="text-foreground">개인정보 처리방침</span>에 동의합니다.
          </span>
        </div>
        <Button type="submit" className="w-full">
          회원가입
        </Button>
      </form>

      <div className="flex items-center justify-between border-t border-border pt-4 text-sm text-muted">
        <span>이미 계정이 있나요?</span>
        <Link href={AUTH_PATHS.signIn} className="text-foreground underline decoration-border underline-offset-4 hover:text-primary">
          로그인
        </Link>
      </div>
    </div>
  );
}
