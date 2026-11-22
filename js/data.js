/* ==========================================================
   FBC prototype: SAMPLE DATA
   Everything here is placeholder content for the prototype.
   Replace with a real backend / CMS later.
   ========================================================== */
window.FBC = {
  links: {
    whatsapp: "https://chat.whatsapp.com/CgdFfY7ZBwIA0yCYVJ6MDE",
    joinForm: "https://forms.gle/7MAqWXS734hUsFnt9",
    vistadex: "#", // TODO: put the real VistaDex URL here
  },

  domains: ["AI / ML", "SaaS", "FinTech", "HealthTech", "EdTech", "ClimateTech", "D2C / Consumer", "Deep Tech", "AgriTech", "Social Impact"],
  skills: ["Full-stack dev", "ML engineer", "Hardware / IoT", "Design / UX", "Product", "Growth / Marketing", "Sales / BD", "Finance", "Content", "Operations"],
  stages: ["Idea", "Validating", "Building MVP", "Early users", "Revenue"],

  ventures: [
    { id: "v1", name: "MessMate", logo: "MM", domain: "D2C / Consumer", stage: 1, founder: "Aarav S.", year: "2nd year, CS",
      pitch: "Cutting food waste in campus messes with daily headcount predictions and a swap-your-meal marketplace.",
      needs: ["Full-stack dev", "Growth / Marketing"], commitment: "10–15 hrs/week", applicants: 12, equity: "Open to discuss" },
    { id: "v2", name: "LabLedger", logo: "LL", domain: "SaaS", stage: 2, founder: "Ishita R.", year: "3rd year, Chem",
      pitch: "Inventory and booking software for university labs. No more spreadsheets for shared equipment.",
      needs: ["Product", "Sales / BD"], commitment: "15+ hrs/week", applicants: 7, equity: "Co-founder equity" },
    { id: "v3", name: "KrishiLens", logo: "KL", domain: "AgriTech", stage: 1, founder: "Dev P.", year: "2nd year, EEE",
      pitch: "Phone-camera crop disease detection in local languages for smallholder farmers in Rajasthan.",
      needs: ["ML engineer", "Design / UX"], commitment: "8–10 hrs/week", applicants: 19, equity: "Co-founder equity" },
    { id: "v4", name: "Voltway", logo: "VW", domain: "ClimateTech", stage: 0, founder: "Riya M.", year: "1st year, Mech",
      pitch: "Battery-swap stations for campus e-cycles and e-scooters, starting with one hostel cluster.",
      needs: ["Hardware / IoT", "Finance", "Operations"], commitment: "Flexible", applicants: 4, equity: "Open to discuss" },
    { id: "v5", name: "Prepwise", logo: "PW", domain: "EdTech", stage: 3, founder: "Kabir T.", year: "4th year, Econ",
      pitch: "AI mock interviews for consulting and product roles, trained on real case frameworks.",
      needs: ["ML engineer", "Content"], commitment: "10 hrs/week", applicants: 23, equity: "Paid + ESOP" },
    { id: "v6", name: "Ledgerly", logo: "LG", domain: "FinTech", stage: 2, founder: "Sneha K.", year: "3rd year, CS + Fin",
      pitch: "Split, track and settle group expenses for student clubs and fests, with UPI built in.",
      needs: ["Full-stack dev", "Design / UX"], commitment: "12 hrs/week", applicants: 9, equity: "Co-founder equity" },
  ],

  builders: [
    { name: "Ananya G.", year: "2nd year, CS", skills: ["Full-stack dev", "Design / UX"], interests: ["SaaS", "EdTech"], looking: "Join a venture as a technical co-founder" },
    { name: "Rohan V.", year: "3rd year, Econ", skills: ["Finance", "Sales / BD"], interests: ["FinTech", "D2C / Consumer"], looking: "Business co-founder for a tech-heavy team" },
    { name: "Meera J.", year: "1st year, Bio", skills: ["Content", "Growth / Marketing"], interests: ["HealthTech", "Social Impact"], looking: "Explore and help early-stage ideas" },
    { name: "Arjun N.", year: "4th year, EEE", skills: ["Hardware / IoT", "ML engineer"], interests: ["Deep Tech", "ClimateTech"], looking: "Hardware co-founder" },
    { name: "Tanvi S.", year: "2nd year, Mech", skills: ["Product", "Operations"], interests: ["ClimateTech", "AgriTech"], looking: "Product role in an MVP-stage team" },
    { name: "Yash B.", year: "3rd year, CS", skills: ["ML engineer", "Full-stack dev"], interests: ["AI / ML", "HealthTech"], looking: "Technical co-founder, AI-first" },
  ],

  opportunities: [
    { id: "o1", title: "Founder's Office Intern", org: "Early-stage SaaS (sample)", type: "Internship", mode: "Remote", duration: "3 months", stipend: "Paid", tags: ["Strategy", "Ops"], deadline: "2026-12-05" },
    { id: "o2", title: "Frontend Developer (part-time)", org: "Ledgerly (campus startup)", type: "Campus startup", mode: "On campus", duration: "Ongoing", stipend: "Equity", tags: ["React", "UI"], deadline: "2026-12-10" },
    { id: "o3", title: "Market Research Project", org: "D2C brand (sample)", type: "Project", mode: "Remote", duration: "4 weeks", stipend: "Certificate + stipend", tags: ["Research", "Excel"], deadline: "2026-11-30" },
    { id: "o4", title: "Business Development Associate", org: "Climate startup (sample)", type: "Internship", mode: "Hybrid", duration: "2 months", stipend: "Paid", tags: ["Sales", "Outreach"], deadline: "2026-12-15" },
    { id: "o5", title: "ML Research Collaborator", org: "KrishiLens (campus startup)", type: "Campus startup", mode: "On campus", duration: "Ongoing", stipend: "Equity", tags: ["CV", "PyTorch"], deadline: "2026-12-20" },
    { id: "o6", title: "Content & Community Intern", org: "EdTech startup (sample)", type: "Internship", mode: "Remote", duration: "3 months", stipend: "Paid", tags: ["Writing", "Social"], deadline: "2027-01-05" },
  ],

  events: [
    { id: "e1", title: "Co-founder Matchmaking: Pitch Night", date: "2026-12-04", time: "7:00 PM", venue: "To be announced", type: "Pitching", upcoming: true,
      desc: "Founders who filled the matchmaking form pitch their ideas in 3 minutes. Builders listen, ask questions and connect with the teams they want to join." },
    { id: "e2", title: "Workshop: Validate Before You Build", date: "2026-12-11", time: "6:00 PM", venue: "To be announced", type: "Workshop", upcoming: true,
      desc: "Problem interviews, landing-page tests and pre-sales: how to know people want it before you write a line of code." },
    { id: "e3", title: "Founder Fireside: Building From a Hostel Room", date: "2027-01-15", time: "7:30 PM", venue: "To be announced", type: "Founder talk", upcoming: true,
      desc: "An open conversation with a BITS alum founder about co-founders, first customers and the hard parts nobody talks about." },
    { id: "e4", title: "Community Meet: Idea Jam", date: "2027-01-22", time: "6:30 PM", venue: "To be announced", type: "Community", upcoming: true,
      desc: "Bring an idea, a problem or just curiosity. Small circles, fast feedback, new people." },
    { id: "e5", title: "FBC First Meetup", date: "2026-10-03", time: "6:00 PM", venue: "BITS Pilani", type: "Community", upcoming: false,
      desc: "Where it started: why FBC exists, the co-founder problem, and what we want to build together." },
    { id: "e6", title: "Co-founder Matchmaking Launch", date: "2026-10-26", time: "", venue: "Online", type: "Launch", upcoming: false,
      desc: "Matchmaking form opened for founders looking for co-founders across campus." },
  ],

  posts: [
    { id: "p1", cat: "Startup Story", title: "How one campus startup found its first 100 users without a marketing budget", letter: "S",
      excerpt: "A breakdown of the scrappy, unscalable things that actually worked, and the two that wasted a month.", author: "FBC Research Team", date: "2026-11-18", read: "7 min", featured: true },
    { id: "p2", cat: "Failure Files", title: "Why most student startups die at the team stage, not the idea stage", letter: "F",
      excerpt: "Co-founder mismatch, unclear commitment and the equity talk nobody wants to have.", author: "FBC Research Team", date: "2026-11-10", read: "6 min" },
    { id: "p3", cat: "Analysis", title: "TAM, SAM, SOM without the hand-waving", letter: "A",
      excerpt: "A practical way to size your market that won't make a judge roll their eyes.", author: "FBC Research Team", date: "2026-11-02", read: "5 min" },
    { id: "p4", cat: "Newsletter", title: "The Builder's Brief #01: what we're reading, watching and building", letter: "N",
      excerpt: "Our first newsletter: three founder interviews, one framework, and what's coming up at FBC.", author: "FBC", date: "2026-10-28", read: "4 min" },
    { id: "p5", cat: "Analysis", title: "Unit economics for people who hate spreadsheets", letter: "U",
      excerpt: "CAC, LTV and contribution margin explained with a chai stall.", author: "FBC Research Team", date: "2026-10-20", read: "8 min" },
    { id: "p6", cat: "Startup Story", title: "Be open about your idea: why stealth mode hurts student founders", letter: "O",
      excerpt: "People can only join you if they know what you're building. Execution matters most.", author: "Nitish Rathi", date: "2026-10-12", read: "4 min" },
  ],

  resources: [
    { cat: "Guides", items: [
      { t: "Startup 101: the vocabulary", d: "MVP, PMF, runway, cap table, every term you'll hear in your first month." },
      { t: "Finding a co-founder", d: "What to look for, what to ask, and how to test working together before committing." },
      { t: "Problem interviews playbook", d: "Questions that get honest answers instead of polite lies." },
    ]},
    { cat: "Templates", items: [
      { t: "Pitch deck template", d: "The 10-slide structure, styled in FBC black and gold." },
      { t: "Lean canvas", d: "One-page business model you can fill in under an hour." },
      { t: "Co-founder agreement checklist", d: "Roles, equity, vesting, and what happens if someone leaves." },
    ]},
    { cat: "Books & Podcasts", items: [
      { t: "The Mom Test", d: "How to talk to customers and learn whether your idea is good." },
      { t: "Zero to One", d: "Notes on building something new instead of copying." },
      { t: "Founder interview podcasts", d: "A curated list from the Research & Knowledge team." },
    ]},
    { cat: "Tools", items: [
      { t: "VistaDex", d: "Validate your idea before you build it. Featured tool.", featured: true },
      { t: "No-code MVP stack", d: "Build a working prototype in a weekend." },
      { t: "Free credits for students", d: "Cloud, design and dev tools with student programs." },
    ]},
  ],

  roadmap: [
    { phase: "Phase 0", title: "The spark", when: "Sep 2026", status: "done", items: ["Community invitation and join form", "WhatsApp community launched", "First meetup with 3 core members"] },
    { phase: "Phase 1", title: "Matchmaking v1", when: "Oct–Nov 2026", status: "done", items: ["Co-founder matchmaking form", "Founder profiles shared with the community"] },
    { phase: "Phase 2", title: "Pitch & platform", when: "Dec 2026", status: "now", items: ["Pitch Night for matchmaking founders", "This website: profiles, matchmaking, opportunities", "Recruit more core members"] },
    { phase: "Phase 3", title: "Learn & publish", when: "Jan–Mar 2027", status: "next", items: ["Workshop series (validation, finance, fundraising)", "Startup Stories newsletter, bi-weekly", "Founder fireside sessions"] },
    { phase: "Phase 4", title: "Build & grow", when: "Apr–Jun 2027", status: "next", items: ["Startup-building challenge", "Internal demo day with external evaluators", "Startup opportunity partnerships"] },
    { phase: "Phase 5", title: "Beyond campus", when: "2027–28", status: "next", items: ["Flagship annual entrepreneurship event", "Collaboration across BITS campuses", "Incubator and investor network"] },
  ],

  team: [
    { name: "Nitish Rathi", role: "Founder", initials: "NR" },
    { name: "Nakul Nandwana", role: "Core member", initials: "NN" },
    { name: "Devansh Garg", role: "Core member", initials: "DG" },
  ],
};
