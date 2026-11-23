"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { ALLOWED_EMAIL } from "@/lib/config";
import { useApp, useToast } from "@/components/providers";
import { ProductMock } from "@/components/blocks";

const GOOGLE = (
  <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>
);
const ROLES = [["founder", "Founder", "I have an idea and need a team"], ["builder", "Builder", "I want to join a team and build"], ["explorer", "Explorer", "I'm curious about startups"]] as const;

export default function Auth({ join }: { join: boolean }) {
  const { user, profile, mode, reloadUser, setProfile } = useApp();
  const router = useRouter();
  const toast = useToast();
  const params = useSearchParams();
  const [role, setRole] = useState(params.get("role") || "founder");
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  useEffect(() => { if (user && profile && !busy) router.replace("/dashboard"); }, [user, profile, busy, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      if (mode === "demo" && !ALLOWED_EMAIL.test(email.trim())) throw new Error("not-bits");
      const u = await db.signIn(mode === "demo" ? { name: name.trim(), email: email.trim() } : undefined);
      const existing = await db.getProfile(u.uid);
      if (!existing) {
        setProfile(await db.saveProfile(u.uid, { name: u.name, role, photo: u.photo }));
        toast("Welcome to FBC. Let's set up your profile.");
        router.push("/onboarding");
      } else {
        await reloadUser();
        toast(`Welcome back, ${String(existing.name).split(" ")[0]}`);
        router.push("/dashboard");
      }
    } catch (er) {
      const e2 = er as { message?: string; code?: string };
      console.error(er);
      setErr(e2.message === "not-bits" ? "Please use your BITS email address."
        : e2.code === "auth/popup-closed-by-user" ? "Sign-in was cancelled."
        : e2.code === "auth/popup-blocked" ? "Your browser blocked the sign-in window. Allow pop-ups for this site and try again."
        : "Couldn't sign you in. Please try again.");
      setBusy(false);
    }
  }

  return (
    <section className="auth fade">
      <aside className="auth-art"><span className="label">Founders &amp; Builders Collective</span>
        <div><blockquote>{join ? "We want to learn entrepreneurship. If you're willing to join us, let's learn it together." : "People can only join you if they know what you're building."}</blockquote>
          <cite>{join ? "FBC, first meetup" : "A lesson from our founder"}</cite></div>
        <ProductMock floats={false} />
      </aside>
      <div className="auth-main"><form className="auth-card" onSubmit={submit}>
        <span className="label">{join ? "Join FBC" : "Welcome back"}</span>
        <h2>{join ? "Create your profile" : "Sign in"}</h2>
        <p className="small">{join ? "Free for every BITSian. Takes about two minutes, less if your AI assistant helps." : "With your BITS Google account."}</p>
        {join && <div className="roles" role="radiogroup" aria-label="I'm joining as">
          {ROLES.map(([k, t, d]) => (
            <button type="button" key={k} className={`role ${role === k ? "on" : ""}`} role="radio" aria-checked={role === k} onClick={() => setRole(k)}>
              <b>{t}</b><small>{d}</small><span className="radio" /></button>))}
        </div>}
        {mode === "demo" ? <>
          <div className="demo-note mt-3">Demo mode. Once Firebase keys are configured this becomes a &quot;Continue with Google&quot; button. For now, enter any BITS email.</div>
          <div className="field mt-3"><label htmlFor="dName">Name</label><input className="input" id="dName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></div>
          <div className="field mt-2"><label htmlFor="dEmail">BITS email</label><input className="input" id="dEmail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="f2024xxxx@pilani.bits-pilani.ac.in" /></div>
          <button className="btn btn-primary btn-block btn-lg mt-3" disabled={busy}>Continue</button>
        </> : <>
          <button className="btn btn-block btn-lg btn-google mt-4" disabled={busy}>{GOOGLE} Continue with Google</button>
          <p className="hint mt-2">Use your BITS account: Pilani, Goa, Hyderabad or Dubai.</p>
        </>}
        <p className="error mt-2">{err}</p>
        <p className="small mt-3">{join ? <>Already a member? <Link className="link" href="/login">Sign in</Link></> : <>New here? <Link className="link" href="/join">Join FBC</Link></>}</p>
      </form></div>
    </section>
  );
}
