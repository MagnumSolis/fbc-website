"use client";
/* Interactive building blocks used on several pages. */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type DependencyList } from "react";
import { db, type Doc } from "@/lib/db";
import { STAGES } from "@/lib/content";
import { fmtDate, isPast, statusLabel } from "@/lib/format";
import { useApp, useModal, useToast } from "./providers";
import { Avatar, DateBlock, Dots, StageBar } from "./ui";

/** Load data once the backend is ready; re-runs when deps change. */
export function useData<T>(load: () => Promise<T>, deps: DependencyList = []): [T | undefined, () => void] {
  const { ready } = useApp();
  const [data, setData] = useState<T>();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!ready) return;
    let live = true;
    load().then((d) => { if (live) setData(d); }).catch((e) => { console.error(e); if (live) setData(undefined); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, tick, ...deps]);
  return [data, () => setTick((t) => t + 1)];
}

/* ---------- venture details + apply ---------- */
function VentureDetails({ v }: { v: Doc }) {
  const { user, profile } = useApp();
  const toast = useToast();
  const modal = useModal();
  const mine = !!user && v.founderUid === user.uid;
  const needsCheck = !!user && !mine;
  // undefined = still checking; null = not applied
  const [applied, setApplied] = useState<Doc | null | undefined>(needsCheck ? undefined : null);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (!needsCheck) return;
    db.myApplications(user!.uid).then((a) => setApplied(a.find((x) => x.ventureId === v.id) || null)).catch(() => setApplied(null));
  }, [needsCheck, user, v.id]);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    try {
      await db.apply(v, msg.trim(), { uid: user.uid, email: user.email, name: profile.name, year: profile.year, skills: profile.skills });
      toast(`Application sent to ${v.name}`);
      setApplied({ id: "x", status: "new", createdAt: new Date().toISOString() });
    } catch (er) { console.error(er); toast("Couldn't send your application"); }
  }

  return (
    <>
      <span className="label">{(v.domains || []).join(" · ")}</span>
      <h2 className="mt-1">{v.name}</h2>
      <p className="small mt-1">{v.founderName}{v.founderYear ? `, ${v.founderYear}` : ""}</p>
      <p className="mt-3" style={{ color: "var(--text)" }}>{v.pitch}</p>
      {v.problem && <p className="mt-2">{v.problem}</p>}
      <div className="table-wrap mt-3"><table className="table"><tbody>
        <tr><td>Stage</td><td><StageBar stage={v.stage} />{STAGES[v.stage] || ""}</td></tr>
        <tr><td>Looking for</td><td>{(v.needs || []).join(", ")}</td></tr>
        {v.commitment && <tr><td>Commitment</td><td>{v.commitment}</td></tr>}
        {v.equity && <tr><td>Equity</td><td>{v.equity}</td></tr>}
      </tbody></table></div>
      {!user ? (
        <div className="mt-4"><p className="small">Sign in with your BITS account to apply.</p>
          <Link className="btn btn-primary mt-2" href="/login" onClick={modal.close}>Sign in to apply</Link></div>
      ) : mine ? (
        <p className="small mt-4">This is your venture. Manage it from your <Link className="link" href="/dashboard" onClick={modal.close}>dashboard</Link>.</p>
      ) : applied === undefined ? null : applied ? (
        <div className="notice mt-4"><span>You applied on {fmtDate(applied.createdAt)}. Status: <span className={`status ${applied.status}`}>{statusLabel(applied.status)}</span></span></div>
      ) : (
        <form className="mt-4" onSubmit={apply}>
          <div className="field"><label htmlFor="applyMsg">Why do you want to build this, and what would you bring?</label>
            <textarea className="input" id="applyMsg" required maxLength={2000} value={msg} onChange={(e) => setMsg(e.target.value)}
                      placeholder="Keep it short and honest. The founder sees your profile too." /></div>
          <button className="btn btn-primary mt-2">Apply to join {v.name}</button>
        </form>
      )}
    </>
  );
}
export function useVentureModal() {
  const modal = useModal();
  return (v: Doc) => modal.open(<VentureDetails v={v} />);
}

/* ---------- events ---------- */
export function useRsvp(onChange?: () => void) {
  const { user, profile } = useApp();
  const toast = useToast();
  const router = useRouter();
  return async (id: string, going: boolean) => {
    if (!user) { toast("Sign in to RSVP"); router.push("/login"); return; }
    try {
      await db.rsvp(id, { uid: user.uid, email: user.email, name: profile?.name || user.name }, !going);
      toast(going ? "RSVP cancelled" : "You're on the list");
      onChange?.();
    } catch (e) { console.error(e); toast("Couldn't update your RSVP"); }
  };
}

