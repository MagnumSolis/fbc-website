"use client";
import { useState } from "react";
import { db, type Doc } from "@/lib/db";
import { OPP_TYPES } from "@/lib/content";
import { fmtDate } from "@/lib/format";
import { useApp, useModal, useToast } from "@/components/providers";
import { useData } from "@/components/blocks";
import { Dots, Empty, PageHead } from "@/components/ui";

/** Generic message form used for "I'm interested" and "Post an opportunity". */
function MessageForm({ type, extraLabel, extraValue, bodyLabel, submitLabel, onDone }: {
  type: string; extraLabel?: string; extraValue?: string; bodyLabel: string; submitLabel: string; onDone: () => void;
}) {
  const { user, profile } = useApp();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      await db.sendMessage({ type, name: String(f.get("name")), email: String(f.get("email")), body: String(f.get("body")), extra: extraValue ?? String(f.get("extra") || "") });
      toast("Sent. We'll be in touch."); onDone();
    } catch (er) { console.error(er); toast("Couldn't send. Please try again."); setBusy(false); }
  }
  return (
    <form className="mt-3 grid" style={{ gap: "1rem" }} onSubmit={submit}>
      <div className="form-grid">
        <div className="field"><label>Name</label><input className="input" name="name" required defaultValue={profile?.name || ""} /></div>
        <div className="field"><label>Email</label><input className="input" type="email" name="email" required defaultValue={user?.email || ""} /></div>
        {extraLabel && !extraValue && <div className="field full"><label>{extraLabel}</label><input className="input" name="extra" required /></div>}
        <div className="field full"><label>{bodyLabel}</label><textarea className="input" name="body" required maxLength={4000} /></div>
      </div>
      <div><button className="btn btn-primary" disabled={busy}>{submitLabel}</button></div>
    </form>
  );
}

export default function Opportunities() {
  const modal = useModal();
  const [type, setType] = useState("All");
  const [all] = useData(async () => (await db.list("opportunities")).sort((a, b) => String(a.deadline).localeCompare(String(b.deadline))));
  const list = (all || []).filter((o) => type === "All" || o.type === type);

  const interest = (o: Doc) => modal.open(<><span className="label">{o.org}</span><h2 className="mt-1">{o.title}</h2>
    <p className="mt-2">Tell us you&apos;re interested and we&apos;ll connect you with the team.</p>
    <MessageForm type="interest" extraValue={o.title} bodyLabel="A line about you" submitLabel="Send" onDone={modal.close} /></>);
  const post = () => modal.open(<><span className="label">For startups</span><h2 className="mt-1">Post an opportunity</h2>
    <p className="mt-2">Tell us about the role. The FBC team reviews every listing before it goes live.</p>
    <MessageForm type="opportunity" extraLabel="Company and role" bodyLabel="Details: what they'll do, duration, stipend, remote or on campus, how to apply" submitLabel="Submit for review" onDone={modal.close} /></>);

  return (
    <>
      <PageHead label="Opportunities" title="Work with real startups." lead="Internships, founder's office roles and projects with campus and outside startups. The fastest way to learn is to work on something real." />
      <section className="container" style={{ paddingBottom: 96 }}>
        <div className="toolbar">
          <div className="seg">{["All", ...OPP_TYPES].map((t) => <button key={t} className={type === t ? "on" : ""} onClick={() => setType(t)}>{t}</button>)}</div>
          <span className="xs faint" style={{ marginLeft: "auto" }}>{list.length} open</span>
        </div>
        <div className="list boxed">
          {list.map((o) => (
            <div key={o.id} className="list-row" style={{ gridTemplateColumns: "2fr 1.3fr 1fr auto" }}>
              <div><span className="title">{o.title}</span><div className="tagline">{o.org}</div></div>
              <div className="small muted"><Dots items={[o.type, o.mode, o.duration]} /></div>
              <div className="small muted">{o.stipend}<div className="xs faint">{o.deadline ? "Apply by " + fmtDate(o.deadline, { day: "numeric", month: "short" }) : ""}</div></div>
              {o.url ? <a className="btn btn-sm" href={o.url} target="_blank" rel="noopener">Apply ↗</a> : <button className="btn btn-sm" onClick={() => interest(o)}>I&apos;m interested</button>}
            </div>))}
          {all && !list.length && <Empty>Nothing open in this category right now.</Empty>}
        </div>
        <div className="notice mt-4"><div><h3>Hiring students?</h3><p className="small">List an internship, project or role and reach the FBC community.</p></div>
          <button className="btn" onClick={post}>Post an opportunity</button></div>
      </section>
    </>
  );
}
