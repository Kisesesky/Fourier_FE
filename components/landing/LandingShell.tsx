// components/landing/LandingShell.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Instagram, Facebook, Linkedin, Youtube, Globe, ChevronDown, ArrowRight } from 'lucide-react';
import { LANDING_MODULE_LINKS } from '@/components/landing/landing.constants';

export default function LandingShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f5f3] text-slate-900">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Fourier Logo" width={34} height={34} className="h-8.5 w-8.5 rounded-md object-cover" />
            <span className="text-lg font-semibold">Fourier</span>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-slate-700 lg:flex">
            {LANDING_MODULE_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-slate-950">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/sign-in" className="hidden px-2 text-sm text-slate-700 hover:text-slate-950 sm:inline-flex">
              로그인
            </Link>
            <Link href="/sign-in" className="inline-flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500">
              시작하기
            </Link>
            <button
              type="button"
              aria-label="메뉴 열기"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-100 lg:hidden"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]">
          <aside className="ml-auto flex h-full w-full flex-col bg-white p-5 sm:w-[420px]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="Fourier Logo" width={28} height={28} className="h-7 w-7 rounded-md object-cover" />
                <span className="text-sm font-semibold">메뉴</span>
              </div>
              <button
                type="button"
                aria-label="메뉴 닫기"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 hover:bg-slate-100"
                onClick={() => setMenuOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <Link href="/sign-in" className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-slate-100" onClick={() => setMenuOpen(false)}>
                로그인
              </Link>
              <Link href="/sign-up" className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500" onClick={() => setMenuOpen(false)}>
                회원가입
              </Link>
            </div>

            <nav className="mt-6 grid gap-2 border-t border-slate-200 pt-4">
              {LANDING_MODULE_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl px-6 pb-12 pt-24">{children}</main>

      <footer className="mt-10 w-full border-t border-slate-200 bg-slate-100">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-12 text-sm text-slate-700 md:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Fourier Logo" width={36} height={36} className="h-9 w-9 rounded-lg object-cover" />
              <span className="text-2xl font-semibold text-slate-900">Fourier</span>
            </div>
            <div className="mt-6 flex items-center gap-3 text-slate-500">
              <Instagram className="h-5 w-5" />
              <X className="h-5 w-5" />
              <Linkedin className="h-5 w-5" />
              <Facebook className="h-5 w-5" />
              <Youtube className="h-5 w-5" />
            </div>
            <button type="button" className="mt-8 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-base font-semibold text-slate-800">
              <Globe className="h-4 w-4" />
              한국어
              <ChevronDown className="h-4 w-4" />
            </button>
            <p className="mt-7 text-slate-500">쿠키 설정</p>
            <p className="mt-8 text-[30px] font-semibold leading-none text-slate-900">F</p>
            <p className="mt-4 text-slate-500">© 2026 Fourier Labs, Inc.</p>
          </div>

          <div>
            <p className="font-semibold text-slate-900">회사 소개</p>
            <ul className="mt-3 space-y-2.5">
              <li>Fourier 소개</li>
              <li>채용</li>
              <li>보안</li>
              <li>서비스 상태</li>
              <li>이용약관 및 개인정보 보호정책</li>
              <li>개인정보 보호 권한</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-slate-900">다운로드</p>
            <ul className="mt-3 space-y-2.5">
              <li>iOS & Android</li>
              <li>Mac & Windows</li>
              <li>메일</li>
              <li>캘린더</li>
              <li>Web Clipper</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-slate-900">자료</p>
            <ul className="mt-3 space-y-2.5">
              <li>도움말 센터</li>
              <li>요금제</li>
              <li>블로그</li>
              <li>커뮤니티</li>
              <li>API 통합</li>
              <li>템플릿</li>
              <li>파트너 프로그램</li>
            </ul>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <p className="font-semibold text-slate-900">용도별</p>
              <ul className="mt-3 space-y-2.5">
                <li>회사</li>
                <li>팀</li>
                <li>개인</li>
              </ul>
            </div>
            <button type="button" className="inline-flex items-center gap-1 text-lg font-semibold text-slate-900">
              더 살펴보기
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
