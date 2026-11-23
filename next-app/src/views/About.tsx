import { ROADMAP, TEAM } from "@/lib/content";
import { Cta } from "@/components/blocks";
import { Avatar, PageHead } from "@/components/ui";

/* Fully static: rendered at build time, great for search engines. */
export default function About() {
  return (
    <>
      <PageHead label="About" title="A community that learns by building." lead="FBC is a student-run entrepreneurship community at BITS Pilani. We don't expect every member to become a founder. We want every member to understand how startups work, meet the right people, and try building something." />
      <section className="section"><div className="container sec-grid">
        <span className="label">Mission</span>
        <div><h2>Make entrepreneurship open to every BITSian.</h2>
          <div className="cols three mt-4">
            <div className="col"><h3>Accessible</h3><p>Any branch, any year, with or without an idea. No selection process to get in.</p></div>
            <div className="col"><h3>Practical</h3><p>Real problems, real startups, real feedback. Less theory, more doing.</p></div>
            <div className="col"><h3>Collaborative</h3><p>Building a startup shouldn&apos;t be a lonely ambition. Find the people to do it with.</p></div>
          </div></div>
      </div></section>
      <section className="section"><div className="container sec-grid">
        <span className="label">Roadmap</span>
        <div><h2>Where we&apos;ve been, where we&apos;re going.</h2>
          <div className="timeline mt-4">{ROADMAP.map((r) => (
            <div key={r.phase} className={`tl ${r.status}`}><span className="label">{r.phase} · {r.when}{r.status === "now" ? " · In progress" : ""}</span><h3>{r.title}</h3>
              <ul>{r.items.map((x) => <li key={x}>{x}</li>)}</ul></div>))}</div></div>
      </div></section>
      <section className="section"><div className="container sec-grid">
        <span className="label">Team</span>
        <div><h2>Run by students.</h2><p className="lead mt-2">We&apos;re recruiting more core members. Write to us if you want to help build FBC.</p>
          <div className="grid g3 mt-4">{TEAM.map((t) => <div key={t.name} className="person"><Avatar name={t.name} className="avatar-lg" /><div><h3>{t.name}</h3><p className="small">{t.role}</p></div></div>)}</div></div>
      </div></section>
      <Cta />
    </>
  );
}
