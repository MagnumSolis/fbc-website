/* ==========================================================
   FBC prototype: tiny hash-router SPA, no build step.
   Auth/profile is mocked with localStorage.
   ========================================================== */
(() => {
  const D = window.FBC;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const app = $("#app");

  /* ---------- state ---------- */
  const store = {
    get: (k, d = null) => { try { return JSON.parse(localStorage.getItem("fbc_" + k)) ?? d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem("fbc_" + k, JSON.stringify(v)); } catch {} },
    del: (k) => { try { localStorage.removeItem("fbc_" + k); } catch {} },
  };
  const user = () => store.get("user");

  /* ---------- helpers ---------- */
  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const initials = (n = "") => n.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
  const fmt = (d, o = { day: "numeric", month: "short", year: "numeric" }) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", o);
  const stageDots = (s) => `<span class="stage-dots" title="${D.stages[s]}">${D.stages.map((_, i) => `<i class="${i <= s ? "on" : ""}"></i>`).join("")}</span>`;
  const toast = (msg) => { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 2600); };
  const openModal = (html) => { $("#modalBody").innerHTML = html; $("#modal").classList.add("open"); $("#modal").setAttribute("aria-hidden", "false"); };
  const closeModal = () => { $("#modal").classList.remove("open"); $("#modal").setAttribute("aria-hidden", "true"); };

  const I = { // inline icons (stroke-based, inherit colour)
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/></svg>',
    rocket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M14 4c4-1 6 1 6 1s2 2 1 6l-7 7-7-7 7-7z"/><circle cx="15" cy="9" r="1.5"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    brief: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>',
    tool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 8-8 1.3-1.3-4-4zM3 21l6-6"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  };

  const pageHead = (eyebrow, title, lead, extra = "") => `
    <section class="page-head"><div class="container">
      <span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p class="lead">${lead}</p>${extra}
    </div></section>`;

  const ventureCard = (v) => `
    <article class="card hover venture" data-venture="${v.id}" tabindex="0">
      <div class="venture-top">
        <div class="v-logo">${v.logo}</div>
        <div><h3 style="margin:0">${esc(v.name)}</h3><span class="small muted">${esc(v.founder)} · ${esc(v.year)}</span></div>
      </div>
      <div class="tags"><span class="tag gold">${v.domain}</span><span class="tag">${D.stages[v.stage]}</span></div>
      <p>${esc(v.pitch)}</p>
      <div><div class="needs">Looking for</div><div class="tags mt-1">${v.needs.map((n) => `<span class="tag">${n}</span>`).join("")}</div></div>
      <div class="venture-foot">${stageDots(v.stage)}<span>${v.applicants} applicants</span></div>
    </article>`;

  const eventCard = (e) => {
    const d = new Date(e.date + "T00:00:00");
    return `
    <article class="card hover event" data-event="${e.id}">
      <div class="date-block"><b>${d.getDate()}</b><span>${d.toLocaleString("en", { month: "short" })} ${String(d.getFullYear()).slice(2)}</span></div>
      <div><span class="tag ${e.upcoming ? "gold" : ""}">${e.type}</span><h3 class="mt-1">${esc(e.title)}</h3>
        <div class="meta"><span>${e.time || "All day"}</span><span>${esc(e.venue)}</span></div></div>
      ${e.upcoming ? `<button class="btn btn-ghost btn-sm" data-rsvp="${e.id}">${(store.get("rsvps", [])).includes(e.id) ? "✓ Going" : "RSVP"}</button>` : `<span class="small muted">Past event</span>`}
    </article>`;
  };

  const postCard = (p) => `
    <a href="#journal-${p.id}" class="card post-card">
      <div class="post-cover"><span class="big-letter">${p.letter}</span><span class="tag gold">${p.cat}</span></div>
      <div class="post-body"><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p>
        <div class="post-meta">${esc(p.author)} · ${fmt(p.date)} · ${p.read}</div></div>
    </a>`;

  const ctaBand = () => `
    <section class="section-sm"><div class="container">
      <div class="cta-band reveal">
        <span class="spaced">Ideas <span style="opacity:.4">/</span> People <span style="opacity:.4">/</span> Impact</span>
        <h2 class="mt-1">Have an idea? Find your people.</h2>
        <p>Whether you want to build, join a team, or just get curious about startups, there's a place for you here.</p>
        <div class="hero-cta" style="justify-content:center">
          <a href="#signup" class="btn btn-dark">Join FBC <span class="arrow">→</span></a>
          <a href="${D.links.whatsapp}" target="_blank" rel="noopener" class="btn btn-outline-dark">WhatsApp community</a>
        </div>
      </div>
    </div></section>`;

  /* ==========================================================
     VIEWS
     ========================================================== */
  const views = {};

  /* ---------- HOME ---------- */
  views.home = () => {
    const upcoming = D.events.filter((e) => e.upcoming).slice(0, 3);
    return `
    <section class="hero"><div class="container hero-grid">
      <div>
        <span class="script-tag">From Ideas to Impact</span>
        <span class="eyebrow" style="display:flex">BITS Pilani · Student Community</span>
        <h1 class="mt-1">Find the people<br/>to <span class="hl">build</span> it with.</h1>
        <p class="lead mt-2">Founders and Builders Collective is where BITSians with ideas meet BITSians who want to build. Learn entrepreneurship together, find a co-founder, pitch, and ship.</p>
        <div class="hero-cta">
          <a href="#signup" class="btn btn-primary">Join the Collective <span class="arrow">→</span></a>
          <a href="#matchmaking" class="btn btn-ghost">Explore ventures</a>
        </div>
        <div class="hero-meta">
          <div><strong data-count="${D.ventures.length}">0</strong><span>ventures looking for co-founders</span></div>
          <div><strong data-count="1200">0</strong><span>new BITSians every year</span></div>
          <div><strong>∞</strong><span>ideas worth testing</span></div>
        </div>
      </div>
      <div class="match-visual" aria-hidden="true">
        <div class="mv-ring"></div><div class="mv-ring r2"></div>
        <div class="mv-center"><div><b>FBC</b><small>Find · Match · Build</small></div></div>
        <div class="mv-node n1"><span class="avatar">AS</span><span>Founder <em>· needs dev</em></span></div>
        <div class="mv-node n2"><span class="avatar" style="background:#F3F0E8">AG</span><span>Full-stack <em>· 2nd yr</em></span></div>
        <div class="mv-node n3"><span class="avatar" style="background:#F3F0E8">RV</span><span>Finance <em>· 3rd yr</em></span></div>
        <div class="mv-node n4"><span class="avatar">94%</span><span>It's a match</span></div>
      </div>
    </div></section>

    <div class="marquee"><div class="marquee-track">${Array(2).fill(["Learn", "Connect", "Build", "Pitch", "Grow", "Validate", "Ship"].map((w) => `<span>${w}<b>/</b></span>`).join("")).join("")}</div></div>

    <section class="section"><div class="container">
      <div class="section-head reveal"><div><span class="eyebrow">The problem</span><h2>Finding a co-founder<br/>shouldn't take months.</h2></div>
        <p class="lead">Every year hundreds of students try for a handful of club seats. Interest and ability were never the issue. There just wasn't a place for them.</p></div>
      <div class="ways reveal">
        <div class="way bad"><span class="spaced muted">Way 1 · the old way</span>
          <ol><li>Contact 500+ people, one by one</li><li>Pitch your idea to hundreds</li><li>Filter: who likes it?</li><li>Filter: who'll actually work on it?</li><li><s>Find one co-founder… months later</s></li></ol></div>
        <div class="way good"><span class="spaced gold">Way 2 · FBC</span>
          <div class="big mt-2">1 profile.</div><div class="big gold">Many matches.</div>
          <p class="muted mt-2">Post your idea once. Builders with the skills you need find <em>you</em>. Then meet them at Pitch Night.</p>
          <a href="#matchmaking" class="btn btn-primary mt-2">See how it works <span class="arrow">→</span></a></div>
      </div>
    </div></section>

    <section class="section" style="padding-top:0"><div class="container">
      <div class="section-head reveal"><div><span class="eyebrow">How we operate</span><h2>Four pillars.</h2></div>
        <p class="lead">From your first “what's a cap table?” to your first demo day.</p></div>
      <div class="pillars reveal">
        ${[["Learn", "Workshops, founder talks, case studies and curated resources.", ["Knowledge sessions", "Startup case studies", "Founder interviews"]],
           ["Connect", "Meet people with complementary skills and a shared drive.", ["Co-founder matchmaking", "Builder profiles", "Networking meets"]],
           ["Build", "Move from idea to execution with real problems and real teams.", ["Ideation sessions", "Validation exercises", "MVP challenges"]],
           ["Pitch & Grow", "Present, get honest feedback, and find what's next.", ["Mock pitches", "Demo days", "Mentor & investor intros"]]]
          .map(([t, d, l], i) => `<div class="pillar"><div class="step">0${i + 1}</div><h3>${t}</h3><p class="muted small">${d}</p><ul>${l.map((x) => `<li>${x}</li>`).join("")}</ul></div>`).join("")}
      </div>
    </div></section>

    <section class="section" style="padding-top:0"><div class="container">
      <div class="section-head reveal"><div><span class="eyebrow">Co-founder matchmaking</span><h2>Find <span class="slash">/</span> Match <span class="slash">/</span> Build</h2></div>
        <a href="#matchmaking" class="btn btn-ghost">Browse all ventures <span class="arrow">→</span></a></div>
      <div class="steps-line reveal">
        <div class="step-card"><span class="spaced">01 · Founders</span><h3>Post your idea</h3><p class="muted">Tell us what you're building and who you need. We share it with the whole community.</p></div>
        <div class="step-card"><span class="spaced">02 · Builders</span><h3>Apply to ventures</h3><p class="muted">Create a profile with your skills and interests. Apply to the ideas that excite you.</p></div>
        <div class="step-card"><span class="spaced">03 · Pitch Night</span><h3>Meet in person</h3><p class="muted">Founders pitch to the room. Conversations start. Teams form.</p></div>
      </div>
      <div class="grid g3 mt-3 reveal">${D.ventures.slice(0, 3).map(ventureCard).join("")}</div>
    </div></section>

    <section class="section" style="padding-top:0"><div class="container">
      <a href="#validate" class="card hover newsletter reveal" style="display:grid">
        <div><span class="eyebrow">Featured tool · VistaDex</span><h2 class="mt-1">Not sure your idea is worth building?</h2>
          <p class="lead mt-1">Validate it first. Run a quick idea check, or go deeper with VistaDex, built by an FBC member.</p></div>
        <div style="justify-self:end"><span class="btn btn-primary">Validate my idea <span class="arrow">→</span></span></div>
      </a>
    </div></section>

    <section class="section" style="padding-top:0"><div class="container">
      <div class="section-head reveal"><div><span class="eyebrow">Upcoming</span><h2>Events by FBC</h2></div><a href="#events" class="btn btn-ghost">All events <span class="arrow">→</span></a></div>
      <div class="grid reveal">${upcoming.map(eventCard).join("")}</div>
    </div></section>

    <section class="section" style="padding-top:0"><div class="container">
      <div class="section-head reveal"><div><span class="eyebrow">The Journal</span><h2>Startup stories & analysis</h2></div><a href="#journal" class="btn btn-ghost">Read the journal <span class="arrow">→</span></a></div>
      <div class="grid g3 reveal">${D.posts.slice(0, 3).map(postCard).join("")}</div>
    </div></section>
    ${ctaBand()}`;
  };

  /* ---------- AUTH ---------- */
  const authSide = (quote) => `
    <aside class="auth-side">
      <a href="#home" class="brand"><span class="brand-mark">FBC<span class="dot"></span></span><span class="brand-sub">Founders &amp; Builders<br/>Collective</span></a>
      <blockquote>${quote}</blockquote>
      <span class="spaced muted">Ideas <span class="slash">/</span> People <span class="slash">/</span> Impact</span>
    </aside>`;

  views.login = () => `
    <section class="auth-wrap page-enter">
      ${authSide("“People can only join you if they know what you are building.”")}
      <div class="auth-main"><form class="auth-card" id="loginForm" novalidate>
        <span class="eyebrow">Welcome back</span><h2 class="mt-1">Log in</h2>
        <p class="muted mt-1">Use your BITS email to continue.</p>
        <button type="button" class="btn btn-quiet btn-block mt-2" data-google>Continue with Google (BITS)</button>
        <div class="divider">or</div>
        <div class="field"><label>BITS email</label><input class="input" type="email" name="email" placeholder="f2024xxxx@pilani.bits-pilani.ac.in" required/></div>
        <div class="field mt-1"><label>Password</label><input class="input" type="password" name="password" placeholder="••••••••" required/></div>
        <p class="error mt-1" id="loginErr"></p>
        <button class="btn btn-primary btn-block mt-2">Log in <span class="arrow">→</span></button>
        <p class="small muted center mt-2">New here? <a href="#signup" class="link">Create an account</a></p>
      </form></div>
    </section>`;

  views.signup = () => `
    <section class="auth-wrap page-enter">
      ${authSide("“We want to learn entrepreneurship. If you are willing to join us, let's learn it together.”")}
      <div class="auth-main"><form class="auth-card" id="signupForm" novalidate>
        <span class="eyebrow">Join the collective</span><h2 class="mt-1">Create your account</h2>
        <p class="muted mt-1 small">I'm joining as…</p>
        <div class="role-cards mt-1">
          <div class="role-card on" data-role="founder"><div class="emoji">💡</div><b>Founder</b><small>I have an idea and need a team</small></div>
          <div class="role-card" data-role="builder"><div class="emoji">🛠️</div><b>Builder</b><small>I want to join and build</small></div>
          <div class="role-card" data-role="explorer"><div class="emoji">🧭</div><b>Explorer</b><small>Just curious about startups</small></div>
        </div>
        <div class="field mt-2"><label>Full name</label><input class="input" name="name" placeholder="Your name" required/></div>
        <div class="field mt-1"><label>BITS email</label><input class="input" type="email" name="email" placeholder="f2024xxxx@pilani.bits-pilani.ac.in" required/>
          <span class="hint">We only accept BITS emails so the community stays campus-first.</span></div>
        <div class="field mt-1"><label>Password</label><input class="input" type="password" name="password" placeholder="At least 8 characters" required/></div>
        <p class="error mt-1" id="signupErr"></p>
        <button class="btn btn-primary btn-block mt-2">Continue to profile setup <span class="arrow">→</span></button>
        <p class="hint center mt-1">Next you can fill your profile by hand, or let your AI do it in about 2 minutes.</p>
        <p class="small muted center mt-2">Already a member? <a href="#login" class="link">Log in</a></p>
      </form></div>
    </section>`;

  /* ---------- ONBOARDING / PROFILE SETUP ---------- */
  // ob.mode: null = choose method, "ai" = copy prompt / paste reply, "review" = check AI-filled profile, "manual" = 3-step form
  let ob = { step: 0, mode: null };
  const AVAIL = ["< 5 hrs/week", "5–10 hrs/week", "10–20 hrs/week", "20+ hrs/week"];
  const EQUITY = ["Co-founder equity", "Open to discuss", "Paid + ESOP", "Not decided yet"];
  const LOOKING = ["Join a venture as a co-founder", "Early team member role", "Internships at startups", "Just learning and exploring"];
  const isFounder = (u) => u.role === "founder";
  const roleName = (u) => (isFounder(u) ? "Founder" : u.role === "builder" ? "Builder" : "Explorer");
  const stepLabels = (u) => (isFounder(u) ? ["About you", "Your venture", "Who you need"] : ["About you", "Skills", "Interests"]);

  const stepBody = (s, u) => {
    const founder = isFounder(u);
    const chips = (list, key) => `<div class="chip-select" data-chips="${key}">${list.map((x) => `<button type="button" class="chip ${(u[key] || []).includes(x) ? "on" : ""}">${x}</button>`).join("")}</div>`;
    const opts = (list, val) => `<option value="" ${val ? "" : "selected"} disabled>Choose…</option>` + list.map((o) => `<option ${val === o ? "selected" : ""}>${o}</option>`).join("");
    if (s === 0) return `
      <div class="form-grid">
        <div class="field"><label>Full name</label><input class="input" name="name" value="${esc(u.name)}"/></div>
        <div class="field"><label>Year & branch</label><input class="input" name="year" value="${esc(u.year || "")}" placeholder="e.g. 2nd year, CS"/></div>
        <div class="field full"><label>One-line bio</label><input class="input" name="bio" value="${esc(u.bio || "")}" placeholder="What drives you?"/></div>
        <div class="field"><label>LinkedIn</label><input class="input" name="linkedin" value="${esc(u.linkedin || "")}" placeholder="linkedin.com/in/…"/></div>
        <div class="field"><label>Availability</label><select class="input" name="avail">${opts(AVAIL, u.avail)}</select></div>
      </div>`;
    if (s === 1 && founder) return `
      <div class="form-grid">
        <div class="field"><label>Venture name</label><input class="input" name="vname" value="${esc(u.vname || "")}" placeholder="Working name is fine"/></div>
        <div class="field"><label>Stage</label><select class="input" name="vstage">${D.stages.map((o, i) => `<option value="${i}" ${+u.vstage === i ? "selected" : ""}>${o}</option>`).join("")}</select></div>
        <div class="field full"><label>The problem you're solving</label><textarea class="input" name="vproblem" placeholder="Who has this problem, and how do they deal with it today?">${esc(u.vproblem || "")}</textarea></div>
        <div class="field full"><label>One-line pitch</label><input class="input" name="vpitch" value="${esc(u.vpitch || "")}" placeholder="We help ___ do ___ by ___"/></div>
        <div class="field full"><label>Domain</label>${chips(D.domains, "domains")}</div>
      </div>`;
    if (s === 1) return `<div class="field"><label>What can you bring to a team? Pick all that apply.</label>${chips(D.skills, "skills")}</div>
      <div class="field mt-2"><label>Anything you've built or worked on?</label><textarea class="input" name="work" placeholder="Projects, internships, links…">${esc(u.work || "")}</textarea></div>`;
    if (s === 2 && founder) return `<div class="field"><label>Skills you're looking for in a co-founder</label>${chips(D.skills, "needs")}</div>
      <div class="form-grid mt-2"><div class="field"><label>Expected commitment</label><input class="input" name="commit" value="${esc(u.commit || "")}" placeholder="e.g. 10–15 hrs/week"/></div>
      <div class="field"><label>Equity / compensation</label><select class="input" name="equity">${opts(EQUITY, u.equity)}</select></div>
      <div class="field full"><label><input type="checkbox" name="pitchnight" ${u.pitchnight ? "checked" : ""}/> &nbsp;I'd like to pitch at the next Pitch Night</label></div></div>`;
    return `<div class="field"><label>Domains that excite you</label>${chips(D.domains, "domains")}</div>
      <div class="field mt-2"><label>What are you looking for?</label><select class="input" name="looking">${opts(LOOKING, u.looking)}</select></div>`;
  };

  /* ----- AI import: the prompt people paste into their own chatbot ----- */
  const aiTemplate = (u) => isFounder(u)
    ? { name: "", year_and_branch: "", one_line_bio: "", linkedin: "", availability: "", venture_name: "", stage: "", problem: "", one_line_pitch: "", domains: [], skills_needed: [], commitment: "", equity: "" }
    : { name: "", year_and_branch: "", one_line_bio: "", linkedin: "", availability: "", skills: [], past_work: "", domains: [], looking_for: "" };

  const aiPrompt = (u) => {
    const founder = isFounder(u);
    const lists = founder
      ? [["availability", AVAIL], ["stage", D.stages], ["domains (pick 1–3)", D.domains], ["skills_needed (pick 1–4)", D.skills], ["equity", EQUITY]]
      : [["availability", AVAIL], ["skills (pick 1–5)", D.skills], ["domains (pick 1–4)", D.domains], ["looking_for", LOOKING]];
    return `I'm joining the Founders and Builders Collective (FBC), a student startup community at BITS Pilani, and setting up my ${founder ? "FOUNDER" : roleName(u).toUpperCase()} profile. ${founder
      ? "Founders list their idea so students with the right skills can apply to join as co-founders."
      : "Members list their skills and interests so founders can find them, and they can apply to join ventures."}

Using what you already know about me${founder ? " and my project" : ""} from our past conversations, fill in the profile below.

Rules:
1. Only use what you actually know. If you're not sure about a field, leave it as "". Don't guess, and don't exaggerate ${founder ? "traction" : "experience"}.
2. Leave out anything confidential or sensitive: phone numbers, grades, passwords, unreleased financials, private details about other people${founder ? ", or anything about the project I've asked you to keep secret" : ""}. If you're unsure whether something is OK to share, ask me first.
3. If you don't know enough about me, interview me instead: ask me short questions one at a time (no more than 8), then fill in the profile.
4. For these fields, use ONLY values from the lists:
${lists.map(([k, l]) => `   - ${k}: ${l.join(" | ")}`).join("\n")}
5. Keep it short: bio under 20 words${founder ? ", pitch under 25 words, problem under 60 words" : ", past_work under 60 words"}.
6. When you're done, reply with ONLY the filled-in JSON in a single code block, then one line saying which fields you left blank.

\`\`\`json
${JSON.stringify(aiTemplate(u), null, 2)}
\`\`\``;
  };

  // A deliberately messy reply, so the team can demo the import without a chatbot
  const aiSample = (u) => isFounder(u)
    ? `Sure! Based on what we've discussed, here's your FBC profile:

\`\`\`json
{
  "name": "${u.name}",
  "year_and_branch": "1st year, Mechanical",
  "one_line_bio": "Mech fresher obsessed with making campus transport cleaner and cheaper.",
  "linkedin": "",
  "availability": "around 15 hours a week",
  "venture_name": "Voltway",
  "stage": "building a prototype",
  "problem": "Students with e-cycles and e-scooters lose hours charging them, and hostel sockets are limited. Many give up and go back to petrol or walking.",
  "one_line_pitch": "Battery-swap stations for campus e-scooters: swap in 30 seconds, pay per swap.",
  "domains": ["ClimateTech", "hardware"],
  "skills_needed": ["embedded systems", "Finance", "operations"],
  "commitment": "10-15 hrs/week",
  "equity": "co-founder equity",
}
\`\`\`
Left blank: linkedin (I don't know your profile URL).`
    : `Here you go:

\`\`\`json
{
  "name": "${u.name}",
  "year_and_branch": "2nd year, CS",
  "one_line_bio": "I build web apps fast and like turning rough ideas into working products.",
  "linkedin": "",
  "availability": "8 hrs/week",
  "skills": ["React", "Node backend", "Figma", "machine learning"],
  "past_work": "Built a hostel laundry-booking app used by 300 students; summer intern at a fintech startup working on the dashboard.",
  "domains": ["EdTech", "fintech", "AI"],
  "looking_for": "I want to join an early-stage team as a technical co-founder"
}
\`\`\`
Left blank: linkedin.`;

  /* ----- AI import: reading the reply back ----- */
  const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const SYN = {
    "Full-stack dev": ["full stack", "fullstack", "web", "frontend", "front end", "backend", "back end", "react", "node", "javascript", "developer", "software", "coding", "programming", "app", "android", "ios", "flutter", "sde"],
    "ML engineer": ["ml", "machine learning", "ai", "deep learning", "data science", "computer vision", "nlp", "llm", "data scientist"],
    "Hardware / IoT": ["hardware", "iot", "embedded", "electronics", "robotics", "circuit", "pcb", "arduino", "firmware"],
    "Design / UX": ["design", "designer", "ux", "ui", "figma", "graphic", "graphics"],
    "Product": ["product", "pm", "product manager", "product management"],
    "Growth / Marketing": ["marketing", "growth", "social media", "seo", "community", "branding"],
    "Sales / BD": ["sales", "bd", "business development", "partnerships", "outreach"],
    "Finance": ["finance", "financial", "accounting", "fundraising", "financial modelling", "financial modeling"],
    "Content": ["content", "writing", "copywriting", "video", "editing", "blog"],
    "Operations": ["operations", "ops", "logistics", "supply chain"],
    "AI / ML": ["ai", "ml", "machine learning", "artificial intelligence", "genai", "llm"],
    "SaaS": ["saas", "b2b software", "enterprise software", "software"],
    "FinTech": ["fintech", "payments", "finance", "banking", "upi"],
    "HealthTech": ["health", "healthtech", "medical", "medtech", "healthcare", "biotech"],
    "EdTech": ["edtech", "education", "learning", "teaching"],
    "ClimateTech": ["climate", "cleantech", "sustainability", "energy", "ev", "renewable", "mobility"],
    "D2C / Consumer": ["d2c", "consumer", "ecommerce", "e commerce", "retail", "brand", "food"],
    "Deep Tech": ["deep tech", "deeptech", "robotics", "semiconductor", "hardware", "aerospace", "quantum"],
    "AgriTech": ["agri", "agritech", "agriculture", "farming", "farmers"],
    "Social Impact": ["social", "impact", "ngo", "nonprofit", "non profit"],
    "Co-founder equity": ["equity", "co founder", "cofounder"],
    "Paid + ESOP": ["paid", "stipend", "salary", "esop"],
    "Open to discuss": ["discuss", "open", "flexible", "negotiable"],
    "Not decided yet": ["not decided", "undecided", "tbd", "unsure"],
    "Join a venture as a co-founder": ["co founder", "cofounder"],
    "Early team member role": ["team member", "early team", "early stage", "join a team"],
    "Internships at startups": ["intern", "internship", "internships"],
    "Just learning and exploring": ["learn", "learning", "explore", "exploring", "curious"],
  };
  const has = (n, w) => (" " + n + " ").includes(" " + w + " ");
  const matchOne = (val, options) => {
    const n = norm(val);
    if (!n) return null;
    return options.find((o) => norm(o) === n)
      || options.find((o) => (SYN[o] || []).some((w) => has(n, w)))
      || options.find((o) => n.length > 3 && norm(o).includes(n))
      || null;
  };
  const matchList = (val, options) => {
    const items = Array.isArray(val) ? val : String(val ?? "").split(/[,;\n]+/);
    const hits = [], misses = [];
    items.map((x) => String(x).trim()).filter(Boolean).forEach((x) => {
      const m = matchOne(x, options);
      if (m) { if (!hits.includes(m)) hits.push(m); } else misses.push(x);
    });
    return { hits, misses };
  };
  const matchStage = (val) => {
    if (typeof val === "number" && D.stages[val]) return val;
    const n = norm(val);
    if (!n) return null;
    const exact = D.stages.findIndex((s) => norm(s) === n);
    if (exact >= 0) return exact;
    if (/revenue|paying|profit|sales/.test(n)) return 4;
    if (/users|beta|pilot|launched|customers|live/.test(n)) return 3;
    if (/mvp|prototype|building|build|develop/.test(n)) return 2;
    if (/validat|interview|research|survey|testing/.test(n)) return 1;
    if (/idea|concept|thinking/.test(n)) return 0;
    return null;
  };
  const matchAvail = (val) => {
    const direct = matchOne(val, AVAIL);
    if (direct && norm(val) === norm(direct)) return direct;
    const nums = String(val ?? "").match(/\d+/g);
    if (!nums) return null;
    const h = Math.max(...nums.map(Number));
    return h < 5 ? AVAIL[0] : h <= 10 ? AVAIL[1] : h <= 20 ? AVAIL[2] : AVAIL[3];
  };

  const extractJSON = (text) => {
    let t = String(text);
    const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) t = fence[1];
    const a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a < 0 || b <= a) throw new Error("no-json");
    const raw = t.slice(a, b + 1);
    const tries = [raw, raw.replace(/,\s*([}\]])/g, "$1"), raw.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/,\s*([}\]])/g, "$1")];
    for (const s of tries) { try { return JSON.parse(s); } catch {} }
    throw new Error("bad-json");
  };

  const ALIASES = {
    name: ["name", "full name", "fullname"],
    year: ["year and branch", "year branch", "year", "branch"],
    bio: ["one line bio", "bio", "tagline", "about"],
    linkedin: ["linkedin", "linkedin url"],
    avail: ["availability", "hours per week", "time commitment", "avail"],
    vname: ["venture name", "startup name", "project name", "company name"],
    vstage: ["stage", "venture stage", "startup stage"],
    vproblem: ["problem", "the problem", "problem statement"],
    vpitch: ["one line pitch", "pitch", "elevator pitch"],
    domains: ["domains", "domain", "industry", "industries", "interests"],
    needs: ["skills needed", "looking for skills", "cofounder skills", "needs"],
    commit: ["commitment", "expected commitment"],
    equity: ["equity", "compensation"],
    skills: ["skills", "my skills"],
    work: ["past work", "work", "projects", "experience"],
    looking: ["looking for", "goal"],
  };

  // Returns the fields to merge into the profile, plus which were AI-filled, left blank, or didn't match our lists
  const parseAiReply = (text, u) => {
    const obj = extractJSON(text);
    const flat = {};
    const walk = (o) => Object.entries(o || {}).forEach(([k, v]) => {
      if (v && typeof v === "object" && !Array.isArray(v)) walk(v); else flat[norm(k)] = v;
    });
    walk(obj);
    const get = (key) => { for (const a of ALIASES[key]) if (flat[a] !== undefined) return flat[a]; return undefined; };
    const str = (v) => (Array.isArray(v) ? v.join(", ") : String(v ?? "")).trim().slice(0, 600);

    const founder = isFounder(u);
    const keys = founder
      ? ["name", "year", "bio", "linkedin", "avail", "vname", "vstage", "vproblem", "vpitch", "domains", "needs", "commit", "equity"]
      : ["name", "year", "bio", "linkedin", "avail", "skills", "work", "domains", "looking"];
    const out = {}, ai = [], blank = [], unmatched = [];
    keys.forEach((k) => {
      const v = get(k);
      let val = null;
      if (k === "domains" || k === "needs" || k === "skills") {
        const { hits, misses } = matchList(v, k === "domains" ? D.domains : D.skills);
        unmatched.push(...misses);
        val = hits.length ? hits : null;
      } else if (k === "vstage") val = matchStage(v);
      else if (k === "avail") val = matchAvail(v);
      else if (k === "equity") val = matchOne(v, EQUITY);
      else if (k === "looking") val = matchOne(v, LOOKING);
      else val = str(v) || null;
      if (val === null || val === undefined) { blank.push(k); if (str(v) && !["domains", "needs", "skills"].includes(k)) unmatched.push(str(v)); }
      else { out[k] = val; ai.push(k); }
    });
    if (!ai.length) throw new Error("empty");
    return { out, ai, blank, unmatched };
  };

  const FIELD_LABEL = { name: "Full name", year: "Year & branch", bio: "Bio", linkedin: "LinkedIn", avail: "Availability", vname: "Venture name", vstage: "Stage", vproblem: "Problem", vpitch: "Pitch", domains: "Domains", needs: "Skills needed", commit: "Commitment", equity: "Equity", skills: "Skills", work: "Past work", looking: "Looking for" };

  views.onboarding = () => {
    const u = user();
    if (!u) return redirect("signup");
    const founder = isFounder(u);
    const labels = stepLabels(u);
    const head = (sub, title, lead = "") => `<span class="eyebrow">Profile setup · ${roleName(u)}${sub ? " · " + sub : ""}</span>
      <h2 class="mt-1">${title}</h2>${lead ? `<p class="muted mt-1">${lead}</p>` : ""}`;

    /* 1. choose how to fill it */
    if (!ob.mode) return `
    <section class="section-sm page-enter"><div class="narrow">
      ${head("", "How do you want to set up your profile?", founder ? "We need your venture, the problem you're solving and who you're looking for." : "We need your skills, interests and what you're looking for.")}
      <div class="ob-choice mt-3">
        <button class="card hover ob-option" data-obmode="ai">
          <span class="tag gold">Recommended · ~2 min</span>
          <div class="icon-box mt-2">${I.bulb}</div>
          <h3>Fill it with your AI</h3>
          <p class="muted small">Your chatbot already knows ${founder ? "your project" : "you"}. Copy our prompt into ChatGPT, Claude, Gemini or any assistant, then paste its reply back. You review everything before it's saved.</p>
          <span class="link small mt-1">Use my AI →</span>
        </button>
        <button class="card hover ob-option" data-obmode="manual">
          <span class="tag">~5 min</span>
          <div class="icon-box mt-2">${I.pen}</div>
          <h3>Fill it in manually</h3>
          <p class="muted small">Three short steps: ${labels.join(", ").toLowerCase()}.</p>
          <span class="link small mt-1">Fill manually →</span>
        </button>
      </div>
      <p class="center mt-2"><a href="#dashboard" class="link small">Skip for now</a></p>
    </div></section>`;

    /* 2. AI: copy prompt, paste reply */
    if (ob.mode === "ai") return `
    <section class="section-sm page-enter"><div class="narrow">
      ${head("With your AI", "Let your AI do the paperwork.", "Copy the prompt, paste it into the chatbot you use most, then paste its reply below.")}
      <div class="grid mt-3">
        <div class="card ai-step">
          <div class="ai-step-head"><span class="ai-num">01</span><div><h3>Copy this prompt</h3><p class="small muted">Works with ChatGPT, Claude, Gemini, Copilot and others. It works best in the chat or project where you've talked about ${founder ? "your idea" : "your work"}.</p></div></div>
          <textarea class="input prompt-box" id="aiPrompt" readonly>${esc(aiPrompt(u))}</textarea>
          <div class="ai-row"><button type="button" class="btn btn-primary btn-sm" data-copy-prompt>Copy prompt</button>
            <span class="hint">AI doesn't know you yet? That's fine: it will ask you a few quick questions instead.</span></div>
        </div>
        <form class="card ai-step" id="aiImportForm">
          <div class="ai-step-head"><span class="ai-num">02</span><div><h3>Paste your AI's reply</h3><p class="small muted">Paste the whole reply. Extra text around the code block is fine.</p></div></div>
          <textarea class="input" name="reply" style="min-height:180px;font-family:ui-monospace,Menlo,monospace;font-size:.82rem" placeholder='\`\`\`json\n{ "name": "…", … }\n\`\`\`'></textarea>
          <p class="error" id="aiErr"></p>
          <div class="ai-row"><button class="btn btn-primary">Import &amp; review →</button>
            <button type="button" class="btn btn-quiet btn-sm" data-ai-sample>Try a sample reply</button></div>
        </form>
        <div class="ai-privacy"><span class="icon-box" style="margin:0;width:38px;height:38px">${I.check}</span>
          <p class="small muted">Your AI's reply is read here in your browser. Nothing goes on your profile until you've reviewed it and pressed save. Remove anything you don't want other members to see.</p></div>
      </div>
      <p class="center mt-2 small"><a href="javascript:void 0" class="link" data-obmode="">← Back</a> <span class="muted">·</span> <a href="javascript:void 0" class="link" data-obmode="manual">Fill manually instead</a></p>
    </div></section>`;

    /* 3. review AI-filled profile, all on one page */
    if (ob.mode === "review") {
      const blank = u._blank || [], unmatched = u._unmatched || [];
      return `
    <section class="section-sm page-enter"><div class="narrow">
      ${head("Review", "Check what your AI filled in.", `Fields marked <span class="ai-badge">AI</span> came from your chatbot. Fix anything that's wrong, or that you don't want public.`)}
      <div class="grid mt-2">
        <div class="card ai-summary"><b class="accent">✓ ${(u._ai || []).length} fields filled</b>${blank.length ? `<span class="muted small">Still empty: ${blank.map((k) => FIELD_LABEL[k] || k).join(", ")}</span>` : `<span class="muted small">Nothing left empty.</span>`}</div>
        ${unmatched.length ? `<div class="card ai-summary" style="border-color:rgba(245,184,41,.4)"><b class="gold">Didn't match our lists</b><span class="muted small">Your AI also said: ${unmatched.map((x) => `“${esc(x)}”`).join(", ")}. If any of these apply, pick the closest option below.</span></div>` : ""}
      </div>
      <form class="card mt-2" id="obForm" data-review style="padding:2rem">
        ${[0, 1, 2].map((s) => `<h3 class="spaced gold review-h">${labels[s]}</h3>${stepBody(s, u)}`).join("")}
        <div style="display:flex;justify-content:space-between;margin-top:2rem;gap:1rem;flex-wrap:wrap">
          <button type="button" class="btn btn-quiet" data-obmode="ai">← Paste a different reply</button>
          <button class="btn btn-primary">Looks good, save profile ✓</button>
        </div>
      </form>
    </div></section>`;
    }

    /* 4. manual, 3 steps */
    const s = ob.step;
    return `
    <section class="section-sm page-enter"><div class="narrow">
      ${head("", ["Tell us about you", founder ? "What are you building?" : "What do you bring?", founder ? "Who do you need?" : "What excites you?"][s])}
      <div class="stepper mt-2">${labels.map((l, i) => `<div class="${i < s ? "done" : i === s ? "cur" : ""}"><i></i><span>${l}</span></div>`).join("")}</div>
      <form class="card" id="obForm" style="padding:2rem">${stepBody(s, u)}
        <div style="display:flex;justify-content:space-between;margin-top:2rem;gap:1rem">
          ${s > 0 ? `<button type="button" class="btn btn-quiet" data-ob="back">← Back</button>` : `<button type="button" class="btn btn-quiet" data-obmode="">← Back</button>`}
          <button class="btn btn-primary">${s === 2 ? "Finish setup ✓" : "Next →"}</button>
        </div>
      </form>
      <p class="center mt-2 small"><a href="javascript:void 0" class="link" data-obmode="ai">Use my AI instead</a></p>
    </div></section>`;
  };

  /* ---------- DASHBOARD ---------- */
  let dashTab = "overview";
  views.dashboard = () => {
    const u = user();
    if (!u) return redirect("login");
    const fields = ["name", "year", "bio", "linkedin", "avail", u.role === "founder" ? "vpitch" : "work"];
    const extras = u.role === "founder" ? (u.needs || []).length : (u.skills || []).length;
    const pct = Math.round(((fields.filter((f) => u[f]).length + (extras ? 1 : 0) + ((u.domains || []).length ? 1 : 0)) / (fields.length + 2)) * 100);
    const apps = store.get("applications", []);
    const rsvps = store.get("rsvps", []);
    const checks = store.get("ideachecks", []);
    const mine = new Set([...(u.skills || []), ...(u.needs || [])]);
    const recVentures = [...D.ventures].map((v) => ({ ...v, score: 60 + v.needs.filter((n) => (u.skills || []).includes(n)).length * 15 + ((u.domains || []).includes(v.domain) ? 15 : 0) })).sort((a, b) => b.score - a.score).slice(0, 3);
    const recBuilders = [...D.builders].map((b) => ({ ...b, score: 60 + b.skills.filter((s) => (u.needs || []).includes(s)).length * 18 + b.interests.filter((i) => (u.domains || []).includes(i)).length * 8 })).sort((a, b) => b.score - a.score).slice(0, 3);

    const side = [["overview", "Overview", I.grid], ["matches", "Matches", I.users], ["applications", "Applications", I.brief], ["events", "My events", I.cal], ["profile", "Profile", I.user]]
      .map(([k, l, ic]) => `<a href="javascript:void 0" data-dash="${k}" class="${dashTab === k ? "on" : ""}">${ic}${l}</a>`).join("") +
      `<a href="#validate">${I.target}Validate idea</a><a href="javascript:void 0" data-logout>${I.out}Log out</a>`;

    const recBlock = u.role === "founder"
      ? `<h3>Builders who fit your venture</h3><p class="small muted">Based on the skills you're looking for.</p>
         ${recBuilders.map((b) => `<div class="list-row"><span class="avatar">${initials(b.name)}</span><div class="grow"><b>${b.name}</b> <span class="small muted">· ${b.year}</span><div class="tags mt-1">${b.skills.map((s) => `<span class="tag ${mine.has(s) ? "gold" : ""}">${s}</span>`).join("")}</div></div><span class="match-score">${Math.min(b.score, 99)}%</span><button class="btn btn-ghost btn-sm" data-connect="${b.name}">Connect</button></div>`).join("")}`
      : `<h3>Ventures that need you</h3><p class="small muted">Based on your skills and interests.</p>
         ${recVentures.map((v) => `<div class="list-row"><div class="v-logo">${v.logo}</div><div class="grow"><b>${v.name}</b> <span class="small muted">· ${v.domain}</span><div class="tags mt-1">${v.needs.map((s) => `<span class="tag ${mine.has(s) ? "gold" : ""}">${s}</span>`).join("")}</div></div><span class="match-score">${Math.min(v.score, 99)}%</span><button class="btn btn-ghost btn-sm" data-venture="${v.id}">View</button></div>`).join("")}`;

    const appsBlock = apps.length
      ? apps.map((a) => { const v = D.ventures.find((x) => x.id === a.id); return v ? `<div class="list-row"><div class="v-logo">${v.logo}</div><div class="grow"><b>${v.name}</b><div class="small muted">Applied ${fmt(a.date)}</div></div><span class="status review">In review</span></div>` : ""; }).join("")
      : `<div class="empty">No applications yet. <a href="#matchmaking" class="link">Browse ventures →</a></div>`;
    const evBlock = rsvps.length ? rsvps.map((id) => D.events.find((e) => e.id === id)).filter(Boolean).map(eventCard).join("") : `<div class="empty">You haven't RSVP'd to anything yet. <a href="#events" class="link">See events →</a></div>`;

    let main = "";
    if (dashTab === "overview") main = `
      <div class="grid g4">
        <div class="card stat"><span class="small muted">Profile</span><b>${pct}%</b><div class="progress mt-1"><i style="width:${pct}%"></i></div></div>
        <div class="card stat"><span class="small muted">${u.role === "founder" ? "Interested builders" : "Applications"}</span><b>${u.role === "founder" ? 5 : apps.length}</b></div>
        <div class="card stat"><span class="small muted">Events RSVP'd</span><b>${rsvps.length}</b></div>
        <div class="card stat"><span class="small muted">Idea checks</span><b>${checks.length}</b></div>
      </div>
      ${pct < 100 ? `<div class="card mt-2" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;border-color:rgba(245,184,41,.4)"><div><b>Complete your profile</b><p class="small muted">Complete profiles get matched first and show up higher in search.</p></div><div class="tags"><a href="javascript:void 0" data-obmode="ai" class="btn btn-primary btn-sm">Finish with my AI →</a><a href="javascript:void 0" data-obmode="manual" class="btn btn-quiet btn-sm">Fill manually</a></div></div>` : ""}
      <div class="grid g2 mt-2" style="align-items:start">
        <div class="card">${recBlock}</div>
        <div class="card"><h3>Next up</h3>${D.events.filter((e) => e.upcoming).slice(0, 3).map((e) => `<div class="list-row"><div class="date-block" style="padding:.4rem .6rem"><b style="font-size:1.2rem">${new Date(e.date).getDate()}</b><span>${new Date(e.date).toLocaleString("en", { month: "short" })}</span></div><div class="grow"><b class="small">${e.title}</b><div class="small muted">${e.time}</div></div>${rsvps.includes(e.id) ? `<span class="status ok">Going</span>` : `<button class="btn btn-quiet btn-sm" data-rsvp="${e.id}">RSVP</button>`}</div>`).join("")}
          <h3 class="mt-2">Quick actions</h3>
          <div class="tags mt-1"><a class="btn btn-quiet btn-sm" href="#validate">Validate an idea</a><a class="btn btn-quiet btn-sm" href="#opportunities">Find internships</a><a class="btn btn-quiet btn-sm" href="#resources">Pitch deck template</a></div></div>
      </div>`;
    else if (dashTab === "matches") main = `<div class="card">${recBlock}</div>`;
    else if (dashTab === "applications") main = `<div class="card"><h3>${u.role === "founder" ? "Applications to your venture" : "Your applications"}</h3>${u.role === "founder"
      ? D.builders.slice(0, 4).map((b, i) => `<div class="list-row"><span class="avatar">${initials(b.name)}</span><div class="grow"><b>${b.name}</b><div class="small muted">${b.skills.join(" · ")}</div></div><span class="status ${i === 0 ? "new" : "review"}">${i === 0 ? "New" : "To review"}</span><button class="btn btn-ghost btn-sm" data-connect="${b.name}">Review</button></div>`).join("")
      : appsBlock}</div>`;
    else if (dashTab === "events") main = `<div class="grid">${evBlock}</div>`;
    else main = `<div class="card"><div style="display:flex;gap:1.2rem;align-items:center"><span class="avatar avatar-lg">${initials(u.name)}</span><div><h3 style="margin:0">${esc(u.name)}</h3><div class="muted small">${esc(u.year || "Add your year & branch")} · <span class="gold">${u.role}</span></div><p class="mt-1">${esc(u.bio || "No bio yet.")}</p></div></div>
      <div class="mt-2"><div class="needs small muted">Skills / needs</div><div class="tags mt-1">${[...(u.skills || []), ...(u.needs || [])].map((s) => `<span class="tag">${s}</span>`).join("") || '<span class="muted small">None yet</span>'}</div></div>
      <div class="mt-2"><div class="needs small muted">Domains</div><div class="tags mt-1">${(u.domains || []).map((s) => `<span class="tag gold">${s}</span>`).join("") || '<span class="muted small">None yet</span>'}</div></div>
      ${u.vname ? `<div class="mt-2 card" style="background:var(--bg-2)"><span class="tag gold">Your venture</span><h3 class="mt-1">${esc(u.vname)}</h3><p class="muted">${esc(u.vpitch || "")}</p></div>` : ""}
      <div class="tags mt-2"><a href="javascript:void 0" data-obmode="manual" class="btn btn-ghost">Edit profile</a><a href="javascript:void 0" data-obmode="ai" class="btn btn-quiet">Update with my AI</a></div></div>`;

    return `
    <div class="container dash page-enter">
      <aside class="dash-side">${side}</aside>
      <div>
        <div style="display:flex;justify-content:space-between;align-items:end;gap:1rem;flex-wrap:wrap;margin-bottom:2rem">
          <div><span class="eyebrow">Dashboard</span><h2 class="mt-1">Hey ${esc(u.name.split(" ")[0])} <span class="script gold" style="font-size:2rem">let's build.</span></h2></div>
          ${u.role === "founder" ? `<a href="#matchmaking" class="btn btn-primary">View my listing →</a>` : `<a href="#matchmaking" class="btn btn-primary">Find ventures →</a>`}
        </div>
        ${main}
      </div>
    </div>`;
  };

  /* ---------- MATCHMAKING ---------- */
  let mm = { tab: "ventures", q: "", domain: "", skill: "" };
  views.matchmaking = () => {
    const list = mm.tab === "ventures"
      ? D.ventures.filter((v) => (!mm.q || (v.name + v.pitch).toLowerCase().includes(mm.q.toLowerCase())) && (!mm.domain || v.domain === mm.domain) && (!mm.skill || v.needs.includes(mm.skill)))
      : D.builders.filter((b) => (!mm.q || (b.name + b.looking).toLowerCase().includes(mm.q.toLowerCase())) && (!mm.domain || b.interests.includes(mm.domain)) && (!mm.skill || b.skills.includes(mm.skill)));
    const cards = mm.tab === "ventures" ? list.map(ventureCard).join("")
      : list.map((b) => `<article class="card hover"><div class="venture-top"><span class="avatar">${initials(b.name)}</span><div><h3 style="margin:0">${b.name}</h3><span class="small muted">${b.year}</span></div></div>
          <p class="muted small mt-1">${b.looking}</p><div class="tags mt-1">${b.skills.map((s) => `<span class="tag gold">${s}</span>`).join("")}</div>
          <div class="tags mt-1">${b.interests.map((s) => `<span class="tag">${s}</span>`).join("")}</div>
          <button class="btn btn-ghost btn-sm mt-2" data-connect="${b.name}">Invite to my venture</button></article>`).join("");
    return `
    ${pageHead("Co-founder matchmaking", `Find <span class="gold">/</span> Match <span class="gold">/</span> Build`, "Founders post their ideas and who they need. Builders apply to the ventures they believe in. Then everyone meets at Pitch Night.",
      `<div class="hero-cta"><a href="#signup" class="btn btn-primary" data-role-link="founder">List your idea <span class="arrow">→</span></a><a href="#signup" class="btn btn-ghost" data-role-link="builder">Create a builder profile</a></div>`)}
    <section class="container" style="padding-bottom:100px">
      <div class="toolbar">
        <div class="tabs"><button data-mmtab="ventures" class="${mm.tab === "ventures" ? "on" : ""}">Ventures (${D.ventures.length})</button><button data-mmtab="builders" class="${mm.tab === "builders" ? "on" : ""}">Builders (${D.builders.length})</button></div>
        <input class="input" id="mmQ" placeholder="Search ${mm.tab}…" value="${esc(mm.q)}"/>
        <select class="input" id="mmDomain" style="max-width:200px"><option value="">All domains</option>${D.domains.map((d) => `<option ${mm.domain === d ? "selected" : ""}>${d}</option>`).join("")}</select>
        <select class="input" id="mmSkill" style="max-width:200px"><option value="">${mm.tab === "ventures" ? "Any skill needed" : "Any skill"}</option>${D.skills.map((d) => `<option ${mm.skill === d ? "selected" : ""}>${d}</option>`).join("")}</select>
      </div>
      <div class="grid g3" id="mmList">${cards || `<div class="empty" style="grid-column:1/-1">Nothing matches those filters yet.</div>`}</div>
      <div class="card mt-3" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap">
        <div><span class="tag gold">Pitch Night · ${fmt("2026-12-04", { day: "numeric", month: "short" })}</span><h3 class="mt-1">Explain your idea to the room</h3><p class="muted small">Every founder who lists an idea gets a slot to pitch it to the community.</p></div>
        <a href="#events" class="btn btn-ghost">Event details →</a></div>
    </section>`;
  };

  const ventureModal = (id) => {
    const v = D.ventures.find((x) => x.id === id); if (!v) return;
    const applied = store.get("applications", []).some((a) => a.id === id);
    openModal(`
      <div class="venture-top"><div class="v-logo" style="width:60px;height:60px;font-size:1.3rem">${v.logo}</div><div><h2 style="font-size:1.8rem">${v.name}</h2><span class="muted small">by ${v.founder} · ${v.year}</span></div></div>
      <div class="tags mt-2"><span class="tag gold">${v.domain}</span><span class="tag">${D.stages[v.stage]}</span><span class="tag">${v.commitment}</span><span class="tag">${v.equity}</span></div>
      <p class="mt-2" style="font-size:1.05rem">${v.pitch}</p>
      <div class="mt-2"><div class="needs small muted" style="letter-spacing:.15em;text-transform:uppercase">Looking for</div><div class="tags mt-1">${v.needs.map((n) => `<span class="tag">${n}</span>`).join("")}</div></div>
      <div class="mt-2" style="display:flex;justify-content:space-between;align-items:center">${stageDots(v.stage)}<span class="small muted">${v.applicants} people applied</span></div>
      <form id="applyForm" data-id="${v.id}" class="mt-2" ${applied ? "hidden" : ""}>
        <div class="field"><label>Why do you want to build this? What would you bring?</label><textarea class="input" required placeholder="Keep it short and honest."></textarea></div>
        <button class="btn btn-primary btn-block mt-1">Apply to join ${v.name} →</button></form>
      ${applied ? `<div class="card mt-2 center" style="border-color:var(--accent)"><b class="accent">✓ Applied</b><p class="small muted">The founder will reach out. Track it in your dashboard.</p></div>` : ""}`);
  };

  /* ---------- VALIDATE (VistaDex + quick idea check) ---------- */
  const QUESTIONS = [
    ["problem", "I can describe the problem in one sentence, without mentioning my solution."],
    ["who", "I know exactly who has this problem (a specific group, not “everyone”)."],
    ["talked", "I've talked to at least 10 people who have this problem."],
    ["pain", "They're actively trying to solve it today (workarounds, spending money or time)."],
    ["alt", "I know the existing alternatives and why they fall short."],
    ["pay", "Someone has said they'd pay, pre-order, or sign up for this."],
    ["why", "I know why I/we are the right people to build this, and why now."],
  ];
  views.validate = () => `
    ${pageHead("Validate your idea", `Test it <span class="gold">before</span> you build it.`, "Most startups don't fail because they can't build. They fail because nobody needed what they built. Check your idea in two minutes, or go deep with VistaDex.")}
    <section class="section-sm"><div class="container">
      <div class="newsletter reveal" style="border-color:rgba(245,184,41,.45)">
        <div>
          <span class="eyebrow">Featured tool</span>
          <h2 class="mt-1" style="font-size:clamp(2.4rem,5vw,3.6rem)">VistaDex</h2>
          <p class="lead mt-1"><!-- TODO: replace with the official VistaDex description -->Go beyond the gut check. VistaDex helps founders validate an idea in a structured way and see where it's strong and where it's risky, before committing months to building it.</p>
          <div class="tags mt-2"><span class="tag gold">Built by an FBC member</span><span class="tag">Free for FBC members</span><span class="tag">Idea validation</span></div>
          <div class="hero-cta"><a href="${D.links.vistadex}" target="_blank" rel="noopener" class="btn btn-primary">Open VistaDex <span class="arrow">↗</span></a><a href="#quickcheck" class="btn btn-ghost" data-scroll="quickcheck">Try the quick check first</a></div>
        </div>
        <div class="grid">
          ${[["Market & problem", "Is the problem real, and big enough?"], ["Competition", "Who else is solving this, and how you differ"], ["Risks & next steps", "What to test next, in order"]]
            .map(([t, d], i) => `<div class="card hover res"><div class="icon-box">${[I.target, I.users, I.rocket][i]}</div><div><h3>${t}</h3><p>${d}</p></div></div>`).join("")}
          <p class="hint">Placeholder feature list. Update it with VistaDex's real capabilities.</p>
        </div>
      </div>
    </div></section>

    <section class="section-sm" id="quickcheck"><div class="narrow">
      <span class="eyebrow">FBC quick idea check · free, no login</span>
      <h2 class="mt-1">How validated is your idea?</h2>
      <p class="muted mt-1">Be honest. Nobody sees this but you.</p>
      <form id="ideaCheck" class="card mt-2" style="padding:2rem">
        <div class="field"><label>Your idea in one line</label><input class="input" name="idea" placeholder="e.g. Battery-swap stations for campus e-scooters" required/></div>
        ${QUESTIONS.map(([k, q], i) => `
          <div class="list-row" style="align-items:flex-start;flex-wrap:wrap">
            <span class="num gold" style="font-family:var(--font-display);min-width:28px">0${i + 1}</span>
            <div class="grow" style="min-width:220px">${q}</div>
            <div class="chip-select" data-q="${k}">${["No", "Kind of", "Yes"].map((o, j) => `<button type="button" class="chip" data-v="${j}">${o}</button>`).join("")}</div>
          </div>`).join("")}
        <p class="error mt-1" id="icErr"></p>
        <button class="btn btn-primary btn-block mt-2">Get my score →</button>
      </form>
      <div id="icResult"></div>
    </div></section>
    ${ctaBand()}`;

  const ideaResult = (idea, ans) => {
    const score = Math.round((Object.values(ans).reduce((a, b) => a + b, 0) / (QUESTIONS.length * 2)) * 100);
    const weak = QUESTIONS.filter(([k]) => ans[k] < 2);
    const verdict = score >= 75 ? ["Strong signal", "You've done real homework. Time to find a team and build an MVP."]
      : score >= 45 ? ["Promising, with gaps", "There's something here. Close the gaps below before writing code."]
      : ["Still an assumption", "That's normal at the start. Go talk to people who have this problem first."];
    const tips = { problem: "Write the problem without your solution in it.", who: "Narrow to one specific group you can reach this week.", talked: "Do 10 problem interviews. Read The Mom Test first.", pain: "Look for people already hacking together workarounds.", alt: "List 5 alternatives, including “do nothing”.", pay: "Try a landing page, waitlist or pre-order.", why: "Write down your unfair advantage, then test it." };
    return `
      <div class="card mt-2 page-enter" style="border-color:var(--gold)">
        <div style="display:flex;gap:2rem;align-items:center;flex-wrap:wrap">
          <div style="font-family:var(--font-display);font-size:4.5rem;font-weight:800;line-height:1" class="gold">${score}<span style="font-size:1.5rem">/100</span></div>
          <div class="grow"><span class="tag gold">${verdict[0]}</span><h3 class="mt-1">“${esc(idea)}”</h3><p class="muted">${verdict[1]}</p></div>
        </div>
        <div class="progress mt-2"><i style="width:${score}%"></i></div>
        ${weak.length ? `<h3 class="mt-2">What to do next</h3><ul style="margin:.6rem 0 0 1.1rem;color:var(--muted)">${weak.map(([k]) => `<li>${tips[k]}</li>`).join("")}</ul>` : ""}
        <div class="hero-cta"><a href="${D.links.vistadex}" target="_blank" rel="noopener" class="btn btn-primary">Deep-dive on VistaDex ↗</a><a href="#signup" class="btn btn-ghost">Find co-founders on FBC</a><a href="#events" class="btn btn-quiet">Pitch it at an event</a></div>
      </div>`;
  };

  /* ---------- OPPORTUNITIES ---------- */
  let opp = { type: "All" };
  views.opportunities = () => {
    const types = ["All", "Internship", "Campus startup", "Project"];
    const list = D.opportunities.filter((o) => opp.type === "All" || o.type === opp.type);
    return `
    ${pageHead("Opportunities", "Work with real startups.", "Internships, founder's office roles and projects with campus and external startups. Learn by doing.")}
    <section class="container" style="padding-bottom:100px">
      <div class="toolbar"><div class="tabs">${types.map((t) => `<button data-opp="${t}" class="${opp.type === t ? "on" : ""}">${t}</button>`).join("")}</div>
        <span class="muted small" style="margin-left:auto">${list.length} open</span></div>
      <div class="grid g2">${list.map((o) => `
        <article class="card hover">
          <div style="display:flex;justify-content:space-between;gap:1rem;align-items:start"><div><span class="tag gold">${o.type}</span><h3 class="mt-1">${o.title}</h3><p class="muted small">${o.org}</p></div><div class="icon-box">${I.brief}</div></div>
          <div class="tags mt-1"><span class="tag">${o.mode}</span><span class="tag">${o.duration}</span><span class="tag">${o.stipend}</span>${o.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
          <div class="venture-foot"><span>Apply by ${fmt(o.deadline, { day: "numeric", month: "short" })}</span><button class="btn btn-ghost btn-sm" data-apply-opp="${o.title}">Apply →</button></div>
        </article>`).join("")}</div>
      <div class="card mt-3" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap">
        <div><h3>Are you a startup looking for student talent?</h3><p class="muted small">List an opportunity and reach the FBC community.</p></div>
        <a href="#contact" class="btn btn-primary">Post an opportunity →</a></div>
    </section>`;
  };

  /* ---------- EVENTS ---------- */
  views.events = () => `
    ${pageHead("Events by FBC", "Show up. Meet people. Pitch.", "Pitch nights, workshops, founder firesides and community meets. Updates also go out on WhatsApp.")}
    <section class="container section-sm">
      <h3 class="spaced gold" style="margin-bottom:1.5rem">Upcoming</h3>
      <div class="grid">${D.events.filter((e) => e.upcoming).map(eventCard).join("")}</div>
      <h3 class="spaced muted" style="margin:3.5rem 0 1.5rem">Past</h3>
      <div class="grid">${D.events.filter((e) => !e.upcoming).map(eventCard).join("")}</div>
    </section>
    ${ctaBand()}`;

  const eventModal = (id) => {
    const e = D.events.find((x) => x.id === id); if (!e) return;
    const going = store.get("rsvps", []).includes(id);
    openModal(`<span class="tag gold">${e.type}</span><h2 class="mt-1" style="font-size:1.9rem">${e.title}</h2>
      <div class="tags mt-1"><span class="tag">${fmt(e.date, { weekday: "long", day: "numeric", month: "long" })}</span>${e.time ? `<span class="tag">${e.time}</span>` : ""}<span class="tag">${e.venue}</span></div>
      <p class="mt-2">${e.desc}</p>
      ${e.upcoming ? `<button class="btn btn-primary btn-block mt-2" data-rsvp="${e.id}">${going ? "✓ You're going (click to cancel)" : "RSVP →"}</button>` : `<p class="muted small mt-2">This event has passed.</p>`}`);
  };

  /* ---------- JOURNAL ---------- */
  let jcat = "All";
  views.journal = () => {
    const cats = ["All", "Startup Story", "Analysis", "Failure Files", "Newsletter"];
    const feat = D.posts.find((p) => p.featured);
    const list = D.posts.filter((p) => !p.featured && (jcat === "All" || p.cat === jcat));
    return `
    ${pageHead("The Journal", "Startup stories, analysis & the newsletter.", "One startup per edition: how it started, the problem, the business model, the funding journey and the failures. Successes and the ones that didn't make it.")}
    <section class="container section-sm">
      ${jcat === "All" && feat ? `<a href="#journal-${feat.id}" class="card post-card featured-post reveal"><div class="post-cover"><span class="big-letter">${feat.letter}</span><span class="tag gold">Featured · ${feat.cat}</span></div>
        <div class="post-body"><h3>${feat.title}</h3><p>${feat.excerpt}</p><div class="post-meta">${feat.author} · ${fmt(feat.date)} · ${feat.read}</div><span class="btn btn-ghost btn-sm mt-1" style="align-self:start">Read story →</span></div></a>` : ""}
      <div class="toolbar"><div class="tabs">${cats.map((c) => `<button data-jcat="${c}" class="${jcat === c ? "on" : ""}">${c}</button>`).join("")}</div></div>
      <div class="grid g3">${list.map(postCard).join("") || `<div class="empty" style="grid-column:1/-1">No posts here yet.</div>`}</div>
    </section>
    <section class="container section-sm">
      <div class="newsletter reveal"><div><span class="eyebrow">The Builder's Brief</span><h2 class="mt-1">Get one startup story in your inbox, every two weeks.</h2></div>
        <form class="inline-form" data-subscribe><input class="input" type="email" placeholder="you@pilani.bits-pilani.ac.in" required/><button class="btn btn-primary">Subscribe</button></form></div>
    </section>`;
  };

  views.post = (id) => {
    const p = D.posts.find((x) => x.id === id);
    if (!p) return views.notfound();
    return `
    <article class="article page-enter"><div class="narrow">
      <a href="#journal" class="link small">← Back to Journal</a>
      <div class="mt-2"><span class="tag gold">${p.cat}</span></div>
      <h1>${p.title}</h1>
      <div style="display:flex;gap:1rem;align-items:center"><span class="avatar">${initials(p.author)}</span><div class="small"><b>${p.author}</b><div class="muted">${fmt(p.date)} · ${p.read} read</div></div></div>
      ${p.cat === "Startup Story" ? `<div class="fact-box"><div><span>Founded</span><b>20XX</b></div><div><span>Domain</span><b>—</b></div><div><span>Stage</span><b>—</b></div><div><span>Raised</span><b>—</b></div></div>` : ""}
      <div class="article-body">
        <p><em class="muted">Sample article. The Research &amp; Knowledge team will publish the real content here.</em></p>
        <p>${p.excerpt} This layout follows the structure from our publication plan: why the startup was founded, the problem, the founding team, the business model, competition, the funding journey, and the failures and decisions that shaped it.</p>
        <h2>The problem</h2><p>Every story starts with a problem someone actually had. We look at how the founders spotted it and how they knew it was worth solving.</p>
        <blockquote>“The idea matters, but execution matters most.”</blockquote>
        <h2>Business model & market</h2><p>How the company makes money, how big the opportunity really is (TAM, SAM, SOM) and who else was competing for it.</p>
        <h2>What went wrong, and what we can learn</h2><ul><li>The decision that almost killed the company</li><li>What they'd do differently</li><li>One takeaway for student founders</li></ul>
      </div>
      <div class="newsletter mt-3"><div><h3>Liked this?</h3><p class="muted small">Get the next story in your inbox.</p></div><form class="inline-form" data-subscribe><input class="input" type="email" placeholder="you@pilani.bits-pilani.ac.in" required/><button class="btn btn-primary">Subscribe</button></form></div>
    </div></article>`;
  };

  /* ---------- RESOURCES ---------- */
  views.resources = () => `
    ${pageHead("Resources", "The founder's library.", "Guides, templates, books and tools curated by the Research & Knowledge team. Start anywhere.")}
    <section class="container section-sm">
      ${D.resources.map((g, gi) => `
        <div class="reveal" style="margin-bottom:3.5rem"><h3 class="spaced gold" style="margin-bottom:1.3rem">${g.cat}</h3>
        <div class="grid g3">${g.items.map((r) => `
          <a href="${r.featured ? "#validate" : "javascript:void 0"}" class="card res" ${r.featured ? 'style="border-color:rgba(245,184,41,.5)"' : "data-soon"}>
            <div class="icon-box">${[I.book, I.pen, I.bulb, I.tool][gi]}</div>
            <div><h3>${r.t} ${r.featured ? '<span class="tag gold" style="margin-left:.3rem">Featured</span>' : ""}</h3><p>${r.d}</p></div></a>`).join("")}</div></div>`).join("")}
    </section>`;

  /* ---------- ROADMAP ---------- */
  views.roadmap = () => {
    const done = D.roadmap.filter((r) => r.status === "done").length;
    return `
    ${pageHead("Roadmap", "Where we've been. Where we're going.", "FBC started with three people and one problem. Here's the plan to grow it into a campus-wide founder ecosystem.")}
    <section class="container section-sm">
      <h3 class="spaced gold">The founder journey we support</h3>
      <div class="journey mt-2 reveal">${[["Spark", "Curiosity, a problem you can't stop thinking about"], ["Idea", "Validate it with real people"], ["Team", "Find co-founders through matchmaking"], ["Build", "Ship an MVP, learn fast"], ["Launch", "Pitch, demo day, first users"], ["Legend", "Grow, raise, give back to FBC"]]
        .map(([t, d], i) => `<div class="journey-step"><span class="n">0${i + 1}</span><b>${t}</b><small>${d}</small></div>`).join("")}</div>
    </section>
    <section class="narrow section-sm">
      <h3 class="spaced gold">The FBC roadmap</h3>
      <div class="timeline" style="--fill:${((done + 0.5) / D.roadmap.length) * 100}%">
        ${D.roadmap.map((r, i) => `
          <div class="tl-item ${r.status} reveal"><div class="tl-dot">${r.status === "done" ? "✓" : i}</div>
            <div class="card"><div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap"><span class="small muted">${r.phase} · ${r.when}</span>
              <span class="status ${r.status === "done" ? "ok" : r.status === "now" ? "review" : ""}" ${r.status === "next" ? 'style="color:var(--muted)"' : ""}>${r.status === "done" ? "Done" : r.status === "now" ? "In progress" : "Up next"}</span></div>
              <h3 class="mt-1">${r.title}</h3><ul>${r.items.map((x) => `<li>${x}</li>`).join("")}</ul></div></div>`).join("")}
      </div>
    </section>
    ${ctaBand()}`;
  };

  /* ---------- CONTACT ---------- */
  views.contact = () => `
    ${pageHead("Contact", "Let's talk.", "Questions, ideas for events, want to partner, speak, or list your startup? Reach out.")}
    <section class="container section-sm"><div class="grid g2" style="gap:3rem;align-items:start">
      <form class="card" id="contactForm" style="padding:2rem">
        <div class="form-grid">
          <div class="field"><label>Name</label><input class="input" required/></div>
          <div class="field"><label>Email</label><input class="input" type="email" required/></div>
          <div class="field full"><label>I'm reaching out as…</label><select class="input"><option>Student</option><option>Startup / founder</option><option>Speaker / mentor</option><option>Investor</option><option>Sponsor / partner</option><option>Other</option></select></div>
          <div class="field full"><label>Message</label><textarea class="input" required placeholder="How can we help?"></textarea></div>
        </div>
        <button class="btn btn-primary btn-block mt-2">Send message →</button>
      </form>
      <div>
        <div class="grid g2">
          <a href="${D.links.whatsapp}" target="_blank" rel="noopener" class="card res"><div class="icon-box">${I.users}</div><div><h3>WhatsApp community</h3><p>Fastest way to reach us and hear about events.</p></div></a>
          <a href="${D.links.joinForm}" target="_blank" rel="noopener" class="card res"><div class="icon-box">${I.pen}</div><div><h3>Join form</h3><p>Tell us what you'd like FBC to organise.</p></div></a>
        </div>
        <h3 class="spaced gold mt-3" style="margin-bottom:1.2rem">Core team</h3>
        <div class="grid g3">${D.team.map((t) => `<div class="card team-card hover"><span class="avatar avatar-lg">${t.initials}</span><b style="font-family:var(--font-display)">${t.name}</b><div class="small muted">${t.role}</div></div>`).join("")}</div>
        <p class="small muted mt-1">More core members coming soon.</p>
      </div>
    </div></section>
    <section class="narrow section-sm faq">
      <h2 style="margin-bottom:1.5rem">FAQ</h2>
      ${[["Do I need a startup idea to join?", "No. Many members join to learn, explore, or to join someone else's venture. You can start anywhere."],
         ["Who can join FBC?", "Any BITS Pilani student, from any branch or year, with any level of experience."],
         ["Won't someone steal my idea if I list it?", "People can only join you if they know what you're building. The idea matters, but execution matters most."],
         ["How does co-founder matchmaking work?", "Founders fill in their idea and who they need, we share it with the community, builders apply, and everyone meets at Pitch Night."],
         ["Is there a fee?", "No. FBC is free for students."]].map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}
    </section>`;

  views.notfound = () => `<section class="section center"><div class="container"><h1 class="gold">404</h1><p class="lead" style="margin:1rem auto">This page hasn't been built yet. Fitting, for a builders' club.</p><a href="#home" class="btn btn-primary mt-2">Back home</a></div></section>`;

  /* ==========================================================
     ROUTER
     ========================================================== */
  function redirect(r) { setTimeout(() => (location.hash = "#home" + r), 0); return ""; }

  function renderNavActions() {
    const u = user();
    $("#navActions").innerHTML = u
      ? `<a href="#dashboard" class="btn btn-ghost btn-sm">Dashboard</a><a href="#dashboard" title="${esc(u.name)}"><span class="avatar">${initials(u.name)}</span></a>`
      : `<a href="#login" class="btn btn-ghost btn-sm">Log in</a><a href="#signup" class="btn btn-primary btn-sm">Join FBC</a>`;
  }

  function render() {
    const h = location.hash.replace(/^#\/?/, "");
    const [route, param] = h.startsWith("journal-") ? ["journal", h.slice(8)] : [h, null];
    const key = route && views[route] ? route : route ? "notfound" : "home";
    let html;
    if (key === "journal" && param) html = views.post(param);
    else html = (views[key] || views.notfound)();
    app.innerHTML = html;
    if (!["login", "signup", "dashboard", "onboarding"].includes(key)) app.firstElementChild?.classList.add("page-enter");
    $$("#navLinks a").forEach((a) => a.classList.toggle("active", a.dataset.route === key));
    $("#navLinks").classList.remove("open");
    renderNavActions();
    closeModal();
    afterRender();
  }

  function afterRender() {
    // highlight AI-filled fields on the review screen
    const rf = $("#obForm[data-review]");
    if (rf) (user()?._ai || []).forEach((n) => {
      const el = $(`[name="${n}"], [data-chips="${n}"]`, rf); if (!el) return;
      el.classList.add("ai-filled");
      el.closest(".field")?.querySelector("label")?.insertAdjacentHTML("beforeend", ' <span class="ai-badge">AI</span>');
    });
    // reveal on scroll
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
    $$(".reveal").forEach((el) => io.observe(el));
    // count-up
    $$("[data-count]").forEach((el) => {
      const end = +el.dataset.count; const t0 = performance.now();
      const tick = (t) => { const p = Math.min((t - t0) / 1400, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString("en-IN") + (end >= 1000 && p === 1 ? "+" : ""); if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
  }

  /* ==========================================================
     EVENTS (delegated)
     ========================================================== */
  document.addEventListener("click", (e) => {
    const t = e.target;

    // ripple on buttons (accent colour)
    const btn = t.closest(".btn");
    if (btn) {
      const r = btn.getBoundingClientRect(); const s = Math.max(r.width, r.height);
      const span = document.createElement("span"); span.className = "ripple";
      span.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
      btn.appendChild(span); setTimeout(() => span.remove(), 600);
    }

    if (t.closest("[data-close]")) return closeModal();
    if (t.closest("#navToggle")) return $("#navLinks").classList.toggle("open");

    const acc = t.closest("[data-accent]");
    if (acc && acc.closest("#accentSwitcher")) { setAccent(acc.dataset.accent); return; }

    const rsvp = t.closest("[data-rsvp]");
    if (rsvp) {
      e.stopPropagation();
      const id = rsvp.dataset.rsvp; let list = store.get("rsvps", []);
      const going = list.includes(id);
      list = going ? list.filter((x) => x !== id) : [...list, id];
      store.set("rsvps", list);
      toast(going ? "RSVP cancelled" : "You're on the list. See you there!");
      return render();
    }

    const ven = t.closest("[data-venture]");
    if (ven) return ventureModal(ven.dataset.venture);
    const ev = t.closest("[data-event]");
    if (ev) return eventModal(ev.dataset.event);

    const roleLink = t.closest("[data-role-link]");
    if (roleLink) store.set("pendingRole", roleLink.dataset.roleLink);

    const role = t.closest("[data-role]");
    if (role) { $$("[data-role]").forEach((r) => r.classList.toggle("on", r === role)); return; }

    const chip = t.closest(".chip");
    if (chip) {
      const group = chip.parentElement;
      group.classList.remove("ai-filled");
      if (group.dataset.q !== undefined) { $$(".chip", group).forEach((c) => c.classList.toggle("on", c === chip)); }
      else chip.classList.toggle("on");
      return;
    }

    const om = t.closest("[data-obmode]");
    if (om) {
      e.preventDefault(); ob = { step: 0, mode: om.dataset.obmode || null };
      if (location.hash !== "#onboarding") location.hash = "#onboarding"; else { render(); window.scrollTo({ top: 0 }); }
      return;
    }
    if (t.closest("[data-copy-prompt]")) {
      const box = $("#aiPrompt"); const done = () => toast("Prompt copied. Now paste it into your chatbot.");
      const fallback = () => { box.focus(); box.select(); let ok = false; try { ok = document.execCommand("copy"); } catch {} ok ? done() : toast("Prompt selected. Press Ctrl+C (or ⌘C) to copy."); };
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(box.value).then(done, fallback); else fallback();
      return;
    }
    if (t.closest("[data-ai-sample]")) { const f = $("#aiImportForm"); f.reply.value = aiSample(user()); $("#aiErr").textContent = ""; toast("Sample reply pasted. Press Import & review."); return; }
    const ob2 = t.closest("[data-ob='back']");
    if (ob2) { saveOb(); ob.step--; return render(); }

    const dt = t.closest("[data-dash]");
    if (dt) { dashTab = dt.dataset.dash; return render(); }
    if (t.closest("[data-logout]")) { store.del("user"); toast("Logged out"); location.hash = "#home"; return; }

    const mt = t.closest("[data-mmtab]");
    if (mt) { mm = { ...mm, tab: mt.dataset.mmtab, skill: "" }; return render(); }
    const ot = t.closest("[data-opp]");
    if (ot) { opp.type = ot.dataset.opp; return render(); }
    const jc = t.closest("[data-jcat]");
    if (jc) { jcat = jc.dataset.jcat; return render(); }

    const con = t.closest("[data-connect]");
    if (con) { if (!user()) { toast("Log in to connect with builders"); location.hash = "#login"; return; } toast(`Connection request sent to ${con.dataset.connect}`); return; }
    const ao = t.closest("[data-apply-opp]");
    if (ao) { if (!user()) { toast("Log in to apply"); location.hash = "#login"; return; } toast(`Application started: ${ao.dataset.applyOpp}`); return; }
    if (t.closest("[data-soon]")) { e.preventDefault(); toast("Coming soon: the Research team is putting this together"); return; }
    if (t.closest("[data-google]")) { toast("Google sign-in will be wired up with the real backend"); return; }
    const sc = t.closest("[data-scroll]");
    if (sc) { e.preventDefault(); document.getElementById(sc.dataset.scroll)?.scrollIntoView({ behavior: "smooth" }); }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
    if (e.key === "Enter" && e.target.matches("[data-venture]")) ventureModal(e.target.dataset.venture);
  });

  document.addEventListener("input", (e) => {
    if (e.target.classList?.contains("ai-filled")) e.target.classList.remove("ai-filled");
    if (e.target.id === "mmQ") { mm.q = e.target.value; const pos = e.target.selectionStart; render(); const i = $("#mmQ"); i.focus(); i.setSelectionRange(pos, pos); }
  });
  document.addEventListener("change", (e) => {
    if (e.target.classList?.contains("ai-filled")) e.target.classList.remove("ai-filled");
    if (e.target.id === "mmDomain") { mm.domain = e.target.value; render(); }
    if (e.target.id === "mmSkill") { mm.skill = e.target.value; render(); }
  });

  const isBits = (em) => /@([a-z]+\.)?bits-pilani\.ac\.in$/i.test(em.trim());

  function finishOb() {
    const u = user(); delete u._ai; delete u._blank; delete u._unmatched; store.set("user", u);
    ob = { step: 0, mode: null }; dashTab = "overview";
    toast("Profile saved! Welcome to FBC 🎉"); location.hash = "#dashboard";
  }

  function saveOb() {
    const f = $("#obForm"); if (!f) return;
    const u = user();
    $$("input, select, textarea", f).forEach((el) => { if (!el.name) return; u[el.name] = el.type === "checkbox" ? el.checked : el.value; });
    $$("[data-chips]", f).forEach((g) => (u[g.dataset.chips] = $$(".chip.on", g).map((c) => c.textContent)));
    store.set("user", u);
  }

  document.addEventListener("submit", (e) => {
    const f = e.target; e.preventDefault();

    if (f.id === "loginForm") {
      const em = f.email.value, pw = f.password.value;
      if (!isBits(em)) return ($("#loginErr").textContent = "Please use your BITS email address.");
      if (pw.length < 1) return ($("#loginErr").textContent = "Enter your password.");
      const existing = user();
      store.set("user", existing && existing.email === em ? existing : { name: em.split("@")[0], email: em, role: "builder" });
      toast("Welcome back!"); location.hash = "#dashboard";
    }
    if (f.id === "signupForm") {
      const name = f.name.value.trim(), em = f.email.value, pw = f.password.value;
      const role = $("[data-role].on")?.dataset.role || "founder";
      if (!name) return ($("#signupErr").textContent = "Tell us your name.");
      if (!isBits(em)) return ($("#signupErr").textContent = "Please use your BITS email address.");
      if (pw.length < 8) return ($("#signupErr").textContent = "Password must be at least 8 characters.");
      store.set("user", { name, email: em, role }); ob = { step: 0, mode: null };
      toast("Account created! Let's set up your profile."); location.hash = "#onboarding";
    }
    if (f.id === "obForm" && f.hasAttribute("data-review")) {
      saveOb(); finishOb(); return;
    }
    if (f.id === "aiImportForm") {
      const err = $("#aiErr"); const text = f.reply.value.trim();
      if (!text) { err.textContent = "Paste your AI's reply first."; return; }
      try {
        const u = user(); const r = parseAiReply(text, u);
        store.set("user", { ...u, ...r.out, _ai: r.ai, _blank: r.blank, _unmatched: r.unmatched });
        ob.mode = "review"; render(); window.scrollTo({ top: 0 });
        toast(`Imported ${r.ai.length} fields. Have a look before saving.`);
      } catch (ex) {
        err.textContent = ex.message === "empty"
          ? "We found the reply but couldn't read any profile fields from it. Make sure you copied the whole code block."
          : "We couldn't find the profile in that reply. Ask your AI to “reply with only the JSON in a code block”, then paste again.";
      }
      return;
    }
    if (f.id === "obForm") {
      saveOb();
      if (ob.step < 2) { ob.step++; render(); window.scrollTo({ top: 0 }); }
      else finishOb();
    }
    if (f.id === "applyForm") {
      if (!user()) { closeModal(); toast("Create an account to apply"); location.hash = "#signup"; return; }
      const list = store.get("applications", []);
      list.push({ id: f.dataset.id, date: new Date().toISOString().slice(0, 10) });
      store.set("applications", list);
      toast("Application sent!"); ventureModal(f.dataset.id);
    }
    if (f.id === "ideaCheck") {
      const idea = f.idea.value.trim(); const ans = {};
      $$("[data-q]", f).forEach((g) => { const on = $(".chip.on", g); if (on) ans[g.dataset.q] = +on.dataset.v; });
      if (!idea) return ($("#icErr").textContent = "Write your idea in one line first.");
      if (Object.keys(ans).length < QUESTIONS.length) return ($("#icErr").textContent = "Answer all 7 questions. “No” is a valid answer!");
      $("#icErr").textContent = "";
      const list = store.get("ideachecks", []); list.push({ idea, ans, date: Date.now() }); store.set("ideachecks", list);
      $("#icResult").innerHTML = ideaResult(idea, ans);
      $("#icResult").scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (f.id === "contactForm") { f.reset(); toast("Message sent. We'll get back to you soon."); }
    if (f.hasAttribute("data-subscribe")) { f.reset(); toast("Subscribed to The Builder's Brief ✓"); }
  });

  /* ---------- accent switcher (prototype only) ---------- */
  function setAccent(a) {
    if (a === "teal") document.documentElement.removeAttribute("data-accent");
    else document.documentElement.setAttribute("data-accent", a);
    $$("#accentSwitcher button").forEach((b) => b.classList.toggle("on", b.dataset.accent === a));
    store.set("accent", a);
  }
  setAccent(store.get("accent", "teal"));

  /* ---------- nav shadow + cursor glow ---------- */
  window.addEventListener("scroll", () => $("#nav").classList.toggle("scrolled", scrollY > 10), { passive: true });
  const glow = $(".cursor-glow");
  window.addEventListener("pointermove", (e) => { glow.style.left = e.clientX + "px"; glow.style.top = e.clientY + "px"; }, { passive: true });

  // apply pending role (from "List your idea" / "Create builder profile" buttons)
  window.addEventListener("hashchange", () => {
    render();
    if (!location.hash.includes("journal-")) window.scrollTo({ top: 0 });
    const pr = store.get("pendingRole");
    if (pr && location.hash === "#signup") { $$("[data-role]").forEach((r) => r.classList.toggle("on", r.dataset.role === pr)); store.del("pendingRole"); }
  });
  render();
})();
