/* ==========================================================
   FBC website: router, pages, sign-in, onboarding, dashboard.
   Admin console lives in admin.js. Data access in db.js.
   ========================================================== */
import { db, isAllowedEmail } from "./db.js";
import * as C from "./content.js";
import { aiPrompt, aiSample, parseAiReply, FIELD_LABEL, isFounder, roleName } from "./ai.js";
import { S, $, $$, esc, fmtDate, parseDay, byDateDesc, upcoming, past, stageBar, avatar, dots, toast, openModal, closeModal, md, GOOGLE_ICON } from "./ui.js";
import { adminView, adminActions, adminForms, adminChange } from "./admin.js";

const app = $("#app");
const views = {};
const actions = {};   // data-act="name" click handlers
const forms = {};     // data-form="name" submit handlers

/* ---------- shared fragments ---------- */
const pageHead = (label, title, lead, extra = "") => `
  <section class="page-head"><div class="container">
    <span class="label">${label}</span><h1>${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ""}${extra}
  </div></section>`;

const ventureHead = () => `<div class="list-row v-row v-head"><span class="label">Venture</span><span class="label">Domain</span><span class="label">Stage</span><span class="label needs">Looking for</span><span></span></div>`;
const ventureRow = (v) => `
  <button class="list-row v-row" data-act="venture" data-id="${esc(v.id)}">
    <span><span class="title">${esc(v.name)}</span><br/><span class="tagline">${esc(v.pitch)}</span></span>
    <span class="small muted">${esc((v.domains || []).join(", "))}</span>
    <span class="small muted">${stageBar(v.stage)}${esc(C.STAGES[v.stage] || "")}</span>
    <span class="small muted needs">${esc((v.needs || []).join(", "))}</span>
    <span class="go" aria-hidden="true">→</span>
  </button>`;

const isPastDate = (d) => (d || "") < new Date().toISOString().slice(0, 10);
const eventRow = (e, rsvps = []) => {
  const d = parseDay(e.date);
  const going = rsvps.includes(e.id);
  return `
  <div class="list-row e-row clickable" data-act="event" data-id="${esc(e.id)}">
    <div class="e-date"><b>${d ? d.getDate() : ""}</b>${d ? d.toLocaleString("en", { month: "short" }) + " " + d.getFullYear() : ""}</div>
    <div><span class="title">${esc(e.title)}</span><div class="tagline">${dots([e.type, e.time, e.venue])}</div></div>
    <div>${isPastDate(e.date) ? `<span class="label">Past</span>` : `<button class="btn btn-sm" data-act="rsvp" data-id="${esc(e.id)}">${going ? "Going ✓" : "RSVP"}</button>`}</div>
  </div>`;
};

const postCard = (p) => `
  <a class="post" href="#journal-${esc(p.id)}">
    <span class="label">${esc(p.cat)} · ${fmtDate(p.date)}</span>
    <h3>${esc(p.title)}</h3>
    <p>${esc(p.excerpt)}</p>
    <span class="xs faint">${esc(p.author)}${p.read ? ` · ${esc(p.read)} read` : ""}</span>
  </a>`;

const cta = () => `
  <section class="cta"><div class="container">
    <span class="label">Join</span>
    <h2 class="mt-2">Have an idea? <em>Find your people.</em></h2>
    <p class="lead mt-3">Free for every BITSian, from any branch or year. Sign in with your BITS Google account.</p>
    <div class="row mt-4"><a href="#join" class="btn btn-primary btn-lg">Join FBC</a><a href="${esc(S.settings.whatsapp)}" target="_blank" rel="noopener" class="btn btn-lg">WhatsApp community</a></div>
  </div></section>`;

const signInPrompt = (what) => `<div class="empty"><p>Sign in with your BITS account to ${what}.</p><div class="row mt-2" style="justify-content:center"><a href="#login" class="btn btn-primary btn-sm">Sign in</a></div></div>`;
const statusLabel = (s) => ({ new: "New", reviewing: "Reviewing", accepted: "Accepted", declined: "Declined", live: "Live", paused: "Paused", hidden: "Hidden" }[s] || s);

/* ==========================================================
   PUBLIC PAGES
   ========================================================== */
views.home = async () => {
  const [ventures, events, posts] = await Promise.all([db.list("ventures"), db.list("events"), db.list("posts")]);
  const vs = ventures.sort(byDateDesc("updatedAt")).slice(0, 5);
  const up = upcoming(events).slice(0, 3);
  const ps = posts.sort(byDateDesc("date")).slice(0, 3);
  const rsvps = S.user ? await db.myRsvps(S.user.uid).catch(() => []) : [];
  return `
  <section class="hero"><div class="container">
    <div class="hero-grid">
      <div>
        <span class="label">BITS Pilani · Student community · Since 2026</span>
        <h1>Find the people<br/>to <em>build it</em> with.</h1>
        <p class="lead">Founders and Builders Collective connects BITSians who have ideas with BITSians who want to build them. Find a co-founder, join a startup, and learn how companies actually get made.</p>
        <div class="row"><a href="#join" class="btn btn-primary btn-lg">Join FBC</a><a href="#matchmaking" class="btn btn-lg">Browse ventures</a></div>
      </div>
      <figure class="hero-figure">
        <img src="assets/campus.webp" alt="Line drawing of the BITS Pilani clock tower" width="470" height="350"/>
        <figcaption><span class="label">Clock Tower, Pilani</span><span class="label">Ideas / People / Impact</span></figcaption>
      </figure>
    </div>
    <div class="facts">
      <div class="fact"><b>1,200</b><span>students join BITS Pilani every year, and many arrive wanting to build something.</span></div>
      <div class="fact"><b>20–25</b><span>seats a year in established clubs, for the hundreds who apply.</span></div>
      <div class="fact"><b>1 profile</b><span>is all it takes here to reach every builder on campus.</span></div>
    </div>
  </div></section>

  <section class="section"><div class="container sec-grid">
    <span class="label">01 — The problem</span>
    <div>
      <h2>Finding a co-founder shouldn't take a semester.</h2>
      <p class="lead mt-3">Interest and ability were never the issue on this campus. There just wasn't a place for people with ideas to meet the people who could build them.</p>
      <div class="compare mt-4">
        <div><span class="label">Without FBC</span>
          <ol><li>Message 500+ people, one by one</li><li>Pitch to the hundreds who reply</li><li>Filter for who likes the idea</li><li>Filter again for who'll actually work on it</li><li>Maybe find one co-founder, months later</li></ol></div>
        <div><span class="label gold">With FBC</span>
          <p class="big">Post once.<br/>Get found.</p>
          <p class="mt-2">List your idea and the skills you need. Builders who want in apply to you, and you meet them in person at Pitch Night.</p>
          <a class="arrow-link mt-3" href="#matchmaking">See open ventures</a></div>
      </div>
    </div>
  </div></section>

  <section class="section"><div class="container sec-grid">
    <span class="label">02 — What we do</span>
    <div>
      <h2>Learn, connect, build, pitch.</h2>
      <div class="cols mt-4">
        ${[["Learn", "Workshops, founder talks, case studies and a growing library of resources.", ["Knowledge sessions", "Startup case studies", "Founder interviews"]],
           ["Connect", "Meet people with complementary skills. Find co-founders and collaborators.", ["Co-founder matchmaking", "Member profiles", "Community meets"]],
           ["Build", "Move from idea to execution on real problems with real teams.", ["Ideation sessions", "Validation exercises", "MVP challenges"]],
           ["Pitch", "Present your work, get honest feedback, and find what comes next.", ["Pitch nights", "Demo days", "Mentor introductions"]]]
          .map(([t, d, l], i) => `<div class="col"><span class="label">0${i + 1}</span><h3>${t}</h3><p>${d}</p><ul>${l.map((x) => `<li>${x}</li>`).join("")}</ul></div>`).join("")}
      </div>
    </div>
  </div></section>

  <section class="section"><div class="container">
    <div class="sec-head"><div><span class="label">03 — Open ventures</span><h2 class="mt-2">Ideas looking for builders.</h2></div>
      <a href="#matchmaking" class="arrow-link">All ventures</a></div>
    <div class="list">${ventureHead()}${vs.map(ventureRow).join("") || `<div class="empty">No ventures listed yet. Be the first.</div>`}</div>
  </div></section>

  <section class="section"><div class="container">
    <div class="feature">
      <div><span class="label">04 — Validate</span>
        <h2 class="mt-2">Test your idea <em>before</em> you build it.</h2>
        <p class="lead mt-3">Most startups fail because nobody needed what they built. Run our seven-question check in two minutes, or go deeper with VistaDex, built by an FBC member.</p>
        <div class="row mt-4"><a href="#validate" class="btn btn-primary">Check my idea</a></div></div>
      <div><ol>
        <li><div><h3>Name the problem</h3><p class="small mt-1">In one sentence, without mentioning your solution.</p></div></li>
        <li><div><h3>Find who has it</h3><p class="small mt-1">A specific group you can reach this week, not "everyone".</p></div></li>
        <li><div><h3>Look for proof</h3><p class="small mt-1">Workarounds, money spent, people asking to pay.</p></div></li>
      </ol></div>
    </div>
  </div></section>

  <section class="section"><div class="container">
    <div class="sec-head"><div><span class="label">05 — Upcoming</span><h2 class="mt-2">Events</h2></div><a href="#events" class="arrow-link">All events</a></div>
    <div class="list">${up.map((e) => eventRow(e, rsvps)).join("") || `<div class="empty">New events are announced soon.</div>`}</div>
  </div></section>

  <section class="section"><div class="container">
    <div class="sec-head"><div><span class="label">06 — Journal</span><h2 class="mt-2">Startup stories and analysis</h2></div><a href="#journal" class="arrow-link">Read the journal</a></div>
    <div class="grid g3">${ps.map(postCard).join("")}</div>
  </div></section>
  ${cta()}`;
};

