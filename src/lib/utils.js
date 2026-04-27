import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function ellipsize(s, n = 80) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
