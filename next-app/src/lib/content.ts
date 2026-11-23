import type { FbcEvent, Opportunity, Post, Resource, Member, Venture } from "./types";

/* ==========================================================
   Static content + sample (seed) data.
   - Lists (domains, skills, stages…) define the options used in
     profiles, filters and the AI import. Change them here.
   - SEED is sample data. In demo mode it fills the local database.
     In live mode an admin can load it once from Admin -> Settings,
     then edit or delete it.
   ========================================================== */
export const DOMAINS = ["AI / ML", "SaaS", "FinTech", "HealthTech", "EdTech", "ClimateTech", "D2C / Consumer", "Deep Tech", "AgriTech", "Social Impact"];
export const SKILLS = ["Full-stack dev", "ML engineer", "Hardware / IoT", "Design / UX", "Product", "Growth / Marketing", "Sales / BD", "Finance", "Content", "Operations"];
export const STAGES = ["Idea", "Validating", "Building MVP", "Early users", "Revenue"];
export const AVAIL = ["< 5 hrs/week", "5–10 hrs/week", "10–20 hrs/week", "20+ hrs/week"];
export const EQUITY = ["Co-founder equity", "Open to discuss", "Paid + ESOP", "Not decided yet"];
export const LOOKING = ["Join a venture as a co-founder", "Early team member role", "Internships at startups", "Just learning and exploring"];
export const OPP_TYPES = ["Internship", "Campus startup", "Project"];
export const EVENT_TYPES = ["Pitching", "Workshop", "Founder talk", "Community", "Launch"];
export const POST_CATS = ["Startup Story", "Analysis", "Failure Files", "Newsletter"];
export const SHELVES = ["Guides", "Templates", "Books & Podcasts", "Tools"];

export const ROADMAP: { phase: string; title: string; when: string; status: "done" | "now" | "next"; items: string[] }[] = [
  { phase: "Phase 0", title: "The spark", when: "Sep 2026", status: "done", items: ["Community invitation and join form", "WhatsApp community launched", "First meetup with 3 core members"] },
  { phase: "Phase 1", title: "Matchmaking v1", when: "Oct–Nov 2026", status: "done", items: ["Co-founder matchmaking form", "Founder profiles shared with the community"] },
  { phase: "Phase 2", title: "Pitch & platform", when: "Dec 2026", status: "now", items: ["Pitch Night for matchmaking founders", "This website: profiles, matchmaking, opportunities", "Recruit more core members"] },
  { phase: "Phase 3", title: "Learn & publish", when: "Jan–Mar 2027", status: "next", items: ["Workshop series: validation, finance, fundraising", "Startup Stories newsletter, every two weeks", "Founder fireside sessions"] },
  { phase: "Phase 4", title: "Build & grow", when: "Apr–Jun 2027", status: "next", items: ["Startup-building challenge", "Internal demo day with external evaluators", "Startup opportunity partnerships"] },
  { phase: "Phase 5", title: "Beyond campus", when: "2027–28", status: "next", items: ["Flagship annual entrepreneurship event", "Collaboration across BITS campuses", "Incubator and investor network"] },
];

export const TEAM = [
  { name: "Nitish Rathi", role: "Founder" },
  { name: "Nakul Nandwana", role: "Core member" },
  { name: "Devansh Garg", role: "Core member" },
];

const body = (excerpt: string) => `${excerpt}

*Sample article. The Research & Knowledge team will replace this with the real story.*

## The problem

Every story starts with a problem someone actually had. We look at how the founders spotted it and how they knew it was worth solving.

> The idea matters, but execution matters most.

## Business model and market

How the company makes money, how big the opportunity really is, and who else was competing for it.

## What went wrong, and what we can learn

- The decision that almost killed the company
- What they would do differently
- One takeaway for student founders`;

