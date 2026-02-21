// components/landing/LandingMainContent.tsx
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function LandingMainContent() {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <article className="rounded-3xl bg-white p-6 lg:col-span-12">
        <div className="grid items-stretch gap-4 lg:grid-cols-12">
          <div className="flex flex-col justify-between lg:col-span-4">
            <div>
              <p className="text-sm font-medium text-slate-500">통합 협업 대시보드</p>
              <h1 className="mt-2 text-4xl font-semibold leading-tight">
                팀의 흐름을
                <br />
                하나로 연결하세요.
              </h1>
              <p className="mt-3 text-base text-slate-600">
                메시지, 일정, 문서, 이슈를 모듈 단위로 연결해 프로젝트 운영을 단순화합니다.
              </p>
            </div>
            <Link href="/sign-in" className="mt-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black text-white">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="min-h-[260px] rounded-2xl bg-gradient-to-br from-slate-300 via-slate-200 to-slate-100 lg:col-span-8">
            <Image
              src="/error/homedashboard.png"
              alt="홈 대시보드 화면"
              width={2000}
              height={1200}
              className="h-full w-full rounded-2xl object-cover object-top"
              priority
            />
          </div>
        </div>
      </article>

      <article className="rounded-3xl bg-white p-6 lg:col-span-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">실시간 채팅 협업</p>
            <h2 className="mt-1 text-4xl font-semibold leading-tight">채널, DM, 스레드를 한 화면에서.</h2>
          </div>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black text-white">
            <ArrowRight className="h-5 w-5" />
          </span>
        </div>
        <div className="mt-4 min-h-[260px] rounded-2xl bg-[linear-gradient(180deg,#ff7f73,#ff6b5f)] p-4">
          <div className="overflow-hidden rounded-xl bg-white/90">
            <Image
              src="/error/chat.png"
              alt="채팅 모듈 화면"
              width={2000}
              height={1200}
              className="h-full w-full object-cover object-top"
            />
          </div>
        </div>
      </article>

      <article className="rounded-3xl bg-white p-6 lg:col-span-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">이슈 트래킹</p>
            <h2 className="mt-1 text-4xl font-semibold leading-tight">테이블부터 칸반까지 유연하게.</h2>
          </div>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black text-white">
            <ArrowRight className="h-5 w-5" />
          </span>
        </div>
        <div className="mt-4 min-h-[260px] rounded-2xl bg-[linear-gradient(180deg,#59a7ee,#418ed8)] p-4">
          <div className="overflow-hidden rounded-xl bg-white/90">
            <Image
              src="/error/issuedashboard.png"
              alt="이슈 모듈 화면"
              width={2000}
              height={1200}
              className="h-full w-full object-cover object-top"
            />
          </div>
        </div>
      </article>

      <article className="rounded-3xl bg-white p-6 lg:col-span-12">
        <div className="grid items-stretch gap-4 lg:grid-cols-12">
          <div className="flex flex-col justify-between lg:col-span-4">
            <div>
              <p className="text-sm text-slate-500">일정 · 문서 · 파일 연결</p>
              <h2 className="mt-1 text-4xl font-semibold leading-tight">프로젝트 운영에 필요한 모듈을 한곳에서.</h2>
            </div>
            <Link href="/sign-in" className="mt-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black text-white">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="min-h-[260px] rounded-2xl bg-[linear-gradient(180deg,#f4eacb,#e8ddb8)] lg:col-span-8">
            <div className="grid h-full grid-cols-1 gap-2 p-2 md:grid-cols-3">
              <div className="overflow-hidden rounded-xl bg-white/80">
                <Image
                  src="/error/calendar.png"
                  alt="캘린더 모듈 화면"
                  width={1200}
                  height={800}
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div className="overflow-hidden rounded-xl bg-white/80">
                <Image
                  src="/error/docs.png"
                  alt="문서 모듈 화면"
                  width={1200}
                  height={800}
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div className="overflow-hidden rounded-xl bg-white/80">
                <Image
                  src="/error/file.png"
                  alt="파일함 모듈 화면"
                  width={1200}
                  height={800}
                  className="h-full w-full object-cover object-top"
                />
              </div>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
