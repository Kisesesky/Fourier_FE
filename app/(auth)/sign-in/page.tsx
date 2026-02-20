// app/(auth)/sign-in/page.tsx
'use client';

import { useState } from "react";
import Link from "next/link";
import { Github } from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useToast } from "@/components/ui/Toast";
import { signIn } from "@/lib/auth";
import { setAuthToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import { AUTH_PATHS, SIGN_IN_INITIAL_STATE } from "@/app/(auth)/_model/auth.constants";
import type { SignInFormState } from "@/app/(auth)/_model/auth.types";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.9 2.9l3 2.3c1.8-1.6 2.8-4 2.8-6.8 0-.7-.1-1.5-.2-2.2H12z" />
      <path fill="#34A853" d="M12 21c2.6 0 4.7-.9 6.3-2.3l-3-2.3c-.8.6-2 .9-3.3.9-2.5 0-4.6-1.7-5.3-4H3.6v2.4C5.2 18.9 8.3 21 12 21z" />
      <path fill="#FBBC05" d="M6.7 13.3c-.2-.6-.3-1.1-.3-1.8s.1-1.2.3-1.8V7.3H3.6C3 8.5 2.6 9.9 2.6 11.5S3 14.5 3.6 15.7l3.1-2.4z" />
      <path fill="#4285F4" d="M12 5.8c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.7 2.8 14.6 2 12 2 8.3 2 5.2 4.1 3.6 7.3l3.1 2.4c.7-2.3 2.8-3.9 5.3-3.9z" />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="currentColor" d="M7 5h3.2l3.6 5.3V5H17v14h-3.2l-3.6-5.2V19H7z" />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="currentColor" d="M12 4c-4.7 0-8.5 2.9-8.5 6.5 0 2.3 1.5 4.3 3.8 5.4l-.8 3.1c-.1.4.3.7.7.5l3.7-2.4c.4.1.8.1 1.1.1 4.7 0 8.5-2.9 8.5-6.5S16.7 4 12 4z" />
    </svg>
  );
}

export default function LoginPage() {
  const [form, setForm] = useState<SignInFormState>(SIGN_IN_INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { show } = useToast();
  const router = useRouter();

  const handleChange = (key: keyof SignInFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (isSubmitting) return;
      setIsSubmitting(true);
      const data = await signIn({
        email: form.email,
        password: form.password,
      });
      if (data?.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        setAuthToken(data.accessToken);
      }
      sessionStorage.setItem("auth:justSignedIn", "1");
      router.replace(AUTH_PATHS.home);
    } catch (error) {
      console.error(error);
      const message =
        (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const description = Array.isArray(message) ? message.join(" ") : message;
      show({
        title: "로그인 실패",
        description: description || "이메일 또는 비밀번호를 확인해주세요.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.35em] text-muted">Log in</p>
        <h1 className="text-3xl font-semibold leading-tight">다시 돌아오셨군요</h1>
        <p className="text-sm text-muted">이메일과 비밀번호로 로그인하세요.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          required
          type="email"
          name="email"
          placeholder="name@company.com"
          autoComplete="email"
          value={form.email}
          onChange={handleChange("email")}
        />
        <Input
          required
          type="password"
          name="password"
          placeholder="비밀번호"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange("password")}
        />
        <Button type="submit" className="w-full">
          {isSubmitting ? "로그인 중..." : "로그인"}
        </Button>
        <div className="flex items-center justify-center gap-3 text-sm text-muted">
          <Link href={AUTH_PATHS.findPassword} className="text-foreground underline decoration-border underline-offset-4 hover:text-primary">
            비밀번호 찾기
          </Link>
          <span className="text-border">|</span>
          <Link href={AUTH_PATHS.signUp} className="text-foreground underline decoration-border underline-offset-4 hover:text-primary">
            회원가입
          </Link>
        </div>

        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted">또는</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            aria-label="구글로 로그인"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-subtle/60"
          >
            <GoogleIcon />
          </button>
          <button
            type="button"
            aria-label="네이버로 로그인"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-[#03C75A] text-white hover:opacity-90"
          >
            <NaverIcon />
          </button>
          <button
            type="button"
            aria-label="카카오로 로그인"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#FEE500] bg-[#FEE500] text-[#191919] hover:opacity-90"
          >
            <KakaoIcon />
          </button>
          <button
            type="button"
            aria-label="깃허브로 로그인"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-[#181717] text-white hover:opacity-90"
          >
            <Github className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
