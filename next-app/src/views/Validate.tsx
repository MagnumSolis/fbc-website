"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { db } from "@/lib/db";
import { QUESTIONS, TIPS, ideaScore, verdict } from "@/lib/ideacheck";
import { useApp } from "@/components/providers";
import { PageHead } from "@/components/ui";

export default function Validate() {
  const { settings, user } = useApp();
  const [idea, setIdea] = useState("");
  const [ans, setAns] = useState<Record<string, number>>({});
  const [err, setErr] = useState("");
  const [result, setResult] = useState<{ idea: string; ans: Record<string, number> } | null>(null);
  const resRef = useRef<HTMLDivElement>(null);
  const checkRef = useRef<HTMLElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (Object.keys(ans).length < QUESTIONS.length) return setErr("Answer all seven questions. “No” is a perfectly good answer.");
    setErr("");
    setResult({ idea, ans });
    setTimeout(() => resRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    if (user) db.saveIdeaCheck(user.uid, { idea, answers: ans, score: ideaScore(ans) }).catch(console.error);
  }

  const score = result ? ideaScore(result.ans) : 0;
  const [vTitle, vText] = verdict(score);
  return (
    <>
      <PageHead label="Validate" title={<>Test it <em>before</em> you build it.</>} lead="Most startups don't fail because they can't build. They fail because nobody needed what they built." />
      <section className="section"><div className="container">
        <div className="feature">
          <div><span className="label gold">Featured tool</span>
            <h2 className="mt-2">VistaDex</h2>
            <p className="lead mt-3">{settings.vistadexBlurb}</p>
            <p className="small mt-2">Built by an FBC member. Free for the community.</p>
            <div className="row mt-4">
              {settings.vistadexUrl ? <a className="btn btn-primary" href={settings.vistadexUrl} target="_blank" rel="noopener">Open VistaDex ↗</a> : <button className="btn" disabled>Link coming soon</button>}
              <button className="arrow-link" onClick={() => checkRef.current?.scrollIntoView({ behavior: "smooth" })}>Or try the quick check</button>
            </div></div>
          <div><ol>
            <li><div><h3>Market and problem</h3><p className="small mt-1">Is the problem real, and big enough to matter?</p></div></li>
            <li><div><h3>Competition</h3><p className="small mt-1">Who else is solving it, and how you&apos;re different.</p></div></li>
            <li><div><h3>Risks and next steps</h3><p className="small mt-1">What to test next, in order.</p></div></li>
          </ol></div>
        </div>
      </div></section>
      <section className="section" ref={checkRef}><div className="narrow">
        <span className="label">Quick idea check · Free, no sign-in</span>
        <h2 className="mt-2">How validated is your idea?</h2>
        <p className="mt-2">Be honest. {user ? "Your result is saved to your dashboard, visible only to you." : "Nothing is saved unless you're signed in."}</p>
        <form className="mt-4" onSubmit={submit}>
          <div className="field"><label htmlFor="idea">Your idea in one line</label>
            <input className="input" id="idea" required maxLength={200} value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Battery-swap stations for campus e-scooters" /></div>
          <div className="list boxed mt-3">
            {QUESTIONS.map(([k, q], i) => (
              <div key={k} className="list-row" style={{ gridTemplateColumns: "2rem 1fr auto" }}>
                <span className="label">0{i + 1}</span><span>{q}</span>
                <div className="seg">{["No", "Partly", "Yes"].map((o, j) => (
                  <button type="button" key={o} className={ans[k] === j ? "on" : ""} onClick={() => setAns((a) => ({ ...a, [k]: j }))}>{o}</button>))}</div>
              </div>))}
          </div>
          <p className="error mt-2">{err}</p>
          <button className="btn btn-primary btn-lg mt-2">Get my score</button>
        </form>
        {result && (
          <div ref={resRef} className="panel mt-4 fade">
            <div className="row" style={{ gap: "2rem", alignItems: "flex-end" }}><div className="score">{score}</div>
              <div><span className="label gold">{vTitle}</span><h3 className="mt-1">“{result.idea}”</h3><p className="small mt-1">{vText}</p></div></div>
            {QUESTIONS.some(([k]) => result.ans[k] < 2) && <>
              <h3 className="mt-4">What to do next</h3>
              <ul className="mt-1" style={{ marginLeft: "1.1rem", color: "var(--text-2)" }}>{QUESTIONS.filter(([k]) => result.ans[k] < 2).map(([k]) => <li key={k}>{TIPS[k]}</li>)}</ul></>}
            <div className="row mt-4">
              {settings.vistadexUrl && <a href={settings.vistadexUrl} target="_blank" rel="noopener" className="btn btn-primary">Go deeper on VistaDex ↗</a>}
              <Link href="/join" className="btn">Find co-founders</Link><Link href="/events" className="arrow-link">Pitch it at an event</Link>
            </div>
          </div>)}
      </div></section>
    </>
  );
}
