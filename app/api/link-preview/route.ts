import { NextRequest, NextResponse } from "next/server";

type LinkPreviewPayload = {
  url: string;
  site: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
};

function pickMetaTag(html: string, keys: string[]): string | undefined {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const byProperty = new RegExp(
      `<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i",
    );
    const byPropertyReversed = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["'][^>]*>`,
      "i",
    );
    const byName = new RegExp(
      `<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i",
    );
    const byNameReversed = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["'][^>]*>`,
      "i",
    );
    const match =
      html.match(byProperty) ||
      html.match(byPropertyReversed) ||
      html.match(byName) ||
      html.match(byNameReversed);
    const value = match?.[1]?.trim();
    if (value) return value;
  }
  return undefined;
}

function pickTitle(html: string): string | undefined {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1]?.replace(/\s+/g, " ").trim();
  return title || undefined;
}

function resolveUrl(baseUrl: string, candidate?: string): string | undefined {
  if (!candidate) return undefined;
  try {
    return new URL(candidate, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function buildFallback(target: string): LinkPreviewPayload {
  const host = (() => {
    try {
      return new URL(target).hostname.replace(/^www\./, "");
    } catch {
      return target;
    }
  })();
  return {
    url: target,
    site: host,
    title: host,
    description: `Preview of ${host}`,
    favicon: `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(target)}`,
  };
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url")?.trim();
  if (!rawUrl) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  let target: string;
  try {
    const parsed = new URL(rawUrl);
    if (!/^https?:$/i.test(parsed.protocol)) {
      return NextResponse.json({ error: "unsupported protocol" }, { status: 400 });
    }
    target = parsed.toString();
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  const fallback = buildFallback(target);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(target, {
      method: "GET",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; FourierBot/1.0; +https://fourier.app)",
        accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      return NextResponse.json(fallback);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json(fallback);
    }

    const html = (await response.text()).slice(0, 300_000);
    const site =
      pickMetaTag(html, ["og:site_name"]) ||
      (() => {
        try {
          return new URL(target).hostname.replace(/^www\./, "");
        } catch {
          return target;
        }
      })();
    const title = pickMetaTag(html, ["og:title", "twitter:title"]) || pickTitle(html) || fallback.title;
    const description =
      pickMetaTag(html, ["og:description", "description", "twitter:description"]) || fallback.description;
    const image = resolveUrl(target, pickMetaTag(html, ["og:image", "twitter:image"]));
    const icon = resolveUrl(target, pickMetaTag(html, ["og:image:secure_url"])) || resolveUrl(target, "/favicon.ico");

    const payload: LinkPreviewPayload = {
      url: target,
      site,
      title,
      description,
      image,
      favicon: icon || fallback.favicon,
    };

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(fallback);
  } finally {
    clearTimeout(timeout);
  }
}
