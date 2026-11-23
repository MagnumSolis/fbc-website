/* Small presentational components shared across pages (no state, safe on server or client). */
import Link from "next/link";
import type { ReactNode } from "react";
import { STAGES } from "@/lib/content";
import { fmtDate, initials, parseDay } from "@/lib/format";
import type { Doc } from "@/lib/db";

export function Avatar({ name, photo, className = "" }: { name?: string; photo?: string; className?: string }) {
  return (
    <span className={`avatar ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo ? <img src={photo} alt="" referrerPolicy="no-referrer" /> : initials(name)}
    </span>
  );
}

export function StageBar({ stage = 0 }: { stage?: number }) {
  return (
    <span className="stage" aria-hidden="true">
      {STAGES.map((_, i) => <i key={i} className={i <= stage ? "on" : ""} />)}
    </span>
  );
}

export function Dots({ items }: { items: (string | undefined)[] }) {
  return <span className="dot-list">{items.filter(Boolean).map((x, i) => <span key={i}>{x}</span>)}</span>;
}

export function PageHead({ label, title, lead, children }: { label: string; title: ReactNode; lead?: string; children?: ReactNode }) {
  return (
    <section className="page-head">
      <div className="container">
        <span className="label">{label}</span>
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {children}
      </div>
    </section>
  );
}

export function VentureHead() {
  return (
    <div className="list-row v-row v-head">
      <span className="label">Venture</span><span className="label">Domain</span><span className="label">Stage</span>
      <span className="label needs">Looking for</span><span />
    </div>
  );
}

export function VentureRow({ v, onOpen }: { v: Doc; onOpen: (v: Doc) => void }) {
  return (
    <button className="list-row v-row" onClick={() => onOpen(v)}>
      <span><span className="title">{v.name}</span><br /><span className="tagline">{v.pitch}</span></span>
      <span className="small muted">{(v.domains || []).join(", ")}</span>
      <span className="small muted"><StageBar stage={v.stage} />{STAGES[v.stage] || ""}</span>
      <span className="small muted needs">{(v.needs || []).join(", ")}</span>
      <span className="go" aria-hidden="true">→</span>
    </button>
  );
}

export function DateBlock({ date }: { date?: string }) {
  const d = parseDay(date);
  return (
    <div className="e-date">
      <b>{d ? d.getDate() : ""}</b>
      {d ? d.toLocaleString("en", { month: "short" }) + " " + d.getFullYear() : ""}
    </div>
  );
}

const COVER: Record<string, string> = { "Startup Story": "c0", Analysis: "c1", "Failure Files": "c2", Newsletter: "c3" };
export function PostCard({ p, featured = false }: { p: Doc; featured?: boolean }) {
  return (
    <Link className={`post ${featured ? "featured" : ""}`} href={`/journal/post?id=${encodeURIComponent(p.id)}`}>
      <div className={`cover ${COVER[p.cat] || "c0"}`}><span>{p.cat}</span></div>
      <div className="post-body">
        {featured && <span className="label gold">Featured story</span>}
        <h3>{p.title}</h3>
        <p>{p.excerpt}</p>
        <span className="meta">{p.author} · {fmtDate(p.date)}{p.read ? ` · ${p.read} read` : ""}</span>
      </div>
    </Link>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function Loading() {
  return <div className="loading">Loading</div>;
}
