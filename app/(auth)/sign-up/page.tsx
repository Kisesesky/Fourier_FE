// app/(auth)/sign-up/page.tsx
'use client';

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, Pencil, User } from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useToast } from "@/components/ui/Toast";
import { AUTH_PATHS, SIGN_UP_INITIAL_STATE } from "@/app/(auth)/_model/constants/auth.constants";
import type { SignUpFormState } from "@/app/(auth)/_model/types/auth.types";
import { sendSignUpVerificationCode, signUp, verifySignUpCode } from "@/lib/auth";
import { useRouter } from "next/navigation";
import TermsModal from "./_components/TermsModal";
import TERMS_CONTENT from "./_model/terms";
import PRIVACY_CONTENT from "./_model/privacy";

export default function SignUpPage() {
  const [form, setForm] = useState<SignUpFormState>(SIGN_UP_INITIAL_STATE);
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { show } = useToast();
  const router = useRouter();

  const handleChange = (key: keyof SignUpFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));

    if (key === "email") {
      setIsCodeSent(false);
      setIsEmailVerified(false);
      setVerifiedEmail("");
      setVerificationCode("");
      setTimeLeft(0);
    }
  };

  const getErrorMessage = (error: unknown, fallback: string) => {
    const message =
      (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
    return Array.isArray(message) ? message.join(" ") : message || fallback;
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
      const data = await sendSignUpVerificationCode({ email: form.email });
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
        description: getErrorMessage(error, "이메일 인증코드를 보내지 못했습니다."),
        variant: "error",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!form.email || !verificationCode) {
      show({
        title: "인증코드를 입력해주세요.",
        variant: "warning",
      });
      return;
    }

    try {
      if (isVerifyingCode) return;
      setIsVerifyingCode(true);
      const data = await verifySignUpCode({ email: form.email, code: verificationCode });
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

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setAvatarFile(file);

    if (!file) {
      setAvatarPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return previewUrl;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isEmailVerified || verifiedEmail !== form.email) {
      show({
        title: "이메일 인증이 필요합니다.",
        description: "인증코드 확인을 완료한 뒤 회원가입을 진행해주세요.",
        variant: "warning",
      });
      return;
    }

    if (form.password !== form.confirmPassword) {
      show({
        title: "비밀번호 확인 필요",
        description: "비밀번호와 확인 비밀번호가 일치하지 않습니다.",
        variant: "error",
      });
      return;
    }

    if (!agreedTerms || !agreedPrivacy) {
      show({
        title: "약관 동의가 필요합니다.",
        description: "서비스 이용약관과 개인정보 처리방침에 모두 동의해주세요.",
        variant: "warning",
      });
      return;
    }

    try {
      if (isSubmitting) return;
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("agreedTerms", String(agreedTerms));
      formData.append("agreedPrivacy", String(agreedPrivacy));
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }
      await signUp(formData);
      show({
        title: "회원가입 성공",
        description: "로그인 페이지로 이동합니다.",
        variant: "success",
      });
      router.replace(AUTH_PATHS.signIn);
    } catch (error) {
      show({
        title: "회원가입 실패",
        description: getErrorMessage(error, "서버와 통신 중 오류가 발생했습니다."),
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">회원가입</h1>
        <p className="text-sm text-slate-500">이메일 인증을 완료한 뒤 계정을 만들 수 있습니다.</p>
      </div>

      <form className="space-y-7" onSubmit={handleSubmit}>
        <section className="flex flex-col items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-slate-100 shadow-sm sm:h-36 sm:w-36"
            aria-label="프로필 이미지 선택"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="프로필 미리보기" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_30%,#eef2ff_0,#dbe2f3_45%,#cbd5e1_100%)] text-slate-500">
                <User className="h-12 w-12 sm:h-14 sm:w-14" />
              </div>
            )}
            <span className="absolute bottom-1.5 right-1.5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-md">
              <Pencil className="h-4 w-4" />
            </span>
          </button>
          <p className="text-center text-sm text-slate-500">프로필 이미지는 선택사항입니다.</p>
        </section>

        <label className="block space-y-3">
          <span className="text-xl font-semibold text-slate-700 sm:text-2xl">이름</span>
          <div className="relative">
            <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              required
              name="name"
              placeholder="이름 입력"
              value={form.name}
              onChange={handleChange("name")}
              className="h-14 rounded-2xl border-slate-300 pl-12 pr-4 text-base font-medium text-slate-800 placeholder:text-slate-400 sm:text-lg"
            />
          </div>
        </label>

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
              disabled={isSendingCode || isEmailVerified}
              className="h-14 min-w-[7.5rem] rounded-none rounded-r-2xl border-0 bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500 disabled:bg-slate-300 sm:min-w-[8.5rem] sm:text-base"
            >
              {isEmailVerified ? "인증완료" : isSendingCode ? "전송 중" : isCodeSent ? "재전송" : "인증 요청"}
            </Button>
          </div>
          {isCodeSent && !isEmailVerified ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">인증코드</span>
                {!isEmailVerified && timeLeft > 0 ? (
                  <span className="text-sm font-semibold text-indigo-600">{formatTimeLeft(timeLeft)}</span>
                ) : null}
              </div>
              <div className="flex gap-3">
                <Input
                  required
                  inputMode="numeric"
                  name="verificationCode"
                  placeholder="인증코드 6자리 입력"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  disabled={isEmailVerified}
                  className="h-12 rounded-2xl border-slate-300 px-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 sm:text-base"
                />
                <Button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={isEmailVerified || isVerifyingCode}
                  className="h-12 min-w-[7.5rem] rounded-2xl border-0 bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500 disabled:bg-slate-300 sm:min-w-[8.5rem] sm:text-base"
                >
                  {isVerifyingCode ? "확인 중" : isEmailVerified ? "인증완료" : "완료"}
                </Button>
              </div>
              <p className={`text-sm ${isEmailVerified ? "text-emerald-600" : timeLeft === 0 ? "text-rose-500" : "text-slate-500"}`}>
                {isEmailVerified
                  ? "이메일 인증이 완료되었습니다."
                  : timeLeft === 0
                    ? "인증코드 시간이 만료되었습니다. 재전송 후 다시 입력해주세요."
                    : "메일로 받은 인증코드를 입력해주세요."}
              </p>
            </div>
          ) : null}
        </label>

        <label className="block space-y-3">
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-slate-700">
            <span className="text-xl font-semibold sm:text-2xl">비밀번호</span>
            <span className="text-sm font-medium text-slate-500">(최소 9자, 영문 대소문자, 숫자, 특수문자 포함)</span>
          </span>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              required
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="비밀번호 입력"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange("password")}
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
          <span className="text-xl font-semibold text-slate-700 sm:text-2xl">비밀번호 확인</span>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              required
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="비밀번호 재입력"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange("confirmPassword")}
              className="h-14 rounded-2xl border-slate-300 pl-12 pr-12 text-base font-medium text-slate-800 placeholder:text-slate-400 sm:text-lg"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              aria-label={showConfirmPassword ? "비밀번호 확인 숨기기" : "비밀번호 확인 표시"}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </label>

        <div className="space-y-4 pt-1">
          <label className="flex items-center gap-3 text-base font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(event) => setAgreedTerms(event.target.checked)}
              className="h-7 w-7 rounded-md border border-slate-300 accent-indigo-600"
            />
            <span>
              <button
                type="button"
                onClick={() => setIsTermsModalOpen(true)}
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                서비스 이용 약관
              </button>{" "}
              동의 (필수)
            </span>
          </label>
          <label className="flex items-center gap-3 text-base font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={agreedPrivacy}
              onChange={(event) => setAgreedPrivacy(event.target.checked)}
              className="h-7 w-7 rounded-md border border-slate-300 accent-indigo-600"
            />
            <span>
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(true)}
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                개인정보 처리 방침
              </button>{" "}
              동의 (필수)
            </span>
          </label>
        </div>

        <Button
          type="submit"
          className="h-14 w-full rounded-2xl border-0 bg-indigo-400 text-base font-semibold text-white shadow-[0_14px_30px_rgba(99,102,241,0.28)] hover:bg-indigo-500 disabled:bg-slate-300 sm:text-lg"
        >
          {isSubmitting ? "가입 처리 중..." : "회원가입"}
        </Button>
      </form>

      <p className="text-center text-base text-slate-500">
        이미 계정이 있으신가요?{" "}
        <Link href={AUTH_PATHS.signIn} className="font-semibold text-indigo-600 hover:text-indigo-500">
          로그인하기
        </Link>
      </p>

      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAgree={() => {
          setAgreedTerms(true);
          setIsTermsModalOpen(false);
        }}
        title="서비스 이용 약관"
        content={TERMS_CONTENT}
      />

      <TermsModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        onAgree={() => {
          setAgreedPrivacy(true);
          setIsPrivacyModalOpen(false);
        }}
        title="개인정보 처리 방침"
        content={PRIVACY_CONTENT}
      />
    </div>
  );
}
