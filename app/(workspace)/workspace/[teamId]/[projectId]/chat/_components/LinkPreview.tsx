// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/LinkPreview.tsx
'use client';

import React, { useEffect, useState } from "react";
import { Globe, Image as ImageIcon } from "lucide-react";

/** 간단 OG 캐시 */
const OG_KEY = "fd.chat.ogcache";
type Og = { url: string; title: string; site: string; description?: string; image?: string; ts: number };

function loadCache(): Record<string, Og> {
  try { return JSON.parse(localStorage.getItem(OG_KEY) || "{}"); } catch { return {}; }
}
function saveCache(obj: Record<string, Og>) {
  localStorage.setItem(OG_KEY, JSON.stringify(obj));
}
function domainOf(u: string) {
  try { return new URL(u).hostname.replace(/^www\./,''); } catch { return u; }
}
function buildFallbackOg(url: string): Og {
  const u = new URL(url);
  const site = domainOf(url);
  const title = (u.pathname && u.pathname !== "/") ? decodeURIComponent(u.pathname.replace(/\//g, " ").trim()) : site;
  return { url, title: title || site, site, description: `Preview of ${site}`, image: undefined, ts: Date.now() };
}

/** 실제 네트워크 없이 URL → 간단 OG 카드 */
export default function LinkPreview({ url }: { url: string }) {
  const [og, setOg] = useState<Og | null>(null);

  useEffect(() => {
    const cache = loadCache();
    if (cache[url]) { setOg(cache[url]); return; }
    const data = buildFallbackOg(url);
    cache[url] = data; saveCache(cache);
    setOg(data);
  }, [url]);

  if (!og) return null;

  return (
    <a
      className="group block rounded-md border border-border bg-panel hover:bg-subtle/40 transition overflow-hidden"
      href={og.url}
      target="_blank"
      rel="noreferrer"
    >
      <div className="flex">
        <div className="flex-1 p-3">
          <div className="text-xs text-muted flex items-center gap-1">
            <Globe size={12} /> {og.site}
          </div>
          <div className="text-sm font-medium mt-1 line-clamp-2">{og.title}</div>
          {og.description && <div className="text-xs text-muted mt-1 line-clamp-2">{og.description}</div>}
        </div>
        <div className="w-28 bg-subtle/30 border-l border-border flex items-center justify-center">
          {/* 이미지가 있으면 썸네일, 없으면 아이콘 */}
          {og.image ? (
            <img src={og.image} alt={og.title} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="opacity-60" />
          )}
        </div>
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
