/* ==========================================================
   AI-assisted profile import
   The member copies a prompt into their own chatbot, then pastes
   the reply back. Everything runs in the browser.
   ========================================================== */
import { DOMAINS, SKILLS, STAGES, AVAIL, EQUITY, LOOKING } from "./content.js?v=202611230611";

export const isFounder = (u) => u?.role === "founder";
export const roleName = (u) => (isFounder(u) ? "Founder" : u?.role === "builder" ? "Builder" : "Explorer");

const template = (u) => isFounder(u)
  ? { name: "", year_and_branch: "", one_line_bio: "", linkedin: "", availability: "", venture_name: "", stage: "", problem: "", one_line_pitch: "", domains: [], skills_needed: [], commitment: "", equity: "" }
  : { name: "", year_and_branch: "", one_line_bio: "", linkedin: "", availability: "", skills: [], past_work: "", domains: [], looking_for: "" };

export function aiPrompt(u) {
  const founder = isFounder(u);
  const lists = founder
    ? [["availability", AVAIL], ["stage", STAGES], ["domains (pick 1–3)", DOMAINS], ["skills_needed (pick 1–4)", SKILLS], ["equity", EQUITY]]
    : [["availability", AVAIL], ["skills (pick 1–5)", SKILLS], ["domains (pick 1–4)", DOMAINS], ["looking_for", LOOKING]];
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
${JSON.stringify(template(u), null, 2)}
\`\`\``;
}

// A deliberately messy reply, so people can try the import without a chatbot.
export function aiSample(u) {
  const name = (u?.name || "Your Name").replace(/"/g, "");
  return isFounder(u)
    ? `Sure! Based on what we've discussed, here's your FBC profile:

\`\`\`json
{
  "name": "${name}",
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
  "name": "${name}",
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
}

/* ---------- reading the reply ---------- */
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
  if (typeof val === "number" && STAGES[val]) return val;
  const n = norm(val);
  if (!n) return null;
  const exact = STAGES.findIndex((s) => norm(s) === n);
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
export const FIELD_LABEL = { name: "Full name", year: "Year & branch", bio: "Bio", linkedin: "LinkedIn", avail: "Availability", vname: "Venture name", vstage: "Stage", vproblem: "Problem", vpitch: "Pitch", domains: "Domains", needs: "Skills needed", commit: "Commitment", equity: "Equity", skills: "Skills", work: "Past work", looking: "Looking for" };

export function parseAiReply(text, u) {
  const obj = extractJSON(text);
  const flat = {};
  const walk = (o) => Object.entries(o || {}).forEach(([k, v]) => {
    if (v && typeof v === "object" && !Array.isArray(v)) walk(v); else flat[norm(k)] = v;
  });
  walk(obj);
  const get = (key) => { for (const a of ALIASES[key]) if (flat[a] !== undefined) return flat[a]; return undefined; };
  const str = (v) => (Array.isArray(v) ? v.join(", ") : String(v ?? "")).trim().slice(0, 600);
  const keys = isFounder(u)
    ? ["name", "year", "bio", "linkedin", "avail", "vname", "vstage", "vproblem", "vpitch", "domains", "needs", "commit", "equity"]
    : ["name", "year", "bio", "linkedin", "avail", "skills", "work", "domains", "looking"];
  const out = {}, ai = [], blank = [], unmatched = [];
  keys.forEach((k) => {
    const v = get(k);
    let val = null;
    if (k === "domains" || k === "needs" || k === "skills") {
      const { hits, misses } = matchList(v, k === "domains" ? DOMAINS : SKILLS);
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
}
