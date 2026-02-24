// components/landing/LandingShell.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Instagram, Facebook, Linkedin, Youtube, Globe, ChevronDown } from 'lucide-react';
import { LANDING_MODULE_LINKS } from '@/components/landing/landing.constants';

export default function LandingShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f5f3] text-slate-900">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90">
            <Image src="/logo.png" alt="Fourier Logo" width={34} height={34} className="h-8.5 w-8.5 rounded-md object-cover" />
            <span className="text-lg font-semibold">Fourier</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate-700 lg:flex">
            {LANDING_MODULE_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="inline-flex items-center gap-1.5 hover:text-slate-950">
                <item.icon className="h-4 w-4" />
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
              <Link href="/" className="flex items-center gap-2 hover:opacity-90" onClick={() => setMenuOpen(false)}>
                <Image src="/logo.png" alt="Fourier Logo" width={28} height={28} className="h-7 w-7 rounded-md object-cover" />
                <span className="text-sm font-semibold">메뉴</span>
              </Link>
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
                  className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                  onClick={() => setMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl px-6 pb-12 pt-24">{children}</main>

      <footer className="mt-10 w-full border-t border-slate-200 bg-slate-100">
        <div className="mx-auto w-full max-w-7xl px-6 py-12">
          <div className="grid gap-5 md:grid-cols-[1.25fr_1fr]">
            <div className="py-2">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="Fourier Logo" width={36} height={36} className="h-9 w-9 rounded-lg object-cover" />
                <span className="text-2xl font-semibold text-slate-900">Fourier</span>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                팀의 업무 흐름을 하나로 연결해 더 빠르고 선명하게 협업할 수 있도록 돕습니다.
              </p>
              <div className="mt-6 flex items-center gap-3 text-slate-500">
                <Instagram className="h-5 w-5" />
                <X className="h-5 w-5" />
                <Linkedin className="h-5 w-5" />
                <Facebook className="h-5 w-5" />
                <Youtube className="h-5 w-5" />
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
                  <Globe className="h-4 w-4" />
                  한국어
                  <ChevronDown className="h-4 w-4" />
                </button>
                <p className="text-sm text-slate-500">쿠키 설정</p>
              </div>
            </div>

            <div className="py-2">
              <p className="text-sm font-semibold tracking-[0.08em] text-slate-900">회사 소개</p>
              <ul className="mt-4 grid gap-2 text-sm text-slate-700">
                <li>Fourier 소개</li>
                <li>서비스 상태</li>
                <li>이용약관 및 개인정보 보호정책</li>
                <li>개인정보 보호 권한</li>
              </ul>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-500">
            © 2026 Fourier Labs, Inc.
          </div>
        </div>
      </footer>
    </div>
  );
}
