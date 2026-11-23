/* The one data API the whole app uses. Business rules (what a profile, application or RSVP
   looks like) live here; storage lives in the adapters. Swap adapters in config.ts. */
import { BACKEND } from "../config";
import { SEED } from "../content";
import { now, type Adapter, type AuthUser, type Doc } from "./adapter";
import { demoAdapter } from "./demo";
import { firebaseAdapter } from "./firebase";

export type { Doc, AuthUser } from "./adapter";

let engine: Adapter | null = null;
const e = (): Adapter => {
  if (!engine) engine = BACKEND === "firebase" ? firebaseAdapter() : demoAdapter();
  return engine;
};
let ready: Promise<void> | null = null;

const SEEDABLE = ["events", "opportunities", "posts", "resources"] as const;
const LIMITS: Record<string, number> = { name: 80, year: 60, bio: 200, linkedin: 200, work: 800, vname: 80, vpitch: 250, vproblem: 800, commit: 60 };

export interface Me { uid: string; email: string; name?: string; year?: string; skills?: string[] }

export const db = {
  get mode() { return e().mode; },
  /** idempotent; safe to call from many components */
  init: () => (ready ||= e().init()),
  onAuth: (cb: (u: AuthUser | null) => void) => e().onAuth(cb),
  user: () => e().currentUser(),
  signIn: (opts?: { name?: string; email?: string }) => e().signIn(opts),
  signOut: () => e().signOut(),
  reset: () => e().reset(),

  getSettings: () => e().getSettings(),
  saveSettings: (s: Record<string, unknown>) => e().saveSettings({ ...s, updatedAt: now() } as never),

  list: (c: string, opts?: { all?: boolean; where?: [string, unknown] }) => e().list(c, opts),
  get: (c: string, id: string) => e().get(c, id),

  /* ---------- profiles ---------- */
  getProfile: (uid: string) => e().get("users", uid),
  async saveProfile(uid: string, data: Record<string, unknown>): Promise<Doc> {
    const u = e().currentUser()!;
    const profile: Record<string, unknown> = { ...data, email: u.email, updatedAt: now() };
    delete profile.id;
    // Trim to the limits enforced in firestore.rules (AI-imported text can run long).
    for (const [k, max] of Object.entries(LIMITS)) if (typeof profile[k] === "string") profile[k] = (profile[k] as string).slice(0, max);
    for (const k of ["skills", "needs", "domains"]) if (Array.isArray(profile[k])) profile[k] = (profile[k] as string[]).slice(0, 10);
    if (!["founder", "builder", "explorer"].includes(profile.role as string)) profile.role = "builder";
    if (!(await e().get("users", uid))) profile.createdAt = now();
    await e().set("users", uid, profile);
    // Founders: keep their public venture listing in sync with their profile.
    if (profile.role === "founder" && profile.vname) {
      const v = await e().get("ventures", uid);
      await e().set("ventures", uid, {
        founderUid: uid, founderName: profile.name, founderYear: profile.year || "",
        name: profile.vname, stage: Number(profile.vstage) || 0, pitch: profile.vpitch || "", problem: profile.vproblem || "",
        domains: profile.domains || [], needs: profile.needs || [], commitment: profile.commit || "", equity: profile.equity || "",
        pitchNight: !!profile.pitchnight,
        status: v?.status || "live", createdAt: v?.createdAt || now(), updatedAt: now(),
      });
    }
    return { ...profile, id: uid } as Doc;
  },
  members: (role?: string) => e().list("users", role ? { where: ["role", role] } : {}),
  myVenture: (uid: string) => e().get("ventures", uid),
  setVentureStatus: (uid: string, status: string) => e().set("ventures", uid, { status, updatedAt: now() }),

  /* ---------- applications ---------- */
  async apply(venture: Doc, message: string, me: Me) {
    const id = `${venture.id}_${me.uid}`;
    await e().set("applications", id, {
      ventureId: venture.id, ventureName: venture.name, founderUid: venture.founderUid,
      applicantUid: me.uid, applicantName: me.name || "", applicantEmail: me.email, applicantYear: me.year || "",
      applicantSkills: me.skills || [], message: String(message).slice(0, 2000), status: "new", createdAt: now(),
    }, { merge: false });
    return id;
  },
  myApplications: (uid: string) => e().list("applications", { where: ["applicantUid", uid] }),
  applicationsToMe: (uid: string) => e().list("applications", { where: ["founderUid", uid] }),
  setApplicationStatus: (id: string, status: string) => e().set("applications", id, { status, updatedAt: now() }),
  withdrawApplication: (id: string) => e().remove("applications", id),

  /* ---------- events ---------- */
  async rsvp(eventId: string, me: Me, on: boolean) {
    if (on) {
      await e().set(`events/${eventId}/rsvps`, me.uid, { uid: me.uid, name: me.name || "", email: me.email, createdAt: now() }, { merge: false });
      await e().set(`users/${me.uid}/rsvps`, eventId, { eventId, createdAt: now() }, { merge: false });
    } else {
      await e().remove(`events/${eventId}/rsvps`, me.uid);
      await e().remove(`users/${me.uid}/rsvps`, eventId);
    }
  },
  async myRsvps(uid: string) { return (await e().list(`users/${uid}/rsvps`, { all: true })).map((r) => r.id); },
  eventRsvps: (eventId: string) => e().list(`events/${eventId}/rsvps`, { all: true }),

  /* ---------- messages and idea checks ---------- */
  sendMessage: (m: { type: string; name?: string; email?: string; body?: string; extra?: string }) => e().set("messages", null, {
    type: m.type, name: String(m.name || "").slice(0, 120), email: String(m.email || "").slice(0, 200),
    body: String(m.body || "").slice(0, 4000), extra: String(m.extra || "").slice(0, 200), createdAt: now(),
  }),
  saveIdeaCheck: (uid: string, check: Record<string, unknown>) => e().set("ideaChecks", null, { uid, ...check, createdAt: now() }),
  myIdeaChecks: (uid: string) => e().list("ideaChecks", { where: ["uid", uid] }),

  /* ---------- admin ---------- */
  isAdmin: (email: string) => e().isAdmin(email),
  listAdmins: () => e().listAdmins(),
  setAdmin: (email: string, on: boolean) => e().setAdmin(email, on),
  adminList: (c: string) => e().list(c, { all: true }),
  adminSave: (c: string, id: string | null, data: Record<string, unknown>) => e().set(c, id, { ...data, updatedAt: now() }),
  adminDelete: (c: string, id: string) => e().remove(c, id),
  async seed() {
    let n = 0;
    for (const c of SEEDABLE) {
      for (const d of SEED[c]) {
        if (!(await e().get(c, d.id))) { await e().set(c, d.id, { ...d, createdAt: now() }, { merge: false }); n++; }
      }
    }
    return n;
  },
};