/* ---------- matchmaking ---------- */
views.matchmaking = async () => {
  const ventures = await db.list("ventures");
  S.cache.ventures = ventures.sort(byDateDesc("updatedAt"));
  S.cache.builders = S.user ? (await db.members("builder").catch(() => [])).filter((b) => b.id !== S.user.uid) : null;
  const t = S.mm.tab;
  return `
  ${pageHead("Co-founder matchmaking", "Find, match, build.", "Founders list their idea and the skills they need. Builders apply to the ventures they believe in. Everyone meets at Pitch Night.",
    `<div class="row"><a href="#join" class="btn btn-primary" data-act="pick-role" data-role="founder">List your idea</a><a href="#join" class="btn" data-act="pick-role" data-role="builder">Create a builder profile</a></div>`)}
  <section class="container" style="padding-bottom:96px">
    <div class="toolbar">
      <div class="seg" role="tablist"><button data-act="mm-tab" data-tab="ventures" class="${t === "ventures" ? "on" : ""}">Ventures <span class="faint">${ventures.length}</span></button><button data-act="mm-tab" data-tab="builders" class="${t === "builders" ? "on" : ""}">Builders</button></div>
      <input class="input grow" id="mmQ" placeholder="Search ${t}" value="${esc(S.mm.q)}" aria-label="Search"/>
      <select class="input" id="mmDomain" aria-label="Domain"><option value="">All domains</option>${C.DOMAINS.map((d) => `<option ${S.mm.domain === d ? "selected" : ""}>${d}</option>`).join("")}</select>
      <select class="input" id="mmSkill" aria-label="Skill"><option value="">${t === "ventures" ? "Any skill needed" : "Any skill"}</option>${C.SKILLS.map((d) => `<option ${S.mm.skill === d ? "selected" : ""}>${d}</option>`).join("")}</select>
    </div>
    <div class="list" id="mmList">${mmList()}</div>
  </section>`;
};
function mmList() {
  const { tab, q, domain, skill } = S.mm;
  const qq = q.toLowerCase();
  if (tab === "ventures") {
    const rows = (S.cache.ventures || []).filter((v) => (!qq || `${v.name} ${v.pitch} ${v.founderName}`.toLowerCase().includes(qq)) && (!domain || (v.domains || []).includes(domain)) && (!skill || (v.needs || []).includes(skill)));
    return ventureHead() + (rows.map(ventureRow).join("") || `<div class="empty">No ventures match those filters.</div>`);
  }
  if (!S.cache.builders) return signInPrompt("see builder profiles");
  const rows = S.cache.builders.filter((b) => (!qq || `${b.name} ${b.bio} ${b.looking}`.toLowerCase().includes(qq)) && (!domain || (b.domains || []).includes(domain)) && (!skill || (b.skills || []).includes(skill)));
  return rows.map((b) => `
    <div class="list-row" style="grid-template-columns:auto 2fr 1.4fr auto">
      ${avatar(b.name, b.photo)}
      <div><span class="title">${esc(b.name)}</span> <span class="xs faint">${esc(b.year || "")}</span><div class="tagline">${esc(b.bio || b.looking || "")}</div></div>
      <div class="small muted">${esc((b.skills || []).join(", "))}</div>
      ${isFounder(S.profile) ? `<button class="btn btn-sm" data-act="invite" data-name="${esc(b.name)}" data-email="${esc(b.email || "")}">Invite</button>` : `<span></span>`}
    </div>`).join("") || `<div class="empty">No builders match those filters yet.</div>`;
}

async function ventureModal(id) {
  const v = (S.cache.ventures || []).find((x) => x.id === id) || await db.get("ventures", id);
  if (!v) return toast("That venture is no longer listed");
  const mine = S.user && v.founderUid === S.user.uid;
  const apps = S.user && !mine ? await db.myApplications(S.user.uid).catch(() => []) : [];
  const applied = apps.find((a) => a.ventureId === v.id);
  let action;
  if (!S.user) action = `<div class="mt-4"><p class="small">Sign in with your BITS account to apply.</p><a class="btn btn-primary mt-2" href="#login" data-close>Sign in to apply</a></div>`;
  else if (mine) action = `<p class="small mt-4">This is your venture. Manage it from your <a class="link" href="#dashboard" data-close>dashboard</a>.</p>`;
  else if (applied) action = `<div class="notice mt-4"><span>You applied on ${fmtDate(applied.createdAt)}. Status: <span class="status ${applied.status}">${statusLabel(applied.status)}</span></span></div>`;
  else action = `<form data-form="apply" data-id="${esc(v.id)}" class="mt-4">
      <div class="field"><label for="applyMsg">Why do you want to build this, and what would you bring?</label><textarea class="input" id="applyMsg" name="message" required maxlength="2000" placeholder="Keep it short and honest. The founder sees your profile too."></textarea></div>
      <button class="btn btn-primary mt-2">Apply to join ${esc(v.name)}</button></form>`;
  openModal(`
    <span class="label">${esc((v.domains || []).join(" · "))}</span>
    <h2 id="modalTitle" class="mt-1">${esc(v.name)}</h2>
    <p class="small mt-1">${esc(v.founderName || "")}${v.founderYear ? ", " + esc(v.founderYear) : ""}</p>
    <p class="mt-3" style="color:var(--text)">${esc(v.pitch)}</p>
    ${v.problem ? `<p class="mt-2">${esc(v.problem)}</p>` : ""}
    <table class="table mt-3"><tbody>
      <tr><td>Stage</td><td>${stageBar(v.stage)}${esc(C.STAGES[v.stage] || "")}</td></tr>
      <tr><td>Looking for</td><td>${esc((v.needs || []).join(", "))}</td></tr>
      ${v.commitment ? `<tr><td>Commitment</td><td>${esc(v.commitment)}</td></tr>` : ""}
      ${v.equity ? `<tr><td>Equity</td><td>${esc(v.equity)}</td></tr>` : ""}
    </tbody></table>
    ${action}`);
}

/* ---------- validate ---------- */
const QUESTIONS = [
  ["problem", "I can describe the problem in one sentence, without mentioning my solution."],
  ["who", "I know exactly who has this problem: a specific group, not “everyone”."],
  ["talked", "I've talked to at least 10 people who have this problem."],
  ["pain", "They're actively trying to solve it today, with workarounds, money or time."],
  ["alt", "I know the existing alternatives and why they fall short."],
  ["pay", "Someone has said they'd pay, pre-order, or sign up for this."],
  ["why", "I know why we're the right people to build this, and why now."],
];
const ideaScore = (ans) => Math.round((Object.values(ans || {}).reduce((a, b) => a + b, 0) / (QUESTIONS.length * 2)) * 100);
views.validate = async () => {
  const s = S.settings;
  return `
  ${pageHead("Validate", "Test it <em>before</em> you build it.", "Most startups don't fail because they can't build. They fail because nobody needed what they built.")}
  <section class="section first"><div class="container">
    <div class="feature">
      <div><span class="label gold">Featured tool</span>
        <h2 class="mt-2">VistaDex</h2>
        <p class="lead mt-3">${esc(s.vistadexBlurb)}</p>
        <p class="small mt-2">Built by an FBC member. Free for the community.</p>
        <div class="row mt-4">${s.vistadexUrl ? `<a class="btn btn-primary" href="${esc(s.vistadexUrl)}" target="_blank" rel="noopener">Open VistaDex ↗</a>` : `<button class="btn" disabled>Link coming soon</button>`}<a class="arrow-link" href="#validate" data-act="scroll" data-to="quickcheck">Or try the quick check</a></div></div>
      <div><ol>
        <li><div><h3>Market and problem</h3><p class="small mt-1">Is the problem real, and big enough to matter?</p></div></li>
        <li><div><h3>Competition</h3><p class="small mt-1">Who else is solving it, and how you're different.</p></div></li>
        <li><div><h3>Risks and next steps</h3><p class="small mt-1">What to test next, in order.</p></div></li>
      </ol></div>
    </div>
  </div></section>
  <section class="section" id="quickcheck"><div class="narrow">
    <span class="label">Quick idea check · Free, no sign-in</span>
    <h2 class="mt-2">How validated is your idea?</h2>
    <p class="mt-2">Be honest. ${S.user ? "Your result is saved to your dashboard, visible only to you." : "Nothing is saved unless you're signed in."}</p>
    <form data-form="ideacheck" class="mt-4">
      <div class="field"><label for="idea">Your idea in one line</label><input class="input" id="idea" name="idea" placeholder="Battery-swap stations for campus e-scooters" required maxlength="200"/></div>
      <div class="list mt-3">
      ${QUESTIONS.map(([k, q], i) => `
        <div class="list-row" style="grid-template-columns:2rem 1fr auto">
          <span class="label">0${i + 1}</span><span>${q}</span>
          <div class="seg" data-q="${k}">${["No", "Partly", "Yes"].map((o, j) => `<button type="button" data-act="answer" data-v="${j}">${o}</button>`).join("")}</div>
        </div>`).join("")}
      </div>
      <p class="error mt-2" id="icErr"></p>
      <button class="btn btn-primary btn-lg mt-2">Get my score</button>
    </form>
    <div id="icResult"></div>
  </div></section>`;
};
function ideaResult(idea, ans) {
  const score = ideaScore(ans);
  const weak = QUESTIONS.filter(([k]) => ans[k] < 2);
  const verdict = score >= 75 ? ["Strong signal", "You've done real homework. Find a team and build an MVP."]
    : score >= 45 ? ["Promising, with gaps", "There's something here. Close the gaps below before writing code."]
    : ["Still an assumption", "That's normal at the start. Go and talk to people who have this problem."];
  const tips = { problem: "Write the problem without your solution in it.", who: "Narrow it to one specific group you can reach this week.", talked: "Do 10 problem interviews. Read The Mom Test first.", pain: "Look for people already hacking together workarounds.", alt: "List five alternatives, including doing nothing.", pay: "Try a landing page, a waitlist or pre-orders.", why: "Write down your unfair advantage, then test it." };
  return `
    <div class="panel mt-4 fade">
      <div class="row" style="gap:2rem;align-items:flex-end"><div class="score">${score}</div><div><span class="label gold">${verdict[0]}</span><h3 class="mt-1">“${esc(idea)}”</h3><p class="small mt-1">${verdict[1]}</p></div></div>
      ${weak.length ? `<h3 class="mt-4">What to do next</h3><ul class="mt-1" style="margin-left:1.1rem;color:var(--text-2)">${weak.map(([k]) => `<li>${tips[k]}</li>`).join("")}</ul>` : ""}
      <div class="row mt-4">${S.settings.vistadexUrl ? `<a href="${esc(S.settings.vistadexUrl)}" target="_blank" rel="noopener" class="btn btn-primary">Go deeper on VistaDex ↗</a>` : ""}<a href="#join" class="btn">Find co-founders</a><a href="#events" class="arrow-link">Pitch it at an event</a></div>
    </div>`;
}

