/* Small formatting helpers shared across pages. */
import type { Doc } from "./db";

export const initials = (n = "") => String(n).split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const parseDay = (d?: string) => (d ? new Date(String(d).slice(0, 10) + "T00:00:00") : null);

/** Accepts "YYYY-MM-DD", ISO strings, Date or Firestore Timestamp-like values. */
export function fmtDate(d: unknown, o: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  let x: Date | null = null;
  if (typeof d === "string") x = d.length === 10 ? parseDay(d) : new Date(d);
  else if (d instanceof Date) x = d;
  else if (d && typeof (d as { toDate?: () => Date }).toDate === "function") x = (d as { toDate: () => Date }).toDate();
  return x && !isNaN(+x) ? x.toLocaleDateString("en-IN", o) : "";
}

export const byDesc = (k: string) => (a: Doc, b: Doc) => String(b[k] || "").localeCompare(String(a[k] || ""));
export const byAsc = (k: string) => (a: Doc, b: Doc) => String(a[k] || "").localeCompare(String(b[k] || ""));
export const upcoming = (events: Doc[]) => events.filter((e) => (e.date || "") >= todayISO()).sort(byAsc("date"));
export const past = (events: Doc[]) => events.filter((e) => (e.date || "") < todayISO()).sort(byDesc("date"));
export const isPast = (d?: string) => (d || "") < todayISO();
export const slug = (s: string) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "item";

export const statusLabel = (s: string) =>
  ({ new: "New", reviewing: "Reviewing", accepted: "Accepted", declined: "Declined", live: "Live", paused: "Paused", hidden: "Hidden" } as Record<string, string>)[s] || s;
