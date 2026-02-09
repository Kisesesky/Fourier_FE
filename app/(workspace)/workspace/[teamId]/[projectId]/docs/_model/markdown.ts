import hljs from "highlight.js";
import type { JSONContent } from "@tiptap/react";

export function countMarkdownWords(markdown: string) {
  return markdown.trim().split(/\s+/).filter(Boolean).length;
}

export function createMarkdownOutline(markdown: string) {
  return markdown
    .split("\n")
    .map((line, index) => {
      const matched = /^(#{1,4})\s+(.+)$/.exec(line.trim());
      if (!matched) return null;
      return {
        id: `h-${index}`,
        level: matched[1].length,
        text: matched[2].trim(),
      };
    })
    .filter(Boolean) as Array<{ id: string; level: number; text: string }>;
}

export function markdownToDoc(markdown: string): JSONContent {
  if (!markdown.trim()) {
    return { type: "doc", content: [] };
  }
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: markdown }],
      },
    ],
  };
}

export function docToMarkdown(content?: JSONContent | null): string {
  if (!content) return "";
  const chunks: string[] = [];

  const walk = (node?: JSONContent) => {
    if (!node) return;
    if (typeof node.text === "string") {
      chunks.push(node.text);
    }
    if (node.type === "hardBreak") {
      chunks.push("\n");
    }
    if (Array.isArray(node.content)) {
      node.content.forEach((child) => walk(child));
      if (node.type === "paragraph" || node.type === "heading" || node.type === "codeBlock") {
        chunks.push("\n");
      }
    }
  };

  walk(content);
  return decodeHtmlEntities(chunks.join("").replace(/\n{3,}/g, "\n\n").trim());
}

export function renderMarkdownToHtml(markdown: string) {
  const escaped = escapeHtml(decodeHtmlEntities(markdown || ""));
  const codeBlocks: string[] = [];
  const withCodePlaceholders = escaped.replace(
    /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g,
    (_, lang: string, code: string) => {
      const index = codeBlocks.length;
      const language = (lang || "").trim().toLowerCase();
      const rawCode = code.replace(/\n$/, "");
      const highlighted = highlightCode(rawCode, language);
      const label = language
        ? `<span class="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-blue-400">${language}</span>`
        : "";
      codeBlocks.push(
        `<pre><code class="hljs language-${language || "plaintext"}">${label}${highlighted}</code></pre>`,
      );
      return `@@CODE_BLOCK_${index}@@`;
    },
  );

  const lines = withCodePlaceholders.split("\n");
  const html: string[] = [];
  let inUl = false;
  let inOl = false;
  let inTask = false;
  let inQuote = false;

  const closeLists = () => {
    if (inUl) {
      html.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      html.push("</ol>");
      inOl = false;
    }
    if (inQuote) {
      html.push("</blockquote>");
      inQuote = false;
    }
    if (inTask) {
      html.push("</ul>");
      inTask = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      closeLists();
      continue;
    }

    const codeToken = /^@@CODE_BLOCK_(\d+)@@$/.exec(line.trim());
    if (codeToken) {
      closeLists();
      html.push(codeBlocks[Number(codeToken[1])] ?? "");
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      closeLists();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const quote = /^>\s+(.+)$/.exec(line);
    if (quote) {
      if (!inQuote) {
        closeLists();
        html.push("<blockquote>");
        inQuote = true;
      }
      html.push(`<p>${renderInline(quote[1])}</p>`);
      continue;
    }

    const task = /^-\s\[( |x|X)\]\s+(.+)$/.exec(line);
    if (task) {
      if (!inTask) {
        closeLists();
        html.push('<ul class="list-none pl-0">');
        inTask = true;
      }
      const checked = task[1].toLowerCase() === "x";
      html.push(
        `<li class="my-1 flex items-center gap-2"><input type="checkbox" disabled ${checked ? "checked" : ""} /><span>${renderInline(task[2])}</span></li>`,
      );
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      closeLists();
      html.push("<hr />");
      continue;
    }

    const ul = /^[-*]\s+(.+)$/.exec(line);
    if (ul) {
      if (!inUl) {
        closeLists();
        html.push("<ul>");
        inUl = true;
      }
      html.push(`<li>${renderInline(ul[1])}</li>`);
      continue;
    }

    const ol = /^\d+\.\s+(.+)$/.exec(line);
    if (ol) {
      if (!inOl) {
        closeLists();
        html.push("<ol>");
        inOl = true;
      }
      html.push(`<li>${renderInline(ol[1])}</li>`);
      continue;
    }

    closeLists();
    html.push(`<p>${renderInline(line)}</p>`);
  }

  closeLists();
  return html
    .join("\n")
    .replace(/&(amp;)?quot;?/gi, '"')
    .replace(/&(amp;)?quote;?/gi, '"');
}

function highlightCode(code: string, language: string) {
  if (!language) return code;
  if (!hljs.getLanguage(language)) return code;
  try {
    return hljs.highlight(code, { language }).value;
  } catch {
    return code;
  }
}

function renderInline(line: string) {
  return line
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, `<img src="$2" alt="$1" />`)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, `<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>`)
    .replace(/`([^`]+)`/g, `<code>$1</code>`)
    .replace(/\*\*([^*]+)\*\*/g, `<strong>$1</strong>`)
    .replace(/__([^_]+)__/g, `<strong>$1</strong>`)
    .replace(/\*([^*]+)\*/g, `<em>$1</em>`)
    .replace(/_([^_]+)_/g, `<em>$1</em>`)
    .replace(/~~([^~]+)~~/g, `<del>$1</del>`);
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeHtmlEntities(text: string) {
  let next = text;
  for (let i = 0; i < 5; i += 1) {
    const decoded = next
      .replace(/&(quot|quote);?/gi, '"')
      .replace(/&#39;?/gi, "'")
      .replace(/&(lt);?/gi, "<")
      .replace(/&(gt);?/gi, ">")
      .replace(/&(amp);?/gi, "&");
    if (decoded === next) break;
    next = decoded;
  }
  return next;
}