export const SEED: {
  events: FbcEvent[]; opportunities: Opportunity[]; posts: Post[]; resources: Resource[];
  demoUsers: Member[]; demoVentures: Venture[];
} = {
  events: [
    { id: "pitch-night-dec", title: "Co-founder Matchmaking: Pitch Night", date: "2026-12-04", time: "7:00 PM", venue: "To be announced", type: "Pitching", published: true,
      desc: "Founders who listed their ideas pitch in three minutes each. Builders listen, ask questions and talk to the teams they want to join." },
    { id: "validate-workshop", title: "Workshop: Validate Before You Build", date: "2026-12-11", time: "6:00 PM", venue: "To be announced", type: "Workshop", published: true,
      desc: "Problem interviews, landing-page tests and pre-sales: how to know people want it before you write a line of code." },
    { id: "fireside-jan", title: "Founder Fireside: Building From a Hostel Room", date: "2027-01-15", time: "7:30 PM", venue: "To be announced", type: "Founder talk", published: true,
      desc: "An open conversation with a BITS alum founder about co-founders, first customers and the hard parts nobody talks about." },
    { id: "idea-jam-jan", title: "Community Meet: Idea Jam", date: "2027-01-22", time: "6:30 PM", venue: "To be announced", type: "Community", published: true,
      desc: "Bring an idea, a problem or just curiosity. Small circles, fast feedback, new people." },
    { id: "first-meetup", title: "FBC First Meetup", date: "2026-10-03", time: "6:00 PM", venue: "BITS Pilani", type: "Community", published: true,
      desc: "Where it started: why FBC exists, the co-founder problem, and what we want to build together." },
    { id: "matchmaking-launch", title: "Co-founder Matchmaking Launch", date: "2026-10-26", time: "", venue: "Online", type: "Launch", published: true,
      desc: "The matchmaking form opened for founders looking for co-founders across campus." },
  ],
  opportunities: [
    { id: "o1", title: "Founder's Office Intern", org: "Early-stage SaaS startup", type: "Internship", mode: "Remote", duration: "3 months", stipend: "Paid", tags: ["Strategy", "Ops"], deadline: "2026-12-05", url: "", status: "live" },
    { id: "o2", title: "Frontend Developer, part-time", org: "Ledgerly (campus startup)", type: "Campus startup", mode: "On campus", duration: "Ongoing", stipend: "Equity", tags: ["React", "UI"], deadline: "2026-12-10", url: "", status: "live" },
    { id: "o3", title: "Market Research Project", org: "D2C brand", type: "Project", mode: "Remote", duration: "4 weeks", stipend: "Certificate + stipend", tags: ["Research", "Excel"], deadline: "2026-11-30", url: "", status: "live" },
    { id: "o4", title: "Business Development Associate", org: "Climate startup", type: "Internship", mode: "Hybrid", duration: "2 months", stipend: "Paid", tags: ["Sales", "Outreach"], deadline: "2026-12-15", url: "", status: "live" },
    { id: "o5", title: "ML Research Collaborator", org: "KrishiLens (campus startup)", type: "Campus startup", mode: "On campus", duration: "Ongoing", stipend: "Equity", tags: ["Computer vision", "PyTorch"], deadline: "2026-12-20", url: "", status: "live" },
    { id: "o6", title: "Content & Community Intern", org: "EdTech startup", type: "Internship", mode: "Remote", duration: "3 months", stipend: "Paid", tags: ["Writing", "Social"], deadline: "2027-01-05", url: "", status: "live" },
  ],
  posts: [
    { id: "first-100-users", cat: "Startup Story", title: "How one campus startup found its first 100 users without a marketing budget", author: "FBC Research Team", date: "2026-11-18", read: "7 min", featured: true, published: true,
      excerpt: "A breakdown of the scrappy, unscalable things that actually worked, and the two that wasted a month." },
    { id: "team-stage", cat: "Failure Files", title: "Why most student startups die at the team stage, not the idea stage", author: "FBC Research Team", date: "2026-11-10", read: "6 min", published: true,
      excerpt: "Co-founder mismatch, unclear commitment and the equity talk nobody wants to have." },
    { id: "tam-sam-som", cat: "Analysis", title: "TAM, SAM, SOM without the hand-waving", author: "FBC Research Team", date: "2026-11-02", read: "5 min", published: true,
      excerpt: "A practical way to size your market that won't make a judge roll their eyes." },
    { id: "brief-01", cat: "Newsletter", title: "The Builder's Brief #01", author: "FBC", date: "2026-10-28", read: "4 min", published: true,
      excerpt: "Three founder interviews, one framework, and what's coming up at FBC." },
    { id: "unit-economics", cat: "Analysis", title: "Unit economics for people who hate spreadsheets", author: "FBC Research Team", date: "2026-10-20", read: "8 min", published: true,
      excerpt: "CAC, LTV and contribution margin, explained with a chai stall." },
    { id: "be-open", cat: "Startup Story", title: "Be open about your idea: why stealth mode hurts student founders", author: "Nitish Rathi", date: "2026-10-12", read: "4 min", published: true,
      excerpt: "People can only join you if they know what you're building. Execution matters most." },
  ].map((p) => ({ ...p, body: body(p.excerpt) })),
  resources: [
    { id: "r1", shelf: "Guides", title: "Startup 101: the vocabulary", desc: "MVP, PMF, runway, cap table: the terms you'll hear in your first month.", url: "", order: 1 },
    { id: "r2", shelf: "Guides", title: "Finding a co-founder", desc: "What to look for, what to ask, and how to test working together before committing.", url: "", order: 2 },
    { id: "r3", shelf: "Guides", title: "Problem interviews playbook", desc: "Questions that get honest answers instead of polite lies.", url: "", order: 3 },
    { id: "r4", shelf: "Templates", title: "Pitch deck template", desc: "The 10-slide structure investors expect.", url: "", order: 1 },
    { id: "r5", shelf: "Templates", title: "Lean canvas", desc: "A one-page business model you can fill in under an hour.", url: "", order: 2 },
    { id: "r6", shelf: "Templates", title: "Co-founder agreement checklist", desc: "Roles, equity, vesting, and what happens if someone leaves.", url: "", order: 3 },
    { id: "r7", shelf: "Books & Podcasts", title: "The Mom Test, Rob Fitzpatrick", desc: "How to talk to customers and learn whether your idea is good.", url: "", order: 1 },
    { id: "r8", shelf: "Books & Podcasts", title: "Zero to One, Peter Thiel", desc: "Notes on building something new instead of copying.", url: "", order: 2 },
    { id: "r9", shelf: "Books & Podcasts", title: "Founder interview podcasts", desc: "A curated list from the Research & Knowledge team.", url: "", order: 3 },
    { id: "r10", shelf: "Tools", title: "VistaDex", desc: "Validate your idea before you build it.", url: "#validate", featured: true, order: 1 },
    { id: "r11", shelf: "Tools", title: "No-code MVP stack", desc: "Build a working prototype in a weekend.", url: "", order: 2 },
    { id: "r12", shelf: "Tools", title: "Free credits for students", desc: "Cloud, design and developer tools with student programmes.", url: "", order: 3 },
  ],
  // Demo-only sample people and ventures (never written to the live database by Seed).
  demoUsers: [
    { uid: "demo-aarav", name: "Aarav S.", email: "aarav@pilani.bits-pilani.ac.in", role: "founder", year: "2nd year, CS", avail: "10–20 hrs/week", skills: ["Product"], domains: ["D2C / Consumer"] },
    { uid: "demo-ishita", name: "Ishita R.", email: "ishita@pilani.bits-pilani.ac.in", role: "founder", year: "3rd year, Chemical", avail: "10–20 hrs/week", skills: ["Operations"], domains: ["SaaS"] },
    { uid: "demo-dev", name: "Dev P.", email: "dev@pilani.bits-pilani.ac.in", role: "founder", year: "2nd year, EEE", avail: "5–10 hrs/week", skills: ["Hardware / IoT"], domains: ["AgriTech"] },
    { uid: "demo-kabir", name: "Kabir T.", email: "kabir@pilani.bits-pilani.ac.in", role: "founder", year: "4th year, Economics", avail: "5–10 hrs/week", skills: ["Sales / BD"], domains: ["EdTech"] },
    { uid: "demo-sneha", name: "Sneha K.", email: "sneha@pilani.bits-pilani.ac.in", role: "founder", year: "3rd year, CS", avail: "10–20 hrs/week", skills: ["Finance"], domains: ["FinTech"] },
    { uid: "demo-ananya", name: "Ananya G.", email: "ananya@pilani.bits-pilani.ac.in", role: "builder", year: "2nd year, CS", skills: ["Full-stack dev", "Design / UX"], domains: ["SaaS", "EdTech"], looking: "Join a venture as a co-founder", bio: "Ships web apps quickly; happiest at the idea-to-prototype stage." },
    { uid: "demo-rohan", name: "Rohan V.", email: "rohan@pilani.bits-pilani.ac.in", role: "builder", year: "3rd year, Economics", skills: ["Finance", "Sales / BD"], domains: ["FinTech", "D2C / Consumer"], looking: "Join a venture as a co-founder", bio: "Business co-founder for a tech-heavy team." },
    { uid: "demo-meera", name: "Meera J.", email: "meera@pilani.bits-pilani.ac.in", role: "builder", year: "1st year, Biology", skills: ["Content", "Growth / Marketing"], domains: ["HealthTech", "Social Impact"], looking: "Early team member role", bio: "Writer and community builder." },
    { uid: "demo-arjun", name: "Arjun N.", email: "arjun@pilani.bits-pilani.ac.in", role: "builder", year: "4th year, EEE", skills: ["Hardware / IoT", "ML engineer"], domains: ["Deep Tech", "ClimateTech"], looking: "Join a venture as a co-founder", bio: "Embedded systems and edge ML." },
    { uid: "demo-yash", name: "Yash B.", email: "yash@pilani.bits-pilani.ac.in", role: "builder", year: "3rd year, CS", skills: ["ML engineer", "Full-stack dev"], domains: ["AI / ML", "HealthTech"], looking: "Join a venture as a co-founder", bio: "AI-first engineer, looking for a hard problem." },
  ],
  demoVentures: [
    { founderUid: "demo-aarav", name: "MessMate", domains: ["D2C / Consumer"], stage: 1, pitch: "Cutting food waste in campus messes with daily headcount predictions and a swap-your-meal marketplace.", problem: "Messes cook for everyone, every day. Up to a third of it can go uneaten.", needs: ["Full-stack dev", "Growth / Marketing"], commitment: "10–15 hrs/week", equity: "Open to discuss" },
    { founderUid: "demo-ishita", name: "LabLedger", domains: ["SaaS"], stage: 2, pitch: "Inventory and booking software for university labs. No more spreadsheets for shared equipment.", problem: "Shared lab equipment is booked on paper and spreadsheets, so clashes and losses are common.", needs: ["Product", "Sales / BD"], commitment: "15+ hrs/week", equity: "Co-founder equity" },
    { founderUid: "demo-dev", name: "KrishiLens", domains: ["AgriTech", "AI / ML"], stage: 1, pitch: "Phone-camera crop disease detection in local languages for smallholder farmers in Rajasthan.", problem: "Farmers find out about crop disease too late, and advice rarely arrives in their language.", needs: ["ML engineer", "Design / UX"], commitment: "8–10 hrs/week", equity: "Co-founder equity" },
    { founderUid: "demo-kabir", name: "Prepwise", domains: ["EdTech"], stage: 3, pitch: "AI mock interviews for consulting and product roles, trained on real case frameworks.", problem: "Students practise cases with friends who don't know what good looks like.", needs: ["ML engineer", "Content"], commitment: "10 hrs/week", equity: "Paid + ESOP" },
    { founderUid: "demo-sneha", name: "Ledgerly", domains: ["FinTech"], stage: 2, pitch: "Split, track and settle group expenses for student clubs and fests, with UPI built in.", problem: "Club treasurers chase reimbursements across WhatsApp groups and spreadsheets.", needs: ["Full-stack dev", "Design / UX"], commitment: "12 hrs/week", equity: "Co-founder equity" },
  ],
};
