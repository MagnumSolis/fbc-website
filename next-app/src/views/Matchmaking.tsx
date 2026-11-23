"use client";
import Link from "next/link";
import { useState } from "react";
import { db } from "@/lib/db";
import { DOMAINS, SKILLS } from "@/lib/content";
import { byDesc } from "@/lib/format";
import { isFounder } from "@/lib/ai";
import { useApp, useModal, useToast } from "@/components/providers";
import { useData, useVentureModal } from "@/components/blocks";
import { Avatar, Empty, PageHead, VentureHead, VentureRow } from "@/components/ui";

export default function Matchmaking() {
  const { user, profile } = useApp();
  const openVenture = useVentureModal();
  const modal = useModal();
  const toast = useToast();
  const [tab, setTab] = useState<"ventures" | "builders">("ventures");
  const [q, setQ] = useState(""); const [domain, setDomain] = useState(""); const [skill, setSkill] = useState("");
  const [ventures] = useData(async () => (await db.list("ventures")).sort(byDesc("updatedAt")));
  const [builders] = useData(async () => (user ? (await db.members("builder").catch(() => [])).filter((b) => b.id !== user.uid) : null), [user?.uid]);
  const qq = q.toLowerCase();

  const invite = (name: string, email: string) => modal.open(
    <><span className="label">Invite</span><h2 className="mt-1">Invite {name}</h2>
      <p className="mt-2">Reach out directly. A short note about your venture and why you thought of them works best.</p>
      {email ? <><p className="mt-3 mono small" style={{ color: "var(--text)" }}>{email}</p>
        <div className="row mt-3"><a className="btn btn-primary" href={`mailto:${email}?subject=${encodeURIComponent(`Building ${profile?.vname || "a startup"} together? (via FBC)`)}`}>Write an email</a>
          <button className="btn" onClick={() => navigator.clipboard?.writeText(email).then(() => toast("Copied"))}>Copy address</button></div></>
        : <p className="mt-3 small">This member hasn&apos;t shared an email address.</p>}</>);

  const vRows = (ventures || []).filter((v) => (!qq || `${v.name} ${v.pitch} ${v.founderName}`.toLowerCase().includes(qq)) && (!domain || (v.domains || []).includes(domain)) && (!skill || (v.needs || []).includes(skill)));
  const bRows = (builders || []).filter((b) => (!qq || `${b.name} ${b.bio} ${b.looking}`.toLowerCase().includes(qq)) && (!domain || (b.domains || []).includes(domain)) && (!skill || (b.skills || []).includes(skill)));

  return (
    <>
      <PageHead label="Co-founder matchmaking" title="Find, match, build." lead="Founders list their idea and the skills they need. Builders apply to the ventures they believe in. Everyone meets at Pitch Night.">
        <div className="row"><Link href="/join?role=founder" className="btn btn-primary">List your idea</Link><Link href="/join?role=builder" className="btn">Create a builder profile</Link></div>
      </PageHead>
      <section className="container" style={{ paddingBottom: 96 }}>
        <div className="toolbar">
          <div className="seg" role="tablist">
            <button className={tab === "ventures" ? "on" : ""} onClick={() => setTab("ventures")}>Ventures <span className="faint">{ventures?.length ?? ""}</span></button>
            <button className={tab === "builders" ? "on" : ""} onClick={() => { setTab("builders"); setSkill(""); }}>Builders</button>
          </div>
          <input className="input grow" placeholder={`Search ${tab}`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
          <select className="input" value={domain} onChange={(e) => setDomain(e.target.value)} aria-label="Domain"><option value="">All domains</option>{DOMAINS.map((d) => <option key={d}>{d}</option>)}</select>
          <select className="input" value={skill} onChange={(e) => setSkill(e.target.value)} aria-label="Skill"><option value="">{tab === "ventures" ? "Any skill needed" : "Any skill"}</option>{SKILLS.map((d) => <option key={d}>{d}</option>)}</select>
        </div>
        <div className="list boxed">
          {tab === "ventures" ? (<>
            <VentureHead />
            {vRows.map((v) => <VentureRow key={v.id} v={v} onOpen={openVenture} />)}
            {ventures && !vRows.length && <Empty>No ventures match those filters.</Empty>}
          </>) : !user ? (
            <Empty><p>Sign in with your BITS account to see builder profiles.</p><div className="row mt-2" style={{ justifyContent: "center" }}><Link href="/login" className="btn btn-primary btn-sm">Sign in</Link></div></Empty>
          ) : (<>
            {bRows.map((b) => (
              <div key={b.id} className="list-row" style={{ gridTemplateColumns: "auto 2fr 1.4fr auto" }}>
                <Avatar name={b.name} photo={b.photo} />
                <div><span className="title">{b.name}</span> <span className="xs faint">{b.year}</span><div className="tagline">{b.bio || b.looking}</div></div>
                <div className="small muted">{(b.skills || []).join(", ")}</div>
                {isFounder(profile) ? <button className="btn btn-sm" onClick={() => invite(b.name, b.email || "")}>Invite</button> : <span />}
              </div>))}
            {builders && !bRows.length && <Empty>No builders match those filters yet.</Empty>}
          </>)}
        </div>
      </section>
    </>
  );
}