/* ---------- opportunities ---------- */
views.opportunities = async () => {
  const all = (await db.list("opportunities")).sort((a, b) => String(a.deadline).localeCompare(String(b.deadline)));
  S.cache.opps = all;
  const list = all.filter((o) => S.opp === "All" || o.type === S.opp);
  return `
  ${pageHead("Opportunities", "Work with real startups.", "Internships, founder's office roles and projects with campus and outside startups. The fastest way to learn is to work on something real.")}
  <section class="container" style="padding-bottom:96px">
    <div class="toolbar"><div class="seg">${["All", ...C.OPP_TYPES].map((t) => `<button data-act="opp-type" data-type="${t}" class="${S.opp === t ? "on" : ""}">${t}</button>`).join("")}</div>
      <span class="xs faint" style="margin-left:auto">${list.length} open</span></div>
    <div class="list">${list.map((o) => `
      <div class="list-row" style="grid-template-columns:2fr 1.3fr 1fr auto">
        <div><span class="title">${esc(o.title)}</span><div class="tagline">${esc(o.org)}</div></div>
        <div class="small muted">${dots([o.type, o.mode, o.duration])}</div>
        <div class="small muted">${esc(o.stipend || "")}<div class="xs faint">${o.deadline ? "Apply by " + fmtDate(o.deadline, { day: "numeric", month: "short" }) : ""}</div></div>
        ${o.url ? `<a class="btn btn-sm" href="${esc(o.url)}" target="_blank" rel="noopener">Apply ↗</a>` : `<button class="btn btn-sm" data-act="interest" data-id="${esc(o.id)}">I'm interested</button>`}
      </div>`).join("") || `<div class="empty">Nothing open in this category right now.</div>`}</div>
    <div class="notice mt-4"><div><h3>Hiring students?</h3><p class="small">List an internship, project or role and reach the FBC community.</p></div><button class="btn" data-act="post-opp">Post an opportunity</button></div>
  </section>`;
};

/* ---------- events ---------- */
views.events = async () => {
  const events = await db.list("events");
  S.cache.events = events;
  const rsvps = S.user ? await db.myRsvps(S.user.uid).catch(() => []) : [];
  return `
  ${pageHead("Events", "Show up. Meet people. Pitch.", "Pitch nights, workshops, founder firesides and community meets. Announcements also go out on the WhatsApp community.")}
  <section class="container section-sm">
    <span class="label">Upcoming</span>
    <div class="list mt-2">${upcoming(events).map((e) => eventRow(e, rsvps)).join("") || `<div class="empty">New events are announced soon.</div>`}</div>
    <span class="label" style="display:block;margin-top:4rem">Past</span>
    <div class="list mt-2">${past(events).map((e) => eventRow(e)).join("")}</div>
  </section>
  ${cta()}`;
};
async function eventModal(id) {
  const e = (S.cache.events || []).find((x) => x.id === id) || await db.get("events", id);
  if (!e) return;
  const going = S.user ? (await db.myRsvps(S.user.uid).catch(() => [])).includes(id) : false;
  openModal(`<span class="label">${esc(e.type)}</span><h2 id="modalTitle" class="mt-1">${esc(e.title)}</h2>
    <p class="small mt-2">${dots([fmtDate(e.date, { weekday: "long", day: "numeric", month: "long" }), e.time, e.venue])}</p>
    <p class="mt-3">${esc(e.desc)}</p>
    ${isPastDate(e.date) ? `<p class="label mt-4">This event has passed</p>` : `<button class="btn btn-primary mt-4" data-act="rsvp" data-id="${esc(e.id)}">${going ? "You're going. Cancel RSVP" : "RSVP"}</button>`}`);
}

/* ---------- journal ---------- */
views.journal = async () => {
  const posts = (await db.list("posts")).sort(byDateDesc("date"));
  const feat = posts.find((p) => p.featured) || posts[0];
  const list = posts.filter((p) => (S.jcat !== "All" || p !== feat) && (S.jcat === "All" || p.cat === S.jcat));
  return `
  ${pageHead("Journal", "Startup stories, analysis and the newsletter.", "One company per story: why it started, the problem, the business model, the money, and the mistakes. The ones that didn't make it too.")}
  <section class="container section-sm">
    ${feat && S.jcat === "All" ? `<a class="post" href="#journal-${esc(feat.id)}" style="border:0;padding:0">
      <span class="label gold">Featured · ${esc(feat.cat)}</span>
      <h3 style="font-size:clamp(2rem,4vw,3rem);max-width:22ch">${esc(feat.title)}</h3>
      <p class="lead">${esc(feat.excerpt)}</p><span class="xs faint">${esc(feat.author)} · ${fmtDate(feat.date)}${feat.read ? ` · ${esc(feat.read)} read` : ""}</span></a>` : ""}
    <div class="toolbar mt-4"><div class="seg">${["All", ...C.POST_CATS].map((c) => `<button data-act="jcat" data-cat="${c}" class="${S.jcat === c ? "on" : ""}">${c}</button>`).join("")}</div></div>
    <div class="grid g3">${list.map(postCard).join("") || `<div class="empty" style="grid-column:1/-1">No posts here yet.</div>`}</div>
  </section>
  <section class="section"><div class="container">${newsletter()}</div></section>`;
};
const newsletter = () => `
  <div class="feature"><div><span class="label">The Builder's Brief</span><h2 class="mt-2">One startup story in your inbox, every two weeks.</h2></div>
    <div><form data-form="subscribe" class="field"><label for="nlEmail">Email</label><div class="row"><input class="input" id="nlEmail" type="email" name="email" placeholder="you@pilani.bits-pilani.ac.in" required style="flex:1"/><button class="btn btn-primary">Subscribe</button></div><span class="hint">No spam. Unsubscribe any time.</span></form></div></div>`;

views.post = async (id) => {
  const p = await db.get("posts", id).catch(() => null);
  if (!p || (!p.published && !S.admin)) return views.notfound();
  return `
  <article class="article"><div class="narrow">
    <a href="#journal" class="link small">← Journal</a>
    <span class="label" style="display:block;margin-top:2rem">${esc(p.cat)} · ${fmtDate(p.date)}${p.read ? ` · ${esc(p.read)} read` : ""}</span>
    <h1>${esc(p.title)}</h1>
    <p class="lead">${esc(p.excerpt)}</p>
    <p class="small mt-3">By ${esc(p.author)}</p>
    <div class="prose">${md(p.body || "")}</div>
    <div class="mt-5">${newsletter()}</div>
  </div></article>`;
};

/* ---------- resources ---------- */
views.resources = async () => {
  const res = (await db.list("resources")).sort((a, b) => (a.order || 0) - (b.order || 0));
  return `
  ${pageHead("Resources", "The founder's library.", "Guides, templates, books and tools picked by the Research & Knowledge team.")}
  <section class="container section-sm">
    ${C.SHELVES.map((sh) => { const items = res.filter((r) => r.shelf === sh); return items.length ? `
      <div class="sec-grid" style="margin-bottom:3.5rem"><span class="label">${sh}</span>
        <div class="list">${items.map((r) => `
          <div class="list-row" style="grid-template-columns:1fr auto">
            <div><span class="title">${esc(r.title)}</span>${r.featured ? ` <span class="tag gold" style="margin-left:.4rem">Featured</span>` : ""}<div class="tagline">${esc(r.desc)}</div></div>
            ${r.url ? `<a class="arrow-link small" href="${esc(r.url)}" ${r.url.startsWith("#") ? "" : 'target="_blank" rel="noopener"'}>Open</a>` : `<span class="xs faint">Coming soon</span>`}
          </div>`).join("")}</div></div>` : ""; }).join("")}
  </section>`;
};

/* ---------- about (mission, roadmap, team) ---------- */
views.about = async () => `
  ${pageHead("About", "A community that learns by building.", "FBC is a student-run entrepreneurship community at BITS Pilani. We don't expect every member to become a founder. We want every member to understand how startups work, meet the right people, and try building something.")}
  <section class="section first"><div class="container sec-grid">
    <span class="label">Mission</span>
    <div><h2>Make entrepreneurship open to every BITSian.</h2>
      <div class="cols three mt-4">
        <div class="col"><h3>Accessible</h3><p>Any branch, any year, with or without an idea. No selection process to get in.</p></div>
        <div class="col"><h3>Practical</h3><p>Real problems, real startups, real feedback. Less theory, more doing.</p></div>
        <div class="col"><h3>Collaborative</h3><p>Building a startup shouldn't be a lonely ambition. Find the people to do it with.</p></div>
      </div></div>
  </div></section>
  <section class="section"><div class="container sec-grid">
    <span class="label">Roadmap</span>
    <div><h2>Where we've been, where we're going.</h2>
      <div class="timeline mt-4">${C.ROADMAP.map((r) => `
        <div class="tl ${r.status}"><span class="label">${r.phase} · ${r.when}${r.status === "now" ? " · In progress" : ""}</span><h3>${r.title}</h3><ul>${r.items.map((x) => `<li>${x}</li>`).join("")}</ul></div>`).join("")}</div></div>
  </div></section>
  <section class="section"><div class="container sec-grid">
    <span class="label">Team</span>
    <div><h2>Run by students.</h2><p class="lead mt-2">We're recruiting more core members. Write to us if you want to help build FBC.</p>
      <div class="grid g3 mt-4">${C.TEAM.map((t) => `<div class="person">${avatar(t.name, "", "avatar-lg")}<div><h3>${esc(t.name)}</h3><p class="small">${esc(t.role)}</p></div></div>`).join("")}</div></div>
  </div></section>
  ${cta()}`;
views.roadmap = views.about;

/* ---------- contact ---------- */
views.contact = async () => `
  ${pageHead("Contact", "Write to us.", "Questions, event ideas, partnerships, speaking, or listing your startup. We read everything.")}
  <section class="section first"><div class="container"><div class="grid g2" style="gap:4rem;align-items:start">
    <form data-form="contact" class="grid" style="gap:1.25rem">
      <div class="form-grid">
        <div class="field"><label for="cName">Name</label><input class="input" id="cName" name="name" required value="${esc(S.profile?.name || S.user?.name || "")}"/></div>
        <div class="field"><label for="cEmail">Email</label><input class="input" id="cEmail" type="email" name="email" required value="${esc(S.user?.email || "")}"/></div>
        <div class="field full"><label for="cAs">You are</label><select class="input" id="cAs" name="extra"><option>A student</option><option>A startup or founder</option><option>A speaker or mentor</option><option>An investor</option><option>A sponsor or partner</option><option>Something else</option></select></div>
        <div class="field full"><label for="cMsg">Message</label><textarea class="input" id="cMsg" name="body" required maxlength="4000"></textarea></div>
      </div>
      <div><button class="btn btn-primary">Send message</button></div>
    </form>
    <div>
      <div class="list">
        <a class="list-row" style="grid-template-columns:1fr auto" href="${esc(S.settings.whatsapp)}" target="_blank" rel="noopener"><div><span class="title">WhatsApp community</span><div class="tagline">The fastest way to reach us and hear about events.</div></div><span class="go">↗</span></a>
        <a class="list-row" style="grid-template-columns:1fr auto" href="${esc(S.settings.joinForm)}" target="_blank" rel="noopener"><div><span class="title">Join form</span><div class="tagline">Tell us what you'd like FBC to organise.</div></div><span class="go">↗</span></a>
        ${S.settings.contactEmail ? `<div class="list-row" style="grid-template-columns:1fr"><div><span class="title">Email</span><div class="tagline">${esc(S.settings.contactEmail)}</div></div></div>` : ""}
      </div>
      <div class="faq mt-4">
        <span class="label">Questions</span>
        ${[["Do I need a startup idea to join?", "No. Many members join to learn, to explore, or to join someone else's venture. You can start anywhere."],
           ["Who can join?", "Any BITS student, from any branch or year, with any level of experience. Sign in with your BITS Google account."],
           ["Won't someone steal my idea if I list it?", "People can only join you if they know what you're building. Ideas are cheap; execution is what counts."],
           ["How does matchmaking work?", "Founders list their idea and who they need. Builders apply. The founder reviews applications, and everyone meets at Pitch Night."],
           ["Is there a fee?", "No. FBC is free for students."]].map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}
      </div>
    </div>
  </div></div></section>`;

