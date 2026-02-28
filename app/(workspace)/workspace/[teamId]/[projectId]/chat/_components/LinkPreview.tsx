// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/LinkPreview.tsx
'use client';

import React, { useEffect, useState } from "react";
import { Globe, Image as ImageIcon, Play, ExternalLink } from "lucide-react";

/** 간단 OG 캐시 */
const OG_KEY = "fd.chat.ogcache.v4";
type Og = {
  url: string;
  title: string;
  site: string;
  description?: string;
  image?: string;
  favicon?: string;
  ts: number;
  kind?: "default" | "image" | "youtube";
};

function loadCache(): Record<string, Og> {
  try { return JSON.parse(localStorage.getItem(OG_KEY) || "{}"); } catch { return {}; }
}
function saveCache(obj: Record<string, Og>) {
  localStorage.setItem(OG_KEY, JSON.stringify(obj));
}
function domainOf(u: string) {
  try { return new URL(u).hostname.replace(/^www\./,''); } catch { return u; }
}
function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}
function sanitizeCandidateUrl(raw: string): string {
  const normalized = normalizeUrl(raw);
  return normalized.replace(/[),.;!?'"`]+$/g, "");
}
function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
}
function parseYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.replace("/", "").trim();
      return id || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] || null;
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] || null;
    }
    return null;
  } catch {
    return null;
  }
}
function buildFallbackOg(url: string): Og {
  const safeUrl = sanitizeCandidateUrl(url);
  const ytId = parseYouTubeVideoId(safeUrl);
  if (ytId) {
    return {
      url: safeUrl,
      title: "YouTube",
      site: "youtube.com",
      description: undefined,
      image: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
      favicon: "https://www.youtube.com/favicon.ico",
      ts: Date.now(),
      kind: "youtube",
    };
  }
  if (isImageUrl(safeUrl)) {
    const name = (() => {
      try {
        const u = new URL(safeUrl);
        const raw = u.pathname.split("/").pop() || "image";
        return decodeURIComponent(raw);
      } catch {
        return "image";
      }
    })();
    const site = domainOf(safeUrl);
    return {
      url: safeUrl,
      title: name,
      site,
      description: undefined,
      image: safeUrl,
      favicon: `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(safeUrl)}`,
      ts: Date.now(),
      kind: "image",
    };
  }
  try {
    const u = new URL(safeUrl);
    const site = domainOf(safeUrl);
    const title = (u.pathname && u.pathname !== "/") ? decodeURIComponent(u.pathname.replace(/\//g, " ").trim()) : site;
    return {
      url: safeUrl,
      title: title || site,
      site,
      description: `Preview of ${site}`,
      image: undefined,
      favicon: `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(safeUrl)}`,
      ts: Date.now(),
      kind: "default",
    };
  } catch {
    const site = safeUrl || "link";
    return {
      url: safeUrl || url,
      title: site,
      site,
      description: "Preview unavailable",
      image: undefined,
      favicon: `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(safeUrl || url)}`,
      ts: Date.now(),
      kind: "default",
    };
  }
}

/** 실제 네트워크 없이 URL → 간단 OG 카드 */
export default function LinkPreview({ url }: { url: string }) {
  const [og, setOg] = useState<Og | null>(null);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const cache = loadCache();
      if (cache[url]) {
        setOg(cache[url]);
        return;
      }

      const data = buildFallbackOg(url);
      setOg(data);

      // YouTube는 oEmbed로 실제 제목/채널명을 보강
      if (data.kind === "youtube") {
        try {
          const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
          if (!res.ok) throw new Error("oembed failed");
          const meta = await res.json() as { title?: string; author_name?: string; thumbnail_url?: string };
          if (cancelled) return;
          const next: Og = {
            ...data,
            title: meta.title?.trim() || data.title,
            description: meta.author_name?.trim() || undefined,
            image: meta.thumbnail_url || data.image,
            site: "YouTube",
            ts: Date.now(),
          };
          cache[url] = next;
          saveCache(cache);
          setOg(next);
          return;
        } catch {
          // fallback 유지
        }
      }

      if (data.kind === "default") {
        try {
          const res = await fetch(`/api/link-preview?url=${encodeURIComponent(data.url)}`);
          if (res.ok) {
            const meta = (await res.json()) as Partial<Og>;
            if (cancelled) return;
            const next: Og = {
              ...data,
              title: (meta.title || data.title).trim(),
              site: (meta.site || data.site).trim(),
              description: meta.description || data.description,
              image: meta.image || data.image,
              favicon: meta.favicon || data.favicon,
              ts: Date.now(),
            };
            cache[url] = next;
            saveCache(cache);
            setOg(next);
            return;
          }
        } catch {
          // fallback 유지
        }
      }

      cache[url] = data;
      saveCache(cache);
      if (!cancelled) setOg(data);
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!og) return null;

  if (og.kind === "default") {
    return (
      <div className="w-full max-w-none">
        <a
          className="mb-1.5 block w-full truncate whitespace-nowrap text-[13px] font-medium text-sky-500 hover:underline sm:text-[15px]"
          href={og.url}
          target="_blank"
          rel="noreferrer"
          title={og.url}
        >
          {og.url}
        </a>
        <a
          className="group flex w-full items-stretch gap-2.5 overflow-hidden rounded-xl border border-border bg-panel p-2.5 transition hover:bg-subtle/40"
          href={og.url}
          target="_blank"
          rel="noreferrer"
        >
          <span className="min-w-0 flex-1 border-l-2 border-border/90 pl-2.5">
            <span className="flex items-center gap-1.5 text-[11px] text-muted">
              {og.favicon ? (
                <img src={og.favicon} alt="" className="h-3.5 w-3.5 rounded-sm object-cover" />
              ) : (
                <Globe size={12} />
              )}
              <span className="truncate">{og.site}</span>
            </span>
            <span className="mt-1 block line-clamp-2 text-[14px] font-semibold leading-tight text-sky-500 sm:text-[16px]">{og.title}</span>
            {og.description && (
              <span className="mt-1.5 hidden line-clamp-2 text-[13px] leading-snug text-foreground/90 sm:block">{og.description}</span>
            )}
          </span>
          <span className="relative mt-0.5 h-16 w-24 shrink-0 overflow-hidden rounded-md border border-border/70 bg-subtle/40">
            {og.image ? (
              <img src={og.image} alt={og.title} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <ExternalLink size={16} className="text-muted transition group-hover:text-foreground" />
              </span>
            )}
          </span>
        </a>
      </div>
    );
  }

  const showMedia = Boolean(og.image);
  return (
    <a
      className="group block w-full max-w-[340px] overflow-hidden rounded-xl border border-border bg-panel transition hover:bg-subtle/40"
      href={og.url}
      target="_blank"
      rel="noreferrer"
    >
      {showMedia && (
        <div className="relative aspect-[16/9] w-full bg-subtle/30">
          {og.image ? (
            <div className="relative h-full w-full">
              <img src={og.image} alt={og.title} className="h-full w-full object-cover" />
              {og.kind === "youtube" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="rounded-full bg-black/55 p-2.5 text-white">
                    <Play size={18} fill="currentColor" />
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="opacity-60" />
            </div>
          )}
        </div>
      )}
      <div className="p-2.5">
        <div className="flex items-center gap-1 text-xs text-muted">
          {og.favicon ? (
            <img src={og.favicon} alt="" className="h-3.5 w-3.5 rounded-sm object-cover" />
          ) : (
            <Globe size={12} />
          )}
          {og.site}
        </div>
        <div className="mt-1 text-sm font-medium line-clamp-2">{og.title}</div>
        {og.description && <div className="mt-1 text-xs text-muted line-clamp-2">{og.description}</div>}
      </div>
    </a>
  );
}

/** 메시지 텍스트에서 URL 전부 추출 */
export function extractUrls(text?: string): string[] {
  if (!text) return [];
  const r = /((?:https?:\/\/|www\.)[^\s]+)/gi;
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = r.exec(text)) !== null) {
    const candidate = sanitizeCandidateUrl(m[1]);
    if (!candidate) continue;
    try {
      const parsed = new URL(normalizeUrl(candidate));
      out.add(parsed.toString());
    } catch {
      // Ignore malformed URLs.
    }
  }
  return Array.from(out);
}