function EventDetails({ e, going, onRsvp }: { e: Doc; going: boolean; onRsvp: () => void }) {
  return (
    <>
      <span className="label">{e.type}</span>
      <h2 className="mt-1">{e.title}</h2>
      <p className="small mt-2"><Dots items={[fmtDate(e.date, { weekday: "long", day: "numeric", month: "long" }), e.time, e.venue]} /></p>
      <p className="mt-3">{e.desc}</p>
      {isPast(e.date) ? <p className="label mt-4">This event has passed</p>
        : <button className="btn btn-primary mt-4" onClick={onRsvp}>{going ? "You're going. Cancel RSVP" : "RSVP"}</button>}
    </>
  );
}

export function EventRow({ e, rsvps = [], onChanged }: { e: Doc; rsvps?: string[]; onChanged?: () => void }) {
  const modal = useModal();
  const rsvp = useRsvp(onChanged);
  const going = rsvps.includes(e.id);
  const open = () => modal.open(<EventDetails e={e} going={going} onRsvp={() => { modal.close(); rsvp(e.id, going); }} />);
  return (
    <div className="list-row e-row clickable" onClick={open}>
      <DateBlock date={e.date} />
      <div><span className="title">{e.title}</span><div className="tagline"><Dots items={[e.type, e.time, e.venue]} /></div></div>
      <div>{isPast(e.date) ? <span className="label">Past</span>
        : <button className="btn btn-sm" onClick={(ev) => { ev.stopPropagation(); rsvp(e.id, going); }}>{going ? "Going ✓" : "RSVP"}</button>}</div>
    </div>
  );
}

/* ---------- product preview (hero + sign-in page) ---------- */
const SAMPLE_V = { name: "Voltway", pitch: "Battery-swap stations for campus e-scooters. Swap in 30 seconds, pay per swap.", needs: ["Hardware / IoT", "Finance"], domains: ["ClimateTech"], stage: 2 };
export function ProductMock({ v, floats = true }: { v?: Partial<Doc>; floats?: boolean }) {
  const ven = v && v.name ? v : SAMPLE_V;
  const logo = String(ven.name).replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "FB";
  return (
    <div className="rise d2">
      <div className="mock tilt" aria-hidden="true">
        <div className="mock-window">
          <div className="mock-bar"><i /><i /><i /><span>fbc / matchmaking / {String(ven.name).toLowerCase()}</span></div>
          <div className="mock-body">
            <div className="mock-venture">
              <div className="mock-logo">{logo}</div>
              <div><h4>{ven.name}</h4><p>{ven.pitch}</p>
                <div className="mock-chips">
                  {(ven.needs || []).slice(0, 3).map((n: string) => <span key={n} className="need">Needs {n}</span>)}
                  {(ven.domains || []).slice(0, 1).map((d: string) => <span key={d}>{d}</span>)}
                </div></div>
              <div className="mock-stat"><b>{STAGES[ven.stage || 0] || "Idea"}</b><small>Stage</small></div>
            </div>
            <div>
              <div className="mock-row"><Avatar name="Ananya Gupta" /><span><b>Ananya G.</b> · Full-stack dev, 2nd year</span><span className="st new">New</span></div>
              <div className="mock-row"><Avatar name="Rohan Verma" /><span><b>Rohan V.</b> · Finance, 3rd year</span><span className="st rev">Reviewing</span></div>
              <div className="mock-row"><Avatar name="Arjun Nair" /><span><b>Arjun N.</b> · Hardware / IoT, 4th year</span><span className="st acc">Accepted</span></div>
            </div>
          </div>
        </div>
        {floats && <>
          <div className="mock-float mock-match"><div className="ring"><span>94%</span></div><div><small>Skill match</small><b>Arjun ↔ {ven.name}</b></div></div>
          <div className="mock-float mock-toast"><span className="dot" /><p><b>Meera J.</b> applied to join {ven.name} as a content lead</p></div>
        </>}
      </div>
    </div>
  );
}

/* ---------- closing call to action ---------- */
export function Cta() {
  const { settings } = useApp();
  return (
    <section className="section"><div className="container">
      <div className="cta-gold">
        <span className="label gold">Free for every BITSian</span>
        <h2 className="mt-2">Have an idea? <em>Find your people.</em></h2>
        <p className="lead mt-3">Any branch, any year, with or without an idea. Sign in with your BITS Google account and you&apos;re in.</p>
        <div className="row mt-4">
          <Link href="/join" className="btn btn-primary btn-lg">Join FBC</Link>
          <a href={settings.whatsapp} target="_blank" rel="noopener" className="btn btn-lg">WhatsApp community</a>
        </div>
      </div>
    </div></section>
  );
}
