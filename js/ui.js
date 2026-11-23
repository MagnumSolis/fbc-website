/* Shared state and small UI helpers */
import { config } from "./config.js";
import { STAGES } from "./content.js";
import { toDate } from "./db.js";

export const S = {
  user: null,        // signed-in auth user {uid, email, name, photo}
  profile: null,     // users/{uid}
  admin: false,
  settings: { ...config.site },
  ob: { step: 0, mode: null },   // onboarding
  draft: null,                   // onboarding draft profile
  dashTab: "overview",
  adminTab: "overview",
  mm: { tab: "ventures", q: "", domain: "", skill: "" },
  opp: "All",
  jcat: "All",
  pendingRole: "founder",
  cache: {},
};

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = (s = "") => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const initials = (n = "") => String(n).split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const parseDay = (d) => (d ? new Date(String(d).slice(0, 10) + "T00:00:00") : null);
export const fmtDate = (d, o = { day: "numeric", month: "short", year: "numeric" }) => {
  const x = typeof d === "string" && d.length === 10 ? parseDay(d) : toDate(d);
  return x && !isNaN(x) ? x.toLocaleDateString("en-IN", o) : "";
};
export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "item";
export const byDateDesc = (k) => (a, b) => String(b[k] || "").localeCompare(String(a[k] || ""));
export const byDateAsc = (k) => (a, b) => String(a[k] || "").localeCompare(String(b[k] || ""));
export const upcoming = (events) => events.filter((e) => (e.date || "") >= todayISO()).sort(byDateAsc("date"));
export const past = (events) => events.filter((e) => (e.date || "") < todayISO()).sort(byDateDesc("date"));

export const stageBar = (s) => `<span class="stage" aria-hidden="true">${STAGES.map((_, i) => `<i class="${i <= (s || 0) ? "on" : ""}"></i>`).join("")}</span>`;
export const avatar = (name, photo, cls = "") => `<span class="avatar ${cls}">${photo ? `<img src="${esc(photo)}" alt="" referrerpolicy="no-referrer"/>` : esc(initials(name))}</span>`;
export const dots = (arr) => `<span class="dot-list">${(arr || []).filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join("")}</span>`;

export function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 2800);
}
export function openModal(html, { wide = false } = {}) {
  $("#modalBody").innerHTML = html;
  $(".modal-card").classList.toggle("wide", wide);
  $("#modal").classList.add("open"); $("#modal").setAttribute("aria-hidden", "false");
  setTimeout(() => $("#modalBody input, #modalBody textarea, #modalBody select")?.focus(), 30);
}
export function closeModal() { $("#modal").classList.remove("open"); $("#modal").setAttribute("aria-hidden", "true"); }

/* Minimal, safe markdown: ## headings, > quotes, - lists, *italic*, **bold**, [links](url), paragraphs */
export function md(src = "") {
  const inline = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|#[\w-]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return String(src).split(/\n{2,}/).map((block) => {
    const b = block.trim();
    if (!b) return "";
    if (b.startsWith("## ")) return `<h2>${inline(b.slice(3))}</h2>`;
    if (b.startsWith("> ")) return `<blockquote>${inline(b.replace(/^>\s?/gm, ""))}</blockquote>`;
    if (/^- /.test(b)) return `<ul>${b.split(/\n/).map((l) => `<li>${inline(l.replace(/^- /, ""))}</li>`).join("")}</ul>`;
    return `<p>${inline(b).replace(/\n/g, "<br/>")}</p>`;
  }).join("");
}

export function downloadCSV(name, rows, cols) {
  const cell = (v) => { const s = Array.isArray(v) ? v.join("; ") : v?.toDate ? v.toDate().toISOString() : String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
  try {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${name}-${todayISO()}.csv`; document.body.appendChild(a); a.click(); a.remove();
    toast(`Exported ${rows.length} rows`);
  } catch {
    navigator.clipboard?.writeText(csv).then(() => toast("CSV copied to clipboard"), () => toast("Export not available here"));
  }
}

export const GOOGLE_ICON = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
