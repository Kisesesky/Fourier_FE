// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/LinkPreview.tsx
'use client';

import React, { useEffect, useState } from "react";
import { Globe, Image as ImageIcon, Play } from "lucide-react";

/** 간단 OG 캐시 */
const OG_KEY = "fd.chat.ogcache.v3";
type Og = {
  url: string;
  title: string;
  site: string;
  description?: string;
  image?: string;
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
  const ytId = parseYouTubeVideoId(url);
  if (ytId) {
    return {
      url,
      title: "YouTube",
      site: "youtube.com",
      description: undefined,
      image: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
      ts: Date.now(),
      kind: "youtube",
    };
  }
  if (isImageUrl(url)) {
    const name = (() => {
      try {
        const u = new URL(url);
        const raw = u.pathname.split("/").pop() || "image";
        return decodeURIComponent(raw);
      } catch {
        return "image";
      }
    })();
    const site = domainOf(url);
    return {
      url,
      title: name,
      site,
      description: undefined,
      image: url,
      ts: Date.now(),
      kind: "image",
    };
  }
  const u = new URL(url);
  const site = domainOf(url);
  const title = (u.pathname && u.pathname !== "/") ? decodeURIComponent(u.pathname.replace(/\//g, " ").trim()) : site;
  return { url, title: title || site, site, description: `Preview of ${site}`, image: undefined, ts: Date.now(), kind: "default" };
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

  return (
    <a
      className="group block w-full max-w-[420px] overflow-hidden rounded-xl border border-border bg-panel transition hover:bg-subtle/40"
      href={og.url}
      target="_blank"
      rel="noreferrer"
    >
      <div className="relative aspect-[4/3] w-full bg-subtle/30">
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
      <div className="p-3">
        <div className="flex items-center gap-1 text-xs text-muted">
          <Globe size={12} /> {og.site}
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
  const r = /(https?:\/\/[^\s]+)/gi;
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = r.exec(text)) !== null) out.add(m[1]);
  return Array.from(out);
}
