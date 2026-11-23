"use client";
import { useState } from "react";
import { db } from "@/lib/db";
import { useApp, useToast } from "@/components/providers";
import { PageHead } from "@/components/ui";

const FAQ: [string, string][] = [
  ["Do I need a startup idea to join?", "No. Many members join to learn, to explore, or to join someone else's venture. You can start anywhere."],
  ["Who can join?", "Any BITS student, from any branch or year, with any level of experience. Sign in with your BITS Google account."],
  ["Won't someone steal my idea if I list it?", "People can only join you if they know what you're building. Ideas are cheap; execution is what counts."],
  ["How does matchmaking work?", "Founders list their idea and who they need. Builders apply. The founder reviews applications, and everyone meets at Pitch Night."],
  ["Is there a fee?", "No. FBC is free for students."],
];

export default function Contact() {
  const { user, profile, settings } = useApp();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true);
    const form = e.currentTarget, f = new FormData(form);
    try {
      await db.sendMessage({ type: "contact", name: String(f.get("name")), email: String(f.get("email")), body: String(f.get("body")), extra: String(f.get("extra")) });
      form.reset(); toast("Message sent. We'll get back to you.");
    } catch (er) { console.error(er); toast("Couldn't send. Please try again."); }
    setBusy(false);
  }
  return (
    <>
      <PageHead label="Contact" title="Write to us." lead="Questions, event ideas, partnerships, speaking, or listing your startup. We read everything." />
      <section className="section"><div className="container"><div className="grid g2" style={{ gap: "4rem", alignItems: "start" }}>
        <form className="grid" style={{ gap: "1.25rem" }} onSubmit={submit}>
          <div className="form-grid">
            <div className="field"><label htmlFor="cName">Name</label><input className="input" id="cName" name="name" required defaultValue={profile?.name || user?.name || ""} /></div>
            <div className="field"><label htmlFor="cEmail">Email</label><input className="input" id="cEmail" type="email" name="email" required defaultValue={user?.email || ""} /></div>
            <div className="field full"><label htmlFor="cAs">You are</label><select className="input" id="cAs" name="extra">
              {["A student", "A startup or founder", "A speaker or mentor", "An investor", "A sponsor or partner", "Something else"].map((o) => <option key={o}>{o}</option>)}</select></div>
            <div className="field full"><label htmlFor="cMsg">Message</label><textarea className="input" id="cMsg" name="body" required maxLength={4000} /></div>
          </div>
          <div><button className="btn btn-primary" disabled={busy}>Send message</button></div>
        </form>
        <div>
          <div className="list boxed">
            <a className="list-row" style={{ gridTemplateColumns: "1fr auto" }} href={settings.whatsapp} target="_blank" rel="noopener"><div><span className="title">WhatsApp community</span><div className="tagline">The fastest way to reach us and hear about events.</div></div><span className="go">↗</span></a>
            <a className="list-row" style={{ gridTemplateColumns: "1fr auto" }} href={settings.joinForm} target="_blank" rel="noopener"><div><span className="title">Join form</span><div className="tagline">Tell us what you&apos;d like FBC to organise.</div></div><span className="go">↗</span></a>
            {settings.contactEmail && <div className="list-row" style={{ gridTemplateColumns: "1fr" }}><div><span className="title">Email</span><div className="tagline">{settings.contactEmail}</div></div></div>}
          </div>
          <div className="faq mt-4"><span className="label">Questions</span>
            {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
        </div>
      </div></div></section>
    </>
  );
}