views.notfound = async () => `<section class="section first"><div class="container"><span class="label">404</span><h1 class="mt-2">Not built yet.</h1><p class="lead mt-3">This page doesn't exist. Fitting, for a builders' club.</p><a href="#home" class="btn btn-primary mt-4">Back home</a></div></section>`;

/* ==========================================================
   SIGN IN / JOIN
   ========================================================== */
const authArt = (quote, cite) => `
  <aside class="auth-art"><span class="label">Founders &amp; Builders Collective</span>
    <div><blockquote>${quote}</blockquote><cite>${cite}</cite></div>
    <img src="assets/campus.webp" alt="" aria-hidden="true"/></aside>`;
const signInFields = () => db.mode === "demo"
  ? `<div class="demo-note mt-3">Demo mode. Once the site is connected to Firebase this becomes a "Continue with Google" button. For now, enter any BITS email.</div>
     <div class="field mt-3"><label for="dName">Name</label><input class="input" id="dName" name="name" placeholder="Your name"/></div>
     <div class="field mt-2"><label for="dEmail">BITS email</label><input class="input" id="dEmail" type="email" name="email" placeholder="f2024xxxx@pilani.bits-pilani.ac.in" required/></div>
     <button class="btn btn-primary btn-block btn-lg mt-3">Continue</button>`
  : `<button class="btn btn-block btn-lg btn-google mt-4">${GOOGLE_ICON} Continue with Google</button>
     <p class="hint mt-2">Use your BITS account: Pilani, Goa, Hyderabad or Dubai.</p>`;

views.join = async () => {
  if (S.user && S.profile) return redirect("dashboard");
  const roles = [["founder", "Founder", "I have an idea and need a team"], ["builder", "Builder", "I want to join a team and build"], ["explorer", "Explorer", "I'm curious about startups"]];
  return `
  <section class="auth fade">
    ${authArt("We want to learn entrepreneurship. If you're willing to join us, let's learn it together.", "FBC, first meetup")}
    <div class="auth-main"><form class="auth-card" data-form="signin">
      <span class="label">Join FBC</span><h2>Create your profile</h2>
      <p class="small">Free for every BITSian. Takes about two minutes, less if your AI assistant helps.</p>
      <div class="roles" role="radiogroup" aria-label="I'm joining as">
        ${roles.map(([k, t, d]) => `<button type="button" class="role ${S.pendingRole === k ? "on" : ""}" data-act="pick-role" data-role="${k}" role="radio" aria-checked="${S.pendingRole === k}"><b>${t}</b><small>${d}</small><span class="radio"></span></button>`).join("")}
      </div>
      ${signInFields()}
      <p class="error mt-2" id="authErr"></p>
      <p class="small mt-3">Already a member? <a class="link" href="#login">Sign in</a></p>
    </form></div>
  </section>`;
};
views.login = async () => {
  if (S.user && S.profile) return redirect("dashboard");
  return `
  <section class="auth fade">
    ${authArt("People can only join you if they know what you're building.", "A lesson from our founder")}
    <div class="auth-main"><form class="auth-card" data-form="signin">
      <span class="label">Welcome back</span><h2>Sign in</h2>
      <p class="small">With your BITS Google account.</p>
      ${signInFields()}
      <p class="error mt-2" id="authErr"></p>
      <p class="small mt-3">New here? <a class="link" href="#join">Join FBC</a></p>
    </form></div>
  </section>`;
};
forms.signin = async (f) => {
  const err = $("#authErr"); err.textContent = "";
  const btn = $("button.btn-primary, button.btn-google", f); btn.disabled = true;
  try {
    const opts = db.mode === "demo" ? { name: f.name?.value.trim(), email: f.email?.value.trim() } : {};
    if (db.mode === "demo" && !isAllowedEmail(opts.email)) throw new Error("not-bits");
    const user = await db.signIn(opts);
    await loadUser(user);
    if (!S.profile) {
      S.profile = await db.saveProfile(user.uid, { name: user.name, role: S.pendingRole || "builder", photo: user.photo || "" });
      S.draft = null; S.ob = { step: 0, mode: null };
      toast("Welcome to FBC. Let's set up your profile.");
      go("onboarding");
    } else { toast(`Welcome back, ${String(S.profile.name).split(" ")[0]}`); go("dashboard"); }
  } catch (e) {
    console.error(e);
    err.textContent = e.message === "not-bits" ? "Please use your BITS email address." : e.code === "auth/popup-closed-by-user" ? "Sign-in was cancelled." : e.code === "auth/popup-blocked" ? "Your browser blocked the sign-in window. Allow pop-ups for this site and try again." : "Couldn't sign you in. Please try again.";
  } finally { btn.disabled = false; }
};

/* ==========================================================
   ONBOARDING (manual or AI-assisted)
   ========================================================== */
const stepLabels = (u) => (isFounder(u) ? ["About you", "Your venture", "Who you need"] : ["About you", "Skills", "Interests"]);
function stepBody(s, u) {
  const founder = isFounder(u);
  const chips = (list, key) => `<div class="chips" data-chips="${key}">${list.map((x) => `<button type="button" class="chip ${(u[key] || []).includes(x) ? "on" : ""}" data-act="chip">${x}</button>`).join("")}</div>`;
  const opts = (list, val) => `<option value="" ${val ? "" : "selected"} disabled>Choose</option>` + list.map((o) => `<option ${val === o ? "selected" : ""}>${o}</option>`).join("");
  if (s === 0) return `
    <div class="form-grid">
      <div class="field"><label>Full name</label><input class="input" name="name" value="${esc(u.name || "")}" required maxlength="80"/></div>
      <div class="field"><label>Year and branch</label><input class="input" name="year" value="${esc(u.year || "")}" placeholder="2nd year, CS" maxlength="60"/></div>
      <div class="field full"><label>One-line bio</label><input class="input" name="bio" value="${esc(u.bio || "")}" placeholder="What drives you?" maxlength="160"/></div>
      <div class="field"><label>LinkedIn</label><input class="input" name="linkedin" value="${esc(u.linkedin || "")}" placeholder="linkedin.com/in/…" maxlength="200"/></div>
      <div class="field"><label>Availability</label><select class="input" name="avail">${opts(C.AVAIL, u.avail)}</select></div>
    </div>`;
  if (s === 1 && founder) return `
    <div class="form-grid">
      <div class="field"><label>Venture name</label><input class="input" name="vname" value="${esc(u.vname || "")}" placeholder="A working name is fine" maxlength="60"/></div>
      <div class="field"><label>Stage</label><select class="input" name="vstage">${C.STAGES.map((o, i) => `<option value="${i}" ${+u.vstage === i ? "selected" : ""}>${o}</option>`).join("")}</select></div>
      <div class="field full"><label>The problem you're solving</label><textarea class="input" name="vproblem" placeholder="Who has this problem, and how do they deal with it today?" maxlength="600">${esc(u.vproblem || "")}</textarea></div>
      <div class="field full"><label>One-line pitch</label><input class="input" name="vpitch" value="${esc(u.vpitch || "")}" placeholder="We help ___ do ___ by ___" maxlength="200"/></div>
      <div class="field full"><span class="field-label">Domain</span>${chips(C.DOMAINS, "domains")}</div>
    </div>`;
  if (s === 1) return `<div class="field"><span class="field-label">What can you bring to a team?</span>${chips(C.SKILLS, "skills")}</div>
    <div class="field mt-3"><label>Anything you've built or worked on?</label><textarea class="input" name="work" placeholder="Projects, internships, links" maxlength="600">${esc(u.work || "")}</textarea></div>`;
  if (s === 2 && founder) return `<div class="field"><span class="field-label">Skills you're looking for in a co-founder</span>${chips(C.SKILLS, "needs")}</div>
    <div class="form-grid mt-3"><div class="field"><label>Expected commitment</label><input class="input" name="commit" value="${esc(u.commit || "")}" placeholder="10–15 hrs/week" maxlength="60"/></div>
    <div class="field"><label>Equity or compensation</label><select class="input" name="equity">${opts(C.EQUITY, u.equity)}</select></div>
    <label class="check full"><input type="checkbox" name="pitchnight" ${u.pitchnight ? "checked" : ""}/> I'd like to pitch at the next Pitch Night</label></div>`;
  return `<div class="field"><span class="field-label">Domains that interest you</span>${chips(C.DOMAINS, "domains")}</div>
    <div class="field mt-3"><label>What are you looking for?</label><select class="input" name="looking">${opts(C.LOOKING, u.looking)}</select></div>`;
}
function readForm(f, target) {
  $$("input, select, textarea", f).forEach((el) => { if (!el.name) return; target[el.name] = el.type === "checkbox" ? el.checked : el.value; });
  $$("[data-chips]", f).forEach((g) => (target[g.dataset.chips] = $$(".chip.on", g).map((c) => c.textContent)));
  return target;
}

