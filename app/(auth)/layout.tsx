import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fourier | Auth",
  description: "Access your Fourier workspace.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-10 h-48 w-48 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute -right-28 bottom-10 h-56 w-56 rounded-full bg-secondary/35 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.5)_0,_rgba(255,255,255,0)_42%)] dark:bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.25)_0,_rgba(0,0,0,0)_42%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex items-center justify-between pb-4 sm:pb-6">
          <Link href="/" className="flex items-center gap-3 text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-semibold shadow-sm sm:h-11 sm:w-11">
              F
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-muted">Fourier</p>
              <p className="text-sm font-medium">Workspace OS</p>
            </div>
          </Link>
          <Link
            href="/sign-in"
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-primary hover:text-primary sm:text-sm"
          >
            로그인
          </Link>
        </header>

        <div className="rounded-2xl border border-border bg-panel/90 p-5 shadow-xl shadow-primary/5 backdrop-blur-sm sm:p-7">
          {children}
        </div>
      </div>
    </div>
  );
}
