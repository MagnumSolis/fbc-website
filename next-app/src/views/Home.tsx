"use client";
import Link from "next/link";
import { db } from "@/lib/db";
import { byDesc, fmtDate, parseDay, upcoming } from "@/lib/format";
import { useApp } from "@/components/providers";
import { Cta, EventRow, ProductMock, useData, useVentureModal } from "@/components/blocks";
import { Avatar, Empty, PostCard, VentureHead, VentureRow } from "@/components/ui";

export default function Home() {
  const { user } = useApp();
  const openVenture = useVentureModal();
  const [data] = useData(async () => {
    const [ventures, events, posts, opps] = await Promise.all([db.list("ventures"), db.list("events"), db.list("posts"), db.list("opportunities")]);
    return { ventures: ventures.sort(byDesc("updatedAt")), events: upcoming(events), posts: posts.sort(byDesc("date")).slice(0, 3), opps };
  });
  const [rsvps, reloadRsvps] = useData(async () => (user ? db.myRsvps(user.uid) : []), [user?.uid]);

  const vs = data?.ventures || [], up = data?.events || [], ps = data?.posts || [], opps = data?.opps || [];
  const next = up[0];
  const heroV = vs.find((v) => (v.needs || []).length);

  return (
    <>
      <section className="hero"><div className="container hero-grid">
        <div>
          {next ? <Link className="pill rise" href="/events"><b>Next up</b><span>{next.title}, {fmtDate(next.date, { day: "numeric", month: "short" })}</span></Link>
                : <span className="label rise">BITS Pilani · Student community</span>}
          <h1 className="rise d1">Find the people<br />to <em>build it</em> with.</h1>
          <p className="lead rise d2">FBC is where BITSians with ideas meet BITSians who want to build them. List your idea or join one, find a co-founder, and learn how startups actually get made.</p>
          <div className="row rise d3"><Link href="/join" className="btn btn-primary btn-lg">Join FBC, it&apos;s free</Link><Link href="/matchmaking" className="btn btn-lg">Browse ventures</Link></div>
          {vs.length > 0 && <div className="trust rise d3"><div className="faces">{vs.slice(0, 5).map((v) => <Avatar key={v.id} name={v.founderName || v.name} />)}</div>
            <span>{vs.length} venture{vs.length === 1 ? "" : "s"} looking for co-founders right now</span></div>}
        </div>
        <ProductMock v={heroV} />
      </div></section>

      <div className="container"><div className="statband">
        <div><b data-count="1200">1,200</b><span>students join BITS Pilani every year, and many arrive wanting to build something.</span></div>
        <div><b><span data-count="20">20</span>–<span data-count="25">25</span></b><span>seats a year in established clubs, for the hundreds who apply.</span></div>
        <div><b><em>1</em> profile</b><span>is all it takes here to reach every builder on campus.</span></div>
      </div></div>

      <section className="section"><div className="container">
        <div className="sec-head"><div><span className="label kicker">The problem</span><h2>Finding a co-founder shouldn&apos;t take a semester.</h2></div>
          <p>Interest and ability were never the issue on this campus. There just wasn&apos;t a place for people with ideas to meet the people who could build them.</p></div>
        <div className="compare">
          <div><span className="label">The old way</span>
            <ol><li>Message 500+ people, one by one</li><li>Pitch to the hundreds who reply</li><li>Filter for who likes the idea</li><li>Filter again for who&apos;ll actually work on it</li><li>Maybe find one co-founder, months later</li></ol></div>
          <div className="dark"><span className="label gold">With FBC</span>
            <p className="big">Post once.<br /><em>Get found.</em></p>
            <p className="mt-3">List your idea and the skills you need. Builders who want in apply to you, you review them in your dashboard, and you meet in person at Pitch Night.</p>
            <Link className="btn btn-primary mt-4" href="/matchmaking">See open ventures</Link></div>
        </div>
      </div></section>

      <section className="section"><div className="container">
        <div className="sec-head"><div><span className="label kicker">What you get</span><h2>Everything you need to go from <em>idea</em> to team.</h2></div>
          <p>One place for the whole journey: find people, test the idea, learn from founders, and get on stage.</p></div>
        <div className="bento">
          <Link className="tile t-lg tilt" href="/matchmaking">
            <div className="art"><div className="people">
              {([["Ananya Gupta", "Full-stack dev · 2nd year", 94], ["Arjun Nair", "Hardware / IoT · 4th year", 88], ["Meera Joshi", "Content & growth · 1st year", 81]] as const).map(([n, s, p]) => (
                <div key={n} className="person-chip"><Avatar name={n} /><div><b>{n}</b><small>{s}</small></div><span className="pct">{p}%</span></div>))}
            </div></div>
            <div className="txt"><span className="label gold">Co-founder matchmaking</span><h3 className="mt-1">List your idea. The right builders find you.</h3>
              <p>Founders post what they&apos;re building and who they need. Builders apply with one click, and founders review everyone from their dashboard.</p><span className="arrow-link">Browse ventures</span></div>
          </Link>
          <Link className="tile t-md tilt" href="/validate">
            <div className="art"><svg className="dial" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="var(--line-2)" strokeWidth="8" /><circle cx="60" cy="60" r="50" fill="none" stroke="var(--gold)" strokeWidth="8" strokeLinecap="round" strokeDasharray="314" strokeDashoffset="69" transform="rotate(-90 60 60)" /><text x="60" y="72" textAnchor="middle" className="dial-num">78</text></svg></div>
            <div className="txt"><h3>Validate first</h3><p>A seven-question idea check, plus VistaDex for the deep dive.</p></div>
          </Link>
          <Link className="tile t-md tilt" href="/join">
            <div className="art"><div className="prompt-art"><span className="k">&quot;venture_name&quot;</span>: <span className="v">&quot;Voltway&quot;</span><span className="ai-badge">AI</span><br /><span className="k">&quot;stage&quot;</span>: <span className="v">&quot;Building MVP&quot;</span><span className="ai-badge">AI</span><br /><span className="k">&quot;skills_needed&quot;</span>: [<span className="v">&quot;Finance&quot;</span>]</div></div>
            <div className="txt"><h3>Two-minute profile</h3><p>Let the AI assistant you already use fill it in. You check it before saving.</p></div>
          </Link>
          <Link className="tile t-md tilt" href="/events">
            <div className="art"><div className="dates">{(up.length ? up.slice(0, 3) : [{ id: "x", date: "2026-12-04" }]).map((e) => { const d = parseDay(e.date); return <div key={e.id} className={`date ${e === next || !next ? "on" : ""}`}><b>{d?.getDate()}</b><small>{d?.toLocaleString("en", { month: "short" })}</small></div>; })}</div></div>
            <div className="txt"><h3>Pitch nights and talks</h3><p>{next ? `Next: ${next.title}.` : "Workshops, founder firesides and community meets."}</p></div>
          </Link>
          <Link className="tile t-md tilt" href="/opportunities">
            <div className="art"><div className="roles-art">{opps.slice(0, 3).map((o) => <div key={o.id}><span>{o.title}</span><small>{o.type}</small></div>)}</div></div>
            <div className="txt"><h3>Real startup work</h3><p>Internships, founder&apos;s office roles and projects.</p></div>
          </Link>
          <Link className="tile t-md tilt" href="/journal">
            <div className="art"><div className="pages-art">{ps.slice(0, 3).reverse().map((p) => <div key={p.id}><small>{p.cat}</small>{p.title}</div>)}</div></div>
            <div className="txt"><h3>The Journal</h3><p>Startup stories, failures included, every two weeks.</p></div>
          </Link>
        </div>
      </div></section>

      <section className="section"><div className="container">
        <div className="sec-head"><div><span className="label kicker">How it works</span><h2>Three steps to a team.</h2></div><Link href="/join" className="btn btn-primary">Get started</Link></div>
        <div className="how">
          <div><h3>List or join</h3><p>Sign in with your BITS account. Founders describe the idea and the skills they need; builders say what they&apos;re good at.</p></div>
          <div><h3>Apply and review</h3><p>Builders apply to the ventures they believe in. Founders see every applicant, mark them, and build the team.</p></div>
          <div><h3>Meet at Pitch Night</h3><p>Every listed founder gets a slot to pitch to the room. Conversations start, and teams form in person.</p></div>
        </div>
      </div></section>

      <section className="section"><div className="container">
        <div className="sec-head"><div><span className="label kicker">Open ventures</span><h2>Ideas looking for builders.</h2></div><Link href="/matchmaking" className="arrow-link">All ventures</Link></div>
        <div className="list boxed"><VentureHead />{vs.slice(0, 5).map((v) => <VentureRow key={v.id} v={v} onOpen={openVenture} />)}
          {data && !vs.length && <Empty>No ventures listed yet. Be the first.</Empty>}</div>
      </div></section>

      <section className="section"><div className="container">
        <div className="grid g2" style={{ gap: "4rem", alignItems: "start" }}>
          <div><span className="label kicker">Upcoming</span><h2 className="mt-2" style={{ marginBottom: "2rem" }}>Events</h2>
            <div className="list boxed">{up.slice(0, 4).map((e) => <EventRow key={e.id} e={e} rsvps={rsvps} onChanged={reloadRsvps} />)}
              {data && !up.length && <Empty>New events are announced soon.</Empty>}</div>
            <Link href="/events" className="arrow-link mt-3">All events</Link></div>
          <div><span className="label kicker">From the journal</span><h2 className="mt-2" style={{ marginBottom: "2rem" }}>Latest stories</h2>
            {ps[0] && <PostCard p={ps[0]} />}
            <Link href="/journal" className="arrow-link mt-3">Read the journal</Link></div>
        </div>
      </div></section>
      <Cta />
    </>
  );
}