views.onboarding = async () => {
  if (!S.user) return redirect("join");
  S.draft ||= { ...S.profile };
  const u = S.draft, founder = isFounder(u), labels = stepLabels(u), ob = S.ob;
  const head = (sub, title, lead = "") => `<span class="label">Profile setup · ${roleName(u)}${sub ? " · " + sub : ""}</span><h2 class="mt-2">${title}</h2>${lead ? `<p class="mt-2">${lead}</p>` : ""}`;
  const wrap = (inner) => `<section class="section-sm fade"><div class="narrow">${inner}</div></section>`;

  if (!ob.mode) return wrap(`
    ${head("", "How do you want to set up your profile?", founder ? "We'll need your venture, the problem you're solving, and who you're looking for." : "We'll need your skills, your interests, and what you're looking for.")}
    <div class="choice mt-4">
      <button class="choice-opt rec" data-act="ob-mode" data-mode="ai"><span class="label gold">Recommended · About 2 minutes</span><h3>Use your AI assistant</h3>
        <p>Your chatbot already knows ${founder ? "your project" : "you"}. Copy our prompt into ChatGPT, Claude, Gemini or any assistant, then paste its reply back. You check everything before it's saved.</p><span class="arrow-link small mt-1">Use my AI</span></button>
      <button class="choice-opt" data-act="ob-mode" data-mode="manual"><span class="label">About 5 minutes</span><h3>Fill it in yourself</h3>
        <p>Three short steps: ${labels.join(", ").toLowerCase()}.</p><span class="arrow-link small mt-1">Fill it in</span></button>
    </div>
    <p class="small mt-4"><a href="#dashboard" class="link">Skip for now</a></p>`);

  if (ob.mode === "ai") return wrap(`
    ${head("With your AI", "Let your AI do the paperwork.", "Copy the prompt into the chatbot you use most, then paste its reply below.")}
    <div class="mt-4" style="display:grid;gap:2.5rem">
      <div><div class="row" style="align-items:baseline;gap:1rem;flex-wrap:nowrap"><span class="step-num">1</span><div><h3>Copy this prompt</h3><p class="small">Works with ChatGPT, Claude, Gemini, Copilot and others. Best in the chat where you've talked about ${founder ? "your idea" : "your work"}.</p></div></div>
        <textarea class="input prompt-box mt-2" id="aiPrompt" readonly aria-label="Prompt">${esc(aiPrompt(u))}</textarea>
        <div class="row mt-2"><button type="button" class="btn btn-primary btn-sm" data-act="copy-prompt">Copy prompt</button><span class="hint">AI doesn't know you yet? It will ask you a few questions instead.</span></div></div>
      <form data-form="ai-import"><div class="row" style="align-items:baseline;gap:1rem;flex-wrap:nowrap"><span class="step-num">2</span><div><h3>Paste the reply</h3><p class="small">Paste the whole reply. Text around the code block is fine.</p></div></div>
        <textarea class="input mt-2" name="reply" aria-label="AI reply" style="min-height:180px;font-family:var(--mono);font-size:.8rem" placeholder="Paste here"></textarea>
        <p class="error mt-1" id="aiErr"></p>
        <div class="row mt-1"><button class="btn btn-primary">Import and review</button><button type="button" class="btn btn-sm" data-act="ai-sample">Try a sample reply</button></div></form>
      <p class="hint">The reply is read here, in your browser. Nothing is saved until you review it and press save. Remove anything you don't want other members to see.</p>
    </div>
    <p class="small mt-4"><button class="link" data-act="ob-mode" data-mode="">Back</button> · <button class="link" data-act="ob-mode" data-mode="manual">Fill it in yourself instead</button></p>`);

  if (ob.mode === "review") {
    const blank = u._blank || [], unmatched = u._unmatched || [];
    return wrap(`
      ${head("Review", "Check what your AI filled in.", `Fields marked <span class="ai-badge">AI</span> came from your chatbot. Fix anything that's wrong, or that you don't want public.`)}
      <div class="panel flat mt-3"><p class="small"><b style="color:var(--text)">${(u._ai || []).length} fields filled.</b> ${blank.length ? `Still empty: ${blank.map((k) => FIELD_LABEL[k] || k).join(", ")}.` : "Nothing left empty."}</p>
        ${unmatched.length ? `<p class="small mt-1">Your AI also said ${unmatched.map((x) => `“${esc(x)}”`).join(", ")}, which didn't match our lists. Pick the closest option below if it applies.</p>` : ""}</div>
      <form data-form="onboarding" data-review="1" class="mt-4">
        ${[0, 1, 2].map((s) => `<div class="label review-h">${labels[s]}</div>${stepBody(s, u)}`).join("")}
        <div class="spread mt-4"><button type="button" class="btn" data-act="ob-mode" data-mode="ai">Paste a different reply</button><button class="btn btn-primary">Save profile</button></div>
      </form>`);
  }

  const s = ob.step;
  return wrap(`
    ${head("", ["Tell us about you", founder ? "What are you building?" : "What do you bring?", founder ? "Who do you need?" : "What interests you?"][s])}
    <div class="steps">${labels.map((l, i) => `<div class="${i < s ? "done" : i === s ? "cur" : ""}">${l}</div>`).join("")}</div>
    <form data-form="onboarding">${stepBody(s, u)}
      <div class="spread mt-4">${s > 0 ? `<button type="button" class="btn" data-act="ob-back">Back</button>` : `<button type="button" class="btn" data-act="ob-mode" data-mode="">Back</button>`}
        <button class="btn btn-primary">${s === 2 ? "Save profile" : "Continue"}</button></div>
    </form>
    <p class="small mt-4"><button class="link" data-act="ob-mode" data-mode="ai">Use my AI instead</button></p>`);
};
forms["ai-import"] = (f) => {
  const err = $("#aiErr"); const text = f.reply.value.trim();
  if (!text) return (err.textContent = "Paste your AI's reply first.");
  try {
    const r = parseAiReply(text, S.draft);
    Object.assign(S.draft, r.out, { _ai: r.ai, _blank: r.blank, _unmatched: r.unmatched });
    S.ob.mode = "review"; render(); scrollTo(0, 0);
    toast(`Imported ${r.ai.length} fields. Check them before saving.`);
  } catch (e) {
    err.textContent = e.message === "empty"
      ? "We found the reply but couldn't read any profile fields. Make sure you copied the whole code block."
      : "We couldn't find the profile in that reply. Ask your AI to “reply with only the JSON in a code block”, then paste again.";
  }
};
forms.onboarding = async (f) => {
  readForm(f, S.draft);
  if (!f.dataset.review && S.ob.step < 2) { S.ob.step++; render(); scrollTo(0, 0); return; }
  const btn = $("button.btn-primary", f); btn.disabled = true;
  try {
    const clean = { ...S.draft }; delete clean._ai; delete clean._blank; delete clean._unmatched;
    S.profile = await db.saveProfile(S.user.uid, clean);
    S.draft = null; S.ob = { step: 0, mode: null }; S.dashTab = "overview";
    toast("Profile saved"); go("dashboard");
  } catch (e) { console.error(e); toast("Couldn't save. Check your connection and try again."); btn.disabled = false; }
};

/* ==========================================================
   DASHBOARD: the member's own page
   ========================================================== */
const APP_STATES = ["new", "reviewing", "accepted", "declined"];
views.dashboard = async () => {
  if (!S.user) return redirect("login");
  if (!S.profile) return redirect("join");
  const u = S.profile, founder = isFounder(u), uid = S.user.uid;
  const [rsvps, sent, received, venture, ventures, builders, checks, events] = await Promise.all([
    db.myRsvps(uid).catch(() => []),
    db.myApplications(uid).catch(() => []),
    founder ? db.applicationsToMe(uid).catch(() => []) : [],
    founder ? db.myVenture(uid).catch(() => null) : null,
    founder ? [] : db.list("ventures").catch(() => []),
    founder ? db.members("builder").catch(() => []) : [],
    db.myIdeaChecks(uid).catch(() => []),
    db.list("events").catch(() => []),
  ]);
  const myEvents = events.filter((e) => rsvps.includes(e.id)).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const nextEvent = myEvents.find((e) => !isPastDate(e.date));

  // profile completeness
  const fields = ["name", "year", "bio", "linkedin", "avail", founder ? "vpitch" : "work"];
  const listOk = founder ? (u.needs || []).length : (u.skills || []).length;
  const missing = fields.filter((k) => !u[k]).map((k) => FIELD_LABEL[k === "vpitch" ? "vpitch" : k] || k);
  const pct = Math.round(((fields.length - missing.length + (listOk ? 1 : 0) + ((u.domains || []).length ? 1 : 0)) / (fields.length + 2)) * 100);

  // founder: application breakdown and team coverage
  const count = (arr, s) => arr.filter((a) => a.status === s).length;
  const team = received.filter((a) => a.status === "accepted");
  const covered = new Set(team.flatMap((a) => a.applicantSkills || []));
  const needs = venture?.needs || u.needs || [];
  const stillOpen = needs.filter((n) => !covered.has(n));

  // builder: matches and teams
  const mine = new Set([...(u.skills || []), ...(u.needs || [])]);
  const matches = founder
    ? builders.filter((b) => b.id !== uid).map((b) => ({ ...b, score: Math.min(98, 50 + (b.skills || []).filter((s) => needs.includes(s)).length * 18 + (b.domains || []).filter((d) => (u.domains || []).includes(d)).length * 8) })).sort((a, b) => b.score - a.score).slice(0, 6)
    : ventures.filter((v) => v.founderUid !== uid).map((v) => ({ ...v, score: Math.min(98, 50 + (v.needs || []).filter((n) => (u.skills || []).includes(n)).length * 15 + ((v.domains || []).some((d) => (u.domains || []).includes(d)) ? 15 : 0)) })).sort((a, b) => b.score - a.score).slice(0, 6);
  const myTeams = sent.filter((a) => a.status === "accepted");

  // activity feed
  const activity = [
    ...received.map((a) => ({ when: a.createdAt, text: `<b>${esc(a.applicantName)}</b> applied to ${esc(a.ventureName)}` })),
    ...received.filter((a) => a.updatedAt && a.status !== "new").map((a) => ({ when: a.updatedAt, text: `You marked ${esc(a.applicantName)} as ${statusLabel(a.status).toLowerCase()}` })),
    ...sent.map((a) => ({ when: a.createdAt, text: `You applied to <b>${esc(a.ventureName)}</b>` })),
    ...sent.filter((a) => a.updatedAt && a.status !== "new").map((a) => ({ when: a.updatedAt, text: `${esc(a.ventureName)} marked your application <b>${statusLabel(a.status).toLowerCase()}</b>` })),
    ...checks.map((c) => ({ when: c.createdAt, text: `Idea check: “${esc(c.idea)}” scored ${ideaScore(c.answers)}` })),
    ...(venture ? [{ when: venture.createdAt, text: `You listed <b>${esc(venture.name)}</b>` }] : []),
    { when: u.createdAt, text: "You joined FBC" },
  ].filter((a) => a.when).sort((a, b) => String(b.when).localeCompare(String(a.when))).slice(0, 8);

  const tab = S.dashTab;
  const tabs = founder
    ? [["overview", "Overview"], ["venture", "My venture"], ["applications", "Applicants", count(received, "new") || received.length], ["matches", "Builders for you"], ["events", "My events", rsvps.length], ["ideas", "Idea checks", checks.length], ["profile", "My profile"]]
    : [["overview", "Overview"], ["applications", "Applications", sent.length], ["teams", "My teams", myTeams.length], ["matches", "Ventures for you"], ["events", "My events", rsvps.length], ["ideas", "Idea checks", checks.length], ["profile", "My profile"]];

  /* --- pieces --- */
  const breakdown = (arr) => `<div class="stats" style="grid-template-columns:repeat(4,1fr)">${APP_STATES.map((s) => `<div class="stat"><span class="label">${statusLabel(s)}</span><b>${count(arr, s)}</b></div>`).join("")}</div>`;
  const matchList = matches.length ? `<div class="list">${matches.map((m) => founder
    ? `<div class="list-row" style="grid-template-columns:auto 1fr auto auto">${avatar(m.name, m.photo)}<div><span class="title">${esc(m.name)}</span> <span class="xs faint">${esc(m.year || "")}</span><div class="tagline">${(m.skills || []).map((s) => needs.includes(s) ? `<span class="gold">${esc(s)}</span>` : esc(s)).join(", ")}</div></div><span class="match">${m.score}%</span><button class="btn btn-sm" data-act="invite" data-name="${esc(m.name)}" data-email="${esc(m.email || "")}">Invite</button></div>`
    : `<button class="list-row" style="grid-template-columns:1fr auto auto" data-act="venture" data-id="${esc(m.id)}"><div><span class="title">${esc(m.name)}</span><div class="tagline">Needs ${(m.needs || []).map((s) => mine.has(s) ? `<span class="gold">${esc(s)}</span>` : esc(s)).join(", ")}</div></div><span class="match">${m.score}%</span><span class="go">→</span></button>`).join("")}</div>
    <p class="hint mt-2">Match % is based on overlapping skills and domains. <span class="gold">Gold</span> means a skill you ${founder ? "need" : "have"}.</p>`
    : `<div class="empty">${founder ? "No builder profiles yet. Share FBC with friends who build." : "No ventures listed yet."}</div>`;

  const receivedList = (filter) => {
    const rows = received.filter((a) => !filter || a.status === filter).sort(byDateDesc("createdAt"));
    return rows.length ? `<div class="list">${rows.map((a) => `
      <div class="list-row" style="grid-template-columns:auto 1fr auto">${avatar(a.applicantName)}<div><span class="title">${esc(a.applicantName)}</span> <span class="xs faint">${esc(a.applicantYear || "")} · ${fmtDate(a.createdAt)}</span>
        <div class="tagline">${esc((a.applicantSkills || []).join(", "))}</div><p class="small mt-1" style="color:var(--text)">${esc(a.message)}</p>
        <p class="xs mt-1"><button class="link" data-act="copy-text" data-text="${esc(a.applicantEmail)}">${esc(a.applicantEmail)}</button></p></div>
        <select class="input" style="width:auto;height:32px" data-act-change="app-status" data-id="${esc(a.id)}" aria-label="Status">${APP_STATES.map((s) => `<option value="${s}" ${a.status === s ? "selected" : ""}>${statusLabel(s)}</option>`).join("")}</select></div>`).join("")}</div>`
      : `<div class="empty">${filter ? "None here." : `No applications yet. They'll appear here when builders apply to ${esc(venture?.name || u.vname || "your venture")}.`}</div>`;
  };
  const sentList = (rows) => rows.length ? `<div class="list">${rows.sort(byDateDesc("createdAt")).map((a) => `
      <div class="list-row" style="grid-template-columns:1fr auto auto"><div><button class="title link" style="text-decoration:none" data-act="venture" data-id="${esc(a.ventureId)}">${esc(a.ventureName)}</button><div class="tagline">Applied ${fmtDate(a.createdAt)}${a.updatedAt && a.status !== "new" ? ` · updated ${fmtDate(a.updatedAt)}` : ""}</div></div>
        <span class="status ${a.status}">${statusLabel(a.status)}</span>${a.status === "accepted" ? `<span></span>` : `<button class="icon-btn" data-act="withdraw" data-id="${esc(a.id)}">Withdraw</button>`}</div>`).join("")}</div>`
    : `<div class="empty">You haven't applied anywhere yet. <a class="link" href="#matchmaking">Browse ventures</a></div>`;

  const publicPreview = `
    <div class="panel">
      <span class="label">How other members see you</span>
      <div class="row mt-2" style="gap:1rem">${avatar(u.name, u.photo, "avatar-lg")}<div><h3 style="font-size:1.2rem">${esc(u.name)}</h3><p class="small">${esc(u.year || "")}${u.year ? " · " : ""}${roleName(u)}</p></div></div>
      <p class="mt-2" style="color:var(--text)">${esc(u.bio || "No bio yet.")}</p>
      <p class="small mt-2">${esc(((founder ? u.needs : u.skills) || []).join(", "))}</p>
    </div>`;

  let main;
  if (tab === "overview") main = founder ? `
    <div class="stats">
      <div class="stat"><span class="label">Listing</span><b style="font-size:1.8rem">${venture ? statusLabel(venture.status) : "Not listed"}</b><p class="xs mt-1">${venture ? `${stageBar(venture.stage)}${esc(C.STAGES[venture.stage])}` : ""}</p></div>
      <div class="stat"><span class="label">Applicants</span><b>${received.length}</b><p class="xs mt-1">${count(received, "new")} new to review</p></div>
      <div class="stat"><span class="label">Team</span><b>${team.length + 1}</b><p class="xs mt-1">You${team.length ? ` + ${team.length} accepted` : ""}</p></div>
      <div class="stat"><span class="label">Profile</span><b>${pct}%</b><div class="progress"><i style="width:${pct}%"></i></div></div>
    </div>
    ${!venture ? `<div class="notice mt-3"><div><h3>List your venture</h3><p class="small">Add your venture details so builders can find and apply to it.</p></div><div class="row"><button class="btn btn-primary btn-sm" data-act="edit-profile" data-mode="ai">Use my AI</button><button class="btn btn-sm" data-act="edit-profile" data-mode="manual">Fill in myself</button></div></div>`
      : count(received, "new") ? `<div class="notice mt-3"><div><h3>${count(received, "new")} new applicant${count(received, "new") > 1 ? "s" : ""}</h3><p class="small">Review them and mark each one, so applicants know where they stand.</p></div><button class="btn btn-primary btn-sm" data-act="dash-tab" data-tab="applications">Review</button></div>` : ""}
    <div class="grid g2 mt-4" style="gap:3rem;align-items:start">
      <div>
        <span class="label">Team coverage</span>
        <table class="table mt-2"><tbody>
          <tr><td>Covered by your team</td><td>${needs.filter((n) => covered.has(n)).map(esc).join(", ") || "Nothing yet"}</td></tr>
          <tr><td>Still looking for</td><td>${stillOpen.length ? stillOpen.map((n) => `<span class="gold">${esc(n)}</span>`).join(", ") : "All covered"}</td></tr>
          <tr><td>Pitch Night</td><td>${u.pitchnight ? "You've opted in" : `Not opted in. <button class="link" data-act="toggle-pitch">Opt in</button>`}</td></tr>
          ${nextEvent ? `<tr><td>Your next event</td><td>${esc(nextEvent.title)}, ${fmtDate(nextEvent.date, { day: "numeric", month: "short" })}</td></tr>` : ""}
        </tbody></table>
      </div>
      <div><span class="label">Recent activity</span>
        <div class="list mt-2">${activity.map((a) => `<div class="list-row" style="grid-template-columns:1fr auto;padding:.8rem 0"><span class="small" style="color:var(--text-2)">${a.text}</span><span class="xs faint">${fmtDate(a.when, { day: "numeric", month: "short" })}</span></div>`).join("")}</div></div>
    </div>` : `
    <div class="stats">
      <div class="stat"><span class="label">Applications</span><b>${sent.length}</b><p class="xs mt-1">${count(sent, "new") + count(sent, "reviewing")} waiting</p></div>
      <div class="stat"><span class="label">Accepted</span><b>${myTeams.length}</b><p class="xs mt-1">${myTeams.length ? esc(myTeams.map((t) => t.ventureName).join(", ")) : "No teams yet"}</p></div>
      <div class="stat"><span class="label">Events</span><b>${rsvps.length}</b><p class="xs mt-1">${nextEvent ? `Next: ${fmtDate(nextEvent.date, { day: "numeric", month: "short" })}` : "None coming up"}</p></div>
      <div class="stat"><span class="label">Profile</span><b>${pct}%</b><div class="progress"><i style="width:${pct}%"></i></div></div>
    </div>
    ${pct < 100 ? `<div class="notice mt-3"><div><h3>Finish your profile</h3><p class="small">Missing: ${esc(missing.join(", ") || "skills or domains")}. Complete profiles are matched first.</p></div><div class="row"><button class="btn btn-primary btn-sm" data-act="edit-profile" data-mode="ai">Finish with my AI</button><button class="btn btn-sm" data-act="edit-profile" data-mode="manual">Fill in myself</button></div></div>` : ""}
    <div class="grid g2 mt-4" style="gap:3rem;align-items:start">
      <div><div class="spread"><span class="label">Ventures that need you</span><button class="link small" data-act="dash-tab" data-tab="matches">See all</button></div><div class="mt-2">${matchList}</div></div>
      <div><span class="label">Recent activity</span>
        <div class="list mt-2">${activity.map((a) => `<div class="list-row" style="grid-template-columns:1fr auto;padding:.8rem 0"><span class="small" style="color:var(--text-2)">${a.text}</span><span class="xs faint">${fmtDate(a.when, { day: "numeric", month: "short" })}</span></div>`).join("")}</div></div>
    </div>`;
  else if (tab === "venture") main = venture ? `
    <div class="grid g2" style="gap:3rem;align-items:start">
      <div>
        <span class="label">${esc((venture.domains || []).join(" · "))}</span><h2 class="mt-1">${esc(venture.name)}</h2>
        <p class="mt-2" style="color:var(--text)">${esc(venture.pitch)}</p>${venture.problem ? `<p class="mt-2">${esc(venture.problem)}</p>` : ""}
        <table class="table mt-3"><tbody>
          <tr><td>Listing</td><td><span class="status ${venture.status}">${statusLabel(venture.status)}</span>${venture.status === "hidden" ? `<p class="xs mt-1">Hidden by an FBC admin. Write to us if this is a mistake.</p>` : ""}</td></tr>
          <tr><td>Stage</td><td><select class="input" style="width:auto;height:32px" data-act-change="set-stage" aria-label="Stage">${C.STAGES.map((s, i) => `<option value="${i}" ${+venture.stage === i ? "selected" : ""}>${s}</option>`).join("")}</select></td></tr>
          <tr><td>Looking for</td><td>${esc(needs.join(", "))}</td></tr>
          <tr><td>Pitch Night</td><td>${u.pitchnight ? "Opted in" : "Not opted in"} · <button class="link" data-act="toggle-pitch">${u.pitchnight ? "Opt out" : "Opt in"}</button></td></tr>
          <tr><td>Listed</td><td>${fmtDate(venture.createdAt)} · updated ${fmtDate(venture.updatedAt)}</td></tr>
        </tbody></table>
        <div class="row mt-3"><button class="btn btn-sm" data-act="edit-profile" data-mode="manual">Edit details</button>
          ${venture.status === "live" ? `<button class="btn btn-sm" data-act="venture-status" data-status="paused">Pause listing</button>` : venture.status === "paused" ? `<button class="btn btn-primary btn-sm" data-act="venture-status" data-status="live">Make live again</button>` : ""}
          <button class="btn btn-sm" data-act="venture" data-id="${esc(venture.id)}">Preview public listing</button></div>
      </div>
      <div>
        <span class="label">Who responded</span>
        <div class="mt-2">${breakdown(received)}</div>
        <span class="label" style="display:block;margin-top:2rem">Your team</span>
        <div class="list mt-2">
          <div class="list-row" style="grid-template-columns:auto 1fr">${avatar(u.name, u.photo)}<div><span class="title">${esc(u.name)}</span><div class="tagline">Founder</div></div></div>
          ${team.map((a) => `<div class="list-row" style="grid-template-columns:auto 1fr">${avatar(a.applicantName)}<div><span class="title">${esc(a.applicantName)}</span><div class="tagline">${esc((a.applicantSkills || []).join(", "))}</div></div></div>`).join("")}
        </div>
        <p class="small mt-2">${stillOpen.length ? `Still looking for <span class="gold">${esc(stillOpen.join(", "))}</span>.` : "Every skill you listed is covered."}</p>
      </div>
    </div>`
    : `<div class="empty">Your venture isn't listed yet. <button class="link" data-act="edit-profile" data-mode="manual">Add your venture details</button></div>`;
  else if (tab === "applications") main = founder
    ? `${breakdown(received)}<div class="toolbar"><div class="seg">${["", ...APP_STATES].map((s) => `<button data-act="app-filter" data-f="${s}" class="${(S.appFilter || "") === s ? "on" : ""}">${s ? statusLabel(s) : "All"}</button>`).join("")}</div></div>${receivedList(S.appFilter)}`
    : `${breakdown(sent)}<div class="mt-3">${sentList(sent)}</div>`;
  else if (tab === "teams") main = myTeams.length ? `<div class="list">${myTeams.map((a) => `<button class="list-row" style="grid-template-columns:1fr auto" data-act="venture" data-id="${esc(a.ventureId)}"><div><span class="title">${esc(a.ventureName)}</span><div class="tagline">Accepted ${fmtDate(a.updatedAt || a.createdAt)}</div></div><span class="go">→</span></button>`).join("")}</div>`
    : `<div class="empty">When a founder accepts your application, the team shows up here.</div>`;
  else if (tab === "matches") main = matchList;
  else if (tab === "events") main = myEvents.length ? `<div class="list">${myEvents.map((e) => eventRow(e, rsvps)).join("")}</div>` : `<div class="empty">You haven't RSVP'd to anything yet. <a class="link" href="#events">See events</a></div>`;
  else if (tab === "ideas") main = checks.length ? `<div class="list">${checks.sort(byDateDesc("createdAt")).map((c) => `<div class="list-row" style="grid-template-columns:4rem 1fr auto"><span class="score" style="font-size:2rem">${ideaScore(c.answers)}</span><div><span class="title">${esc(c.idea)}</span><div class="tagline">${fmtDate(c.createdAt)}</div></div><a class="arrow-link small" href="#validate">Re-check</a></div>`).join("")}</div>`
    : `<div class="empty">No idea checks yet. <a class="link" href="#validate">Check an idea</a></div>`;
  else main = `
    <div class="grid g2" style="gap:3rem;align-items:start">
      <div>
        <table class="table"><tbody>
          <tr><td>Name</td><td>${esc(u.name)}</td></tr>
          <tr><td>Email</td><td>${esc(S.user.email)}</td></tr>
          <tr><td>Role</td><td><select class="input" style="width:auto;height:32px" data-act-change="change-role" aria-label="Role">${[["founder", "Founder"], ["builder", "Builder"], ["explorer", "Explorer"]].map(([k, t]) => `<option value="${k}" ${u.role === k ? "selected" : ""}>${t}</option>`).join("")}</select></td></tr>
          <tr><td>Year and branch</td><td>${esc(u.year || "")}</td></tr>
          <tr><td>${founder ? "Looking for" : "Skills"}</td><td>${esc(((founder ? u.needs : u.skills) || []).join(", ") || "None yet")}</td></tr>
          <tr><td>Domains</td><td>${esc((u.domains || []).join(", ") || "None yet")}</td></tr>
          <tr><td>Availability</td><td>${esc(u.avail || "")}</td></tr>
          <tr><td>LinkedIn</td><td>${esc(u.linkedin || "")}</td></tr>
          ${!founder ? `<tr><td>Past work</td><td>${esc(u.work || "")}</td></tr><tr><td>Looking for</td><td>${esc(u.looking || "")}</td></tr>` : ""}
          <tr><td>Member since</td><td>${fmtDate(u.createdAt)}</td></tr>
        </tbody></table>
        <div class="row mt-3"><button class="btn" data-act="edit-profile" data-mode="manual">Edit profile</button><button class="btn" data-act="edit-profile" data-mode="ai">Update with my AI</button></div>
      </div>
      ${publicPreview}
    </div>`;

  return `
  <div class="container shell fade">
    <aside class="side" aria-label="Dashboard sections">
      ${tabs.map(([k, l, n]) => `<button data-act="dash-tab" data-tab="${k}" class="${tab === k ? "on" : ""}">${l}${n ? `<span class="count">${n}</span>` : ""}</button>`).join("")}
      <hr/><a href="#validate">Validate an idea</a>${S.admin ? `<a href="#admin">Admin console</a>` : ""}<button data-act="signout">Sign out</button>
    </aside>
    <div>
      <div class="spread" style="margin-bottom:2rem"><div><span class="label">${roleName(u)} · Dashboard</span><h2 class="mt-1">Hello, ${esc(String(u.name).split(" ")[0])}.</h2></div>
        <a href="#matchmaking" class="btn btn-primary">${founder ? "Browse builders" : "Find ventures"}</a></div>
      ${main}
    </div>
  </div>`;
};

/* ==========================================================
   ACTIONS
   ========================================================== */
const confirmSafe = (msg) => { try { return window.confirm(msg); } catch { return true; } };
Object.assign(actions, {
  venture: (el) => ventureModal(el.dataset.id),
  event: (el) => eventModal(el.dataset.id),
  async rsvp(el, e) {
    e.stopPropagation();
    if (!S.user) { closeModal(); toast("Sign in to RSVP"); return go("login"); }
    const id = el.dataset.id;
    const going = (await db.myRsvps(S.user.uid)).includes(id);
    await db.rsvp(id, { uid: S.user.uid, name: S.profile?.name || S.user.name, email: S.user.email }, !going);
    toast(going ? "RSVP cancelled" : "You're on the list");
    closeModal(); render();
  },
  "pick-role": (el) => { S.pendingRole = el.dataset.role; if (el.tagName !== "A") render(); },
  "mm-tab": (el) => { S.mm.tab = el.dataset.tab; S.mm.skill = ""; render(); },
  "opp-type": (el) => { S.opp = el.dataset.type; render(); },
  jcat: (el) => { S.jcat = el.dataset.cat; render(); },
  "dash-tab": (el) => { S.dashTab = el.dataset.tab; render(); scrollTo(0, 0); },
  "app-filter": (el) => { S.appFilter = el.dataset.f; render(); },
  scroll: (el, e) => { e.preventDefault(); document.getElementById(el.dataset.to)?.scrollIntoView({ behavior: "smooth" }); },
  chip: (el) => { el.classList.toggle("on"); el.parentElement.classList.remove("ai-filled"); },
  answer: (el) => { $$("button", el.parentElement).forEach((b) => b.classList.toggle("on", b === el)); },
  "ob-mode": (el) => { S.ob = { step: 0, mode: el.dataset.mode || null }; render(); scrollTo(0, 0); },
  "ob-back": () => { const f = $("form[data-form=onboarding]"); if (f) readForm(f, S.draft); S.ob.step--; render(); },
  "edit-profile": (el) => { S.draft = { ...S.profile }; S.ob = { step: 0, mode: el.dataset.mode }; go("onboarding"); },
  "copy-prompt": () => {
    const box = $("#aiPrompt"); const ok = () => toast("Prompt copied. Paste it into your chatbot.");
    const fallback = () => { box.focus(); box.select(); let done = false; try { done = document.execCommand("copy"); } catch {} done ? ok() : toast("Prompt selected. Press Ctrl+C (⌘C on Mac) to copy."); };
    navigator.clipboard?.writeText ? navigator.clipboard.writeText(box.value).then(ok, fallback) : fallback();
  },
  "ai-sample": () => { $("form[data-form=ai-import]").reply.value = aiSample(S.draft); $("#aiErr").textContent = ""; toast("Sample pasted. Press Import and review."); },
  async withdraw(el) { if (!confirmSafe("Withdraw this application?")) return; await db.withdrawApplication(el.dataset.id); toast("Application withdrawn"); render(); },
  async "venture-status"(el) { await db.setVentureStatus(S.user.uid, el.dataset.status); toast(el.dataset.status === "live" ? "Your venture is live" : "Listing paused"); render(); },
  async "toggle-pitch"() { S.profile = await db.saveProfile(S.user.uid, { ...S.profile, pitchnight: !S.profile.pitchnight }); toast(S.profile.pitchnight ? "You're on the Pitch Night list" : "Removed from Pitch Night"); render(); },
  async signout() { await db.signOut(); toast("Signed out"); go("home"); },
  invite(el) {
    if (!S.user) return go("login");
    const email = el.dataset.email;
    openModal(`<span class="label">Invite</span><h2 id="modalTitle" class="mt-1">Invite ${esc(el.dataset.name)}</h2>
      <p class="mt-2">Reach out directly. A short note about your venture and why you thought of them works best.</p>
      ${email ? `<p class="mt-3 mono small" style="color:var(--text)">${esc(email)}</p><div class="row mt-3"><a class="btn btn-primary" href="mailto:${esc(email)}?subject=${encodeURIComponent("Building " + (S.profile?.vname || "a startup") + " together? (via FBC)")}">Write an email</a><button class="btn" data-act="copy-text" data-text="${esc(email)}">Copy address</button></div>` : `<p class="mt-3 small">This member hasn't shared an email address.</p>`}`);
  },
  "copy-text": (el) => navigator.clipboard?.writeText(el.dataset.text).then(() => toast("Copied"), () => toast("Couldn't copy")),
  interest(el) {
    const o = (S.cache.opps || []).find((x) => x.id === el.dataset.id);
    openModal(`<span class="label">${esc(o?.org || "")}</span><h2 id="modalTitle" class="mt-1">${esc(o?.title || "Opportunity")}</h2>
      <p class="mt-2">Tell us you're interested and we'll connect you with the team.</p>
      <form data-form="interest" data-title="${esc(o?.title || "")}" class="mt-3 grid" style="gap:1rem">
        <div class="form-grid"><div class="field"><label>Name</label><input class="input" name="name" required value="${esc(S.profile?.name || "")}"/></div><div class="field"><label>Email</label><input class="input" type="email" name="email" required value="${esc(S.user?.email || "")}"/></div></div>
        <div class="field"><label>A line about you</label><textarea class="input" name="body" required maxlength="1000" style="min-height:90px"></textarea></div>
        <div><button class="btn btn-primary">Send</button></div></form>`);
  },
  "post-opp": () => openModal(`<span class="label">For startups</span><h2 id="modalTitle" class="mt-1">Post an opportunity</h2>
    <p class="mt-2">Tell us about the role. The FBC team reviews every listing before it goes live.</p>
    <form data-form="post-opp" class="mt-3 grid" style="gap:1rem">
      <div class="form-grid"><div class="field"><label>Your name</label><input class="input" name="name" required/></div><div class="field"><label>Email</label><input class="input" type="email" name="email" required/></div>
      <div class="field full"><label>Company and role</label><input class="input" name="extra" required placeholder="Acme Labs, frontend intern"/></div>
      <div class="field full"><label>Details</label><textarea class="input" name="body" required maxlength="4000" placeholder="What they'll do, duration, stipend, remote or on campus, how to apply"></textarea></div></div>
      <div><button class="btn btn-primary">Submit for review</button></div></form>`),
});
const changeActions = {
  async "app-status"(el) { await db.setApplicationStatus(el.dataset.id, el.value); toast(`Marked as ${statusLabel(el.value).toLowerCase()}`); },
  async "change-role"(el) { S.profile = await db.saveProfile(S.user.uid, { ...S.profile, role: el.value }); S.dashTab = "overview"; toast(`You're now listed as ${roleName(S.profile).toLowerCase()}`); render(); },
  async "set-stage"(el) { S.profile = await db.saveProfile(S.user.uid, { ...S.profile, vstage: +el.value }); toast(`Stage updated to ${C.STAGES[+el.value]}`); render(); },
};

/* ---------- forms ---------- */
Object.assign(forms, {
  async apply(f) {
    const v = (S.cache.ventures || []).find((x) => x.id === f.dataset.id) || await db.get("ventures", f.dataset.id);
    if (!S.profile) { closeModal(); return go("join"); }
    await db.apply(v, f.message.value.trim(), { uid: S.user.uid, email: S.user.email, ...S.profile });
    toast(`Application sent to ${v.name}`); ventureModal(v.id);
  },
  async ideacheck(f) {
    const idea = f.idea.value.trim(); const ans = {};
    $$("[data-q]", f).forEach((g) => { const on = $("button.on", g); if (on) ans[g.dataset.q] = +on.dataset.v; });
    if (Object.keys(ans).length < QUESTIONS.length) return ($("#icErr").textContent = "Answer all seven questions. “No” is a perfectly good answer.");
    $("#icErr").textContent = "";
    $("#icResult").innerHTML = ideaResult(idea, ans);
    $("#icResult").scrollIntoView({ behavior: "smooth", block: "center" });
    if (S.user) db.saveIdeaCheck(S.user.uid, { idea, answers: ans, score: ideaScore(ans) }).catch((e) => console.error(e));
  },
  async contact(f) { await sendMsg(f, "contact", "Message sent. We'll get back to you."); },
  async subscribe(f) { await db.sendMessage({ type: "newsletter", email: f.email.value }); f.reset(); toast("You're subscribed to The Builder's Brief"); },
  async interest(f) { await sendMsg(f, "interest", "Sent. We'll be in touch.", f.dataset.title); closeModal(); },
  async "post-opp"(f) { await sendMsg(f, "opportunity", "Thanks. We'll review it and get back to you."); closeModal(); },
});
async function sendMsg(f, type, okMsg, extra) {
  await db.sendMessage({ type, name: f.name?.value, email: f.email?.value, body: f.body?.value, extra: extra ?? f.extra?.value });
  f.reset(); toast(okMsg);
}

/* ==========================================================
   ROUTER
   ========================================================== */
let renderToken = 0;
function go(route) { if (location.hash === "#" + route) render(); else location.hash = "#" + route; }
function redirect(route) { setTimeout(() => go(route), 0); return ""; }
function parseHash() {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
  if (h.startsWith("journal-")) return { key: "post", param: h.slice(8) };
  return { key: h || "home", param: null };
}

async function render() {
  const token = ++renderToken;
  const { key, param } = parseHash();
  const view = key === "admin" ? adminView : views[key] || views.notfound;
  const slow = setTimeout(() => { if (token === renderToken) app.innerHTML = `<div class="loading">Loading</div>`; }, 150);
  let html;
  try { html = await view(param); }
  catch (e) {
    console.error(e);
    html = `<section class="section first"><div class="container"><span class="label">Error</span><h2 class="mt-2">Something went wrong loading this page.</h2><p class="mt-2">${esc(e.code === "permission-denied" ? "You don't have access to this." : "Check your connection and try again.")}</p><button class="btn mt-3" onclick="location.reload()">Reload</button></div></section>`;
  }
  clearTimeout(slow);
  if (token !== renderToken) return;
  app.innerHTML = html;
  $$("#navLinks a").forEach((a) => a.classList.toggle("active", a.dataset.route === key || (key === "post" && a.dataset.route === "journal") || (key === "roadmap" && a.dataset.route === "about")));
  $("#navLinks").classList.remove("open"); $("#navToggle").setAttribute("aria-expanded", "false");
  renderNav(); closeModal(); markAiFields();
  const titles = { matchmaking: "Matchmaking", validate: "Validate", opportunities: "Opportunities", events: "Events", journal: "Journal", resources: "Resources", about: "About", contact: "Contact", join: "Join", login: "Sign in", dashboard: "Dashboard", onboarding: "Profile setup", admin: "Admin" };
  document.title = (titles[key] ? titles[key] + " · " : "") + "FBC · Founders and Builders Collective";
}
function markAiFields() {
  const rf = $("form[data-review]");
  if (!rf) return;
  (S.draft?._ai || []).forEach((n) => {
    const el = $(`[name="${n}"], [data-chips="${n}"]`, rf); if (!el) return;
    el.classList.add("ai-filled");
    el.closest(".field")?.querySelector("label, .field-label")?.insertAdjacentHTML("beforeend", '<span class="ai-badge">AI</span>');
  });
}
function renderNav() {
  $("#navActions").innerHTML = S.user
    ? `${S.admin ? `<a href="#admin" class="text-link">Admin</a>` : ""}<a href="#dashboard" class="text-link">Dashboard</a><a href="#dashboard" title="${esc(S.profile?.name || S.user.name)}">${avatar(S.profile?.name || S.user.name, S.profile?.photo || S.user.photo)}</a>`
    : `<a href="#login" class="text-link">Sign in</a><a href="#join" class="btn btn-primary btn-sm">Join FBC</a>`;
}
function applySettings() {
  const s = S.settings;
  const a = $("#announce");
  if (s.announcement) { a.innerHTML = md(s.announcement).replace(/^<p>|<\/p>$/g, ""); a.hidden = false; } else a.hidden = true;
  $$("[data-link]").forEach((el) => { const v = s[el.dataset.link]; if (v) el.href = v; });
  $("#modeNote").textContent = db.mode === "demo" ? "Demo mode: data is saved only in this browser." : "";
}
async function loadUser(user) {
  if (user?.uid !== S.user?.uid) { // different person: reset per-user screen state
    Object.assign(S, { dashTab: "overview", adminTab: "overview", appFilter: "", draft: null, ob: { step: 0, mode: null }, cache: {} });
  }
  S.user = user;
  S.profile = user ? await db.getProfile(user.uid).catch(() => null) : null;
  S.admin = user ? await db.isAdmin(user.email) : false;
}

/* ---------- global listeners ---------- */
const errMsg = (er) => (er?.code === "permission-denied" ? "You don't have permission to do that." : "Something went wrong. Please try again.");
document.addEventListener("click", async (e) => {
  if (e.target.closest("[data-close]")) closeModal();
  if (e.target.closest("#navToggle")) { const open = $("#navLinks").classList.toggle("open"); $("#navToggle").setAttribute("aria-expanded", open); return; }
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const fn = actions[el.dataset.act] || adminActions[el.dataset.act];
  if (fn) { try { await fn(el, e); } catch (er) { console.error(er); toast(errMsg(er)); } }
});
document.addEventListener("change", async (e) => {
  const el = e.target;
  el.classList?.remove("ai-filled");
  if (el.id === "mmDomain") { S.mm.domain = el.value; $("#mmList").innerHTML = mmList(); }
  if (el.id === "mmSkill") { S.mm.skill = el.value; $("#mmList").innerHTML = mmList(); }
  const fn = el.dataset?.actChange && (changeActions[el.dataset.actChange] || adminChange[el.dataset.actChange]);
  if (fn) { try { await fn(el, e); } catch (er) { console.error(er); toast(errMsg(er)); } }
});
document.addEventListener("input", (e) => {
  e.target.classList?.remove("ai-filled");
  if (e.target.id === "mmQ") { S.mm.q = e.target.value; $("#mmList").innerHTML = mmList(); }
});
document.addEventListener("submit", async (e) => {
  const f = e.target.closest("form[data-form]");
  if (!f) return;
  e.preventDefault();
  const fn = forms[f.dataset.form] || adminForms[f.dataset.form];
  if (fn) { try { await fn(f, e); } catch (er) { console.error(er); toast(errMsg(er)); } }
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
window.addEventListener("hashchange", () => { render().then(() => scrollTo(0, 0)); });

/* ---------- boot ---------- */
(async function boot() {
  const accent = new URLSearchParams(location.search).get("accent");
  if (accent) document.documentElement.dataset.accent = accent;
  app.innerHTML = `<div class="loading">Loading</div>`;
  try { await db.init(); } catch (e) { console.error("Backend failed to start", e); }
  S.settings = await db.getSettings().catch(() => S.settings);
  applySettings();
  let booted = false;
  db.onAuth(async (user) => {
    if (booted && user?.uid === S.user?.uid) return;
    await loadUser(user);
    if (booted) render();
  });
  await loadUser(db.user());
  booted = true;
  await render();
})();

export { render, go, applySettings, eventRow, ventureRow, statusLabel };
