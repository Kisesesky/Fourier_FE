'use client';

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useToast } from "@/components/ui/Toast";
import { signIn } from "@/lib/auth";
import { setAuthToken } from "@/lib/api";
import { useRouter } from "next/navigation";

type FormState = {
  email: string;
  password: string;
};

const initialState: FormState = {
  email: "",
  password: "",
};

export default function LoginPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { show } = useToast();
  const router = useRouter();

  const handleChange = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
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
      router.replace("/");
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

      <div className="rounded-xl border border-border bg-subtle px-4 py-3 text-sm text-muted">
        <span className="font-medium text-foreground">SSO/초대 링크</span>로 받은 경우에도 이메일/비밀번호를 사용할 수 있어요.
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
        <div className="flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <Link href="/find-password" className="text-foreground underline decoration-border underline-offset-4 hover:text-primary">
            비밀번호 찾기
          </Link>
          <Link href="/sign-up" className="text-foreground underline decoration-border underline-offset-4 hover:text-primary">
            회원가입
          </Link>
        </div>
        <Button type="submit" className="w-full">
          {isSubmitting ? "로그인 중..." : "로그인"}
        </Button>
      </form>
    </div>
  );
}
