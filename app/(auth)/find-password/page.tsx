'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useToast } from "@/components/ui/Toast";
import { resetPassword, sendPasswordResetVerificationCode, verifyPasswordResetCode } from "@/lib/auth";
import { AUTH_PATHS } from "@/app/(auth)/_model/constants/auth.constants";
import { useRouter } from "next/navigation";

type FormState = {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
};

const initialState: FormState = {
  email: "",
  code: "",
  newPassword: "",
  confirmPassword: "",
};

export default function FindPasswordPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const { show } = useToast();
  const router = useRouter();

  const getErrorMessage = (error: unknown, fallback: string) => {
    const message =
      (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
    return Array.isArray(message) ? message.join(" ") : message || fallback;
  };

  const handleChange = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));

    if (key === "email") {
      setIsCodeSent(false);
      setIsEmailVerified(false);
      setVerifiedEmail("");
      setTimeLeft(0);
      setForm((prev) => ({ ...prev, code: "", newPassword: "", confirmPassword: "" }));
    }
  };

  const handleSendCode = async () => {
    if (!form.email) {
      show({
        title: "이메일을 입력해주세요.",
        variant: "warning",
      });
      return;
    }

    try {
      if (isSendingCode) return;
      setIsSendingCode(true);
      const data = await sendPasswordResetVerificationCode({ email: form.email });
      setIsCodeSent(true);
      setIsEmailVerified(false);
      setVerifiedEmail("");
      setTimeLeft(300);
      show({
        title: "인증코드 전송 완료",
        description: data.message,
        variant: "success",
      });
    } catch (error) {
      show({
        title: "인증코드 전송 실패",
        description: getErrorMessage(error, "비밀번호 재설정 인증코드를 보내지 못했습니다."),
        variant: "error",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!form.email || !form.code) {
      show({
        title: "인증코드를 입력해주세요.",
        variant: "warning",
      });
      return;
    }

    try {
      if (isVerifyingCode) return;
      setIsVerifyingCode(true);
      const data = await verifyPasswordResetCode({ email: form.email, code: form.code });
      setIsEmailVerified(true);
      setVerifiedEmail(form.email);
      setTimeLeft(0);
      show({
        title: "이메일 인증 완료",
        description: data.message,
        variant: "success",
      });
    } catch (error) {
      setIsEmailVerified(false);
      setVerifiedEmail("");
      setTimeLeft(0);
      show({
        title: "인증 실패",
        description: getErrorMessage(error, "인증코드를 다시 확인해주세요."),
        variant: "error",
      });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  useEffect(() => {
    if (!isCodeSent || isEmailVerified || timeLeft <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isCodeSent, isEmailVerified, timeLeft]);

  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainSeconds = seconds % 60;
    return `${minutes}:${String(remainSeconds).padStart(2, "0")}`;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isEmailVerified || verifiedEmail !== form.email) {
      show({
        title: "이메일 인증이 필요합니다.",
        description: "인증코드 확인 후 새 비밀번호를 설정해주세요.",
        variant: "warning",
      });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      show({
        title: "비밀번호 확인 필요",
        description: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.",
        variant: "error",
      });
      return;
    }

    try {
      if (isSubmitting) return;
      setIsSubmitting(true);
      const data = await resetPassword({
        email: form.email,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      show({
        title: "비밀번호 재설정 완료",
        description: data.message,
        variant: "success",
      });
      router.replace(AUTH_PATHS.signIn);
    } catch (error) {
      show({
        title: "비밀번호 재설정 실패",
        description: getErrorMessage(error, "비밀번호를 재설정하지 못했습니다."),
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">비밀번호 찾기</h1>
        <p className="text-sm text-slate-500">
          이메일 인증을 완료한 뒤 새 비밀번호를 설정할 수 있습니다.
        </p>
      </div>

      <form className="space-y-7" onSubmit={handleSubmit}>
        {!isEmailVerified ? (
          <section className="space-y-7">
            <label className="block space-y-3">
              <span className="text-xl font-semibold text-slate-700 sm:text-2xl">이메일</span>
              <div className="flex overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    required
                    type="email"
                    name="email"
                    placeholder="name@company.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    className="h-14 rounded-none border-0 pl-12 pr-4 text-base font-medium text-slate-800 placeholder:text-slate-400 focus:ring-0 sm:text-lg"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSendingCode}
                  className="h-14 min-w-[7.5rem] rounded-none rounded-r-2xl border-0 bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500 disabled:bg-slate-300 sm:min-w-[8.5rem] sm:text-base"
                >
                  {isSendingCode ? "전송 중" : isCodeSent ? "재전송" : "인증 요청"}
                </Button>
              </div>

              {isCodeSent ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">인증코드</span>
                    {timeLeft > 0 ? (
                      <span className="text-sm font-semibold text-indigo-600">{formatTimeLeft(timeLeft)}</span>
                    ) : null}
                  </div>
                  <div className="flex gap-3">
                    <Input
                      required
                      inputMode="numeric"
                      name="code"
                      placeholder="인증코드 6자리 입력"
                      value={form.code}
                      onChange={handleChange("code")}
                      className="h-12 rounded-2xl border-slate-300 px-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 sm:text-base"
                    />
                    <Button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={isVerifyingCode}
                      className="h-12 min-w-[7.5rem] rounded-2xl border-0 bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500 disabled:bg-slate-300 sm:min-w-[8.5rem] sm:text-base"
                    >
                      {isVerifyingCode ? "확인 중" : "완료"}
                    </Button>
                  </div>
                  <p className={`text-sm ${timeLeft === 0 ? "text-rose-500" : "text-slate-500"}`}>
                    {timeLeft === 0
                      ? "인증코드 시간이 만료되었습니다. 재전송 후 다시 입력해주세요."
                      : "메일로 받은 인증코드를 입력하면 다음 단계로 넘어갑니다."}
                  </p>
                </div>
              ) : null}
            </label>
          </section>
        ) : (
          <section className="space-y-7">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <p className="font-semibold">이메일 인증이 완료되었습니다.</p>
              <p className="mt-1">{verifiedEmail} 계정의 새 비밀번호를 설정해주세요.</p>
            </div>

            <label className="block space-y-3">
              <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-slate-700">
                <span className="text-xl font-semibold sm:text-2xl">새 비밀번호</span>
                <span className="text-sm font-medium text-slate-500">(최소 9자, 영문 대소문자, 숫자, 특수문자 포함)</span>
              </span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  required
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  placeholder="새 비밀번호 입력"
                  autoComplete="new-password"
                  value={form.newPassword}
                  onChange={handleChange("newPassword")}
                  className="h-14 rounded-2xl border-slate-300 pl-12 pr-12 text-base font-medium text-slate-800 placeholder:text-slate-400 sm:text-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>

            <label className="block space-y-3">
              <span className="text-xl font-semibold text-slate-700 sm:text-2xl">새 비밀번호 확인</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="새 비밀번호 재입력"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  className="h-14 rounded-2xl border-slate-300 pl-12 pr-12 text-base font-medium text-slate-800 placeholder:text-slate-400 sm:text-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-label={showConfirmPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>

            <Button
              type="submit"
              className="h-14 w-full rounded-2xl border-0 bg-indigo-400 text-base font-semibold text-white shadow-[0_14px_30px_rgba(99,102,241,0.28)] hover:bg-indigo-500 disabled:bg-slate-300 sm:text-lg"
            >
              {isSubmitting ? "재설정 중..." : "비밀번호 재설정"}
            </Button>
          </section>
        )}
      </form>

      <p className="text-center text-base text-slate-500">
        <Link href={AUTH_PATHS.signIn} className="font-semibold text-indigo-600 hover:text-indigo-500">
          로그인
        </Link>
        {" · "}
        <Link href={AUTH_PATHS.signUp} className="font-semibold text-indigo-600 hover:text-indigo-500">
          새 계정 만들기
        </Link>
      </p>
    </div>
  );
}
