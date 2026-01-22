// lib/utils.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function hexToRgba(hex: string, alpha = 1) {
  if (!hex) return `rgba(37, 99, 235, ${alpha})`;
  let normalized = hex.replace("#", "");
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
