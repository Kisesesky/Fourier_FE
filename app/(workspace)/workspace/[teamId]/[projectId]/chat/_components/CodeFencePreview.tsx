// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/CodeFencePreview.tsx
'use client';

import React from "react";
import { Copy } from "lucide-react";
import { getStoredTheme } from "@/lib/theme";

export type Fence = { lang?: string; code: string };

export function extractFences(text?: string): Fence[] {
  if (!text) return [];
  const re = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;
  const out: Fence[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push({ lang: (m[1] || '').trim() || undefined, code: m[2] || '' });
  }
  return out;
}

export default function CodeFencePreview({ fences }: { fences: Fence[] }) {
  const [mode, setMode] = React.useState<"dark" | "light" | "system">(() =>
    typeof window === "undefined" ? "system" : getStoredTheme(),
  );
  const [systemDark, setSystemDark] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  if (fences.length === 0) return null;
  const isDark = mode === "dark" || (mode === "system" && systemDark);

  const copy = async (s: string) => {
    await navigator.clipboard.writeText(s);
  };

  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const highlight = (code: string, lang?: string, dark = true) => {
    const language = (lang || "").toLowerCase();
    const isJsLike = ["js", "jsx", "ts", "tsx", "javascript", "typescript"].includes(language);
    const base = esc(code);
    if (!isJsLike) return base;
    const c = {
      comment: dark ? "text-slate-500" : "text-slate-400",
      string: dark ? "text-emerald-300" : "text-emerald-700",
      keyword: dark ? "text-sky-300" : "text-blue-700",
      number: dark ? "text-amber-300" : "text-amber-700",
      fn: dark ? "text-violet-300" : "text-purple-700",
      type: dark ? "text-cyan-300" : "text-cyan-700",
    };

    const tokenRe =
      /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(&quot;[\s\S]*?&quot;|&#39;[\s\S]*?&#39;|`[\s\S]*?`)|\b(import|from|export|default|function|return|const|let|var|if|else|for|while|switch|case|break|continue|new|class|extends|implements|interface|type|async|await|try|catch|finally|throw|null|undefined|true|false)\b|\b(\d+(?:\.\d+)?)\b/g;

    return base.replace(tokenRe, (match, comment, stringLit, keyword, number) => {
      if (comment) return `<span class="${c.comment}">${match}</span>`;
      if (stringLit) return `<span class="${c.string}">${match}</span>`;
      if (keyword) return `<span class="${c.keyword}">${match}</span>`;
      if (number) return `<span class="${c.number}">${match}</span>`;
      return match;
    });
  };

  return (
    <div className="mt-2 space-y-2">
      {fences.map((f, i) => (
        <div key={i} className={`overflow-hidden rounded-xl border ${isDark ? "border-slate-700 bg-[#111827]" : "border-slate-300 bg-[#f8fafc]"}`}>
          <div className={`flex items-center justify-between border-b px-2.5 py-1.5 text-xs ${isDark ? "border-slate-700 bg-[#1f2937]" : "border-slate-300 bg-[#e2e8f0]"}`}>
            <span className={`rounded-md px-2 py-0.5 font-semibold ${isDark ? "bg-[#334155] text-slate-200" : "bg-white text-slate-700 border border-slate-300"}`}>{f.lang || 'code'}</span>
            <div className="flex items-center gap-1">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "dark" | "light" | "system")}
                className={`rounded-md border px-2 py-0.5 text-xs outline-none ${
                  isDark
                    ? "border-slate-600 bg-[#0f172a] text-slate-200"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
                aria-label="코드 테마 선택"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
              <button className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 ${isDark ? "border-slate-600 text-slate-200 hover:bg-slate-700/60" : "border-slate-300 text-slate-700 hover:bg-slate-200/70"}`}
                    onClick={()=> copy(f.code)} title="Copy">
                <Copy size={12}/> Copy
              </button>
            </div>
          </div>
          <pre className={`overflow-auto p-3 text-[13px] leading-6 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            <code dangerouslySetInnerHTML={{ __html: highlight(f.code, f.lang, isDark) }} />
          </pre>
        </div>
      ))}
    </div>
  );
}
