// lib/commands.ts
export type Command = {
  id: string;
  label: string;
  hint?: string;
  keywords?: string[];
  run: () => void | Promise<void>;
};

export function fuzzyScore(q: string, text: string) {
  q = q.toLowerCase().trim();
  text = text.toLowerCase();
  if (!q) return 0;
  if (text.includes(q)) return q.length * 2;
  let t = text, s = 0;
  for (const ch of q) {
    const i = t.indexOf(ch);
    if (i === -1) return 0;
    s += 1; t = t.slice(i + 1);
  }
  return s;
}
